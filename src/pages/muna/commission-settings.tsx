import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";

interface CommissionSettings {
  id: string;
  platform_percentage: number;
  base_commission_nzd: number;
  min_commission_nzd: number;
  max_commission_nzd: number;
  high_value_threshold_nzd: number;
  high_value_percentage: number;
  domestic_helper_percentage: number;
  enable_commission: boolean;
  updated_at: string;
}

export default function CommissionSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CommissionSettings | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/muna");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (!profile || profile.email?.toLowerCase() !== "bluetikanz@gmail.com") {
        router.push("/muna");
        return;
      }

      loadSettings();
    } catch (error) {
      console.error("Access check failed:", error);
      router.push("/muna");
    }
  }

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("commission_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newSettings, error: createError } = await supabase
          .from("commission_settings")
          .insert({
            id: "00000000-0000-0000-0000-000000000001",
            platform_percentage: 10,
            base_commission_nzd: 5,
            min_commission_nzd: 2,
            max_commission_nzd: 100,
            high_value_threshold_nzd: 500,
            high_value_percentage: 15,
            domestic_helper_percentage: 5,
            enable_commission: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("commission_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission settings updated successfully",
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
  }

  const updateSetting = (field: keyof CommissionSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <>
        <SEO title="Commission Settings" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (!settings) {
    return (
      <>
        <SEO title="Commission Settings" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Failed to load commission settings.</p>
              <Button onClick={() => router.push("/muna")}>Return to Control Centre</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Commission Settings" />
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.push("/muna")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Control Centre
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Commission Settings</h1>
            <p className="text-muted-foreground mt-2">Configure platform commission rates and rules</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Commission</CardTitle>
                <CardDescription>Default commission rates for standard contracts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Commission</Label>
                    <p className="text-sm text-muted-foreground">Collect commission on contracts</p>
                  </div>
                  <Switch
                    checked={settings.enable_commission}
                    onCheckedChange={(checked) => updateSetting("enable_commission", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platform Percentage (%)</Label>
                  <Input
                    type="number"
                    value={settings.platform_percentage}
                    onChange={(e) => updateSetting("platform_percentage", parseFloat(e.target.value))}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Percentage of contract value taken as commission</p>
                </div>

                <div className="space-y-2">
                  <Label>Base Commission (NZD)</Label>
                  <Input
                    type="number"
                    value={settings.base_commission_nzd}
                    onChange={(e) => updateSetting("base_commission_nzd", parseFloat(e.target.value))}
                    min={0}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">Minimum flat fee per contract</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Commission (NZD)</Label>
                    <Input
                      type="number"
                      value={settings.min_commission_nzd}
                      onChange={(e) => updateSetting("min_commission_nzd", parseFloat(e.target.value))}
                      min={0}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Commission (NZD)</Label>
                    <Input
                      type="number"
                      value={settings.max_commission_nzd}
                      onChange={(e) => updateSetting("max_commission_nzd", parseFloat(e.target.value))}
                      min={0}
                      step={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High-Value Contracts</CardTitle>
                <CardDescription>Special rates for contracts above a certain value</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Threshold (NZD)</Label>
                  <Input
                    type="number"
                    value={settings.high_value_threshold_nzd}
                    onChange={(e) => updateSetting("high_value_threshold_nzd", parseFloat(e.target.value))}
                    min={0}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">Contracts above this value use high-value percentage</p>
                </div>

                <div className="space-y-2">
                  <Label>High-Value Percentage (%)</Label>
                  <Input
                    type="number"
                    value={settings.high_value_percentage}
                    onChange={(e) => updateSetting("high_value_percentage", parseFloat(e.target.value))}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Applied to contracts above threshold</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Domestic Helper Commission</CardTitle>
                <CardDescription>Special reduced rate for domestic helper contracts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Domestic Helper Percentage (%)</Label>
                  <Input
                    type="number"
                    value={settings.domestic_helper_percentage}
                    onChange={(e) => updateSetting("domestic_helper_percentage", parseFloat(e.target.value))}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Lower commission rate for domestic helper services</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={loadSettings}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}