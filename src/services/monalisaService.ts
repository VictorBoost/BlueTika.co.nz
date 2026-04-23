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
};