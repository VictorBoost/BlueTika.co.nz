import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { botLabService } from "@/services/botLabService";
import { supabase } from "@/integrations/supabase/client";
import { Play, Square, Trash2, AlertTriangle, Activity, DollarSign } from "lucide-react";

export default function BotLab() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [automation, setAutomation] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [testingPayment, setTestingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<string>("");
  const [generatingBots, setGeneratingBots] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Bot Lab - User:", user?.id);
      
      if (!user) {
        console.log("Bot Lab - No user, redirecting to /muna");
        router.push("/muna");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, is_admin")
        .eq("id", user.id)
        .single();
      
      console.log("Bot Lab - Profile data:", profile);
      console.log("Bot Lab - Email match check:", profile?.email, "===", "bluetikanz@gmail.com", "?", profile?.email === "bluetikanz@gmail.com");
      
      if (!profile || profile.email !== "bluetikanz@gmail.com") {
        console.log("Bot Lab - Access denied, redirecting to /muna");
        router.push("/muna");
        return;
      }
      
      setIsAuthorized(true);
      loadData();
    } catch (error) {
      console.error("Bot Lab - Access check failed:", error);
      router.push("/muna");
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);
    const [automationStatus, botStats] = await Promise.all([
      botLabService.getAutomationStatus(),
      botLabService.getBotStats()
    ]);
    setAutomation(automationStatus);
    setStats(botStats);
    setLoading(false);
  }

  async function toggleAutomation() {
    setLoading(true);
    await botLabService.toggleAutomation(!automation.isActive);
    await loadData();
  }

  async function runManualCycle() {
    setLoading(true);
    try {
      const result = await botLabService.runManualCycle();
      alert(`Cycle complete!\nProjects: ${result.results?.projects}\nBids: ${result.results?.bids}\nContracts: ${result.results?.contracts}\nPayments: ${result.results?.payments}`);
    } catch (error) {
      alert("Manual cycle failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
    await loadData();
  }

  async function testBotPayment() {
    setTestingPayment(true);
    setPaymentResult("");
    try {
      // Get a pending contract
      const { data: contract } = await supabase
        .from("contracts")
        .select("id")
        .eq("payment_status", "pending")
        .limit(1)
        .single();

      if (!contract) {
        setPaymentResult("❌ No pending contracts found to test");
        setTestingPayment(false);
        return;
      }

      const result = await botLabService.testBotPayment(contract.id);
      setPaymentResult(`✅ Payment successful!\nContract: ${result.contractId}\nAmount: $${(result.amount / 100).toFixed(2)}\nPayment Intent: ${result.paymentIntentId}`);
    } catch (error) {
      setPaymentResult(`❌ Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    setTestingPayment(false);
    await loadData();
  }

  async function generateBots() {
    if (!confirm("Generate 50 new bots (40 clients, 10 providers)?")) return;
    
    setGeneratingBots(true);
    try {
      const result = await botLabService.generateBots(50);
      alert(`✅ Generated ${result.success} bots\n❌ Failed: ${result.failed}\n${result.errors.length > 0 ? "\nErrors:\n" + result.errors.join("\n") : ""}`);
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    setGeneratingBots(false);
    await loadData();
  }

  async function removeBots() {
    if (!confirm("Remove 50 oldest bots and all their data?")) return;
    
    setLoading(true);
    try {
      const result = await botLabService.removeBots(50);
      alert(`✅ Removed ${result.success} bots\n❌ Failed: ${result.failed}\n${result.errors.length > 0 ? "\nErrors:\n" + result.errors.slice(0, 5).join("\n") : ""}`);
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    setLoading(false);
    await loadData();
  }

  async function killSwitch() {
    if (!confirm("⚠️ WARNING: This will DELETE ALL BOTS and their data. Are you absolutely sure?")) return;
    if (!confirm("FINAL WARNING: This action CANNOT be undone. Continue?")) return;
    
    setLoading(true);
    const result = await botLabService.killSwitch();
    alert(result.success ? `✅ Deleted ${result.deleted} bots` : `❌ Error: ${result.error}`);
    await loadData();
  }

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">🤖 Bot Automation Lab</h1>
          <div className="flex gap-2">
            <Button
              onClick={generateBots}
              variant="outline"
              disabled={generatingBots}
            >
              {generatingBots ? "Generating..." : "Generate 50 Bots"}
            </Button>
            <Button
              onClick={removeBots}
              variant="outline"
              disabled={loading}
            >
              Remove 50 Bots
            </Button>
            <Button
              onClick={toggleAutomation}
              variant={automation?.isActive ? "destructive" : "default"}
            >
              {automation?.isActive ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {automation?.isActive ? "Stop Automation" : "Start Automation"}
            </Button>
            <Button onClick={killSwitch} variant="outline" className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Kill Switch
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Automation Status
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                automation?.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              }`}>
                {automation?.isActive ? "🟢 Active" : "⚪ Inactive"}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Bots</div>
                <div className="text-2xl font-bold">{stats?.totalBots || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Clients</div>
                <div className="text-2xl font-bold text-blue-400">{stats?.clientBots || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Providers</div>
                <div className="text-2xl font-bold text-teal-400">{stats?.providerBots || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Active Projects</div>
                <div className="text-2xl font-bold text-purple-400">{stats?.totalProjects || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Bids</div>
                <div className="text-2xl font-bold text-orange-400">{stats?.totalBids || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Active Contracts</div>
                <div className="text-2xl font-bold text-yellow-400">{stats?.totalContracts || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Paid Contracts</div>
                <div className="text-2xl font-bold text-green-400">{stats?.paidContracts || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Reviews Submitted</div>
                <div className="text-2xl font-bold text-pink-400">{stats?.totalReviews || 0}</div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold">Automation Workflow:</h3>
              {automation?.actions?.map((action: string, i: number) => (
                <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-xs">{i + 1}.</span>
                  {action}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={runManualCycle} variant="outline" className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Run Manual Cycle
              </Button>
              <Button 
                onClick={testBotPayment} 
                variant="outline" 
                className="flex-1"
                disabled={testingPayment}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {testingPayment ? "Testing..." : "Test Payment"}
              </Button>
            </div>

            {paymentResult && (
              <Alert>
                <AlertDescription className="whitespace-pre-wrap font-mono text-sm">
                  {paymentResult}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* Error Summary */}
        {stats?.errorSummary && Object.keys(stats.errorSummary).length > 0 && (
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Error Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.errorSummary).map(([type, count]) => (
                  <div key={type} className="space-y-1">
                    <div className="text-sm text-muted-foreground">{type}</div>
                    <div className="text-2xl font-bold text-yellow-400">{count as number}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Recent Errors */}
        {stats?.recentErrors && stats.recentErrors.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.recentErrors.slice(0, 20).map((error: any, i: number) => (
                <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium text-destructive">{error.action_type}</div>
                  <div className="text-muted-foreground">{error.error_message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(error.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}