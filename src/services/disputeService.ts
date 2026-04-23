import { supabase } from "@/integrations/supabase/client";
import { sesEmailService } from "@/services/sesEmailService";
import { emailLogService } from "@/services/emailLogService";

export const disputeService = {
  async raiseDispute(contractId: string, raisedBy: string, raiserRole: "client" | "provider", reason: string, description: string) {
    const { data: contract } = await supabase.from("contracts").select(`*, project:projects(title), client:profiles!contracts_client_id_fkey(email, full_name), provider:profiles!contracts_provider_id_fkey(email, full_name)`).eq("id", contractId).single();

    const { data, error } = await supabase.from("disputes").insert({
      contract_id: contractId,
      raised_by: raisedBy,
      raiser_role: raiserRole,
      claim_description: description,
    } as any).select().single();

    if (error || !data) return { data: null, error };

    await supabase.from("contracts").update({ status: "disputed" }).eq("id", contractId);

    if (contract?.project) {
      const adminEmailSent = await sesEmailService.sendAdminDisputeNotification(
        contractId, (contract.project as any).title,
        raiserRole === "client" ? (contract.client as any)?.full_name || "Client" : (contract.provider as any)?.full_name || "Provider",
        raiserRole
      );
      await emailLogService.logEmail("admin@bluetika.co.nz", "dispute_raised_admin", adminEmailSent ? "sent" : "failed", { dispute_id: data.id, contract_id: contractId });

      const otherParty = raiserRole === "client" ? contract.provider : contract.client;
      if (otherParty) {
        const otherPartyEmailSent = await sesEmailService.sendEmail({
          to: (otherParty as any).email,
          subject: "BlueTika: Dispute Raised",
          htmlBody: `<p>Dispute raised for ${(contract.project as any).title}.</p>`
        });
        await emailLogService.logEmail((otherParty as any).email, "dispute_raised_notification", otherPartyEmailSent ? "sent" : "failed", { dispute_id: data.id, contract_id: contractId });
      }

      const raiser = raiserRole === "client" ? contract.client : contract.provider;
      if (raiser) {
        const raiserEmailSent = await sesEmailService.sendEmail({
          to: (raiser as any).email,
          subject: "BlueTika: Dispute Submitted",
          htmlBody: `<p>Dispute submitted for ${(contract.project as any).title}.</p>`
        });
        await emailLogService.logEmail((raiser as any).email, "dispute_raised_confirmation", raiserEmailSent ? "sent" : "failed", { dispute_id: data.id, contract_id: contractId });
      }
    }
    return { data, error: null };
  },

  async getPendingDisputes() {
    const { data, error } = await supabase.from("disputes").select(`*, contract:contracts(project:projects(title))`).is("resolved_at", null).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async getDisputesByContract(contractId: string) {
    const { data, error } = await supabase.from("disputes").select("*").eq("contract_id", contractId).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async getAllDisputes() {
    const { data, error } = await supabase.from("disputes").select(`*, contract:contracts(project:projects(title), client:profiles!contracts_client_id_fkey(full_name, email), provider:profiles!contracts_provider_id_fkey(full_name, email))`).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async resolveDispute(disputeId: string, resolutionType: string, resolutionReason: string, refundAmount?: number, payoutAmount?: number) {
    const { data: dispute } = await supabase.from("disputes").select(`*, contract:contracts(*, project:projects(title), client:profiles!contracts_client_id_fkey(email, full_name), provider:profiles!contracts_provider_id_fkey(email, full_name))`).eq("id", disputeId).single();

    const { data, error } = await supabase.from("disputes").update({
      resolution_type: resolutionType,
      resolution_reason: resolutionReason,
      client_refund_amount: refundAmount,
      provider_payout_amount: payoutAmount,
      resolved_at: new Date().toISOString(),
    } as any).eq("id", disputeId).select().single();

    if (error) return { data: null, error };

    if (dispute?.contract_id) await supabase.from("contracts").update({ status: "completed" }).eq("id", dispute.contract_id);

    if ((dispute?.contract as any)?.client) {
      const clientEmailSent = await sesEmailService.sendDisputeResolutionNotification(
        (dispute.contract as any).client.email, (dispute.contract as any).client.full_name || "Client",
        "client", (dispute.contract as any).project?.title || "Project", resolutionType, resolutionReason, refundAmount
      );
      await emailLogService.logEmail((dispute.contract as any).client.email, "dispute_resolved_client", clientEmailSent ? "sent" : "failed", { dispute_id: disputeId });
    }

    if ((dispute?.contract as any)?.provider) {
      const providerEmailSent = await sesEmailService.sendDisputeResolutionNotification(
        (dispute.contract as any).provider.email, (dispute.contract as any).provider.full_name || "Provider",
        "provider", (dispute.contract as any).project?.title || "Project", resolutionType, resolutionReason, payoutAmount
      );
      await emailLogService.logEmail((dispute.contract as any).provider.email, "dispute_resolved_provider", providerEmailSent ? "sent" : "failed", { dispute_id: disputeId });
    }

    return { data, error: null };
  },
};