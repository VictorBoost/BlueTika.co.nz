import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { sendAdditionalChargeRequestEmail, sendAdditionalChargeResponseEmail, sendAdditionalChargePaymentEmail } from "./sesEmailService";
import { notificationService } from "./notificationService";

export type AdditionalCharge = Tables<"additional_charges">;

export const additionalChargeService = {
  async createChargeRequest(
    contractId: string,
    providerId: string,
    clientId: string,
    amount: number,
    reason: string
  ) {
    const { data, error } = await supabase
      .from("additional_charges")
      .insert({
        contract_id: contractId,
        provider_id: providerId,
        client_id: clientId,
        amount,
        reason,
      })
      .select(`
        *,
        contract:contracts!additional_charges_contract_id_fkey(
          project:projects!contracts_project_id_fkey(title)
        ),
        provider:profiles!additional_charges_provider_id_fkey(full_name, email),
        client:profiles!additional_charges_client_id_fkey(full_name, email)
      `)
      .single();

    console.log("createChargeRequest:", { data, error });
    if (error) {
      console.error("Charge request creation error:", error);
      return { data: null, error };
    }

    // Send notifications
    if (data) {
      const projectTitle = data.contract?.project?.title || "Project";
      const providerName = data.provider?.full_name || data.provider?.email || "Service Provider";
      const clientEmail = data.client?.email;
      const clientName = data.client?.full_name || data.client?.email || "Client";

      // Email notification
      if (clientEmail) {
        await sendAdditionalChargeRequestEmail(
          clientEmail,
          clientName,
          providerName,
          projectTitle,
          amount,
          reason,
          data.id
        );
      }

      // In-platform notification
      await notificationService.createNotification(
        clientId,
        "Additional Charge Request",
        `${providerName} has requested an additional charge of NZD $${amount.toLocaleString()} for ${projectTitle}`,
        "payment",
        contractId
      );
    }

    return { data, error };
  },

  async getContractCharges(contractId: string) {
    const { data, error } = await supabase
      .from("additional_charges")
      .select(`
        *,
        provider:profiles!additional_charges_provider_id_fkey(full_name, email),
        client:profiles!additional_charges_client_id_fkey(full_name, email)
      `)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });

    console.log("getContractCharges:", { data, error });
    if (error) console.error("Charges fetch error:", error);
    return { data, error };
  },

  async approveCharge(chargeId: string) {
    const { data, error } = await supabase
      .from("additional_charges")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", chargeId)
      .select(`
        *,
        contract:contracts!additional_charges_contract_id_fkey(
          project:projects!contracts_project_id_fkey(title)
        ),
        provider:profiles!additional_charges_provider_id_fkey(full_name, email),
        client:profiles!additional_charges_client_id_fkey(full_name, email)
      `)
      .single();

    console.log("approveCharge:", { data, error });
    if (error) {
      console.error("Charge approval error:", error);
      return { data: null, error };
    }

    // Send notifications
    if (data) {
      const projectTitle = data.contract?.project?.title || "Project";
      const providerEmail = data.provider?.email;
      const providerName = data.provider?.full_name || data.provider?.email || "Service Provider";
      const clientName = data.client?.full_name || data.client?.email || "Client";

      // Email notification
      if (providerEmail) {
        await sendAdditionalChargeResponseEmail(
          providerEmail,
          providerName,
          clientName,
          projectTitle,
          data.amount,
          "approved"
        );
      }

      // In-platform notification
      await notificationService.createNotification(
        data.provider_id,
        "Additional Charge Approved",
        `${clientName} approved your additional charge request of NZD $${data.amount.toLocaleString()} for ${projectTitle}`,
        "success",
        data.contract_id
      );
    }

    return { data, error };
  },

  async declineCharge(chargeId: string) {
    const { data, error } = await supabase
      .from("additional_charges")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
      })
      .eq("id", chargeId)
      .select(`
        *,
        contract:contracts!additional_charges_contract_id_fkey(
          project:projects!contracts_project_id_fkey(title)
        ),
        provider:profiles!additional_charges_provider_id_fkey(full_name, email),
        client:profiles!additional_charges_client_id_fkey(full_name, email)
      `)
      .single();

    console.log("declineCharge:", { data, error });
    if (error) {
      console.error("Charge decline error:", error);
      return { data: null, error };
    }

    // Send notifications
    if (data) {
      const projectTitle = data.contract?.project?.title || "Project";
      const providerEmail = data.provider?.email;
      const providerName = data.provider?.full_name || data.provider?.email || "Service Provider";
      const clientName = data.client?.full_name || data.client?.email || "Client";

      // Email notification
      if (providerEmail) {
        await sendAdditionalChargeResponseEmail(
          providerEmail,
          providerName,
          clientName,
          projectTitle,
          data.amount,
          "declined"
        );
      }

      // In-platform notification
      await notificationService.createNotification(
        data.provider_id,
        "Additional Charge Declined",
        `${clientName} declined your additional charge request of NZD $${data.amount.toLocaleString()} for ${projectTitle}`,
        "warning",
        data.contract_id
      );
    }

    return { data, error };
  },

  async updateChargePayment(
    chargeId: string,
    paymentIntentId: string,
    platformFee: number,
    processingFee: number,
    totalAmount: number,
    commissionRate: number,
    commissionAmount: number,
    netToProvider: number
  ) {
    const { data, error } = await supabase
      .from("additional_charges")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntentId,
        platform_fee: platformFee,
        payment_processing_fee: processingFee,
        total_amount: totalAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        net_to_provider: netToProvider,
      })
      .eq("id", chargeId)
      .select(`
        *,
        contract:contracts!additional_charges_contract_id_fkey(
          project:projects!contracts_project_id_fkey(title)
        ),
        provider:profiles!additional_charges_provider_id_fkey(full_name, email, current_tier),
        client:profiles!additional_charges_client_id_fkey(full_name, email)
      `)
      .single();

    console.log("updateChargePayment:", { data, error });
    if (error) {
      console.error("Charge payment update error:", error);
      return { data: null, error };
    }

    // Send notifications
    if (data) {
      const projectTitle = data.contract?.project?.title || "Project";
      const providerEmail = data.provider?.email;
      const providerName = data.provider?.full_name || data.provider?.email || "Service Provider";
      const clientEmail = data.client?.email;
      const clientName = data.client?.full_name || data.client?.email || "Client";

      // Email notifications to both parties
      if (providerEmail) {
        await sendAdditionalChargePaymentEmail(
          providerEmail,
          providerName,
          "provider",
          projectTitle,
          data.amount,
          commissionAmount,
          netToProvider
        );
      }
      if (clientEmail) {
        await sendAdditionalChargePaymentEmail(
          clientEmail,
          clientName,
          "client",
          projectTitle,
          data.amount,
          commissionAmount,
          netToProvider
        );
      }

      // In-platform notifications
      await notificationService.createNotification(
        data.provider_id,
        "Additional Charge Payment Received",
        `Payment of NZD $${netToProvider.toLocaleString()} received for additional work on ${projectTitle}`,
        "success",
        data.contract_id
      );

      await notificationService.createNotification(
        data.client_id,
        "Additional Charge Payment Confirmed",
        `Payment of NZD $${data.amount.toLocaleString()} confirmed for additional work on ${projectTitle}`,
        "payment",
        data.contract_id
      );
    }

    return { data, error };
  },
};