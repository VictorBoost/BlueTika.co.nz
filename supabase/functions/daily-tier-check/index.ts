import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // Get all providers with contracts
    const { data: providers, error: providersError } = await supabase
      .from("contracts")
      .select("provider_id")
      .eq("status", "completed");

    if (providersError) throw providersError;

    const uniqueProviders = [...new Set(providers?.map((p) => p.provider_id) || [])];

    let updated = 0;
    let warningsSent = 0;

    for (const providerId of uniqueProviders) {
      // Calculate current 60-day sales
      const { data: sales, error: salesError } = await supabase.rpc(
        "calculate_provider_60day_sales",
        { provider_uuid: providerId }
      );

      if (salesError) {
        console.error(`Error calculating sales for ${providerId}:`, salesError);
        continue;
      }

      const currentSales = Number(sales) || 0;

      // Get current tier and settings
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_tier")
        .eq("id", providerId)
        .single();

      const { data: tiers } = await supabase
        .from("commission_tiers")
        .select("*")
        .order("tier_order", { ascending: true });

      const { data: settings } = await supabase
        .from("commission_settings")
        .select("*")
        .single();

      if (!tiers || !settings) continue;

      // Find new tier based on sales
      const newTier =
        [...tiers]
          .reverse()
          .find(
            (t) =>
              currentSales >= t.min_sales &&
              (t.max_sales === null || currentSales <= t.max_sales)
          ) || tiers[0];

      const oldTier = profile?.current_tier;

      // Check if tier would drop
      if (oldTier && newTier.tier_name !== oldTier) {
        const oldTierData = tiers.find((t) => t.tier_name === oldTier);
        
        if (oldTierData && newTier.tier_order < oldTierData.tier_order) {
          // Tier is dropping - check if warning needed
          const { data: existingWarning } = await supabase
            .from("tier_drop_warnings")
            .select("*")
            .eq("provider_id", providerId)
            .eq("current_tier", oldTier)
            .is("tier_dropped_at", null)
            .order("warning_sent_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!existingWarning) {
            // Send warning email
            const { data: providerProfile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", providerId)
              .single();

            if (providerProfile?.email) {
              await supabase.functions.invoke("send-tier-warning-email", {
                body: {
                  email: providerProfile.email,
                  name: providerProfile.full_name || "Provider",
                  currentTier: oldTierData.display_name,
                  newTier: newTier.display_name,
                  currentSales: currentSales,
                  requiredSales: oldTierData.min_sales,
                  daysLeft: settings.warning_days,
                },
              });

              // Record warning
              await supabase.from("tier_drop_warnings").insert({
                provider_id: providerId,
                current_tier: oldTier,
                projected_tier: newTier.tier_name,
                current_sales: currentSales,
              });

              warningsSent++;
            }
          }
        }
      }

      // Update tier
      const { error: updateError } = await supabase.rpc("update_provider_tier", {
        provider_uuid: providerId,
      });

      if (!updateError) {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        providersChecked: uniqueProviders.length,
        tiersUpdated: updated,
        warningsSent: warningsSent,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Daily tier check error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});