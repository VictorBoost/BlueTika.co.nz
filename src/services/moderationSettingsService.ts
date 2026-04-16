import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ContentType =
  | "project_listing"
  | "profile_photo"
  | "driver_licence"
  | "police_check"
  | "trade_certificate"
  | "project_media"
  | "chat_message"
  | "review"
  | "bot_content";

export interface ModerationSettings {
  project_listing: boolean;
  profile_photo: boolean;
  driver_licence: boolean;
  police_check: boolean;
  trade_certificate: boolean;
  project_media: boolean;
  chat_message: boolean;
  review: boolean;
  bot_content: boolean;
}

// Locked types that cannot be changed to auto
const LOCKED_MANUAL_TYPES: ContentType[] = [
  "driver_licence",
  "police_check",
  "trade_certificate",
];

/**
 * Get current moderation settings (singleton row)
 */
export async function getModerationSettings(): Promise<ModerationSettings> {
  const { data, error } = await supabase
    .from("moderation_settings")
    .select("*")
    .single();

  console.log("Get moderation settings:", { data, error });

  if (error) {
    console.error("Failed to fetch moderation settings:", error);
    // Return defaults on error
    return {
      project_listing: true,
      profile_photo: true,
      driver_licence: false,
      police_check: false,
      trade_certificate: false,
      project_media: true,
      chat_message: true,
      review: true,
      bot_content: true,
    };
  }

  return {
    project_listing: data.project_listing_auto ?? true,
    profile_photo: data.profile_photo_auto ?? true,
    driver_licence: data.driver_licence_auto ?? false,
    police_check: data.police_check_auto ?? false,
    trade_certificate: data.trade_certificate_auto ?? false,
    project_media: data.project_media_auto ?? true,
    chat_message: data.chat_message_auto ?? true,
    review: data.review_auto ?? true,
    bot_content: data.bot_content_auto ?? true,
  };
}

/**
 * Update a single moderation setting
 */
export async function updateModerationSetting(
  contentType: ContentType,
  autoApprove: boolean
): Promise<{ success: boolean; error?: string }> {
  // Prevent changing locked types to auto
  if (LOCKED_MANUAL_TYPES.includes(contentType) && autoApprove) {
    return {
      success: false,
      error: `${contentType.replace(/_/g, " ")} must always use manual review for compliance and safety`,
    };
  }

  const columnName = `${contentType}_auto`;
  
  const { error } = await supabase
    .from("moderation_settings")
    .update({ 
      [columnName]: autoApprove,
      updated_at: new Date().toISOString() 
    })
    .eq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Update moderation setting:", { contentType, autoApprove, error });

  if (error) {
    console.error("Failed to update moderation setting:", error);
    return { success: false, error: "Failed to update setting" };
  }

  return { success: true };
}

/**
 * Check if content type uses auto-approval
 */
export async function isAutoApproved(contentType: ContentType): Promise<boolean> {
  const settings = await getModerationSettings();
  return settings[contentType];
}

/**
 * Add item to moderation queue
 */
export async function addToModerationQueue(
  contentType: ContentType,
  itemId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; queueId?: string }> {
  const { data, error } = await supabase
    .from("moderation_queue")
    .insert({
      content_type: contentType,
      item_id: itemId,
      status: "pending",
      metadata: metadata || {},
    })
    .select("id")
    .single();

  console.log("Add to moderation queue:", { contentType, itemId, data, error });

  if (error) {
    console.error("Failed to add to moderation queue:", error);
    return { success: false };
  }

  return { success: true, queueId: data.id };
}

/**
 * Get pending review count
 */
export async function getPendingReviewCount(): Promise<number> {
  const { count, error } = await supabase
    .from("moderation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  console.log("Get pending review count:", { count, error });

  if (error || count === null) {
    return 0;
  }

  return count;
}

/**
 * Get pending items by content type
 */
export async function getPendingByType(contentType: ContentType): Promise<number> {
  const { count, error } = await supabase
    .from("moderation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("content_type", contentType);

  console.log("Get pending by type:", { contentType, count, error });

  if (error || count === null) {
    return 0;
  }

  return count;
}

/**
 * Get all pending items for review
 */
export async function getPendingItems() {
  const { data, error } = await supabase
    .from("moderation_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  console.log("Get pending items:", { data, error });

  if (error) {
    console.error("Failed to fetch pending items:", error);
    return [];
  }

  return data || [];
}

/**
 * Approve an item in the queue
 */
export async function approveQueueItem(
  queueId: string,
  reviewerId: string,
  reason?: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("moderation_queue")
    .update({
      status: "approved",
      decision: "approve",
      decision_reason: reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", queueId);

  console.log("Approve queue item:", { queueId, error });

  if (error) {
    console.error("Failed to approve queue item:", error);
    return { success: false };
  }

  return { success: true };
}

/**
 * Reject an item in the queue
 */
export async function rejectQueueItem(
  queueId: string,
  reviewerId: string,
  reason: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("moderation_queue")
    .update({
      status: "rejected",
      decision: "reject",
      decision_reason: reason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", queueId);

  console.log("Reject queue item:", { queueId, error });

  if (error) {
    console.error("Failed to reject queue item:", error);
    return { success: false };
  }

  return { success: true };
}