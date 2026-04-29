---
title: "Phase 3B: Edit Bids & Additional Charges"
status: todo
priority: high
type: feature
tags: [ux, bids, flexibility]
created_by: agent
created_at: 2026-04-29
position: 31
---

## Notes

**CHECKPOINT 3B - Must verify before Phase 4**

Allow providers to fix mistakes and clients to accept additional work.

**Prerequisites:**
- Phase 3A must be complete and verified

**User Impact:**
- Providers stuck with typos in bids
- Must contact support to fix simple mistakes
- Additional work requests are awkward

**Testing Required After:**
1. Submit bid, click edit, verify changes save
2. Submit additional charge request as provider
3. Client approves additional charge, payment processes

## Checklist

### Issue #7: Edit Bid After Submission (3 hours)
- [ ] Open my-bids.tsx
- [ ] Add "Edit Bid" button on pending bids only
- [ ] Prevent edit after bid accepted
- [ ] Show edit form in modal or inline
- [ ] Allow changes to: amount, timeline, message, trade certificate
- [ ] Log edit history for transparency
- [ ] Test: Submit bid → edit amount → save → changes reflected

### Additional Charges Polish (2 hours)
- [ ] Open AdditionalChargeRequest.tsx
- [ ] Improve UX flow for requesting additional charges
- [ ] Add clear explanation of what client will pay
- [ ] Show commission calculation upfront
- [ ] Test: Request additional charge → client approves → payment works

## Acceptance

- [ ] Providers can edit bids before acceptance
- [ ] Edit history is logged (timestamp + old/new values)
- [ ] Additional charge flow is clear for both parties
- [ ] Commission displayed correctly on additional charges

**STOP HERE - Verify bid editing works correctly before Phase 4**