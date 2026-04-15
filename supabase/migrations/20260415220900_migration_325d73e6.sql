-- Add payment fields to contracts table
ALTER TABLE contracts
ADD COLUMN payment_status text DEFAULT 'pending',
ADD COLUMN stripe_payment_intent_id text,
ADD COLUMN platform_fee numeric DEFAULT 0,
ADD COLUMN payment_processing_fee numeric DEFAULT 0,
ADD COLUMN total_amount numeric DEFAULT 0;

-- Add constraint for payment status
ALTER TABLE contracts
ADD CONSTRAINT contracts_payment_status_check 
CHECK (payment_status IN ('pending', 'confirmed', 'held', 'released'));

-- Create platform_settings table for admin-editable values
CREATE TABLE platform_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  setting_type text DEFAULT 'text',
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Add RLS policies for platform_settings (admin only can update, public can read specific settings)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "admin_update_settings" ON platform_settings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email LIKE '%@bluetika.co.nz'
    )
  );

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  related_contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  related_project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Add constraint for notification type
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'payment', 'contract'));

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "system_create_notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster notification queries
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

COMMENT ON TABLE notifications IS 'In-platform notifications for users';
COMMENT ON TABLE platform_settings IS 'Admin-editable platform configuration values';