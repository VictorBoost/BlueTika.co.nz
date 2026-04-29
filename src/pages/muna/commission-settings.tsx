import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommissionSettings {
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
  const [settings, setSettings] = useState<CommissionSettings>({
    promo_active: false,
    promo_rate: 0,
    warning_days: 7,
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/verify-admin");
      const data = await response.json();

      if (!data.isAdmin) {
        router.push("/muna");
        return;
      }

      loadSettings();
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/muna");
    }
  }

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("commission_settings")
        .select("*")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newSettings, error: insertError } = await supabase
            .from("commission_settings")
            .insert({
              promo_active: false,
              promo_rate: 0,
              warning_days: 7,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          if (newSettings) setSettings(newSettings);
        } else {
          throw error;
        }
      } else if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load commission settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
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
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Commission settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <>
      <SEO title="Commission Settings" />
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Commission Settings</h1>
              <p className="text-muted-foreground mt-2">Manage promotional rates and tier warnings</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/muna")}>
              Back to Control Centre
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Promotional Rate</CardTitle>
                <CardDescription>Temporary promotional commission rate for special campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Promotional Rate</Label>
                    <p className="text-sm text-muted-foreground">Activate temporary promotional pricing</p>
                  </div>
                  <Switch
                    checked={settings.promo_active}
                    onCheckedChange={(checked) => setSettings({ ...settings, promo_active: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Promotional Rate (%)</Label>
                  <Input
                    type="number"
                    value={settings.promo_rate}
                    onChange={(e) => setSettings({ ...settings, promo_rate: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    step={0.1}
                    disabled={!settings.promo_active}
                  />
                  <p className="text-sm text-muted-foreground">
                    Platform commission percentage during promotional period
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Warning Settings</CardTitle>
                <CardDescription>Configure when to send tier downgrade warnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Warning Days Before Downgrade</Label>
                  <Input
                    type="number"
                    value={settings.warning_days}
                    onChange={(e) => setSettings({ ...settings, warning_days: parseInt(e.target.value) || 7 })}
                    min={1}
                    max={30}
                  />
                  <p className="text-sm text-muted-foreground">
                    Days before tier downgrade to send warning email
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.push("/muna")}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}