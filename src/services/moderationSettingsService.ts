import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ModerationSetting = Database["public"]["Tables"]["moderation_settings"]["Row"];
type ModerationSettingInsert = Database["public"]["Tables"]["moderation_settings"]["Insert"];

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
  driver_licence: boolean; // Always manual - cannot be changed
  police_check: boolean; // Always manual - cannot be changed
  trade_certificate: boolean; // Always manual - cannot be changed
  project_media: boolean;
  chat_message: boolean;
  review: boolean;
  bot_content: boolean;
}

const FIXED_MANUAL_TYPES: ContentType[] = [
  "driver_licence",
  "police_check",
  "trade_certificate",
];

const DEFAULT_SETTINGS: ModerationSettings = {
  project_listing: true, // Auto-approve with safety filter
  profile_photo: true, // Auto-approve
  driver_licence: false, // Manual always
  police_check: false, // Manual always
  trade_certificate: false, // Manual always
  project_media: true, // Auto-approve
  chat_message: true, // Auto-filter
  review: true, // Auto-publish
  bot_content: true, // Auto
};

/**
 * Get current moderation settings
 */
export async function getModerationSettings(): Promise<ModerationSettings> {
  const { data, error } = await supabase
    .from("moderation_settings")
    .select("*")
    .single();

  console.log("Get moderation settings:", { data, error });

  if (error || !data) {
    // Return defaults if no settings exist
    return DEFAULT_SETTINGS;
  }

  return {
    project_listing: data.project_listing_auto,
    profile_photo: data.profile_photo_auto,
    driver_licence: data.driver_licence_auto,
    police_check: data.police_check_auto,
    trade_certificate: data.trade_certificate_auto,
    project_media: data.project_media_auto,
    chat_message: data.chat_message_auto,
    review: data.review_auto,
    bot_content: data.bot_content_auto,
  };
}

/**
 * Initialize default settings (call once on app setup)
 */
export async function initializeModerationSettings(): Promise<void> {
  const { data: existing } = await supabase
    .from("moderation_settings")
    .select("id")
    .single();

  if (existing) {
    console.log("Moderation settings already exist");
    return;
  }

  const settingsData: ModerationSettingInsert = {
    project_listing_auto: DEFAULT_SETTINGS.project_listing,
    profile_photo_auto: DEFAULT_SETTINGS.profile_photo,
    driver_licence_auto: DEFAULT_SETTINGS.driver_licence,
    police_check_auto: DEFAULT_SETTINGS.police_check,
    trade_certificate_auto: DEFAULT_SETTINGS.trade_certificate,
    project_media_auto: DEFAULT_SETTINGS.project_media,
    chat_message_auto: DEFAULT_SETTINGS.chat_message,
    review_auto: DEFAULT_SETTINGS.review,
    bot_content_auto: DEFAULT_SETTINGS.bot_content,
  };

  const { error } = await supabase
    .from("moderation_settings")
    .insert(settingsData);

  console.log("Initialize moderation settings:", { error });
}

/**
 * Update a specific moderation setting
 */
export async function updateModerationSetting(
  contentType: ContentType,
  autoApprove: boolean
): Promise<{ success: boolean; error?: string }> {
  // Prevent changing fixed manual types
  if (FIXED_MANUAL_TYPES.includes(contentType)) {
    return {
      success: false,
      error: `${contentType.replace(/_/g, " ")} must always be reviewed manually for compliance and safety.`,
    };
  }

  const columnMap: Record<ContentType, string> = {
    project_listing: "project_listing_auto",
    profile_photo: "profile_photo_auto",
    driver_licence: "driver_licence_auto",
    police_check: "police_check_auto",
    trade_certificate: "trade_certificate_auto",
    project_media: "project_media_auto",
    chat_message: "chat_message_auto",
    review: "review_auto",
    bot_content: "bot_content_auto",
  };

  const columnName = columnMap[contentType];

  const { error } = await supabase
    .from("moderation_settings")
    .update({ [columnName]: autoApprove })
    .eq("id", 1); // Single row config

  console.log("Update moderation setting:", {
    contentType,
    autoApprove,
    error,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if a content type should auto-approve
 */
export async function shouldAutoApprove(
  contentType: ContentType
): Promise<boolean> {
  const settings = await getModerationSettings();
  return settings[contentType];
}

/**
 * Queue item for manual review
 */
export async function queueForReview(
  contentType: ContentType,
  itemId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("moderation_queue").insert({
    content_type: contentType,
    item_id: itemId,
    status: "pending",
    metadata: metadata || {},
  });

  console.log("Queue for review:", { contentType, itemId, error });

  if (error) {
    console.error("Failed to queue for review:", error);
  }
}

/**
 * Get pending review queue count
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
export async function getPendingByType(
  contentType: ContentType
): Promise<number> {
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