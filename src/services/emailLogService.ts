import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type EmailLog = Tables<"email_logs">;

export const emailLogService = {
  /**
   * Log an email that was sent
   */
  async logEmail(
    recipient: string,
    subject: string,
    body: string,
    messageId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from("email_logs" as any).insert({
        recipient,
        subject,
        body_preview: body.substring(0, 200),
        message_id: messageId,
        delivery_status: "sent",
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  },

  // Update delivery status
  async updateDeliveryStatus(
    messageId: string,
    status: "delivered" | "bounced" | "complaint" | "failed"
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("email_logs" as any)
        .update({ delivery_status: status })
        .eq("message_id", messageId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  },

  // Get all email logs
  async getEmailLogs(limit = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("email_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
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