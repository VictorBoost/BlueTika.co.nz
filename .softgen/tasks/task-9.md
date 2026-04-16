---
title: Staff Management System
status: todo
priority: high
type: feature
tags: [muna, staff, auth]
created_by: agent
created_at: 2026-04-16T07:48:13Z
position: 9
---

## Notes
Complete staff management system with role-based access control. Owner creates staff accounts with specific roles (Verifier, Support, Finance, Moderator). Staff log in at /muna/staff with limited access based on role.

Requirements:
- Database: staff table, staff_audit_logs table
- Staff roles: Verifier, Support, Finance, Moderator (each with specific permissions)
- Owner dashboard: create staff, view audit log, deactivate accounts
- Staff login page at /muna/staff
- Full audit logging of all staff actions

## Checklist
- [ ] Create staff table (id, name, email, role, is_active, created_by, created_at)
- [ ] Create staff_audit_logs table (id, staff_id, action, record_type, record_id, details, timestamp)
- [ ] Create staffService.ts with CRUD operations and audit logging
- [ ] Create /muna/staff-management.tsx page for owner
- [ ] Create /muna/staff.tsx login and dashboard page for staff
- [ ] Add role-based route protection to existing muna pages
- [ ] Implement audit log viewer on staff-management page
- [ ] Test all roles and permissions