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
      console.error("❌ No contract ID provided");
      return new Response(
        JSON.stringify({ error: "Contract ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`💳 Processing bot payment for contract: ${contractId}`);

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
      console.error("❌ Contract not found:", contractError);
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`   Contract amount: $${contract.final_amount}`);

    // Verify this is a bot contract
    const { data: isBotClient } = await supabaseClient
      .from("bot_accounts")
      .select("id")
      .eq("profile_id", contract.client_id)
      .maybeSingle();

    if (!isBotClient) {
      console.error("❌ Not a bot contract - client is not a bot");
      return new Response(
        JSON.stringify({ error: "Not a bot contract" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    console.log("   ✓ Verified as bot contract");

    // Calculate fees
    const baseAmount = parseFloat(contract.final_amount.toString());
    const commissionRate = 0.08;
    const commissionAmount = baseAmount * commissionRate;
    const paymentProcessingFee = baseAmount * 0.029 + 0.30;
    const totalAmount = baseAmount + paymentProcessingFee;

    console.log(`   Base: $${baseAmount.toFixed(2)}, Fee: $${commissionAmount.toFixed(2)}, Total: $${totalAmount.toFixed(2)}`);

    // Create Stripe payment using test card
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("❌ Stripe key not configured");
      throw new Error("Stripe key not configured");
    }

    console.log("   Creating Stripe payment intent...");

    // Create payment intent
    console.log(`   Using Stripe key: ${stripeKey.substring(0, 7)}...`);
    
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
      const errorText = await piResponse.text();
      console.error("❌ Stripe PI creation failed:", errorText);
      
      // Parse Stripe error
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Stripe error: ${errorJson.error?.message || errorText}`);
      } catch {
        throw new Error(`Stripe PI failed: ${errorText}`);
      }
    }

    const paymentIntent = await piResponse.json();
    console.log(`   ✓ Payment Intent created: ${paymentIntent.id} (status: ${paymentIntent.status})`);

    // Create payment method with test card
    console.log("   Creating test payment method...");
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
      console.error("❌ Stripe PM creation failed:", error);
      throw new Error(`Stripe PM creation failed: ${error}`);
    }

    const paymentMethod = await pmResponse.json();
    console.log(`   ✓ Payment Method created: ${paymentMethod.id}`);

    // Confirm payment intent
    console.log("   Confirming payment...");
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
      console.error("❌ Stripe confirm failed:", error);
      throw new Error(`Stripe confirm failed: ${error}`);
    }

    const confirmedPI = await confirmResponse.json();
    console.log(`   ✓ Payment confirmed: ${confirmedPI.status}`);

    // Update contract with payment details
    console.log("   Updating contract...");
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
      console.error("❌ Contract update failed:", updateError);
      throw new Error(`Contract update failed: ${updateError.message}`);
    }

    console.log(`✅ Bot payment complete: Contract ${contractId}, Amount: $${totalAmount.toFixed(2)}`);

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