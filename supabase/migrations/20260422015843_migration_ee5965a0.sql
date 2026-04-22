-- Add IP address column to staff_audit_logs
ALTER TABLE staff_audit_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Verify column added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'staff_audit_logs'
AND column_name = 'ip_address';