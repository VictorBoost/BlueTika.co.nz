import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderOpen,
  FileText,
  Handshake,
  ShieldCheck,
  Settings,
  LogOut,
  Home,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Clock,
} from "lucide-react";

// Suggestion 1: Owner email from env var with fallback
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || "bluetikanz@gmail.com";

interface DashboardCounts {
  projects: number;
  bids: number;
  contracts: number;
}

interface RecentActivity {
  id: string;
  type: "project" | "bid" | "contract";
  title: string;
  created_at: string;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<DashboardCounts>({ projects: 0, bids: 0, contracts: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Suggestion 5: Recent activity feed
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Step 1: Check admin access
  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Step 2: Load stats + activity once authorized
  useEffect(() => {
    if (isAuthorized) {
      loadStats();
      loadRecentActivity();
    }
  }, [isAuthorized]);

  // Suggestion 3: Real-time subscriptions
  useEffect(() => {
    if (!isAuthorized) return;

    const projectsChannel = supabase
      .channel("dashboard-projects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => loadStats()
      )
      .subscribe();

    const bidsChannel = supabase
      .channel("dashboard-bids")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bids" },
        () => loadStats()
      )
      .subscribe();

    const contractsChannel = supabase
      .channel("dashboard-contracts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => {
          loadStats();
          loadRecentActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(contractsChannel);
    };
  }, [isAuthorized]);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // User not logged in - show login prompt instead of immediate redirect
        setIsAuthorized(false);
        return;
      }

      if (user.email !== OWNER_EMAIL) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthorized(false);
    }
  };

  const loadStats = async () => {
    setLoadingCounts(true);
    setError(null);

    try {
      const [projectsRes, bidsRes, contractsRes] = await Promise.allSettled([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("bids").select("*", { count: "exact", head: true }),
        supabase.from("contracts").select("*", { count: "exact", head: true }),
      ]);

      setCounts({
        projects: projectsRes.status === "fulfilled" ? (projectsRes.value.count ?? 0) : 0,
        bids: bidsRes.status === "fulfilled" ? (bidsRes.value.count ?? 0) : 0,
        contracts: contractsRes.status === "fulfilled" ? (contractsRes.value.count ?? 0) : 0,
      });

      const failures = [projectsRes, bidsRes, contractsRes]
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason?.message || "Unknown error");

      if (failures.length > 0) {
        console.warn("Some stats failed to load:", failures);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard stats";
      setError(message);
      console.error("loadStats error:", err);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Suggestion 5: Load recent activity
  const loadRecentActivity = async () => {
    setLoadingActivity(true);
    try {
      const [projectsRes, bidsRes, contractsRes] = await Promise.allSettled([
        supabase
          .from("projects")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("bids")
          .select("id, created_at, projects(title)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("contracts")
          .select("id, created_at, projects(title)")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const activity: RecentActivity[] = [];

      if (projectsRes.status === "fulfilled" && projectsRes.value.data) {
        projectsRes.value.data.forEach((p: any) =>
          activity.push({
            id: p.id,
            type: "project",
            title: p.title || "Untitled Project",
            created_at: p.created_at,
          })
        );
      }

      if (bidsRes.status === "fulfilled" && bidsRes.value.data) {
        bidsRes.value.data.forEach((b: any) =>
          activity.push({
            id: b.id,
            type: "bid",
            title: (b.projects as any)?.title || "Untitled Project",
            created_at: b.created_at,
          })
        );
      }

      if (contractsRes.status === "fulfilled" && contractsRes.value.data) {
        contractsRes.value.data.forEach((c: any) =>
          activity.push({
            id: c.id,
            type: "contract",
            title: (c.projects as any)?.title || "Untitled Project",
            created_at: c.created_at,
          })
        );
      }

      // Sort merged results by date, newest first, take top 5
      activity.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentActivity(activity.slice(0, 5));
    } catch (err) {
      console.error("loadRecentActivity error:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Suggestion 2: Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadRecentActivity()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const activityBadge = (type: RecentActivity["type"]) => {
    switch (type) {
      case "project":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500/30 text-xs">
            Project
          </Badge>
        );
      case "bid":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">
            Bid
          </Badge>
        );
      case "contract":
        return (
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">
            Contract
          </Badge>
        );
    }
  };

  // --- Loading state ---
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Unauthorized state ---
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              This dashboard is restricted to the platform owner.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push("/login")} className="w-full">
                Sign In
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Authorized dashboard ---
  // Suggestion 4: Stat cards with "View All" links
  const statCards = [
    {
      label: "Projects",
      count: counts.projects,
      icon: <FolderOpen className="w-6 h-6" />,
      color: "text-blue-500",
      href: "/projects",
    },
    {
      label: "Bids",
      count: counts.bids,
      icon: <FileText className="w-6 h-6" />,
      color: "text-amber-500",
      href: "/my-bids",
    },
    {
      label: "Contracts",
      count: counts.contracts,
      icon: <Handshake className="w-6 h-6" />,
      color: "text-emerald-500",
      href: "/contracts",
    },
  ];

  return (
    <>
      <SEO title="Owner Dashboard - BlueTika" />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">BlueTika Owner Dashboard</h1>
            <div className="flex items-center gap-2">
              {/* Suggestion 2: Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          {/* Stat Cards */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {statCards.map((stat) => (
                <Link key={stat.label} href={stat.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                      <span className={stat.color}>{stat.icon}</span>
                    </CardHeader>
                    <CardContent>
                      {loadingCounts ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <div className="flex items-end justify-between">
                          <p className="text-3xl font-bold">{stat.count.toLocaleString()}</p>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View All <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Suggestion 5: Recent Activity Feed */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="p-0">
                {loadingActivity ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent activity to display.
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentActivity.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {activityBadge(item.type)}
                          <span className="text-sm truncate">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-4">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Menu Buttons */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/muna/providers-pending" className="w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-base"
                  size="lg"
                >
                  <ShieldCheck className="w-5 h-5 mr-3 text-accent" />
                  Approve Providers
                </Button>
              </Link>

              <Link href="/muna/settings" className="w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-base"
                  size="lg"
                >
                  <Settings className="w-5 h-5 mr-3 text-accent" />
                  Settings
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full justify-start h-14 text-base"
                size="lg"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3 text-destructive" />
                Logout
              </Button>

              <Link href="/" className="w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-base"
                  size="lg"
                >
                  <Home className="w-5 h-5 mr-3 text-muted-foreground" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}