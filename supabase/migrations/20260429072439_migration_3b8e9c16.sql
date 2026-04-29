-- STAGE 2 - Batch 3: commission_settings
DROP POLICY IF EXISTS "Public commission_settings are viewable by everyone" ON commission_settings;
CREATE POLICY "Public commission_settings are viewable by everyone" 
ON commission_settings
FOR SELECT 
TO authenticated, public
USING (true);