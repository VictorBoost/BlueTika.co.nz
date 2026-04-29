-- STAGE 2 - Batch 15: subcategories
DROP POLICY IF EXISTS "Public subcategories are viewable by everyone" ON subcategories;
CREATE POLICY "Public subcategories are viewable by everyone" 
ON subcategories
FOR SELECT 
TO authenticated, public
USING (true);