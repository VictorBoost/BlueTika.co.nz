-- Fix bot_bypass_attempts table
ALTER TABLE bot_bypass_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "owner_view_bypass_attempts" ON bot_bypass_attempts;
DROP POLICY IF EXISTS "system_create_bypass_logs" ON bot_bypass_attempts;

-- Owner can view all bypass attempts
CREATE POLICY "owner_view_bypass_attempts" ON bot_bypass_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'bluetikanz@gmail.com'
    )
  );

-- System can create bypass logs
CREATE POLICY "system_create_bypass_logs" ON bot_bypass_attempts
  FOR INSERT
  WITH CHECK (true);