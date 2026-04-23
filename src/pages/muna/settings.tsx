import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsIcon, DollarSign, Percent, Shield, Mail, Tag, AlertTriangle, Plus, Edit, Trash2, GripVertical, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { settingsService } from "@/services/settingsService";
import { emailLogService } from "@/services/emailLogService";
import { categoryService } from "@/services/categoryService";

interface Settings {
  commission_rates?: any;
  tier_thresholds?: any;
  client_platform_fee?: number;
  stripe_domestic_contribution?: number;
  stripe_international_contribution?: number;
  gst_enabled?: boolean;
  gst_percentage?: number;
  subscription_prices?: any;
  moderation_switches?: any;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Settings state
  const [commissionRates, setCommissionRates] = useState({
    bronze: 12,
    silver: 10,
    gold: 8,
    platinum: 6,
    promo_active: false,
  });
  const [tierThresholds, setTierThresholds] = useState({
    bronze: 0,
    silver: 5000,
    gold: 15000,
    platinum: 30000,
  });
  const [clientPlatformFee, setClientPlatformFee] = useState(2);
  const [stripeDomestic, setStripeDomestic] = useState(0);
  const [stripeInternational, setStripeInternational] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(15);
  const [subscriptionPrices, setSubscriptionPrices] = useState({
    remove_logo: 5,
    email_hosting: 5,
    custom_url: 5,
    additional_staff: 2,
  });
  const [moderationSwitches, setModerationSwitches] = useState({
    content_safety_enabled: true,
    auto_suspend_enabled: true,
    ai_verification_enabled: true,
  });

