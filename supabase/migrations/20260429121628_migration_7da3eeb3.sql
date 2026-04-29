-- Fix bot_accounts table
ALTER TABLE bot_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "admin_manage_bot_accounts" ON bot_accounts;
DROP POLICY IF EXISTS "admin_select_bot_accounts" ON bot_accounts;
DROP POLICY IF EXISTS "service_role_all" ON bot_accounts;

-- Owner-only access policy
CREATE POLICY "owner_full_access_bot_accounts" ON bot_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'bluetikanz@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'bluetikanz@gmail.com'
    )
  );
  
-- System/service role can still manage (for Edge Functions)
CREATE POLICY "service_role_bot_accounts" ON bot_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');