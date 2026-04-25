import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, Activity, Zap, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Skull, Trash2, RefreshCw, MessageSquare } from "lucide-react";
import { botLabService } from "@/services/botLabService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BotLab() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [generatingBots, setGeneratingBots] = useState(false);
  const [removingBots, setRemovingBots] = useState(false);
  const [killingAll, setKillingAll] = useState(false);
  const [triggeringProjects, setTriggeringProjects] = useState(false);
  const [triggeringBids, setTriggeringBids] = useState(false);
  const [triggeringPayments, setTriggeringPayments] = useState(false);
  const [togglingAutomation, setTogglingAutomation] = useState(false);
  const [togglingPayments, setTogglingPayments] = useState(false);
  const [generatingActivity, setGeneratingActivity] = useState(false);
  const [realtimeActivity, setRealtimeActivity] = useState<any>(null);

  useEffect(() => {
    checkOwnerAccess();
    loadStatus();
    loadStats();
    loadRealtimeActivity();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(() => {
      loadStats();
      loadRealtimeActivity();
    }, 10000);
    
    return () => clearInterval(interval);
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

      if (response.status === 403 || !data.isAdmin) {
        toast({
          title: "Access Denied",
          description: "Bot Lab requires admin access.",
          variant: "destructive"
        });
        router.push("/muna");
        return;
      }

      setIsOwner(data.isOwner || data.isAdmin);
    } catch (error) {
      console.error("Owner verification error:", error);
      router.push("/muna");
    } finally {
      setCheckingOwner(false);
    }
  };

  const loadStatus = async () => {
    try {
      const automationStatus = await botLabService.getAutomationStatus();
      setStatus(automationStatus);
    } catch (error) {
      console.error("Failed to load status:", error);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const botStats = await botLabService.getBotStats();
      setStats(botStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadRealtimeActivity = async () => {
    try {
      // Get recent bot activity (last 5 minutes)
      const { data: recentProjects } = await supabase
        .from("projects")
        .select("id, title, budget, created_at")
        .in("client_id", 
          supabase.from("bot_accounts").select("profile_id")
        )
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: recentBids } = await supabase
        .from("bids")
        .select("id, amount, created_at, projects(title)")
        .in("provider_id",
          supabase.from("bot_accounts").select("profile_id")
        )
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: recentContracts } = await supabase
        .from("contracts")
        .select("id, final_amount, status, created_at")
        .in("client_id",
          supabase.from("bot_accounts").select("profile_id")
        )
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: recentMessages } = await supabase
        .from("contract_messages")
        .select("id, message, contains_contact_info, created_at")
        .in("contract_id",
          supabase.from("contracts").select("id").in("client_id",
            supabase.from("bot_accounts").select("profile_id")
          )
        )
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      setRealtimeActivity({
        projects: recentProjects || [],
        bids: recentBids || [],
        contracts: recentContracts || [],
        messages: recentMessages || []
      });
    } catch (error) {
      console.error("Failed to load realtime activity:", error);
    }
  };

  const handleGenerateBots = async () => {
    setGeneratingBots(true);
    try {
      const result = await botLabService.generateBots(50);
      
      toast({
        title: "Bot Generation Complete",
        description: `Created ${result.success} bots (80% clients, 20% providers). ${result.failed} failed.`,
      });
      
      if (result.errors && result.errors.length > 0) {
        console.error("Bot generation errors:", result.errors);
      }
      
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate bots",
        variant: "destructive",
      });
    } finally {
      setGeneratingBots(false);
    }
  };

  const handleRemoveBots = async () => {
    if (!confirm("Remove 50 bots and all their content (projects, bids, contracts)? This cannot be undone.")) {
      return;
    }

    setRemovingBots(true);
    try {
      const result = await botLabService.removeBots(50);
      
      toast({
        title: "Bots Removed",
        description: `Removed ${result.success} bots. ${result.failed} failed.`,
      });
      
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove bots",
        variant: "destructive",
      });
    } finally {
      setRemovingBots(false);
    }
  };

  const handleKillSwitch = async () => {
    if (!confirm("⚠️ KILL SWITCH: Delete ALL bots and their content? Automation will be disabled. This cannot be undone!")) {
      return;
    }

    setKillingAll(true);
    try {
      const result = await botLabService.killSwitch();
      
      if (result.success) {
        toast({
          title: "Kill Switch Activated",
          description: `Deleted ${result.deleted} bots and all their content. Automation disabled.`,
          variant: "destructive"
        });
        await loadStatus();
        await loadStats();
      } else {
        throw new Error(result.error || "Kill switch failed");
      }
    } catch (error: any) {
      toast({
        title: "Kill Switch Failed",
        description: error.message || "Failed to execute kill switch",
        variant: "destructive",
      });
    } finally {
      setKillingAll(false);
    }
  };

  const handleToggleAutomation = async (enabled: boolean) => {
    setTogglingAutomation(true);
    try {
      const success = await botLabService.toggleAutomation(enabled);
      
      if (success) {
        toast({
          title: enabled ? "Automation Enabled" : "Automation Disabled",
          description: enabled 
            ? "Bots will now post projects and submit bids automatically"
            : "Bot automation has been paused",
        });
        await loadStatus();
      } else {
        throw new Error("Toggle failed");
      }
    } catch (error) {
      toast({
        title: "Toggle Failed",
        description: "Failed to update automation status",
        variant: "destructive",
      });
    } finally {
      setTogglingAutomation(false);
    }
  };

  const handleTogglePayments = async (enabled: boolean) => {
    setTogglingPayments(true);
    try {
      const success = await botLabService.toggleBotPayments(enabled);
      
      if (success) {
        toast({
          title: enabled ? "Bot Payments Enabled" : "Bot Payments Disabled",
          description: enabled
            ? "Bots can now accept bids and process test payments"
            : "Bot payments have been disabled",
        });
        await loadStatus();
      } else {
        throw new Error("Toggle failed");
      }
    } catch (error) {
      toast({
        title: "Toggle Failed",
        description: "Failed to update payment settings",
        variant: "destructive",
      });
    } finally {
      setTogglingPayments(false);
    }
  };

  const handleGenerateActivity = async () => {
    setGeneratingActivity(true);
    
    try {
      toast({
        title: "Generating Bot Activity",
        description: "Running full lifecycle: projects → bids → messages → contracts → completion",
      });

      const { data, error } = await supabase.functions.invoke("hourly-bot-cycle");
      
      if (error) throw error;

      toast({
        title: "✅ Bot Activity Generated!",
        description: `Created ${data.results?.projects || 0} projects, ${data.results?.bids || 0} bids, ${data.results?.contracts || 0} contracts`,
      });

      await loadStats();
      await loadRealtimeActivity();
    } catch (error: any) {
      console.error("Activity generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate bot activity",
        variant: "destructive",
      });
    } finally {
      setGeneratingActivity(false);
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
        title="Bot Lab - BlueTika Control Centre"
        description="Manage bot automation and marketplace activity"
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
                <Bot className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Bot Lab</h1>
                  <p className="text-muted-foreground">
                    24/7 Automated marketplace activity
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadStats();
                    loadRealtimeActivity();
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Badge variant="destructive">OWNER ONLY</Badge>
              </div>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <Card className="mb-6 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent animate-pulse" />
                Live Bot Activity (Last 5 Minutes)
              </CardTitle>
              <CardDescription>
                Real-time feed of what bots are doing right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    📝 Recent Projects ({realtimeActivity?.projects?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {realtimeActivity?.projects?.map((p: any) => (
                      <div key={p.id} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Budget: NZD ${p.budget} • {new Date(p.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No recent projects</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    💰 Recent Bids ({realtimeActivity?.bids?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {realtimeActivity?.bids?.map((b: any) => (
                      <div key={b.id} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium">Bid: NZD ${b.amount}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.projects?.title} • {new Date(b.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No recent bids</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    📋 Recent Contracts ({realtimeActivity?.contracts?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {realtimeActivity?.contracts?.map((c: any) => (
                      <div key={c.id} className="text-sm p-2 bg-muted rounded">
                        <p className="font-medium">Contract: NZD ${c.final_amount}</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {c.status} • {new Date(c.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No recent contracts</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Recent Messages ({realtimeActivity?.messages?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {realtimeActivity?.messages?.map((m: any) => (
                      <div key={m.id} className="text-sm p-2 bg-muted rounded">
                        <p className="truncate">{m.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.contains_contact_info && <span className="text-destructive">⚠️ Bypass attempt • </span>}
                          {new Date(m.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No recent messages</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Quick Actions - Generate Activity Now
              </CardTitle>
              <CardDescription>
                Manually trigger bot activity to populate the marketplace immediately
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerateActivity}
                disabled={generatingActivity || !status?.isActive}
                variant="default"
                size="lg"
                className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
              >
                {generatingActivity ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Generating Full Lifecycle...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    🚀 Generate Bot Activity (Full Cycle)
                  </>
                )}
              </Button>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  What happens when you click:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✅ Bots post 3-5 realistic projects across all categories</li>
                  <li>✅ Provider bots submit 5-10 competitive bids</li>
                  <li>✅ Bots send messages (including bypass attempts to test Monalisa)</li>
                  <li>✅ Client bots accept 1-3 bids and create contracts</li>
                  <li>✅ Work gets completed with evidence photos</li>
                  <li>💳 Test payments processed (sandbox mode only)</li>
                </ul>
              </div>
              
              {!status?.isActive && (
                <Alert className="mt-4 border-yellow-500 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                    Enable bot automation below to activate automatic and manual bot activity
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>24/7 Bot Automation</CardTitle>
                    <CardDescription>
                      {status?.isActive 
                        ? "✅ Bots are actively creating marketplace activity every hour"
                        : "⏸️ Automation paused. Bots are inactive."}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={status?.isActive || false}
                    onCheckedChange={handleToggleAutomation}
                    disabled={togglingAutomation}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Schedule:</strong> Hourly (24/7)</p>
                  <p><strong>Bots Active:</strong> {stats?.activeBots || 0}</p>
                  <p><strong>Status:</strong> {status?.isActive ? "🟢 Running" : "🔴 Stopped"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bot Payments (Test Mode)</CardTitle>
                    <CardDescription>
                      {status?.paymentsEnabled
                        ? "✅ Bots can accept bids and process test payments"
                        : "⏸️ Bot payments disabled. Contracts won't be completed."}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={status?.paymentsEnabled || false}
                    onCheckedChange={handleTogglePayments}
                    disabled={togglingPayments}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>✅ Using Stripe Test Mode</p>
                  <p>✅ Random test card numbers</p>
                  <p>✅ No real money involved</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Bots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalBots || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.activeBots || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Projects Posted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.projectsPosted || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  By bots
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Bids Submitted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.bidsSubmitted || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  By bots
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Contracts Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.contractsCreated || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Test transactions
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Bots</CardTitle>
                <CardDescription>
                  Create 50 new bot accounts (80% clients + 20% providers)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateBots}
                  disabled={generatingBots}
                  size="lg"
                  className="w-full"
                >
                  {generatingBots ? "Generating 50 Bots..." : "➕ Generate 50 Bots"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Remove Bots</CardTitle>
                <CardDescription>
                  Delete 50 oldest bots and all their content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleRemoveBots}
                  disabled={removingBots || (stats?.totalBots || 0) === 0}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {removingBots ? "Removing..." : "Remove 50 Bots"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="text-red-600">Kill Switch</CardTitle>
                <CardDescription>
                  ⚠️ Delete ALL bots and content. Disables automation. Cannot be undone!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleKillSwitch}
                  disabled={killingAll || (stats?.totalBots || 0) === 0}
                  size="lg"
                  variant="destructive"
                  className="w-full"
                >
                  <Skull className="w-4 h-4 mr-2" />
                  {killingAll ? "Deleting..." : "Kill All Bots"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}