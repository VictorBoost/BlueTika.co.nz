-- Fix RLS policies for bot automation system
-- This ensures Edge Functions can properly manage bot operations

-- 1. Fix bot_configuration - service_role needs UPDATE access
DROP POLICY IF EXISTS "service_role_bot_config" ON bot_configuration;

CREATE POLICY "service_role_bot_config" ON bot_configuration
  FOR ALL
  USING (auth.role() = 'service_role');

-- 2. Fix platform_settings - service_role needs UPDATE access for bot settings
DROP POLICY IF EXISTS "service_role_platform_settings" ON platform_settings;

CREATE POLICY "service_role_platform_settings" ON platform_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Ensure categories is readable by service_role (for project posting)
DROP POLICY IF EXISTS "service_role_categories" ON categories;

CREATE POLICY "service_role_categories" ON categories
  FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Ensure bot_accounts is fully accessible by service_role
DROP POLICY IF EXISTS "service_role_bot_accounts" ON bot_accounts;

CREATE POLICY "service_role_bot_accounts" ON bot_accounts
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Ensure contracts is fully accessible by service_role (for contract creation)
DROP POLICY IF EXISTS "service_role_contracts" ON contracts;

CREATE POLICY "service_role_contracts" ON contracts
  FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Ensure bids is fully accessible by service_role (for bid submission)
DROP POLICY IF EXISTS "service_role_bids" ON bids;

CREATE POLICY "service_role_bids" ON bids
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7. Ensure projects is fully accessible by service_role (for project posting)
DROP POLICY IF EXISTS "service_role_projects" ON projects;

CREATE POLICY "service_role_projects" ON projects
  FOR ALL
  USING (auth.role() = 'service_role');

-- 8. Ensure payment_tracking is accessible by service_role
DROP POLICY IF EXISTS "service_role_payment_tracking" ON payment_tracking;

CREATE POLICY "service_role_payment_tracking" ON payment_tracking
  FOR ALL
  USING (auth.role() = 'service_role');