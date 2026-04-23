import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if automation is enabled
    const { data: setting, error: settingError } = await supabaseClient
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "bot_automation_enabled")
      .single();

    if (settingError || !setting || setting.setting_value !== "true") {
      return new Response(
        JSON.stringify({ 
          message: "Bot automation is disabled",
          botsCreated: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("Daily bot generation started");
    
    const botsToGenerate = randomInRange(20, 30);
    const providerCount = Math.floor(botsToGenerate * 0.4);
    const clientCount = botsToGenerate - providerCount;

    const nzFirstNames = [
      "Aroha", "Wiremu", "Kahu", "Mere", "Hemi", "Ngaio", "Rawiri", "Anahera",
      "Jack", "Sophie", "Liam", "Emma", "Noah", "Olivia", "James", "Isla",
      "Mason", "Charlotte", "William", "Amelia", "Lucas", "Mia", "Ethan", "Harper",
      "Oliver", "Grace", "Hunter", "Lily", "Cooper", "Zoe", "Ben", "Ruby",
      "Sam", "Ella", "Max", "Chloe", "Tom", "Sarah", "Mike", "Hannah"
    ];

    const nzLastNames = [
      "Smith", "Jones", "Williams", "Brown", "Taylor", "Wilson", "Anderson", "Thomas",
      "Walker", "White", "Harris", "Martin", "Thompson", "Wood", "Lee", "Clark",
      "Robinson", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Campbell",
      "Mitchell", "Turner", "Phillips", "Parker", "Evans", "Collins", "Stewart", "Morris",
      "Te Whare", "Ngata", "Rewi", "Tana", "Hohepa", "Parata", "Wiki", "Kingi"
    ];

    const nzCities = [
      "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Dunedin",
      "Palmerston North", "Napier", "Porirua", "Rotorua", "New Plymouth", "Whangarei",
      "Invercargill", "Nelson", "Hastings", "Gisborne", "Blenheim", "Timaru"
    ];

    const serviceBios = [
      "Experienced professional dedicated to quality workmanship. Licensed and insured.",
      "Reliable service with attention to detail. Over 10 years in the industry.",
      "Family-owned business serving Kiwis with pride. Fair pricing guaranteed.",
      "Qualified tradie with stellar reviews. No job too big or small.",
      "Professional service provider committed to customer satisfaction.",
      "Fully certified with comprehensive insurance coverage. Book with confidence.",
      "Local expert passionate about helping the community. Competitive rates.",
      "Skilled professional with modern equipment. Quality work every time."
    ];

    const clientBios = [
      "Busy professional looking for reliable service providers.",
      "Homeowner seeking quality tradies for various projects.",
      "Property manager needing dependable contractors.",
      "First-time homeowner eager to find trustworthy help.",
      "Landlord maintaining multiple properties across NZ.",
      "Retired couple looking for occasional home maintenance help.",
      "Small business owner seeking professional services.",
      "New to the area and looking for local recommendations."
    ];

    // Get existing categories for projects
    const { data: categories } = await supabaseClient
      .from("categories")
      .select("id, name");

    if (!categories || categories.length === 0) {
      throw new Error("No categories found");
    }

    const results = {
      created: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < botsToGenerate; i++) {
      try {
        const isProvider = Math.random() < 0.4; // 40% providers, 60% clients
        const firstName = nzFirstNames[Math.floor(Math.random() * nzFirstNames.length)];
        const lastName = nzLastNames[Math.floor(Math.random() * nzLastNames.length)];
        const email = `bot_${Date.now()}_${i}@bluetika.local`;
        const city = nzCities[Math.floor(Math.random() * nzCities.length)];
        const bio = isProvider
          ? serviceBios[Math.floor(Math.random() * serviceBios.length)]
          : clientBios[Math.floor(Math.random() * clientBios.length)];

        // Create auth user
        const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
          email,
          password: `BotPass_${Date.now()}_${i}`,
          email_confirm: true
        });

        if (authError || !authData.user) {
          results.errors.push(`Auth creation failed for ${email}: ${authError?.message}`);
          continue;
        }

        // Update profile
        const { error: profileError } = await supabaseClient
          .from("profiles")
          .update({
            full_name: `${firstName} ${lastName}`,
            city,
            bio,
            is_service_provider: isProvider
          })
          .eq("id", authData.user.id);

        if (profileError) {
          results.errors.push(`Profile update failed: ${profileError.message}`);
          continue;
        }

        // Create bot account record
        const { error: botError } = await supabaseClient
          .from("bot_accounts")
          .insert({
            profile_id: authData.user.id,
            bot_type: isProvider ? "service_provider" : "client",
            is_active: true
          });

        if (botError) {
          results.errors.push(`Bot record creation failed: ${botError.message}`);
          continue;
        }

        results.created++;
      } catch (err) {
        results.errors.push(`Unexpected error: ${err.message}`);
      }
    }

    // Each bot posts 5-8 projects (changed from 1-3)
    const projectsPerBot = randomInRange(5, 8);
    
    // Each bot submits 1-2 bids (changed from 2-5)
    const bidsPerBot = randomInRange(1, 2);

    console.log(`Created ${results.created} bots with ${results.errors.length} errors`);

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