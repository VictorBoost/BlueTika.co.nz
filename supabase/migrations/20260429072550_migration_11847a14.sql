-- STAGE 2 - Batch 7: disputes
DROP POLICY IF EXISTS "Public disputes are viewable by everyone" ON disputes;
CREATE POLICY "Public disputes are viewable by everyone" 
ON disputes
FOR SELECT 
TO authenticated, public
USING (true);