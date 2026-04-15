---
title: Routine Contracts System
status: done
priority: high
type: feature
tags: [backend, frontend, automation, email]
created_by: agent
created_at: 2026-04-15T23:40:00Z
position: 7
---

## Notes

Complete routine contracts system implemented with:
- Post-review prompt to both parties offering routine arrangements
- Frequency selection (Weekly, Fortnightly, Monthly, Custom days)
- Day-of-week selection for Domestic Helper services
- Pre-booking up to 8 weeks for Domestic Helper listings
- Automated contract creation on scheduled dates
- 48-hour reminder system (email + notification)
- Google Calendar integration for each session
- Pause/cancel controls in dashboard
- Admin panel showing active routines + recurring revenue

Technical implementation:
- Database: routine_contracts + routine_bookings tables with RLS
- Email: Amazon SES templates for invitations + reminders
- Edge Function: send-routine-reminders (cron job for 48h reminders)
- Services: routineContractService, updated notificationService
- Components: RoutineContractPrompt modal
- Admin: routine-contracts.tsx dashboard

## Checklist

- [x] Create routine_contracts table (tracks ongoing arrangements)
- [x] Create routine_bookings table (tracks individual sessions)
- [x] Build routineContractService with create/pause/cancel/revenue methods
- [x] Add email templates (invitation + 48h reminder) to sesEmailService
- [x] Create RoutineContractPrompt component (frequency, days, start date)
- [x] Update ReviewSubmissionModal to trigger prompt after both reviews
- [x] Add pre-booking fields to post-project.tsx (Domestic Helper only)
- [x] Deploy send-routine-reminders Edge Function (cron job)
- [x] Create admin/routine-contracts.tsx dashboard (list + revenue)
- [x] Add routine tab to contracts.tsx (view/pause/cancel)
- [x] Integrate Google Calendar sync for each session
- [x] Test complete flow: review → prompt → create → reminder → calendar