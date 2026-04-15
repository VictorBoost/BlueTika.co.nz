import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

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

  async createPaymentIntent(contractId: string, amount: number) {
    const { data, error } = await supabase.functions.invoke("create-payment-intent", {
      body: { contractId, amount },
    });

    console.log("createPaymentIntent:", { data, error });
    if (error) console.error("Payment intent creation error:", error);
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