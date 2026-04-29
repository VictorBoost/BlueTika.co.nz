-- STAGE 2 - Batch 14: staff_members
DROP POLICY IF EXISTS "Public staff_members are viewable by everyone" ON staff_members;
CREATE POLICY "Public staff_members are viewable by everyone" 
ON staff_members
FOR SELECT 
TO authenticated, public
USING (true);