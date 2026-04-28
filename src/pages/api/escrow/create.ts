import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import * as stripeEscrow from "@/lib/stripe-escrow";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contractId } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: "Contract ID required" });
  }

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
      return res.status(404).json({ error: "Contract not found" });
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
      console.error("Failed to create payment tracking:", paymentError);
      return res.status(500).json({ error: "Failed to create payment record" });
    }

    // Update contract
    await supabase
      .from("contracts")
      .update({
        stripe_payment_intent_id: paymentIntentId,
        payment_status: "pending",
      })
      .eq("id", contractId);

    return res.status(200).json({
      success: true,
      clientSecret,
      paymentIntentId,
      payment,
      totalAmount,
      platformFee,
      paymentProcessingFee,
    });
  } catch (error) {
    console.error("Escrow creation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create escrow payment",
    });
  }
}