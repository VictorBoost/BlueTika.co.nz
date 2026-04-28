# BlueTika Escrow Payment Testing Guide

## System Overview

The escrow system provides secure payment handling with these guarantees:
- ✅ Funds are held until client approves work
- ✅ Automatic release after 48 hours if no approval
- ✅ Full refund capability for disputes
- ✅ Immutable audit trail in `payment_tracking` table
- ✅ Provider payments via Stripe Connected Accounts

## Architecture

```
Client Accepts Bid
    ↓
[API] /api/escrow/create
    ↓
Stripe PaymentIntent created (manual capture)
payment_tracking record created (status: pending_payment)
    ↓
Client Pays via Stripe Elements
    ↓
[API] /api/escrow/capture
    ↓
Stripe captures funds (holds in escrow)
payment_tracking updated (status: captured)
contract updated (payment_status: held)
    ↓
48-hour approval window starts
    ↓
Client Approves OR Auto-Release Triggers
    ↓
[API] /api/escrow/release
    ↓
Stripe transfers to provider (minus 2% platform fee)
payment_tracking updated (status: released)
contract updated (payment_status: released)
```

## Testing Flow (Stripe Test Mode)

### Prerequisites

1. **Stripe Test Keys** in `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

2. **Test Card Numbers**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires Authentication: `4000 0025 0000 3155`

3. **Provider Stripe Connected Account**:
   - Provider must complete Stripe Connect onboarding
   - Check `profiles.stripe_account_id` is populated

### Step 1: Create Escrow Payment

**Endpoint:** `POST /api/escrow/create`

**Request Body:**
```json
{
  "contractId": "uuid-of-accepted-contract"
}
```

**Expected Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx",
  "payment": {
    "id": "uuid",
    "contract_id": "uuid",
    "status": "pending_payment",
    "amount_nzd": 100.00,
    "platform_fee": 2.00,
    "payment_processing_fee": 2.95,
    "total_amount": 104.95
  },
  "totalAmount": 104.95,
  "platformFee": 2.00,
  "paymentProcessingFee": 2.95
}
```

**Verify:**
- ✅ `payment_tracking` record created
- ✅ `contract.stripe_payment_intent_id` populated
- ✅ `contract.payment_status` = "pending"

### Step 2: Client Pays (via Frontend)

Use Stripe Elements with the `clientSecret` from Step 1.

**Test in Browser Console:**
```javascript
// Assuming Stripe Elements is loaded
const stripe = await loadStripe('pk_test_...');
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Test User' }
  }
});

if (result.error) {
  console.error(result.error.message);
} else {
  console.log('Payment successful:', result.paymentIntent.id);
}
```

### Step 3: Capture Payment (Hold in Escrow)

**Endpoint:** `POST /api/escrow/capture`

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx"
}
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

**Verify:**
- ✅ `payment_tracking.status` = "captured"
- ✅ `payment_tracking.stripe_charge_id` populated
- ✅ `contract.payment_status` = "held"
- ✅ `contract.client_approval_deadline` set to +48 hours
- ✅ Stripe Dashboard shows payment captured (not yet transferred)

### Step 4: Release Payment to Provider

**Endpoint:** `POST /api/escrow/release`

**Request Body:**
```json
{
  "contractId": "uuid-of-contract",
  "releaseMethod": "client_approval"
}
```

**Release Methods:**
- `client_approval` - Client clicked "Approve Work"
- `auto_release` - 48 hours passed, auto-released
- `admin_release` - Owner manually released

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

**Verify:**
- ✅ `payment_tracking.status` = "released"
- ✅ `payment_tracking.stripe_transfer_id` populated
- ✅ `contract.payment_status` = "released"
- ✅ Stripe Dashboard shows transfer to provider account
- ✅ Provider received amount = original amount × 0.98 (2% platform fee deducted)
- ✅ Email sent to both client and provider

### Step 5: Refund (Dispute Case)

**Endpoint:** `POST /api/escrow/refund`

