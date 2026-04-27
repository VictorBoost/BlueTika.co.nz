-- Create bot configuration table to store frequency and intensity settings
CREATE TABLE IF NOT EXISTS bot_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Frequency settings (minutes between actions)
  project_posting_interval INT DEFAULT 30, -- minutes between posting projects
  bid_submission_interval INT DEFAULT 15, -- minutes between submitting bids
  bid_acceptance_interval INT DEFAULT 20, -- minutes between accepting bids
  payment_processing_interval INT DEFAULT 10, -- minutes between processing payments
  work_completion_interval INT DEFAULT 45, -- minutes between completing work
  
  -- Intensity settings (how many actions per cycle)
  projects_per_cycle INT DEFAULT 5, -- how many projects to post per cycle
  bids_per_cycle INT DEFAULT 10, -- how many bids to submit per cycle
  accepts_per_cycle INT DEFAULT 3, -- how many bids to accept per cycle
  payments_per_cycle INT DEFAULT 5, -- how many payments to process per cycle
  
  -- Bot generation settings
  daily_bot_generation INT DEFAULT 50, -- how many new bots to generate per day
  max_total_bots INT DEFAULT 2000, -- maximum total bots allowed
  
  -- Activity hours (24-hour format)
  activity_start_hour INT DEFAULT 0, -- start activity at this hour (0-23)
  activity_end_hour INT DEFAULT 23, -- end activity at this hour (0-23)
  
  -- Automation toggles
  auto_post_projects BOOLEAN DEFAULT true,
  auto_submit_bids BOOLEAN DEFAULT true,
  auto_accept_bids BOOLEAN DEFAULT true,
  auto_process_payments BOOLEAN DEFAULT true,
  auto_complete_work BOOLEAN DEFAULT true,
  auto_submit_reviews BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default configuration
INSERT INTO bot_configuration (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Return the default config to verify
SELECT * FROM bot_configuration WHERE id = '00000000-0000-0000-0000-000000000001';