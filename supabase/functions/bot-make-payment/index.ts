import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: "Contract ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("🤖 Bot Payment: Processing contract:", contractId);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("❌ STRIPE_SECRET_KEY not found in environment");
      return new Response(
        JSON.stringify({ error: "Stripe API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-11-20.acacia",
    });

    // Get contract details
    const { data: contract, error: contractError } = await supabaseClient
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      console.error("❌ Contract lookup error:", contractError);
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("✅ Contract found:", contract.id, "Amount:", contract.final_amount);

    // Verify this is a bot contract
    const { data: isBotClient } = await supabaseClient
      .from("bot_accounts")
      .select("id")
      .eq("profile_id", contract.client_id)
      .maybeSingle();

    if (!isBotClient) {
      console.log("⚠️ Skipping non-bot contract:", contractId);
      return new Response(
        JSON.stringify({ error: "Not a bot contract", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Calculate fees
    const baseAmount = Math.round(parseFloat(contract.final_amount.toString()) * 100);
    const commissionRate = 0.08; // 8%
    const commissionAmount = Math.round(baseAmount * commissionRate);
    const paymentProcessingFee = Math.round(baseAmount * 0.029 + 30); // 2.9% + $0.30
    const totalAmount = baseAmount + paymentProcessingFee;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "nzd",
      capture_method: "automatic",
      payment_method_types: ["card"],
      metadata: {
        contractId: contract.id,
        platformFee: commissionAmount.toString(),
        paymentProcessingFee: paymentProcessingFee.toString(),
        isBot: "true",
      },
      description: `BlueTika Bot Contract #${contract.id}`,
      statement_descriptor_suffix: "BlueTika", // Changed from statement_descriptor
    });

    // Use Stripe test card for bot payments
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: 2030,
        cvc: "123",
      },
    });

    // Confirm payment
    await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethod.id,
    });

    // Update contract
    const { error: updateError } = await supabaseClient
      .from("contracts")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: "held",
        platform_fee: commissionAmount / 100,
        payment_processing_fee: paymentProcessingFee / 100,
        total_amount: totalAmount / 100,
        client_approval_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        auto_release_eligible_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      console.error("❌ Contract update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update contract" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`✅ Bot payment completed: $${(totalAmount / 100).toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        contractId: contract.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("💥 Bot payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});