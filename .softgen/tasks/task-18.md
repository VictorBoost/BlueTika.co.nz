---
title: Create MonaLisa AI Admin Agent
status: done
priority: high
type: feature
tags: [bot, admin, monitoring]
created_by: agent
created_at: 2026-04-17T22:43:33Z
position: 18
---

## Notes
MonaLisa is a special AI admin agent that works independently of the general kill switch. Only the owner can control it with a dedicated toggle button. It monitors posts, contracts, and system health, providing reports and suggestions.

**Requirements:**
- Independent from general kill switch
- Owner-only control via "MonaLisa button"
- Monitors posts and contracts for issues
- Flags users if auto-moderation missed something
- Checks system health and provides suggestions
- Logs all activities visible in /muna

## Checklist
- [x] Create monalisa_logs table for activity logs
- [x] Create monalisa_settings table for on/off status
- [x] Create monalisa-agent Edge Function (scheduled checks)
- [x] Create monalisaService.ts for client operations
- [x] Create MonaLisa control panel UI in /muna/index.tsx
- [x] Add MonaLisa logs page at /muna/monalisa-logs.tsx
- [x] Add owner-only toggle with visual indicator