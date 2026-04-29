-- Create policy for authenticated role
CREATE POLICY "profiles_select_authenticated" 
ON profiles
FOR SELECT
TO authenticated
USING (true);