-- Fix auth_audit_logs table (sensitive login data)
ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Owner can view all auth audit logs
CREATE POLICY "owner_view_auth_logs" ON auth_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'bluetikanz@gmail.com'
    )
  );

-- System can create audit logs
CREATE POLICY "system_create_auth_logs" ON auth_audit_logs
  FOR INSERT
  WITH CHECK (true);