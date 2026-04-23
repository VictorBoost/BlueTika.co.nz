import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MonalisaSettings = Database["public"]["Tables"]["monalisa_settings"]["Row"];
type MonalisaLog = Database["public"]["Tables"]["monalisa_logs"]["Row"];

export const monalisaService = {
  /**
   * Get MonaLisa status
   */
  async getStatus(): Promise<MonalisaSettings | null> {
    try {
      const { data, error } = await supabase
        .from("monalisa_settings")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching MonaLisa status:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching MonaLisa status:", error);
      return null;
    }
  },

  /**
   * Toggle MonaLisa on/off (owner only)
   */
  async toggleMonaLisa(isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("monalisa_settings")
        .upsert({
          id: "00000000-0000-0000-0000-000000000000",
          is_active: isActive,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "id"
        });

      if (error) {
        console.error("Error toggling MonaLisa:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error toggling MonaLisa:", error);
      return false;
    }
  },

  /**
   * Get recent MonaLisa logs with pagination
   */
  async getLogs(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: MonalisaLog[]; total: number }> {
    const { data, error, count } = await supabase
      .from("monalisa_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching MonaLisa logs:", error);
      return { logs: [], total: 0 };
    }

    return { logs: data || [], total: count || 0 };
  },

  /**
   * Get logs by action type
   */
  async getLogsByType(
    actionType: "post_review" | "contract_review" | "user_flag" | "system_health" | "suggestion"
  ): Promise<MonalisaLog[]> {
    const { data, error } = await supabase
      .from("monalisa_logs")
      .select("*")
      .eq("action_type", actionType)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching logs by type:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get logs by severity
   */
  async getLogsBySeverity(
    severity: "info" | "warning" | "critical"
  ): Promise<MonalisaLog[]> {
    const { data, error } = await supabase
      .from("monalisa_logs")
      .select("*")
      .eq("severity", severity)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching logs by severity:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Trigger manual MonaLisa check
   */
  async triggerManualCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke("monalisa-agent");

      if (error) {
        console.error("Error invoking MonaLisa:", error);
        return false;
      }

      console.log("MonaLisa check result:", data);
      return true;
    } catch (error) {
      console.error("Error triggering MonaLisa check:", error);
      return false;
    }
  },

  /**
   * Get MonaLisa statistics
   */
  async getStatistics(): Promise<{
    totalLogs: number;
    criticalIssues: number;
    warningsToday: number;
    lastCheckAt: string | null;
  }> {
    const status = await this.getStatus();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: totalLogs } = await supabase
      .from("monalisa_logs")
      .select("id", { count: "exact", head: true });

    const { count: criticalIssues } = await supabase
      .from("monalisa_logs")
      .select("id", { count: "exact", head: true })
      .eq("severity", "critical")
      .is("related_user_id", null); // Only unresolved issues

    const { count: warningsToday } = await supabase
      .from("monalisa_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    return {
      totalLogs: totalLogs || 0,
      criticalIssues: criticalIssues || 0,
      warningsToday: warningsToday || 0,
      lastCheckAt: status?.last_check_at || null,
    };
  },

  /**
   * Generate weekly summary data for MonaLisa report
   */
  async generateWeeklySummary(): Promise<{
    weekStartDate: string;
    weekEndDate: string;
    botStats: any;
    issues: any;
    suggestions: any;
    systemHealth: any;
  } | null> {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekStartStr = weekStart.toISOString();
      const weekEndStr = now.toISOString();

      // Get bot statistics
      const { count: totalBots } = await supabase
        .from("bot_accounts")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: newBotsThisWeek } = await supabase
        .from("bot_accounts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStartStr);

      // Get bot activity from logs
      const { data: activityLogs } = await supabase
        .from("bot_activity_logs")
        .select("action_type")
        .gte("created_at", weekStartStr)
        .lte("created_at", weekEndStr);

      const projectsPosted = activityLogs?.filter(log => log.action_type === "post_project").length || 0;
      const bidsSubmitted = activityLogs?.filter(log => log.action_type === "submit_bid").length || 0;
      const contractsCreated = activityLogs?.filter(log => log.action_type === "accept_bid").length || 0;
      const paymentsProcessed = activityLogs?.filter(log => log.action_type === "complete_payment").length || 0;

      // Get MonaLisa logs for issues
      const { data: logs } = await supabase
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

      // Generate AI suggestions based on patterns
      const suggestions = this.generateSuggestions(logs || [], activityLogs || []);

      // Calculate system health
      const totalLogs = logs?.length || 1;
      const errorLogs = logs?.filter(log => log.severity !== "info").length || 0;
      const errorRate = (errorLogs / totalLogs) * 100;
      const overallScore = Math.max(0, Math.min(100, 100 - errorRate));

      const uptimeMinutes = 7 * 24 * 60; // 1 week
      const uptimeHours = Math.floor(uptimeMinutes / 60);
      const uptime = `${Math.floor(uptimeHours / 24)}d ${uptimeHours % 24}h`;

      return {
        weekStartDate: weekStart.toISOString().split('T')[0],
        weekEndDate: now.toISOString().split('T')[0],
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
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      return null;
    }
  },

  /**
   * Generate AI suggestions based on log patterns
   */
  generateSuggestions(logs: any[], activityLogs: any[]): Array<{ priority: string; suggestion: string }> {
    const suggestions: Array<{ priority: string; suggestion: string }> = [];

    // Check for high error rates
    const errorRate = logs.filter(log => log.severity === "critical").length / (logs.length || 1);
    if (errorRate > 0.1) {
      suggestions.push({
        priority: "high",
        suggestion: "Critical error rate exceeds 10%. Review bot automation settings and consider temporarily pausing bot payments until issues are resolved."
      });
    }

    // Check for low bot activity
    const projectCount = activityLogs.filter(log => log.action_type === "post_project").length;
    if (projectCount < 20) {
      suggestions.push({
        priority: "medium",
        suggestion: `Only ${projectCount} projects posted this week. Consider increasing bot generation frequency or adjusting project posting parameters.`
      });
    }

    // Check for payment issues
    const paymentErrors = logs.filter(log => 
      log.action_type === "complete_payment" && log.severity === "critical"
    ).length;
    if (paymentErrors > 5) {
      suggestions.push({
        priority: "high",
        suggestion: `${paymentErrors} payment failures detected. Review Stripe integration and bot payment settings. Consider toggling off bot payments temporarily.`
      });
    }

    // Check for content safety issues
    const contentSafetyIssues = logs.filter(log => 
      log.action_type?.includes("content") || log.action_type?.includes("safety")
    ).length;
    if (contentSafetyIssues > 10) {
      suggestions.push({
        priority: "medium",
        suggestion: `${contentSafetyIssues} content safety flags detected. Review bot-generated content templates to ensure compliance with platform guidelines.`
      });
    }

    // Positive feedback if no major issues
    if (suggestions.length === 0) {
      suggestions.push({
        priority: "low",
        suggestion: "Bot automation is running smoothly. System health is optimal. Continue monitoring for sustained performance."
      });
    }

    return suggestions.slice(0, 5); // Max 5 suggestions
  },

  /**
   * Send weekly summary email to admin
   */
  async sendWeeklySummary(): Promise<boolean> {
    try {
      const summary = await this.generateWeeklySummary();
      if (!summary) {
        console.error("Failed to generate weekly summary");
        return false;
      }

      const { sesEmailService } = await import("@/services/sesEmailService");
      const success = await sesEmailService.sendMonalisaWeeklySummary(
        "bluetikanz@gmail.com",
        summary.weekStartDate,
        summary.weekEndDate,
        summary
      );

      if (success) {
        // Log the summary send
        await supabase.from("monalisa_logs").insert({
          action_type: "weekly_summary",
          severity: "info",
          details: `Weekly summary sent for ${summary.weekStartDate} - ${summary.weekEndDate}`
        });
      }

      return success;
    } catch (error) {
      console.error("Error sending weekly summary:", error);
      return false;
    }
  }
};