-- Fix admin RLS policy to allow bluetikanz@gmail.com specifically
DROP POLICY IF EXISTS admin_view_all_documents ON verification_documents;

CREATE POLICY "admin_view_all_documents" ON verification_documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email = 'bluetikanz@gmail.com'
    )
  );