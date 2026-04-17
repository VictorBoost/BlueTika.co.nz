import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  getCommissionTiers,
  getCommissionSettings,
  updateCommissionTier,
  updateCommissionSettings,
  type CommissionTier,
  type CommissionSettings,
} from "@/services/commissionService";
import { getProfile } from "@/services/profileService";
import type { Database } from "@/integrations/supabase/types";
import { isAdminUser } from "@/services/controlCentreService";
import { SEO } from "@/components/SEO";
import { getAdminUserInfo } from "@/services/controlCentreService";
import { supabase } from "@/integrations/supabase/client";

export default function CommissionSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [settings, setSettings] = useState<CommissionSettings | null>(null);
  const [editedTiers, setEditedTiers] = useState<Record<string, Partial<CommissionTier>>>({});
  const [editedSettings, setEditedSettings] = useState<Partial<CommissionSettings>>({});

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // STRICT OWNER CHECK: Only bluetikanz@gmail.com can access this page
    if (!user || user.email !== "bluetikanz@gmail.com") {
      router.push("/muna");
      return;
    }

    await loadData();
  }

  async function loadData() {
    setLoading(true);
    try {
      const [tiersData, settingsData] = await Promise.all([
        getCommissionTiers(),
        getCommissionSettings(),
      ]);
      setTiers(tiersData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Error loading commission data:", error);
      toast({
        title: "Error",
        description: "Failed to load commission settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleTierChange = (tierId: string, field: string, value: string | number) => {
    setEditedTiers({
      ...editedTiers,
      [tierId]: {
        ...editedTiers[tierId],
        [field]: field.includes("sales") || field === "standard_rate" ? Number(value) : value,
      },
    });
  };

  const handleSettingsChange = (field: string, value: boolean | number) => {
    setEditedSettings({
      ...editedSettings,
      [field]: value,
    });
  };

  const handleSaveTier = async (tierId: string) => {
    try {
      const updates = editedTiers[tierId];
      if (!updates || Object.keys(updates).length === 0) return;

      await updateCommissionTier(tierId, updates);
      
      const updatedTiers = await getCommissionTiers();
      setTiers(updatedTiers);
      
      const newEdited = { ...editedTiers };
      delete newEdited[tierId];
      setEditedTiers(newEdited);

      toast({
        title: "Success",
        description: "Tier settings updated",
      });
    } catch (error) {
      console.error("Error saving tier:", error);
      toast({
        title: "Error",
        description: "Failed to update tier settings",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (Object.keys(editedSettings).length === 0) return;

      await updateCommissionSettings(editedSettings);
      
      const updatedSettings = await getCommissionSettings();
      setSettings(updatedSettings);
      setEditedSettings({});

      toast({
        title: "Success",
        description: "Commission settings updated",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to update commission settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const currentPromoActive = editedSettings.promo_active ?? settings?.promo_active ?? false;
  const currentPromoRate = editedSettings.promo_rate ?? settings?.promo_rate ?? 8;
  const currentWarningDays = editedSettings.warning_days ?? settings?.warning_days ?? 7;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Commission Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage commission tiers, rates, and promotional settings
            </p>
          </div>

          {/* Promo Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Promotional Settings</CardTitle>
              <CardDescription>
                Configure promotional commission rates for all tiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promotional Rate Active</Label>
                  <p className="text-sm text-muted-foreground">
                    When active, all tiers use the promotional rate
                  </p>
                </div>
                <Switch
                  checked={currentPromoActive}
                  onCheckedChange={(checked) => handleSettingsChange("promo_active", checked)}
                />
              </div>

              {currentPromoActive && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Promotional Rate (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={currentPromoRate}
                        onChange={(e) => handleSettingsChange("promo_rate", Number(e.target.value))}
                        className="max-w-[120px]"
                      />
                      <Badge variant="destructive">PROMO</Badge>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Tier Drop Warning (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={currentWarningDays}
                  onChange={(e) => handleSettingsChange("warning_days", Number(e.target.value))}
                  className="max-w-[120px]"
                />
                <p className="text-sm text-muted-foreground">
                  Days before tier drop to send warning email
                </p>
              </div>

              {Object.keys(editedSettings).length > 0 && (
                <Button onClick={handleSaveSettings} className="w-full">
                  Save Settings
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tier Configuration */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Tier Configuration</h2>
            {tiers.map((tier) => {
              const edited = editedTiers[tier.id] || {};
              const displayName = edited.display_name ?? tier.display_name;
              const minSales = edited.min_sales ?? tier.min_sales;
              const maxSales = edited.max_sales ?? tier.max_sales;
              const standardRate = edited.standard_rate ?? tier.standard_rate;
              const hasChanges = Object.keys(edited).length > 0;

              return (
                <Card key={tier.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {displayName}
                      {tier.tier_name === "platinum" && (
                        <Badge variant="secondary">Highest Tier</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      60-day sales: ${minSales.toFixed(2)}
                      {maxSales ? ` - $${maxSales.toFixed(2)}` : "+"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input
                          value={displayName}
                          onChange={(e) => handleTierChange(tier.id, "display_name", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Standard Rate (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={standardRate}
                            onChange={(e) => handleTierChange(tier.id, "standard_rate", e.target.value)}
                          />
                          {currentPromoActive && (
                            <Badge variant="outline" className="text-xs">
                              Currently {currentPromoRate}% (promo)
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Minimum Sales ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={minSales}
                          onChange={(e) => handleTierChange(tier.id, "min_sales", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Maximum Sales ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={maxSales || ""}
                          placeholder="No limit"
                          onChange={(e) =>
                            handleTierChange(tier.id, "max_sales", e.target.value || null)
                          }
                        />
                      </div>
                    </div>

                    {hasChanges && (
                      <Button onClick={() => handleSaveTier(tier.id)} className="w-full">
                        Save {displayName} Settings
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}