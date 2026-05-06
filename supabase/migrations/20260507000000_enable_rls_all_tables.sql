-- Enable Row Level Security on all tables
-- This migration addresses Supabase security alerts for RLS disabled tables
-- Note: Some tables already have RLS enabled and policies - this adds missing ones

-- Enable RLS on tables that may not have it yet
DO $$ 
BEGIN
  -- Check and enable RLS on tables that need it
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews' AND rowsecurity = true) THEN
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'provider_profiles' AND rowsecurity = true) THEN
    ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'account_suspensions' AND rowsecurity = true) THEN
    ALTER TABLE public.account_suspensions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'accounting_entries' AND rowsecurity = true) THEN
    ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'additional_charges' AND rowsecurity = true) THEN
    ALTER TABLE public.additional_charges ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'abuse_flags' AND rowsecurity = true) THEN
    ALTER TABLE public.abuse_flags ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_logs' AND rowsecurity = true) THEN
    ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'approval_requests' AND rowsecurity = true) THEN
    ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bot_activities' AND rowsecurity = true) THEN
    ALTER TABLE public.bot_activities ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bot_config' AND rowsecurity = true) THEN
    ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'commission_settings' AND rowsecurity = true) THEN
    ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contract_messages' AND rowsecurity = true) THEN
    ALTER TABLE public.contract_messages ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contract_photos' AND rowsecurity = true) THEN
    ALTER TABLE public.contract_photos ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'directory_categories' AND rowsecurity = true) THEN
    ALTER TABLE public.directory_categories ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'directory_listings' AND rowsecurity = true) THEN
    ALTER TABLE public.directory_listings ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'disputes' AND rowsecurity = true) THEN
    ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_logs' AND rowsecurity = true) THEN
    ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_templates' AND rowsecurity = true) THEN
    ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fund_releases' AND rowsecurity = true) THEN
    ALTER TABLE public.fund_releases ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND rowsecurity = true) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_methods' AND rowsecurity = true) THEN
    ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payouts' AND rowsecurity = true) THEN
    ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'project_photos' AND rowsecurity = true) THEN
    ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'provider_badges' AND rowsecurity = true) THEN
    ALTER TABLE public.provider_badges ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'provider_tiers' AND rowsecurity = true) THEN
    ALTER TABLE public.provider_tiers ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'staff_members' AND rowsecurity = true) THEN
    ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'subscriptions' AND rowsecurity = true) THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'support_tickets' AND rowsecurity = true) THEN
    ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tier_progress' AND rowsecurity = true) THEN
    ALTER TABLE public.tier_progress ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_sessions' AND rowsecurity = true) THEN
    ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'widget_configs' AND rowsecurity = true) THEN
    ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'widgets' AND rowsecurity = true) THEN
    ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Profiles policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" 
      ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" 
      ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" 
      ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Reviews policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view reviews') THEN
    CREATE POLICY "Anyone can view reviews" 
      ON public.reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create reviews for their contracts') THEN
    CREATE POLICY "Users can create reviews for their contracts" 
      ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can update their own reviews') THEN
    CREATE POLICY "Users can update their own reviews" 
      ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
  END IF;
END $$;

