<![CDATA[
# Bot Escrow Testing Guide

## Testing Escrow with Bot System

BlueTika has automated bot users that create projects, submit bids, and complete contracts. This guide shows how to test the escrow system using bots for rapid iteration.

## Bot Payment Flow

```
Bot Client accepts Bot Provider's bid
    ↓
Escrow payment created (pending_payment)
    ↓
Bot makes payment via test card
    ↓
Payment captured (held in escrow)
    ↓
Bot provider completes work
    ↓
Bot client approves work
    ↓
Payment released to bot provider
```

## Prerequisites

1. **Bot accounts exist** (`user_type = 'bot'`)
2. **Bot providers have Stripe Connect accounts**
3. **Bot projects and bids active**

## Quick Bot Test (5 minutes)

### Step 1: Find Active Bot Contract

```sql
SELECT 
  c.id as contract_id,
  c.status,
  c.final_amount,
  client.full_name as client_name,
  provider.full_name as provider_name,
  provider.stripe_account_id
FROM contracts c
JOIN profiles client ON c.client_id = client.id
JOIN profiles provider ON c.provider_id = provider.id
WHERE 
  client.user_type = 'bot'
  AND provider.user_type = 'bot'
  AND c.status = 'accepted'
  AND provider.stripe_account_id IS NOT NULL
LIMIT 1;
```

Copy the `contract_id` and `provider.stripe_account_id`.

### Step 2: Create Escrow Payment

```bash
curl -X POST http://localhost:3000/api/escrow/create \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "PASTE_CONTRACT_ID_HERE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx",
  "payment": { ... },
  "totalAmount": 104.95
}
```

Copy the `paymentIntentId`.

### Step 3: Simulate Bot Payment

**Option A: API Endpoint (Recommended for Bots)**

Create this test endpoint:

```typescript
// src/pages/api/bot-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId } = req.body;

    // Confirm payment with test card
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa", // Stripe test payment method
      return_url: "https://bluetika.co.nz/contracts",
    });

    return res.status(200).json({
      success: true,
      paymentIntent,
    });
  } catch (error) {
    console.error("Bot payment error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    });
  }
}
```

Then call it:

```bash
curl -X POST http://localhost:3000/api/bot-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

**Option B: Manual via Stripe CLI**

```bash
stripe payment_intents confirm pi_xxx \
  --payment-method=pm_card_visa
```

### Step 4: Capture Payment

```bash
curl -X POST http://localhost:3000/api/escrow/capture \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

**Verify in database:**
```sql
SELECT 
  pt.status,
  pt.captured_at,
  c.payment_status,
  c.client_approval_deadline
FROM payment_tracking pt
JOIN contracts c ON c.id = pt.contract_id
WHERE pt.stripe_payment_intent_id = 'pi_xxx';
```

Expected:
- `pt.status` = "captured"
- `c.payment_status` = "held"
- `c.client_approval_deadline` set to +48 hours

### Step 5: Release Payment

```bash
curl -X POST http://localhost:3000/api/escrow/release \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "PASTE_CONTRACT_ID_HERE",
    "releaseMethod": "client_approval"
  }'
```

**Verify:**
```sql
SELECT 
  pt.status,
  pt.stripe_transfer_id,
  pt.released_at,
  c.payment_status
FROM payment_tracking pt
JOIN contracts c ON c.id = pt.contract_id
WHERE c.id = 'PASTE_CONTRACT_ID_HERE';
```

Expected:
- `pt.status` = "released"
- `pt.stripe_transfer_id` populated
- `c.payment_status` = "released"

Check Stripe Dashboard → Transfers to see funds moved to provider.

## Automated Bot Escrow Flow

### Full Cycle Script

Create this endpoint for complete bot flow testing:

```typescript
// src/pages/api/test-full-cycle.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const log: string[] = [];

  try {
    // 1. Find bot contract
    log.push("Step 1: Finding bot contract...");
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        client:profiles!contracts_client_id_fkey(user_type, full_name),
        provider:profiles!contracts_provider_id_fkey(user_type, full_name, stripe_account_id)
      `)
      .eq("status", "accepted")
      .not("provider.stripe_account_id", "is", null)
      .limit(1)
      .single();

    if (contractError || !contract) {
      throw new Error("No suitable bot contract found");
    }

    log.push(`✓ Found contract: ${contract.id}`);

    // 2. Create escrow payment
    log.push("Step 2: Creating escrow payment...");
    const createResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/escrow/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: contract.id }),
    });
    const createResult = await createResponse.json();
    if (!createResult.success) throw new Error(createResult.error);

    log.push(`✓ Payment created: ${createResult.paymentIntentId}`);

    // 3. Simulate bot payment
    log.push("Step 3: Bot making payment...");
    const paymentIntent = await stripe.paymentIntents.confirm(
      createResult.paymentIntentId,
      {
        payment_method: "pm_card_visa",
        return_url: "https://bluetika.co.nz/contracts",
      }
    );

    log.push(`✓ Payment confirmed: ${paymentIntent.status}`);

    // 4. Capture payment
    log.push("Step 4: Capturing payment...");
    const captureResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/escrow/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: createResult.paymentIntentId }),
    });
    const captureResult = await captureResponse.json();
    if (!captureResult.success) throw new Error(captureResult.error);

    log.push(`✓ Payment captured and held in escrow`);

    // 5. Wait 2 seconds (simulate work completion)
    log.push("Step 5: Simulating work completion (2s)...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 6. Release payment
    log.push("Step 6: Releasing payment to provider...");
    const releaseResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/escrow/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId: contract.id,
        releaseMethod: "client_approval",
      }),
    });
    const releaseResult = await releaseResponse.json();
    if (!releaseResult.success) throw new Error(releaseResult.error);

    log.push(`✓ Payment released: ${releaseResult.transferId}`);

    // 7. Verify final state
    log.push("Step 7: Verifying final state...");
    const { data: finalPayment } = await supabase
      .from("payment_tracking")
      .select("*")
      .eq("contract_id", contract.id)
      .single();

    log.push(`✓ Final payment status: ${finalPayment?.status}`);
    log.push(`✓ Transfer ID: ${finalPayment?.stripe_transfer_id}`);

    return res.status(200).json({
      success: true,
      log,
      contractId: contract.id,
      paymentIntentId: createResult.paymentIntentId,
      transferId: releaseResult.transferId,
    });
  } catch (error) {
    log.push(`✗ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return res.status(500).json({
      success: false,
      log,
      error: error instanceof Error ? error.message : "Test failed",
    });
  }
}
```

Run the full test:

```bash
curl -X POST http://localhost:3000/api/test-full-cycle
```

**Expected Output:**
```json
{
  "success": true,
  "log": [
    "Step 1: Finding bot contract...",
    "✓ Found contract: uuid-xxx",
    "Step 2: Creating escrow payment...",
    "✓ Payment created: pi_xxx",
    "Step 3: Bot making payment...",
    "✓ Payment confirmed: requires_capture",
    "Step 4: Capturing payment...",
    "✓ Payment captured and held in escrow",
    "Step 5: Simulating work completion (2s)...",
    "Step 6: Releasing payment to provider...",
    "✓ Payment released: tr_xxx",
    "Step 7: Verifying final state...",
    "✓ Final payment status: released",
    "✓ Transfer ID: tr_xxx"
  ],
  "contractId": "uuid-xxx",
  "paymentIntentId": "pi_xxx",
  "transferId": "tr_xxx"
}
```

## Integration with Existing Bot System

### Update Bot Automation to Include Payments

**File:** Existing bot Edge Functions

Add payment steps to bot contract completion:

```typescript
// After bot accepts bid
const createEscrowResponse = await fetch(`${SITE_URL}/api/escrow/create`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contractId: contract.id }),
});

const { paymentIntentId } = await createEscrowResponse.json();

// Bot makes payment
const stripe = new Stripe(STRIPE_KEY);
await stripe.paymentIntents.confirm(paymentIntentId, {
  payment_method: "pm_card_visa",
});

// Capture payment
await fetch(`${SITE_URL}/api/escrow/capture`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentIntentId }),
});

// Later: Bot completes work and approves
await fetch(`${SITE_URL}/api/escrow/release`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contractId: contract.id,
    releaseMethod: "client_approval",
  }),
});
```

## Monitoring Bot Payments

```sql
-- All bot payments today
SELECT 
  pt.id,
  pt.status,
  pt.amount_nzd,
  pt.created_at,
  client.full_name as client,
  provider.full_name as provider
FROM payment_tracking pt
JOIN profiles client ON pt.client_id = client.id
JOIN profiles provider ON pt.provider_id = provider.id
WHERE 
  client.user_type = 'bot'
  AND provider.user_type = 'bot'
  AND pt.created_at > NOW() - INTERVAL '1 day'
ORDER BY pt.created_at DESC;

-- Bot payment success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(amount_nzd), 2) as avg_amount
FROM payment_tracking pt
JOIN profiles client ON pt.client_id = client.id
WHERE client.user_type = 'bot'
GROUP BY status;
```

## Success Metrics

✅ Bot can create escrow payment
✅ Bot payment confirmed via Stripe test card
✅ Payment captured and held correctly
✅ Bot provider receives 98% of contract amount
✅ No errors in payment flow
✅ Full cycle completes in <10 seconds

This allows rapid testing of the escrow system without manual intervention!
</file_contents>
