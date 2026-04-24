-- Fix the bot_accounts table - change generation_batch from integer to bigint
ALTER TABLE bot_accounts ALTER COLUMN generation_batch TYPE bigint;