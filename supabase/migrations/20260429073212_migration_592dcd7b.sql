-- STAGE 3 - Create new admin policy with correct email
CREATE POLICY "admin_manage_bot_accounts"
ON bot_accounts
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'bluetikanz@gmail.com'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE email = 'bluetikanz@gmail.com'
  )
);