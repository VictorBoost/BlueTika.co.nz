-- Create new policy with both authenticated and public roles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles
FOR SELECT
TO authenticated, public
USING (true);