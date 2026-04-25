import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get contract details
    const { data: contract, error: contractError } = await supabaseClient
      .from("contracts")
      .select("id, final_amount, client_id, provider_id, payment_status")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Verify this is a bot contract
    const { data: isBotClient } = await supabaseClient
      .from("bot_accounts")
      .select("id")
      .eq("profile_id", contract.client_id)
      .maybeSingle();

    if (!isBotClient) {
      return new Response(
        JSON.stringify({ error: "Not a bot contract" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Calculate fees
    const baseAmount = parseFloat(contract.final_amount.toString());
    const commissionRate = 0.08;
    const commissionAmount = baseAmount * commissionRate;
    const paymentProcessingFee = baseAmount * 0.029 + 0.30;
    const totalAmount = baseAmount + paymentProcessingFee;

    // Create Stripe payment using test card
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe key not configured");
    }

    // Create payment intent
    const piResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "amount": Math.round(totalAmount * 100).toString(),
        "currency": "nzd",
        "capture_method": "manual",
        "description": `BlueTika Bot Contract #${contract.id}`,
        "statement_descriptor": "BlueTika",
        "metadata[contractId]": contract.id,
        "metadata[platformFee]": commissionAmount.toString(),
        "metadata[paymentProcessingFee]": paymentProcessingFee.toString(),
        "metadata[isBot]": "true",
      }).toString(),
    });

    if (!piResponse.ok) {
      const error = await piResponse.text();
      throw new Error(`Stripe PI creation failed: ${error}`);
    }

    const paymentIntent = await piResponse.json();

    // Create payment method with test card
    const pmResponse = await fetch("https://api.stripe.com/v1/payment_methods", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "type": "card",
        "card[number]": "4242424242424242",
        "card[exp_month]": "12",
        "card[exp_year]": "2030",
        "card[cvc]": "123",
      }).toString(),
    });

    if (!pmResponse.ok) {
      const error = await pmResponse.text();
      throw new Error(`Stripe PM creation failed: ${error}`);
    }

    const paymentMethod = await pmResponse.json();

    // Confirm payment intent
    const confirmResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntent.id}/confirm`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method": paymentMethod.id,
      }).toString(),
    });

    if (!confirmResponse.ok) {
      const error = await confirmResponse.text();
      throw new Error(`Stripe confirm failed: ${error}`);
    }

    const confirmedPI = await confirmResponse.json();

    // Update contract with payment details
    const { error: updateError } = await supabaseClient
      .from("contracts")
      .update({
        stripe_payment_intent_id: confirmedPI.id,
        payment_status: "held",
        platform_fee: commissionAmount,
        payment_processing_fee: paymentProcessingFee,
        total_amount: totalAmount,
        client_approval_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        auto_release_eligible_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", contractId);

    if (updateError) {
      throw new Error(`Contract update failed: ${updateError.message}`);
    }

    console.log(`✅ Bot payment created: Contract ${contractId}, Amount: $${totalAmount.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: confirmedPI.id,
        amount: totalAmount,
        contractId: contract.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Bot payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});