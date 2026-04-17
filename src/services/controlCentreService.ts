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

    // Bot Lab stats
    const { count: activeBots } = await supabase
      .from("bot_accounts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { data: botProfiles } = await supabase
      .from("bot_accounts")
      .select("profile_id")
      .eq("is_active", true);

    const botProfileIds = (botProfiles || []).map(b => b.profile_id);

    let listingsCreated = 0;
    if (botProfileIds.length > 0) {
      const { count: projectsCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .in("client_id", botProfileIds);
      listingsCreated = projectsCount || 0;
    }

    const botLabStats = {
      activeBots: activeBots || 0,
      listingsCreated,
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

// Admin email verification for control centre access
const OWNER_EMAIL = "bluetikanz@gmail.com";

export async function isAdminUser(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return false;
    }

    // Check if owner
    if (user.email === OWNER_EMAIL) {
      return true;
    }

    // Check if active staff member
    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("email", user.email)
      .eq("is_active", true)
      .single();

    return !!staff;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function getAdminUserInfo(): Promise<{ email: string; isOwner: boolean; role?: string } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return null;
    }

    // Check if owner
    if (user.email === OWNER_EMAIL) {
      return {
        email: user.email,
        isOwner: true
      };
    }

    // Check if active staff member
    const { data: staff } = await supabase
      .from("staff")
      .select("role")
      .eq("email", user.email)
      .eq("is_active", true)
      .single();

    if (staff) {
      return {
        email: user.email,
        isOwner: false,
        role: staff.role
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting admin info:", error);
    return null;
  }
}