-- Create table for MonaLisa error findings
-- This table stores all detected errors, loopholes, and issues for analysis

CREATE TABLE IF NOT EXISTS monalisa_error_findings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  evidence jsonb,
  suggested_fix text,
  status text NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'fixing', 'resolved')),
  detected_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  related_user_id uuid REFERENCES profiles(id),
  related_contract_id uuid REFERENCES contracts(id),
  related_project_id uuid REFERENCES projects(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE monalisa_error_findings ENABLE ROW LEVEL SECURITY;

-- Admin can view all findings
CREATE POLICY "admin_view_findings" ON monalisa_error_findings
  FOR SELECT USING (auth.role() = 'service_role');

-- Admin can insert findings
CREATE POLICY "admin_insert_findings" ON monalisa_error_findings
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Admin can update findings
CREATE POLICY "admin_update_findings" ON monalisa_error_findings
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monalisa_findings_category ON monalisa_error_findings(category);
CREATE INDEX IF NOT EXISTS idx_monalisa_findings_severity ON monalisa_error_findings(severity);
CREATE INDEX IF NOT EXISTS idx_monalisa_findings_status ON monalisa_error_findings(status);
CREATE INDEX IF NOT EXISTS idx_monalisa_findings_detected_at ON monalisa_error_findings(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_monalisa_findings_contract_id ON monalisa_error_findings(related_contract_id);
CREATE INDEX IF NOT EXISTS idx_monalisa_findings_user_id ON monalisa_error_findings(related_user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_monalisa_findings_updated_at ON monalisa_error_findings;
CREATE TRIGGER update_monalisa_findings_updated_at
  BEFORE UPDATE ON monalisa_error_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();