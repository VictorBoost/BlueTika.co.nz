import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  projectsByCategory: { category: string; count: number }[];
  signupsLast30Days: { date: string; count: number }[];
  revenueThisMonth: number;
  revenueAllTime: number;
  commissionByTier: { tier: string; amount: number }[];
  openDisputesCount: number;
  pendingFundReleasesCount: number;
  pendingVerificationsCount: number;
  pendingDomesticHelperVerificationsCount: number;
  openReportsCount: number;
  activeRoutineContractsCount: number;
  totalMonthlyRecurringValue: number;
  botLabStats: {
    activeBots: number;
    listingsCreated: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Projects by category
    const { data: projectsData } = await supabase
      .from("projects")
      .select(`
        category_id,
        categories (name)
      `)
      .eq("status", "open");

    const categoryGroups = (projectsData || []).reduce((acc, p) => {
      const catName = (p.categories as any)?.name || "Uncategorized";
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projectsByCategory = Object.entries(categoryGroups).map(([category, count]) => ({
      category,
      count,
    }));

    // Signups last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: signupsData } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());

    const signupsByDay = (signupsData || []).reduce((acc, s) => {
      if (!s.created_at) return acc;
      const date = new Date(s.created_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const signupsLast30Days = Object.entries(signupsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue this month and all time
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { data: contractsThisMonth } = await supabase
      .from("contracts")
      .select("platform_fee")
      .gte("created_at", firstDayOfMonth.toISOString());

    const revenueThisMonth = (contractsThisMonth || []).reduce(
      (sum, c) => sum + (Number(c.platform_fee) || 0),
      0
    );

    const { data: contractsAllTime } = await supabase
      .from("contracts")
      .select("platform_fee");

    const revenueAllTime = (contractsAllTime || []).reduce(
      (sum, c) => sum + (Number(c.platform_fee) || 0),
      0
    );

    // Commission by tier this month
    const { data: contractsByTier } = await supabase
      .from("contracts")
      .select(`
        platform_fee,
        profiles!contracts_provider_id_fkey (commission_tier)
      `)
      .gte("created_at", firstDayOfMonth.toISOString());

    const tierGroups = (contractsByTier || []).reduce((acc, c) => {
      const tier = (c.profiles as any)?.commission_tier || "bronze";
      acc[tier] = (acc[tier] || 0) + (Number(c.platform_fee) || 0);
      return acc;
    }, {} as Record<string, number>);

    const commissionByTier = Object.entries(tierGroups).map(([tier, amount]) => ({
      tier,
      amount,
    }));

    // Open disputes count
    const { count: openDisputesCount } = await supabase
      .from("disputes")
      .select("*", { count: "exact", head: true })
      .is("resolved_at", null);

    // Pending fund releases count
    const { count: pendingFundReleasesCount } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("status", "awaiting_fund_release");

    // Pending verifications count
    const { count: pendingVerificationsCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "pending");

    // Pending domestic helper verifications count
    const { count: pendingDomesticHelperVerificationsCount } = await supabase
      .from("verification_documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("document_type", "police_check");

    // Open reports count
    const { count: openReportsCount } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    // Active routine contracts and total monthly value
    const { data: routineContracts } = await supabase
      .from("routine_contracts")
      .select(`
        id,
        contracts!routine_contracts_original_contract_id_fkey (final_amount)
      `)
      .eq("status", "active");

    const activeRoutineContractsCount = routineContracts?.length || 0;
    const totalMonthlyRecurringValue = (routineContracts || []).reduce(
      (sum, c) => {
        return sum + (Number((c.contracts as any)?.final_amount) || 0);
      },
      0
    );

    // Bot Lab stats (placeholder - adjust based on your bot implementation)
    const botLabStats = {
      activeBots: 0,
      listingsCreated: 0,
    };

    return {
      projectsByCategory,
      signupsLast30Days,
      revenueThisMonth,
      revenueAllTime,
      commissionByTier,
      openDisputesCount: openDisputesCount || 0,
      pendingFundReleasesCount: pendingFundReleasesCount || 0,
      pendingVerificationsCount: pendingVerificationsCount || 0,
      pendingDomesticHelperVerificationsCount: pendingDomesticHelperVerificationsCount || 0,
      openReportsCount: openReportsCount || 0,
      activeRoutineContractsCount,
      totalMonthlyRecurringValue,
      botLabStats,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

// Password verification for control centre access
const CONTROL_CENTRE_PASSWORD = "BlueTika2026!Secure";

export function verifyControlCentrePassword(password: string): boolean {
  return password === CONTROL_CENTRE_PASSWORD;
}

export function isControlCentreAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("muna_auth") === "true";
}

export function setControlCentreAuthenticated(): void {
  sessionStorage.setItem("muna_auth", "true");
}

export function clearControlCentreAuthentication(): void {
  sessionStorage.removeItem("muna_auth");
}