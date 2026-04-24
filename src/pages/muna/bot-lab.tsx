import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, Activity, Zap, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Skull, Trash2 } from "lucide-react";
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

  useEffect(() => {
    checkOwnerAccess();
    loadStatus();
    loadStats();
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

      // Owner check - if user is admin, they can access Bot Lab
      // Bot Lab is accessible to all admins, but especially the owner
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
      } else {
        throw new Error(result.error || "Kill switch failed");
      }
      
      await loadStatus();
      await loadStats();
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

  const handleTriggerProjects = async () => {
    setTriggeringProjects(true);
    try {
      const { data, error } = await supabase.functions.invoke("bot-post-projects");
      
      if (error) throw error;
      
      toast({
        title: "Projects Posted!",
        description: `Bots created ${data?.created || 0} realistic projects on the marketplace!`,
      });
      
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger project posting",
        variant: "destructive",
      });
    } finally {
      setTriggeringProjects(false);
    }
  };

  const handleTriggerBids = async () => {
    setTriggeringBids(true);
    try {
      const { data, error } = await supabase.functions.invoke("bot-submit-bids");
      
      if (error) throw error;
      
      toast({
        title: "Bids Submitted!",
        description: `Bots submitted ${data?.created || 0} competitive bids!`,
      });
      
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger bid submission",
        variant: "destructive",
      });
    } finally {
      setTriggeringBids(false);
    }
  };

  const handleTriggerPayments = async () => {
    setTriggeringPayments(true);
    try {
      const { data: acceptData, error: acceptError } = await supabase.functions.invoke("bot-accept-bids");
      if (acceptError) throw acceptError;

      const { data: payData, error: payError } = await supabase.functions.invoke("bot-complete-contracts");
      if (payError) throw payError;
      
      toast({
        title: "Bot Transactions Complete!",
        description: `Accepted ${acceptData?.accepted || 0} bids and processed ${payData?.paid || 0} test payments!`,
      });
      
      await loadStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process transactions",
        variant: "destructive",
      });
    } finally {
      setTriggeringPayments(false);
    }
  };

  const handleGenerateActivity = async () => {
    setGeneratingActivity(true);
    
    try {
      let totalProjects = 0;
      let totalBids = 0;
      let totalContracts = 0;
      let totalPayments = 0;

      toast({
        title: "Generating Bot Activity",
        description: "Step 1/4: Posting projects...",
      });

      // Step 1: Post projects
      const { data: projectData, error: projectError } = await supabase.functions.invoke("bot-post-projects");
      if (projectError) {
        console.error("Project error:", projectError);
        throw new Error(`Projects failed: ${projectError.message}`);
      }
      totalProjects = projectData?.created || 0;
      console.log(`Projects created: ${totalProjects}`);

      toast({
        title: "Projects Created!",
        description: `Step 2/4: Submitting bids on ${totalProjects} projects...`,
      });

      // Wait for projects to be indexed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Submit bids
      const { data: bidData, error: bidError } = await supabase.functions.invoke("bot-submit-bids");
      if (bidError) {
        console.error("Bid error:", bidError);
        throw new Error(`Bids failed: ${bidError.message}`);
      }
      totalBids = bidData?.created || 0;
      console.log(`Bids submitted: ${totalBids}`);

      toast({
        title: "Bids Submitted!",
        description: `Step 3/4: Creating contracts...`,
      });

      // Wait for bids to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Accept bids and create contracts
      const { data: contractData, error: contractError } = await supabase.functions.invoke("bot-accept-bids");
      if (contractError) {
        console.error("Contract error:", contractError);
        throw new Error(`Contracts failed: ${contractError.message}`);
      }
      totalContracts = contractData?.accepted || 0;
      console.log(`Contracts created: ${totalContracts}`);

      // Step 4: Process payments (if enabled)
      if (status?.paymentsEnabled) {
        toast({
          title: "Contracts Created!",
          description: `Step 4/4: Processing test payments...`,
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: paymentData, error: paymentError } = await supabase.functions.invoke("bot-complete-contracts");
        if (paymentError) {
          console.error("Payment error:", paymentError);
          // Don't throw - payments are optional
          console.warn("Payments failed but continuing:", paymentError.message);
        } else {
          totalPayments = paymentData?.paid || 0;
          console.log(`Payments processed: ${totalPayments}`);
        }
      }

      // Success!
      const summary = [
        `${totalProjects} projects`,
        `${totalBids} bids`,
        `${totalContracts} contracts`
      ];
      
      if (status?.paymentsEnabled && totalPayments > 0) {
        summary.push(`${totalPayments} payments`);
      }

      toast({
        title: "✅ Bot Activity Generated!",
        description: `Created ${summary.join(", ")}!`,
      });

      await loadStats();
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
                    Automated marketplace activity and testing
                  </p>
                </div>
              </div>
              <Badge variant="destructive">OWNER ONLY</Badge>
            </div>
          </div>

          <Card className="mb-6 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                Quick Actions - Activate Marketplace Now
              </CardTitle>
              <CardDescription>
                Manually trigger bot activity to make your marketplace busy and active immediately
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
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
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      🚀 Generate Bot Activity
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleTriggerProjects}
                  disabled={triggeringProjects || !status?.isActive}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {triggeringProjects ? "Posting..." : "📝 Post Projects"}
                </Button>
                
                <Button
                  onClick={handleTriggerBids}
                  disabled={triggeringBids || !status?.isActive}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {triggeringBids ? "Bidding..." : "💰 Submit Bids"}
                </Button>
                
                <Button
                  onClick={handleTriggerPayments}
                  disabled={triggeringPayments || !status?.isActive || !status?.paymentsEnabled}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {triggeringPayments ? "Processing..." : "💳 Accept & Pay"}
                </Button>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Automatic Bot Activity:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>🤖 Bots automatically create projects every 3-6 hours (randomized)</li>
                  <li>💼 Provider bots submit competitive bids on new projects</li>
                  <li>✅ Client bots accept winning bids and create contracts</li>
                  <li>💳 Sandbox Stripe payments processed (test mode only)</li>
                  <li>⚡ Manual trigger: Use "Generate Bot Activity" button above</li>
                </ul>
              </div>
              
              {!status?.isActive && (
                <Alert className="mt-4 border-yellow-500 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                    Enable bot automation above to activate automatic and manual bot activity
                  </AlertDescription>
                </Alert>
              )}

              {!status?.paymentsEnabled && status?.isActive && (
                <Alert className="mt-4 border-blue-500 bg-blue-500/10">
                  <AlertDescription className="text-blue-600 dark:text-blue-400">
                    Bot payments are disabled. Enable to allow contract acceptance and test payments.
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
                    <CardTitle>Bot Automation</CardTitle>
                    <CardDescription>
                      {status?.isActive 
                        ? "Bots are actively creating marketplace activity"
                        : "Automation is paused. Bots are inactive."}
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
                  <p><strong>Schedule:</strong> {status?.schedule}</p>
                  <p><strong>Daily Count:</strong> {status?.dailyBotCount}</p>
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Actions:</p>
                    <ul className="space-y-1">
                      {status?.actions?.map((action: string, idx: number) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
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
                        ? "Bots can accept bids and process test payments"
                        : "Bot payments disabled. Contracts won't be completed."}
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
                  <p className="mt-4">
                    <strong>Test Cards Used:</strong>
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>4242424242424242 (Visa)</li>
                    <li>5555555555554444 (Mastercard)</li>
                    <li>378282246310005 (Amex)</li>
                    <li>6011111111111117 (Discover)</li>
                  </ul>
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
                  Contracts Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.contractsCreated || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Test payments
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Bots</CardTitle>
                <CardDescription>
                  Create 50 new bot accounts (80% clients who post projects + 20% providers)
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
                  Delete 50 oldest bots and all their content (projects, bids, contracts)
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