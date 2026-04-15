---
title: Project Marketplace & Bidding System
status: done
priority: high
type: feature
tags: [marketplace, database]
created_by: agent
created_at: 2026-04-15T00:44:18Z
position: 4
---

## Notes
Build project marketplace for browsing and posting projects, bidding interface for service providers, and contract creation when bid is accepted. All prices in NZD. GST toggle ready but disabled.

## Checklist
- [x] Create projects.tsx: browse all open projects, filter by category/location
- [x] Create ProjectCard component: title, description, budget, location, bid count
- [x] Create post-project.tsx: form for clients to create new projects
- [x] Create project/[id].tsx: single project view with bid submission form for providers
- [x] Create BidCard component: provider name, amount, message, accept button for project owner
- [x] Create contracts.tsx: view active contracts, track status
- [x] Create projectService.ts and bidService.ts for database operations
- [x] Add GST toggle field to settings (disabled by default, ready for future)