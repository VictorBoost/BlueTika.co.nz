# Escrow + Auto-Release Testing Guide

## System Overview

BlueTika now has a complete escrow system with 48-hour client approval window and automatic release:

1. **Payment Hold**: Payments are authorized but not captured immediately
2. **Client Approval Window**: 48-hour window for client to approve or raise concerns
3. **Auto-Release**: Automatic payment release after 48 hours if no action taken
4. **Manual Controls**: Admin can manually release payments at any time

## Testing Configuration

### Quick Test Mode (10 seconds)
For rapid testing, the auto-release window is set to **10 seconds** by default.

To change to production (48 hours):
1. Go to `/muna/escrow-management`
2. Click "Set to 48 hours (Production)"

### Test Mode Setup
- Auto-release window: 10 seconds
- Payment status: "held" immediately after payment
- Auto-release eligible: 10 seconds after payment

## Phase-by-Phase Testing

### Phase 1: Database Schema ✅
**Status**: Complete

Verify columns exist:
```sql
SELECT 
  payment_status,
  client_approval_deadline,
  auto_release_eligible_at,
  payment_captured_at,
  escrow_released_method
FROM contracts
LIMIT 1;
```

### Phase 2: Stripe Integration (Manual Capture) ✅
**Status**: Complete

**Test Flow**:
1. Create a contract as a bot provider
2. Bot accepts the contract
3. Client pays via `/checkout/[contractId]`
4. ✅ Verify: Payment status shows "held" (not "paid")
5. ✅ Verify: Stripe shows payment as "requires_capture"
6. ✅ Verify: `client_approval_deadline` and `auto_release_eligible_at` are set

**Database Check**:
```sql
SELECT 
  id,
  payment_status,
  stripe_payment_intent_id,
  client_approval_deadline,
  auto_release_eligible_at
FROM contracts
WHERE payment_status = 'held'
ORDER BY created_at DESC
LIMIT 5;
```

### Phase 3: Client Approval UI ✅
**Status**: Complete

**Test as Client**:
1. Navigate to `/contracts`
2. Find contract with "held" payment status
3. ✅ Verify: Green approval card appears with countdown timer
4. Click "Approve & Release Payment"
5. Confirm in dialog
6. ✅ Verify: Payment status changes to "released"
7. ✅ Verify: Provider receives notification
8. ✅ Verify: Stripe payment is captured

**Database Check**:
```sql
SELECT 
  id,
  payment_status,
  payment_captured_at,
  escrow_released_method
FROM contracts
WHERE escrow_released_method = 'client_approval'
ORDER BY payment_captured_at DESC
LIMIT 5;
```

### Phase 4: Auto-Release Cron Job ✅
**Status**: Complete

**Edge Function**: `auto-release-escrow`

**Test Flow**:
1. Create a held payment (complete checkout)
2. Wait 10 seconds (in test mode)
3. Manually trigger Edge Function OR wait for cron
4. ✅ Verify: Payment automatically released
5. ✅ Verify: Both client and provider receive notifications
6. ✅ Verify: `escrow_released_method = 'auto_release'`

**Manual Trigger**:
```bash
# Via Supabase Edge Functions dashboard
# Or via API call to the function endpoint
```

**Database Check**:
```sql
SELECT 
  id,
  payment_status,
  payment_captured_at,
  escrow_released_method,
  auto_release_eligible_at
FROM contracts
WHERE escrow_released_method = 'auto_release'
ORDER BY payment_captured_at DESC
LIMIT 5;
```

**Function Logs**:
```
Auto-release job started at: [timestamp]
Auto-release window: 10 seconds
Found X contracts eligible for auto-release
Processing contract [id], payment intent: [pi_xxx]
✅ Successfully released payment for contract [id]
```

### Phase 5: Admin Manual Release ✅
**Status**: Complete

**Test as Admin**:
1. Navigate to `/muna/escrow-management`
2. View all held payments
3. ✅ Verify: Shows countdown and payment details
4. Click "Manual Release" on any contract
5. Confirm in dialog
6. ✅ Verify: Payment immediately released
7. ✅ Verify: Notifications sent to both parties
8. ✅ Verify: `escrow_released_method = 'admin_release'`

**Database Check**:
```sql
SELECT 
  id,
  payment_status,
  payment_captured_at,
  escrow_released_method
FROM contracts
WHERE escrow_released_method = 'admin_release'
ORDER BY payment_captured_at DESC
LIMIT 5;
```

