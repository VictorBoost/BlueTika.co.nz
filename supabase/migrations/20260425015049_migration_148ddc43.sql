-- Fix the FK constraint to use profile_id instead of bot_accounts.id
ALTER TABLE bot_activity_logs
DROP CONSTRAINT IF EXISTS bot_activity_logs_bot_id_fkey;

ALTER TABLE bot_activity_logs
ADD CONSTRAINT bot_activity_logs_bot_id_fkey 
FOREIGN KEY (bot_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'bot_activity_logs' AND tc.constraint_type = 'FOREIGN KEY';