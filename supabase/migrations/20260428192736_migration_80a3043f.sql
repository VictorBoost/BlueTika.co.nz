-- DISABLE RLS ON BOT-RELATED TABLES
-- This allows the web UI to read/write bot configuration and activity

-- 1. Disable RLS on bot_configuration (main config table)
ALTER TABLE bot_configuration DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on bot_accounts (bot user accounts)
ALTER TABLE bot_accounts DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on bot_activity_logs (activity tracking)
ALTER TABLE bot_activity_logs DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on bot_bypass_attempts (bypass detection logs)
ALTER TABLE bot_bypass_attempts DISABLE ROW LEVEL SECURITY;

-- Verification: These tables can now be accessed by any authenticated user
-- The Edge Function already uses SERVICE_ROLE_KEY so it bypasses RLS anyway
-- This change is for the web UI (/muna/bot-config page)