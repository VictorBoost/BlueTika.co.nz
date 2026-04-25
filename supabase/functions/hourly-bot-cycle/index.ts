import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("⏰ HOURLY-BOT-CYCLE: Starting continuous 24/7 bot automation");
  
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
      console.log("⏸️ HOURLY-BOT-CYCLE: Bot automation is disabled");
      return new Response(
        JSON.stringify({ success: true, message: "Automation disabled", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🚀 HOURLY-BOT-CYCLE: Running full lifecycle automation");

    const results = {
      projects: 0,
      bids: 0,
      messages: 0,
      contracts: 0,
      payments: 0,
      completed: 0,
      errors: [] as string[]
    };

    // Step 1: Post Projects (1-5 per active bot)
    console.log("\n📝 Step 1: Posting projects...");
    try {
      const { data: clientBots } = await supabaseClient
        .from("bot_accounts")
        .select("profile_id, profiles!inner(full_name, city_region)")
        .eq("bot_type", "client")
        .eq("is_active", true)
        .limit(10);

      const { data: categories } = await supabaseClient
        .from("categories")
        .select("id, name")
        .eq("is_active", true);

      if (clientBots && categories && clientBots.length > 0) {
        const templates = [
          { title: "Need plumber for leaking tap", basePrice: 150 },
          { title: "Garden maintenance needed", basePrice: 200 },
          { title: "Help moving furniture", basePrice: 250 },
          { title: "House cleaning service", basePrice: 120 },
          { title: "Painting bedroom walls", basePrice: 400 },
          { title: "Lawn mowing service", basePrice: 80 },
          { title: "Handyman for odd jobs", basePrice: 180 },
          { title: "Deck staining", basePrice: 350 },
          { title: "Gutter cleaning", basePrice: 140 },
          { title: "Window washing", basePrice: 90 }
        ];

        const locations = ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Dunedin"];

        // Each bot posts 1-5 projects
        for (const bot of clientBots) {
          const projectCount = Math.floor(Math.random() * 5) + 1; // 1-5
          
          for (let i = 0; i < projectCount; i++) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            const budget = Math.floor(template.basePrice * (0.6 + Math.random() * 0.4));

            const { error } = await supabaseClient
              .from("projects")
              .insert({
                title: template.title,
                description: "Looking for someone reliable. Can provide details if needed. Thanks!",
                category_id: category.id,
                budget,
                client_id: bot.profile_id,
                location: bot.profiles?.city_region || locations[Math.floor(Math.random() * locations.length)],
                status: "open"
              });

            if (!error) {
              results.projects++;
            } else {
              results.errors.push(`Project: ${error.message}`);
            }
          }
        }
      }
      console.log(`✅ Posted ${results.projects} projects`);
    } catch (err: any) {
      console.error("❌ Project posting failed:", err);
      results.errors.push(`Projects: ${err.message}`);
    }

    // Step 2: Submit Bids (1-3 per active bot)
    console.log("\n💰 Step 2: Submitting bids...");
    try {
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

      if (openProjects && providerBots && openProjects.length > 0 && providerBots.length > 0) {
        // Each provider bot submits 1-3 bids
        for (const provider of providerBots) {
          const bidCount = Math.floor(Math.random() * 3) + 1; // 1-3
          
          for (let i = 0; i < bidCount && i < openProjects.length; i++) {
            const project = openProjects[Math.floor(Math.random() * openProjects.length)];

            const { data: existing } = await supabaseClient
              .from("bids")
              .select("id")
              .eq("project_id", project.id)
              .eq("provider_id", provider.profile_id)
              .maybeSingle();

            if (!existing) {
              const baseAmount = project.budget || 200;
              const bidAmount = Math.max(50, Math.round(baseAmount * (0.85 + Math.random() * 0.1)));

              const { error } = await supabaseClient
                .from("bids")
                .insert({
                  project_id: project.id,
                  provider_id: provider.profile_id,
                  amount: bidAmount,
                  message: "Hi! I can help with this. Available to start soon.",
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
      }
      console.log(`✅ Submitted ${results.bids} bids`);
    } catch (err: any) {
      console.error("❌ Bid submission failed:", err);
      results.errors.push(`Bids: ${err.message}`);
    }

    // Step 3: Accept Bids (1-2 per client bot)
    console.log("\n📋 Step 3: Accepting bids...");
    try {
      const { data: projectsWithBids } = await supabaseClient
        .from("projects")
        .select(`
          id,
          client_id,
          bids!inner(id, provider_id, amount, status)
        `)
        .eq("status", "open")
        .eq("bids.status", "pending")
        .limit(10);

      if (projectsWithBids && projectsWithBids.length > 0) {
        for (const project of projectsWithBids) {
          const { data: clientBot } = await supabaseClient
            .from("bot_accounts")
            .select("profile_id")
            .eq("profile_id", project.client_id)
            .maybeSingle();

          if (clientBot) {
            const bids = Array.isArray(project.bids) ? project.bids : [];
            if (bids.length > 0) {
              const winningBid = bids[Math.floor(Math.random() * bids.length)];

              await supabaseClient.from("bids").update({ status: "accepted" }).eq("id", winningBid.id);

              const otherBids = bids.filter(b => b.id !== winningBid.id);
              if (otherBids.length > 0) {
                await supabaseClient.from("bids").update({ status: "declined" }).in("id", otherBids.map(b => b.id));
              }

              const { data: newContract, error } = await supabaseClient
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
                .select("id")
                .single();

              if (!error && newContract) {
                await supabaseClient.from("projects").update({ status: "assigned" }).eq("id", project.id);
                results.contracts++;
              } else {
                results.errors.push(`Contract: ${error?.message}`);
              }
            }
          }
        }
      }
      console.log(`✅ Created ${results.contracts} contracts`);
    } catch (err: any) {
      console.error("❌ Contract creation failed:", err);
      results.errors.push(`Contracts: ${err.message}`);
    }

    // Step 4: Process Payments
    console.log("\n💳 Step 4: Processing payments...");
    try {
      const { data: unpaidContracts } = await supabaseClient
        .from("contracts")
        .select("id, final_amount")
        .eq("payment_status", "pending")
        .eq("status", "active")
        .limit(5);

      if (unpaidContracts && unpaidContracts.length > 0) {
        for (const contract of unpaidContracts) {
          try {
            const response = await fetch(`${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '')}/functions/v1/bot-make-payment`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ contractId: contract.id })
            });

            if (response.ok) {
              results.payments++;
            } else {
              const error = await response.text();
              results.errors.push(`Payment ${contract.id}: ${error}`);
            }
          } catch (err: any) {
            results.errors.push(`Payment ${contract.id}: ${err.message}`);
          }
        }
      }
      console.log(`✅ Processed ${results.payments} payments`);
    } catch (err: any) {
      console.error("❌ Payment processing failed:", err);
      results.errors.push(`Payments: ${err.message}`);
    }

    // Step 5: Complete Work
    console.log("\n✅ Step 5: Completing work...");
    try {
      const { data: paidContracts } = await supabaseClient
        .from("contracts")
        .select("id, provider_id")
        .eq("status", "active")
        .eq("payment_status", "held")
        .is("work_done_at", null)
        .limit(3);

      if (paidContracts && paidContracts.length > 0) {
        for (const contract of paidContracts) {
          // Upload evidence photos
          await supabaseClient.from("evidence_photos").insert([
            {
              contract_id: contract.id,
              photo_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
              uploaded_by: contract.provider_id,
              description: "Work completed - before"
            },
            {
              contract_id: contract.id,
              photo_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
              uploaded_by: contract.provider_id,
              description: "Work completed - after"
            }
          ]);

          const { error } = await supabaseClient
            .from("contracts")
            .update({
              work_done_at: new Date().toISOString(),
              after_photos_submitted_at: new Date().toISOString(),
              status: "awaiting_fund_release",
              ready_for_release_at: new Date().toISOString()
            } as any)
            .eq("id", contract.id);

          if (!error) {
            results.completed++;
          }
        }
      }
      console.log(`✅ Completed ${results.completed} contracts`);
    } catch (err: any) {
      console.error("❌ Work completion failed:", err);
      results.errors.push(`Work: ${err.message}`);
    }

    // Update last run timestamp
    await supabaseClient
      .from("platform_settings")
      .update({ setting_value: new Date().toISOString() })
      .eq("setting_key", "bot_last_activity_run");

    console.log("\n📊 HOURLY-BOT-CYCLE COMPLETE");
    console.log(`   Projects: ${results.projects}`);
    console.log(`   Bids: ${results.bids}`);
    console.log(`   Contracts: ${results.contracts}`);
    console.log(`   Payments: ${results.payments}`);
    console.log(`   Completed: ${results.completed}`);
    if (results.errors.length > 0) {
      console.log(`   Errors: ${results.errors.length}`);
      results.errors.forEach(e => console.log(`      - ${e}`));
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
    console.error("💥 HOURLY-BOT-CYCLE: FATAL ERROR:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});