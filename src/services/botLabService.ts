import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for admin operations that bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("botLabService - No user authenticated");
        return false;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("botLabService - Profile fetch error:", error);
        return false;
      }

      const hasAccess = profile?.email === "bluetikanz@gmail.com";
      console.log("botLabService - Owner access check:", { 
        userId: user.id,
        email: profile?.email, 
        hasAccess 
      });
      
      return hasAccess;
    } catch (error) {
      console.error("botLabService - checkOwnerAccess error:", error);
      return false;
    }
  },

  async getAutomationStatus() {
    try {
      // Use admin client to bypass RLS
      const { data: config } = await supabaseAdmin
        .from("bot_configuration")
        .select("*")
        .single();

      return {
        isActive: config?.automation_enabled || false,
        actions: [
          "Generate bot accounts (clients & providers)",
          "Post projects from client bots",
          "Submit bids from provider bots", 
          "Accept winning bids",
          "Process payments",
          "Complete contracts",
          "Submit reviews"
        ]
      };
    } catch (error) {
      console.error("getAutomationStatus error:", error);
      return { isActive: false, actions: [] };
    }
  },

  async getBotStats() {
    try {
      // Use admin client to bypass RLS
      const [bots, projects, bids, contracts, reviews] = await Promise.all([
        supabaseAdmin.from("bot_accounts").select("*", { count: "exact" }),
        supabaseAdmin.from("projects").select("*", { count: "exact" }).eq("is_bot_generated", true),
        supabaseAdmin.from("bids").select("*", { count: "exact" }),
        supabaseAdmin.from("contracts").select("*", { count: "exact" }),
        supabaseAdmin.from("reviews").select("*", { count: "exact" })
      ]);

      const clientBots = bots.data?.filter((b: any) => b.bot_type === "client").length || 0;
      const providerBots = bots.data?.filter((b: any) => b.bot_type === "provider").length || 0;
      const paidContracts = contracts.data?.filter((c: any) => c.payment_status === "paid").length || 0;

      // Get recent errors
      const { data: errors } = await supabaseAdmin
        .from("bot_activity_logs")
        .select("*")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(20);

      // Count errors by type
      const errorSummary: Record<string, number> = {};
      errors?.forEach((err: any) => {
        errorSummary[err.action_type] = (errorSummary[err.action_type] || 0) + 1;
      });

      return {
        totalBots: bots.count || 0,
        clientBots,
        providerBots,
        totalProjects: projects.count || 0,
        totalBids: bids.count || 0,
        totalContracts: contracts.count || 0,
        paidContracts,
        totalReviews: reviews.count || 0,
        errorSummary,
        recentErrors: errors || []
      };
    } catch (error) {
      console.error("getBotStats error:", error);
      return {
        totalBots: 0,
        clientBots: 0,
        providerBots: 0,
        totalProjects: 0,
        totalBids: 0,
        totalContracts: 0,
        paidContracts: 0,
        totalReviews: 0,
        errorSummary: {},
        recentErrors: []
      };
    }
  },

  async toggleAutomation(enable: boolean) {
    try {
      // Use admin client to bypass RLS
      const { error } = await supabaseAdmin
        .from("bot_configuration")
        .upsert({
          id: 1,
          automation_enabled: enable,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("toggleAutomation error:", error);
      throw error;
    }
  },

  async runManualCycle() {
    try {
      const response = await fetch("/api/bot-payment", { method: "POST" });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("runManualCycle error:", error);
      throw error;
    }
  },

  async testBotPayment(contractId: string) {
    try {
      const response = await fetch("/api/bot-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Payment failed");
      return data;
    } catch (error) {
      console.error("testBotPayment error:", error);
      throw error;
    }
  },

  async generateBots(count: number) {
    try {
      const response = await fetch("/api/generate-bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("generateBots error:", error);
      throw error;
    }
  },

  async removeBots(count: number) {
    try {
      // Use admin client to bypass RLS
      const { data: oldestBots } = await supabaseAdmin
        .from("bot_accounts")
        .select("profile_id")
        .order("created_at", { ascending: true })
        .limit(count);

      if (!oldestBots || oldestBots.length === 0) {
        return { success: 0, failed: 0, errors: ["No bots found"] };
      }

      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const bot of oldestBots) {
        try {
          // Delete from auth (cascades to profiles and bot_accounts)
          const { error } = await supabaseAdmin.auth.admin.deleteUser(bot.profile_id);
          if (error) {
            results.failed++;
            results.errors.push(`Failed to delete ${bot.profile_id}: ${error.message}`);
          } else {
            results.success++;
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Exception deleting ${bot.profile_id}: ${error.message}`);
        }
      }

      return results;
    } catch (error: any) {
      console.error("removeBots error:", error);
      return { success: 0, failed: count, errors: [error.message] };
    }
  },

  async killSwitch() {
    try {
      // Use admin client to bypass RLS
      const { data: allBots } = await supabaseAdmin
        .from("bot_accounts")
        .select("profile_id");

      if (!allBots || allBots.length === 0) {
        return { success: true, deleted: 0 };
      }

      let deleted = 0;
      for (const bot of allBots) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(bot.profile_id);
          deleted++;
        } catch (error) {
          console.error(`Failed to delete bot ${bot.profile_id}:`, error);
        }
      }

      return { success: true, deleted };
    } catch (error: any) {
      console.error("killSwitch error:", error);
      return { success: false, error: error.message, deleted: 0 };
    }
  }
};