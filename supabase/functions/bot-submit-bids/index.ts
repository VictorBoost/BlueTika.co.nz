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

    // Get active service provider bots
    const { data: providerBots } = await supabaseClient
      .from("bot_accounts")
      .select("profile_id, profiles!inner(full_name)")
      .eq("bot_type", "service_provider")
      .eq("is_active", true);

    if (!providerBots || providerBots.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active provider bots found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get open projects from other bots that don't have many bids yet
    const { data: openProjects } = await supabaseClient
      .from("projects")
      .select(`
        id,
        title,
        budget,
        client_id,
        bids(id)
      `)
      .eq("status", "open")
      .in("client_id", (await supabaseClient
        .from("bot_accounts")
        .select("profile_id")
        .eq("is_active", true)
      ).data?.map(b => b.profile_id) || []);

    if (!openProjects || openProjects.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No open bot projects found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bidMessages = [
      "Happy to help with this job. I have plenty of experience and can start right away.",
      "I'm available and keen to take this on. Fair pricing and quality work guaranteed.",
      "This is exactly the sort of work I specialise in. Can provide references if needed.",
      "I'd be perfect for this job. Local, reliable, and reasonably priced.",
      "I can definitely help with this. Been doing similar work for years.",
      "Would love to take this on. I'm thorough, professional, and fair with pricing.",
      "I'm interested in this job. Can fit you in this week if needed.",
      "This looks straightforward. I have all the right gear and experience.",
      "Keen to help out. I'm local and can give you a great price.",
      "I've done heaps of these jobs. Would be happy to sort this for you."
    ];

    const results = {
      created: 0,
      errors: [] as string[]
    };

    // Each provider bot bids on 2-3 random projects
    for (const provider of providerBots) {
      const numBids = Math.floor(Math.random() * 2) + 2; // 2-3 bids
      const availableProjects = openProjects
        .filter(p => p.client_id !== provider.profile_id) // Don't bid on own projects
        .filter(p => (p.bids as any[]).length < 5); // Only bid on projects with <5 bids

      if (availableProjects.length === 0) continue;

      for (let i = 0; i < Math.min(numBids, availableProjects.length); i++) {
        try {
          const project = availableProjects[Math.floor(Math.random() * availableProjects.length)];
          
          // Check if already bid on this project
          const { data: existingBid } = await supabaseClient
            .from("bids")
            .select("id")
            .eq("project_id", project.id)
            .eq("provider_id", provider.profile_id)
            .single();

          if (existingBid) continue; // Skip if already bid

          // Bid amount: 80-120% of project budget
          const budgetMultiplier = 0.8 + Math.random() * 0.4;
          const bidAmount = Math.round(project.budget * budgetMultiplier);
          const message = bidMessages[Math.floor(Math.random() * bidMessages.length)];

          const { error: bidError } = await supabaseClient
            .from("bids")
            .insert({
              project_id: project.id,
              provider_id: provider.profile_id,
              amount: bidAmount,
              message,
              status: "pending"
            });

          if (bidError) {
            results.errors.push(`Bid creation failed: ${bidError.message}`);
            continue;
          }

          // Log activity
          await supabaseClient
            .from("bot_activity_logs")
            .insert({
              bot_id: provider.profile_id,
              action_type: "bid_submitted",
              details: { project_id: project.id, amount: bidAmount }
            });

          results.created++;
        } catch (err) {
          results.errors.push(`Error submitting bid: ${err.message}`);
        }
      }
    }

    console.log(`Created ${results.created} bids with ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        created: results.created,
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