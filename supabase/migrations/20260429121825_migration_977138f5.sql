-- Fix remaining sensitive tables
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions_co_nz ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_co_nz ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_brains ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_caps ENABLE ROW LEVEL SECURITY;

-- Service role policies for internal tables
CREATE POLICY "service_role_chat_messages" ON chat_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_subscriptions_co_nz" ON subscriptions_co_nz FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_credits_co_nz" ON credits_co_nz FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_ai_brains" ON ai_brains FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_chatbot_sessions" ON chatbot_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_images" ON images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_widget_settings" ON widget_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_audit_logs" ON audit_logs FOR ALL USING (auth.role() = 'service_role');

-- Public read for credit caps (pricing display)
CREATE POLICY "public_read_credit_caps" ON credit_caps FOR SELECT USING (true);