---
title: Project Marketplace & Bidding System
status: todo
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
- [ ] Create projects.tsx: browse all open projects, filter by category/location
- [ ] Create ProjectCard component: title, description, budget, location, bid count
- [ ] Create post-project.tsx: form for clients to create new projects
- [ ] Create project/[id].tsx: single project view with bid submission form for providers
- [ ] Create BidCard component: provider name, amount, message, accept button for project owner
- [ ] Create contracts.tsx: view active contracts, track status
- [ ] Create projectService.ts and bidService.ts for database operations
- [ ] Add GST toggle field to settings (disabled by default, ready for future)