-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing bot activity cron jobs
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname LIKE 'auto-bot-activity%';

-- Schedule auto-bot-activity to run every 4 hours
-- Direct invocation using pg_net extension
SELECT cron.schedule(
  'auto-bot-activity-scheduler',
  '0 */4 * * *',  -- Every 4 hours at the top of the hour
  $$
  SELECT
    net.http_post(
      url := 'https://jkglqvgdwbxfujubecqr.supabase.co/functions/v1/auto-bot-activity',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprc2xxdmdkd2J4ZnVqdWJlY3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTI2OTYsImV4cCI6MjA2MDIyODY5Nn0.6nA3BYHQq9ZmrqK5fhgIRkEfS15LxXMwvMxMCgOvqZU"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'auto-bot-activity-scheduler';