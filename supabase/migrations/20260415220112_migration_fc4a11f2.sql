-- Create reviews table for provider feedback
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id) -- One review per contract
);

-- Add provider statistics to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 0 CHECK (response_rate >= 0 AND response_rate <= 100);

-- Add RLS policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Clients can view all public reviews
CREATE POLICY "public_read_reviews" ON reviews
  FOR SELECT USING (is_public = true);

-- Clients can create reviews for their contracts
CREATE POLICY "clients_create_reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    auth.uid() IN (SELECT client_id FROM contracts WHERE id = contract_id)
  );

-- Providers can view all reviews about them
CREATE POLICY "providers_view_own_reviews" ON reviews
  FOR SELECT USING (auth.uid() = provider_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_contract ON reviews(contract_id);