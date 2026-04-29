import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { DollarSign, Users, AlertCircle, FileCheck, Shield, Repeat, ShieldCheck, AlertTriangle, Percent, Tag, Calendar, ShieldAlert, Settings, Bot, BrainCircuit, Play, Eye, Lock, Activity, TrendingUp, FileText } from "lucide-react";
import {
  getDashboardStats,
  type DashboardStats,
  isAdminUser,
  getAdminUserInfo,
  verifyControlCentrePassword,
} from "@/services/controlCentreService";
import { authService } from "@/services/authService";
import { monalisaService } from "@/services/monalisaService";
import { supabase } from "@/integrations/supabase/client";

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
  {
    title: "Bot Configuration",
    description: "Configure bot automation settings and intervals",
    icon: <Settings className="w-8 h-8 text-accent" />,
    href: "/muna/bot-config",
    color: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500",
  },
  {
    title: "Bot Activity Monitor",
    description: "Real-time bot activity feeds and automation logs",
    icon: <Activity className="w-8 h-8 text-accent" />,
    href: "/muna/bot-activity",
    color: "bg-orange-600/10 hover:bg-orange-600/20 border-orange-600",
  },
  {
    title: "Contracts Monitor",
    description: "Real-time contract lifecycle monitoring dashboard",
    icon: <Activity className="w-8 h-8 text-accent" />,
    href: "/muna/contracts-monitor",
    color: "bg-blue-600/10 hover:bg-blue-600/20 border-blue-600",
  },
  {
    title: "User Management",
    description: "View and manage platform users",
    icon: <Users className="w-8 h-8 text-accent" />,
    href: "/muna/user-management",
    color: "bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-600",
  },
];

