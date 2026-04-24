---
title: Escrow + Auto-Release System
status: done
priority: urgent
type: feature
tags: [payment, escrow, safety]
created_by: agent
created_at: 2026-04-24
position: 19
---

## Notes

Complete escrow system with 48-hour client approval window and **manual admin review** (safer than auto-release).

**Safety Philosophy:**
- **Option A (Automatic)**: Client approval → instant release
- **Option C (Safe)**: 48 hours of silence → flagged for manual admin review

This prevents automatic releases without client approval, providing maximum safety for clients.

**Key Features:**
- Payments held for 48 hours (or 10 seconds in test mode)
- Client can approve instantly via green card on Contracts page
- After 48 hours of silence, contract flagged for admin review
- Admin manually approves after reviewing work
- All release methods tracked (client_approval, admin_release)
- Bot clients auto-approve for seamless testing

## Checklist

- [x] Add database columns (payment_status, client_approval_deadline, auto_release_eligible_at, payment_captured_at, escrow_released_method, escrow_needs_review)
- [x] Update Stripe integration to use manual capture
- [x] Create ClientApprovalCard component with countdown timer
- [x] Integrate approval UI into Contracts page
- [x] Create auto-release-escrow Edge Function (flagging for review, not auto-releasing)
- [x] Update RLS policies for escrow columns
- [x] Create Escrow Management admin page (/muna/escrow-management)
- [x] Add escrow_needs_review flag system
- [x] Add admin manual release capability
- [x] Update bot activity to auto-approve payments
- [x] Create comprehensive testing guide
- [x] Add Escrow Management link to Control Centre
- [x] Update all Stripe API versions to 2025-02-24.acacia

## Acceptance

- Client can approve payment instantly via green card on Contracts page
- After 48 hours of client silence, payment is flagged for manual admin review (NOT auto-released)
- Admin can review and manually approve payments in Escrow Management dashboard
- All three release methods (client_approval, admin_release) are tracked in database
- Bot clients automatically approve payments for seamless testing