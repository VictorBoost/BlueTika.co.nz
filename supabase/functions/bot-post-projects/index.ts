import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🚀 BOT-POST-PROJECTS: Function invoked");
  
  if (req.method === "OPTIONS") {
    console.log("⚪ BOT-POST-PROJECTS: OPTIONS request, returning CORS headers");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔧 BOT-POST-PROJECTS: Creating Supabase client");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    console.log("✅ BOT-POST-PROJECTS: Supabase client created");

    console.log("🔍 BOT-POST-PROJECTS: Fetching active client bots");
    const { data: clientBots, error: botsError } = await supabaseClient
      .from("bot_accounts")
      .select("profile_id, profiles!inner(full_name, city_region)")
      .eq("bot_type", "client")
      .eq("is_active", true);

    if (botsError) {
      console.error("❌ BOT-POST-PROJECTS: Error fetching bots:", botsError);
      throw botsError;
    }

    console.log(`✅ BOT-POST-PROJECTS: Found ${clientBots?.length || 0} active client bots`);

    if (!clientBots || clientBots.length === 0) {
      console.log("⚠️ BOT-POST-PROJECTS: No active client bots found");
      return new Response(
        JSON.stringify({ success: true, message: "No active client bots found", created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 BOT-POST-PROJECTS: Fetching categories");
    const { data: categories, error: catError } = await supabaseClient
      .from("categories")
      .select(`id, name, subcategories(id, name)`);

    if (catError) {
      console.error("❌ BOT-POST-PROJECTS: Error fetching categories:", catError);
      throw catError;
    }

    console.log(`✅ BOT-POST-PROJECTS: Found ${categories?.length || 0} categories`);

    if (!categories || categories.length === 0) {
      console.error("❌ BOT-POST-PROJECTS: No categories found in database");
      throw new Error("No categories found");
    }

    const projectTemplates = [
      {
        category: "Home Maintenance",
        projects: [
          {
            title: "Kitchen tap dripping - need plumber asap",
            description: "Hey, my kitchen tap has been dripping for about 2 weeks now and it's driving me nuts! Tried tightening it myself but no luck. Would really appreciate someone coming out this week if possible. I'm home most afternoons. Located in {city}. Cheers!",
            budget: [80, 150],
            urgency: "within_week"
          },
          {
            title: "Back deck needs sanding and oiling before summer",
            description: "Got a pretty big deck out back (roughly 30-35 square metres I reckon). It's looking pretty rough and winter didn't do it any favours. Want to get it sorted before the BBQ season kicks off! Happy to supply the oil if that helps with the price. Just need someone who knows what they're doing and won't leave a mess. Can do weekends or after 3pm weekdays.",
            budget: [400, 700],
            urgency: "flexible"
          },
          {
            title: "Storm damaged fence section - about 5 metres",
            description: "Bloody storm last week took out a section of my fence between me and the neighbour. About 5 metres worth. Some posts are still good I think but the panels are rooted. Neighbour's keen to go halves on it which is decent of him. Need someone to come have a look and give me a price. I'm in {city}, can send photos if that helps.",
            budget: [300, 600],
            urgency: "urgent"
          },
          {
            title: "Gutter cleaning - two storey house",
            description: "Gutters are absolutely packed with leaves and crud. Two storey house so I'm not keen on doing it myself at my age! Need someone with proper safety gear and a ladder that can handle it. While you're up there wouldn't mind if you could check the spouting is all good too. Located near the {city} CBD.",
            budget: [150, 250],
            urgency: "within_week"
          }
        ]
      },
      {
        category: "Gardening & Landscaping",
        projects: [
          {
            title: "Regular lawn mowing - fortnightly through summer",
            description: "Got a fairly big section and my mower just carked it. Rather than buying a new one I figured I'd get someone in to do it properly. Looking for someone reliable who can come every 2 weeks over summer. Lawn's maybe 200sqm? Also got some edges that need doing with a trimmer. I'm usually home on weekends if that suits. {city} area.",
            budget: [40, 70],
            urgency: "within_week"
          },
          {
            title: "Complete garden bed makeover - front yard",
            description: "Front garden is an absolute disaster zone. Previous owners clearly didn't give a toss about it. Looking to rip everything out, get some fresh soil in, and plant some nice natives that don't need too much maintenance. Maybe 6-8 square metres total? Would love some suggestions on what plants would work well. I'm hopeless with gardening so the more low-maintenance the better!",
            budget: [500, 900],
            urgency: "flexible"
          }
        ]
      },
      {
        category: "Cleaning",
        projects: [
          {
            title: "End of tenancy clean - need bond back!",
            description: "Moving out next Friday and the rental agreement says it needs to be professionally cleaned. 3 bedroom house, 1 bathroom, decent sized living area. Kitchen needs a good going over, oven's pretty gross if I'm honest. Carpets could probably do with a vacuum but that's included in normal cleaning right? Really need the bond back so want to make sure it's done properly. {city} location.",
            budget: [250, 400],
            urgency: "urgent"
          },
          {
            title: "Weekly house clean - 2 bed flat",
            description: "Both my partner and I work long hours and the flat's getting away on us. Looking for someone to come in once a week - maybe Wednesday or Thursday? Just general cleaning, bathrooms, kitchen, vacuum, that sort of thing. We're pretty tidy people so shouldn't be too much work. Would prefer the same person each week if possible. Must be reliable!",
            budget: [80, 120],
            urgency: "within_week"
          }
        ]
      },
      {
        category: "Moving & Delivery",
        projects: [
          {
            title: "House move help - same suburb",
            description: "Moving house in 2 weeks, just across {city} to a new rental. Got a truck sorted but could really do with an extra set of hands (or two?) for loading and unloading. Mainly furniture and boxes. It's a 2 bedroom place, no piano or anything crazy heavy. Probably 3-4 hours work total? Will provide lunch and drinks! Cheers.",
            budget: [150, 250],
            urgency: "within_week"
          }
        ]
      },
      {
        category: "Handyman Services",
        projects: [
          {
            title: "Bunch of odd jobs around the house",
            description: "Got a growing list of little jobs that keep getting pushed to the bottom of the to-do list. Nothing huge but they're starting to add up: squeaky door, wobbly bannister, couple of loose tiles, tap that's a bit stiff, shelf that needs mounting. Would love someone to just come and smash through them all in one go. Got all the parts and screws and stuff, just need someone who actually knows what they're doing! {city}.",
            budget: [150, 300],
            urgency: "flexible"
          }
        ]
      }
    ];

    const results = {
      created: 0,
      errors: [] as string[]
    };

    console.log(`🎯 BOT-POST-PROJECTS: Starting to create projects for ${clientBots.length} bots`);

    for (const bot of clientBots) {
      const numProjects = Math.floor(Math.random() * 4) + 5;
      console.log(`\n👤 BOT-POST-PROJECTS: Processing bot ${bot.profile_id} - will create ${numProjects} projects`);
      
      for (let i = 0; i < numProjects; i++) {
        try {
          const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
          const project = template.projects[Math.floor(Math.random() * template.projects.length)];
          
          const title = project.title;
          const city = (bot.profiles as any)?.city_region || "Auckland";
          const description = project.description.replace("{city}", city);
          
          console.log(`  📝 BOT-POST-PROJECTS: Creating project "${title}" for bot ${bot.profile_id}`);
          
          const category = categories.find(c => c.name === template.category);
          if (!category) {
            console.warn(`  ⚠️ BOT-POST-PROJECTS: Category "${template.category}" not found, skipping`);
            continue;
          }

          // Generate project details
          const title = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
          const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
          
          // Calculate realistic budget (40-60% lower than original high estimates)
          const baseBudget = Math.floor(Math.random() * 1500) + 500; // Base: $500-$2000
          const reductionFactor = 0.4 + Math.random() * 0.2; // 40-60% reduction
          const budget = Math.floor(baseBudget * (1 - reductionFactor)); // Final realistic budget
          
          const description = `Looking for a professional to help with ${title.toLowerCase()}. Quality work required. Please provide your best quote.`;
          
          // Insert project
          const { data: project, error: projectError } = await supabaseAdmin
            .from("projects")
            .insert({
              title,
              description,
              budget,
              category_id: categoryId,
              location: locations[Math.floor(Math.random() * locations.length)],
              user_id: botId,
              status: "open",
              is_bot: true
            })
            .select()
            .single();

          if (projectError) {
            console.error(`  ❌ BOT-POST-PROJECTS: Failed to create project:`, projectError);
            results.errors.push(`Project creation failed: ${projectError.message}`);
            continue;
          }

          console.log(`  ✅ BOT-POST-PROJECTS: Project created successfully! ID: ${newProject.id}`);

          await supabaseClient
            .from("bot_activity_logs")
            .insert({
              bot_id: bot.profile_id,
              action_type: "post_project",
              details: { project_id: newProject.id, project_title: title }
            });

          results.created++;
          console.log(`  📊 BOT-POST-PROJECTS: Total projects created so far: ${results.created}`);
        } catch (err: any) {
          console.error(`  ❌ BOT-POST-PROJECTS: Exception creating project:`, err);
          results.errors.push(`Error creating project: ${err.message}`);
        }
      }
    }

    console.log(`\n🎉 BOT-POST-PROJECTS: COMPLETE! Created ${results.created} projects with ${results.errors.length} errors`);
    if (results.errors.length > 0) {
      console.log("❌ BOT-POST-PROJECTS: Errors encountered:", results.errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: results.created,
        errors: results.errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("💥 BOT-POST-PROJECTS: FATAL ERROR:", error);
    console.error("💥 BOT-POST-PROJECTS: Error message:", error.message);
    console.error("💥 BOT-POST-PROJECTS: Error stack:", error.stack);
    return new Response(
      JSON.stringify({ success: false, error: error.message, created: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});