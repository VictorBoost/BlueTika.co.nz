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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get bot provider accounts
    const { data: botProviders } = await supabaseClient
      .from("bot_accounts")
      .select("profile_id")
      .eq("bot_type", "service_provider")
      .eq("is_active", true);

    if (!botProviders || botProviders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No provider bots found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const providerIds = botProviders.map(b => b.profile_id);

    // Get in-progress contracts from bot providers (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: contracts } = await supabaseClient
      .from("contracts")
      .select("id, provider_id, client_id, final_amount")
      .eq("status", "in_progress")
      .in("provider_id", providerIds)
      .lt("created_at", oneHourAgo);

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No contracts ready for completion" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      completed: 0,
      errors: [] as string[]
    };

    const reviewMessages = [
      "Great work! Very professional and efficient. Would definitely use again.",
      "Job completed to a high standard. Really happy with the result.",
      "Excellent service. Turned up on time and got the job done properly.",
      "Very pleased with the work. Fair pricing and quality workmanship.",
      "Reliable and trustworthy. Did exactly what was needed.",
      "Top notch job! Communication was great throughout.",
      "Really happy with how this turned out. Highly recommend.",
      "Professional service from start to finish. Very satisfied.",
      "Quality work at a fair price. Would hire again without hesitation.",
      "Fantastic result! Exceeded my expectations."
    ];

    // Complete 1-3 random contracts
    const contractsToComplete = contracts
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1);

    for (const contract of contractsToComplete) {
      try {
        // Mark contract as awaiting payment
        const { error: contractUpdateError } = await supabaseClient
          .from("contracts")
          .update({ status: "awaiting_payment" })
          .eq("id", contract.id);

        if (contractUpdateError) {
          results.errors.push(`Contract update failed: ${contractUpdateError.message}`);
          continue;
        }

        // Add placeholder evidence photos (URLs to placeholder images)
        const placeholderPhotos = [
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800",
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
          "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800"
        ];

        const beforePhoto = placeholderPhotos[Math.floor(Math.random() * placeholderPhotos.length)];
        const afterPhoto = placeholderPhotos[Math.floor(Math.random() * placeholderPhotos.length)];

        await supabaseClient
          .from("evidence_photos")
          .insert([
            {
              contract_id: contract.id,
              photo_type: "before",
              photo_url: beforePhoto,
              uploaded_by: contract.provider_id
            },
            {
              contract_id: contract.id,
              photo_type: "after",
              photo_url: afterPhoto,
              uploaded_by: contract.provider_id
            }
          ]);

        // Bot completes payment (set to paid without Stripe)
        await supabaseClient
          .from("contracts")
          .update({ 
            status: "completed",
            payment_status: "paid"
          })
          .eq("id", contract.id);

        // Leave review from client
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
        const reviewMessage = reviewMessages[Math.floor(Math.random() * reviewMessages.length)];

        await supabaseClient
          .from("reviews")
          .insert({
            contract_id: contract.id,
            reviewer_id: contract.client_id,
            reviewee_id: contract.provider_id,
            rating,
            comment: reviewMessage,
            reviewer_type: "client"
          });

        // Provider reviews client back
        const clientReviewMessages = [
          "Great client, clear communication and prompt payment.",
          "Easy to work with. Would happily work for them again.",
          "Professional and reasonable. Smooth project from start to finish.",
          "Good communication throughout. Pleasant to deal with.",
          "Clear about what they wanted. Made my job easy!"
        ];

        await supabaseClient
          .from("reviews")
          .insert({
            contract_id: contract.id,
            reviewer_id: contract.provider_id,
            reviewee_id: contract.client_id,
            rating: 5,
            comment: clientReviewMessages[Math.floor(Math.random() * clientReviewMessages.length)],
            reviewer_type: "provider"
          });

        // Log activities
        await supabaseClient
          .from("bot_activity_logs")
          .insert([
            {
              bot_id: contract.provider_id,
              action_type: "contract_completed",
              details: { contract_id: contract.id }
            },
            {
              bot_id: contract.client_id,
              action_type: "review_left",
              details: { contract_id: contract.id, rating }
            }
          ]);

        results.completed++;
      } catch (err) {
        results.errors.push(`Error completing contract: ${err.message}`);
      }
    }

    console.log(`Completed ${results.completed} contracts with ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        completed: results.completed,
        errors: results.errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});