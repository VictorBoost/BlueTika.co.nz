-- Extend profiles table with BlueTika-specific fields
ALTER TABLE profiles
ADD COLUMN is_client BOOLEAN DEFAULT false,
ADD COLUMN is_provider BOOLEAN DEFAULT false,
ADD COLUMN phone TEXT,
ADD COLUMN location TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN gst_enabled BOOLEAN DEFAULT false;

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, provider_id)
);

-- Create contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  final_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Projects RLS (T2: Public read, authenticated write)
CREATE POLICY "public_read_projects" ON projects FOR SELECT USING (true);
CREATE POLICY "auth_insert_projects" ON projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = client_id);
CREATE POLICY "auth_update_projects" ON projects FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "auth_delete_projects" ON projects FOR DELETE USING (auth.uid() = client_id);

-- Bids RLS (T2: Public read, authenticated write)
CREATE POLICY "public_read_bids" ON bids FOR SELECT USING (true);
CREATE POLICY "auth_insert_bids" ON bids FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = provider_id);
CREATE POLICY "auth_update_bids" ON bids FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "auth_delete_bids" ON bids FOR DELETE USING (auth.uid() = provider_id);

-- Contracts RLS (T1: Users see their own contracts)
CREATE POLICY "select_own_contracts" ON contracts FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);
CREATE POLICY "insert_contracts" ON contracts FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "update_contracts" ON contracts FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Create indexes for performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_bids_project_id ON bids(project_id);
CREATE INDEX idx_bids_provider_id ON bids(provider_id);
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_provider_id ON contracts(provider_id);