-- Drop and recreate the policy with both authenticated and public roles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles
FOR SELECT
TO authenticated, public
USING (true);