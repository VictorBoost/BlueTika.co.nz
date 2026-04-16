---
title: Settings Dashboard with Full Editability
status: todo
priority: high
type: feature
tags: [muna, settings, admin]
created_by: agent
created_at: 2026-04-16T07:48:13Z
position: 10
---

## Notes
Complete settings dashboard where owner can edit all platform configuration without code changes. All settings stored in database with real-time updates across the platform.

Settings to make editable:
- Commission rates per tier + promo toggle
- Commission tier thresholds (NZD)
- Client platform fee (currently 2%)
- Stripe processing contributions (domestic/international cards)
- GST toggle and percentage
- Subscription prices (logo removal, email hosting, custom URL, staff member)
- Category manager (add/edit/remove/reorder categories and subcategories)
- Moderation switches
- Email log viewer (all SES emails with status)

## Checklist
- [ ] Create platform_settings table with key-value pairs and metadata
- [ ] Create settingsService.ts for CRUD operations on platform settings
- [ ] Create /muna/settings.tsx page with organized sections
- [ ] Build commission rates editor with tier thresholds and promo toggle
- [ ] Build fees editor (client platform fee, Stripe contributions, GST)
- [ ] Build subscription prices editor with special pricing indicator
- [ ] Build category manager with add/edit/remove/reorder functionality
- [ ] Build moderation switches panel
- [ ] Build email log viewer with filtering and status display
- [ ] Update all services to read from platform_settings instead of hardcoded values
- [ ] Test all settings changes reflect immediately across the platform