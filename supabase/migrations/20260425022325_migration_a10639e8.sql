-- Set up cron job for hourly bot cycle
-- First, enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing hourly bot job
SELECT cron.unschedule(jobid) 
FROM cron.job 
WHERE jobname = 'hourly-bot-cycle';

-- Schedule hourly bot cycle (runs every hour at minute 0)
SELECT cron.schedule(
  'hourly-bot-cycle',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://rfyxsajvwltnwkehypqi.supabase.co/functions/v1/hourly-bot-cycle',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmeXhzYWp2d2x0bndrZWh5cHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDYwNTgsImV4cCI6MjA1OTMyMjA1OH0.Isg2Hp6lCcTkJVevFpM3pJRoOdVJNa7c1cNPqHF0LAQ"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Verify cron job was created
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'hourly-bot-cycle';