  // Category management
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });

  // Email logs
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
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

      setIsAdmin(true);
      await loadSettings();
    } catch (error) {
      console.error("Admin verification error:", error);
      router.push("/muna");
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [
        commissionData,
        thresholdData,
        feeData,
        domesticData,
        internationalData,
        gstData,
        subscriptionData,
        moderationData,
        categoriesData,
        emailData,
      ] = await Promise.all([
        settingsService.getSetting("commission_rates"),
        settingsService.getSetting("tier_thresholds"),
        settingsService.getSetting("client_platform_fee"),
        settingsService.getSetting("stripe_domestic_contribution"),
        settingsService.getSetting("stripe_international_contribution"),
        settingsService.getSetting("gst_settings"),
        // Fetch subscription prices from subscription_plans table
        supabase
          .from("subscription_plans")
          .select("feature_key, monthly_price")
          .eq("is_active", true),
        settingsService.getSetting("moderation_switches"),
        (categoryService as any).getAllCategories ? (categoryService as any).getAllCategories() : (categoryService as any).getCategories ? (categoryService as any).getCategories() : Promise.resolve({ data: [] }),
        emailLogService.getEmailLogs(50),
      ]);

      if (commissionData) setCommissionRates(commissionData);
      if (thresholdData) setTierThresholds(thresholdData);
      if (feeData) setClientPlatformFee(feeData);
      if (domesticData) setStripeDomestic(domesticData);
      if (internationalData) setStripeInternational(internationalData);
      if (gstData) {
        setGstEnabled(gstData.enabled || false);
        setGstPercentage(gstData.percentage || 15);
      }
      
      // Map subscription_plans data to subscriptionPrices state
      if (subscriptionData && 'data' in subscriptionData && subscriptionData.data) {
        const priceMap = {
          remove_logo: 5,
          email_hosting: 5,
          custom_url: 5,
          additional_staff: 2,
        };
        
        subscriptionData.data.forEach((plan: any) => {
          const price = typeof plan.monthly_price === 'string' ? parseFloat(plan.monthly_price) : plan.monthly_price;
          switch (plan.feature_key) {
            case "remove_logo":
              priceMap.remove_logo = price;
              break;
            case "email_hosting":
              priceMap.email_hosting = price;
              break;
            case "custom_url":
              priceMap.custom_url = price;
              break;
            case "staff_member":
              priceMap.additional_staff = price;
              break;
          }
        });
        
        setSubscriptionPrices(priceMap);
      } else if (subscriptionData && !('error' in subscriptionData) && !('data' in subscriptionData)) {
        // Fallback if it came from settings
        setSubscriptionPrices(subscriptionData as any);
      }
      
      if (moderationData) setModerationSwitches(moderationData);
      setCategories(categoriesData?.data || categoriesData || []);
      setEmailLogs(emailData);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCommission = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateSetting("commission_rates", commissionRates);
      await settingsService.updateSetting("tier_thresholds", tierThresholds);
      toast({
        title: "Saved",
        description: "Commission settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving commission settings:", error);
      toast({
        title: "Error",
        description: "Failed to save commission settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFees = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateSetting("client_platform_fee", clientPlatformFee);
      await settingsService.updateSetting("stripe_domestic_contribution", stripeDomestic);
      await settingsService.updateSetting("stripe_international_contribution", stripeInternational);
      toast({
        title: "Saved",
        description: "Fee settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving fee settings:", error);
      toast({
        title: "Error",
        description: "Failed to save fee settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGST = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateSetting("gst_settings", { enabled: gstEnabled, percentage: gstPercentage });
      toast({
        title: "Saved",
        description: "GST settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving GST settings:", error);
      toast({
        title: "Error",
        description: "Failed to save GST settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubscriptions = async () => {
    setIsSaving(true);
    try {
      // Update subscription_plans table directly
      await Promise.all([
        supabase
          .from("subscription_plans")
          .update({ monthly_price: subscriptionPrices.remove_logo })
          .eq("feature_key", "remove_logo"),
        supabase
          .from("subscription_plans")
          .update({ monthly_price: subscriptionPrices.email_hosting })
          .eq("feature_key", "email_hosting"),
        supabase
          .from("subscription_plans")
          .update({ monthly_price: subscriptionPrices.custom_url })
          .eq("feature_key", "custom_url"),
        supabase
          .from("subscription_plans")
          .update({ monthly_price: subscriptionPrices.additional_staff })
          .eq("feature_key", "staff_member"),
      ]);

      // Also save to platform_settings for backup
      await settingsService.updateSetting("subscription_prices", subscriptionPrices);
      
      toast({
        title: "Saved",
        description: "Subscription prices updated successfully",
      });
    } catch (error) {
      console.error("Error saving subscription prices:", error);
      toast({
        title: "Error",
        description: "Failed to save subscription prices",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveModeration = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateSetting("moderation_switches", moderationSwitches);
      toast({
        title: "Saved",
        description: "Moderation settings updated successfully",
      });
    } catch (error) {
      console.error("Error saving moderation settings:", error);
      toast({
        title: "Error",
        description: "Failed to save moderation settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        await (categoryService as any).updateCategory(editingCategory.id, categoryForm.name);
        toast({
          title: "Updated",
          description: "Category updated successfully",
        });
      } else {
        await (categoryService as any).createCategory(categoryForm.name);
        toast({
          title: "Created",
          description: "Category created successfully",
        });
      }

      setCategoryDialogOpen(false);
      setCategoryForm({ name: "", description: "" });
      setEditingCategory(null);
      await loadSettings();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure? This will also delete all subcategories.")) return;

    try {
      await categoryService.deleteCategory(id);
      toast({
        title: "Deleted",
        description: "Category deleted successfully",
      });
      await loadSettings();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAdmin) return null;

  return (
    <>
      <SEO title="Platform Settings - BlueTika Admin" />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <Button
              variant="outline"
              onClick={() => router.push("/muna")}
              className="mb-4"
            >
              ← Back to Control Centre
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  <SettingsIcon className="w-10 h-10 text-accent" />
                  Platform Settings
                </h1>
                <p className="text-muted-foreground">
                  Configure all platform settings without code changes
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="commission" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="commission">Commission</TabsTrigger>
              <TabsTrigger value="fees">Fees & GST</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="emails">Email Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="commission">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-accent" />
                    Commission Rates & Tier Thresholds
                  </CardTitle>
                  <CardDescription>
                    Set commission percentages per tier and the revenue thresholds (NZD) that define each tier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-semibold">Promotional Rate Active</h3>
                        <p className="text-sm text-muted-foreground">Enable temporary reduced rates</p>
                      </div>
                      <Switch
                        checked={commissionRates.promo_active}
                        onCheckedChange={(checked) =>
                          setCommissionRates({ ...commissionRates, promo_active: checked })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Commission Rates (%)</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="bronze-rate">Bronze Tier</Label>
                            <Input
                              id="bronze-rate"
                              type="number"
                              value={commissionRates.bronze}
                              onChange={(e) =>
                                setCommissionRates({ ...commissionRates, bronze: parseFloat(e.target.value) })
                              }
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="silver-rate">Silver Tier</Label>
                            <Input
                              id="silver-rate"
                              type="number"
                              value={commissionRates.silver}
                              onChange={(e) =>
                                setCommissionRates({ ...commissionRates, silver: parseFloat(e.target.value) })
                              }
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="gold-rate">Gold Tier</Label>
                            <Input
                              id="gold-rate"
                              type="number"
                              value={commissionRates.gold}
                              onChange={(e) =>
                                setCommissionRates({ ...commissionRates, gold: parseFloat(e.target.value) })
                              }
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <Label htmlFor="platinum-rate">Platinum Tier</Label>
                            <Input
                              id="platinum-rate"
                              type="number"
                              value={commissionRates.platinum}
                              onChange={(e) =>
                                setCommissionRates({ ...commissionRates, platinum: parseFloat(e.target.value) })
                              }
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Tier Thresholds (NZD)</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="bronze-threshold">Bronze (starts at)</Label>
                            <Input
                              id="bronze-threshold"
                              type="number"
                              value={tierThresholds.bronze}
                              onChange={(e) =>
                                setTierThresholds({ ...tierThresholds, bronze: parseFloat(e.target.value) })
                              }
                              step="100"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="silver-threshold">Silver (starts at)</Label>
                            <Input
                              id="silver-threshold"
                              type="number"
                              value={tierThresholds.silver}
                              onChange={(e) =>
                                setTierThresholds({ ...tierThresholds, silver: parseFloat(e.target.value) })
                              }
                              step="100"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="gold-threshold">Gold (starts at)</Label>
                            <Input
                              id="gold-threshold"
                              type="number"
                              value={tierThresholds.gold}
                              onChange={(e) =>
                                setTierThresholds({ ...tierThresholds, gold: parseFloat(e.target.value) })
                              }
                              step="100"
                              min="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="platinum-threshold">Platinum (starts at)</Label>
                            <Input
                              id="platinum-threshold"
                              type="number"
                              value={tierThresholds.platinum}
                              onChange={(e) =>
                                setTierThresholds({ ...tierThresholds, platinum: parseFloat(e.target.value) })
                              }
                              step="100"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveCommission} disabled={isSaving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Commission Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-accent" />
                      Platform & Stripe Fees
                    </CardTitle>
                    <CardDescription>
                      Client platform fee and Stripe processing contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="platform-fee">Client Platform Fee (%)</Label>
                      <Input
                        id="platform-fee"
                        type="number"
                        value={clientPlatformFee}
                        onChange={(e) => setClientPlatformFee(parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently {clientPlatformFee}% - charged to clients on top of project price
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stripe-domestic">Stripe Domestic Card Contribution (%)</Label>
                      <Input
                        id="stripe-domestic"
                        type="number"
                        value={stripeDomestic}
                        onChange={(e) => setStripeDomestic(parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently {stripeDomestic === 0 ? "not set" : `${stripeDomestic}%`}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stripe-international">Stripe International Card Contribution (%)</Label>
                      <Input
                        id="stripe-international"
                        type="number"
                        value={stripeInternational}
                        onChange={(e) => setStripeInternational(parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently {stripeInternational === 0 ? "not set" : `${stripeInternational}%`}
                      </p>
                    </div>

                    <Button onClick={handleSaveFees} disabled={isSaving} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Fee Settings"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-accent" />
                      GST Configuration
                    </CardTitle>
                    <CardDescription>
                      Enable GST and set the percentage rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-semibold">GST Enabled</h3>
                        <p className="text-sm text-muted-foreground">Apply GST to all transactions</p>
                      </div>
                      <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
                    </div>

                    {gstEnabled && (
                      <div>
                        <Label htmlFor="gst-percentage">GST Percentage (%)</Label>
                        <Input
                          id="gst-percentage"
                          type="number"
                          value={gstPercentage}
                          onChange={(e) => setGstPercentage(parseFloat(e.target.value))}
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Currently {gstPercentage}%
                        </p>
                      </div>
                    )}

                    <Button onClick={handleSaveGST} disabled={isSaving} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? "Saving..." : "Save GST Settings"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subscriptions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-accent" />
                    Subscription Pricing
                  </CardTitle>
                  <CardDescription>
                    Edit monthly subscription prices (all currently on SPECIAL PRICE)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      These prices are temporary promotional rates. Update as needed.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="remove-logo">Remove BlueTika Logo ($/month)</Label>
                      <Input
                        id="remove-logo"
                        type="number"
                        value={subscriptionPrices.remove_logo}
                        onChange={(e) =>
                          setSubscriptionPrices({ ...subscriptionPrices, remove_logo: parseFloat(e.target.value) })
                        }
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-hosting">Email Hosting ($/month)</Label>
                      <Input
                        id="email-hosting"
                        type="number"
                        value={subscriptionPrices.email_hosting}
                        onChange={(e) =>
                          setSubscriptionPrices({ ...subscriptionPrices, email_hosting: parseFloat(e.target.value) })
                        }
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-url">Custom Profile URL ($/month)</Label>
                      <Input
                        id="custom-url"
                        type="number"
                        value={subscriptionPrices.custom_url}
                        onChange={(e) =>
                          setSubscriptionPrices({ ...subscriptionPrices, custom_url: parseFloat(e.target.value) })
                        }
                        step="0.01"
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="additional-staff">Additional Staff Member ($/month)</Label>
                      <Input
                        id="additional-staff"
                        type="number"
                        value={subscriptionPrices.additional_staff}
                        onChange={(e) =>
                          setSubscriptionPrices({ ...subscriptionPrices, additional_staff: parseFloat(e.target.value) })
                        }
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveSubscriptions} disabled={isSaving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Subscription Prices"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent" />
                    Moderation Switches
                  </CardTitle>
                  <CardDescription>
                    Enable or disable platform moderation features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold">Content Safety Enabled</h3>
                      <p className="text-sm text-muted-foreground">Block contact info sharing</p>
                    </div>
                    <Switch
                      checked={moderationSwitches.content_safety_enabled}
                      onCheckedChange={(checked) =>
                        setModerationSwitches({ ...moderationSwitches, content_safety_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold">Auto-Suspend Enabled</h3>
                      <p className="text-sm text-muted-foreground">Automatically suspend repeat violators</p>
                    </div>
                    <Switch
                      checked={moderationSwitches.auto_suspend_enabled}
                      onCheckedChange={(checked) =>
                        setModerationSwitches({ ...moderationSwitches, auto_suspend_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold">AI Verification Enabled</h3>
                      <p className="text-sm text-muted-foreground">Use AI for provider verification</p>
                    </div>
                    <Switch
                      checked={moderationSwitches.ai_verification_enabled}
                      onCheckedChange={(checked) =>
                        setModerationSwitches({ ...moderationSwitches, ai_verification_enabled: checked })
                      }
                    />
                  </div>

                  <Button onClick={handleSaveModeration} disabled={isSaving} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Moderation Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-accent" />
                        Category Manager
                      </CardTitle>
                      <CardDescription>
                        Add, edit, remove, and reorder categories
                      </CardDescription>
                    </div>
                    <Button onClick={() => setCategoryDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No categories yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                            <div>
                              <h3 className="font-semibold">{category.name}</h3>
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCategory(category);
                                setCategoryForm({ name: category.name, description: category.description || "" });
                                setCategoryDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emails">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-accent" />
                    Email Logs (Amazon SES)
                  </CardTitle>
                  <CardDescription>
                    Complete history of all emails sent through the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emailLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No emails sent yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Preview</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emailLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-sm">{formatDate(log.created_at)}</TableCell>
                              <TableCell className="font-medium">{log.recipient}</TableCell>
                              <TableCell>{log.subject}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                {log.body_preview}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    log.delivery_status === "delivered"
                                      ? "default"
                                      : log.delivery_status === "bounced" || log.delivery_status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {log.delivery_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the category details" : "Add a new category to the platform"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Home Repairs"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description (optional)</Label>
              <Input
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="e.g., Plumbing, electrical, painting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}