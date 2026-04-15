-- Add missing columns to profiles table for service provider verification
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS driver_licence_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS driver_licence_url TEXT,
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT;

-- Update verification_status check constraint to include all valid values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_verification_status_check 
  CHECK (verification_status IN ('not_started', 'pending', 'approved', 'rejected'));