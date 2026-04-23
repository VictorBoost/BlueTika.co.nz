-- Add unique constraint on profile_id
ALTER TABLE bot_accounts 
ADD CONSTRAINT bot_accounts_profile_id_unique UNIQUE (profile_id);

-- Now backfill bot_accounts for all existing bot profiles
INSERT INTO bot_accounts (profile_id, bot_type, is_active)
SELECT 
  p.id,
  CASE WHEN p.is_provider THEN 'service_provider' ELSE 'client' END,
  true
FROM profiles p
WHERE p.email LIKE 'bot.%@bluetika.test'
  AND NOT EXISTS (SELECT 1 FROM bot_accounts ba WHERE ba.profile_id = p.id)
ON CONFLICT (profile_id) DO NOTHING;

-- Verify backfill
SELECT COUNT(*) as bot_accounts_count FROM bot_accounts;
SELECT COUNT(*) as bot_profiles_count FROM profiles WHERE email LIKE 'bot.%@bluetika.test';