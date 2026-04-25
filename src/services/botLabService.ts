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
        "Bots post 5-8 project listings each",
        "Bots submit 1-2 bids on other listings each", 
        "Bots accept bids and create contracts",
        "Bots complete Stripe payments (TEST MODE)",
        "Bots upload before/after photos",
        "Bots leave 4-5 star reviews"
      ] : [
        "Generate 20-30 new bot accounts",
        "Bots post 5-8 project listings each",
        "Bots submit 1-2 bids on other listings each",
        "❌ Bot payments disabled - no contract acceptance",
        "❌ No contract completion or reviews"
      ]
    };
  },

  async toggleAutomation(enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ 
        setting_key: "bot_automation_enabled",
        setting_value: enabled ? "true" : "false",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "setting_key"
      });

    if (error) {
      console.error("Failed to toggle automation:", error);
      return false;
    }

    return true;
  },

  async toggleBotPayments(enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ 
        setting_key: "bot_payments_enabled",
        setting_value: enabled ? "true" : "false",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "setting_key"
      });

    if (error) {
      console.error("Failed to toggle bot payments:", error);
      return false;
    }

    return true;
  },

  async generateBots(count: number = 50) {
    try {
      const response = await fetch('/api/generate-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Failed to generate bots:", error);
      return { success: 0, failed: count, errors: [error instanceof Error ? error.message : "Unknown error"] };
    }
  },

  async createBot(type: "client" | "provider", batch: number): Promise<string | null> {
    try {
      const response = await fetch('/api/generate-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 })
      });
      const data = await response.json();
      return data.success > 0 ? "success" : null;
    } catch (error) {
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
    try {
      // Disable automation first
      await this.toggleAutomation(false);
      await this.toggleBotPayments(false);

      // Delete all bot-related content in correct order (respecting FK constraints)
      // 1. Evidence photos
      await supabase
        .from("evidence_photos")
        .delete()
        .in("contract_id", 
          supabase.from("contracts").select("id").in("client_id", 
            supabase.from("bot_accounts").select("profile_id")
          )
        );

      // 2. Contract messages
      await supabase
        .from("contract_messages")
        .delete()
        .in("contract_id",
          supabase.from("contracts").select("id").in("client_id",
            supabase.from("bot_accounts").select("profile_id")
          )
        );

      // 3. Reviews
      await supabase
        .from("reviews")
        .delete()
        .in("contract_id",
          supabase.from("contracts").select("id").in("client_id",
            supabase.from("bot_accounts").select("profile_id")
          )
        );

      // 4. Contracts
      const { error: contractsError } = await supabase
        .from("contracts")
        .delete()
        .in("client_id",
          supabase.from("bot_accounts").select("profile_id")
        );

      if (contractsError) throw contractsError;

      // 5. Bids
      const { error: bidsError } = await supabase
        .from("bids")
        .delete()
        .in("provider_id",
          supabase.from("bot_accounts").select("profile_id")
        );

      if (bidsError) throw bidsError;

      // 6. Projects
      const { error: projectsError } = await supabase
        .from("projects")
        .delete()
        .in("client_id",
          supabase.from("bot_accounts").select("profile_id")
        );

      if (projectsError) throw projectsError;

      // 7. Bot activity logs
      const { error: logsError } = await supabase
        .from("bot_activity_logs")
        .delete()
        .in("bot_id",
          supabase.from("bot_accounts").select("profile_id")
        );

      if (logsError) throw logsError;

      // 8. Get bot profile IDs before deleting bot_accounts
      const { data: botProfiles } = await supabase
        .from("bot_accounts")
        .select("profile_id");

      const profileIds = botProfiles?.map(b => b.profile_id) || [];

      // 9. Delete bot_accounts
      const { error: botAccountsError } = await supabase
        .from("bot_accounts")
        .delete()
        .in("profile_id", profileIds);

      if (botAccountsError) throw botAccountsError;

      // 10. Delete profiles
      const { error: profilesError } = await supabase
        .from("profiles")
        .delete()
        .in("id", profileIds);

      if (profilesError) throw profilesError;

      return { success: true, deleted: profileIds.length };
    } catch (error: any) {
      console.error("Kill switch error:", error);
      return { success: false, error: error.message, deleted: 0 };
    }
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