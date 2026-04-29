-- STAGE 2 - Batch 10: moderation_settings
DROP POLICY IF EXISTS "Public moderation_settings are viewable by everyone" ON moderation_settings;
CREATE POLICY "Public moderation_settings are viewable by everyone" 
ON moderation_settings
FOR SELECT 
TO authenticated, public
USING (true);