-- Create contract_messages table for bot chat (if not exists)
CREATE TABLE IF NOT EXISTS contract_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contract_messages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "public_read_contract_messages" ON contract_messages;
CREATE POLICY "public_read_contract_messages" ON contract_messages 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_can_send_messages" ON contract_messages;
CREATE POLICY "users_can_send_messages" ON contract_messages 
  FOR INSERT WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_contract_messages_contract 
  ON contract_messages(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_messages_flagged 
  ON contract_messages(is_flagged) WHERE is_flagged = true;

-- Verify table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'contract_messages';