import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🚀 BOT-ACCEPT-BIDS: Function invoked");
  
  if (req.method === "OPTIONS") {
    console.log("⚪ BOT-ACCEPT-BIDS: OPTIONS request, returning CORS headers");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔧 BOT-ACCEPT-BIDS: Creating Supabase client");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    console.log("✅ BOT-ACCEPT-BIDS: Supabase client created");

    console.log("🔍 BOT-ACCEPT-BIDS: Fetching projects with pending bids");
    const { data: projects, error: projectsError } = await supabaseClient
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
      .eq("bids.status", "pending")
      .limit(50);

    if (projectsError) {
      console.error("❌ BOT-ACCEPT-BIDS: Error fetching projects:", projectsError);
      throw projectsError;
    }

    console.log(`✅ BOT-ACCEPT-BIDS: Found ${projects?.length || 0} projects with pending bids`);

    if (!projects || projects.length === 0) {
      console.log("⚠️ BOT-ACCEPT-BIDS: No projects with pending bids");
      return new Response(
        JSON.stringify({ success: true, message: "No projects with pending bids", accepted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = { accepted: 0, errors: [] as string[] };

    console.log(`🎯 BOT-ACCEPT-BIDS: Starting to accept bids for ${projects.length} projects`);

    for (const project of projects) {
      try {
        console.log(`\n📋 BOT-ACCEPT-BIDS: Processing project ${project.id}: "${project.title}"`);
        
        const { data: clientBot } = await supabaseClient
          .from("bot_accounts")
          .select("profile_id")
          .eq("profile_id", project.client_id)
          .maybeSingle();

        if (!clientBot) {
          console.log(`  ⚠️ BOT-ACCEPT-BIDS: Project client is not a bot, skipping`);
          continue;
        }

        const bids = Array.isArray(project.bids) ? project.bids : [];
        console.log(`  🔍 BOT-ACCEPT-BIDS: Found ${bids.length} bids for this project`);
        
        if (bids.length === 0) {
          console.log(`  ⚠️ BOT-ACCEPT-BIDS: No bids to accept`);
          continue;
        }

        const winningBid = bids[Math.floor(Math.random() * bids.length)];
        console.log(`  🎯 BOT-ACCEPT-BIDS: Selected winning bid ${winningBid.id} with amount NZD $${winningBid.amount}`);

        console.log(`  📝 BOT-ACCEPT-BIDS: Updating bid status to 'accepted'`);
        const { error: bidUpdateError } = await supabaseClient
          .from("bids")
          .update({ status: "accepted" })
          .eq("id", winningBid.id);

        if (bidUpdateError) {
          console.error(`  ❌ BOT-ACCEPT-BIDS: Failed to update bid:`, bidUpdateError);
          results.errors.push(`Bid update failed: ${bidUpdateError.message}`);
          continue;
        }

        console.log(`  🔄 BOT-ACCEPT-BIDS: Declining other bids`);
        const otherBidIds = bids.filter(b => b.id !== winningBid.id).map(b => b.id);
        if (otherBidIds.length > 0) {
          await supabaseClient
            .from("bids")
            .update({ status: "declined" })
            .in("id", otherBidIds);
          console.log(`  ✅ BOT-ACCEPT-BIDS: Declined ${otherBidIds.length} other bids`);
        }

        console.log(`  📝 BOT-ACCEPT-BIDS: Creating contract`);
        const { data: newContract, error: contractError } = await supabaseClient
          .from("contracts")
          .insert({
            project_id: project.id,
            client_id: project.client_id,
            provider_id: winningBid.provider_id,
            bid_id: winningBid.id,
            final_amount: winningBid.amount,
            status: "active",
            payment_status: "pending"
          })
          .select()
          .single();

        if (contractError) {
          console.error(`  ❌ BOT-ACCEPT-BIDS: Failed to create contract:`, contractError);
          results.errors.push(`Contract creation failed: ${contractError.message}`);
          continue;
        }

        console.log(`  ✅ BOT-ACCEPT-BIDS: Contract created successfully! ID: ${newContract.id}`);

        console.log(`  🔄 BOT-ACCEPT-BIDS: Updating project status to 'assigned'`);
        await supabaseClient
          .from("projects")
          .update({ status: "assigned" })
          .eq("id", project.id);

        await supabaseClient
          .from("bot_activity_logs")
          .insert({
            bot_id: project.client_id,
            action_type: "accept_bid",
            details: { project_id: project.id, bid_id: winningBid.id, contract_id: newContract.id }
          });

        results.accepted++;
        console.log(`  📊 BOT-ACCEPT-BIDS: Total contracts created so far: ${results.accepted}`);
      } catch (err: any) {
        console.error(`  ❌ BOT-ACCEPT-BIDS: Exception processing project:`, err);
        results.errors.push(`Error: ${err.message}`);
      }
    }

    console.log(`\n🎉 BOT-ACCEPT-BIDS: COMPLETE! Accepted ${results.accepted} bids with ${results.errors.length} errors`);
    if (results.errors.length > 0) {
      console.log("❌ BOT-ACCEPT-BIDS: Errors encountered:", results.errors);
    }

    return new Response(
      JSON.stringify({ success: true, accepted: results.accepted, errors: results.errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("💥 BOT-ACCEPT-BIDS: FATAL ERROR:", error);
    console.error("💥 BOT-ACCEPT-BIDS: Error message:", error.message);
    console.error("💥 BOT-ACCEPT-BIDS: Error stack:", error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message, accepted: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});