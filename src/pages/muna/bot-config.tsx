import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BotConfig {
  id: string;
  project_posting_interval: number;
  bid_submission_interval: number;
  bid_acceptance_interval: number;
  payment_processing_interval: number;
  work_completion_interval: number;
  projects_per_cycle: number;
  bids_per_cycle: number;
  accepts_per_cycle: number;
  payments_per_cycle: number;
  daily_bot_generation: number;
  max_total_bots: number;
  activity_start_hour: number;
  activity_end_hour: number;
  auto_post_projects: boolean;
  auto_submit_bids: boolean;
  auto_accept_bids: boolean;
  auto_process_payments: boolean;
  auto_complete_work: boolean;
  auto_submit_reviews: boolean;
}

export default function BotConfigPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bot_configuration")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Create default config if it doesn't exist
        const { data: newConfig, error: createError } = await supabase
          .from("bot_configuration")
          .insert({
            id: "00000000-0000-0000-0000-000000000001",
            project_posting_interval: 30,
            bid_submission_interval: 15,
            bid_acceptance_interval: 20,
            payment_processing_interval: 10,
            work_completion_interval: 45,
            projects_per_cycle: 5,
            bids_per_cycle: 10,
            accepts_per_cycle: 3,
            payments_per_cycle: 5,
            daily_bot_generation: 50,
            max_total_bots: 2000,
            activity_start_hour: 0,
            activity_end_hour: 23,
            auto_post_projects: true,
            auto_submit_bids: true,
            auto_accept_bids: true,
            auto_process_payments: true,
            auto_complete_work: true,
            auto_submit_reviews: true,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setConfig(newConfig);
      } else {
        setConfig(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_configuration")
        .update({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bot configuration updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerBotCycle = async () => {
    setTriggering(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("hourly-bot-cycle");
      
      if (error) throw error;
      
      setLastResult(data);
      
      toast({
        title: "✅ Bot Cycle Complete",
        description: `Projects: ${data.results?.projects || 0}, Bids: ${data.results?.bids || 0}, Contracts: ${data.results?.contracts || 0}, Payments: ${data.results?.payments || 0}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger bot cycle",
        variant: "destructive",
      });
    } finally {
      setTriggering(false);
    }
  };

  const updateConfig = (field: keyof BotConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading || !config) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bot Configuration</h1>
          <p className="text-muted-foreground">Adjust bot activity frequency and intensity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/muna")}>
            Back to Control Centre
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* Manual Trigger & Automation Status */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Bot Automation Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">Manual Bot Cycle Trigger</p>
              <p className="text-sm text-muted-foreground">Run a complete bot activity cycle now</p>
            </div>
            <Button onClick={handleTriggerBotCycle} disabled={triggering} size="lg">
              {triggering ? "Running..." : "▶ Run Bot Cycle Now"}
            </Button>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
            <p className="font-semibold text-blue-300">🕐 Automatic Execution Status</p>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p className="text-green-400">✅ Cron job configured: Runs every hour automatically</p>
              <p>Next run: Top of the next hour (XX:00)</p>
              <p className="text-xs mt-2">The bot cycle will run automatically every hour. You can also trigger it manually above for immediate testing.</p>
            </div>
          </div>

          {lastResult && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
              <p className="font-semibold text-green-300">✅ Last Execution Results</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Projects Posted</p>
                  <p className="text-xl font-bold">{lastResult.results?.projects || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bids Submitted</p>
                  <p className="text-xl font-bold">{lastResult.results?.bids || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contracts Created</p>
                  <p className="text-xl font-bold">{lastResult.results?.contracts || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payments Processed</p>
                  <p className="text-xl font-bold">{lastResult.results?.payments || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Work Completed</p>
                  <p className="text-xl font-bold">{lastResult.results?.completed || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Funds Released</p>
                  <p className="text-xl font-bold">{lastResult.results?.fundReleases || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto-Release Queue</p>
                  <p className="text-xl font-bold">{lastResult.results?.awaitingAutoRelease || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Errors</p>
                  <p className="text-xl font-bold text-red-400">{lastResult.results?.errors?.length || 0}</p>
                </div>
              </div>
              {lastResult.results?.errors && lastResult.results.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-xs">
                  <p className="font-semibold text-red-300 mb-2">Errors:</p>
                  <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                    {lastResult.results.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Frequency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>⏱️ Frequency Settings</CardTitle>
            <CardDescription>Time intervals between bot actions (in minutes)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Posting Interval</Label>
              <Input
                type="number"
                value={config.project_posting_interval}
                onChange={(e) => updateConfig("project_posting_interval", parseInt(e.target.value))}
                min={5}
                max={120}
              />
              <p className="text-xs text-muted-foreground">Minutes between posting new projects</p>
            </div>

            <div className="space-y-2">
              <Label>Bid Submission Interval</Label>
              <Input
                type="number"
                value={config.bid_submission_interval}
                onChange={(e) => updateConfig("bid_submission_interval", parseInt(e.target.value))}
                min={5}
                max={60}
              />
              <p className="text-xs text-muted-foreground">Minutes between submitting bids</p>
            </div>

            <div className="space-y-2">
              <Label>Bid Acceptance Interval</Label>
              <Input
                type="number"
                value={config.bid_acceptance_interval}
                onChange={(e) => updateConfig("bid_acceptance_interval", parseInt(e.target.value))}
                min={5}
                max={60}
              />
              <p className="text-xs text-muted-foreground">Minutes between accepting bids</p>
            </div>

            <div className="space-y-2">
              <Label>Payment Processing Interval</Label>
              <Input
                type="number"
                value={config.payment_processing_interval}
                onChange={(e) => updateConfig("payment_processing_interval", parseInt(e.target.value))}
                min={5}
                max={60}
              />
              <p className="text-xs text-muted-foreground">Minutes between processing payments</p>
            </div>

            <div className="space-y-2">
              <Label>Work Completion Interval</Label>
              <Input
                type="number"
                value={config.work_completion_interval}
                onChange={(e) => updateConfig("work_completion_interval", parseInt(e.target.value))}
                min={10}
                max={120}
              />
              <p className="text-xs text-muted-foreground">Minutes between completing work</p>
            </div>
          </CardContent>
        </Card>

        {/* Intensity Settings */}
        <Card>
          <CardHeader>
            <CardTitle>🔥 Intensity Settings</CardTitle>
            <CardDescription>How many actions to perform per cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Projects Per Cycle</Label>
              <Input
                type="number"
                value={config.projects_per_cycle}
                onChange={(e) => updateConfig("projects_per_cycle", parseInt(e.target.value))}
                min={1}
                max={50}
              />
              <p className="text-xs text-muted-foreground">Number of projects to post per cycle</p>
            </div>

            <div className="space-y-2">
              <Label>Bids Per Cycle</Label>
              <Input
                type="number"
                value={config.bids_per_cycle}
                onChange={(e) => updateConfig("bids_per_cycle", parseInt(e.target.value))}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground">Number of bids to submit per cycle</p>
            </div>

            <div className="space-y-2">
              <Label>Accepts Per Cycle</Label>
              <Input
                type="number"
                value={config.accepts_per_cycle}
                onChange={(e) => updateConfig("accepts_per_cycle", parseInt(e.target.value))}
                min={1}
                max={20}
              />
              <p className="text-xs text-muted-foreground">Number of bids to accept per cycle</p>
            </div>

            <div className="space-y-2">
              <Label>Payments Per Cycle</Label>
              <Input
                type="number"
                value={config.payments_per_cycle}
                onChange={(e) => updateConfig("payments_per_cycle", parseInt(e.target.value))}
                min={1}
                max={30}
              />
              <p className="text-xs text-muted-foreground">Number of payments to process per cycle</p>
            </div>

            <div className="space-y-2">
              <Label>Daily Bot Generation</Label>
              <Input
                type="number"
                value={config.daily_bot_generation}
                onChange={(e) => updateConfig("daily_bot_generation", parseInt(e.target.value))}
                min={0}
                max={200}
              />
              <p className="text-xs text-muted-foreground">New bots to generate per day</p>
            </div>

            <div className="space-y-2">
              <Label>Maximum Total Bots</Label>
              <Input
                type="number"
                value={config.max_total_bots}
                onChange={(e) => updateConfig("max_total_bots", parseInt(e.target.value))}
                min={100}
                max={10000}
              />
              <p className="text-xs text-muted-foreground">Maximum number of bots allowed</p>
            </div>
          </CardContent>
        </Card>

        {/* Activity Hours */}
        <Card>
          <CardHeader>
            <CardTitle>🕐 Activity Hours</CardTitle>
            <CardDescription>When bots should be active (24-hour format)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Start Hour (0-23)</Label>
              <Input
                type="number"
                value={config.activity_start_hour}
                onChange={(e) => updateConfig("activity_start_hour", parseInt(e.target.value))}
                min={0}
                max={23}
              />
              <p className="text-xs text-muted-foreground">Hour to start bot activity</p>
            </div>

            <div className="space-y-2">
              <Label>End Hour (0-23)</Label>
              <Input
                type="number"
                value={config.activity_end_hour}
                onChange={(e) => updateConfig("activity_end_hour", parseInt(e.target.value))}
                min={0}
                max={23}
              />
              <p className="text-xs text-muted-foreground">Hour to end bot activity</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Current Schedule:</strong><br />
                Bots active from {config.activity_start_hour}:00 to {config.activity_end_hour}:00
                {config.activity_start_hour === 0 && config.activity_end_hour === 23 && (
                  <span className="text-success"> (24/7)</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Automation Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Automation Toggles</CardTitle>
            <CardDescription>Enable/disable specific bot actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Post Projects</Label>
                <p className="text-xs text-muted-foreground">Automatically post new projects</p>
              </div>
              <Switch
                checked={config.auto_post_projects}
                onCheckedChange={(checked) => updateConfig("auto_post_projects", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Submit Bids</Label>
                <p className="text-xs text-muted-foreground">Automatically submit bids on projects</p>
              </div>
              <Switch
                checked={config.auto_submit_bids}
                onCheckedChange={(checked) => updateConfig("auto_submit_bids", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Accept Bids</Label>
                <p className="text-xs text-muted-foreground">Automatically accept incoming bids</p>
              </div>
              <Switch
                checked={config.auto_accept_bids}
                onCheckedChange={(checked) => updateConfig("auto_accept_bids", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Process Payments</Label>
                <p className="text-xs text-muted-foreground">Automatically process Stripe payments</p>
              </div>
              <Switch
                checked={config.auto_process_payments}
                onCheckedChange={(checked) => updateConfig("auto_process_payments", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Complete Work</Label>
                <p className="text-xs text-muted-foreground">Automatically complete contracted work</p>
              </div>
              <Switch
                checked={config.auto_complete_work}
                onCheckedChange={(checked) => updateConfig("auto_complete_work", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Submit Reviews</Label>
                <p className="text-xs text-muted-foreground">Automatically submit reviews after completion</p>
              </div>
              <Switch
                checked={config.auto_submit_reviews}
                onCheckedChange={(checked) => updateConfig("auto_submit_reviews", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>📊 Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cycle Frequency</p>
              <p className="font-semibold">
                ~{Math.min(
                  config.project_posting_interval,
                  config.bid_submission_interval,
                  config.bid_acceptance_interval
                )} minutes
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Actions Per Hour</p>
              <p className="font-semibold">
                ~{Math.floor(
                  (config.projects_per_cycle * 60) / config.project_posting_interval +
                  (config.bids_per_cycle * 60) / config.bid_submission_interval +
                  (config.accepts_per_cycle * 60) / config.bid_acceptance_interval
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Hours</p>
              <p className="font-semibold">
                {config.activity_end_hour - config.activity_start_hour + 1} hours/day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}