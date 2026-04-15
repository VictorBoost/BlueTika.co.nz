-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to projects table
ALTER TABLE projects
DROP COLUMN IF EXISTS category,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read for categories (anyone can see categories)
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (is_active = true);

-- Only authenticated users with admin role can manage categories
-- For now, we'll create policies that check if user is admin (we'll add admin role later)
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Seed the 7 initial categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Cleaning', 'cleaning', 'Professional cleaning services for homes and offices', 1),
('Movers', 'movers', 'Furniture removal and relocation services', 2),
('Handyman', 'handyman', 'General home repairs and maintenance', 3),
('Electrical', 'electrical', 'Licensed electrical work and installations', 4),
('Plumbers and Gas', 'plumbers-and-gas', 'Plumbing and gas fitting services', 5),
('Landscaping', 'landscaping', 'Garden design, maintenance and outdoor projects', 6),
('Painting', 'painting', 'Interior and exterior painting services', 7)
ON CONFLICT (slug) DO NOTHING;