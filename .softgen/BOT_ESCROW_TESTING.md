# Bot Escrow Testing Guide

## ✅ Bots Now Follow the EXACT Same Escrow Rules

### Complete Bot Flow (Matches Real Users)

```
1. BOT CLIENT posts project
   └─> Project status: "open"

2. BOT PROVIDER submits bid
   └─> Bid status: "pending"

3. BOT CLIENT accepts bid
   └─> Contract created with status: "accepted"
   └─> Project status: "in_progress"
   └─> Payment status: "pending" (simulated - bots don't use Stripe)

4. BOT PROVIDER completes work (bot-complete-contracts function)
   ├─> Uploads "before" evidence photo (confirmed)
   ├─> Uploads "after" evidence photo (confirmed)
   ├─> Sets work_done_at: NOW
   ├─> Sets client_dispute_deadline: NOW + 24 hours
   └─> Submits provider review (5 stars)

5. BOT CLIENT submits review (if client is also a bot)
   ├─> Submits client review (5 stars)
   ├─> Sets provider_dispute_deadline: NOW + 5 working days
   └─> Sets ready_for_release_at: NOW

6. 24-HOUR DISPUTE WINDOW (enforced)
   └─> Contract status: "awaiting_fund_release"
   └─> Contract is NOT visible in /muna/fund-releases yet
   └─> Client could still dispute (but bots don't)

7. AFTER 24 HOURS PASS
   └─> Contract appears in /muna/fund-releases
   └─> Admin can manually release 92% payout

8. ADMIN RELEASES FUNDS (manual, Friday)
   └─> Contract status: "funds_released"
   └─> Provider receives 92% (8% commission)
```

## Key Implementation Details

### Evidence Photos (Step 4)
```typescript
// Bot uploads BEFORE photo
await supabaseClient.from("evidence_photos").insert({
  contract_id: contract.id,
  uploaded_by: contract.provider_id,
  photo_type: "before",
  photo_url: `https://picsum.photos/seed/${contract.id}-before/800/600`,
  caption: "Work area before starting the project",
  is_confirmed: true  // ✅ Permanently locked
});

// Bot uploads AFTER photo
await supabaseClient.from("evidence_photos").insert({
  contract_id: contract.id,
  uploaded_by: contract.provider_id,
  photo_type: "after",
  photo_url: `https://picsum.photos/seed/${contract.id}-after/800/600`,
  caption: "Project completed as agreed. All work done to specification.",
  is_confirmed: true  // ✅ Permanently locked
});
```

### 24-Hour Dispute Window (Step 4)
```typescript
// Mark work done - triggers 24-hour client dispute window
const workDoneAt = new Date().toISOString();
const clientDisputeDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

await supabaseClient.from("contracts").update({
  work_done_at: workDoneAt,
  client_dispute_deadline: clientDisputeDeadline  // ✅ NOW + 24 hours
}).eq("id", contract.id);
```

### Reviews (Steps 4-5)
```typescript
// Provider review (always submitted by bot)
await supabaseClient.from("reviews").insert({
  contract_id: contract.id,
  reviewer_role: "provider",
  reviewee_role: "client",
  rating: 5,
  comment: "Great client to work with. Clear communication and prompt payment.",
  is_public: true
});

// Client review (only if client is also a bot)
if (clientBot) {
  await supabaseClient.from("reviews").insert({
    contract_id: contract.id,
    reviewer_role: "client",
    reviewee_role: "provider",
    rating: 5,
    comment: "Excellent service! Work completed exactly as promised.",
    is_public: true
  });
}
```

### Fund Release Eligibility (Step 5)
```typescript
// After both reviews submitted, set ready_for_release_at
await supabaseClient.from("contracts").update({
  provider_dispute_deadline: deadline.toISOString(),  // 5 working days
  ready_for_release_at: now.toISOString()  // ✅ Eligible after 24h from this timestamp
}).eq("id", contract.id);

// Update status to awaiting_fund_release (matches real user flow)
await supabaseClient.from("contracts").update({
  status: "awaiting_fund_release"
}).eq("id", contract.id);
```

### Admin Panel Filter (Step 7)
```typescript
// /muna/fund-releases shows contracts where:
// Current_Time > (ready_for_release_at + 24 hours)

