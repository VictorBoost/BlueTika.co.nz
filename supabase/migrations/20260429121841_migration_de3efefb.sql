-- Fix remaining tables from the unprotected list
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tika_chat_conversations_nz ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_credit_purchases_nz ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;

-- Service role policies for all internal/analytics tables
CREATE POLICY "service_role_user_settings" ON user_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_webhook_deliveries" ON webhook_deliveries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_webhook_endpoints" ON webhook_endpoints FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_widget_messages" ON widget_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_stripe_failures" ON stripe_payment_failures FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_platform_revenue" ON platform_revenue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_generated_images" ON generated_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_generated_videos" ON generated_videos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_user_credits" ON user_credits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_ip_suspensions" ON ip_suspensions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_team_members" ON team_members FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_analytics_daily" ON analytics_daily FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_agent_performance" ON agent_performance FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_tika_chat" ON tika_chat_conversations_nz FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_abuse_flags" ON abuse_flags FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_video_purchases" ON video_credit_purchases_nz FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_conversation_logs" ON conversation_logs FOR ALL USING (auth.role() = 'service_role');