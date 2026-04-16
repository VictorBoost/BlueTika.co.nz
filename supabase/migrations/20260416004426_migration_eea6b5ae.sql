-- Table to track bypass attempts and account suspension status
CREATE TABLE bypass_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_attempted TEXT NOT NULL,
  detected_patterns TEXT[] NOT NULL,
  page_location TEXT NOT NULL,
  escalation_level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bypass_attempts_user ON bypass_attempts(user_id);
CREATE INDEX idx_bypass_attempts_created ON bypass_attempts(created_at DESC);

COMMENT ON TABLE bypass_attempts IS 'Tracks all attempts to share personal contact information on the platform';

-- Table to track account suspension status
CREATE TABLE account_suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suspension_type TEXT NOT NULL CHECK (suspension_type IN ('warning', 'chat_suspended', 'auto_suspended', 'permanently_banned')),
  bypass_attempt_count INTEGER NOT NULL DEFAULT 0,
  suspension_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  suspension_ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_account_suspensions_user ON account_suspensions(user_id);
CREATE INDEX idx_account_suspensions_active ON account_suspensions(user_id, is_active);

COMMENT ON TABLE account_suspensions IS 'Tracks account suspension status for bypass protection violations';

-- RLS Policies
ALTER TABLE bypass_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_suspensions ENABLE ROW LEVEL SECURITY;

-- Admin can view all bypass attempts
CREATE POLICY "admin_view_all_bypass_attempts" ON bypass_attempts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- System can create bypass attempts
CREATE POLICY "system_create_bypass_attempts" ON bypass_attempts
  FOR INSERT WITH CHECK (true);

-- Admin can view all suspensions
CREATE POLICY "admin_view_all_suspensions" ON account_suspensions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- Admin can manage suspensions
CREATE POLICY "admin_manage_suspensions" ON account_suspensions
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- Users can view their own suspension status
CREATE POLICY "users_view_own_suspensions" ON account_suspensions
  FOR SELECT USING (auth.uid() = user_id);

-- System can create/update suspensions
CREATE POLICY "system_manage_suspensions" ON account_suspensions
  FOR ALL WITH CHECK (true);