export default function ControlCentre() {
  const router = useRouter();
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ email: string; isOwner: boolean; role?: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [monalisaActive, setMonalisaActive] = useState(false);
  const [monalisaStats, setMonalisaStats] = useState({
    totalLogs: 0,
    criticalIssues: 0,
    warningsToday: 0,
    lastCheckAt: null as string | null,
  });
  const [monalisaLoading, setMonalisaLoading] = useState(false);

  useEffect(() => {
    checkPasswordVerification();
  }, []);

  useEffect(() => {
    if (passwordVerified) {
      checkPlatformAccess();
    }
  }, [passwordVerified]);

  const checkPasswordVerification = () => {
    // Check for lockout
    const lockout = localStorage.getItem("muna_lockout");
    if (lockout) {
      const lockoutData = JSON.parse(lockout);
      const lockedUntil = new Date(lockoutData.lockedUntil);
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        setPasswordError(`Too many failed attempts. Locked for ${minutesLeft} minutes.`);
        setIsCheckingPassword(false);
        return;
      } else {
        localStorage.removeItem("muna_lockout");
      }
    }

    const verified = sessionStorage.getItem("muna_password_verified");
    if (verified === "true") {
      setPasswordVerified(true);
    }
    setIsCheckingPassword(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Check lockout again
    const lockout = localStorage.getItem("muna_lockout");
    if (lockout) {
      const lockoutData = JSON.parse(lockout);
      const lockedUntil = new Date(lockoutData.lockedUntil);
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        setPasswordError(`Too many failed attempts. Locked for ${minutesLeft} minutes.`);
        return;
      } else {
        localStorage.removeItem("muna_lockout");
      }
    }

    if (verifyControlCentrePassword(password)) {
      // Log successful password verification
      const ipAddress = await fetch("https://api.ipify.org?format=json")
        .then(r => r.json())
        .then(d => d.ip)
        .catch(() => "unknown");

      await supabase.from("admin_login_logs").insert({
        email: "control_centre_password",
        success: true,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
      });

      // Clear failed attempts
      localStorage.removeItem("muna_failed_attempts");
      sessionStorage.setItem("muna_password_verified", "true");
      setPasswordVerified(true);
    } else {
      // Track failed attempt
      const failedAttempts = JSON.parse(localStorage.getItem("muna_failed_attempts") || "0") + 1;
      localStorage.setItem("muna_failed_attempts", JSON.stringify(failedAttempts));

      // Log failed attempt
      const ipAddress = await fetch("https://api.ipify.org?format=json")
        .then(r => r.json())
        .then(d => d.ip)
        .catch(() => "unknown");

      await supabase.from("admin_login_logs").insert({
        email: "control_centre_password",
        success: false,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
      });

      if (failedAttempts >= 5) {
        // Lockout for 30 minutes
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        localStorage.setItem("muna_lockout", JSON.stringify({ lockedUntil: lockedUntil.toISOString() }));
        setPasswordError("Too many failed attempts. Locked for 30 minutes.");
        localStorage.removeItem("muna_failed_attempts");
      } else {
        setPasswordError(`Incorrect password (${failedAttempts}/5 attempts)`);
      }
      setPassword("");
    }
  };

  const checkPlatformAccess = async () => {
    setIsLoading(true);
    
    try {
      console.log("Checking platform access...");
      
      // Use server-side admin verification API
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      
      console.log("Admin verification result:", { status: response.status, data });
      
      if (response.status === 401) {
        // Not logged in - redirect to login
        console.log("Not authenticated - redirecting to login");
        router.push("/muna/login");
        return;
      }

      if (response.status === 403 || !data.isAdmin) {
        // Logged in but not admin - show access denied
        console.log("Not authorized - showing access denied");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // User is authenticated and is admin
      console.log("Admin verified:", data);
      
      setAdminInfo({
        email: data.email,
        isOwner: data.isOwner,
        role: data.role
      });
      setIsAuthenticated(true);
      setIsLoading(false);
      loadStats();
      
      if (data.isOwner) {
        loadMonalisaStatus();
      }
    } catch (error) {
      console.error("Error in checkPlatformAccess:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
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

  const loadMonalisaStatus = async () => {
    const status = await monalisaService.getStatus();
    setMonalisaActive(status?.is_active || false);
    const stats = await monalisaService.getStatistics();
    setMonalisaStats(stats);
  };

  const handleMonalisaToggle = async (enabled: boolean) => {
    setMonalisaLoading(true);
    const success = await monalisaService.toggleMonaLisa(enabled);
    if (success) {
      setMonalisaActive(enabled);
      await loadMonalisaStatus();
    }
    setMonalisaLoading(false);
  };

  const handleTriggerMonalisa = async () => {
    setMonalisaLoading(true);
    const success = await monalisaService.triggerManualCheck();
    if (success) {
      setTimeout(() => loadMonalisaStatus(), 2000);
    }
    setMonalisaLoading(false);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("muna_password_verified");
    await authService.signOut();
    router.push("/");
  };

  // Password verification screen
  if (isCheckingPassword) {
    return (
      <>
        <SEO title="BlueTika Control Centre" />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!passwordVerified) {
    return (
      <>
        <SEO title="BlueTika Control Centre" />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">BlueTika Control Centre</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Enter the Control Centre password to continue
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoFocus
                    disabled={!!passwordError && passwordError.includes("Locked")}
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!!passwordError && passwordError.includes("Locked")}
                >
                  Access Control Centre
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => router.push("/muna/recovery")}
                >
                  Emergency Recovery
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Platform access verification
  if (isLoading) {
    return (
      <>
        <SEO title="BlueTika Control Centre" />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Verifying platform access...</p>
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

          {/* MonaLisa Control Panel (Owner Only) */}
          {adminInfo?.isOwner && (
            <Card className="mb-8 border-2 border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-6 w-6 text-accent" />
                  MonaLisa AI Admin Agent
                  <Badge variant={monalisaActive ? "default" : "secondary"} className="ml-auto">
                    {monalisaActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="monalisa-toggle" className="text-base font-semibold">
                        MonaLisa Status
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Independent AI agent for monitoring and system health checks
                      </p>
                    </div>
                    <Switch
                      id="monalisa-toggle"
                      checked={monalisaActive}
                      onCheckedChange={handleMonalisaToggle}
                      disabled={monalisaLoading}
                    />
                  </div>

                  {monalisaActive && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Total Logs</p>
                          <p className="text-2xl font-bold">{monalisaStats.totalLogs}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Critical Issues</p>
                          <p className="text-2xl font-bold text-destructive">
                            {monalisaStats.criticalIssues}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Warnings Today</p>
                          <p className="text-2xl font-bold text-yellow-500">
                            {monalisaStats.warningsToday}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Last Check</p>
                          <p className="text-sm font-medium">
                            {monalisaStats.lastCheckAt
                              ? new Date(monalisaStats.lastCheckAt).toLocaleTimeString()
                              : "Never"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={() => router.push("/muna/monalisa-logs")}
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </Button>
                        <Button
                          onClick={handleTriggerMonalisa}
                          variant="default"
                          className="flex-1"
                          disabled={monalisaLoading}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {monalisaLoading ? "Running..." : "Run Check Now"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

                <Card className="border-accent shadow-md">
                  <CardHeader className="bg-muted/30 pb-4 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-accent" />
                      Bot Automation Hub
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border/50">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Active Bots
                        </span>
                        <span className="text-2xl font-bold text-primary">{stats.botLabStats.activeBots}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border/50">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          Total Activity Generated
                        </span>
                        <span className="text-2xl font-bold text-accent">
                          {stats.botLabStats.listingsCreated * 4}
                        </span>
                      </div>
                      <div className="pt-4">
                        <Button 
                          size="lg"
                          className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white shadow-md hover:shadow-lg transition-all" 
                          onClick={() => router.push("/muna/bot-lab")}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          View Live Bot Feeds & Controls
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monitoring & Logs */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Quick Access
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.map((section, index) => (
                    <Link key={index} href={section.href}>
                      <Card className={`cursor-pointer border-2 transition-all hover:shadow-lg ${section.color}`}>
                        <CardHeader>
                          <div className="mb-2">{section.icon}</div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
