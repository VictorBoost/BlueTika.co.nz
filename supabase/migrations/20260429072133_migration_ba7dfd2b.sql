-- STAGE 1 - Step 3: Create SELECT policy for bot_configuration
CREATE POLICY "admin_select_bot_configuration" 
ON bot_configuration
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'bluetikanz@gmail.com'
  )
);