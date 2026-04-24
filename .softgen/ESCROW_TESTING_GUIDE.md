# Escrow + Auto-Release Testing Guide

## System Overview

BlueTika now has a complete escrow system with 48-hour client approval window and **manual review** (not auto-release):

1. **Payment Hold**: Payments are authorized but not captured immediately
2. **Client Approval Window**: 48-hour window for client to approve or raise concerns
3. **Manual Review**: After 48 hours of client silence, payment is **flagged for admin review** (NOT auto-released)
4. **Manual Controls**: Admin manually approves payment after reviewing the work

## Safety Philosophy

**Option A (Automatic)**: Client approval → instant release ✅
**Option C (Safe)**: 48 hours of silence → flagged for admin manual review (NO auto-release) ⚠️

This is the **safer approach** - no automatic releases without explicit client approval.

## Testing Configuration

### Quick Test Mode (10 seconds)
For rapid testing, the review window is set to **10 seconds** by default.

To change to production (48 hours):
1. Go to `/muna/escrow-management`
2. Click "Set to 48 hours (Production)"

### Test Mode Setup
- Review window: 10 seconds
- Payment status: "held" immediately after payment
- Flagged for review: 10 seconds after payment (if client silent)

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
  escrow_released_method,
  escrow_needs_review
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

### Phase 4: Manual Review Flagging Cron Job ✅
**Status**: Complete

**Edge Function**: `auto-release-escrow` (renamed to reflect manual review workflow)

**Test Flow**:
1. Create a held payment (complete checkout)
2. Wait 10 seconds (in test mode) without client approval
3. Cron job runs OR manually trigger Edge Function
4. ✅ Verify: Contract flagged with `escrow_needs_review = true`
5. ✅ Verify: Admin receives notification
6. ✅ Verify: Provider receives "under review" notification
7. ✅ Verify: Payment remains "held" (NOT released)

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
  escrow_needs_review,
  auto_release_eligible_at
FROM contracts
WHERE escrow_needs_review = true
ORDER BY auto_release_eligible_at DESC
LIMIT 5;
```

**Function Logs**:
```
Escrow flagging job started at: [timestamp]
Review window: 10 seconds
Found X contracts needing manual review
Flagging contract [id] for manual review
✅ Successfully flagged contract [id] for review
```

### Phase 5: Admin Manual Review ✅
**Status**: Complete

**Test as Admin**:
1. Navigate to `/muna/escrow-management`
2. View all contracts needing review
3. ✅ Verify: Shows "⚠️ Needs Review" badge
4. ✅ Verify: Shows countdown and payment details
5. Click "Review & Approve" on any contract
6. Confirm in dialog
7. ✅ Verify: Payment immediately released
8. ✅ Verify: Notifications sent to both parties
9. ✅ Verify: `escrow_released_method = 'admin_release'`

**Database Check**:
```sql
SELECT 
  id,
  payment_status,
  payment_captured_at,
  escrow_released_method,
  escrow_needs_review
