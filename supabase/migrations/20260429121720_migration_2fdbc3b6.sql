-- Fix bot_configuration table
ALTER TABLE bot_configuration ENABLE ROW LEVEL SECURITY;

-- Drop existing policy
DROP POLICY IF EXISTS "admin_select_bot_configuration" ON bot_configuration;

-- Owner can read and update bot configuration
CREATE POLICY "owner_manage_bot_config" ON bot_configuration
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

-- System/service role can still read (for Edge Functions)
CREATE POLICY "service_role_bot_config" ON bot_configuration
  FOR SELECT
  USING (auth.role() = 'service_role');