const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const { data } = await supabase
  .from("contracts")
  .select(...)
  .eq("status", "awaiting_fund_release")
  .lte("ready_for_release_at", twentyFourHoursAgo)  // ✅ Only show after 24h passed
  .order("ready_for_release_at", { ascending: true });
```

## Testing the 24-Hour Window

### Manual Test (Fast)
1. Go to `/muna/bot-lab`
2. Click "Run Activity Cycle" button
3. Wait for bots to:
   - Post projects
   - Submit bids
   - Accept bids (create contracts)
   - Complete work (upload photos + reviews)
4. Go to `/muna/fund-releases`
5. **Result:** List should be EMPTY (24 hours haven't passed)
6. Wait 24 hours OR manually update `ready_for_release_at` in database:
   ```sql
   UPDATE contracts 
   SET ready_for_release_at = NOW() - INTERVAL '25 hours'
   WHERE status = 'awaiting_fund_release';
   ```
7. Refresh `/muna/fund-releases`
8. **Result:** Contracts now appear, ready for manual release

### Automated Test (Edge Function)
The `auto-release-escrow` function runs on a schedule and:
- Checks for contracts past the auto-release window
- Flags them as `escrow_needs_review: true`
- Sends notifications to admin and provider

This is a SAFETY mechanism, separate from the normal 24-hour flow.

## Bot vs Real User Comparison

| Step | Real User | Bot | Match? |
|------|-----------|-----|--------|
| Upload evidence photos | Manual via UI | Auto (picsum.photos URLs) | ✅ Same result |
| Confirm photos | Click "Confirm" button | Auto-confirmed | ✅ Same result |
| Trigger 24h window | On photo confirm | On photo confirm | ✅ EXACT |
| Submit reviews | Manual via modal | Auto (5 stars) | ✅ Same result |
| Set ready_for_release_at | On both reviews | On both reviews | ✅ EXACT |
| 24h dispute window | Enforced | Enforced | ✅ EXACT |
| Appear in admin panel | After 24h | After 24h | ✅ EXACT |
| Fund release | Admin manual | Admin manual | ✅ EXACT |

## Key Changes Made

### Before (Incorrect)
```typescript
// ❌ Bots bypassed escrow - no evidence photos, no 24h window
// ❌ Auto-approval after reviews submitted
// ❌ Funds appeared immediately in admin panel
```

### After (Correct)
```typescript
// ✅ Bots upload evidence photos (before/after)
// ✅ 24-hour dispute window enforced
// ✅ Contracts only appear in admin panel after 24h
// ✅ Admin manually releases funds (no auto-approval)
```

## Database Timeline Tracking

Monitor a bot contract through its lifecycle:

```sql
SELECT 
  id,
  status,
  work_done_at,
  client_dispute_deadline,
  provider_dispute_deadline,
  ready_for_release_at,
  -- Time until client can dispute
  EXTRACT(EPOCH FROM (client_dispute_deadline - NOW())) / 3600 as client_hours_left,
  -- Time until contract appears in admin panel
  EXTRACT(EPOCH FROM (ready_for_release_at + INTERVAL '24 hours' - NOW())) / 3600 as hours_until_release
FROM contracts
WHERE provider_id IN (SELECT profile_id FROM bot_accounts)
ORDER BY created_at DESC
LIMIT 10;
```

## Expected Results

### Immediately After Bot Completion
- ✅ evidence_photos: 2 rows (before + after)
- ✅ reviews: 2 rows (client + provider reviews)
- ✅ work_done_at: Set
- ✅ client_dispute_deadline: work_done_at + 24h
- ✅ ready_for_release_at: Set
- ❌ Fund release panel: Empty (24h not passed yet)

### After 24 Hours Pass
- ✅ Fund release panel: Contract visible
- ✅ Admin can click "Release Funds" button
- ✅ Status changes to "funds_released"
- ✅ Provider receives 92% payout

## Conclusion

**Bots now follow the EXACT same escrow rules as real users.** This enables realistic end-to-end testing of:
- Evidence photo uploads
- Review submission
- 24-hour dispute windows
- Fund release approval process
- Commission calculations

The only difference: Bots use placeholder photos (picsum.photos) instead of real uploads, and they always give 5-star reviews. The **escrow timing and logic is identical.**