**Request Body:**
```json
{
  "contractId": "uuid-of-contract",
  "reason": "Client disputed work quality"
}
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "status": "refunded",
    "refund_reason": "Client disputed work quality",
    "refunded_at": "2026-04-28T13:00:00Z"
  },
  "refundId": "re_xxx"
}
```

**Verify:**
- ✅ `payment_tracking.status` = "refunded"
- ✅ `contract.payment_status` = "refunded"
- ✅ `contract.status` = "cancelled"
- ✅ Stripe Dashboard shows refund processed
- ✅ Client receives full refund (including fees)

## Database Verification Queries

```sql
-- Check payment tracking record
SELECT * FROM payment_tracking WHERE contract_id = 'uuid';

-- Check contract payment status
SELECT 
  id,
  payment_status,
  stripe_payment_intent_id,
  client_approval_deadline,
  payment_captured_at
FROM contracts 
WHERE id = 'uuid';

-- Verify platform fee calculations
SELECT 
  amount_nzd,
  platform_fee,
  payment_processing_fee,
  total_amount,
  (amount_nzd * 0.02) as expected_platform_fee,
  (amount_nzd * 0.0265 + 0.30) as expected_processing_fee
FROM payment_tracking 
WHERE contract_id = 'uuid';
```

## Stripe Dashboard Verification

### Test Mode Dashboard: https://dashboard.stripe.com/test

**Payment Intent Status Flow:**
1. `requires_payment_method` → Created, awaiting client payment
2. `requires_capture` → Client paid, funds authorized (held)
3. `succeeded` → Payment captured and held in balance
4. Transfer created → Funds moved to provider account

**What to Check:**
- ✅ Payment Intents → Status progression
- ✅ Transfers → Verify amount to provider = amount_nzd × 0.98
- ✅ Balance → Platform fee (2%) remains in platform account
- ✅ Connected Accounts → Provider received funds
- ✅ Refunds → Full amount returned if disputed

## Error Scenarios to Test

### 1. Payment Capture Before Client Pays
```bash
curl -X POST http://localhost:3000/api/escrow/capture \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId": "pi_xxx"}'
```
**Expected:** Error - "Payment intent cannot be captured. Status: requires_payment_method"

### 2. Release Without Provider Stripe Account
```bash
curl -X POST http://localhost:3000/api/escrow/release \
  -H "Content-Type: application/json" \
  -d '{"contractId": "uuid", "releaseMethod": "client_approval"}'
```
**Expected:** Error - "Provider does not have a connected Stripe account"

### 3. Double Release Attempt
Release payment, then try again:
**Expected:** Error - "Payment not found or not captured" (status already "released")

### 4. Refund After Release
**Expected:** Error - "Payment not found or not captured" (status must be "captured")

## Success Criteria

✅ All API endpoints return proper status codes
✅ Database records maintain consistency
✅ Stripe operations complete without errors
✅ Email notifications sent successfully
✅ Platform fees calculated correctly (2%)
✅ Payment processing fees accurate (2.65% + $0.30)
✅ 48-hour approval deadline set correctly
✅ Audit trail complete in `payment_tracking`
✅ No silent failures or lost transactions

## Monitoring & Alerts

**Log Locations:**
- Console logs: All escrow operations logged with details
- `email_logs` table: Email delivery status
- Stripe Dashboard: Real-time payment status
- `payment_tracking`: Complete financial audit trail

**Alert Triggers:**
- Payment capture fails after client pays
- Release fails but database updated
- Email notifications fail
- Stripe webhook mismatches database state

## Production Checklist

Before going live:
- [ ] Switch to live Stripe keys
- [ ] Test with real bank account for provider
- [ ] Verify webhook endpoints configured
- [ ] Set up monitoring/alerts for failed payments
- [ ] Test auto-release cron job
- [ ] Verify tax/GST calculations
- [ ] Document refund policy for clients
- [ ] Train support team on escrow system