import { supabase } from "@/integrations/supabase/client";

/** Mirrors `/api/bot-automation-status` JSON (`automation` field). */
export interface BotAutomationPayload {
  isActive: boolean;
  actions: string[];
}

/** Mirrors `/api/bot-automation-status` JSON (`stats` field). */
export interface BotAutomationStatsPayload {
  totalBots: number;
  clientBots: number;
  providerBots: number;
  totalProjects: number;
  totalBids: number;
  totalContracts: number;
  paidContracts: number;
  totalReviews: number;
  errorSummary: Record<string, number>;
  recentErrors: unknown[];
}

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

      const hasAccess = profile?.email?.toLowerCase() === "bluetikanz@gmail.com";
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

  async getAutomationStatus(): Promise<BotAutomationPayload> {
    try {
      const res = await fetch("/api/bot-automation-status", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        console.error("getAutomationStatus HTTP error:", res.status, await res.text().catch(() => ""));
        return { isActive: false, actions: [] };
      }
      const body = (await res.json()) as { automation?: BotAutomationPayload };
      return (
        body.automation ?? {
          isActive: false,
          actions: [],
        }
      );
    } catch (error) {
      console.error("getAutomationStatus error:", error);
      return { isActive: false, actions: [] };
    }
  },

  async getBotStats(): Promise<BotAutomationStatsPayload> {
    const empty: BotAutomationStatsPayload = {
      totalBots: 0,
      clientBots: 0,
      providerBots: 0,
      totalProjects: 0,
      totalBids: 0,
      totalContracts: 0,
      paidContracts: 0,
      totalReviews: 0,
      errorSummary: {},
      recentErrors: [],
    };
    try {
      const res = await fetch("/api/bot-automation-status", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        console.error("getBotStats HTTP error:", res.status, await res.text().catch(() => ""));
        return empty;
      }
      const body = (await res.json()) as { stats?: BotAutomationStatsPayload };
      return body.stats ?? empty;
    } catch (error) {
      console.error("getBotStats error:", error);
      return empty;
    }
  },

  async toggleAutomation(enable: boolean) {
    try {
      const response = await fetch("/api/bot-automation-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Toggle failed");
      return data;
    } catch (error) {
      console.error("toggleAutomation error:", error);
      throw error;
    }
  },

  async runManualCycle() {
    try {
      const response = await fetch("/api/bot-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "full_cycle" })
      });
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
      const response = await fetch("/api/bot-remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Remove failed");
      return data;
    } catch (error: any) {
      console.error("removeBots error:", error);
      return { success: 0, failed: count, errors: [error.message] };
    }
  },

  async killSwitch() {
    try {
      const response = await fetch("/api/bot-remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ killAll: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Kill switch failed");
      return { success: true, deleted: data.success };
    } catch (error: any) {
      console.error("killSwitch error:", error);
      return { success: false, error: error.message, deleted: 0 };
    }
  }
};