import { supabase } from "@/integrations/supabase/client";
import * as stripeEscrow from "@/lib/stripe-escrow";

export const escrowService = {
  /**
   * Creates escrow payment record and Stripe PaymentIntent
   * Called when client accepts a bid
   */
  async createEscrowPayment(contractId: string) {
    try {
      // Get contract details
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select(`
          *,
          project:projects(title),
          provider:profiles!contracts_provider_id_fkey(id, stripe_account_id),
          client:profiles!contracts_client_id_fkey(id, email)
        `)
        .eq("id", contractId)
        .single();

      if (contractError || !contract) {
        return { data: null, error: contractError || new Error("Contract not found") };
      }

      // Get platform settings
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", "payment_processing_percentage")
        .maybeSingle();

      const processingPercentage = parseFloat(settings?.setting_value || "2.65");
      const platformFeeRate = 0.02; // 2% BlueTika fee
      const platformFee = contract.final_amount * platformFeeRate;
      const paymentProcessingFee = (contract.final_amount * processingPercentage) / 100 + 0.30;
      const totalAmount = contract.final_amount + platformFee + paymentProcessingFee;

      // Create Stripe PaymentIntent
      const { clientSecret, paymentIntentId } = await stripeEscrow.createPaymentIntent({
        amount_nzd: contract.final_amount,
        client_id: contract.client_id,
        provider_id: contract.provider_id,
        contract_id: contractId,
        platform_fee: platformFee,
        payment_processing_fee: paymentProcessingFee,
      });

      // Create payment_tracking record
      const { data: payment, error: paymentError } = await supabase
        .from("payment_tracking")
        .insert({
          contract_id: contractId,
          client_id: contract.client_id,
          provider_id: contract.provider_id,
          amount_nzd: contract.final_amount,
          platform_fee: platformFee,
          payment_processing_fee: paymentProcessingFee,
          total_amount: totalAmount,
          status: "pending_payment",
          stripe_payment_intent_id: paymentIntentId,
          metadata: {
            project_title: (contract.project as any)?.title || "Unknown Project",
          },
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Failed to create payment tracking record:", paymentError);
        return { data: null, error: paymentError };
      }

      // Update contract with payment intent ID
      await supabase
        .from("contracts")
        .update({
          stripe_payment_intent_id: paymentIntentId,
          payment_status: "pending",
        })
        .eq("id", contractId);

      return {
        data: {
          clientSecret,
          paymentIntentId,
          payment,
          totalAmount,
          platformFee,
          paymentProcessingFee,
        },
        error: null,
      };
    } catch (err) {
      console.error("createEscrowPayment error:", err);
      return { data: null, error: err };
    }
  },

  /**
   * Captures payment after client successfully pays via Stripe Elements
   * Holds funds in escrow with 48-hour approval window
   */
  async captureEscrowPayment(paymentIntentId: string) {
    try {
      // Capture payment in Stripe
      const captureResult = await stripeEscrow.capturePayment(paymentIntentId);

      if (!captureResult.success) {
        return { data: null, error: new Error(captureResult.error) };
      }

      const approvalDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // Update payment_tracking
      const { data: payment, error: updateError } = await supabase
        .from("payment_tracking")
        .update({
          status: "captured",
          stripe_charge_id: captureResult.chargeId,
          captured_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", paymentIntentId)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to update payment tracking:", updateError);
        return { data: null, error: updateError };
      }

      // Update contract
      await supabase
        .from("contracts")
        .update({
          payment_status: "held",
          client_approval_deadline: approvalDeadline.toISOString(),
          auto_release_eligible_at: approvalDeadline.toISOString(),
        })
        .eq("id", payment.contract_id);

      return { data: payment, error: null };
    } catch (err) {
      console.error("captureEscrowPayment error:", err);
      return { data: null, error: err };
    }
  },

  /**
   * Releases escrowed funds to provider
   * Called on client approval, auto-release, or admin action
   */
  async releaseEscrowPayment(
    contractId: string,
    releaseMethod: "client_approval" | "auto_release" | "admin_release"
  ) {
    try {
      // Get payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payment_tracking")
        .select("*")
        .eq("contract_id", contractId)
        .eq("status", "captured")
        .single();

      if (paymentError || !payment) {
        return { data: null, error: paymentError || new Error("Payment not found or not captured") };
      }

      // Get provider Stripe account
      const { data: provider, error: providerError } = await supabase
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", payment.provider_id)
        .single();

      if (providerError || !provider?.stripe_account_id) {
        return {
          data: null,
          error: new Error("Provider does not have a connected Stripe account"),
        };
      }

      // Calculate amount to provider (original amount minus 2% platform fee)
      const amountToProvider = payment.amount_nzd * (1 - 0.02);

      // Release payment in Stripe
      if (!payment.stripe_payment_intent_id) {
        return { data: null, error: new Error("Payment intent ID not found") };
      }
      const releaseResult = await stripeEscrow.releasePayment(
        payment.stripe_payment_intent_id,
        provider.stripe_account_id,
        amountToProvider
      );

      if (!releaseResult.success) {
        return { data: null, error: new Error(releaseResult.error) };
      }

      // Update payment_tracking
      const { data: updatedPayment, error: updateError } = await supabase
        .from("payment_tracking")
        .update({
          status: "released",
          stripe_transfer_id: releaseResult.transferId,
          release_method: releaseMethod,
          released_at: new Date().toISOString(),
          approved_at: releaseMethod === "client_approval" ? new Date().toISOString() : null,
        })
        .eq("id", payment.id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to update payment tracking:", updateError);
        return { data: null, error: updateError };
      }

      // Update contract
      await supabase
        .from("contracts")
        .update({
          payment_status: "released",
          payment_captured_at: new Date().toISOString(),
          escrow_released_method: releaseMethod,
        })
        .eq("id", contractId);

      return { data: updatedPayment, error: null };
    } catch (err) {
      console.error("releaseEscrowPayment error:", err);
      return { data: null, error: err };
    }
  },

  /**
   * Refunds payment to client
   * Called for disputes or cancellations
   */
  async refundEscrowPayment(contractId: string, reason: string) {
    try {
      // Get payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payment_tracking")
        .select("*")
        .eq("contract_id", contractId)
        .eq("status", "captured")
        .single();

      if (paymentError || !payment) {
        return { data: null, error: paymentError || new Error("Payment not found or not captured") };
      }

      // Refund in Stripe
      if (!payment.stripe_payment_intent_id) {
        return { data: null, error: new Error("Payment intent ID not found") };
      }
      const refundResult = await stripeEscrow.refundPayment(
        payment.stripe_payment_intent_id,
        reason
      );

      if (!refundResult.success) {
        return { data: null, error: new Error(refundResult.error) };
      }

      // Update payment_tracking
      const { data: updatedPayment, error: updateError } = await supabase
        .from("payment_tracking")
        .update({
          status: "refunded",
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to update payment tracking:", updateError);
        return { data: null, error: updateError };
      }

      // Update contract
      await supabase
        .from("contracts")
        .update({
          payment_status: "refunded",
          status: "cancelled",
        })
        .eq("id", contractId);

      return { data: updatedPayment, error: null };
    } catch (err) {
      console.error("refundEscrowPayment error:", err);
      return { data: null, error: err };
    }
  },

  /**
   * Gets payment tracking record for a contract
   */
  async getPaymentByContract(contractId: string) {
    const { data, error } = await supabase
      .from("payment_tracking")
      .select("*")
      .eq("contract_id", contractId)
      .maybeSingle();

    return { data, error };
  },

  /**
   * Gets all payments for a user (client or provider)
   */
  async getUserPayments(userId: string, role: "client" | "provider") {
    const column = role === "client" ? "client_id" : "provider_id";

    const { data, error } = await supabase
      .from("payment_tracking")
      .select("*")
      .eq(column, userId)
      .order("created_at", { ascending: false });

    return { data: data || [], error };
  },
};