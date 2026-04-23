import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Insert"];
type Bid = Database["public"]["Tables"]["bids"]["Insert"];

// Realistic NZ data
const NZ_FIRST_NAMES = [
  "Aroha", "Hemi", "Kiri", "Matiu", "Ngaire", "Rawiri", "Tane", "Whetu",
  "James", "Sophie", "Liam", "Emma", "Oliver", "Charlotte", "Mason", "Amelia",
  "Jack", "Mia", "Noah", "Harper", "Lucas", "Isla", "Cooper", "Grace",
  "Hunter", "Zoe", "Joshua", "Ruby", "Ryan", "Lily", "Cameron", "Ella",
  "Thomas", "Hannah", "Benjamin", "Olivia", "Samuel", "Ava", "William", "Chloe",
  "Daniel", "Sophia", "Matthew", "Emily", "Jacob", "Lucy", "Alexander", "Isabella",
  "Ethan", "Madison"
];

const NZ_LAST_NAMES = [
  "Smith", "Brown", "Wilson", "Taylor", "Anderson", "Thomas", "Jackson", "White",
  "Harris", "Martin", "Thompson", "Young", "Walker", "Clark", "Wright", "Green",
  "Hall", "Hughes", "King", "Lee", "Robinson", "Wood", "Campbell", "Mitchell",
  "Roberts", "Turner", "Phillips", "Edwards", "Stewart", "Carter", "Parker", "Collins",
  "Te Rangi", "Ngata", "Takerei", "Parata", "Kingi", "Tamati", "Matene", "Rata",
  "Patel", "Singh", "Wong", "Chen", "Kumar", "Li", "Zhang", "Kim", "Nguyen", "Park"
];

const NZ_CITIES = [
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
  "Dunedin", "Palmerston North", "Napier", "Nelson", "Rotorua",
  "New Plymouth", "Whangarei", "Invercargill", "Gisborne", "Timaru",
  "Queenstown", "Blenheim", "Masterton", "Levin", "Ashburton"
];

const PROVIDER_BIOS = [
  "Experienced professional with 5+ years in the industry. Quality workmanship guaranteed.",
  "Licensed and insured. Providing top-notch service across the greater {city} area.",
  "Family-owned business serving Kiwi homes since 2015. Honest pricing, reliable service.",
  "Passionate about delivering excellent results. No job too big or small.",
  "Professional service provider committed to customer satisfaction. Free quotes available.",
  "Qualified tradesperson with proven track record. References available upon request.",
  "Dedicated to providing quality workmanship at competitive rates.",
  "Friendly, reliable service you can trust. Servicing {city} and surrounding areas.",
  "Years of experience delivering outstanding results. Your satisfaction is my priority.",
  "Local expert providing professional services throughout the region."
];

const CLIENT_BIOS = [
  "Homeowner looking for reliable service providers in {city}.",
  "Small business owner needing professional help for various projects.",
  "Looking for trusted tradies to help with home improvements.",
  "Busy professional seeking quality service providers.",
  "Property manager requiring reliable contractors.",
  "First home buyer needing help with renovations.",
  "Looking for skilled professionals for ongoing projects.",
  "Homeowner committed to supporting local businesses.",
  "Seeking experienced service providers for quality work.",
  "Regular client looking for dependable contractors."
];

// Helper functions
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInRange = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateEmail = (firstName: string, lastName: string, batch: number): string => {
  const normalized = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `bot.${normalized}.${batch}.${Date.now()}@botlab.bluetika.test`;
};

const generateBio = (isProvider: boolean, city: string): string => {
  const template = randomItem(isProvider ? PROVIDER_BIOS : CLIENT_BIOS);
  return template.replace("{city}", city);
};

