---
title: Settings Dashboard with Full Editability
status: done
priority: high
type: feature
tags: [muna, settings, configuration]
created_by: agent
created_at: 2026-04-16T07:48:13Z
position: 10
---

## Notes
Create a comprehensive Settings page at /muna/settings where the owner can edit all platform configuration without code changes. All settings must be persisted to the database and immediately reflected across the platform.

Requirements:
- Commission rates per tier + promo toggle
- Tier thresholds in NZD
- Client platform fee percentage
- Stripe processing contributions (domestic/international)
- GST toggle and percentage
- Subscription prices (editable)
- Category manager (add/edit/delete/reorder)
- Moderation switches
- Email log viewer (Amazon SES)

## Checklist
- [x] Create platform_settings table (id, key, value JSONB, updated_at)
- [x] Create email_logs table (id, recipient, subject, body_preview, message_id, delivery_status, created_at)
- [x] Create settingsService.ts with get/update methods for all setting types
- [x] Create /muna/settings.tsx page with 5 tabs (Commission, Fees & GST, Subscriptions, Categories, Email Logs)
- [x] Build Commission tab: editable rates + thresholds + promo toggle
- [x] Build Fees & GST tab: platform fee, Stripe contributions, GST toggle + percentage
- [x] Build Subscriptions tab: editable pricing for logo removal, email hosting, custom URL, additional staff + moderation switches
- [x] Build Categories tab: add/edit/delete categories with inline UI
- [x] Build Email Logs tab: table showing all Amazon SES emails with status
- [x] Connect all forms to settingsService instead of hardcoded values
- [x] Test all settings changes reflect immediately across the platform