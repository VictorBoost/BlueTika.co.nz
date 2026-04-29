---
title: "Phase 4: Polish & Medium Priority Fixes"
status: todo
priority: medium
type: feature
tags: [ux, polish]
created_by: agent
created_at: 2026-04-29
position: 32
---

## Notes

**FINAL CHECKPOINT - Polish and minor improvements**

Medium priority items that improve overall experience but aren't blocking.

**Prerequisites:**
- Phase 1, 2, and 3 must be complete and verified

**User Impact:**
- Small UX improvements
- Better mobile experience
- Clearer helper text
- Improved empty states

## Checklist

### Issue #11: Project Expiry Visual (1 hour)
- [ ] Open project/[id].tsx
- [ ] Add countdown visual (progress bar or clock icon)
- [ ] Show days/hours remaining more prominently
- [ ] Red color when <24 hours remaining
- [ ] Test: View project with various expiry times

### Issue #12: Better Empty States (2 hours)
- [ ] Open projects.tsx, contracts.tsx, my-bids.tsx
- [ ] Replace "No items found" with helpful CTAs
- [ ] Empty projects: "Post your first project"
- [ ] Empty contracts: "Browse projects to get started"
- [ ] Empty bids: "Find projects to bid on"
- [ ] Test: View each page with no data

### Issue #13: Mobile Responsiveness Check (3 hours)
- [ ] Test entire flow on mobile (375px width)
- [ ] Fix any layout breaks
- [ ] Ensure buttons are touch-friendly (min 44px)
- [ ] Check modals fit on small screens
- [ ] Test: Complete user journey on mobile device

### Issue #14: Helper Text & Tooltips (2 hours)
- [ ] Add tooltips to confusing fields
- [ ] "Budget" field: explain it's max you're willing to pay
- [ ] "Trade certificate" field: explain it's optional but builds trust
- [ ] Commission field: explain when/how it's charged
- [ ] Test: Hover/tap tooltips, verify clarity

### Issue #15: Loading States (2 hours)
- [ ] Standardize loading spinners
- [ ] Add skeleton loaders for content
- [ ] Improve perceived performance
- [ ] Test: Slow network - verify good loading UX

## Acceptance

- [ ] All empty states have helpful CTAs
- [ ] Mobile experience is smooth (no layout breaks)
- [ ] Helper text clarifies confusing fields
- [ ] Loading states provide good feedback
- [ ] Project expiry is visually clear

**FINAL CHECK - Full regression test of all phases before marking complete**