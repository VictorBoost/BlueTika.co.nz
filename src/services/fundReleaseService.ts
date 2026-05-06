import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type FundRelease = Tables<"fund_releases">;

// Current commission tier rates (provider-based tiers)
// These are fallback rates - actual rates come from provider's tier
const COMMISSION_TIERS = [
  { min: 0, max: 499, rate: 0.15 },      // Bronze
  { min: 500, max: 1999, rate: 0.12 },   // Silver
  { min: 2000, max: 4999, rate: 0.10 },  // Gold
  { min: 5000, max: Infinity, rate: 0.08 }, // Platinum
];

interface CalculateCommissionResult {
  agreedPrice: number;
  commissionRate: number;
  commissionAmount: number;
  netToProvider: number;
}

interface ReleaseFundsParams {
  contractId: string;
  releasedBy: string;
  releaseType: "normal" | "dispute_resolution";
  notes?: string;
  customAmounts?: {
    clientRefund?: number;
    providerPayout?: number;
  };
}

export const fundReleaseService = {
  calculateCommission(agreedPrice: number): CalculateCommissionResult {
    const tier = COMMISSION_TIERS.find(
      (t) => agreedPrice >= t.min && agreedPrice <= t.max
    ) || COMMISSION_TIERS[COMMISSION_TIERS.length - 1];

    const commissionAmount = agreedPrice * tier.rate;
    const netToProvider = agreedPrice - commissionAmount;

    return {
      agreedPrice,
      commissionRate: tier.rate,
      commissionAmount,
      netToProvider,
    };
  },

  async getReadyForReleaseContracts(): Promise<any[]> {
    // Filter: Current_Time > (ready_for_release_at + 24 hours)
    // Which means: ready_for_release_at < (Current_Time - 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        *,
        projects(title, category_id),
        bids(agreed_price),
        client:client_id(full_name, email),
        provider:provider_id(full_name, email),
        client_review:reviews!reviews_contract_id_fkey!inner(
          id, reviewer_type
        ),
        provider_review:reviews!reviews_contract_id_fkey!inner(
          id, reviewer_type
        )
      `)
      .eq("status", "awaiting_fund_release")
      .not("ready_for_release_at", "is", null)
      .lte("ready_for_release_at", twentyFourHoursAgo)
      .order("ready_for_release_at", { ascending: true });

    if (error) throw error;

    // Filter contracts that have both reviews and passed both dispute windows
    return (data || []).filter((contract: any) => {
      const hasClientReview = contract.client_review?.some(
        (r: any) => r.reviewer_type === "client"
      );
      const hasProviderReview = contract.provider_review?.some(
        (r: any) => r.reviewer_type === "provider"
      );
      return hasClientReview && hasProviderReview;
    });
  },

  async releaseFunds(params: ReleaseFundsParams): Promise<void> {
    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select(`
        *,
        bids(agreed_price)
      `)
      .eq("id", params.contractId)
      .single();

    if (fetchError) throw fetchError;

    const bidsAny = contract.bids as any;
    const agreedPrice = bidsAny?.agreed_price || bidsAny?.[0]?.agreed_price || 0;
    
    let commissionCalc;
    let providerPayout;

    if (params.releaseType === "dispute_resolution" && params.customAmounts) {
      // For dispute resolution with custom amounts
      commissionCalc = this.calculateCommission(agreedPrice);
      providerPayout = params.customAmounts.providerPayout || 0;
    } else {
      // Normal release
      commissionCalc = this.calculateCommission(agreedPrice);
      providerPayout = commissionCalc.netToProvider;
    }

    // Record fund release
    const { error: releaseError } = await supabase.from("fund_releases").insert({
      contract_id: params.contractId,
      agreed_price: commissionCalc.agreedPrice,
      commission_rate: commissionCalc.commissionRate,
      commission_amount: commissionCalc.commissionAmount,
      net_to_provider: providerPayout,
      released_by: params.releasedBy,
      release_type: params.releaseType,
      notes: params.notes,
    });

    if (releaseError) throw releaseError;

    // Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "funds_released",
        funds_released_at: new Date().toISOString(),
        released_by: params.releasedBy,
      })
      .eq("id", params.contractId);

    if (updateError) throw updateError;
  },

  async getFundReleaseByContract(contractId: string): Promise<FundRelease | null> {
    const { data, error } = await supabase
      .from("fund_releases")
      .select("*")
      .eq("contract_id", contractId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAllFundReleases(): Promise<{ data: any[], error: any }> {
    const { data, error } = await supabase
      .from("fund_releases")
      .select(`
        *,
        contract:contracts(
          id, 
          bids(agreed_price),
          project:projects(title),
          client:profiles!contracts_client_id_fkey(full_name, email),
          provider:profiles!contracts_provider_id_fkey(full_name, email)
        )
      `)
      .order("created_at", { ascending: false });
      
    return { data: data || [], error };
  }
};