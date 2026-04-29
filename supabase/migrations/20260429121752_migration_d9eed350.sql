-- Fix credit_transactions table
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit transactions
CREATE POLICY "users_view_own_credits" ON credit_transactions
  FOR SELECT
  USING (auth.uid() = owner_id);

-- System can create/update credit transactions
CREATE POLICY "system_manage_credits" ON credit_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);