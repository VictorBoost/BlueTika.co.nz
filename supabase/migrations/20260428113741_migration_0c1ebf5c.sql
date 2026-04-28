-- Create payment_tracking table for immutable financial audit trail
CREATE TABLE IF NOT EXISTS payment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount_nzd DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_processing_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_payment', 'captured', 'released', 'refunded', 'failed')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT,
  refund_reason TEXT,
  release_method TEXT CHECK (release_method IN ('client_approval', 'auto_release', 'admin_release')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  captured_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_tracking_contract_id ON payment_tracking(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_client_id ON payment_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_provider_id ON payment_tracking(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_status ON payment_tracking(status);
CREATE INDEX IF NOT EXISTS idx_payment_tracking_stripe_payment_intent_id ON payment_tracking(stripe_payment_intent_id);

-- RLS Policies
ALTER TABLE payment_tracking ENABLE ROW LEVEL SECURITY;

-- Clients can view their own payments
CREATE POLICY "clients_view_own_payments" ON payment_tracking
  FOR SELECT USING (auth.uid() = client_id);

-- Providers can view their own payments
CREATE POLICY "providers_view_own_payments" ON payment_tracking
  FOR SELECT USING (auth.uid() = provider_id);

-- System can insert payment records
CREATE POLICY "system_insert_payments" ON payment_tracking
  FOR INSERT WITH CHECK (true);

-- System can update payment records
CREATE POLICY "system_update_payments" ON payment_tracking
  FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_payment_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_tracking_updated_at
  BEFORE UPDATE ON payment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_tracking_updated_at();