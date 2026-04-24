import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🤖 AUTO-BOT-ACTIVITY: Automatic activity cycle started");
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if automation is enabled
    const { data: automationSetting } = await supabaseClient
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "bot_automation_enabled")
      .single();

    if (automationSetting?.setting_value !== "true") {
      console.log("⏸️ AUTO-BOT-ACTIVITY: Bot automation is disabled, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Bot automation disabled", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      projects: 0,
      bids: 0,
      contracts: 0,
      payments: 0,
      errors: [] as string[]
    };

    // Random delays between actions to look natural (1-3 seconds)
    const randomDelay = () => new Promise(resolve => 
      setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000)
    );

    // STEP 1: Post Projects (3-8 projects)
    console.log("\n📝 AUTO-BOT-ACTIVITY: Step 1 - Posting projects...");
    try {
      const projectCount = Math.floor(Math.random() * 6) + 3; // 3-8 projects
      console.log(`🎯 AUTO-BOT-ACTIVITY: Will create ${projectCount} projects`);

      const { data: clientBots } = await supabaseClient
        .from("bot_accounts")
        .select("profile_id, profiles!inner(full_name, city_region)")
        .eq("bot_type", "client")
        .eq("is_active", true)
        .limit(projectCount);

      if (clientBots && clientBots.length > 0) {
        const { data: categories } = await supabaseClient
          .from("categories")
          .select("id, name, subcategories(id, name)");

        const projectTemplates = [
          { title: "Need plumber for leaking tap", budget: [80, 150], urgency: "within_week" },
          { title: "Garden maintenance this weekend", budget: [100, 200], urgency: "flexible" },
          { title: "Help moving furniture", budget: [150, 300], urgency: "urgent" },
          { title: "House cleaning needed", budget: [80, 150], urgency: "within_week" },
          { title: "Painting bedroom walls", budget: [300, 600], urgency: "flexible" },
          { title: "Lawn mowing service", budget: [50, 100], urgency: "within_week" },
          { title: "Handyman for odd jobs", budget: [150, 300], urgency: "flexible" },
          { title: "Fence repair needed", budget: [400, 800], urgency: "urgent" }
        ];

        for (const bot of clientBots.slice(0, projectCount)) {
          await randomDelay();
          
          const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
          const category = categories?.[Math.floor(Math.random() * (categories?.length || 1))];
          const budget = Math.floor(Math.random() * (template.budget[1] - template.budget[0])) + template.budget[0];

          const { error } = await supabaseClient
            .from("projects")
            .insert({
              title: template.title,
              description: "Looking for someone reliable to help with this. " + 
                          "Can provide more details if needed. Thanks!",
              category_id: category?.id,
              budget,
              urgency: template.urgency,
              client_id: bot.profile_id,
              status: "open"
            });

          if (!error) {
            results.projects++;
          } else {
            results.errors.push(`Project: ${error.message}`);
          }
        }
      }
      console.log(`✅ AUTO-BOT-ACTIVITY: Created ${results.projects} projects`);
    } catch (err: any) {
      console.error("❌ AUTO-BOT-ACTIVITY: Project creation failed:", err);
      results.errors.push(`Projects: ${err.message}`);
    }

    await randomDelay();

    // STEP 2: Submit Bids (5-15 bids)
    console.log("\n💰 AUTO-BOT-ACTIVITY: Step 2 - Submitting bids...");
    try {
      const bidCount = Math.floor(Math.random() * 11) + 5; // 5-15 bids
      console.log(`🎯 AUTO-BOT-ACTIVITY: Will submit ${bidCount} bids`);

      const { data: openProjects } = await supabaseClient
        .from("projects")
        .select("id, title, budget")
        .eq("status", "open")
        .limit(50);

      const { data: providerBots } = await supabaseClient
        .from("bot_accounts")
        .select("profile_id")
        .eq("bot_type", "provider")
        .eq("is_active", true)
        .limit(20);

      if (openProjects && openProjects.length > 0 && providerBots && providerBots.length > 0) {
        for (let i = 0; i < bidCount && i < openProjects.length; i++) {
          await randomDelay();
          
          const project = openProjects[i];
          const provider = providerBots[Math.floor(Math.random() * providerBots.length)];

          // Check if already bid
          const { data: existing } = await supabaseClient
            .from("bids")
            .select("id")
            .eq("project_id", project.id)
            .eq("provider_id", provider.profile_id)
            .maybeSingle();

          if (!existing) {
            const baseAmount = project.budget || 200;
            const variation = Math.random() * 0.3 - 0.15;
            const bidAmount = Math.max(50, Math.round(baseAmount * (1 + variation)));

            const { error } = await supabaseClient
              .from("bids")
              .insert({
                project_id: project.id,
                provider_id: provider.profile_id,
                amount: bidAmount,
                message: "Hi! I can help with this. Available to start soon. Let me know!",
                status: "pending"
              });

            if (!error) {
              results.bids++;
            } else {
              results.errors.push(`Bid: ${error.message}`);
            }
          }
        }
      }
      console.log(`✅ AUTO-BOT-ACTIVITY: Submitted ${results.bids} bids`);
    } catch (err: any) {
      console.error("❌ AUTO-BOT-ACTIVITY: Bid submission failed:", err);
      results.errors.push(`Bids: ${err.message}`);
    }

    await randomDelay();

    // STEP 3: Accept Bids (1-3 contracts)
    console.log("\n📋 AUTO-BOT-ACTIVITY: Step 3 - Accepting bids...");
    try {
      const acceptCount = Math.floor(Math.random() * 3) + 1; // 1-3 contracts
      console.log(`🎯 AUTO-BOT-ACTIVITY: Will accept ${acceptCount} bids`);

      const { data: projectsWithBids } = await supabaseClient
        .from("projects")
        .select(`
          id,
          client_id,
          bids!inner(id, provider_id, amount, status)
        `)
        .eq("status", "open")
        .eq("bids.status", "pending")
        .limit(acceptCount);

      if (projectsWithBids && projectsWithBids.length > 0) {
        for (const project of projectsWithBids) {
          await randomDelay();

          // Check if client is a bot
          const { data: clientBot } = await supabaseClient
            .from("bot_accounts")
            .select("profile_id")
            .eq("profile_id", project.client_id)
            .maybeSingle();

          if (clientBot) {
            const bids = Array.isArray(project.bids) ? project.bids : [];
            if (bids.length > 0) {
              const winningBid = bids[Math.floor(Math.random() * bids.length)];

              // Accept winning bid
              await supabaseClient
                .from("bids")
                .update({ status: "accepted" })
                .eq("id", winningBid.id);

              // Decline others
              const otherBids = bids.filter(b => b.id !== winningBid.id);
              if (otherBids.length > 0) {
                await supabaseClient
                  .from("bids")
                  .update({ status: "declined" })
                  .in("id", otherBids.map(b => b.id));
              }

              // Create contract
              const { error } = await supabaseClient
                .from("contracts")
                .insert({
                  project_id: project.id,
                  client_id: project.client_id,
                  provider_id: winningBid.provider_id,
                  bid_id: winningBid.id,
                  status: "accepted",
                  payment_status: "pending"
                });

              if (!error) {
                // Update project status
                await supabaseClient
                  .from("projects")
                  .update({ status: "in_progress" })
                  .eq("id", project.id);

                results.contracts++;
              } else {
                results.errors.push(`Contract: ${error.message}`);
              }
            }
          }
        }
      }
      console.log(`✅ AUTO-BOT-ACTIVITY: Created ${results.contracts} contracts`);
    } catch (err: any) {
      console.error("❌ AUTO-BOT-ACTIVITY: Contract creation failed:", err);
      results.errors.push(`Contracts: ${err.message}`);
    }

    await randomDelay();

    // STEP 4: Process Payments (1-2 payments) - Only if enabled
    console.log("\n💳 AUTO-BOT-ACTIVITY: Step 4 - Processing payments...");
    try {
      const { data: paymentSetting } = await supabaseClient
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", "bot_payments_enabled")
        .single();

      if (paymentSetting?.setting_value === "true") {
        const paymentCount = Math.floor(Math.random() * 2) + 1; // 1-2 payments
        console.log(`🎯 AUTO-BOT-ACTIVITY: Will process ${paymentCount} payments`);

        // Note: Actual Stripe payments are handled by bot-complete-contracts edge function
        // We just trigger the completion flow here
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/bot-complete-contracts`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();
        if (data.success) {
          results.payments = data.paid || 0;
          console.log(`✅ AUTO-BOT-ACTIVITY: Processed ${results.payments} payments`);
        }
      } else {
        console.log("⏸️ AUTO-BOT-ACTIVITY: Bot payments disabled, skipping");
      }
    } catch (err: any) {
      console.error("❌ AUTO-BOT-ACTIVITY: Payment processing failed:", err);
      results.errors.push(`Payments: ${err.message}`);
    }

    // Log the activity cycle
    console.log("\n📊 AUTO-BOT-ACTIVITY: Cycle complete");
    console.log(`   Projects: ${results.projects}`);
    console.log(`   Bids: ${results.bids}`);
    console.log(`   Contracts: ${results.contracts}`);
    console.log(`   Payments: ${results.payments}`);
    if (results.errors.length > 0) {
      console.log(`   Errors: ${results.errors.length}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("💥 AUTO-BOT-ACTIVITY: FATAL ERROR:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});