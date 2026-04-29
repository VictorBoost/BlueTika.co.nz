-- STAGE 2 - Batch 4: commission_tiers
DROP POLICY IF EXISTS "Public commission_tiers are viewable by everyone" ON commission_tiers;
CREATE POLICY "Public commission_tiers are viewable by everyone" 
ON commission_tiers
FOR SELECT 
TO authenticated, public
USING (true);