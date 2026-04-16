-- Directory categories table (owner-managed)
CREATE TABLE directory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Directory listings table
CREATE TABLE directory_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES directory_categories(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  description TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN DEFAULT false,
  provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  claimed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT description_length_check CHECK (char_length(description) <= 300),
  CONSTRAINT photos_count_check CHECK (array_length(photos, 1) IS NULL OR array_length(photos, 1) <= 3)
);

COMMENT ON TABLE directory_listings IS 'Public business directory listings with optional provider linkage';

-- Directory analytics table
CREATE TABLE directory_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_to_project BOOLEAN DEFAULT false,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL
);

COMMENT ON TABLE directory_analytics IS 'Tracks directory visitor clicks and conversion to marketplace projects';

-- Indexes for performance
CREATE INDEX idx_directory_listings_category ON directory_listings(category_id);
CREATE INDEX idx_directory_listings_city ON directory_listings(city);
CREATE INDEX idx_directory_listings_featured ON directory_listings(featured, is_active);
CREATE INDEX idx_directory_listings_provider ON directory_listings(provider_id);
CREATE INDEX idx_directory_analytics_listing ON directory_analytics(listing_id);
CREATE INDEX idx_directory_analytics_clicked ON directory_analytics(clicked_at DESC);

-- RLS policies for directory_categories
ALTER TABLE directory_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories" ON directory_categories
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_categories" ON directory_categories
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- RLS policies for directory_listings
ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_listings" ON directory_listings
  FOR SELECT USING (is_active = true);

CREATE POLICY "auth_create_listings" ON directory_listings
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = claimed_by
  );

CREATE POLICY "owners_update_listings" ON directory_listings
  FOR UPDATE USING (
    auth.uid() = claimed_by OR 
    auth.uid() IN (SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz')
  );

CREATE POLICY "owners_delete_listings" ON directory_listings
  FOR DELETE USING (
    auth.uid() = claimed_by OR 
    auth.uid() IN (SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz')
  );

-- RLS policies for directory_analytics
ALTER TABLE directory_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_track_clicks" ON directory_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_analytics" ON directory_analytics
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );