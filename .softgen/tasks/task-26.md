---
title: "Phase 1: Critical Payment & Discovery Fixes"
status: todo
priority: urgent
type: feature
tags: [ux, critical, quick-wins]
created_by: agent
created_at: 2026-04-29
position: 26
---

## Notes

**CHECKPOINT 1A - Must verify before Phase 1B**

Critical fixes that block user journeys or cause confusion. These are highest impact for effort.

**User Impact:**
- Project owners can't compare bids (bid amounts hidden)
- Visitors can't browse without login (kills discovery)
- Providers don't know when payments release

**Testing Required After:**
1. Browse projects as anonymous visitor - should work
2. Post project, receive bid, verify amount is visible
3. View contracts page, verify payment timeline shown

## Checklist

### Issue #5: Show Bid Amounts to Project Owners (1 hour)
- [ ] Open BidCard.tsx
- [ ] Remove conditional hiding of bid amount
- [ ] Show amount prominently for project owners
- [ ] Keep amount hidden from other providers (competition)
- [ ] Test: Project owner sees all bid amounts on project detail page

### Issue #1: Allow Anonymous Browse Projects (4 hours)  
- [ ] Open projects.tsx
- [ ] Remove authentication check redirect
- [ ] Show projects to anonymous visitors
- [ ] Add "Login to Bid" CTA on project cards for non-authenticated users
- [ ] Hide "My Bids" navigation for anonymous users
- [ ] Test: Visit /projects without login - should display projects

### Issue #9: Payment Timeline Explanation (1 hour)
- [ ] Open contracts.tsx
- [ ] Add clear text: "Approved funds release every Friday to your bank account"
- [ ] Show next Friday date
- [ ] Add to provider contract cards when status is "Awaiting Fund Release"
- [ ] Test: Provider with completed contract sees release date

## Acceptance

- [ ] Anonymous visitors can browse /projects without forced login
- [ ] Project owners see bid amounts on their project detail pages
- [ ] Providers see clear Friday release date on completed contracts
</thinking>

**STOP HERE - Review and verify all changes work correctly before proceeding to Phase 1B**