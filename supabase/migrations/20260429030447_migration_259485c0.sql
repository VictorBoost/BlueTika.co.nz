-- Fix RLS policies for verification_documents table
-- Allow providers to upload their own verification documents
CREATE POLICY "providers_insert_own_documents" ON verification_documents
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

-- Allow providers to view their own documents  
CREATE POLICY "providers_view_own_documents" ON verification_documents
  FOR SELECT USING (auth.uid() = provider_id);

-- Allow admins to view all documents
CREATE POLICY "admin_view_all_documents" ON verification_documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- Allow system to update document status (for AI auto-approve)
CREATE POLICY "system_update_documents" ON verification_documents
  FOR UPDATE USING (true);