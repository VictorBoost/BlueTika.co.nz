-- Drop and recreate the admin policy for authenticated role
DROP POLICY IF EXISTS admin_view_all_documents ON verification_documents;

CREATE POLICY admin_view_all_documents ON verification_documents
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email = 'bluetikanz@gmail.com'
    )
  );