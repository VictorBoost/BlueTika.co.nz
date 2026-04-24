-- Phase 1: Add escrow columns to contracts table

-- Add client approval and auto-release tracking columns
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS client_approval_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_release_eligible_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_captured_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS escrow_released_method text CHECK (escrow_released_method IN ('client_approval', 'auto_release', 'admin_release'));

-- Update payment_status constraint to remove 'confirmed' (we'll use 'held' instead)
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_payment_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_payment_status_check 
  CHECK (payment_status IN ('pending', 'held', 'released', 'refunded'));

-- Add index for auto-release queue
CREATE INDEX IF NOT EXISTS idx_contracts_auto_release_queue 
  ON contracts(auto_release_eligible_at) 
  WHERE payment_status = 'held' AND auto_release_eligible_at IS NOT NULL;

-- Add comment for escrow tracking
COMMENT ON COLUMN contracts.client_approval_deadline IS 'Client has until this time to approve or dispute (48 hours after payment held)';
COMMENT ON COLUMN contracts.auto_release_eligible_at IS 'Payment auto-releases if no action by this time (same as client_approval_deadline)';
COMMENT ON COLUMN contracts.payment_captured_at IS 'When Stripe payment was actually captured (released from hold)';
COMMENT ON COLUMN contracts.escrow_released_method IS 'How the escrow was released: client_approval, auto_release, or admin_release';