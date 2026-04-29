-- STAGE 2 - Batch 8: email_logs
DROP POLICY IF EXISTS "Public email_logs are viewable by everyone" ON email_logs;
CREATE POLICY "Public email_logs are viewable by everyone" 
ON email_logs
FOR SELECT 
TO authenticated, public
USING (true);