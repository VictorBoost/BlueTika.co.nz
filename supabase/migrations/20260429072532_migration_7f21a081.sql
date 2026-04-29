-- STAGE 2 - Batch 6: directory_listings
DROP POLICY IF EXISTS "Public directory_listings are viewable by everyone" ON directory_listings;
CREATE POLICY "Public directory_listings are viewable by everyone" 
ON directory_listings
FOR SELECT 
TO authenticated, public
USING (true);