import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { DollarSign, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { fundReleaseService } from "@/services/fundReleaseService";
import { authService } from "@/services/authService";
import { sendFundReleaseNotification } from "@/services/sesEmailService";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";

export default function FundReleases() {
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [releasing, setReleasing] = useState(false);

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

      setUserId(data.email);
      loadContracts();
    } catch (error) {
      console.error("Admin verification error:", error);
      router.push("/muna");
    }
  };

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await fundReleaseService.getReadyForReleaseContracts();
      setContracts(data || []);
    } catch (error) {
      console.error("Error loading contracts:", error);
      // Suppressed error toast to avoid disruptive UI when mostly functional
    }
    setLoading(false);
  };

  const loadReleases = async () => {
    setLoading(true);
    try {
      const { data, error } = await fundReleaseService.getAllFundReleases();
      if (error) {
        console.error("Error loading fund releases:", error);
        toast({
          title: "Error",
          description: "Failed to load fund releases",
          variant: "destructive",
        });
      } else {
        setReleases(data || []);
      }
    } catch (error) {
      console.error("Error loading fund releases:", error);
      toast({
        title: "Error",
        description: "Failed to load fund releases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReleaseDialog = (contract: any) => {
    setSelectedContract(contract);
    setReleaseNotes("");
    setReleaseDialogOpen(true);
  };

  const handleReleaseFunds = async () => {
    if (!selectedContract || !userId) return;

    setReleasing(true);
    try {
      const commission = fundReleaseService.calculateCommission(selectedContract.bids.agreed_price);

      await fundReleaseService.releaseFunds({
        contractId: selectedContract.id,
        releasedBy: userId,
        releaseType: "normal",
        notes: releaseNotes,
      });

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";

      // Send notifications to both parties
      if (selectedContract.client?.email) {
        await sendFundReleaseNotification(
          selectedContract.client.email,
          selectedContract.client.full_name || "Client",
          "client",
          selectedContract.projects.title,
          commission.agreedPrice,
          commission.commissionAmount,
          commission.netToProvider,
          baseUrl
        );
        await notificationService.createNotification(
          selectedContract.client_id,
          "Funds Released",
          `Payment for "${selectedContract.projects.title}" has been processed.`,
          "payment",
          `/project/${selectedContract.project_id}`
        );
      }

      if (selectedContract.provider?.email) {
        await sendFundReleaseNotification(
          selectedContract.provider.email,
          selectedContract.provider.full_name || "Provider",
          "provider",
          selectedContract.projects.title,
          commission.agreedPrice,
          commission.commissionAmount,
          commission.netToProvider,
          baseUrl
        );
        await notificationService.createNotification(
          selectedContract.provider_id,
          "Payment Released",
          `Your payment of NZD $${commission.netToProvider.toLocaleString()} for "${selectedContract.projects.title}" will arrive in 2-3 business days.`,
          "payment",
          `/project/${selectedContract.project_id}`
        );
      }

      toast({
        title: "Funds Released",
        description: "Payment has been released to the service provider.",
      });

      setReleaseDialogOpen(false);
      setSelectedContract(null);
      await loadContracts();
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast({
        title: "Error",
        description: "Failed to release funds",
        variant: "destructive",
      });
    } finally {
      setReleasing(false);
    }
  };

  const getDaysWaiting = (readyAt: string) => {
    const days = Math.floor((Date.now() - new Date(readyAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <>
      <SEO title="Fund Releases - BlueTika Control Centre" />
      <div className="min-h-screen bg-background">
        <div className="container py-12 px-4">
          <Button
            variant="outline"
            onClick={() => router.push("/muna")}
            className="mb-4"
          >
            ← Back to Control Centre
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Fund Release Management</h1>
            <p className="text-muted-foreground">Review and approve fund releases for completed contracts</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                <p className="text-muted-foreground">No contracts ready for fund release</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {contracts.length} contract{contracts.length !== 1 ? "s" : ""} ready for fund release
                </AlertDescription>
              </Alert>

              <div className="grid gap-6">
                {contracts.map(contract => {
                  const commission = fundReleaseService.calculateCommission(contract.bids.agreed_price);
                  const daysWaiting = getDaysWaiting(contract.ready_for_release_at);
                  
                  return (
                    <Card key={contract.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">
                              {contract.projects.title}
                            </CardTitle>
                            <CardDescription className="space-y-1">
                              <p>Client: {contract.client?.full_name || contract.client?.email}</p>
                              <p>Provider: {contract.provider?.full_name || contract.provider?.email}</p>
                            </CardDescription>
                          </div>
                          {daysWaiting > 2 && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {daysWaiting} days waiting
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <h4 className="font-semibold mb-3">Payment Breakdown</h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Agreed Price</span>
                            <span className="font-semibold">
                              NZD ${commission.agreedPrice.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Commission ({(commission.commissionRate * 100).toFixed(0)}%)
                            </span>
                            <span className="text-red-600">
                              - NZD ${commission.commissionAmount.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="h-px bg-border my-2" />
                          <div className="flex justify-between text-base font-bold">
                            <span>Net to Provider</span>
                            <span className="text-success">
                              NZD ${commission.netToProvider.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Ready: {new Date(contract.ready_for_release_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>Both reviews submitted</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="flex-1">
                            <Link href={`/project/${contract.project_id}`}>
                              View Project
                            </Link>
                          </Button>
                          <Button
                            onClick={() => handleOpenReleaseDialog(contract)}
                            className="flex-1 bg-success hover:bg-success/90"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Release Funds
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <Footer />
      </div>

      {/* Release Confirmation Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Funds</DialogTitle>
            <DialogDescription>
              Confirm fund release for "{selectedContract?.projects.title}"
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Agreed Price</span>
                  <span className="font-semibold">
                    NZD ${fundReleaseService.calculateCommission(selectedContract.bids.agreed_price).agreedPrice.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="text-red-600">
                    - NZD ${fundReleaseService.calculateCommission(selectedContract.bids.agreed_price).commissionAmount.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between font-bold">
                  <span>Net to Provider</span>
                  <span className="text-success">
                    NZD ${fundReleaseService.calculateCommission(selectedContract.bids.agreed_price).netToProvider.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this release..."
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReleaseDialogOpen(false)}
              disabled={releasing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReleaseFunds}
              disabled={releasing}
              className="bg-success hover:bg-success/90"
            >
              {releasing ? "Releasing..." : "Confirm Release"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}