import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("💬 BOT-SEND-MESSAGES: Starting bot messaging");
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get active contracts
    const { data: contracts } = await supabaseClient
      .from("contracts")
      .select(`
        id,
        client_id,
        provider_id,
        status
      `)
      .eq("status", "active")
      .limit(10);

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active contracts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeMessages = [
      "Thanks for accepting! When can you start?",
      "I can start tomorrow morning if that works for you.",
      "Perfect! What time should I expect you?",
      "Around 9am would be great.",
      "Sounds good, looking forward to it!",
      "Great, see you then!",
      "Do you need any specific tools or materials?",
      "I have everything needed. Just need access to the site.",
      "Excellent! Let me know if you need anything.",
      "Will do, thanks!"
    ];

    const bypassMessages = [
      "Hey, easier to chat off platform. Email me at john.builder@gmail.com",
      "Sure! Or call me at 021-555-1234",
      "My WhatsApp is +64 21 555 9876 if you prefer",
      "You can text me: 027-123-4567",
      "I'm on Facebook too: John Smith Wellington",
      "Reach me at builder@mysite.co.nz or 0800-BUILDER",
      "My cell is 022-987-6543, easier than messaging here",
      "Let's take this offline, email: tradesman123@gmail.com"
    ];

    let messagesSent = 0;
    let messagesFlagged = 0;

    for (const contract of contracts) {
      // Check if both are bots
      const { data: clientBot } = await supabaseClient
        .from("bot_accounts")
        .select("profile_id")
        .eq("profile_id", contract.client_id)
        .maybeSingle();

      const { data: providerBot } = await supabaseClient
        .from("bot_accounts")
        .select("profile_id")
        .eq("profile_id", contract.provider_id)
        .maybeSingle();

      if (!clientBot || !providerBot) continue;

      // Send 3-5 messages per contract
      const numMessages = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numMessages; i++) {
        // 30% chance of bypass attempt
        const isBypassAttempt = Math.random() < 0.3;
        const message = isBypassAttempt 
          ? bypassMessages[Math.floor(Math.random() * bypassMessages.length)]
          : safeMessages[Math.floor(Math.random() * safeMessages.length)];
        
        // Alternate sender
        const senderId = i % 2 === 0 ? contract.client_id : contract.provider_id;

        await supabaseClient
          .from("contract_messages")
          .insert({
            contract_id: contract.id,
            sender_id: senderId,
            message: message
          });

        messagesSent++;
        if (isBypassAttempt) messagesFlagged++;
      }
    }

    console.log(`✅ BOT-SEND-MESSAGES: Sent ${messagesSent} messages (${messagesFlagged} bypass attempts)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: messagesSent,
        bypass_attempts: messagesFlagged
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("BOT-SEND-MESSAGES ERROR:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});