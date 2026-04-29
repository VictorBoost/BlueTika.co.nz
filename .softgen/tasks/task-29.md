---
title: "Phase 2B: Contract Status & Terminology"
status: todo
priority: high
type: feature
tags: [ux, contracts, clarity]
created_by: agent
created_at: 2026-04-29
position: 29
---

## Notes

**CHECKPOINT 2B - Must verify before Phase 3**

Replace technical jargon with plain language throughout contract flow.

**Prerequisites:**
- Phase 2A must be complete and verified

**User Impact:**
- Users confused by: "Evidence Uploaded", "Awaiting Fund Release", "Work Completed"
- Don't know what to do next
- Miss deadlines because they don't understand status

**Testing Required After:**
1. Go through full contract lifecycle, verify all statuses are clear
2. Check both client and provider views
3. Verify action buttons match the current status

## Checklist

### Contract Status Renaming (4 hours)
- [ ] Open contracts.tsx
- [ ] Map technical statuses to user-friendly labels:
  - "active" → "In Progress"
  - "Work Completed" → "Work Done - Awaiting Photos"
  - "Evidence Uploaded" → "Ready for Review"
  - "Awaiting Fund Release" → "Completed - Payment Processing"
  - "Completed" → "Completed"
- [ ] Update ProgressSteps component labels
- [ ] Add helper text under each status explaining next action
- [ ] Test: View contracts in each status - clear what to do next

### Project Detail Status Updates
- [ ] Open project/[id].tsx
- [ ] Update status badges to match new terminology
- [ ] Ensure consistency across all contract displays
- [ ] Test: Project detail page shows consistent status labels

## Acceptance

- [ ] All contract statuses use plain language
- [ ] Each status shows clear next action for user
- [ ] No technical jargon visible to end users
- [ ] Client and provider understand what to do at each stage

**STOP HERE - Verify contract flow is crystal clear before Phase 3**