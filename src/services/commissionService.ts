import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CommissionTier = Database["public"]["Tables"]["commission_tiers"]["Row"];
export type CommissionSettings = Database["public"]["Tables"]["commission_settings"]["Row"];

export interface TierInfo {
  tierName: string;
  displayName: string;
  standardRate: number;
  currentRate: number;
  minSales: number;
  maxSales: number | null;
  isPromo: boolean;
}

export interface ProviderTierStatus {
  currentTier: TierInfo;
  sales60Day: number;
  nextTier: TierInfo | null;
  amountToNextTier: number;
  progressPercent: number;
  message: string;
  warningDaysLeft: number | null;
}

/**
 * Get all commission tiers
 */
export async function getCommissionTiers(): Promise<CommissionTier[]> {
  const { data, error } = await supabase
    .from("commission_tiers")
    .select("*")
    .order("tier_order", { ascending: true });

  if (error) {
    console.error("Error fetching commission tiers:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get commission settings
 */
export async function getCommissionSettings(): Promise<CommissionSettings | null> {
  const { data, error } = await supabase
    .from("commission_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching commission settings:", error);
    return null;
  }

  return data;
}

/**
 * Calculate 60-day sales for a provider
 */
export async function calculate60DaySales(providerId: string): Promise<number> {
  const { data, error } = await supabase.rpc("calculate_provider_60day_sales", {
    provider_uuid: providerId,
  });

  if (error) {
    console.error("Error calculating 60-day sales:", error);
    return 0;
  }

  return Number(data) || 0;
}

/**
 * Get tier info with current rate (promo or standard)
 */
async function getTierInfo(
  tier: CommissionTier,
  settings: CommissionSettings | null
): Promise<TierInfo> {
  const isPromo = settings?.promo_active || false;
  const currentRate = isPromo ? (settings?.promo_rate || 8) : tier.standard_rate;

  return {
    tierName: tier.tier_name,
    displayName: tier.display_name,
    standardRate: tier.standard_rate,
    currentRate,
    minSales: tier.min_sales,
    maxSales: tier.max_sales,
    isPromo,
  };
}

/**
 * Get provider tier status with progress
 */
export async function getProviderTierStatus(
  providerId: string
): Promise<ProviderTierStatus | null> {
  const [tiers, settings, sales] = await Promise.all([
    getCommissionTiers(),
    getCommissionSettings(),
    calculate60DaySales(providerId),
  ]);

  if (tiers.length === 0) return null;

  // Find current tier based on sales
  const currentTierData = [...tiers]
    .reverse()
    .find((t) => sales >= t.min_sales && (t.max_sales === null || sales <= t.max_sales)) || tiers[0];

  // Find next tier
  const currentIndex = tiers.findIndex((t) => t.tier_name === currentTierData.tier_name);
  const nextTierData = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

  const currentTier = await getTierInfo(currentTierData, settings);
  const nextTier = nextTierData ? await getTierInfo(nextTierData, settings) : null;

  // Calculate progress
  const amountToNextTier = nextTier ? Math.max(0, nextTier.minSales - sales) : 0;
  const progressStart = currentTier.minSales;
  const progressEnd = nextTier?.minSales || currentTier.minSales;
  const progressPercent = progressEnd > progressStart 
    ? Math.min(100, ((sales - progressStart) / (progressEnd - progressStart)) * 100)
    : 100;

  // Check for tier drop warning
  let warningDaysLeft: number | null = null;
  if (currentTierData.tier_name !== "no_tier") {
    const { data: warning } = await supabase
      .from("tier_drop_warnings")
      .select("*")
      .eq("provider_id", providerId)
      .eq("current_tier", currentTierData.tier_name)
      .is("tier_dropped_at", null)
      .order("warning_sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (warning) {
      const warningSentDate = new Date(warning.warning_sent_at);
      const daysElapsed = Math.floor(
        (Date.now() - warningSentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const warningDays = settings?.warning_days || 7;
      warningDaysLeft = Math.max(0, warningDays - daysElapsed);
    }
  }

  // Generate message
  const message = generateTierMessage(sales, currentTier, nextTier, amountToNextTier, warningDaysLeft);

  return {
    currentTier,
    sales60Day: sales,
    nextTier,
    amountToNextTier,
    progressPercent,
    message,
    warningDaysLeft,
  };
}

/**
 * Generate encouraging tier message
 */
function generateTierMessage(
  sales: number,
  currentTier: TierInfo,
  nextTier: TierInfo | null,
  amountToNext: number,
  warningDaysLeft: number | null
): string {
  // 7 days before drop
  if (warningDaysLeft !== null && warningDaysLeft <= 7) {
    return `Heads up — a new project keeps your ${currentTier.displayName} status going!`;
  }

  // No sales yet
  if (sales === 0) {
    return "Every top service provider started here. Post your first bid today!";
  }

  // Just reached a tier (within 10% of minimum)
  if (sales <= currentTier.minSales * 1.1 && currentTier.tierName !== "no_tier") {
    return `Ka pai! You've reached ${currentTier.displayName}. Your new rate is now active.`;
  }

  // Near next tier (within $200)
  if (nextTier && amountToNext > 0 && amountToNext <= 200) {
    return `You're $${amountToNext.toFixed(0)} away from ${nextTier.displayName}. Almost there!`;
  }

  // Near next tier (within 20%)
  if (nextTier && amountToNext > 0 && sales >= nextTier.minSales * 0.8) {
    return `You're $${amountToNext.toFixed(0)} away from ${nextTier.displayName}. Almost there!`;
  }

  // Building sales
  return "You're building momentum. Keep going!";
}

/**
 * Update tier for a provider (called after contract completion)
 */
export async function updateProviderTier(providerId: string) {
  const { data, error } = await supabase.rpc("update_provider_tier", {
    provider_uuid: providerId,
  });

  if (error) {
    console.error("Error updating provider tier:", error);
    throw error;
  }

  return data;
}

/**
 * Admin: Update tier configuration
 */
export async function updateCommissionTier(
  tierId: string,
  updates: Partial<Pick<CommissionTier, "display_name" | "min_sales" | "max_sales" | "standard_rate">>
) {
  const { data, error } = await supabase
    .from("commission_tiers")
    .update(updates)
    .eq("id", tierId)
    .select()
    .single();

  if (error) {
    console.error("Error updating tier config:", error);
    throw error;
  }

  return data;
}

/**
 * Admin: Update commission settings
 */
export async function updateCommissionSettings(
  updates: Partial<Pick<CommissionSettings, "promo_active" | "promo_rate" | "warning_days">>
) {
  const { data, error } = await supabase
    .from("commission_settings")
    .update(updates)
    .select()
    .single();

  if (error) {
    console.error("Error updating commission settings:", error);
    throw error;
  }

  return data;
}