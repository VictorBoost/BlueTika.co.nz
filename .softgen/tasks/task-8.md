---
title: Trust and Safety Section Enhancement
status: todo
priority: high
type: feature
tags: [muna, trust-and-safety]
created_by: agent
created_at: 2026-04-16T07:48:13Z
position: 8
---

## Notes
Enhance the existing Trust and Safety page at /muna/trust-and-safety with three comprehensive tabs. All data is already being logged; this task surfaces it for admin review and action.

Requirements:
- Tab 1: Bypass Attempts - view all content safety bypass attempts with quick actions
- Tab 2: Reports - view all user-submitted reports with resolution actions
- Tab 3: Banned Accounts - view all banned users with unban option

## Checklist
- [ ] Add tab navigation to trust-and-safety.tsx (Bypass Attempts, Reports, Banned Accounts)
- [ ] Build Bypass Attempts tab: table with user, content, page, date, escalation level, actions (Warn, Suspend 24hr, Ban, Clear flag)
- [ ] Build Reports tab: table with reporter, reported party, reason, date, status, actions (Resolve, Remove listing, Warn user, Suspend, Ban)
- [ ] Build Banned Accounts tab: table with user, reason, date, banned by, unban action
- [ ] Connect to existing contentSafetyService and reportService
- [ ] Test all quick actions and ensure they work correctly