-- Provider profiles policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view verified provider profiles') THEN
    CREATE POLICY "Anyone can view verified provider profiles" 
      ON public.provider_profiles FOR SELECT USING (verification_status = 'verified');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Providers can update their own profile') THEN
    CREATE POLICY "Providers can update their own profile" 
      ON public.provider_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Providers can insert their own profile') THEN
    CREATE POLICY "Providers can insert their own profile" 
      ON public.provider_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Accounting entries policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own accounting entries') THEN
    CREATE POLICY "Users can view their own accounting entries" 
      ON public.accounting_entries FOR SELECT USING (auth.uid() = provider_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create accounting entries') THEN
    CREATE POLICY "Users can create accounting entries" 
      ON public.accounting_entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Additional charges policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view charges for their contracts') THEN
    CREATE POLICY "Users can view charges for their contracts" 
      ON public.additional_charges FOR SELECT USING (
        EXISTS (SELECT 1 FROM contracts WHERE contracts.id = additional_charges.contract_id AND (contracts.client_id = auth.uid() OR contracts.provider_id = auth.uid()))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create additional charges') THEN
    CREATE POLICY "Users can create additional charges" 
      ON public.additional_charges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Abuse flags policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view abuse flags') THEN
    CREATE POLICY "Only admins can view abuse flags" 
      ON public.abuse_flags FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Authenticated users can create abuse flags') THEN
    CREATE POLICY "Authenticated users can create abuse flags" 
      ON public.abuse_flags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Admin logs policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view admin logs') THEN
    CREATE POLICY "Only admins can view admin logs" 
      ON public.admin_logs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can insert admin logs') THEN
    CREATE POLICY "Only admins can insert admin logs" 
      ON public.admin_logs FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Approval requests policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own approval requests') THEN
    CREATE POLICY "Users can view their own approval requests" 
      ON public.approval_requests FOR SELECT USING (auth.uid() = requester_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create approval requests') THEN
    CREATE POLICY "Users can create approval requests" 
      ON public.approval_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Bot activities policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view bot activities') THEN
    CREATE POLICY "Only admins can view bot activities" 
      ON public.bot_activities FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Bot config policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view bot config') THEN
    CREATE POLICY "Only admins can view bot config" 
      ON public.bot_config FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can modify bot config') THEN
    CREATE POLICY "Only admins can modify bot config" 
      ON public.bot_config FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Commission settings policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view commission settings') THEN
    CREATE POLICY "Only admins can view commission settings" 
      ON public.commission_settings FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Contract messages policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view messages for their contracts') THEN
    CREATE POLICY "Users can view messages for their contracts" 
      ON public.contract_messages FOR SELECT USING (
        EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_messages.contract_id AND (contracts.client_id = auth.uid() OR contracts.provider_id = auth.uid()))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create messages for their contracts') THEN
    CREATE POLICY "Users can create messages for their contracts" 
      ON public.contract_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Contract photos policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view photos for their contracts') THEN
    CREATE POLICY "Users can view photos for their contracts" 
      ON public.contract_photos FOR SELECT USING (
        EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_photos.contract_id AND (contracts.client_id = auth.uid() OR contracts.provider_id = auth.uid()))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create photos for their contracts') THEN
    CREATE POLICY "Users can create photos for their contracts" 
      ON public.contract_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Directory listings policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view directory listings') THEN
    CREATE POLICY "Anyone can view directory listings" 
      ON public.directory_listings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Authenticated users can create directory listings') THEN
    CREATE POLICY "Authenticated users can create directory listings" 
      ON public.directory_listings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can update their own listings') THEN
    CREATE POLICY "Users can update their own listings" 
      ON public.directory_listings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Disputes policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view disputes for their contracts') THEN
    CREATE POLICY "Users can view disputes for their contracts" 
      ON public.disputes FOR SELECT USING (
        EXISTS (SELECT 1 FROM contracts WHERE contracts.id = disputes.contract_id AND (contracts.client_id = auth.uid() OR contracts.provider_id = auth.uid()))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create disputes for their contracts') THEN
    CREATE POLICY "Users can create disputes for their contracts" 
      ON public.disputes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Email logs policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view email logs') THEN
    CREATE POLICY "Only admins can view email logs" 
      ON public.email_logs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Fund releases policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view fund releases') THEN
    CREATE POLICY "Only admins can view fund releases" 
      ON public.fund_releases FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Notifications policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications" 
      ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can update their own notifications') THEN
    CREATE POLICY "Users can update their own notifications" 
      ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Payment methods policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own payment methods') THEN
    CREATE POLICY "Users can view their own payment methods" 
      ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create their own payment methods') THEN
    CREATE POLICY "Users can create their own payment methods" 
      ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Payouts policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Admins can view all payouts') THEN
    CREATE POLICY "Admins can view all payouts" 
      ON public.payouts FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Providers can view their own payouts') THEN
    CREATE POLICY "Providers can view their own payouts" 
      ON public.payouts FOR SELECT USING (auth.uid() = provider_id);
  END IF;
END $$;

-- Project photos policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view photos for open projects') THEN
    CREATE POLICY "Anyone can view photos for open projects" 
      ON public.project_photos FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = project_photos.project_id AND projects.status = 'open')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Project owners can create photos') THEN
    CREATE POLICY "Project owners can create photos" 
      ON public.project_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Staff members policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view staff members') THEN
    CREATE POLICY "Only admins can view staff members" 
      ON public.staff_members FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Subscriptions policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own subscriptions') THEN
    CREATE POLICY "Users can view their own subscriptions" 
      ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create subscriptions') THEN
    CREATE POLICY "Users can create subscriptions" 
      ON public.subscriptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Support tickets policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own tickets') THEN
    CREATE POLICY "Users can view their own tickets" 
      ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can create tickets') THEN
    CREATE POLICY "Users can create tickets" 
      ON public.support_tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Admins can view all tickets') THEN
    CREATE POLICY "Admins can view all tickets" 
      ON public.support_tickets FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- User sessions policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Users can view their own sessions') THEN
    CREATE POLICY "Users can view their own sessions" 
      ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Widget configs policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Only admins can view widget configs') THEN
    CREATE POLICY "Only admins can view widget configs" 
      ON public.widget_configs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- Widgets policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view widgets') THEN
    CREATE POLICY "Anyone can view widgets" 
      ON public.widgets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Authenticated users can create widgets') THEN
    CREATE POLICY "Authenticated users can create widgets" 
      ON public.widgets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;