import { supabase } from "@/integrations/supabase/client";

export const emailLogService = {
  // Flexible signature to handle metadata logging
  async logEmail(
    recipient: string,
    subject: string,
    status: string = "sent",
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase.from("email_logs" as any).insert({
        recipient,
        subject,
        body_preview: metadata ? JSON.stringify(metadata).substring(0, 200) : "No metadata",
        delivery_status: status,
      });
      if (error) console.error("Error logging email:", error);
    } catch (error) {
      console.error("Error logging email:", error);
    }
  },

  async updateDeliveryStatus(
    messageId: string,
    status: "delivered" | "bounced" | "complaint" | "failed"
  ): Promise<void> {
    try {
      await supabase
        .from("email_logs" as any)
        .update({ delivery_status: status })
        .eq("message_id", messageId);
    } catch (error) {
      console.error(error);
    }
  },

  async getEmailLogs(limit = 100): Promise<any[]> {
    const { data } = await supabase
      .from("email_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  },

  async getEmailLogById(id: string) {
    const { data } = await supabase
      .from("email_logs" as any)
      .select("*")
      .eq("id", id)
      .single();
    return data;
  },

  async searchEmailLogs(searchTerm: string) {
    const { data } = await supabase
      .from("email_logs" as any)
      .select("*")
      .or(`recipient.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })
      .limit(100);
    return data || [];
  }
};