export const botLabService = {
  async checkOwnerAccess(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    return profile?.email === "bluetikanz@gmail.com";
  },

  async getAutomationStatus() {
    const { data: automationSetting } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "bot_automation_enabled")
      .single();

    const { data: paymentSetting } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "bot_payments_enabled")
      .single();

    const isEnabled = automationSetting?.setting_value === "true";
    const paymentsEnabled = paymentSetting?.setting_value === "true";

    return {
      isActive: isEnabled,
      paymentsEnabled,
      schedule: "Daily at random times between 6am-10pm NZST",
      dailyBotCount: "20-30 bots per day",
      actions: paymentsEnabled ? [
        "Generate 20-30 new bot accounts",
        "Bots post 1-3 project listings",
        "Bots submit 2-5 bids on other listings", 
        "Bots accept bids and create contracts",
        "Bots complete Stripe payments (TEST MODE)",
        "Bots upload before/after photos",
        "Bots leave 4-5 star reviews"
      ] : [
        "Generate 20-30 new bot accounts",
        "Bots post 1-3 project listings",
        "Bots submit 2-5 bids on other listings",
        "❌ Bot payments disabled - no contract acceptance",
        "❌ No contract completion or reviews"
      ]
    };
  },

  async toggleAutomation(enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("platform_settings")
      .update({ 
        setting_value: enabled ? "true" : "false",
        updated_at: new Date().toISOString()
      })
      .eq("setting_key", "bot_automation_enabled");

    if (error) {
      console.error("Failed to toggle automation:", error);
      return false;
    }

    return true;
  },

  async toggleBotPayments(enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("platform_settings")
      .update({ 
        setting_value: enabled ? "true" : "false",
        updated_at: new Date().toISOString()
      })
      .eq("setting_key", "bot_payments_enabled");

    if (error) {
      console.error("Failed to toggle bot payments:", error);
      return false;
    }

    return true;
  },

  async generateBots(count: number = 50) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      botIds: [] as string[]
    };

    const batch = Date.now();
    const providerCount = Math.floor(count * 0.4);
    const clientCount = count - providerCount;

    // Generate provider bots
    for (let i = 0; i < providerCount; i++) {
      try {
        const botId = await this.createBot("provider", batch);
        if (botId) {
          results.success++;
          results.botIds.push(botId);
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Provider bot ${i}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Generate client bots
    for (let i = 0; i < clientCount; i++) {
      try {
        const botId = await this.createBot("client", batch);
        if (botId) {
          results.success++;
          results.botIds.push(botId);
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Client bot ${i}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return results;
  },

  async createBot(type: "client" | "provider", batch: number): Promise<string | null> {
    const firstName = randomItem(NZ_FIRST_NAMES);
    const lastName = randomItem(NZ_LAST_NAMES);
    const city = randomItem(NZ_CITIES);
    const email = generateEmail(firstName, lastName, batch);
    const password = `BotPass${batch}!`;

    try {
      // Create auth user via server-side API (more reliable than client-side signUp)
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneNumber: `021 ${randomInRange(100, 999)} ${randomInRange(1000, 9999)}`,
          cityRegion: city,
          isClient: type === "client" || type === "provider",
          isProvider: type === "provider"
        })
      });

      const data = await response.json();

      if (!response.ok || !data.user) {
        console.error("Bot registration failed:", data.error);
        return null;
      }

      const userId = data.user.id;

      // Update profile with bot-specific data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bio: generateBio(type === "provider", city),
          location: city,
          verification_status: type === "provider" ? "approved" : "not_started"
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Profile update failed:", profileError);
      }

      // Create bot account record
      const { data: botData, error: botError } = await supabase
        .from("bot_accounts")
        .insert({
          profile_id: userId,
          bot_type: type,
          generation_batch: batch
        })
        .select()
        .single();

      if (botError || !botData) {
        console.error("Bot account creation failed:", botError);
        return null;
      }

      return botData.id;
    } catch (error) {
      console.error("Error creating bot:", error);
      return null;
    }
  },

  async removeBots(count: number = 50) {
    const { data: bots, error } = await supabase
      .from("bot_accounts")
      .select("id, profile_id")
      .eq("is_active", true)
      .limit(count);

    if (error || !bots) {
      return { success: 0, failed: count, errors: [error?.message || "Failed to fetch bots"] };
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const bot of bots) {
      try {
        // Delete bot account (cascades to profile which cascades to all content)
        const { error: deleteError } = await supabase
          .from("bot_accounts")
          .delete()
          .eq("id", bot.id);

        if (deleteError) {
          results.failed++;
          results.errors.push(`Bot ${bot.id}: ${deleteError.message}`);
        } else {
          results.success++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Bot ${bot.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return results;
  },

  async killSwitch() {
    // Get ALL bot profile IDs
    const { data: bots, error: fetchError } = await supabase
      .from("bot_accounts")
      .select("profile_id")
      .eq("is_active", true);

    if (fetchError) {
      return { 
        success: false, 
        deleted: 0, 
        error: fetchError.message 
      };
    }

    if (!bots || bots.length === 0) {
      return { 
        success: true, 
        deleted: 0, 
        message: "No active bots to delete" 
      };
    }

    const profileIds = bots.map(b => b.profile_id);
    const totalBots = profileIds.length;

    // Disable automation first
    await this.toggleAutomation(false);

    // Delete all bot profiles at once via RPC
    const { error: deleteError } = await supabase.rpc("delete_bot_profiles", {
      profile_ids: profileIds
    });

    if (deleteError) {
      // Fallback: delete profiles directly (cascades to all content)
      let deleted = 0;
      const errors = [];
      
      for (const profileId of profileIds) {
        try {
          // Delete profile (cascades to bot_accounts and all content)
          const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("id", profileId);
            
          if (!error) {
            deleted++;
          } else {
            errors.push(error.message);
          }
        } catch (e) {
          errors.push(e instanceof Error ? e.message : "Unknown error");
        }
      }

      return {
        success: deleted > 0,
        deleted,
        total: totalBots,
        automationDisabled: true,
        errors: errors.length > 0 ? errors : undefined
      };
    }

    return {
      success: true,
      deleted: totalBots,
      automationDisabled: true,
      message: `Successfully deleted ${totalBots} bots and all their content. Automation disabled.`
    };
  },

  async getBotStats() {
    // Get total bot counts
    const { count: totalBots } = await supabase
      .from("bot_accounts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: providerBots } = await supabase
      .from("bot_accounts")
      .select("*", { count: "exact", head: true })
      .eq("bot_type", "service_provider")
      .eq("is_active", true);

    const { count: clientBots } = await supabase
      .from("bot_accounts")
      .select("*", { count: "exact", head: true })
      .eq("bot_type", "client")
      .eq("is_active", true);

    // Get error logs
    const { data: errorLogs } = await supabase
      .from("bot_activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const errorSummary = (errorLogs || []).reduce((acc, log) => {
      if (log.error_message) {
        const key = log.action_type || "unknown";
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBots: totalBots || 0,
      providerBots: providerBots || 0,
      clientBots: clientBots || 0,
      errorSummary,
      recentErrors: errorLogs?.filter(log => log.error_message).slice(0, 20) || []
    };
  },

  async getBypassLogs() {
    // Get all bypass attempts
    const { data: allAttempts, count: totalAttempts } = await supabase
      .from("bot_bypass_attempts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Count by detection status
    const { count: detected } = await supabase
      .from("bot_bypass_attempts")
      .select("*", { count: "exact", head: true })
      .eq("detection_status", "detected");

    const { count: warned } = await supabase
      .from("bot_bypass_attempts")
      .select("*", { count: "exact", head: true })
      .eq("detection_status", "warned");

    const { count: flagged } = await supabase
      .from("bot_bypass_attempts")
      .select("*", { count: "exact", head: true })
      .eq("detection_status", "flagged");

    // Count by attempt type
    const typeBreakdown = (allAttempts || []).reduce((acc, attempt) => {
      const type = attempt.attempt_type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent attempts with project/bid details
    const { data: recentAttempts } = await supabase
      .from("bot_bypass_attempts")
      .select(`
        *,
        bot:profiles!bot_bypass_attempts_bot_profile_id_fkey(full_name),
        project:projects(id, title),
        bid:bids(id, message)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    return {
      totalAttempts: totalAttempts || 0,
      detected: detected || 0,
      warned: warned || 0,
      flagged: flagged || 0,
      pending: (totalAttempts || 0) - (detected || 0) - (warned || 0) - (flagged || 0),
      typeBreakdown,
      recentAttempts: recentAttempts || [],
      detectionRate: totalAttempts ? ((detected || 0) / totalAttempts * 100).toFixed(1) : "0.0"
    };
  }
};