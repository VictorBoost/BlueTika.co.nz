import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { sendEvidencePhotoReminder as sendEmailReminder } from "./sesEmailService";

type Notification = Tables<"notifications">;

export const notificationService = {
  // Send a notification to a user
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    notification_type: "contract_update" | "payment" | "bid" | "message" | "general" = "general",
    relatedId?: string
  ) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        notification_type,
        related_id: relatedId,
        is_read: false,
      })
      .select()
      .single();

    console.log("sendNotification:", { data, error });
    return { data, error };
  },

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "payment" | "contract" | "evidence_photo" = "info",
    relatedContractId?: string,
    relatedProjectId?: string
  ) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_contract_id: relatedContractId,
        related_project_id: relatedProjectId,
      })
      .select()
      .single();

    console.log("createNotification:", { data, error });
    if (error) console.error("Notification creation error:", error);
    return { data, error };
  },

  async getUserNotifications(userId: string, unreadOnly = false) {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    console.log("getUserNotifications:", { data, error });
    if (error) console.error("Notifications fetch error:", error);
    return { data, error };
  },

  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select()
      .single();

    console.log("markAsRead:", { data, error });
    if (error) console.error("Notification update error:", error);
    return { data, error };
  },

  async markAllAsRead(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    console.log("markAllAsRead:", { data, error });
    if (error) console.error("Bulk notification update error:", error);
    return { data, error };
  },

  async sendEvidencePhotoReminder(
    contractId: string,
    userId: string,
    userEmail: string,
    userName: string,
    photoType: "before" | "after",
    projectTitle: string
  ) {
    const title = `${photoType === "before" ? "Before" : "After"} Photos Required`;
    const message = `Please upload your ${photoType} photos for "${projectTitle}". Both parties must confirm their photos before ${photoType === "before" ? "work can begin" : "the contract can be completed"}.`;

    await this.createNotification(
      userId,
      title,
      message,
      "evidence_photo",
      contractId
    );

    await sendEmailReminder(
      userEmail,
      userName,
      contractId,
      photoType,
      projectTitle
    );
  },
};