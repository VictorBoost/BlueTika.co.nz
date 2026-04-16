-- Create moderation_settings table (singleton table for global settings)
CREATE TABLE IF NOT EXISTS moderation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_listing_auto BOOLEAN DEFAULT true,
  profile_photo_auto BOOLEAN DEFAULT true,
  driver_licence_auto BOOLEAN DEFAULT false,
  police_check_auto BOOLEAN DEFAULT false,
  trade_certificate_auto BOOLEAN DEFAULT false,
  project_media_auto BOOLEAN DEFAULT true,
  chat_message_auto BOOLEAN DEFAULT true,
  review_auto BOOLEAN DEFAULT true,
  bot_content_auto BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT only_one_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Enable RLS
ALTER TABLE moderation_settings ENABLE ROW LEVEL SECURITY;

-- Admin can view and update settings
CREATE POLICY admin_read_settings ON moderation_settings
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

CREATE POLICY admin_update_settings ON moderation_settings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- Initialize default settings row with fixed ID
INSERT INTO moderation_settings (
  id,
  project_listing_auto,
  profile_photo_auto,
  driver_licence_auto,
  police_check_auto,
  trade_certificate_auto,
  project_media_auto,
  chat_message_auto,
  review_auto,
  bot_content_auto
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  true,  -- project_listing (auto-approve with safety filter)
  true,  -- profile_photo (auto-approve)
  false, -- driver_licence (manual always)
  false, -- police_check (manual always)
  false, -- trade_certificate (manual always)
  true,  -- project_media (auto-approve)
  true,  -- chat_message (auto-filter)
  true,  -- review (auto-publish)
  true   -- bot_content (auto)
)
ON CONFLICT (id) DO NOTHING;

-- Create moderation queue table for manual review items
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decision TEXT,
  decision_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT moderation_queue_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT moderation_queue_content_type_check CHECK (content_type IN (
    'project_listing',
    'profile_photo',
    'driver_licence',
    'police_check',
    'trade_certificate',
    'project_media',
    'chat_message',
    'review',
    'bot_content'
  )),
  CONSTRAINT moderation_queue_decision_check CHECK (decision IN ('approve', 'reject'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content_type ON moderation_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON moderation_queue(created_at DESC);

-- Enable RLS on moderation_queue
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage all queue items
CREATE POLICY admin_manage_queue ON moderation_queue
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- System can insert items into queue
CREATE POLICY system_queue_items ON moderation_queue
  FOR INSERT
  WITH CHECK (true);