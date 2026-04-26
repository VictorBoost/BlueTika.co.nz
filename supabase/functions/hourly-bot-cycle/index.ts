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
      fundReleases: 0,
      ghostedProviders: 0,
      awaitingAutoRelease: 0,
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

    // Step 5: Provider Bots Submit Work & Reviews
    console.log("\n📸 Step 5: Provider bots uploading work evidence and submitting reviews...");
    try {
      const { data: paidContracts } = await supabaseClient
        .from("contracts")
        .select("id, provider_id, client_id, final_amount")
        .eq("status", "active")
        .eq("payment_status", "held")
        .is("work_done_at", null)
        .limit(5);

      if (paidContracts && paidContracts.length > 0) {
        const reviewTemplates = [
          { text: "Great client! Clear communication and prompt payment.", rating: 5 },
          { text: "Excellent to work with. Would work for them again.", rating: 5 },
          { text: "Good client, paid on time.", rating: 4 },
          { text: "Professional and respectful. Recommended.", rating: 5 },
          { text: "Fair client, smooth process.", rating: 4 },
          { text: "Very satisfied working on this project.", rating: 5 },
          { text: "Good experience, clear expectations.", rating: 4 },
          { text: "Quick payment, good communication. Thanks!", rating: 5 },
          { text: "Professional client, would work with again.", rating: 5 },
          { text: "Reliable and fair. Great client.", rating: 4 }
        ];

        for (const contract of paidContracts) {
          const { data: isProviderBot } = await supabaseClient
            .from("bot_accounts")
            .select("id")
            .eq("profile_id", contract.provider_id)
            .maybeSingle();

          if (isProviderBot) {
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

            // Provider submits review of client immediately
            const review = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
            await supabaseClient.from("reviews").insert({
              contract_id: contract.id,
              reviewer_id: contract.provider_id,
              reviewee_id: contract.client_id,
              rating: review.rating,
              comment: review.text,
              review_type: "provider_to_client"
            });

            await supabaseClient
              .from("contracts")
              .update({
                work_done_at: new Date().toISOString(),
                after_photos_submitted_at: new Date().toISOString(),
                status: "awaiting_fund_release",
                ready_for_release_at: new Date().toISOString()
              } as any)
              .eq("id", contract.id);

            results.completed++;
            results.ghostedProviders++;
            console.log(`   📸✅ Provider uploaded photos + review (${review.rating}★) for contract ${contract.id}`);
          }
        }
      }
      console.log(`✅ Completed ${results.completed} work submissions with reviews`);
    } catch (err: any) {
      console.error("❌ Provider work submission failed:", err);
      results.errors.push(`Provider work: ${err.message}`);
    }

    // Step 6: REALISTIC - Some Client Bots Manually Release Funds (30% chance) + Submit Reviews
    console.log("\n💰 Step 6: Client bots manually releasing funds (30% chance)...");
    try {
      const { data: awaitingRelease } = await supabaseClient
        .from("contracts")
        .select("id, client_id, provider_id, final_amount, platform_fee")
        .eq("status", "awaiting_fund_release")
        .eq("payment_status", "held")
        .limit(10);

      if (awaitingRelease && awaitingRelease.length > 0) {
        const clientReviewTemplates = [
          { text: "Great work! Very professional and on time.", rating: 5 },
          { text: "Excellent service, highly recommend!", rating: 5 },
          { text: "Good job, happy with the results.", rating: 4 },
          { text: "Professional and reliable. Would hire again.", rating: 5 },
          { text: "Decent work, met expectations.", rating: 4 },
          { text: "Very satisfied with the quality.", rating: 5 },
          { text: "Good service, reasonable price.", rating: 4 },
          { text: "Quick and efficient. Thanks!", rating: 5 },
          { text: "Quality workmanship, on budget.", rating: 5 },
          { text: "Reliable and friendly service.", rating: 4 }
        ];

        for (const contract of awaitingRelease) {
          const { data: isClientBot } = await supabaseClient
            .from("bot_accounts")
            .select("id")
            .eq("profile_id", contract.client_id)
            .maybeSingle();

          if (isClientBot) {
            if (Math.random() < 0.3) {
              // Client reviews provider
              const review = clientReviewTemplates[Math.floor(Math.random() * clientReviewTemplates.length)];
              await supabaseClient.from("reviews").insert({
                contract_id: contract.id,
                reviewer_id: contract.client_id,
                reviewee_id: contract.provider_id,
                rating: review.rating,
                comment: review.text,
                review_type: "client_to_provider"
              });

              await supabaseClient
                .from("contracts")
                .update({
                  payment_status: "released",
                  status: "completed",
                  funds_released_at: new Date().toISOString(),
                  reviewed_at: new Date().toISOString()
                } as any)
                .eq("id", contract.id);

              results.fundReleases++;
              console.log(`   ✅ Client released funds + review (${review.rating}★) for contract ${contract.id}`);
            } else {
              results.awaitingAutoRelease++;
              console.log(`   ⏳ Client ghosting contract ${contract.id} - will auto-release in 48h`);
            }
          }
        }
      }
      console.log(`✅ Manual fund releases: ${results.fundReleases}, Waiting for auto-release: ${results.awaitingAutoRelease}`);
    } catch (err: any) {
      console.error("❌ Fund release failed:", err);
      results.errors.push(`Fund release: ${err.message}`);
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
    console.log(`   Work Completed: ${results.completed}`);
    console.log(`   Manual Fund Releases: ${results.fundReleases}`);
    console.log(`   Ghosted (awaiting auto-release): ${results.ghostedProviders}`);
    console.log(`   Contracts waiting 48h: ${results.awaitingAutoRelease}`);
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