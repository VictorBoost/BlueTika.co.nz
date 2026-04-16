import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type EmailLog = Tables<"email_logs">;

export const emailLogService = {
  // Log sent email
  async logEmail(
    recipient: string,
    subject: string,
    fullBody: string,
    messageId?: string
  ) {
    const bodyPreview = fullBody.substring(0, 200) + "...";

    const { data, error } = await supabase
      .from("email_logs")
      .insert({
        recipient,
        subject,
        body_preview: bodyPreview,
        full_body: fullBody,
        message_id: messageId,
        delivery_status: "sent",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update delivery status
  async updateDeliveryStatus(messageId: string, status: string) {
    const { data, error } = await supabase
      .from("email_logs")
      .update({ delivery_status: status })
      .eq("message_id", messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all email logs
  async getAllEmailLogs(limit = 100) {
    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get email log by ID
  async getEmailLogById(id: string) {
    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Search email logs
  async searchEmailLogs(searchTerm: string) {
    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .or(`recipient.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`)
      .order("sent_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  },
};