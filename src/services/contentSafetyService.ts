import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Content safety patterns
const PHONE_PATTERNS = [
  /\b0\s*2[0-9]\s*\d{3}\s*\d{4}\b/gi, // 021 123 4567
  /\b0\s*9\s*\d{3}\s*\d{4}\b/gi, // 09 123 4567
  /\+\s*64\s*\d{1,2}\s*\d{3}\s*\d{4}\b/gi, // +64 21 123 4567
  /\bzero\s*two/gi, // zero two
  /\boh\s*two/gi, // oh two
  /\bzzero2one/gi, // zzero2one
  /\bcall\s*me/gi, // call me
  /\bring\s*me/gi, // ring me
  /\btxt\s*me/gi, // txt me
  /\btext\s*me/gi, // text me
  /\bmy\s*number\s*is/gi, // my number is
  /\bphone\s*me/gi, // phone me
];

const EMAIL_PATTERNS = [
  /@/g, // @ symbol
  /\bgmail/gi,
  /\bhotmail/gi,
  /\byahoo/gi,
  /\.co\.nz\b(?!\s*(website|site|page|blog))/gi, // .co.nz as contact (not website)
  /\bemail\s*me\s*at/gi,
  /\bcontact\s*me\s*at/gi,
];

const SOCIAL_MEDIA_PATTERNS = [
  /\bfacebook/gi,
  /\binstagram/gi,
  /\bwhatsapp/gi,
  /\bmessenger/gi,
  /\bsnapchat/gi,
  /\btiktok/gi,
  /\bfind\s*me\s*on/gi,
  /\bDM\s*me/gi,
  /\badd\s*me\s*on/gi,
];

const URL_PATTERNS = [
  /\bhttps?:\/\//gi,
  /\bwww\./gi,
  /\.com\b/gi,
  /\.net\b/gi,
  /\.nz\b(?!\s*owned)/gi, // .nz but not "NZ owned"
  /\.org\b/gi,
];

const BANK_ACCOUNT_PATTERNS = [
  /\b\d{2}-\d{4}-\d{7}-\d{2}\b/g, // XX-XXXX-XXXXXXX-XX
  /\bbank\s*account/gi,
  /\baccount\s*number/gi,
];

const BYPASS_PHRASES = [
  /\bpay\s*me\s*directly/gi,
  /\boutside\s*the\s*platform/gi,
  /\bmy\s*number\s*is/gi,
  /\bcontact\s*me\s*at/gi,
  /\boff\s*platform/gi,
  /\bavoid\s*fees/gi,
  /\bskip\s*fees/gi,
  /\bno\s*commission/gi,
];

interface DetectionResult {
  isBlocked: boolean;
  detectedPatterns: string[];
  message?: string;
}

export interface BypassAttempt {
  userId: string;
  content: string;
  detectedPatterns: string[];
  pageLocation: string;
  escalationLevel: number;
}

