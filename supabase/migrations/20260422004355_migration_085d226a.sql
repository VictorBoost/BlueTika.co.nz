-- Add the 4 missing shared account columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS uses_marketplace boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uses_tikachat boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('uses_marketplace', 'uses_tikachat', 'is_bot', 'is_banned')
ORDER BY column_name;