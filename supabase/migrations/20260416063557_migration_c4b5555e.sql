-- Add AI verification and privacy columns to verification_documents
ALTER TABLE verification_documents
ADD COLUMN IF NOT EXISTS ai_confidence_score numeric(5,2),
ADD COLUMN IF NOT EXISTS ai_scan_result text,
ADD COLUMN IF NOT EXISTS ai_scan_reason text,
ADD COLUMN IF NOT EXISTS auto_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scanned_at timestamp with time zone;

-- Add privacy control to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_verified_publicly boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_credentials_to_clients boolean DEFAULT false;

-- Create verification_logs table for audit trail
CREATE TABLE IF NOT EXISTS verification_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id uuid REFERENCES verification_documents(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  action text NOT NULL, -- 'ai_scan', 'auto_approve', 'manual_approve', 'reject'
  confidence_score numeric(5,2),
  decision_maker text, -- 'ai', 'admin', 'system'
  admin_id uuid REFERENCES profiles(id),
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for verification_logs
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_view_all_logs ON verification_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

CREATE POLICY system_create_logs ON verification_logs
  FOR INSERT
  WITH CHECK (true);

-- Create government_verification_api table (singleton for future API integration)
CREATE TABLE IF NOT EXISTS government_verification_api (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  enabled boolean DEFAULT false,
  api_endpoint_url text,
  api_key text,
  last_tested_at timestamp with time zone,
  test_status text, -- 'not_tested', 'success', 'failed'
  test_error_message text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Insert default government API settings
INSERT INTO government_verification_api (id, enabled, test_status)
VALUES ('00000000-0000-0000-0000-000000000000', false, 'not_tested')
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for government_verification_api
ALTER TABLE government_verification_api ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_gov_api ON government_verification_api
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_provider ON verification_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_document ON verification_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created ON verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_documents_confidence ON verification_documents(ai_confidence_score);
CREATE INDEX IF NOT EXISTS idx_verification_documents_status ON verification_documents(status);