export const contentSafetyService = {
  /**
   * Check content for forbidden patterns
   */
  checkContent(content: string, allowPhoneNumbers = false): DetectionResult {
    const detectedPatterns: string[] = [];

    // Check phone patterns (unless explicitly allowed)
    if (!allowPhoneNumbers) {
      PHONE_PATTERNS.forEach((pattern) => {
        if (pattern.test(content)) {
          detectedPatterns.push("phone_number");
        }
      });
    }

    // Check email patterns
    EMAIL_PATTERNS.forEach((pattern) => {
      if (pattern.test(content)) {
        detectedPatterns.push("email");
      }
    });

    // Check social media patterns
    SOCIAL_MEDIA_PATTERNS.forEach((pattern) => {
      if (pattern.test(content)) {
        detectedPatterns.push("social_media");
      }
    });

    // Check URL patterns
    URL_PATTERNS.forEach((pattern) => {
      if (pattern.test(content)) {
        detectedPatterns.push("url");
      }
    });

    // Check bank account patterns
    BANK_ACCOUNT_PATTERNS.forEach((pattern) => {
      if (pattern.test(content)) {
        detectedPatterns.push("bank_account");
      }
    });

    // Check bypass phrases
    BYPASS_PHRASES.forEach((pattern) => {
      if (pattern.test(content)) {
        detectedPatterns.push("bypass_phrase");
      }
    });

    const isBlocked = detectedPatterns.length > 0;

    return {
      isBlocked,
      detectedPatterns: [...new Set(detectedPatterns)], // Remove duplicates
      message: isBlocked
        ? "For everyone's protection, personal contact details cannot be shared on BlueTika."
        : undefined,
    };
  },

  /**
   * Log a bypass attempt and handle escalation
   */
  async logBypassAttempt(
    userId: string,
    content: string,
    detectedPatterns: string[],
    pageLocation: string
  ): Promise<{
    success: boolean;
    escalationLevel: number;
    action: string;
    error?: string;
  }> {
    try {
      // Get current attempt count
      const { data: attempts, error: attemptsError } = await supabase
        .from("bypass_attempts")
        .select("id")
        .eq("user_id", userId);

      if (attemptsError) throw attemptsError;

      const attemptCount = (attempts?.length || 0) + 1;
      const escalationLevel = Math.min(attemptCount, 5);

      // Log the attempt
      const { error: logError } = await supabase
        .from("bypass_attempts")
        .insert({
          user_id: userId,
          content_attempted: content.substring(0, 500), // Limit stored content
          detected_patterns: detectedPatterns,
          page_location: pageLocation,
          escalation_level: escalationLevel,
        });

      if (logError) throw logError;

      // Handle escalation
      let action = "blocked";

      if (escalationLevel === 2) {
        // Yellow warning flag
        await this.updateSuspensionStatus(userId, "warning", attemptCount);
        action = "warning_flagged";
      } else if (escalationLevel === 3) {
        // 24-hour chat suspension
        await this.updateSuspensionStatus(
          userId,
          "chat_suspended",
          attemptCount
        );
        action = "chat_suspended_24h";
      } else if (escalationLevel === 4) {
        // Auto-suspended, admin notified
        await this.updateSuspensionStatus(
          userId,
          "auto_suspended",
          attemptCount
        );
        await this.notifyAdminOfSuspension(userId, attemptCount);
        action = "auto_suspended";
      } else if (escalationLevel >= 5) {
        // Permanent ban
        await this.updateSuspensionStatus(
          userId,
          "permanently_banned",
          attemptCount
        );
        await this.notifyAdminOfBan(userId, attemptCount);
        action = "permanently_banned";
      }

      return {
        success: true,
        escalationLevel,
        action,
      };
    } catch (error) {
      console.error("Error logging bypass attempt:", error);
      return {
        success: false,
        escalationLevel: 1,
        action: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Update account suspension status
   */
  async updateSuspensionStatus(
    userId: string,
    suspensionType: "warning" | "chat_suspended" | "auto_suspended" | "permanently_banned",
    attemptCount: number
  ): Promise<void> {
    const suspensionEndsAt =
      suspensionType === "chat_suspended"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : suspensionType === "permanently_banned"
        ? null
        : undefined;

    // Deactivate previous suspensions
    await supabase
      .from("account_suspensions")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    // Create new suspension
    await supabase.from("account_suspensions").insert({
      user_id: userId,
      suspension_type: suspensionType,
      bypass_attempt_count: attemptCount,
      suspension_ends_at: suspensionEndsAt,
      is_active: true,
    });
  },

  /**
   * Check if user is suspended or banned
   */
  async checkUserStatus(userId: string): Promise<{
    isSuspended: boolean;
    suspensionType: string | null;
    attemptCount: number;
    endsAt: string | null;
  }> {
    const { data: suspension } = await supabase
      .from("account_suspensions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!suspension) {
      return {
        isSuspended: false,
        suspensionType: null,
        attemptCount: 0,
        endsAt: null,
      };
    }

    // Check if chat suspension has expired
    if (
      suspension.suspension_type === "chat_suspended" &&
      suspension.suspension_ends_at
    ) {
      const endsAt = new Date(suspension.suspension_ends_at);
      if (endsAt < new Date()) {
        // Suspension expired, deactivate it
        await supabase
          .from("account_suspensions")
          .update({ is_active: false })
          .eq("id", suspension.id);

        return {
          isSuspended: false,
          suspensionType: null,
          attemptCount: suspension.bypass_attempt_count,
          endsAt: null,
        };
      }
    }

    return {
      isSuspended: true,
      suspensionType: suspension.suspension_type,
      attemptCount: suspension.bypass_attempt_count,
      endsAt: suspension.suspension_ends_at,
    };
  },

  /**
   * Notify admin of account auto-suspension
   */
  async notifyAdminOfSuspension(
    userId: string,
    attemptCount: number
  ): Promise<void> {
    try {
      // Get user details
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (!profile) return;

      // Send email to admin via Edge Function
      await supabase.functions.invoke("send-admin-suspension-alert", {
        body: {
          userName: profile.full_name,
          userEmail: profile.email,
          attemptCount,
          suspensionType: "auto_suspended",
        },
      });
    } catch (error) {
      console.error("Error notifying admin of suspension:", error);
    }
  },

  /**
   * Notify admin of permanent ban
   */
  async notifyAdminOfBan(userId: string, attemptCount: number): Promise<void> {
    try {
      // Get user details
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (!profile) return;

      // Send email to admin via Edge Function
      await supabase.functions.invoke("send-admin-suspension-alert", {
        body: {
          userName: profile.full_name,
          userEmail: profile.email,
          attemptCount,
          suspensionType: "permanently_banned",
        },
      });
    } catch (error) {
      console.error("Error notifying admin of ban:", error);
    }
  },

  /**
   * Get bypass attempts for a user (admin only)
   */
  async getUserBypassAttempts(
    userId: string
  ): Promise<Tables<"bypass_attempts">[]> {
    const { data, error } = await supabase
      .from("bypass_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bypass attempts:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get all bypass attempts (admin only)
   */
  async getAllBypassAttempts(): Promise<
    (Tables<"bypass_attempts"> & { profile: { full_name: string; email: string } | null })[]
  > {
    const { data, error } = await supabase
      .from("bypass_attempts")
      .select(
        `
        *,
        profile:profiles(full_name, email)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching all bypass attempts:", error);
      return [];
    }

    return data || [];
  },
};