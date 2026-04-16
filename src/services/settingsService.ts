import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type PlatformSetting = Tables<"platform_settings">;

interface CommissionRates {
  tier1: number;
  tier2: number;
  tier3: number;
  promo_active: boolean;
}

interface TierThresholds {
  tier2: number;
  tier3: number;
}

interface GSTSettings {
  enabled: boolean;
  percentage: number;
}

interface SubscriptionPrices {
  logo_removal: number;
  email_hosting: number;
  custom_url: number;
  staff_member: number;
}

interface ModerationSwitches {
  profanity_filter: boolean;
  ai_verification: boolean;
  auto_suspend: boolean;
}

export const settingsService = {
  // Get setting by key
  async getSetting(key: string): Promise<any> {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", key)
      .single();

    if (error) throw error;
    return data?.setting_value;
  },

  // Update setting
  async updateSetting(key: string, value: any) {
    const { data: session } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("platform_settings")
      .update({
        setting_value: value,
        updated_by: session.session?.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", key)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all settings
  async getAllSettings() {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("setting_type");

    if (error) throw error;
    return data || [];
  },

  // Commission rates
  async getCommissionRates(): Promise<CommissionRates> {
    return await this.getSetting("commission_rates");
  },

  async updateCommissionRates(rates: CommissionRates) {
    return await this.updateSetting("commission_rates", rates);
  },

  // Tier thresholds
  async getTierThresholds(): Promise<TierThresholds> {
    return await this.getSetting("tier_thresholds");
  },

  async updateTierThresholds(thresholds: TierThresholds) {
    return await this.updateSetting("tier_thresholds", thresholds);
  },

  // Client platform fee
  async getClientPlatformFee(): Promise<number> {
    return parseFloat(await this.getSetting("client_platform_fee"));
  },

  async updateClientPlatformFee(fee: number) {
    return await this.updateSetting("client_platform_fee", fee.toString());
  },

  // Stripe contributions
  async getStripeDomestic(): Promise<number> {
    return parseFloat(await this.getSetting("stripe_domestic"));
  },

  async updateStripeDomestic(fee: number) {
    return await this.updateSetting("stripe_domestic", fee.toString());
  },

  async getStripeInternational(): Promise<number> {
    return parseFloat(await this.getSetting("stripe_international"));
  },

  async updateStripeInternational(fee: number) {
    return await this.updateSetting("stripe_international", fee.toString());
  },

  // GST
  async getGST(): Promise<GSTSettings> {
    return await this.getSetting("gst");
  },

  async updateGST(gst: GSTSettings) {
    return await this.updateSetting("gst", gst);
  },

  // Subscriptions
  async getSubscriptionPrices(): Promise<SubscriptionPrices> {
    return await this.getSetting("subscriptions");
  },

  async updateSubscriptionPrices(prices: SubscriptionPrices) {
    return await this.updateSetting("subscriptions", prices);
  },

  // Moderation switches
  async getModerationSwitches(): Promise<ModerationSwitches> {
    return await this.getSetting("moderation_switches");
  },

  async updateModerationSwitches(switches: ModerationSwitches) {
    return await this.updateSetting("moderation_switches", switches);
  },
};