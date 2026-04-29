-- STAGE 3 - Fix bot_accounts admin policy email pattern
DROP POLICY IF EXISTS "admin_manage_bot_accounts" ON bot_accounts;