FROM contracts
WHERE escrow_released_method = 'admin_release'
ORDER BY payment_captured_at DESC
LIMIT 5;
```

### Phase 6: Bot Auto-Approval ✅
**Status**: Complete

**Bot Workflow**:
- Bots now **automatically approve** held payments during the activity cycle
- This means bots follow **Option A** (instant release on approval)
- Human clients can still choose to wait, triggering **Option C** (manual review)

**Test Flow**:
1. Go to `/muna/bot-lab`
2. Generate bots and enable "Bot Payments"
3. Use Bot Activity to create contracts
4. Wait for bot activity cycle (or trigger manually)
5. ✅ Verify: Bot clients auto-approve held payments
6. ✅ Verify: Payments released with `escrow_released_method = 'client_approval'`

## End-to-End Test Scenarios

### Scenario 1: Happy Path (Bot Client Approves)
1. Bot creates project
2. Another bot bids
3. Bot accepts bid → Contract created
4. Client completes checkout → Payment "held"
5. Bot activity cycle runs → Bot auto-approves
6. ✅ Payment "released" via `client_approval`

### Scenario 2: Manual Review Path (Client Silent)
1. Real user creates project
2. Bot provider bids
3. User accepts bid → Contract created
4. User completes checkout → Payment "held"
5. User does NOT approve for 48 hours
6. Cron job flags contract with `escrow_needs_review = true`
7. Admin reviews work in Escrow Management
8. Admin manually approves → Payment "released" via `admin_release`

### Scenario 3: Admin Intervention (Early Release)
1. Contract has held payment
2. Issue reported or admin proactively reviews
3. Admin goes to `/muna/escrow-management`
4. Admin manually releases → Payment "released" via `admin_release`

## Testing with Bots

### Quick Test Script
1. Go to `/muna/bot-lab`
2. Generate 2-3 bots (1 client, 2 providers)
3. Enable "Bot Payments" toggle
4. Use Bot Activity controls:
   - "Post Projects" → Creates projects from client bots
   - "Submit Bids" → Providers bid on projects
   - "Accept Bids" → Creates contracts
5. Bot activity automatically completes checkout → Payment "held"
6. Wait for next bot activity cycle (or trigger manually)
7. Bot auto-approves → Payment "released"

**OR test manual review:**
1. Create contract with real user as client
2. Complete checkout → Payment "held"
3. Wait 10 seconds (test mode) or 48 hours (production)
4. Check `/muna/escrow-management`
5. ✅ Verify: Contract appears with "Needs Review" badge
6. Admin manually approves

### Monitoring Active Escrow
```sql
-- View all held payments
SELECT 
  c.id,
  p.title as project,
  c.final_amount,
  c.client_approval_deadline,
  c.auto_release_eligible_at,
  c.escrow_needs_review,
  EXTRACT(EPOCH FROM (c.auto_release_eligible_at - NOW())) as seconds_until_review
FROM contracts c
JOIN projects p ON c.project_id = p.id
WHERE c.payment_status = 'held'
ORDER BY c.auto_release_eligible_at ASC;
```

## Production Deployment Checklist

Before going live:

- [ ] Set review window to 48 hours (172800 seconds)
- [ ] Test manual capture with real Stripe test card
- [ ] Verify email notifications work (SES configured)
- [ ] Test Edge Function with production Stripe keys
- [ ] Set up cron schedule for review flagging (every 5 minutes recommended)
- [ ] Monitor escrow dashboard for first week
- [ ] Update Terms of Service with escrow policy
- [ ] Add client education (48-hour approval window, manual review process)
- [ ] Train admin team on Escrow Management workflow

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

-- Count of contracts needing review
SELECT COUNT(*) 
FROM contracts 
WHERE escrow_needs_review = true AND payment_status = 'held';

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
- Check if `escrow_needs_review = true`
- Manually release via `/muna/escrow-management`

### Review flagging not triggering
- Verify Edge Function is running
- Check cron schedule is active
- Review Edge Function logs
- Manually invoke function to test

### Client can't see approval card
- Verify payment_status = "held"
- Check client_approval_deadline is set
- Verify user is logged in as client
- Check RLS policies

### Bot auto-approval not working
- Verify bot payments are enabled
- Check bot activity cycle is running
- Review bot activity logs
- Verify Stripe secret is set in Edge Function

## Success Metrics

After deployment, monitor:
- % of payments client-approved vs admin-released
- Average time to client approval
- Number of contracts needing manual review
- Admin response time for manual reviews
- Dispute rate on escrowed contracts
- Client satisfaction with approval process

## Next Steps

1. **Dispute Integration**: Connect dispute system to flag contracts automatically
2. **Email Reminders**: Send reminder 24 hours before review deadline
3. **Client Education**: Add modal explaining 48-hour window on first payment
4. **Analytics**: Track escrow metrics in admin dashboard
5. **Batch Admin Approvals**: Allow admins to approve multiple payments at once