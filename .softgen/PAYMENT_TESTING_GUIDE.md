# Complete Escrow Payment Testing Guide

## Quick Start (2 minutes)

### 1. System Validation
```bash
curl http://localhost:3000/api/escrow/validate
```

**Expected:** All checks should return `true`

### 2. Full Cycle Test
```bash
curl -X POST http://localhost:3000/api/test-full-cycle
```

**Expected:** Complete payment flow from create → capture → release

---

## Manual Testing Flow

### Prerequisites
- At least one contract in "accepted" status
- Provider has completed Stripe Connect onboarding (`stripe_account_id` populated)
- Stripe test keys configured in `.env.local`

### Test Card Numbers (Stripe Test Mode)
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`
- Expiry: Any future date
- CVC: Any 3 digits

---

## Step-by-Step Manual Test

### Step 1: Find Test Contract

```sql
SELECT 
  c.id,
  c.final_amount,
  c.status,
  client.full_name as client,
  provider.full_name as provider,
  provider.stripe_account_id
FROM contracts c
JOIN profiles client ON c.client_id = client.id
JOIN profiles provider ON c.provider_id = provider.id
WHERE 
  c.status = 'accepted'
  AND provider.stripe_account_id IS NOT NULL
LIMIT 1;
```

Copy the `c.id` (contract ID).

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
  "payment": {
    "id": "uuid",
    "status": "pending_payment",
    "amount_nzd": 100.00,
    "platform_fee": 2.00,
    "payment_processing_fee": 2.95,
    "total_amount": 104.95
  }
}
```

Copy `clientSecret` and `paymentIntentId`.

**Verify in Database:**
```sql
SELECT * FROM payment_tracking WHERE contract_id = 'YOUR_CONTRACT_ID';
```

Expected:
- `status` = "pending_payment"
- `stripe_payment_intent_id` = populated
- `amount_nzd`, `platform_fee`, `payment_processing_fee` = correct values

### Step 3: Client Payment (Frontend)

In your browser console on the checkout page:

```javascript
const stripe = await loadStripe('pk_test_YOUR_KEY');
const result = await stripe.confirmCardPayment('CLIENT_SECRET_HERE', {
  payment_method: {
    card: cardElement, // Or manually: {number: '4242424242424242', exp_month: 12, exp_year: 2026, cvc: '123'}
    billing_details: { name: 'Test Client' }
  }
});

console.log(result.paymentIntent.id); // Copy this for next step
```

**Or simulate bot payment:**
```bash
curl -X POST http://localhost:3000/api/bot-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

### Step 4: Capture Payment (Hold in Escrow)

```bash
curl -X POST http://localhost:3000/api/escrow/capture \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "status": "captured",
    "stripe_charge_id": "ch_xxx",
    "captured_at": "2026-04-28T12:00:00Z"
  },
  "approvalDeadline": "2026-04-30T12:00:00Z"
}
```

**Verify in Database:**
```sql
SELECT 
  pt.status,
  pt.stripe_charge_id,
  pt.captured_at,
  c.payment_status,
  c.client_approval_deadline
FROM payment_tracking pt
JOIN contracts c ON c.id = pt.contract_id
WHERE pt.stripe_payment_intent_id = 'pi_xxx';
```

Expected:
- `pt.status` = "captured"
- `pt.stripe_charge_id` = populated
- `c.payment_status` = "held"
- `c.client_approval_deadline` = 48 hours from now

**Verify in Stripe Dashboard:**
- Go to: https://dashboard.stripe.com/test/payments
- Find payment intent `pi_xxx`
- Status should be "Succeeded"
- Amount should match total_amount

### Step 5: Release Payment to Provider

```bash
curl -X POST http://localhost:3000/api/escrow/release \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "YOUR_CONTRACT_ID",
    "releaseMethod": "client_approval"
  }'
```

**Release Methods:**
- `client_approval` - Client clicked "Approve Work"
- `auto_release` - 48 hours passed
- `admin_release` - Owner manual release

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "status": "released",
    "stripe_transfer_id": "tr_xxx",
    "release_method": "client_approval",
    "released_at": "2026-04-28T12:30:00Z"
  },
  "transferId": "tr_xxx"
}
```

**Verify in Database:**
```sql
SELECT 
  pt.status,
  pt.stripe_transfer_id,
  pt.release_method,
  pt.released_at,
  c.payment_status
FROM payment_tracking pt
JOIN contracts c ON c.id = pt.contract_id
WHERE c.id = 'YOUR_CONTRACT_ID';
```

