import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Users, AlertCircle, FileCheck, Shield, Repeat, ShieldCheck, AlertTriangle, Percent, Tag, Calendar, ShieldAlert, Settings, Bot } from "lucide-react";
import {
  getDashboardStats,
  type DashboardStats,
  isAdminUser,
  getAdminUserInfo,
} from "@/services/controlCentreService";
import { authService } from "@/services/authService";

const sections = [
  {
    title: "Verification",
    description: "Review and approve provider verification requests",
    icon: <ShieldCheck className="w-8 h-8 text-accent" />,
    href: "/muna/verify-providers",
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500",
  },
  {
    title: "Domestic Helper Verification",
    description: "Verify domestic helper applications",
    icon: <ShieldCheck className="w-8 h-8 text-accent" />,
    href: "/muna/verify-domestic-helpers",
    color: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500",
  },
  {
    title: "Disputes",
    description: "Manage user disputes and resolutions",
    icon: <AlertTriangle className="w-8 h-8 text-accent" />,
    href: "/muna/disputes",
    color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500",
  },
  {
    title: "Fund Releases",
    description: "Process manual fund release requests",
    icon: <DollarSign className="w-8 h-8 text-accent" />,
    href: "/muna/fund-releases",
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500",
  },
  {
    title: "Commission Settings",
    description: "Configure platform commission rates and tiers",
    icon: <Percent className="w-8 h-8 text-accent" />,
    href: "/muna/commission-settings",
    color: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500",
  },
  {
    title: "Categories",
    description: "Manage service categories and subcategories",
    icon: <Tag className="w-8 h-8 text-accent" />,
    href: "/muna/categories",
    color: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500",
  },
  {
    title: "Moderation Settings",
    description: "Configure content safety and moderation rules",
    icon: <Shield className="w-8 h-8 text-accent" />,
    href: "/muna/moderation-settings",
    color: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500",
  },
  {
    title: "Routine Contracts",
    description: "Monitor recurring service contracts",
    icon: <Calendar className="w-8 h-8 text-accent" />,
    href: "/muna/routine-contracts",
    color: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500",
  },
  {
    title: "Trust & Safety",
    description: "Manage bypass attempts, reports, and banned accounts",
    icon: <ShieldAlert className="w-8 h-8 text-accent" />,
    href: "/muna/trust-and-safety",
    color: "bg-red-500/10 hover:bg-red-500/20 border-red-500",
  },
  {
    title: "Staff Management",
    description: "Create staff accounts and view audit logs",
    icon: <Users className="w-8 h-8 text-accent" />,
    href: "/muna/staff-management",
    color: "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500",
  },
  {
    title: "Settings",
    description: "Configure all platform settings without code changes",
    icon: <Settings className="w-8 h-8 text-accent" />,
    href: "/muna/settings",
    color: "bg-gray-500/10 hover:bg-gray-500/20 border-gray-500",
  },
  {
    title: "Bot Lab",
    description: "Generate realistic test data to populate the marketplace",
    icon: <Bot className="w-8 h-8 text-accent" />,
    href: "/muna/bot-lab",
    color: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500",
  },
];

export default function ControlCentre() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<{ email: string; isOwner: boolean; role?: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setIsLoading(true);
    
    // Check if user has active session
    const session = await authService.getCurrentSession();
    
    if (!session) {
      // Not logged in - redirect to login
      router.push("/login?redirect=/muna");
      return;
    }

    // Check if user is admin (owner or staff)
    const isAdmin = await isAdminUser();
    
    if (!isAdmin) {
      // Logged in but not admin - show access denied
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // User is authenticated and is admin
    const info = await getAdminUserInfo();
    setAdminInfo(info);
    setIsAuthenticated(true);
    setIsLoading(false);
    loadStats();
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <>
        <SEO title="BlueTika Control Centre" />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Verifying access...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <SEO title="Access Denied - BlueTika Control Centre" />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                You do not have permission to access the Control Centre.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Only BlueTika owner and invited staff members can access this area.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="BlueTika Control Centre" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">BlueTika Control Centre</h1>
              <p className="text-muted-foreground mt-1">Platform Overview & Management</p>
              {adminInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  Logged in as: <span className="font-medium">{adminInfo.email}</span>
                  {adminInfo.isOwner && <span className="ml-2 text-accent">(Owner)</span>}
                  {adminInfo.role && <span className="ml-2 text-muted-foreground">({adminInfo.role})</span>}
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={loadStats} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          {loading && !stats ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          ) : stats ? (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue This Month</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${stats.revenueThisMonth.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">All-Time Revenue</p>
                        <p className="text-2xl font-bold text-foreground">
                          ${stats.revenueAllTime.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Verifications</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.pendingVerificationsCount}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          +{stats.pendingDomesticHelperVerificationsCount} Domestic Helpers
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Open Disputes</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.openDisputesCount}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Fund Releases</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.pendingFundReleasesCount}
                        </p>
                      </div>
                      <FileCheck className="h-8 w-8 text-accent" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Open Reports</p>
                        <p className="text-2xl font-bold text-foreground">{stats.openReportsCount}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Routine Contracts</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats.activeRoutineContractsCount}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${stats.totalMonthlyRecurringValue.toFixed(2)}/mo
                        </p>
                      </div>
                      <Repeat className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Projects by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.projectsByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>New Signups (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.signupsLast30Days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="hsl(var(--accent))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Commission by Tier (This Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.commissionByTier}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tier" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="hsl(var(--success))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bot Lab Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Active Bots</span>
                        <span className="text-2xl font-bold">{stats.botLabStats.activeBots}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Listings Created</span>
                        <span className="text-2xl font-bold">
                          {stats.botLabStats.listingsCreated}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Management Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Management Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Button variant="outline" onClick={() => router.push("/muna/categories")}>
                      Categories
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/muna/verify-providers")}>
                      Verify Providers
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/muna/verify-domestic-helpers")}
                    >
                      Verify Helpers
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/muna/fund-releases")}>
                      Fund Releases
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/muna/disputes")}>
                      Disputes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/muna/commission-settings")}
                    >
                      Commission
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/muna/routine-contracts")}
                    >
                      Routine Contracts
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/muna/trust-and-safety")}
                    >
                      Trust & Safety
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/muna/moderation-settings")}
                    >
                      Moderation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/muna/staff-management")}
                    >
                      Staff Management
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/muna/settings")}
                    >
                      Settings
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/muna/bot-lab")}>
                      Bot Lab
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}