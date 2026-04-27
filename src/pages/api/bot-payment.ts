import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * Bot-specific payment handler for automated testing
 * Creates and immediately captures Stripe payments for bot contracts
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contractId } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: "Contract ID is required" });
  }

  console.log("🤖 Bot Payment API called for contract:", contractId);

  try {
    console.log("🔍 Looking up contract:", contractId);
    console.log("   Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("   Service key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Get contract details with simple query first
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    console.log("   Contract query result:", { found: !!contract, error: contractError });

    if (contractError) {
      console.error("❌ Contract lookup error:", contractError);
      return res.status(404).json({ 
        error: "Contract not found", 
        details: contractError.message,
        code: contractError.code 
      });
    }

    if (!contract) {
      console.error("❌ Contract not found in database");
      return res.status(404).json({ error: "Contract not found" });
    }

    console.log("✅ Contract found:", contract.id, "Amount:", contract.final_amount);

    // Verify this is a bot contract
    const { data: isBotClient } = await supabase
      .from("bot_accounts")
      .select("id")
      .eq("profile_id", contract.client_id)
      .maybeSingle();

    if (!isBotClient) {
      return res.status(403).json({ error: "Not a bot contract" });
    }

    // Calculate fees (same as real payments)
    const baseAmount = Math.round(parseFloat(contract.final_amount.toString()) * 100);
    const commissionRate = 0.08; // 8% platform commission
    const commissionAmount = Math.round(baseAmount * commissionRate);
    const paymentProcessingFee = Math.round(baseAmount * 0.029 + 30); // 2.9% + $0.30
    const totalAmount = baseAmount + paymentProcessingFee;

    // Create payment intent with automatic capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "nzd",
      capture_method: "automatic", // Auto-capture for bots
      payment_method_types: ["card"],
      metadata: {
        contractId: contract.id,
        platformFee: commissionAmount.toString(),
        paymentProcessingFee: paymentProcessingFee.toString(),
        isBot: "true",
      },
      description: `BlueTika Bot Contract #${contract.id}`,
      statement_descriptor: "BlueTika",
    });

    // Use Stripe test card
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424242", // Stripe test card
        exp_month: 12,
        exp_year: 2030,
        cvc: "123",
      },
    });

    // Attach payment method to payment intent
    await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethod.id,
    });

    // Update contract with payment details
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: "held",
        platform_fee: commissionAmount / 100,
        payment_processing_fee: paymentProcessingFee / 100,
        total_amount: totalAmount / 100,
        client_approval_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        auto_release_eligible_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      } as any)
      .eq("id", contractId);

    if (updateError) {
      console.error("Contract update error:", updateError);
      return res.status(500).json({ error: "Failed to update contract" });
    }

    console.log(`✅ Bot payment created: Contract ${contractId}, Amount: $${(totalAmount / 100).toFixed(2)}`);

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      contractId: contract.id,
    });
  } catch (error) {
    console.error("Bot payment error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Payment failed",
    });
  }
}