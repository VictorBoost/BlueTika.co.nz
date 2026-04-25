---
title: Auto-generate SEO metadata for projects
status: in_progress
priority: high
type: feature
tags: [seo, metadata, projects]
created_by: agent
created_at: 2026-04-25T19:23:13Z
position: 20
---

## Notes
Automatically generate SEO metadata for all projects based on their details:
- meta_title format: "{Category} in {Location}"
- meta_description format: "{Description} in {Location}. Budget ${Budget}. Verified local. Hire on BlueTika."
- meta_keywords format: "{Category}, {Location}, NZ, hire, local"

## Checklist
- [x] Add metadata columns to projects table (meta_title, meta_description, meta_keywords)
- [x] Create function to auto-generate metadata on project creation
- [x] Create function to backfill existing projects
- [x] Update project service to handle metadata
- [x] Update project detail page to use metadata in SEO component

## Acceptance
- All new projects automatically have SEO metadata
- Existing projects have backfilled metadata
- Project pages show correct meta tags in HTML head