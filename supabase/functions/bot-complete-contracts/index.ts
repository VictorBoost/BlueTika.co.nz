import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.11.0";

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

    // Find active contracts without evidence photos (changed from 'accepted' to 'active')
    const { data: contracts } = await supabaseClient
      .from("contracts")
      .select(`
        id,
        client_id,
        provider_id,
        project_id,
        final_amount,
        projects(title)
      `)
      .eq("status", "active")
      .is("work_done_at", null)
      .limit(10);

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No contracts ready for completion", completed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = { completed: 0, errors: [] as string[] };

    for (const contract of contracts) {
      try {
        // Only proceed if provider is a bot
        const { data: providerBot } = await supabaseClient
          .from("bot_accounts")
          .select("profile_id")
          .eq("profile_id", contract.provider_id)
          .maybeSingle();

        if (!providerBot) continue;

        // Step 1: Upload mock "before" evidence photo
        const beforePhotoUrl = `https://picsum.photos/seed/${contract.id}-before/800/600`;
        await supabaseClient
          .from("evidence_photos")
          .insert({
            contract_id: contract.id,
            uploaded_by: contract.provider_id,
            photo_type: "before",
            photo_url: beforePhotoUrl,
            caption: "Work area before starting the project",
            is_confirmed: true
          });

        // Step 2: Upload mock "after" evidence photo
        const afterPhotoUrl = `https://picsum.photos/seed/${contract.id}-after/800/600`;
        await supabaseClient
          .from("evidence_photos")
          .insert({
            contract_id: contract.id,
            uploaded_by: contract.provider_id,
            photo_type: "after",
            photo_url: afterPhotoUrl,
            caption: "Project completed as agreed. All work done to specification.",
            is_confirmed: true
          });

        // Step 3: Mark work done - this triggers the escrow holding period
        const workDoneAt = new Date().toISOString();
        
        // Client has 48 hours from work_done_at to approve (aligned with platform settings)
        const { data: settings } = await supabaseClient
          .from("platform_settings")
          .select("setting_value")
          .eq("setting_key", "auto_release_window_seconds")
          .maybeSingle();
        
        const windowSeconds = parseInt(settings?.setting_value || "172800"); // Default 48 hours
        const clientApprovalDeadline = new Date(Date.now() + windowSeconds * 1000).toISOString();

        await supabaseClient
          .from("contracts")
          .update({
            work_done_at: workDoneAt,
            client_approval_deadline: clientApprovalDeadline,
            auto_release_eligible_at: clientApprovalDeadline,
            payment_status: "held",
            status: "awaiting_fund_release"
          })
          .eq("id", contract.id);

        // Step 4: Submit provider review (bots auto-review positively)
        await supabaseClient
          .from("reviews")
          .insert({
            contract_id: contract.id,
            client_id: contract.client_id,
            provider_id: contract.provider_id,
            reviewer_role: "provider",
            reviewee_role: "client",
            rating: 5,
            comment: "Great client to work with. Clear communication and prompt payment.",
            is_public: true
          });

        // Step 5: Check if client is also a bot, submit their review too
        const { data: clientBot } = await supabaseClient
          .from("bot_accounts")
          .select("profile_id")
          .eq("profile_id", contract.client_id)
          .maybeSingle();

        if (clientBot) {
          await supabaseClient
            .from("reviews")
            .insert({
              contract_id: contract.id,
              client_id: contract.client_id,
              provider_id: contract.provider_id,
              reviewer_role: "client",
              reviewee_role: "provider",
              rating: 5,
              comment: "Excellent service! Work completed exactly as promised.",
              is_public: true
            });

          // Set provider dispute deadline (5 working days from work_done)
          const now = new Date(workDoneAt);
          let daysAdded = 0;
          const deadline = new Date(now);

          while (daysAdded < 5) {
            deadline.setDate(deadline.getDate() + 1);
            const dayOfWeek = deadline.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              daysAdded++;
            }
          }

          await supabaseClient
            .from("contracts")
            .update({
              provider_dispute_deadline: deadline.toISOString(),
              ready_for_release_at: now.toISOString() // Will be eligible after 24h
            })
            .eq("id", contract.id);
        }

        // Step 6: Update contract status to awaiting_fund_release (matches real user flow)
        // This status is what the /muna/fund-releases panel filters for
        await supabaseClient
          .from("contracts")
          .update({
            status: "awaiting_fund_release"
          })
          .eq("id", contract.id);

        // Log bot activity
        await supabaseClient
          .from("bot_activity_logs")
          .insert({
            bot_id: contract.provider_id,
            action_type: "complete_work",
            details: { 
              contract_id: contract.id, 
              work_done_at: workDoneAt,
              client_dispute_deadline: clientApprovalDeadline
            }
          });

        results.completed++;
      } catch (err: any) {
        results.errors.push(`Contract ${contract.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, completed: results.completed, errors: results.errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});