Expected:
- `pt.status` = "released"
- `pt.stripe_transfer_id` = populated
- `c.payment_status` = "released"

**Verify in Stripe Dashboard:**
- Go to: https://dashboard.stripe.com/test/transfers
- Find transfer `tr_xxx`
- Amount = original amount × 0.98 (2% platform fee deducted)
- Destination = provider's Stripe account ID

**Verify Provider Received:**
```sql
SELECT 
  amount_nzd,
  (amount_nzd * 0.98) as provider_received,
  (amount_nzd * 0.02) as platform_fee_kept
FROM payment_tracking
WHERE contract_id = 'YOUR_CONTRACT_ID';
```

---

## Testing Refund Flow

### Find a Captured Payment

```sql
SELECT 
  c.id as contract_id,
  pt.stripe_payment_intent_id
FROM contracts c
JOIN payment_tracking pt ON pt.contract_id = c.id
WHERE pt.status = 'captured'
LIMIT 1;
```

### Refund the Payment

```bash
curl -X POST http://localhost:3000/api/escrow/refund \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "YOUR_CONTRACT_ID",
    "reason": "Test refund - client disputed work quality"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "status": "refunded",
    "refund_reason": "Test refund - client disputed work quality",
    "refunded_at": "2026-04-28T13:00:00Z"
  },
  "refundId": "re_xxx"
}
```

**Verify:**
```sql
SELECT status, refund_reason FROM payment_tracking WHERE contract_id = 'YOUR_CONTRACT_ID';
```

Expected:
- `status` = "refunded"
- `refund_reason` = populated

**Verify in Stripe Dashboard:**
- Full amount refunded to client (including all fees)

---

## Error Scenarios to Test

### 1. Payment Not Found
```bash
curl -X POST http://localhost:3000/api/escrow/capture \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_fake_id"}'
```
Expected: 500 error

### 2. Provider Without Stripe Account
Create contract with provider who hasn't connected Stripe, then try to release.
Expected: "Provider does not have a connected Stripe account"

### 3. Double Capture Attempt
Capture payment twice with same `paymentIntentId`.
Expected: Error on second attempt

### 4. Release Without Capture
Try to release a payment still in "pending_payment" status.
Expected: "Payment not found or not captured"

---

## Database Verification Queries

### All Payments
```sql
SELECT 
  pt.id,
  pt.status,
  pt.amount_nzd,
  pt.created_at,
  pt.released_at,
  client.full_name as client,
  provider.full_name as provider
FROM payment_tracking pt
JOIN profiles client ON pt.client_id = client.id
JOIN profiles provider ON pt.provider_id = provider.id
ORDER BY pt.created_at DESC
LIMIT 20;
```

### Payment Status Distribution
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount_nzd) as total_amount
FROM payment_tracking
GROUP BY status;
```

### Platform Revenue (2% fee)
```sql
SELECT 
  SUM(platform_fee) as total_platform_fees,
  COUNT(*) as completed_payments
FROM payment_tracking
WHERE status = 'released';
```

---

## Success Criteria

✅ System validation passes all checks
✅ Payment created with correct amounts
✅ Client can pay via test card
✅ Payment captured and held in escrow
✅ 48-hour approval deadline set correctly
✅ Payment released transfers to provider
✅ Provider receives 98% of contract amount
✅ Platform keeps 2% fee
✅ Refund returns full amount to client
✅ All database records consistent
✅ No errors in console logs
✅ Stripe Dashboard shows all operations

---

## Quick Commands Summary

```bash
# Validate system
curl http://localhost:3000/api/escrow/validate

# Full cycle test
curl -X POST http://localhost:3000/api/test-full-cycle

# Create payment
curl -X POST http://localhost:3000/api/escrow/create \
  -H "Content-Type: application/json" \
  -d '{"contractId": "uuid"}'

# Bot payment simulation
curl -X POST http://localhost:3000/api/bot-payment \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_xxx"}'

# Capture payment
curl -X POST http://localhost:3000/api/escrow/capture \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_xxx"}'

# Release payment
curl -X POST http://localhost:3000/api/escrow/release \
  -H "Content-Type: application/json" \
  -d '{"contractId": "uuid", "releaseMethod": "client_approval"}'

# Refund payment
curl -X POST http://localhost:3000/api/escrow/refund \
  -H "Content-Type: application/json" \
  -d '{"contractId": "uuid", "reason": "Dispute"}'
```