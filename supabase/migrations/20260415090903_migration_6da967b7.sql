-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification documents
CREATE POLICY "Anyone can view verification documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-documents');

CREATE POLICY "Authenticated users can upload verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own verification documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);