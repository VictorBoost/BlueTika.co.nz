---
title: Database schema for business directory
status: in_progress
priority: urgent
type: feature
tags: [database, directory]
created_by: agent
created_at: 2026-04-16T10:13:53Z
position: 14
---

## Notes
Create database tables for the business directory feature:
- directory_categories table (owner-managed category list)
- directory_listings table (business listings with all fields)
- directory_analytics table (track click-throughs from directory to marketplace)

All tables need RLS policies. Directory browsing is public, but creating/claiming requires auth.

## Checklist
- [x] Create directory_categories table with name, slug, description, display_order
- [x] Create directory_listings table with business_name, category_id FK, city, description (max 300), phone, website, photos array, featured flag, provider_id FK (nullable), slug (unique), claimed_by FK (nullable)
- [x] Create directory_analytics table to track directory → post project conversions
- [x] Add RLS policies: public read, auth required for insert/update, owner can manage own listings
- [x] Add check constraint for description length (300 chars max)