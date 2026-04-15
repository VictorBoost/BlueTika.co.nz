import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Contract = Tables<"contracts">;

export const contractService = {
  async getUserContracts(userId: string, role: "client" | "provider") {
    const field = role === "client" ? "client_id" : "provider_id";
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        *,
        project:projects!contracts_project_id_fkey(id, title, description, category, location, booking_type),
        provider:profiles!contracts_provider_id_fkey(id, full_name, email, phone),
        client:profiles!contracts_client_id_fkey(id, full_name, email, phone)
      `)
      .eq(field, userId)
      .order("created_at", { ascending: false });

    console.log("getUserContracts:", { data, error });
    if (error) console.error("Contracts fetch error:", error);
    return { data, error };
  },

  async updateContractStatus(
    contractId: string,
    status: "active" | "completed" | "cancelled" | "Awaiting Fund Release" | string
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

    // If completed, update project status
    if (status === "completed" && data) {
      await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", data.project_id);
    }

    return { data, error };
  },
};