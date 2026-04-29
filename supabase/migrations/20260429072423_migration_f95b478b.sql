-- STAGE 2 - Batch 2: categories
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON categories;
CREATE POLICY "Public categories are viewable by everyone" 
ON categories
FOR SELECT 
TO authenticated, public
USING (true);