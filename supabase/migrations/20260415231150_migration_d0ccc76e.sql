-- Commission tiers configuration table
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('no_tier', 'silver', 'gold', 'platinum')),
  display_name TEXT NOT NULL,
  min_sales DECIMAL(10,2) NOT NULL,
  max_sales DECIMAL(10,2),
  standard_rate DECIMAL(5,2) NOT NULL CHECK (standard_rate >= 0 AND standard_rate <= 100),
  tier_order INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission settings (promo toggle, etc.)
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_active BOOLEAN DEFAULT true,
  promo_rate DECIMAL(5,2) DEFAULT 8.00 CHECK (promo_rate >= 0 AND promo_rate <= 100),
  warning_days INTEGER DEFAULT 7,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tier drop warnings tracking
CREATE TABLE IF NOT EXISTS tier_drop_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_tier TEXT NOT NULL,
  warning_tier TEXT NOT NULL,
  warning_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tier_dropped_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(provider_id, current_tier, warning_sent_at)
);

-- Add tier fields to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS current_tier TEXT DEFAULT 'no_tier' CHECK (current_tier IN ('no_tier', 'silver', 'gold', 'platinum')),
  ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_tier_calculation TIMESTAMP WITH TIME ZONE;

-- Insert default tier configuration
INSERT INTO commission_tiers (tier_name, display_name, min_sales, max_sales, standard_rate, tier_order) VALUES
  ('no_tier', 'No Tier', 0.00, 500.00, 15.00, 1),
  ('silver', 'Silver', 501.00, 1999.00, 12.00, 2),
  ('gold', 'Gold', 2000.00, 4999.00, 10.00, 3),
  ('platinum', 'Platinum', 5000.00, NULL, 8.00, 4)
ON CONFLICT (tier_name) DO NOTHING;

-- Insert default commission settings (promo active at 8%)
INSERT INTO commission_settings (promo_active, promo_rate, warning_days)
VALUES (true, 8.00, 7);

-- Enable RLS
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_drop_warnings ENABLE ROW LEVEL SECURITY;

-- Policies for commission_tiers
CREATE POLICY "public_read_tiers" ON commission_tiers FOR SELECT USING (true);
CREATE POLICY "admin_manage_tiers" ON commission_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email LIKE '%@bluetika.co.nz')
);

-- Policies for commission_settings
CREATE POLICY "public_read_settings" ON commission_settings FOR SELECT USING (true);
CREATE POLICY "admin_manage_settings" ON commission_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email LIKE '%@bluetika.co.nz')
);

-- Policies for tier_drop_warnings
CREATE POLICY "provider_read_own_warnings" ON tier_drop_warnings FOR SELECT USING (provider_id = auth.uid());
CREATE POLICY "admin_manage_warnings" ON tier_drop_warnings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email LIKE '%@bluetika.co.nz')
);

-- Function to calculate 60-day sales for a provider
CREATE OR REPLACE FUNCTION calculate_provider_60day_sales(provider_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_sales DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0.00)
  INTO total_sales
  FROM contracts
  WHERE provider_id = provider_uuid
    AND status = 'completed'
    AND payment_status = 'released'
    AND NOT EXISTS (
      SELECT 1 FROM disputes 
      WHERE disputes.contract_id = contracts.id 
      AND disputes.status = 'upheld'
    )
    AND completed_at >= NOW() - INTERVAL '60 days';
  
  RETURN total_sales;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to determine tier based on sales amount
CREATE OR REPLACE FUNCTION get_tier_for_sales(sales_amount DECIMAL)
RETURNS TEXT AS $$
DECLARE
  tier_name TEXT;
BEGIN
  SELECT t.tier_name INTO tier_name
  FROM commission_tiers t
  WHERE sales_amount >= t.min_sales 
    AND (t.max_sales IS NULL OR sales_amount <= t.max_sales)
  ORDER BY t.tier_order DESC
  LIMIT 1;
  
  RETURN COALESCE(tier_name, 'no_tier');
END;
$$ LANGUAGE plpgsql;

-- Function to update provider tier
CREATE OR REPLACE FUNCTION update_provider_tier(provider_uuid UUID)
RETURNS TABLE(
  old_tier TEXT,
  new_tier TEXT,
  sales_amount DECIMAL,
  tier_changed BOOLEAN
) AS $$
DECLARE
  current_sales DECIMAL(10,2);
  old_tier_value TEXT;
  new_tier_value TEXT;
BEGIN
  -- Get current tier
  SELECT current_tier INTO old_tier_value
  FROM profiles
  WHERE id = provider_uuid;
  
  -- Calculate 60-day sales
  current_sales := calculate_provider_60day_sales(provider_uuid);
  
  -- Determine new tier
  new_tier_value := get_tier_for_sales(current_sales);
  
  -- Update profile if tier changed
  IF new_tier_value != old_tier_value THEN
    UPDATE profiles
    SET current_tier = new_tier_value,
        tier_updated_at = NOW(),
        last_tier_calculation = NOW()
    WHERE id = provider_uuid;
  ELSE
    UPDATE profiles
    SET last_tier_calculation = NOW()
    WHERE id = provider_uuid;
  END IF;
  
  RETURN QUERY SELECT 
    old_tier_value,
    new_tier_value,
    current_sales,
    (new_tier_value != old_tier_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;