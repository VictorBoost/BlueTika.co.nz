-- Add cancellation_requests table for tracking contract cancellation requests
CREATE TABLE IF NOT EXISTS cancellation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_role TEXT NOT NULL CHECK (requester_role IN ('client', 'provider')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_note TEXT,
  auto_approval_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_cancellation_requests_contract ON cancellation_requests(contract_id);
CREATE INDEX idx_cancellation_requests_status ON cancellation_requests(status);
CREATE INDEX idx_cancellation_requests_deadline ON cancellation_requests(auto_approval_deadline);

-- Add RLS policies
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Both parties can view cancellation requests for their contracts
CREATE POLICY "parties_view_cancellation_requests" ON cancellation_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT client_id FROM contracts WHERE id = cancellation_requests.contract_id
      UNION
      SELECT provider_id FROM contracts WHERE id = cancellation_requests.contract_id
    )
  );

-- Either party can create a cancellation request
CREATE POLICY "parties_create_cancellation_requests" ON cancellation_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id AND
    auth.uid() IN (
      SELECT client_id FROM contracts WHERE id = cancellation_requests.contract_id
      UNION
      SELECT provider_id FROM contracts WHERE id = cancellation_requests.contract_id
    )
  );

-- Either party can respond to a cancellation request (update)
CREATE POLICY "parties_respond_cancellation_requests" ON cancellation_requests
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT client_id FROM contracts WHERE id = cancellation_requests.contract_id
      UNION
      SELECT provider_id FROM contracts WHERE id = cancellation_requests.contract_id
    )
  );

-- Add admin access for managing cancellation requests
CREATE POLICY "admin_manage_cancellation_requests" ON cancellation_requests
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- Add status column to projects for archiving (if not exists with all needed values)
DO $$
BEGIN
  -- Check if we need to update the constraint to include 'draft' and 'archived'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_status_check'
    AND pg_get_constraintdef(oid) LIKE '%draft%'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
    
    -- Add new constraint with all status values
    ALTER TABLE projects ADD CONSTRAINT projects_status_check 
      CHECK (status IN ('draft', 'open', 'assigned', 'completed', 'cancelled', 'archived', 'expired'));
  END IF;
END $$;

-- Add deadline column to projects for expiration calculation
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Update existing projects to set deadline based on date preferences
UPDATE projects 
SET deadline = CASE
  WHEN date_preference = 'specific_date' AND specific_date IS NOT NULL THEN specific_date::timestamp
  WHEN date_preference = 'date_range' AND date_to IS NOT NULL THEN date_to::timestamp
  ELSE (created_at + INTERVAL '30 days')
END
WHERE deadline IS NULL;

COMMENT ON TABLE cancellation_requests IS 'Tracks cancellation requests with 48-hour auto-approval window';
COMMENT ON COLUMN projects.deadline IS 'Project deadline for expiration calculation (7 days after this date for unassigned projects)';