import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("⏰ HOURLY-BOT-CYCLE: Starting automated hourly cycle");
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const results = {
      projects: 0,
      messages: 0,
      bids: 0,
      contracts: 0,
      completed: 0,
      errors: [] as string[]
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Step 1: Post Projects (2-5 seconds delay)
    console.log("📝 Step 1: Posting projects...");
    try {
      await delay(2000);
      const response = await fetch(`${supabaseUrl}/functions/v1/bot-post-projects`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      results.projects = data.created || 0;
      console.log(`✅ Posted ${results.projects} projects`);
    } catch (err: any) {
      console.error("❌ Project posting failed:", err);
      results.errors.push(`Projects: ${err.message}`);
    }

    // Step 2: Send Messages (3-5 seconds delay)
    console.log("💬 Step 2: Sending messages...");
    try {
      await delay(3000);
      const response = await fetch(`${supabaseUrl}/functions/v1/bot-send-messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      results.messages = data.sent || 0;
      console.log(`✅ Sent ${results.messages} messages`);
    } catch (err: any) {
      console.error("❌ Messaging failed:", err);
      results.errors.push(`Messages: ${err.message}`);
    }

    // Step 3: Submit Bids (5-8 seconds delay)
    console.log("💰 Step 3: Submitting bids...");
    try {
      await delay(5000);
      const response = await fetch(`${supabaseUrl}/functions/v1/bot-submit-bids`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      results.bids = data.created || 0;
      console.log(`✅ Submitted ${results.bids} bids`);
    } catch (err: any) {
      console.error("❌ Bid submission failed:", err);
      results.errors.push(`Bids: ${err.message}`);
    }

    // Step 4: Accept Bids (8-10 seconds delay)
    console.log("📋 Step 4: Accepting bids...");
    try {
      await delay(8000);
      const response = await fetch(`${supabaseUrl}/functions/v1/bot-accept-bids`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      results.contracts = data.accepted || 0;
      console.log(`✅ Created ${results.contracts} contracts`);
    } catch (err: any) {
      console.error("❌ Contract creation failed:", err);
      results.errors.push(`Contracts: ${err.message}`);
    }

    // Step 5: Complete Work (10-15 seconds delay)
    console.log("✅ Step 5: Completing work...");
    try {
      await delay(10000);
      const response = await fetch(`${supabaseUrl}/functions/v1/bot-complete-contracts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      results.completed = data.completed || 0;
      console.log(`✅ Completed ${results.completed} contracts`);
    } catch (err: any) {
      console.error("❌ Work completion failed:", err);
      results.errors.push(`Completion: ${err.message}`);
    }

    const summary = `
🤖 HOURLY BOT CYCLE COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Projects Posted: ${results.projects}
💬 Messages Sent: ${results.messages}
💰 Bids Submitted: ${results.bids}
📋 Contracts Created: ${results.contracts}
✅ Work Completed: ${results.completed}
${results.errors.length > 0 ? `❌ Errors: ${results.errors.length}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━
Timestamp: ${new Date().toISOString()}
    `;

    console.log(summary);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("💥 HOURLY-BOT-CYCLE FATAL ERROR:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});