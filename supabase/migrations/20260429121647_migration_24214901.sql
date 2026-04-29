-- Fix bot_activity_logs table
ALTER TABLE bot_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public bot_activity_logs are viewable by everyone" ON bot_activity_logs;
DROP POLICY IF EXISTS "admin_view_bot_logs" ON bot_activity_logs;
DROP POLICY IF EXISTS "system_create_bot_logs" ON bot_activity_logs;

-- Owner can view all logs
CREATE POLICY "owner_view_bot_logs" ON bot_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'bluetikanz@gmail.com'
    )
  );

-- System can create logs (for automated bot tracking)
CREATE POLICY "system_create_bot_logs" ON bot_activity_logs
  FOR INSERT
  WITH CHECK (true);