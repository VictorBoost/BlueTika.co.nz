import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export const paymentService = {
  async getPaymentProcessingPercentage() {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "payment_processing_percentage")
      .maybeSingle();

    console.log("getPaymentProcessingPercentage:", { data, error });
    if (error) console.error("Failed to fetch payment processing percentage:", error);

    return parseFloat(data?.setting_value || "2.65");
  },

  calculateFees(agreedPrice: number, processingPercentage: number) {
    const platformFee = agreedPrice * 0.02;
    const processingFee = (agreedPrice * processingPercentage) / 100 + 0.30;
    const total = agreedPrice + platformFee + processingFee;

    return {
      platformFee: Number(platformFee.toFixed(2)),
      processingFee: Number(processingFee.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  },

  async createPaymentIntent(contractId: string, captureMethod: "automatic" | "manual" = "manual") {
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        project:projects(title),
        provider:profiles!contracts_provider_id_fkey(full_name),
        client:profiles!contracts_client_id_fkey(email)
      `)
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return { data: null, error: contractError };
    }

    const { data: settings } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "payment_processing_percentage")
      .maybeSingle();

    const processingPercentage = parseFloat(settings?.setting_value || "0");
    const platformFeeRate = 0.02;
    const platformFee = contract.final_amount * platformFeeRate;
    const paymentProcessingFee = contract.final_amount * (processingPercentage / 100);
    const totalAmount = contract.final_amount + platformFee + paymentProcessingFee;

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100),
          contractId,
          platformFee: Math.round(platformFee * 100),
          paymentProcessingFee: Math.round(paymentProcessingFee * 100),
          captureMethod,
        }),
      });

      const { clientSecret, error } = await response.json();
      if (error) throw new Error(error);

      return { data: { clientSecret, totalAmount, platformFee, paymentProcessingFee }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  // Stripe Connect functions for service providers
  async createConnectAccount(userId: string, email: string, returnUrl: string, refreshUrl: string) {
    try {
      const response = await fetch("/api/stripe/create-connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, returnUrl, refreshUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create Stripe account`);
      }

      const { accountId, accountLinkUrl, error } = await response.json();
      if (error) throw new Error(error);

      return { data: { accountId, accountLinkUrl }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async createAccountLink(stripeAccountId: string, returnUrl: string, refreshUrl: string) {
    try {
      const response = await fetch("/api/stripe/create-account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeAccountId, returnUrl, refreshUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create account link`);
      }

      const { url, error } = await response.json();
      if (error) throw new Error(error);

      return { data: { url }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async createLoginLink(stripeAccountId: string) {
    try {
      const response = await fetch("/api/stripe/create-login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeAccountId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create login link`);
      }

      const { url, error } = await response.json();
      if (error) throw new Error(error);

      return { data: { url }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async getConnectAccountStatus(stripeAccountId: string) {
    try {
      const response = await fetch(`/api/stripe/account-status?accountId=${stripeAccountId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to retrieve account status`);
      }

      const { account, error } = await response.json();
      
      if (error) throw new Error(error);
      if (!account) throw new Error("Invalid account data received from Stripe");

      return { 
        data: { 
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted,
          payoutsEnabled: account.payouts_enabled
        }, 
        error: null 
      };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async confirmPayment(contractId: string, paymentIntentId: string) {
    const approvalDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("contracts")
      .update({
        payment_status: "held",
        stripe_payment_intent_id: paymentIntentId,
        client_approval_deadline: approvalDeadline.toISOString(),
        auto_release_eligible_at: approvalDeadline.toISOString(),
      })
      .eq("id", contractId)
      .select()
      .single();

    console.log("confirmPayment (held):", { data, error, approvalDeadline });
    return { data, error };
  },

  async updateContractPayment(
    contractId: string,
    paymentIntentId: string,
    platformFee: number,
    processingFee: number,
    totalAmount: number
  ) {
    const approvalDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("contracts")
      .update({
        payment_status: "held",
        stripe_payment_intent_id: paymentIntentId,
        platform_fee: platformFee,
        payment_processing_fee: processingFee,
        total_amount: totalAmount,
        client_approval_deadline: approvalDeadline.toISOString(),
        auto_release_eligible_at: approvalDeadline.toISOString(),
      })
      .eq("id", contractId)
      .select()
      .single();

    console.log("updateContractPayment (held):", { data, error, approvalDeadline });
    if (error) console.error("Contract payment update error:", error);
    return { data, error };
  },

  /** Immediate Stripe transfer (admin tools, disputes). Prefer weekly batch via schedule flow for clients. */
  async capturePayment(contractId: string, method: "client_approval" | "auto_release" | "admin_release") {
    try {
      const response = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, releaseMethod: method }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Release failed");
      }

      return { data: json, error: null };
    } catch (err) {
      console.error("capturePayment / escrow release:", err);
      return { data: null, error: err };
    }
  },

  /** Client accepts completed work — queues Stripe payout for next NZ Friday batch (Wednesday cutoff). */
  async scheduleClientAcceptCompletedWork(contractId: string): Promise<{
    stripe_payout_scheduled_for: string;
    client_work_accepted_at: string;
  }> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch("/api/escrow/schedule-client-payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ contractId }),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || "Could not schedule payout");
    }
    return json;
  },

  async getStripe() {
    return await stripePromise;
  },
};