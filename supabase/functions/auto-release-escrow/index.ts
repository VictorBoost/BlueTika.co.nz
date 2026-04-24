import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log("Escrow flagging job started at:", new Date().toISOString());

    // Get auto-release window from settings (default 10 seconds for testing, 172800 for 48 hours production)
    const { data: settingsData } = await supabaseClient
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "auto_release_window_seconds")
      .maybeSingle();

    const windowSeconds = parseInt(settingsData?.setting_value || "10");
    console.log("Review window:", windowSeconds, "seconds");

    // Find all contracts that need manual review (past deadline, still held)
    const now = new Date();
    const { data: needsReviewContracts, error: fetchError } = await supabaseClient
      .from("contracts")
      .select(`
        id,
        provider_id,
        client_id,
        auto_release_eligible_at,
        project:projects(title)
      `)
      .eq("payment_status", "held")
      .eq("escrow_needs_review", false)
      .not("auto_release_eligible_at", "is", null)
      .lte("auto_release_eligible_at", now.toISOString());

    if (fetchError) {
      console.error("Error fetching contracts:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${needsReviewContracts?.length || 0} contracts needing manual review`);

    let flaggedCount = 0;
    const errors: any[] = [];

    for (const contract of needsReviewContracts || []) {
      try {
        console.log(`Flagging contract ${contract.id} for manual review`);

        // Flag contract as needing review (don't auto-release)
        const { error: updateError } = await supabaseClient
          .from("contracts")
          .update({
            escrow_needs_review: true,
          })
          .eq("id", contract.id);

        if (updateError) {
          console.error(`Failed to flag contract ${contract.id}:`, updateError);
          errors.push({ contractId: contract.id, error: updateError });
          continue;
        }

        // Create notification for admin (sam@bluetika.co.nz)
        const { data: adminProfile } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", "sam@bluetika.co.nz")
          .single();

        if (adminProfile) {
          await supabaseClient.from("notifications").insert({
            user_id: adminProfile.id,
            title: "Payment Needs Review",
            message: `Contract "${contract.project?.title}" has been held for ${Math.floor(windowSeconds / 3600)} hours. Client has not approved. Manual review required.`,
            type: "payment",
            related_contract_id: contract.id,
          });
        }

        // Create notification for provider
        await supabaseClient.from("notifications").insert({
          user_id: contract.provider_id,
          title: "Payment Under Review",
          message: `Payment for "${contract.project?.title}" is being reviewed by admin. You'll be notified once approved.`,
          type: "payment",
          related_contract_id: contract.id,
        });

        flaggedCount++;
        console.log(`✅ Successfully flagged contract ${contract.id} for review`);
      } catch (error) {
        console.error(`Error processing contract ${contract.id}:`, error);
        errors.push({ contractId: contract.id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        flaggedCount,
        eligibleCount: needsReviewContracts?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
        windowSeconds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Escrow flagging job error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});