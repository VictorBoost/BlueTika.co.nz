import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { paymentService } from "@/services/paymentService";
import { notificationService } from "@/services/notificationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, CheckCircle2, AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function EscrowManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [heldContracts, setHeldContracts] = useState<any[]>([]);
  const [settings, setSettings] = useState({ autoReleaseWindowSeconds: 10 });
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [releasingContract, setReleasingContract] = useState<string | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/muna/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || profile.email !== "sam@bluetika.co.nz") {
      router.push("/");
      return;
    }

    await loadData();
  }

  async function loadData() {
    // Load all contracts with held payments
    const { data: contracts } = await supabase
      .from("contracts")
      .select(`
        *,
        project:projects(title),
        client:profiles!contracts_client_id_fkey(full_name, email),
        provider:profiles!contracts_provider_id_fkey(full_name, email)
      `)
      .eq("payment_status", "held")
      .order("auto_release_eligible_at", { ascending: true });

    setHeldContracts(contracts || []);

    // Load settings
    const { data: settingsData } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "auto_release_window_seconds")
      .maybeSingle();

    setSettings({
      autoReleaseWindowSeconds: parseInt(settingsData?.setting_value || "10")
    });

    setLoading(false);
  }

  async function updateAutoReleaseWindow(seconds: number) {
    setUpdatingSettings(true);

    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({ setting_value: seconds.toString() })
        .eq("setting_key", "auto_release_window_seconds");

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: `Auto-release window set to ${seconds} seconds (${Math.floor(seconds / 3600)} hours)`,
      });

      setSettings({ autoReleaseWindowSeconds: seconds });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Update Failed",
        description: "Could not update settings",
        variant: "destructive",
      });
    } finally {
      setUpdatingSettings(false);
    }
  }

  async function handleManualRelease(contractId: string, projectTitle: string, providerId: string, clientId: string) {
    setReleasingContract(contractId);

    try {
      const { error } = await paymentService.capturePayment(contractId, "admin_release");
      
      if (error) throw error;

      // Send notifications
      await notificationService.createNotification(
        providerId,
        "Payment Released",
        `Admin has manually released payment for "${projectTitle}". Funds will arrive in 2-3 business days.`,
        "payment",
        contractId
      );

      await notificationService.createNotification(
        clientId,
        "Payment Released",
        `Admin has manually released payment for "${projectTitle}".`,
        "payment",
        contractId
      );

      toast({
        title: "Payment Released",
        description: "Payment has been captured and will be transferred to the provider",
      });

      setShowReleaseDialog(null);
      await loadData();
    } catch (error) {
      console.error("Release error:", error);
      toast({
        title: "Release Failed",
        description: error instanceof Error ? error.message : "Failed to release payment",
        variant: "destructive",
      });
    } finally {
      setReleasingContract(null);
    }
  }

  const now = new Date();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Escrow Management</h1>
          <p className="text-muted-foreground">Monitor and manage held payments</p>
        </div>

        {/* Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Auto-Release Settings</CardTitle>
            <CardDescription>
              Configure how long payments are held before automatic release
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Setting</Label>
                <div className="text-2xl font-bold text-accent">
                  {settings.autoReleaseWindowSeconds < 3600 
                    ? `${settings.autoReleaseWindowSeconds} seconds`
                    : `${Math.floor(settings.autoReleaseWindowSeconds / 3600)} hours`
                  }
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => updateAutoReleaseWindow(10)}
                disabled={updatingSettings || settings.autoReleaseWindowSeconds === 10}
              >
                Set to 10 sec (Testing)
              </Button>
              <Button
                variant="outline"
                onClick={() => updateAutoReleaseWindow(172800)}
                disabled={updatingSettings || settings.autoReleaseWindowSeconds === 172800}
              >
                Set to 48 hours (Production)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Held Contracts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Held Payments ({heldContracts.length})
            </CardTitle>
            <CardDescription>
              Payments awaiting client approval or auto-release
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : heldContracts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No held payments
              </div>
            ) : (
              <div className="space-y-4">
                {heldContracts.map((contract) => {
                  const deadline = new Date(contract.auto_release_eligible_at);
                  const isPastDeadline = now > deadline;
                  const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

                  return (
                    <Card key={contract.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{contract.project?.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Client: {contract.client?.full_name} ({contract.client?.email})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Provider: {contract.provider?.full_name} ({contract.provider?.email})
                            </p>
                          </div>
                          <Badge variant={isPastDeadline ? "destructive" : "secondary"}>
                            {isPastDeadline ? "Eligible for Release" : `${hoursRemaining}h remaining`}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-semibold">${contract.final_amount?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Charged</p>
                            <p className="font-semibold">${contract.total_amount?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-semibold">
                              {deadline.toLocaleString("en-NZ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setShowReleaseDialog(contract.id)}
                            disabled={releasingContract === contract.id}
                            className="bg-success hover:bg-success/90"
                          >
                            {releasingContract === contract.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            Manual Release
                          </Button>
                        </div>

                        <AlertDialog open={showReleaseDialog === contract.id} onOpenChange={(open) => !open && setShowReleaseDialog(null)}>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Manually Release Payment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will immediately capture and release ${contract.final_amount?.toFixed(2)} to the service provider.
                                <br /><br />
                                <strong>This action cannot be undone.</strong>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={releasingContract === contract.id}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleManualRelease(
                                  contract.id,
                                  contract.project?.title || "Project",
                                  contract.provider_id,
                                  contract.client_id
                                )}
                                disabled={releasingContract === contract.id}
                                className="bg-success hover:bg-success/90"
                              >
                                {releasingContract === contract.id ? "Releasing..." : "Yes, Release Payment"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}