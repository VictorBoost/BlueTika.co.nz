-- Drop the old unique constraint and add new fields for dual reviews
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_contract_id_key;

-- Add reviewer_role to distinguish who submitted the review
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_role TEXT NOT NULL DEFAULT 'client';
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_role_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewer_role_check CHECK (reviewer_role IN ('client', 'provider'));

-- Add reviewee_role to distinguish who is being reviewed
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewee_role TEXT NOT NULL DEFAULT 'provider';
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_role_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewee_role_check CHECK (reviewee_role IN ('client', 'provider'));

-- Add reminder tracking
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Add new unique constraint: one review per role per contract
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_contract_reviewer_unique;
ALTER TABLE reviews ADD CONSTRAINT reviews_contract_reviewer_unique UNIQUE (contract_id, reviewer_role);

-- Drop old index on contract_id since we have a new unique constraint
DROP INDEX IF EXISTS idx_reviews_contract;

-- Add index for finding pending reviews
CREATE INDEX IF NOT EXISTS idx_reviews_pending ON reviews (contract_id, created_at);

-- Update RLS policies
DROP POLICY IF EXISTS clients_create_reviews ON reviews;
DROP POLICY IF EXISTS providers_view_own_reviews ON reviews;
DROP POLICY IF EXISTS public_read_reviews ON reviews;
DROP POLICY IF EXISTS users_create_reviews ON reviews;
DROP POLICY IF EXISTS users_read_own_reviews ON reviews;

-- Policy: Both clients and providers can create their reviews
CREATE POLICY "users_create_reviews" ON reviews FOR INSERT WITH CHECK (
  (reviewer_role = 'client' AND auth.uid() = client_id AND auth.uid() IN (SELECT client_id FROM contracts WHERE id = contract_id))
  OR
  (reviewer_role = 'provider' AND auth.uid() = provider_id AND auth.uid() IN (SELECT provider_id FROM contracts WHERE id = contract_id))
);

-- Policy: Public can read all public reviews
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT USING (is_public = true);

-- Policy: Users can read reviews they submitted or received
CREATE POLICY "users_read_own_reviews" ON reviews FOR SELECT USING (
  auth.uid() = client_id OR auth.uid() = provider_id
);

-- Add comment
COMMENT ON TABLE reviews IS 'Dual-party reviews: both client and provider submit reviews for each completed contract';