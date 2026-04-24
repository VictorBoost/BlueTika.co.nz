import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🚀 BOT-SUBMIT-BIDS: Function invoked");
  
  if (req.method === "OPTIONS") {
    console.log("⚪ BOT-SUBMIT-BIDS: OPTIONS request, returning CORS headers");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔧 BOT-SUBMIT-BIDS: Creating Supabase client");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    console.log("✅ BOT-SUBMIT-BIDS: Supabase client created");

    console.log("🔍 BOT-SUBMIT-BIDS: Fetching active provider bots");
    const { data: providerBots, error: botsError } = await supabaseClient
      .from("bot_accounts")
      .select("profile_id, profiles!inner(full_name, city_region)")
      .eq("bot_type", "provider")
      .eq("is_active", true);

    if (botsError) {
      console.error("❌ BOT-SUBMIT-BIDS: Error fetching bots:", botsError);
      throw botsError;
    }

    console.log(`✅ BOT-SUBMIT-BIDS: Found ${providerBots?.length || 0} active provider bots`);

    if (!providerBots || providerBots.length === 0) {
      console.log("⚠️ BOT-SUBMIT-BIDS: No active provider bots");
      return new Response(
        JSON.stringify({ success: true, message: "No active provider bots", created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 BOT-SUBMIT-BIDS: Fetching open projects");
    const { data: openProjects, error: projectsError } = await supabaseClient
      .from("projects")
      .select("id, title, budget, client_id")
      .eq("status", "open")
      .limit(100);

    if (projectsError) {
      console.error("❌ BOT-SUBMIT-BIDS: Error fetching projects:", projectsError);
      throw projectsError;
    }

    console.log(`✅ BOT-SUBMIT-BIDS: Found ${openProjects?.length || 0} open projects`);

    if (!openProjects || openProjects.length === 0) {
      console.log("⚠️ BOT-SUBMIT-BIDS: No open projects found");
      return new Response(
        JSON.stringify({ success: true, message: "No open projects found", created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bidMessages = [
      "Hi there! I've done similar work in the area and would love to help. I'm available this week and can start ASAP. Let me know if you'd like to discuss details. Cheers!",
      "Hey, this sounds right up my alley. I've got {years} years experience and can definitely get this sorted for you. Free to chat anytime if you want to go over specifics.",
      "G'day! Keen to quote on this job. I'm local to {city} so can come have a look whenever suits. No obligation, happy to give you a fair price.",
      "Hi! I'd be interested in this one. I've done heaps of these jobs and can guarantee quality work. Available to start next week if that works for you?",
      "Hey mate, reckon I can help you out with this. I'm pretty flexible with timing and my rates are competitive. Drop me a message if you want to chat about it.",
      "Hello! This is exactly the kind of work I specialize in. I'm based in {city} and can come by for a free quote. All work guaranteed, references available.",
      "Hi, I'd love to take this on. Got all the gear and experience needed. Can work around your schedule too. Let me know if you'd like to discuss!",
      "G'day! Happy to give you a hand with this. I'm reliable, tidy, and won't leave you with a mess. Been doing this for years. Keen to hear from you."
    ];

    const results = { created: 0, errors: [] as string[] };

    console.log(`🎯 BOT-SUBMIT-BIDS: Starting to submit bids for ${providerBots.length} provider bots`);

    for (const bot of providerBots) {
      const numBids = Math.floor(Math.random() * 2) + 1;
      console.log(`\n👤 BOT-SUBMIT-BIDS: Processing bot ${bot.profile_id} - will submit ${numBids} bids`);
      
      const shuffled = [...openProjects].sort(() => Math.random() - 0.5);
      const projectsToBidOn = shuffled.slice(0, numBids);

      for (const project of projectsToBidOn) {
        try {
          console.log(`  🔍 BOT-SUBMIT-BIDS: Checking if bot already bid on project ${project.id}`);
          
          const { data: existing } = await supabaseClient
            .from("bids")
            .select("id")
            .eq("project_id", project.id)
            .eq("provider_id", bot.profile_id)
            .maybeSingle();

          if (existing) {
            console.log(`  ⚠️ BOT-SUBMIT-BIDS: Bot already bid on project ${project.id}, skipping`);
            continue;
          }

          // Calculate competitive bid (20% lower than project budget for interactive pricing)
          const baseAmount = project.budget || 200;
          const bidAmount = Math.floor(baseAmount * 0.8); // 20% discount to be competitive

          const years = Math.floor(Math.random() * 10) + 3;
          const city = (bot.profiles as any)?.city_region || "Auckland";
          const message = bidMessages[Math.floor(Math.random() * bidMessages.length)]
            .replace("{years}", years.toString())
            .replace("{city}", city);

          console.log(`  💰 BOT-SUBMIT-BIDS: Submitting bid of NZD $${bidAmount} (20% off $${baseAmount}) on project "${project.title}"`);

          const { data: newBid, error: bidError } = await supabaseClient
            .from("bids")
            .insert({
              project_id: project.id,
              provider_id: bot.profile_id,
              amount: bidAmount,
              message,
              status: "pending"
            })
            .select()
            .single();

          if (bidError) {
            console.error(`  ❌ BOT-SUBMIT-BIDS: Failed to create bid:`, bidError);
            results.errors.push(`Bid creation failed: ${bidError.message}`);
            continue;
          }

          console.log(`  ✅ BOT-SUBMIT-BIDS: Bid created successfully! ID: ${newBid.id}`);

          await supabaseClient
            .from("bot_activity_logs")
            .insert({
              bot_id: bot.profile_id,
              action_type: "submit_bid",
              details: { project_id: project.id, bid_id: newBid.id, amount: bidAmount }
            });

          results.created++;
          console.log(`  📊 BOT-SUBMIT-BIDS: Total bids submitted so far: ${results.created}`);
        } catch (err: any) {
          console.error(`  ❌ BOT-SUBMIT-BIDS: Exception submitting bid:`, err);
          results.errors.push(`Error: ${err.message}`);
        }
      }
    }

    console.log(`\n🎉 BOT-SUBMIT-BIDS: COMPLETE! Submitted ${results.created} bids with ${results.errors.length} errors`);
    if (results.errors.length > 0) {
      console.log("❌ BOT-SUBMIT-BIDS: Errors encountered:", results.errors);
    }

    return new Response(
      JSON.stringify({ success: true, created: results.created, errors: results.errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("💥 BOT-SUBMIT-BIDS: FATAL ERROR:", error);
    console.error("💥 BOT-SUBMIT-BIDS: Error message:", error.message);
    console.error("💥 BOT-SUBMIT-BIDS: Error stack:", error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message, created: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});