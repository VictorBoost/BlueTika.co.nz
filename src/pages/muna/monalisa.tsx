import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, Power, Activity, Clock, CheckCircle, AlertTriangle, Zap, Mail } from "lucide-react";
import { monalisaService } from "@/services/monalisaService";
import { useToast } from "@/hooks/use-toast";

export default function MonaLisaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);

  useEffect(() => {
    checkOwnerAccess();
    loadMonaLisaStatus();
    loadRecentLogs();
  }, []);

  const checkOwnerAccess = async () => {
    setCheckingOwner(true);
    try {
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.status === 401) {
        router.push("/muna/login");
        return;
      }

      if (response.status === 403 || !data.isAdmin || !data.isOwner) {
        toast({
          title: "Access Denied",
          description: "MonaLisa is only accessible to the platform owner.",
          variant: "destructive"
        });
        router.push("/muna");
        return;
      }

      setIsOwner(true);
    } catch (error) {
      console.error("Owner verification error:", error);
      router.push("/muna");
    } finally {
      setCheckingOwner(false);
    }
  };

  const loadMonaLisaStatus = async () => {
    try {
      const status = await monalisaService.getStatus();
      setIsActive(status?.is_active || false);
      setLastCheck(status?.last_check_at || null);
    } catch (error) {
      console.error("Failed to load MonaLisa status:", error);
      setIsActive(false);
      setLastCheck(null);
    }
  };

  const loadRecentLogs = async () => {
    setLoadingLogs(true);
    try {
      const { logs } = await monalisaService.getLogs(10, 0);
      setRecentLogs(logs);
    } catch (error) {
      console.error("Failed to load recent logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleToggleMonaLisa = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      const success = await monalisaService.toggleMonaLisa(enabled);

      if (success) {
        setIsActive(enabled);
        toast({
          title: enabled ? "MonaLisa Activated" : "MonaLisa Deactivated",
          description: enabled
            ? "MonaLisa will now monitor all new posts, bids, and contracts for safety issues"
            : "MonaLisa has been turned off. Manual moderation only.",
        });

        await loadMonaLisaStatus();
        await loadRecentLogs();
      } else {
        toast({
          title: "Toggle Failed",
          description: "Failed to update MonaLisa status",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Toggle Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendWeeklySummary = async () => {
    setSendingSummary(true);
    try {
      const success = await monalisaService.sendWeeklySummary();
      
      if (success) {
        toast({
          title: "Weekly Summary Sent",
          description: "MonaLisa weekly report sent to admin email (bluetikanz@gmail.com)",
        });
      } else {
        throw new Error("Failed to send summary");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send weekly summary",
        variant: "destructive",
      });
    } finally {
      setSendingSummary(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  if (checkingOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <SEO
        title="MonaLisa AI Agent - BlueTika Control Centre"
        description="24/7 AI-powered monitoring of human and bot marketplace activity"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.push("/muna")}
              className="mb-4"
            >
              ← Back to Control Centre
            </Button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">MonaLisa AI Agent</h1>
                  <p className="text-muted-foreground">
                    24/7 AI monitoring of human AND bot activity • Platform security & loophole detection
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="destructive">OWNER ONLY</Badge>
                <Button
                  onClick={handleSendWeeklySummary}
                  disabled={sendingSummary}
                  variant="outline"
                  size="sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {sendingSummary ? "Sending..." : "Send Weekly Summary"}
                </Button>
              </div>
            </div>
          </div>

          <Card className="mb-6 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Power className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle>MonaLisa Status</CardTitle>
                    <CardDescription>
                      {isActive
                        ? "MonaLisa is actively monitoring all new content"
                        : "MonaLisa is offline. Content is not being monitored."}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {isActive ? "ACTIVE" : "OFFLINE"}
                  </span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={handleToggleMonaLisa}
                    disabled={isToggling}
                  />
                </div>
              </div>
            </CardHeader>
            {lastCheck && (
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Last check: {new Date(lastCheck).toLocaleString()}</span>
                </div>
              </CardContent>
            )}
          </Card>

          {isActive ? (
            <Alert className="mb-6 border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                ✓ MonaLisa is ACTIVE - Monitoring all human AND bot activities 24/7. Detecting scams, safety violations, loopholes, and suspicious patterns across the marketplace.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 border-yellow-500 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                ⚠️ MonaLisa is OFFLINE. Human and bot content is not being automatically monitored. Manual moderation only.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  What MonaLisa Monitors (Human + Bot)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-primary">👥 Human Activity:</p>
                <p>✓ All new project posts</p>
                <p>✓ All submitted bids</p>
                <p>✓ Contract interactions & payments</p>
                <p>✓ User profiles & content</p>
                <p>✓ Reviews and ratings</p>
                <p>✓ Direct messages (when enabled)</p>
                
                <p className="font-semibold text-accent mt-4">🤖 Bot Activity:</p>
                <p>✓ Bot-generated projects (quality check)</p>
                <p>✓ Bot bidding patterns</p>
                <p>✓ Bot payment transactions</p>
                <p>✓ Detecting bot malfunctions</p>
                <p>✓ Ensuring bots act human-like</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  MonaLisa Duties (24/7 Admin/Police)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-green-600 dark:text-green-400">
                  ✓ <strong>Safety:</strong> Detects scams, explicit content, harassment
                </p>
                <p className="text-blue-600 dark:text-blue-400">
                  ✓ <strong>Loophole Detection:</strong> Finds platform vulnerabilities and bugs
                </p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ <strong>Pattern Analysis:</strong> Flags unusual behavior (human or bot)
                </p>
                <p className="text-red-600 dark:text-red-400">
                  🚨 <strong>Critical Alerts:</strong> Auto-flags severe violations for admin review
                </p>
                <p className="text-purple-600 dark:text-purple-400">
                  🔍 <strong>Bot Supervision:</strong> Ensures bots don't spam or malfunction
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Important:</strong> MonaLisa acts like a 24/7 online police/admin, monitoring EVERYTHING (humans + bots), finding problems and loopholes, then reporting them to you for action. Never auto-deletes or auto-bans.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Weekly Summary Reports
              </CardTitle>
              <CardDescription>
                MonaLisa automatically sends weekly summary emails every Monday at 9am NZST with bot activity stats, 
                issues detected, AI-generated suggestions, and system health metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Reports include: Bot performance, critical issues, warnings, top problems, and actionable insights.
                  </p>
                  <p className="text-sm font-medium">
                    📧 Sent to: bluetikanz@gmail.com
                  </p>
                </div>
                <Button
                  onClick={handleSendWeeklySummary}
                  disabled={sendingSummary}
                  variant="default"
                >
                  {sendingSummary ? "Sending..." : "Send Now"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity (Last 10 Logs)
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={loadRecentLogs}
                    disabled={loadingLogs}
                    variant="outline"
                    size="sm"
                  >
                    {loadingLogs ? "Loading..." : "Refresh"}
                  </Button>
                  <Button
                    onClick={() => router.push("/muna/monalisa-logs")}
                    variant="default"
                    size="sm"
                  >
                    View All Logs
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isActive
                      ? "No activity yet. MonaLisa will start logging as content is posted."
                      : "Activate MonaLisa to begin monitoring content."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="border-l-4 pl-4 py-2" style={{
                      borderColor: log.severity === "critical" ? "#ef4444" :
                        log.severity === "warning" ? "#f59e0b" :
                        log.severity === "info" ? "#3b82f6" : "#10b981"
                    }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${getSeverityColor(log.severity)}`}>
                          {log.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}