---
title: Escrow + Auto-Release System
status: done
priority: urgent
type: feature
tags: [payment, escrow, stripe, security]
created_by: agent
created_at: 2026-04-24T11:35:55Z
position: 19
---

## Notes
Complete escrow system with 48-hour client approval window and automatic payment release. Payments are authorized (held) but not captured until approved or auto-released after the approval window.

**Key Features**:
- Manual Stripe capture (hold funds, don't charge immediately)
- Client approval UI with countdown timer
- Auto-release Edge Function (configurable: 10s test / 48h production)
- Admin manual release controls
- Three release methods tracked: client_approval, auto_release, admin_release

**Security**:
- Payment held in escrow until approval
- RLS policies enforce access control
- Admin-only manual release capability
- Audit trail of all release methods

## Checklist
- [x] Phase 1: Add database columns (payment_status, client_approval_deadline, auto_release_eligible_at, payment_captured_at, escrow_released_method)
- [x] Phase 2: Update Stripe integration to use manual capture
- [x] Phase 3: Build client approval UI with countdown timer
- [x] Phase 4: Create auto-release Edge Function with configurable window
- [x] Phase 5: Add RLS policies for new escrow columns
- [x] Phase 6: Build admin escrow management dashboard
- [x] Update all Stripe API versions to 2025-02-24.acacia
- [x] Add Stripe secret to Edge Function environment
- [x] Create comprehensive testing guide

## Acceptance
- Payment is authorized but not captured on checkout completion
- Client sees approval card with countdown on /contracts page
- Auto-release Edge Function processes eligible contracts after window expires
- Admin can manually release any held payment via /muna/escrow-management
- All three release methods (client_approval, auto_release, admin_release) are tracked in database