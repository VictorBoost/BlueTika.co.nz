-- STAGE 2 - Batch 12: reports (2 policies)
DROP POLICY IF EXISTS "Public reports are viewable by everyone" ON reports;
CREATE POLICY "Public reports are viewable by everyone" 
ON reports
FOR SELECT 
TO authenticated, public
USING (true);

DROP POLICY IF EXISTS "Reporters can view their reports" ON reports;
CREATE POLICY "Reporters can view their reports" 
ON reports
FOR SELECT 
TO authenticated, public
USING (reporter_id = auth.uid());