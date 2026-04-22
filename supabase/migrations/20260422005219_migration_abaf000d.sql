-- Add missing routine scheduling columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS routine_frequency text CHECK (routine_frequency IN ('weekly', 'fortnightly', 'monthly', 'custom')),
  ADD COLUMN IF NOT EXISTS routine_start_date date,
  ADD COLUMN IF NOT EXISTS routine_custom_days integer;

-- Verify columns added
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('routine_frequency', 'routine_start_date', 'routine_custom_days')
ORDER BY column_name;