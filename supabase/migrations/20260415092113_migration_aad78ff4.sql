-- Add new fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS date_preference TEXT CHECK (date_preference IN ('date_range', 'specific_date', 'asap_flexible')),
ADD COLUMN IF NOT EXISTS date_from DATE,
ADD COLUMN IF NOT EXISTS date_to DATE,
ADD COLUMN IF NOT EXISTS specific_date DATE,
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT false;

-- Create storage bucket for project media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media',
  'project-media',
  true,
  52428800, -- 50MB max
  ARRAY['image/jpeg', 'image/png', 'video/mp4']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for project media
CREATE POLICY "Anyone can view project media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-media');

CREATE POLICY "Authenticated users can upload project media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own project media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own project media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to mark expired projects
CREATE OR REPLACE FUNCTION mark_expired_projects()
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET is_expired = true
  WHERE expires_at < NOW() 
    AND status = 'open'
    AND is_expired = false;
END;
$$ LANGUAGE plpgsql;

-- Add reopening capability
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS reopened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reopened_at TIMESTAMP WITH TIME ZONE;