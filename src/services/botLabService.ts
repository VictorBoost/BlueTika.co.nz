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
    if (!user) {
      console.log("No user authenticated");
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const hasAccess = profile?.email === "bluetikanz@gmail.com";
    console.log("Owner access check:", { email: profile?.email, hasAccess });
    return hasAccess;
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
      schedule: "Every 5-8 minutes (automatic)",
      dailyBotCount: "Each bot runs full cycle",
      actions: [
        "✅ Post 1-5 projects per bot",
        "✅ Submit 1-3 bids per bot",
        "✅ Accept 1-2 bids and create contracts",
        "✅ Complete Stripe payments (TEST MODE)",
        "✅ Upload before/after photos",
        "✅ Submit work for approval",
        "🔄 Auto-release funds after 48 hours"
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

  async testBotPayment(contractId: string) {
    try {
      const response = await fetch('/api/bot-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Payment test failed:", error);
      throw error;
    }
  },

  async runManualCycle() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hourly-bot-cycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Cycle failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Manual cycle failed:", error);
      throw error;
    }
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
    try {
      // Get oldest bots first
      const { data: bots, error: fetchError } = await supabase
        .from("bot_accounts")
        .select("id, profile_id")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(count);

      if (fetchError) {
        console.error("Fetch bots error:", fetchError);
        return { success: 0, failed: count, errors: [fetchError.message] };
      }

      if (!bots || bots.length === 0) {
        return { success: 0, failed: 0, errors: ["No bots to remove"] };
      }

      const profileIds = bots.map(b => b.profile_id);
      const results = { success: 0, failed: 0, errors: [] as string[] };

      // Delete all related data for these bots
      try {
        // 1. Get contract IDs to delete child records
        const { data: contracts } = await supabase
          .from("contracts")
          .select("id")
          .or(`client_id.in.(${profileIds.join(',')}),provider_id.in.(${profileIds.join(',')})`);

        const contractIds = contracts?.map(c => c.id) || [];

        // 2. Delete contract-related data
        if (contractIds.length > 0) {
          const { error: e1 } = await (supabase as any).from("evidence_photos").delete().in("contract_id", contractIds);
          if (e1) console.error("evidence_photos delete error:", e1.message);
          
          const { error: e2 } = await (supabase as any).from("contract_messages").delete().in("contract_id", contractIds);
          if (e2) console.error("contract_messages delete error:", e2.message);
          
          const { error: e3 } = await (supabase as any).from("reviews").delete().in("contract_id", contractIds);
          if (e3) console.error("reviews delete error (by contract):", e3.message);
        }

        // 3. Delete reviews by bot IDs
        await (supabase as any).from("reviews").delete().in("reviewer_id", profileIds);
        await (supabase as any).from("reviews").delete().in("reviewee_id", profileIds);

        // 4. Delete contracts
        await (supabase as any).from("contracts").delete().in("client_id", profileIds);
        await (supabase as any).from("contracts").delete().in("provider_id", profileIds);

        // 5. Delete bids
        await (supabase as any).from("bids").delete().in("provider_id", profileIds);

        // 6. Get project IDs
        const { data: projects } = await (supabase as any)
          .from("projects")
          .select("id")
          .in("client_id", profileIds);

        const projectIds = projects?.map((p: any) => p.id) || [];

        // 7. Delete project bids
        if (projectIds.length > 0) {
          await (supabase as any).from("bids").delete().in("project_id", projectIds);
        }

        // 8. Delete projects
        await (supabase as any).from("projects").delete().in("client_id", profileIds);

        // 9. Delete bot activity logs
        await (supabase as any).from("bot_activity_logs").delete().in("bot_id", profileIds);

        // 10. Delete bot bypass attempts
        await (supabase as any).from("bot_bypass_attempts").delete().in("bot_profile_id", profileIds);

        // 11. Delete bot accounts
        await (supabase as any).from("bot_accounts").delete().in("profile_id", profileIds);

        // 12. Delete profiles
        const { error: profileError } = await (supabase as any)
          .from("profiles")
          .delete()
          .in("id", profileIds);

        if (profileError) {
          console.error("Profile deletion error:", profileError);
          results.failed = bots.length;
          results.errors.push(profileError.message);
        } else {
          results.success = bots.length;
        }
      } catch (error: any) {
        console.error("Cascade deletion error:", error);
        results.failed = bots.length;
        results.errors.push(error.message);
      }

      return results;
    } catch (error: any) {
      console.error("removeBots error:", error);
      return { success: 0, failed: count, errors: [error.message] };
    }
  },

  async killSwitch() {
    try {
      console.log("🚨 Kill switch initiated...");
      
      // Disable automation first
      await this.toggleAutomation(false);
      await this.toggleBotPayments(false);
      console.log("✅ Automation disabled");

      // Get all bot profile IDs
      const { data: botProfiles } = await supabase
        .from("bot_accounts")
        .select("profile_id");

      const profileIds = botProfiles?.map(b => b.profile_id) || [];
      
      if (profileIds.length === 0) {
        console.log("ℹ️ No bots to delete");
        return { success: true, deleted: 0 };
      }

      console.log(`📊 Found ${profileIds.length} bots to delete`);

      // Delete in proper cascade order
      console.log("🗑️ Step 1: Deleting contract-related data...");
      const { data: allContracts } = await supabase
        .from("contracts")
        .select("id")
        .or(`client_id.in.(${profileIds.join(',')}),provider_id.in.(${profileIds.join(',')})`);

      const contractIds = allContracts?.map(c => c.id) || [];
      console.log(`   Found ${contractIds.length} contracts`);

      if (contractIds.length > 0) {
        await (supabase as any).from("evidence_photos").delete().in("contract_id", contractIds);
        await (supabase as any).from("contract_messages").delete().in("contract_id", contractIds);
        await (supabase as any).from("reviews").delete().in("contract_id", contractIds);
        console.log("   ✅ Contract children deleted");
      }

      console.log("🗑️ Step 2: Deleting reviews...");
      await (supabase as any).from("reviews").delete().in("reviewer_id", profileIds);
      await (supabase as any).from("reviews").delete().in("reviewee_id", profileIds);
      console.log("   ✅ Reviews deleted");

      console.log("🗑️ Step 3: Deleting contracts...");
      await (supabase as any).from("contracts").delete().in("client_id", profileIds);
      await (supabase as any).from("contracts").delete().in("provider_id", profileIds);
      console.log("   ✅ Contracts deleted");

      console.log("🗑️ Step 4: Deleting bids...");
      await (supabase as any).from("bids").delete().in("provider_id", profileIds);
      
      const { data: allProjects } = await supabase
        .from("projects")
        .select("id")
        .in("client_id", profileIds);

      const projectIds = allProjects?.map((p: any) => p.id) || [];
      if (projectIds.length > 0) {
        await (supabase as any).from("bids").delete().in("project_id", projectIds);
      }
      console.log("   ✅ Bids deleted");

      console.log("🗑️ Step 5: Deleting projects...");
      await (supabase as any).from("projects").delete().in("client_id", profileIds);
      console.log("   ✅ Projects deleted");

      console.log("🗑️ Step 6: Deleting bot metadata...");
      await (supabase as any).from("bot_activity_logs").delete().in("bot_id", profileIds);
      await (supabase as any).from("bot_bypass_attempts").delete().in("bot_profile_id", profileIds);
      console.log("   ✅ Bot metadata deleted");

      console.log("🗑️ Step 7: Deleting bot accounts...");
      await (supabase as any).from("bot_accounts").delete().in("profile_id", profileIds);
      console.log("   ✅ Bot accounts deleted");

      console.log("🗑️ Step 8: Deleting profiles...");
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .delete()
        .in("id", profileIds);

      if (profileError) {
        console.error("❌ Profile deletion failed:", profileError);
        throw profileError;
      }

      console.log("   ✅ Profiles deleted");
      console.log(`✅ Kill switch complete! Deleted ${profileIds.length} bots`);

      return { success: true, deleted: profileIds.length };
    } catch (error: any) {
      console.error("❌ Kill switch error:", error);
      return { success: false, error: error.message, deleted: 0 };
    }
  },

  async getBotStats() {
    // Get bot profile IDs first
    const { data: botProfiles } = await supabase
      .from("bot_accounts")
      .select("profile_id")
      .eq("is_active", true);

    const botProfileIds = botProfiles?.map(b => b.profile_id) || [];

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

    // Get entity counts (only bot-created)
    const { count: totalProjects } = await (supabase as any)
      .from("projects")
      .select("*", { count: "exact", head: true })
      .in("client_id", botProfileIds);

    const { count: totalBids } = await (supabase as any)
      .from("bids")
      .select("*", { count: "exact", head: true })
      .in("provider_id", botProfileIds);

    const { count: totalContracts } = await (supabase as any)
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .in("client_id", botProfileIds);

    const { count: paidContracts } = await (supabase as any)
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .in("payment_status", ["held", "released"])
      .in("client_id", botProfileIds);

    const { count: completedContracts } = await (supabase as any)
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .in("client_id", botProfileIds);

    const { count: totalReviews } = await (supabase as any)
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .in("reviewer_id", botProfileIds);

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
      totalProjects: totalProjects || 0,
      totalBids: totalBids || 0,
      totalContracts: totalContracts || 0,
      paidContracts: paidContracts || 0,
      completedContracts: completedContracts || 0,
      totalReviews: totalReviews || 0,
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
  },

  async getTrendData() {
    // Get activity logs for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs } = await supabase
      .from("bot_activity_logs")
      .select("created_at, action_type")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    // Group by date
    const dailyActivity = (logs || []).reduce((acc, log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, post_project: 0, submit_bid: 0, accept_bid: 0, make_payment: 0, submit_review: 0 };
      }
      acc[date].total++;
      if (log.action_type) {
        acc[date][log.action_type as keyof typeof acc[typeof date]] = (acc[date][log.action_type as keyof typeof acc[typeof date]] as number) + 1;
      }
      return acc;
    }, {} as Record<string, any>);

    // Get bot count history (approximate by looking at creation timestamps)
    const { data: botAccounts } = await supabase
      .from("bot_accounts")
      .select("created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const dailyBotGrowth = (botAccounts || []).reduce((acc, bot) => {
      const date = new Date(bot.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to cumulative
    let cumulativeBots = 0;
    const botGrowthData = Object.keys(dailyBotGrowth).sort().map(date => {
      cumulativeBots += dailyBotGrowth[date];
      return { date, count: cumulativeBots };
    });

    return {
      activityTrend: Object.values(dailyActivity),
      botGrowth: botGrowthData
    };
  }
};