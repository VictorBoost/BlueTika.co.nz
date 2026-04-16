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

    // Get active client bots without projects in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: clientBots } = await supabaseClient
      .from("bot_accounts")
      .select("profile_id, profiles!inner(full_name, city)")
      .eq("bot_type", "client")
      .eq("is_active", true);

    if (!clientBots || clientBots.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active client bots found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get categories and subcategories
    const { data: categories } = await supabaseClient
      .from("categories")
      .select(`
        id,
        name,
        subcategories(id, name)
      `);

    if (!categories || categories.length === 0) {
      throw new Error("No categories found");
    }

    const projectTemplates = [
      {
        category: "Home Maintenance",
        titles: [
          "Leaking tap needs fixing",
          "Deck maintenance and oiling",
          "Fence repair needed",
          "Gutters need cleaning",
          "Interior painting required"
        ],
        descriptions: [
          "Kitchen tap has been dripping for weeks. Need it fixed ASAP to save on water bills.",
          "Back deck needs sanding and oil treatment before summer. About 30 square metres.",
          "Storm damaged a section of fence. About 5 metres needs replacing or repair.",
          "Gutters full of leaves and debris. Two-story house, need professional with safety gear.",
          "Three bedrooms need repainting. Walls and ceilings. Prep work included."
        ]
      },
      {
        category: "Gardening & Landscaping",
        titles: [
          "Lawn mowing service needed",
          "Garden bed overhaul",
          "Tree trimming required",
          "Hedge trimming and shaping",
          "Basic garden maintenance"
        ],
        descriptions: [
          "Large lawn needs regular mowing. Looking for fortnightly service over summer.",
          "Front garden beds need complete redo. Remove old plants, add new soil, plant natives.",
          "Large tree overhanging driveway needs professional trimming for safety.",
          "Hedge along front fence needs trimming and shaping. About 15 metres long.",
          "Regular garden maintenance needed. Weeding, pruning, general tidying."
        ]
      },
      {
        category: "Cleaning",
        titles: [
          "End of tenancy clean",
          "Regular house cleaning",
          "Deep clean needed",
          "Window cleaning required",
          "Carpet steam cleaning"
        ],
        descriptions: [
          "Moving out next week. Need full house clean to get bond back. 3 bedroom house.",
          "Looking for reliable cleaner for weekly house clean. 2 bedroom flat.",
          "Spring clean needed! Haven't done a proper deep clean in months. Help!",
          "All windows inside and out need cleaning. Two story house, about 20 windows.",
          "Carpets in lounge and bedrooms need steam cleaning. About 60 square metres."
        ]
      },
      {
        category: "Moving & Delivery",
        titles: [
          "House move assistance",
          "Furniture delivery help",
          "Rubbish removal needed",
          "Small item delivery",
          "Moving heavy items"
        ],
        descriptions: [
          "Moving to new house across town. Need help loading and unloading truck.",
          "Bought new couch, needs picking up from store and delivering to home.",
          "Garage full of junk needs removing and taking to dump. One trailer load.",
          "Need someone to pick up marketplace purchases and deliver to my place.",
          "Piano needs moving to upstairs bedroom. Need professionals with right equipment."
        ]
      },
      {
        category: "Handyman Services",
        titles: [
          "Various odd jobs",
          "Flatpack furniture assembly",
          "Door lock replacement",
          "Shelf installation",
          "General repairs needed"
        ],
        descriptions: [
          "Got a list of small jobs around the house. Keen for someone to knock them all out in one go.",
          "Four pieces of flatpack furniture need assembling. IKEA Billy bookcases and desk.",
          "Front door lock is playing up. Need it replaced with a good quality lock.",
          "Want floating shelves installed in living room. Got the brackets, need expert installation.",
          "Various small repairs: squeaky door, loose tap, cracked tile, wobbly bannister."
        ]
      },
      {
        category: "Pet Care",
        titles: [
          "Dog walking service",
          "Pet sitting while away",
          "Daily cat feeding",
          "Dog grooming needed",
          "Pet care during holidays"
        ],
        descriptions: [
          "Need reliable dog walker for weekday walks. Labrador, friendly but energetic!",
          "Going away for two weeks. Need someone to stay at house and look after our cat.",
          "Work long hours. Need someone to feed cat and spend some time with her daily.",
          "Dog needs grooming - wash, brush, nail trim. Medium-sized mixed breed.",
          "Summer holiday coming up. Need trustworthy person to look after our pets."
        ]
      },
      {
        category: "Tutoring",
        titles: [
          "Maths tutoring needed",
          "NCEA English help",
          "Guitar lessons wanted",
          "Science tutoring required",
          "Reading assistance"
        ],
        descriptions: [
          "Year 10 student struggling with algebra. Need patient tutor for weekly sessions.",
          "NCEA Level 2 English support needed. Essay writing and text analysis help.",
          "Complete beginner wants to learn guitar. Looking for patient teacher.",
          "Year 11 student needs help with physics and chemistry. Exam prep focus.",
          "Child in Year 3 needs reading support. Friendly, encouraging tutor preferred."
        ]
      },
      {
        category: "Event Help",
        titles: [
          "Party setup help",
          "Event cleanup needed",
          "BBQ chef for party",
          "Waitstaff for function",
          "Photographer for event"
        ],
        descriptions: [
          "Birthday party this Saturday. Need help setting up marquee, tables, chairs.",
          "After party cleanup needed. About 50 guests, will need good 2-3 hours work.",
          "Hosting BBQ for 30 people. Looking for experienced BBQ chef to handle cooking.",
          "Cocktail party needs 2-3 waitstaff for serving drinks and canapes.",
          "Family reunion needs photographer. Casual outdoor event, about 3 hours coverage."
        ]
      }
    ];

    const results = {
      created: 0,
      errors: [] as string[]
    };

    // Each bot posts 1-2 projects
    for (const bot of clientBots) {
      const numProjects = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numProjects; i++) {
        try {
          const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
          const titleIndex = Math.floor(Math.random() * template.titles.length);
          const title = template.titles[titleIndex];
          const description = template.descriptions[titleIndex];
          
          const category = categories.find(c => c.name === template.category);
          if (!category) continue;

          const budget = Math.floor(Math.random() * 450) + 50; // $50-$500
          const urgency = ["flexible", "within_week", "urgent"][Math.floor(Math.random() * 3)];

          const { error: projectError } = await supabaseClient
            .from("projects")
            .insert({
              title,
              description,
              category_id: category.id,
              budget,
              urgency,
              client_id: bot.profile_id,
              status: "open"
            });

          if (projectError) {
            results.errors.push(`Project creation failed: ${projectError.message}`);
            continue;
          }

          // Log activity
          await supabaseClient
            .from("bot_activity_logs")
            .insert({
              bot_id: bot.profile_id,
              action_type: "project_posted",
              details: { project_title: title }
            });

          results.created++;
        } catch (err) {
          results.errors.push(`Error creating project: ${err.message}`);
        }
      }
    }

    console.log(`Created ${results.created} projects with ${results.errors.length} errors`);

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