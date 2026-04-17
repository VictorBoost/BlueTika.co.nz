-- Add Stripe account ID to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected';

COMMENT ON COLUMN profiles.stripe_account_id IS 'Stripe Connect account ID for receiving payments';
COMMENT ON COLUMN profiles.stripe_account_status IS 'Status: not_connected, pending, active';