### Phase 6: Dispute Handling
**Status**: Integration ready

When disputes are raised:
- Payment remains "held"
- Auto-release is prevented
- Admin manually reviews and releases/refunds

## End-to-End Test Scenarios

### Scenario 1: Happy Path (Client Approves)
1. Bot creates project
2. Another bot bids
3. Bot accepts bid → Contract created
4. Client completes checkout → Payment "held"
5. Client immediately approves → Payment "released"
6. ✅ `escrow_released_method = 'client_approval'`

### Scenario 2: Auto-Release Path
1. Bot creates project
2. Another bot bids
3. Bot accepts bid → Contract created
4. Client completes checkout → Payment "held"
5. Wait 10 seconds (test mode) or 48 hours (production)
6. Auto-release cron runs → Payment "released"
7. ✅ `escrow_released_method = 'auto_release'`

### Scenario 3: Admin Intervention
1. Bot creates project
2. Another bot bids
3. Bot accepts bid → Contract created
4. Client completes checkout → Payment "held"
5. Issue reported or admin reviews
6. Admin manually releases → Payment "released"
7. ✅ `escrow_released_method = 'admin_release'`

## Testing with Bots

### Quick Test Script
1. Go to `/muna/bot-lab`
2. Generate 2-3 bots (1 client, 2 providers)
3. Use Bot Activity controls:
   - "Post Projects" → Creates projects from client bots
   - "Submit Bids" → Providers bid on projects
   - "Accept Bids" → Creates contracts
4. Manually complete checkout as client bot
5. Observe auto-release after 10 seconds

### Monitoring Active Escrow
```sql
-- View all held payments
SELECT 
  c.id,
  p.title as project,
  c.final_amount,
  c.client_approval_deadline,
  c.auto_release_eligible_at,
  EXTRACT(EPOCH FROM (c.auto_release_eligible_at - NOW())) as seconds_until_release
FROM contracts c
JOIN projects p ON c.project_id = p.id
WHERE c.payment_status = 'held'
ORDER BY c.auto_release_eligible_at ASC;
```

## Production Deployment Checklist

Before going live:

- [ ] Set auto-release window to 48 hours (172800 seconds)
- [ ] Test manual capture with real Stripe test card
- [ ] Verify email notifications work (SES configured)
- [ ] Test Edge Function with production Stripe keys
- [ ] Set up cron schedule for auto-release (every 5 minutes recommended)
- [ ] Monitor escrow dashboard for first week
- [ ] Update Terms of Service with escrow policy
- [ ] Add client education (48-hour approval window)

## Stripe Test Cards

**Successful Payment**:
- Card: 4242 4242 4242 4242
- Any future expiry, any CVC

**Requires Capture**:
All test cards work with manual capture mode.

## Monitoring Commands

```sql
-- Count of contracts by payment status
SELECT payment_status, COUNT(*) 
FROM contracts 
GROUP BY payment_status;

-- Count of releases by method
SELECT escrow_released_method, COUNT(*) 
FROM contracts 
WHERE escrow_released_method IS NOT NULL
GROUP BY escrow_released_method;

-- Average time to release
SELECT 
  escrow_released_method,
  AVG(EXTRACT(EPOCH FROM (payment_captured_at - created_at))) / 3600 as avg_hours_to_release
FROM contracts
WHERE payment_captured_at IS NOT NULL
GROUP BY escrow_released_method;
```

## Troubleshooting

### Payment stuck in "held"
- Check `auto_release_eligible_at` timestamp
- Verify Edge Function is running
- Check Edge Function logs for errors
- Manually release via `/muna/escrow-management`

### Auto-release not triggering
- Verify Edge Function secret `STRIPE_SECRET_KEY` is set
- Check cron schedule is active
- Review Edge Function logs
- Manually invoke function to test

### Client can't see approval card
- Verify payment_status = "held"
- Check client_approval_deadline is set
- Verify user is logged in as client
- Check RLS policies

## Success Metrics

After deployment, monitor:
- % of payments auto-released vs client-approved
- Average time to client approval
- Number of admin interventions
- Dispute rate on escrowed contracts
- Client satisfaction with approval process

## Next Steps

1. **Dispute Integration**: Connect dispute system to prevent auto-release
2. **Email Reminders**: Send reminder 24 hours before auto-release
3. **Client Education**: Add modal explaining 48-hour window on first payment
4. **Analytics**: Track escrow metrics in admin dashboard