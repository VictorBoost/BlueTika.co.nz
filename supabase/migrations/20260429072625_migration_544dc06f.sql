-- STAGE 2 - Batch 9: fund_releases
DROP POLICY IF EXISTS "Public fund_releases are viewable by everyone" ON fund_releases;
CREATE POLICY "Public fund_releases are viewable by everyone" 
ON fund_releases
FOR SELECT 
TO authenticated, public
USING (true);