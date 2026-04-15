---
title: Stripe Payment Integration with Progress Tracking
status: in_progress
priority: urgent
type: feature
tags: [payments, stripe, notifications, admin]
created_by: agent
created_at: 2026-04-15T22:08:24Z
position: 5
---

## Notes
Implement secure payment checkout via Stripe after bid acceptance. Show 7-step progress bar (Posted → Bid Accepted → Payment → Work → Evidence → Review → Release). Display detailed fee breakdown with editable payment processing contribution. Send email + in-platform notifications after payment. Hold funds in escrow until project completion.

## Checklist
- [ ] Add payment fields to contracts table (payment_status, stripe_payment_intent_id, platform_fee, payment_processing_fee, total_amount)
- [ ] Create platform_settings table for admin-editable values (payment_processing_percentage)
- [ ] Create notifications table for in-platform messaging
- [ ] Build checkout page with 7-step progress bar (step 3 active)
- [ ] Show fee breakdown: agreed price, 2% platform fee, payment processing contribution (with ❓ tooltip), GST (not applicable), total
- [ ] Install and configure Stripe SDK in test mode
- [ ] Create paymentService.ts for Stripe operations
- [ ] Implement payment confirmation flow
- [ ] Add Amazon SES email sending (noreply@bluetika.co.nz)
- [ ] Create notification system for both users
- [ ] Update contract status to "payment_confirmed" on success
- [ ] Show escrow protection notice after payment