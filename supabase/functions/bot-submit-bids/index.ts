import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("💰 BOT-SUBMIT-BIDS: Starting bid submission");
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get open projects
    const { data: openProjects, error: projectsError } = await supabaseClient
      .from("projects")
      .select("id, title, budget, client_id")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30);

    if (projectsError) {
      console.error("Failed to fetch projects:", projectsError);
      throw projectsError;
    }

    if (!openProjects || openProjects.length === 0) {
      console.log("No open projects found");
      return new Response(
        JSON.stringify({ success: true, created: 0, message: "No open projects" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active provider bots
    const { data: providerBots, error: botsError } = await supabaseClient
      .from("bot_accounts")
      .select("profile_id")
      .eq("bot_type", "provider")
      .eq("is_active", true);

    if (botsError) {
      console.error("Failed to fetch provider bots:", botsError);
      throw botsError;
    }

    if (!providerBots || providerBots.length === 0) {
      console.log("No active provider bots found");
      return new Response(
        JSON.stringify({ success: true, created: 0, message: "No provider bots" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let createdBids = 0;
    const randomDelay = () => new Promise(resolve => 
      setTimeout(resolve, Math.floor(Math.random() * 1000) + 500)
    );

    // Submit bids
    for (const project of openProjects) {
      // Skip if project has too many bids already
      const { count: existingBidsCount } = await supabaseClient
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);

      if (existingBidsCount && existingBidsCount >= 5) {
        continue;
      }

      // 60% chance to bid on each project
      if (Math.random() > 0.6) continue;

      await randomDelay();

      // Select random provider
      const provider = providerBots[Math.floor(Math.random() * providerBots.length)];

      // Check if this provider already bid
      const { data: existingBid } = await supabaseClient
        .from("bids")
        .select("id")
        .eq("project_id", project.id)
        .eq("provider_id", provider.profile_id)
        .maybeSingle();

      if (existingBid) continue;

      // Calculate bid amount: 5-20% cheaper than project budget
      const baseAmount = project.budget || 200;
      const discountPercent = 0.05 + (Math.random() * 0.15); // 5-20% discount
      const bidAmount = Math.max(50, Math.round(baseAmount * (1 - discountPercent)));

      const messages = [
        "Hi! I can help with this. Available to start soon. Let me know!",
        "I have experience with similar projects. Happy to discuss details.",
        "I'd be happy to help! Can start right away if needed.",
        "This looks like a great project. I'm available and ready to start.",
        "I can handle this professionally. Let's discuss the details!"
      ];

      const message = messages[Math.floor(Math.random() * messages.length)];

      const { error: bidError } = await supabaseClient
        .from("bids")
        .insert({
          project_id: project.id,
          provider_id: provider.profile_id,
          amount: bidAmount,
          message,
          estimated_timeline: `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 5) + 3} days`,
          status: "pending"
        });

      if (!bidError) {
        createdBids++;
        console.log(`✅ Bid submitted: $${bidAmount} (${Math.round(discountPercent * 100)}% off $${baseAmount})`);
      } else {
        console.error("Bid creation error:", bidError);
      }
    }

    console.log(`✅ BOT-SUBMIT-BIDS: Created ${createdBids} bids`);

    return new Response(
      JSON.stringify({
        success: true,
        created: createdBids,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("BOT-SUBMIT-BIDS ERROR:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});