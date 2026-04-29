-- STAGE 2 - Batch 11: monalisa_logs
DROP POLICY IF EXISTS "Public monalisa_logs are viewable by everyone" ON monalisa_logs;
CREATE POLICY "Public monalisa_logs are viewable by everyone" 
ON monalisa_logs
FOR SELECT 
TO authenticated, public
USING (true);