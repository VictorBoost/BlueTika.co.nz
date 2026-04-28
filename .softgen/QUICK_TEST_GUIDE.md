# Quick Escrow System Test Guide

## 1. System Validation (1 minute)

**Check system readiness:**
```bash
curl http://localhost:3000/api/escrow/validate
```

**Expected Response:**
```json
{
  "ready": true,
  "checks": {
    "stripe_keys": true,
    "supabase_connection": true,
    "payment_tracking_table": true,
    "contracts_table": true,
    "profiles_table": true
  },
  "timestamp": "2026-04-28T12:00:00Z"
}
```

If any check is `false`, see errors array for details.

---

## 2. Quick Manual Test (5 minutes)

### Prerequisites:
- One test contract in "accepted" status
- Provider has completed Stripe Connect onboarding
- Client account ready to pay

### Step A: Create Escrow Payment

```bash
curl -X POST http://localhost:3000/api/escrow/create \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "YOUR_CONTRACT_UUID"
  }'
```

**Copy the `clientSecret` from response**

### Step B: Simulate Client Payment

Open browser console on payment page:
```javascript
const stripe = await loadStripe('pk_test_...');
const result = await stripe.confirmCardPayment('CLIENT_SECRET_HERE', {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Test Client' }
  }
});
console.log(result.paymentIntent.id); // Copy this
```

Use test card: `4242 4242 4242 4242`, any future expiry, any CVC.

### Step C: Capture Payment (Hold in Escrow)

```bash
curl -X POST http://localhost:3000/api/escrow/capture \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

**Verify:** Contract status should be "held", 48-hour deadline set.

### Step D: Release Payment to Provider

```bash
curl -X POST http://localhost:3000/api/escrow/release \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "YOUR_CONTRACT_UUID",
    "releaseMethod": "client_approval"
  }'
```

**Verify:** 
- Stripe Dashboard shows transfer to provider
- Provider received 98% of contract amount (2% platform fee)
- Contract status is "released"

---

## 3. Database Verification

```sql
-- Check payment record
SELECT 
  id,
  status,
  amount_nzd,
  platform_fee,
  payment_processing_fee,
  stripe_payment_intent_id,
  stripe_transfer_id,
  created_at,
  released_at
FROM payment_tracking 
WHERE contract_id = 'YOUR_CONTRACT_UUID';

-- Expected result:
-- status: "released"
-- platform_fee: 2% of amount_nzd
-- stripe_transfer_id: "tr_xxx" (populated)
-- released_at: timestamp (not null)
```

---

## 4. Stripe Dashboard Verification

**Go to:** https://dashboard.stripe.com/test/payments

**Check:**
1. Payment Intents → Find your `pi_xxx` → Status: "Succeeded"
2. Transfers → Find `tr_xxx` → Amount: 98% of original
3. Connected Accounts → Provider account → Balance increased

---

## 5. Test Refund Flow (Optional)

**Create another test contract, repeat Steps A-C, then:**

```bash
curl -X POST http://localhost:3000/api/escrow/refund \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "YOUR_CONTRACT_UUID",
    "reason": "Test refund - client dispute"
  }'
```

**Verify:**
- `payment_tracking.status` = "refunded"
- `contract.status` = "cancelled"
- Stripe Dashboard shows full refund processed
- Client received money back

---

## Common Issues

### ❌ "Provider does not have a connected Stripe account"
**Fix:** Provider must complete Stripe Connect onboarding first.
**Check:** `SELECT stripe_account_id FROM profiles WHERE id = 'provider_id';`

### ❌ "Payment intent cannot be captured"
**Fix:** Client must pay first via Stripe Elements (Step B).
**Check:** Stripe Dashboard → Payment Intent status

### ❌ "Payment not found or not captured"
**Fix:** Payment must be in "captured" status to release/refund.
**Check:** `SELECT status FROM payment_tracking WHERE contract_id = 'xxx';`

### ❌ Missing Stripe keys
**Fix:** Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Success Indicators

✅ All validation checks pass
✅ Payment created and client secret returned
✅ Client payment succeeds in Stripe
✅ Funds held in escrow (captured status)
✅ Release creates transfer to provider
✅ Provider receives 98% of contract amount
✅ No errors in console logs
✅ Email notifications sent (check `email_logs` table)

**Total test time:** ~5 minutes for full happy path flow.