-- Add dispute and fund release tracking to contracts
ALTER TABLE contracts
ADD COLUMN work_done_at timestamp with time zone,
ADD COLUMN after_photos_submitted_at timestamp with time zone,
ADD COLUMN client_dispute_deadline timestamp with time zone,
ADD COLUMN provider_dispute_deadline timestamp with time zone,
ADD COLUMN ready_for_release_at timestamp with time zone,
ADD COLUMN funds_released_at timestamp with time zone,
ADD COLUMN released_by uuid REFERENCES profiles(id);

-- Drop old constraint and add new one with additional statuses
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
CHECK (status IN ('active', 'completed', 'awaiting_fund_release', 'dispute', 'funds_released', 'cancelled'));

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  raiser_role text NOT NULL CHECK (raiser_role IN ('client', 'provider')),
  claim_description text NOT NULL,
  resolution_type text CHECK (resolution_type IN ('release_to_provider', 'refund_to_client', 'partial_split')),
  resolution_reason text,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamp with time zone,
  client_refund_amount numeric,
  provider_payout_amount numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create fund_releases table for tracking
CREATE TABLE IF NOT EXISTS fund_releases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE UNIQUE,
  agreed_price numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  net_to_provider numeric NOT NULL,
  released_by uuid NOT NULL REFERENCES profiles(id),
  release_type text NOT NULL CHECK (release_type IN ('normal', 'dispute_resolution')),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS for disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_disputes" ON disputes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM contracts WHERE id = contract_id
      UNION
      SELECT provider_id FROM contracts WHERE id = contract_id
    )
  );

CREATE POLICY "users_create_disputes" ON disputes
  FOR INSERT WITH CHECK (
    auth.uid() = raised_by AND
    auth.uid() IN (
      SELECT client_id FROM contracts WHERE id = contract_id
      UNION
      SELECT provider_id FROM contracts WHERE id = contract_id
    )
  );

CREATE POLICY "admin_manage_disputes" ON disputes
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- RLS for fund_releases
ALTER TABLE fund_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_releases" ON fund_releases
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

CREATE POLICY "users_view_own_releases" ON fund_releases
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM contracts WHERE id = contract_id
      UNION
      SELECT provider_id FROM contracts WHERE id = contract_id
    )
  );

-- Create indexes
CREATE INDEX idx_disputes_contract ON disputes(contract_id);
CREATE INDEX idx_disputes_status ON disputes(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_fund_releases_contract ON fund_releases(contract_id);
CREATE INDEX idx_contracts_release_queue ON contracts(ready_for_release_at) WHERE ready_for_release_at IS NOT NULL;

COMMENT ON TABLE disputes IS 'Dispute records when clients or providers contest contract completion';
COMMENT ON TABLE fund_releases IS 'Fund release records tracking commission calculations and payouts';