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

    // Default to 2.65 if not set
    return parseFloat(data?.setting_value || "2.65");
  },

  calculateFees(agreedPrice: number, processingPercentage: number) {
    const platformFee = agreedPrice * 0.02; // 2%
    const processingFee = (agreedPrice * processingPercentage) / 100 + 0.30;
    const total = agreedPrice + platformFee + processingFee;

    return {
      platformFee: Number(platformFee.toFixed(2)),
      processingFee: Number(processingFee.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  },

  async createPaymentIntent(contractId: string) {
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
      .select("payment_processing_percentage")
      .single();

    const processingPercentage = settings?.payment_processing_percentage || 0;
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
      const { account, error } = await response.json();
      
      if (error) throw new Error(error);

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
    const { data, error } = await supabase
      .from("contracts")
      .update({
        payment_status: "confirmed",
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", contractId)
      .select()
      .single();

    return { data, error };
  },

  async updateContractPayment(
    contractId: string,
    paymentIntentId: string,
    platformFee: number,
    processingFee: number,
    totalAmount: number
  ) {
    const { data, error } = await supabase
      .from("contracts")
      .update({
        payment_status: "confirmed",
        stripe_payment_intent_id: paymentIntentId,
        platform_fee: platformFee,
        payment_processing_fee: processingFee,
        total_amount: totalAmount,
      })
      .eq("id", contractId)
      .select()
      .single();

    console.log("updateContractPayment:", { data, error });
    if (error) console.error("Contract payment update error:", error);
    return { data, error };
  },

  async getStripe() {
    return await stripePromise;
  },
};