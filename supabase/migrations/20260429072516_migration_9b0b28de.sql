-- STAGE 2 - Batch 5: directory_categories
DROP POLICY IF EXISTS "Public directory_categories are viewable by everyone" ON directory_categories;
CREATE POLICY "Public directory_categories are viewable by everyone" 
ON directory_categories
FOR SELECT 
TO authenticated, public
USING (true);