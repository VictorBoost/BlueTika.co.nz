import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

export interface ReportStats {
  totalReports: number;
  openReports: number;
  resolvedReports: number;
}

export interface UserReportHistory {
  asReporter: Report[];
  asReported: Report[];
}

export interface ReporterAnalytics {
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  total_reports: number;
  actioned_reports: number;
  dismissed_reports: number;
  pending_reports: number;
  accuracy_rate: number;
  flagged_for_review: boolean;
}

export interface ReportDetails extends Report {
  reporter: { id: string; full_name: string | null; email: string | null };
  reported_user: { id: string; full_name: string | null; email: string | null } | null;
  reported_project: { id: string; title: string } | null;
  resolved_by_user: { id: string; full_name: string | null } | null;
}

/**
 * Create a new report
 */
export async function createReport(data: {
  reportedUserId?: string;
  reportedProjectId?: string;
  reason: "spam" | "fake" | "other";
  note?: string;
}) {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) {
    throw new Error("Must be logged in to submit a report");
  }

  const reportData: ReportInsert = {
    reporter_id: session.session.user.id,
    reported_user_id: data.reportedUserId || null,
    reported_project_id: data.reportedProjectId || null,
    reason: data.reason,
    note: data.note || null,
  };

  const { data: report, error } = await supabase
    .from("reports")
    .insert(reportData)
    .select()
    .single();

  if (error) throw error;
  return report;
}

/**
 * Get all reports (admin only)
 */
export async function getAllReports() {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, full_name, email),
      reported_user:profiles!reports_reported_user_id_fkey(id, full_name, email),
      reported_project:projects(id, title),
      resolved_by_user:profiles!reports_resolved_by_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get reports by status
 */
export async function getReportsByStatus(status: "open" | "resolved") {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, full_name, email),
      reported_user:profiles!reports_reported_user_id_fkey(id, full_name, email),
      reported_project:projects(id, title),
      resolved_by_user:profiles!reports_resolved_by_fkey(id, full_name)
    `)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user's report history (as reporter and as reported party)
 */
export async function getUserReportHistory(userId: string): Promise<UserReportHistory> {
  const [asReporterResult, asReportedResult] = await Promise.all([
    supabase
      .from("reports")
      .select(`
        *,
        reported_user:profiles!reports_reported_user_id_fkey(id, full_name, email),
        reported_project:projects(id, title)
      `)
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(id, full_name, email),
        reported_project:projects(id, title)
      `)
      .eq("reported_user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (asReporterResult.error) throw asReporterResult.error;
  if (asReportedResult.error) throw asReportedResult.error;

  return {
    asReporter: asReporterResult.data || [],
    asReported: asReportedResult.data || [],
  };
}

/**
 * Resolve a report with outcome tracking
 */
export async function resolveReport(reportId: string, outcome: "actioned" | "dismissed") {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) {
    throw new Error("Must be logged in");
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "resolved",
      outcome,
      resolved_at: new Date().toISOString(),
      resolved_by: session.session.user.id,
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reopen a report
 */
export async function reopenReport(reportId: string) {
  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "open",
      resolved_at: null,
      resolved_by: null,
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get report statistics
 */
export async function getReportStats(): Promise<ReportStats> {
  const { data, error } = await supabase
    .from("reports")
    .select("status");

  if (error) throw error;

  const stats: ReportStats = {
    totalReports: data.length,
    openReports: data.filter((r) => r.status === "open").length,
    resolvedReports: data.filter((r) => r.status === "resolved").length,
  };

  return stats;
}

/**
 * Get reporter analytics leaderboard
 */
export async function getReporterLeaderboard(): Promise<ReporterAnalytics[]> {
  const { data: analyticsData, error: analyticsError } = await supabase
    .from("reporter_analytics")
    .select("*")
    .order("total_reports", { ascending: false })
    .limit(50);

  if (analyticsError) throw analyticsError;

  // Get reporter profile details
  const reporterIds = analyticsData?.map(a => a.reporter_id) || [];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", reporterIds);

  if (profilesError) throw profilesError;

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return (analyticsData || []).map(analytics => {
    const profile = profileMap.get(analytics.reporter_id);
    return {
      reporter_id: analytics.reporter_id,
      reporter_name: profile?.full_name || "Unknown",
      reporter_email: profile?.email || "Unknown",
      total_reports: analytics.total_reports,
      actioned_reports: analytics.actioned_reports,
      dismissed_reports: analytics.dismissed_reports,
      pending_reports: analytics.pending_reports,
      accuracy_rate: analytics.accuracy_rate,
      flagged_for_review: analytics.dismissed_reports > 5,
    };
  });
}

/**
 * Get detailed report history for a specific reporter
 */
export async function getReporterHistory(reporterId: string): Promise<ReportDetails[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(id, full_name, email),
      reported_user:profiles!reports_reported_user_id_fkey(id, full_name, email),
      reported_project:projects(id, title),
      resolved_by_user:profiles!reports_resolved_by_fkey(id, full_name)
    `)
    .eq("reporter_id", reporterId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ReportDetails[];
}