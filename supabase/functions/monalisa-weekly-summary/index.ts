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

    console.log("MonaLisa Weekly Summary: Starting generation...");

    // Check if MonaLisa is active
    const { data: setting, error: settingError } = await supabaseClient
      .from("monalisa_settings")
      .select("is_active")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (settingError || !setting || !setting.is_active) {
      console.log("MonaLisa is not active, skipping summary");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "MonaLisa is not active, summary skipped" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate date range (last 7 days)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartStr = weekStart.toISOString();
    const weekEndStr = now.toISOString();
    const weekStartDate = weekStart.toISOString().split('T')[0];
    const weekEndDate = now.toISOString().split('T')[0];

    // Get bot statistics
    const { count: totalBots } = await supabaseClient
      .from("bot_accounts")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: newBotsThisWeek } = await supabaseClient
      .from("bot_accounts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStartStr);

    // Get bot activity from logs
    const { data: activityLogs } = await supabaseClient
      .from("bot_activity_logs")
      .select("action_type")
      .gte("created_at", weekStartStr)
      .lte("created_at", weekEndStr);

    const projectsPosted = activityLogs?.filter(log => log.action_type === "post_project").length || 0;
    const bidsSubmitted = activityLogs?.filter(log => log.action_type === "submit_bid").length || 0;
    const contractsCreated = activityLogs?.filter(log => log.action_type === "accept_bid").length || 0;
    const paymentsProcessed = activityLogs?.filter(log => log.action_type === "complete_payment").length || 0;

    // Get MonaLisa logs for issues
    const { data: logs } = await supabaseClient
      .from("monalisa_logs")
      .select("*")
      .gte("created_at", weekStartStr)
      .lte("created_at", weekEndStr);

    const criticalIssues = logs?.filter(log => log.severity === "critical").length || 0;
    const warnings = logs?.filter(log => log.severity === "warning").length || 0;

    // Aggregate top issues
    const issueMap: Record<string, { count: number; description: string }> = {};
    logs?.forEach(log => {
      if (log.action_type && log.severity !== "info") {
        const key = log.action_type;
        if (!issueMap[key]) {
          issueMap[key] = { count: 0, description: log.details || "No description" };
        }
        issueMap[key].count++;
      }
    });

    const topIssues = Object.entries(issueMap)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate AI suggestions
    const suggestions = generateSuggestions(logs || [], activityLogs || []);

    // Calculate system health
    const totalLogs = logs?.length || 1;
    const errorLogs = logs?.filter(log => log.severity !== "info").length || 0;
    const errorRate = (errorLogs / totalLogs) * 100;
    const overallScore = Math.max(0, Math.min(100, 100 - errorRate));

    const uptimeMinutes = 7 * 24 * 60;
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptime = `${Math.floor(uptimeHours / 24)}d ${uptimeHours % 24}h`;

    const summary = {
      weekStartDate,
      weekEndDate,
      botStats: {
        totalBots: totalBots || 0,
        newBotsThisWeek: newBotsThisWeek || 0,
        activeBots: totalBots || 0,
        projectsPosted,
        bidsSubmitted,
        contractsCreated,
        paymentsProcessed
      },
      issues: {
        critical: criticalIssues,
        warnings,
        topIssues
      },
      suggestions,
      systemHealth: {
        overallScore: Math.round(overallScore),
        uptime,
        errorRate
      }
    };

    // Send email via external API
    const emailResponse = await fetch(`${Deno.env.get("NEXT_PUBLIC_SITE_URL")}/api/send-monalisa-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(summary)
    });

    const emailSuccess = emailResponse.ok;

    // Log the summary send
    await supabaseClient.from("monalisa_logs").insert({
      action_type: "weekly_summary",
      severity: "info",
      details: `Weekly summary ${emailSuccess ? 'sent' : 'failed'} for ${weekStartDate} - ${weekEndDate}`
    });

    console.log("MonaLisa Weekly Summary: Complete", { emailSuccess });

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        emailSent: emailSuccess
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("MonaLisa Weekly Summary Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function generateSuggestions(logs: any[], activityLogs: any[]): Array<{ priority: string; suggestion: string }> {
  const suggestions: Array<{ priority: string; suggestion: string }> = [];

  const errorRate = logs.filter(log => log.severity === "critical").length / (logs.length || 1);
  if (errorRate > 0.1) {
    suggestions.push({
      priority: "high",
      suggestion: "Critical error rate exceeds 10%. Review bot automation settings and consider temporarily pausing bot payments until issues are resolved."
    });
  }

  const projectCount = activityLogs.filter(log => log.action_type === "post_project").length;
  if (projectCount < 20) {
    suggestions.push({
      priority: "medium",
      suggestion: `Only ${projectCount} projects posted this week. Consider increasing bot generation frequency or adjusting project posting parameters.`
    });
  }

  const paymentErrors = logs.filter(log => 
    log.action_type === "complete_payment" && log.severity === "critical"
  ).length;
  if (paymentErrors > 5) {
    suggestions.push({
      priority: "high",
      suggestion: `${paymentErrors} payment failures detected. Review Stripe integration and bot payment settings. Consider toggling off bot payments temporarily.`
    });
  }

  const contentSafetyIssues = logs.filter(log => 
    log.action_type?.includes("content") || log.action_type?.includes("safety")
  ).length;
  if (contentSafetyIssues > 10) {
    suggestions.push({
      priority: "medium",
      suggestion: `${contentSafetyIssues} content safety flags detected. Review bot-generated content templates to ensure compliance with platform guidelines.`
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      priority: "low",
      suggestion: "Bot automation is running smoothly. System health is optimal. Continue monitoring for sustained performance."
    });
  }

  return suggestions.slice(0, 5);
}