---
title: "Phase 2A: Provider Verification & Notifications"
status: todo
priority: high
type: feature
tags: [ux, provider, email]
created_by: agent
created_at: 2026-04-29
position: 28
---

## Notes

**CHECKPOINT 2A - Must verify before Phase 2B**

Provider verification flow improvements. Critical for provider onboarding.

**Prerequisites:**
- Phase 1A and 1B must be complete and verified

**User Impact:**
- Providers stuck in "pending" limbo with no updates
- No email when verification approved/rejected
- Can't start bidding without clarity

**Testing Required After:**
1. Submit provider verification, check for timeline message
2. Admin approves verification, provider gets email
3. Provider can immediately start bidding after approval

## Checklist

### Issue #3: Provider Verification Communication (6 hours)
- [ ] Open provider/verify.tsx
- [ ] Add "Typically reviewed within 24-48 hours" message
- [ ] Show pending state with clear status
- [ ] Create email template for verification approval (use generate_auth_email_templates)
- [ ] Create email template for verification rejection with reason
- [ ] Add email trigger in Muna admin panel when status changes
- [ ] Add in-app notification when status changes
- [ ] Test: Submit verification → see timeline → admin approves → receive email

### Database Webhook Setup
- [ ] Create database trigger for verification status changes
- [ ] Trigger sends email via sesEmailService
- [ ] Trigger creates in-app notification
- [ ] Test: Change status in admin panel → email sends automatically

## Acceptance

- [ ] Pending verification shows expected timeline (24-48 hours)
- [ ] Approved providers receive email confirmation
- [ ] Rejected providers receive email with reason
- [ ] Providers can immediately bid after approval

**STOP HERE - Test verification flow end-to-end before Phase 2B**