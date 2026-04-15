import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Dispute = Tables<"disputes">;

interface CreateDisputeParams {
  contractId: string;
  raisedBy: string;
  raiserRole: "client" | "provider";
  claimDescription: string;
}

interface ResolveDisputeParams {
  disputeId: string;
  resolutionType: "release_to_provider" | "refund_to_client" | "partial_split";
  resolutionReason: string;
  resolvedBy: string;
  clientRefundAmount?: number;
  providerPayoutAmount?: number;
}

export const disputeService = {
  async createDispute(params: CreateDisputeParams): Promise<Dispute> {
    const { data, error } = await supabase
      .from("disputes")
      .insert({
        contract_id: params.contractId,
        raised_by: params.raisedBy,
        raiser_role: params.raiserRole,
        claim_description: params.claimDescription,
      })
      .select()
      .single();

    if (error) throw error;

    // Update contract status to dispute
    await supabase
      .from("contracts")
      .update({ status: "dispute" })
      .eq("id", params.contractId);

    return data;
  },

  async getDisputeByContract(contractId: string): Promise<Dispute | null> {
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .eq("contract_id", contractId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async resolveDispute(params: ResolveDisputeParams): Promise<void> {
    const { data: dispute, error: fetchError } = await supabase
      .from("disputes")
      .select("*, contracts(*)")
      .eq("id", params.disputeId)
      .single();

    if (fetchError) throw fetchError;

    const updates: any = {
      resolution_type: params.resolutionType,
      resolution_reason: params.resolutionReason,
      resolved_by: params.resolvedBy,
      resolved_at: new Date().toISOString(),
    };

    if (params.resolutionType === "partial_split") {
      updates.client_refund_amount = params.clientRefundAmount;
      updates.provider_payout_amount = params.providerPayoutAmount;
    }

    const { error: updateError } = await supabase
      .from("disputes")
      .update(updates)
      .eq("id", params.disputeId);

    if (updateError) throw updateError;

    // Update contract status
    await supabase
      .from("contracts")
      .update({ status: "funds_released" })
      .eq("id", dispute.contract_id);
  },

  async getPendingDisputes(): Promise<any[]> {
    const { data, error } = await supabase
      .from("disputes")
      .select(`
        *,
        contracts(
          *,
          projects(title, category_id),
          bids(agreed_price),
          client:client_id(full_name, email),
          provider:provider_id(full_name, email)
        ),
        raised_by_profile:raised_by(full_name, email)
      `)
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};