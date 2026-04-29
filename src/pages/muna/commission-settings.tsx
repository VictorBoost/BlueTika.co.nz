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
  promo_active: boolean;
  promo_rate: number;
  warning_days: number;
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
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newSettings, error: createError } = await supabase
          .from("commission_settings")
          .insert({
            promo_active: true,
            promo_rate: 8.0,
            warning_days: 7,
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
          promo_active: settings.promo_active,
          promo_rate: settings.promo_rate,
          warning_days: settings.warning_days,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

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
            <p className="text-muted-foreground mt-2">Configure promotional commission rates</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotional Commission</CardTitle>
                <CardDescription>Promotional rates for platform commission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Promotional Rate</Label>
                    <p className="text-sm text-muted-foreground">Apply promotional commission rate</p>
                  </div>
                  <Switch
                    checked={settings.promo_active}
                    onCheckedChange={(checked) => updateSetting("promo_active", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Promotional Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.promo_rate}
                    onChange={(e) => updateSetting("promo_rate", parseFloat(e.target.value))}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Percentage commission during promotional period</p>
                </div>

                <div className="space-y-2">
                  <Label>Warning Days</Label>
                  <Input
                    type="number"
                    value={settings.warning_days}
                    onChange={(e) => updateSetting("warning_days", parseInt(e.target.value))}
                    min={1}
                    max={30}
                  />
                  <p className="text-xs text-muted-foreground">Days before tier drop warning is sent</p>
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