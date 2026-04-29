-- STAGE 1 - Step 2: Create SELECT policy for bot_accounts
CREATE POLICY "admin_select_bot_accounts" 
ON bot_accounts
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'bluetikanz@gmail.com'
  )
);