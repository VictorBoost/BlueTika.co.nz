-- Add Google Calendar OAuth fields to profiles
ALTER TABLE profiles
ADD COLUMN google_calendar_access_token TEXT,
ADD COLUMN google_calendar_refresh_token TEXT,
ADD COLUMN google_calendar_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Add google_calendar_event_id to contracts for tracking
ALTER TABLE contracts
ADD COLUMN google_calendar_event_id TEXT;

-- Add google_calendar_event_id to routine_bookings for tracking
ALTER TABLE routine_bookings
ADD COLUMN google_calendar_event_id TEXT;

COMMENT ON COLUMN profiles.google_calendar_access_token IS 'Google Calendar OAuth2 access token';
COMMENT ON COLUMN profiles.google_calendar_refresh_token IS 'Google Calendar OAuth2 refresh token';
COMMENT ON COLUMN profiles.google_calendar_token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN contracts.google_calendar_event_id IS 'Google Calendar event ID for this contract';
COMMENT ON COLUMN routine_bookings.google_calendar_event_id IS 'Google Calendar event ID for this booking session';