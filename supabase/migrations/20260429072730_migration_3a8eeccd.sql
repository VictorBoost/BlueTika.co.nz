-- STAGE 2 - Batch 13: routine_contracts (2 policies)
DROP POLICY IF EXISTS "Public routine_contracts are viewable by everyone" ON routine_contracts;
CREATE POLICY "Public routine_contracts are viewable by everyone" 
ON routine_contracts
FOR SELECT 
TO authenticated, public
USING (true);

DROP POLICY IF EXISTS "Users can view routine_contracts they're involved in" ON routine_contracts;
CREATE POLICY "Users can view routine_contracts they're involved in" 
ON routine_contracts
FOR SELECT 
TO authenticated, public
USING (client_id = auth.uid() OR provider_id = auth.uid());