-- STAGE 2 - Batch 1: bot_activity_logs
DROP POLICY IF EXISTS "Public bot_activity_logs are viewable by everyone" ON bot_activity_logs;
CREATE POLICY "Public bot_activity_logs are viewable by everyone" 
ON bot_activity_logs
FOR SELECT 
TO authenticated, public
USING (true);