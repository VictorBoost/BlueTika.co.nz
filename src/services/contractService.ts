import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { updateProviderTier } from "./commissionService";

export type Contract = Tables<"contracts">;

export const contractService = {
  async getUserContracts(userId: string) {
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        *,
        project:projects!contracts_project_id_fkey(id, title, description, category_id, location, booking_type),
        provider:profiles!contracts_provider_id_fkey(id, full_name, email, phone),
        client:profiles!contracts_client_id_fkey(id, full_name, email, phone)
      `)
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    console.log("getUserContracts:", { data, error });
    if (error) console.error("Contracts fetch error:", error);
    return { data, error };
  },

  async markWorkComplete(contractId: string) {
    // Calculate 48-hour deadline in NZ timezone
    const now = new Date();
    const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("contracts")
      .update({
        status: "Work Completed",
        work_done_at: now.toISOString(),
        client_dispute_deadline: deadline.toISOString(),
      })
      .eq("id", contractId)
      .select()
      .single();

    console.log("markWorkComplete:", { data, error });
    if (error) console.error("Mark work complete error:", error);
    return { data, error };
  },

  async updateContractStatus(
    contractId: string,
    status: "active" | "completed" | "cancelled" | "awaiting_fund_release" | "dispute" | "funds_released" | string
  ) {
    const updates: Partial<Contract> = { status };
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", contractId)
      .select()
      .single();

    console.log("updateContractStatus:", { data, error });
    if (error) console.error("Contract status update error:", error);

    // If completed, update project status and provider tier
    if (status === "completed" && data) {
      await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", data.project_id);
      
      // Update provider's commission tier
      try {
        await updateProviderTier(data.provider_id);
      } catch (tierError) {
        console.error("Error updating provider tier:", tierError);
      }
    }

    return { data, error };
  },

  async markWorkDone(contractId: string) {
    const { data, error } = await supabase
      .from("contracts")
      .update({
        work_done_at: new Date().toISOString(),
        client_dispute_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .eq("id", contractId)
      .select()
      .single();

    console.log("markWorkDone:", { data, error });
    if (error) console.error("Work done update error:", error);
    return { data, error };
  },

  async setProviderDisputeDeadline(contractId: string) {
    // 5 working days (excluding weekends)
    const now = new Date();
    let daysAdded = 0;
    const deadline = new Date(now);

    while (daysAdded < 5) {
      deadline.setDate(deadline.getDate() + 1);
      const dayOfWeek = deadline.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }

    const { data, error } = await supabase
      .from("contracts")
      .update({
        provider_dispute_deadline: deadline.toISOString(),
      })
      .eq("id", contractId)
      .select()
      .single();

    console.log("setProviderDisputeDeadline:", { data, error });
    if (error) console.error("Provider deadline update error:", error);
    return { data, error };
  },

  async canRaiseDispute(contractId: string, role: "client" | "provider"): Promise<boolean> {
    const { data, error } = await supabase
      .from("contracts")
      .select("work_done_at, client_dispute_deadline, provider_dispute_deadline, status")
      .eq("id", contractId)
      .single();

    if (error || !data) return false;

    // Can't raise dispute if already in dispute or funds released
    if (data.status === "dispute" || data.status === "funds_released") {
      return false;
    }

    const now = new Date();

    if (role === "client") {
      if (!data.client_dispute_deadline) return false;
      return now <= new Date(data.client_dispute_deadline);
    } else {
      if (!data.provider_dispute_deadline) return false;
      return now <= new Date(data.provider_dispute_deadline);
    }
  },

  async checkReadyForRelease(contractId: string): Promise<void> {
    const { data, error } = await supabase
      .from("contracts")
      .select("client_dispute_deadline, provider_dispute_deadline")
      .eq("id", contractId)
      .single();

    if (error || !data) return;

    const now = new Date();
    const clientDeadlinePassed = data.client_dispute_deadline 
      ? now > new Date(data.client_dispute_deadline) 
      : false;
    const providerDeadlinePassed = data.provider_dispute_deadline 
      ? now > new Date(data.provider_dispute_deadline) 
      : false;

    if (clientDeadlinePassed && providerDeadlinePassed) {
      await supabase
        .from("contracts")
        .update({ ready_for_release_at: now.toISOString() })
        .eq("id", contractId);
    }
  },
};