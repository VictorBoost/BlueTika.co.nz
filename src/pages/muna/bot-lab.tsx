import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot, Trash2, Activity, AlertTriangle, TrendingUp, Zap, Skull, Power } from "lucide-react";
import { botLabService } from "@/services/botLabService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BotLab() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isKilling, setIsKilling] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [isTogglingAutomation, setIsTogglingAutomation] = useState(false);

  useEffect(() => {
    checkOwnerAccess();
  }, []);

  const checkOwnerAccess = async () => {
    setCheckingOwner(true);
    try {
      const hasAccess = await botLabService.checkOwnerAccess();
      setIsOwner(hasAccess);
      
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "Bot Lab is only accessible to the platform owner.",
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

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await botLabService.getBotStats();
      setStats(data);
      
      // Also load automation status
      const status = await botLabService.getAutomationStatus();
      setAutomationStatus(status);
    } catch (error) {
      console.error("Failed to load bot stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleToggleAutomation = async (enabled: boolean) => {
    setIsTogglingAutomation(true);
    try {
      const success = await botLabService.toggleAutomation(enabled);
      
      if (success) {
        toast({
          title: enabled ? "Automation Enabled" : "Automation Disabled",
          description: enabled 
            ? "Daily bot generation will resume at random times"
            : "Daily bot generation has been stopped",
        });
        
        // Reload status
        await loadStats();
      } else {
        toast({
          title: "Toggle Failed",
          description: "Failed to update automation status",
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
      setIsTogglingAutomation(false);
    }
  };

  const handleGenerateBots = async () => {
    setIsGenerating(true);
    try {
      const result = await botLabService.generateBots(50);
      
      toast({
        title: "Bot Generation Complete",
        description: `Successfully created ${result.success} bots. ${result.failed > 0 ? `${result.failed} failed.` : ""}`,
      });

      if (result.errors.length > 0) {
        console.error("Bot generation errors:", result.errors);
      }

      // Reload stats
      await loadStats();
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveBots = async () => {
    setIsRemoving(true);
    try {
      const result = await botLabService.removeBots(50);
      
      toast({
        title: "Bot Removal Complete",
        description: `Successfully removed ${result.success} bots. ${result.failed > 0 ? `${result.failed} failed.` : ""}`,
      });

      if (result.errors.length > 0) {
        console.error("Bot removal errors:", result.errors);
      }

      // Reload stats
      await loadStats();
    } catch (error) {
      toast({
        title: "Removal Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleKillSwitch = async () => {
    setIsKilling(true);
    try {
      const result = await botLabService.killSwitch();
      
      if (result.success) {
        toast({
          title: "Kill Switch Activated",
          description: result.message || `Deleted ${result.deleted} bots and all their content. Automation disabled.`,
        });
      } else {
        toast({
          title: "Kill Switch Failed",
          description: result.error || "An error occurred",
          variant: "destructive"
        });
      }

      // Reload stats
      await loadStats();
    } catch (error) {
      toast({
        title: "Kill Switch Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsKilling(false);
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
        description="Generate and manage test data bots"
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
              <Bot className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Bot Lab</h1>
              <Badge variant="destructive" className="ml-auto">OWNER ONLY</Badge>
            </div>
            <p className="text-muted-foreground">
              Generate realistic test data to populate the marketplace
            </p>
          </div>

          {/* Automation Toggle */}
          <Card className="mb-6 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Power className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle>Automation Control</CardTitle>
                    <CardDescription>
                      {automationStatus?.isActive 
                        ? "Daily bot generation is ACTIVE" 
                        : "Daily bot generation is OFF"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {automationStatus?.isActive ? "ON" : "OFF"}
                  </span>
                  <Switch
                    checked={automationStatus?.isActive || false}
                    onCheckedChange={handleToggleAutomation}
                    disabled={isTogglingAutomation}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Warning Banner */}
          <Alert className="mb-6 border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-600 dark:text-yellow-400">
              Bot accounts create realistic marketplace activity but cannot interact with real users. All bot data is clearly marked and can be batch deleted.
            </AlertDescription>
          </Alert>

          {/* Automation Status Banner */}
          {automationStatus?.isActive && (
            <Alert className="mb-6 border-green-500 bg-green-500/10">
              <Zap className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                ✓ Automation Active — {automationStatus.dailyBotCount} generated daily at random times. Bots automatically post listings, submit bids, accept contracts, and leave reviews.
              </AlertDescription>
            </Alert>
          )}

          {/* Control Panel */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Generate 50 Bots
                </CardTitle>
                <CardDescription>
                  Creates 50 new bot accounts (40% providers, 60% clients) with realistic NZ names, locations, and bios. Bots will post listings, submit bids, create contracts, upload photos, and leave reviews.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateBots}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? "Generating..." : "Generate 50 Bots"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Remove 50 Bots
                </CardTitle>
                <CardDescription>
                  Deletes 50 bot accounts and all their content (listings, bids, contracts, photos, reviews). Real user data is never affected. If fewer than 50 bots exist, removes all remaining bots.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleRemoveBots}
                  disabled={isRemoving || (stats && stats.totalBots === 0)}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  {isRemoving ? "Removing..." : "Remove 50 Bots"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-500 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Skull className="w-5 h-5" />
                  Kill Switch
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-400">
                  ⚠️ DESTRUCTIVE: Permanently deletes ALL bots and ALL their content (listings, bids, contracts, photos, reviews). Disables automation. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isKilling || (stats && stats.totalBots === 0)}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                      size="lg"
                    >
                      {isKilling ? "Deleting All..." : "KILL SWITCH"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Confirm Kill Switch Activation
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p className="font-semibold text-foreground">
                          This will PERMANENTLY DELETE:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>All {stats?.totalBots || 0} bot accounts</li>
                          <li>All project listings posted by bots</li>
                          <li>All bids submitted by bots</li>
                          <li>All contracts involving bots</li>
                          <li>All photos uploaded by bots</li>
                          <li>All reviews left by bots</li>
                          <li>All bot activity logs</li>
                        </ul>
                        <p className="font-semibold text-red-600 dark:text-red-400 mt-4">
                          Automation will be DISABLED. Daily bot generation will stop.
                        </p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          This action cannot be undone. Real user data will NOT be affected.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleKillSwitch}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Bot Analytics
                </CardTitle>
                <Button
                  onClick={loadStats}
                  disabled={loadingStats}
                  variant="outline"
                  size="sm"
                >
                  {loadingStats ? "Loading..." : "Refresh Stats"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!stats && !loadingStats && (
                <p className="text-muted-foreground text-center py-8">
                  Click "Refresh Stats" to load bot analytics
                </p>
              )}

              {loadingStats && (
                <p className="text-muted-foreground text-center py-8">
                  Loading analytics...
                </p>
              )}

              {stats && (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Total Active Bots</p>
                      <p className="text-3xl font-bold">{stats.totalBots}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Provider Bots</p>
                      <p className="text-3xl font-bold text-primary">{stats.providerBots}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Client Bots</p>
                      <p className="text-3xl font-bold text-accent">{stats.clientBots}</p>
                    </div>
                  </div>

                  {/* Error Log */}
                  {Object.keys(stats.errorSummary || {}).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Error Summary
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(stats.errorSummary).map(([error, count]: [string, any]) => (
                          <div key={error} className="flex items-center justify-between bg-muted rounded p-3">
                            <span className="text-sm">{error}</span>
                            <Badge variant="destructive">{count} occurrences</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Errors */}
                  {stats.recentErrors && stats.recentErrors.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Recent Errors (Last 20)</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stats.recentErrors.map((error: any, idx: number) => (
                          <div key={idx} className="text-sm bg-muted rounded p-2">
                            <span className="font-medium">{error.action_type}:</span>{" "}
                            <span className="text-muted-foreground">{error.error_message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.totalBots === 0 && (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No active bots. Click "Generate 50 Bots" to get started.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {automationStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    Automation Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {automationStatus.schedule}
                  </p>
                  <p className="text-muted-foreground">{automationStatus.dailyBotCount}</p>
                  <div className="mt-4 space-y-1">
                    {automationStatus.actions.map((action: string, idx: number) => (
                      <p key={idx}>✓ {action}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bot Behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✓ Bots have realistic NZ names and locations</p>
                <p>✓ Bots post listings with realistic descriptions and pricing</p>
                <p>✓ Bots submit bids on other bots' listings</p>
                <p>✓ Bots accept bids and create contracts</p>
                <p>✓ Bots upload placeholder before/after photos</p>
                <p>✓ Bots leave star ratings and written reviews</p>
                <p>✓ Bots stop at Stripe payment step (no real payments)</p>
                <p>✗ Bots never respond to real user interactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Safety & Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✓ Bot content is fully visible to real users</p>
                <p>✓ Bot accounts look identical to real accounts</p>
                <p>✓ Bots are clearly marked in the database</p>
                <p>✓ All bot data can be batch deleted</p>
                <p>✓ Real user data is never affected by bot operations</p>
                <p>✓ Bot generation is tracked and logged</p>
                <p>✓ Error handling prevents database corruption</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}