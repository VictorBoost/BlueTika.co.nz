-- Fix bot_accounts RLS to allow service role inserts
DROP POLICY IF EXISTS "admin_insert" ON bot_accounts;
DROP POLICY IF EXISTS "admin_update" ON bot_accounts;
DROP POLICY IF EXISTS "admin_delete" ON bot_accounts;
DROP POLICY IF EXISTS "admin_select" ON bot_accounts;

-- Create permissive policies for bot_accounts
CREATE POLICY "service_role_all" ON bot_accounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix monalisa_settings RLS
DROP POLICY IF EXISTS "admin_update" ON monalisa_settings;
DROP POLICY IF EXISTS "admin_select" ON monalisa_settings;
DROP POLICY IF EXISTS "admin_insert" ON monalisa_settings;

-- Create permissive policies for monalisa_settings
CREATE POLICY "auth_all_access" ON monalisa_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);