---
title: Add schema.org JSON-LD to project pages
status: done
priority: medium
type: feature
tags: [seo, schema, structured-data]
created_by: agent
created_at: 2026-04-25T19:23:13Z
position: 22
---

## Notes
Add schema.org structured data to project detail pages for better search engine understanding and rich snippets.

Schema types to implement:
- Service schema for project details
- Review schema for project reviews
- Organization schema for BlueTika
- BreadcrumbList for navigation

## Checklist
- [x] Create schema.org JSON-LD generator utility
- [x] Add Service schema to project pages
- [x] Add Review/AggregateRating schema when reviews exist
- [x] Add Organization schema
- [x] Add BreadcrumbList schema
- [x] Test with Google's Rich Results Test

## Acceptance
- Project pages have valid schema.org markup
- Schema validates in Google Rich Results Test
- Breadcrumbs appear in search results