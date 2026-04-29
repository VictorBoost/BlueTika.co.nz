-- Fix user_nz table (sensitive user data)
ALTER TABLE user_nz ENABLE ROW LEVEL SECURITY;

-- No public access - this is an internal table
-- System/service role only
CREATE POLICY "service_role_user_nz" ON user_nz
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');