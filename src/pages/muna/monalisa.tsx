import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, Power, Activity, Clock, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { monalisaService } from "@/services/monalisaService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    checkOwnerAccess();
    loadMonaLisaStatus();
    loadRecentLogs();
  }, []);

  const checkOwnerAccess = async () => {
    setCheckingOwner(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      const hasAccess = profile?.email === "bluetikanz@gmail.com";
      setIsOwner(hasAccess);

      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "MonaLisa is only accessible to the platform owner.",
          variant: "destructive"
        });
        router.push("/muna");
      }
    } catch (error) {
      console.error("Failed to check owner access:", error);
      router.push("/muna");
    } finally {
      setCheckingOwner(false);
    }
  };

  const loadMonaLisaStatus = async () => {
    try {
      const status = await monalisaService.getStatus();
      setIsActive(status.isActive);
      setLastCheck(status.lastCheckAt);
    } catch (error) {
      console.error("Failed to load MonaLisa status:", error);
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

        // Reload status and logs
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
        description="AI-powered content moderation and safety monitoring"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.push("/muna")}
              className="mb-4"
            >
              ← Back to Control Centre
            </Button>

            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">MonaLisa AI Agent</h1>
              <Badge variant="destructive" className="ml-auto">OWNER ONLY</Badge>
            </div>
            <p className="text-muted-foreground">
              AI-powered content moderation and safety monitoring for BlueTika marketplace
            </p>
          </div>

          {/* Activation Control */}
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

          {/* Status Banner */}
          {isActive ? (
            <Alert className="mb-6 border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                ✓ MonaLisa is monitoring all new posts, bids, and contracts for safety violations, scams, and inappropriate content.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6 border-yellow-500 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                ⚠️ MonaLisa is offline. New content is not being automatically reviewed. Manual moderation only.
              </AlertDescription>
            </Alert>
          )}

          {/* What MonaLisa Does */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  What MonaLisa Monitors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✓ All new project posts</p>
                <p>✓ All submitted bids</p>
                <p>✓ All contract interactions</p>
                <p>✓ User profile content</p>
                <p>✓ Uploaded photos (evidence/before/after)</p>
                <p>✓ Reviews and ratings</p>
                <p>✓ Direct messages (if enabled)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  MonaLisa Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-green-600 dark:text-green-400">
                  ✓ <strong>Info:</strong> Logs unusual patterns
                </p>
                <p className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ <strong>Warning:</strong> Flags suspicious content for review
                </p>
                <p className="text-red-600 dark:text-red-400">
                  🚨 <strong>Critical:</strong> Auto-flags severe violations (scams, explicit content)
                </p>
                <p className="text-muted-foreground mt-4">
                  MonaLisa never auto-deletes or auto-bans. All flagged content goes to Trust & Safety for manual review.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
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