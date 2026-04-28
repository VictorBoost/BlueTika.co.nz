<![CDATA[
# BlueTika Escrow System - Implementation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ESCROW PAYMENT FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Client Accepts Bid                                      │
│     ↓                                                       │
│     POST /api/escrow/create                                 │
│     - Creates payment_tracking record                       │
│     - Creates Stripe PaymentIntent (manual capture)         │
│     - Returns clientSecret for frontend                     │
│                                                             │
│  2. Client Pays via Stripe Elements                         │
│     ↓                                                       │
│     Frontend: stripe.confirmCardPayment(clientSecret)       │
│     - Client enters card details                            │
│     - Stripe authorizes payment                             │
│                                                             │
│  3. Payment Captured (Held in Escrow)                       │
│     ↓                                                       │
│     POST /api/escrow/capture                                │
│     - Captures payment in Stripe                            │
│     - Updates payment_tracking (status: captured)           │
│     - Updates contract (payment_status: held)               │
│     - Sets 48-hour approval deadline                        │
│                                                             │
│  4. Provider Completes Work                                 │
│     ↓                                                       │
│     Client reviews work                                     │
│                                                             │
│  5. Payment Released                                        │
│     ↓                                                       │
│     POST /api/escrow/release                                │
│     - Transfers funds to provider Stripe account            │
│     - Updates payment_tracking (status: released)           │
│     - Updates contract (payment_status: released)           │
│     - Sends email notifications                             │
│                                                             │
│  Alternative: Refund                                        │
│     ↓                                                       │
│     POST /api/escrow/refund                                 │
│     - Refunds payment to client                             │
│     - Updates payment_tracking (status: refunded)           │
│     - Updates contract (status: cancelled)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Integration with Existing System

### 1. Contract Creation (When Client Accepts Bid)

**File:** `src/pages/project/[id].tsx` or wherever you handle bid acceptance

```typescript
// After client accepts bid and contract is created
const handleAcceptBid = async (bidId: string) => {
  try {
    // 1. Create contract (existing logic)
    const { data: contract, error } = await contractService.acceptBid(bidId);
    if (error) throw error;

    // 2. Create escrow payment (NEW)
    const response = await fetch('/api/escrow/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: contract.id }),
    });

    const { success, clientSecret, error: escrowError } = await response.json();
    if (!success) throw new Error(escrowError);

    // 3. Redirect to checkout page with clientSecret
    router.push(`/checkout/${contract.id}?client_secret=${clientSecret}`);
  } catch (error) {
    console.error('Accept bid error:', error);
    toast.error('Failed to create payment');
  }
};
```

### 2. Checkout Page (Client Pays)

**File:** `src/pages/checkout/[contractId].tsx` (already exists)

Update to use the new escrow flow:

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutPage() {
  const router = useRouter();
  const { contractId } = router.query;
  const clientSecret = router.query.client_secret as string;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm contractId={contractId as string} />
    </Elements>
  );
}

function CheckoutForm({ contractId }: { contractId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // 1. Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: { name: 'Client Name' },
          },
        }
      );

      if (stripeError) throw new Error(stripeError.message);

      // 2. Capture payment (hold in escrow)
      const response = await fetch('/api/escrow/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });

      const { success, error } = await response.json();
      if (!success) throw new Error(error);

      // 3. Redirect to contract page
      toast.success('Payment successful! Work can now begin.');
      router.push(`/contracts`);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
```

### 3. Contract Completion (Client Approves Work)

**File:** `src/pages/contracts.tsx` or contract detail page

```typescript
const handleApproveWork = async (contractId: string) => {
  try {
    // Release payment to provider
    const response = await fetch('/api/escrow/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractId,
        releaseMethod: 'client_approval',
      }),
    });

    const { success, error } = await response.json();
    if (!success) throw new Error(error);

    toast.success('Payment released to provider!');
    // Refresh contract data
  } catch (error) {
    console.error('Release error:', error);
    toast.error('Failed to release payment');
  }
};
```

### 4. Admin Override (Manual Release/Refund)

**File:** `src/pages/muna/escrow-management.tsx` (create this page)

```typescript
// Admin can manually release or refund payments
const handleManualRelease = async (contractId: string) => {
  const response = await fetch('/api/escrow/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractId,
      releaseMethod: 'admin_release',
    }),
  });
  // Handle response
};

const handleRefund = async (contractId: string, reason: string) => {
  const response = await fetch('/api/escrow/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractId, reason }),
  });
  // Handle response
};
```

## Database Schema

### payment_tracking Table (Created)

```sql
CREATE TABLE payment_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES profiles(id),
  amount_nzd DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  payment_processing_fee DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending_payment', 'captured', 'released', 'refunded')) DEFAULT 'pending_payment',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT,
  release_method TEXT CHECK (release_method IN ('client_approval', 'auto_release', 'admin_release')),
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ
);
```

### Existing contracts Table (No Changes Needed)

Already has these escrow fields:
- `payment_status` (pending, held, released, refunded)
- `stripe_payment_intent_id`
- `client_approval_deadline`
- `auto_release_eligible_at`
- `payment_captured_at`
- `escrow_released_method`

## Environment Variables Required

```env
# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Safety Features

1. **Immutable Audit Trail**
   - All payment operations logged to `payment_tracking`
   - Never delete records, only update status

2. **Double Verification**
   - Check Stripe status before database updates
   - Verify provider has Stripe Connect account before release

3. **Error Recovery**
   - Idempotency: API calls can be retried safely
   - Rollback: Failed operations don't leave partial state

4. **Email Notifications**
   - Client notified on payment capture
   - Provider notified on payment release
   - Admin alerted on refunds

5. **48-Hour Auto-Release**
   - Edge Function: `auto-release-escrow` runs hourly
   - Checks `auto_release_eligible_at` timestamp
   - Releases funds if client hasn't approved/disputed

## Testing Checklist

- [ ] System validation passes (`GET /api/escrow/validate`)
- [ ] Create escrow payment works
- [ ] Client can pay via Stripe test card
- [ ] Payment captured and held correctly
- [ ] Client approval releases payment
- [ ] Provider receives 98% of contract amount
- [ ] Refund returns full amount to client
- [ ] Email notifications sent
- [ ] Admin can manually release/refund
- [ ] Auto-release triggers after 48 hours

## Production Deployment

1. **Switch to Live Stripe Keys**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Enable Stripe Webhooks**
   - Add webhook endpoint: `https://bluetika.co.nz/api/webhooks/stripe`
   - Subscribe to events: `payment_intent.succeeded`, `transfer.created`, `refund.created`

3. **Configure Auto-Release Cron**
   - Edge Function already exists: `auto-release-escrow`
   - Runs hourly via Supabase Cron

4. **Monitor Payment Tracking**
   - Set up alerts for failed payments
   - Daily reconciliation report (Stripe vs Database)

## Support & Troubleshooting

**Common Issues:**

1. **"Provider does not have a connected Stripe account"**
   - Provider must complete Stripe Connect onboarding
   - Check: `profiles.stripe_account_id` is populated

2. **"Payment intent cannot be captured"**
   - Client hasn't paid yet
   - Check Stripe Dashboard for payment status

3. **"Payment not found or not captured"**
   - Payment must be in "captured" status to release/refund
   - Query: `SELECT status FROM payment_tracking WHERE contract_id = 'xxx'`

**Admin Tools:**

- Validation endpoint: `/api/escrow/validate`
- Payment tracking query: `SELECT * FROM payment_tracking ORDER BY created_at DESC LIMIT 20`
- Stripe Dashboard: https://dashboard.stripe.com
</file_contents>
