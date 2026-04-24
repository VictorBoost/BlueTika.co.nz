-- Add escrow_needs_review flag to contracts table

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS escrow_needs_review BOOLEAN DEFAULT false;

COMMENT ON COLUMN contracts.escrow_needs_review IS 'Flags contracts that need manual admin review after client approval window expires';

-- Update RLS policy to allow reading this column
DROP POLICY IF EXISTS "view_escrow_needs_review" ON contracts;
CREATE POLICY "view_escrow_needs_review" ON contracts
  FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = provider_id);