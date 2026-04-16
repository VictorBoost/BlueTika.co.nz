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

    // Get bot client accounts
    const { data: botClients } = await supabaseClient
      .from("bot_accounts")
      .select("profile_id")
      .eq("bot_type", "client")
      .eq("is_active", true);

    if (!botClients || botClients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No client bots found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientIds = botClients.map(b => b.profile_id);

    // Get open projects from bot clients that have bids
    const { data: projectsWithBids } = await supabaseClient
      .from("projects")
      .select(`
        id,
        title,
        client_id,
        bids!inner(
          id,
          provider_id,
          amount,
          status
        )
      `)
      .eq("status", "open")
      .in("client_id", clientIds)
      .eq("bids.status", "pending");

    if (!projectsWithBids || projectsWithBids.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No projects with bids found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      accepted: 0,
      errors: [] as string[]
    };

    // Accept 1-2 bids randomly
    const projectsToAccept = projectsWithBids
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 1);

    for (const project of projectsToAccept) {
      try {
        const bids = project.bids as any[];
        if (bids.length === 0) continue;

        // Pick a random bid to accept
        const bidToAccept = bids[Math.floor(Math.random() * bids.length)];

        // Update bid status to accepted
        const { error: bidUpdateError } = await supabaseClient
          .from("bids")
          .update({ status: "accepted" })
          .eq("id", bidToAccept.id);

        if (bidUpdateError) {
          results.errors.push(`Bid update failed: ${bidUpdateError.message}`);
          continue;
        }

        // Reject other bids
        const otherBids = bids.filter(b => b.id !== bidToAccept.id);
        if (otherBids.length > 0) {
          await supabaseClient
            .from("bids")
            .update({ status: "rejected" })
            .in("id", otherBids.map(b => b.id));
        }

        // Create contract
        const { data: contract, error: contractError } = await supabaseClient
          .from("contracts")
          .insert({
            project_id: project.id,
            client_id: project.client_id,
            provider_id: bidToAccept.provider_id,
            agreed_amount: bidToAccept.amount,
            final_amount: bidToAccept.amount,
            status: "in_progress"
          })
          .select()
          .single();

        if (contractError || !contract) {
          results.errors.push(`Contract creation failed: ${contractError?.message}`);
          continue;
        }

        // Update project status
        await supabaseClient
          .from("projects")
          .update({ status: "in_progress" })
          .eq("id", project.id);

        // Log activity
        await supabaseClient
          .from("bot_activity_logs")
          .insert({
            bot_id: project.client_id,
            action_type: "bid_accepted",
            details: { bid_id: bidToAccept.id, contract_id: contract.id }
          });

        results.accepted++;
      } catch (err) {
        results.errors.push(`Error accepting bid: ${err.message}`);
      }
    }

    console.log(`Accepted ${results.accepted} bids with ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        accepted: results.accepted,
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