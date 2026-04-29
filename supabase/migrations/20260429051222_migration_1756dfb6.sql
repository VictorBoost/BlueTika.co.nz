-- Create separate policy for public role
CREATE POLICY "profiles_select_public" 
ON profiles
FOR SELECT
TO public
USING (true);