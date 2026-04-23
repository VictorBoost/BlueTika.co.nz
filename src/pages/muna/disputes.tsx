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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { AlertTriangle, DollarSign, Calendar, Eye, Image as ImageIcon } from "lucide-react";
import { disputeService } from "@/services/disputeService";
import { authService } from "@/services/authService";
import { sendDisputeResolutionNotification } from "@/services/sesEmailService";
import { notificationService } from "@/services/notificationService";
import { fundReleaseService } from "@/services/fundReleaseService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdminDisputes() {
  const router = useRouter();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [evidencePhotos, setEvidencePhotos] = useState<any[]>([]);
  const [resolutionType, setResolutionType] = useState<string>("");
  const [resolutionReason, setResolutionReason] = useState("");
  const [clientRefundAmount, setClientRefundAmount] = useState("");
  const [providerPayoutAmount, setProviderPayoutAmount] = useState("");
  const [resolving, setResolving] = useState(false);

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
      loadDisputes();
    } catch (error) {
      console.error("Admin verification error:", error);
      router.push("/muna");
    }
  };

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await disputeService.getPendingDisputes();
      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error("Error loading disputes:", error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const loadEvidencePhotos = async (contractId: string) => {
    const { data, error } = await supabase
      .from("contract_evidence_photos")
      .select("*")
      .eq("contract_id", contractId)
      .order("photo_type")
      .order("uploader_role");

    if (error) {
      console.error("Error loading evidence photos:", error);
      return;
    }

    setEvidencePhotos(data || []);
  };

  const handleOpenResolutionDialog = (dispute: any) => {
    setSelectedDispute(dispute);
    setResolutionType("");
    setResolutionReason("");
    setClientRefundAmount("");
    setProviderPayoutAmount("");
    loadEvidencePhotos(dispute.contract_id);
    setResolutionDialogOpen(true);
  };

  const handleViewEvidence = (dispute: any) => {
    setSelectedDispute(dispute);
    loadEvidencePhotos(dispute.contract_id);
    setPhotoViewerOpen(true);
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !userId || !resolutionType || !resolutionReason) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (resolutionType === "partial_split" && (!clientRefundAmount || !providerPayoutAmount)) {
      toast({
        title: "Validation Error",
        description: "Please specify both partial amounts.",
        variant: "destructive",
      });
      return;
    }

    setResolving(true);
    try {
      const bidsAny = selectedDispute.contracts.bids as any;
      const agreedPrice = bidsAny?.agreed_price || bidsAny?.[0]?.agreed_price || 0;
      
      const clientRefund = resolutionType === "partial_split" ? parseFloat(clientRefundAmount) : 0;
      const providerPayout = resolutionType === "partial_split" ? parseFloat(providerPayoutAmount) : 0;

      await disputeService.resolveDispute(
        selectedDispute.id,
        resolutionType,
        resolutionReason,
        clientRefund,
        providerPayout
      );

      // If funds are released to provider, create fund release record
      if (resolutionType === "release_to_provider" || resolutionType === "partial_split") {
        let finalProviderPayout = providerPayout;
        if (resolutionType === "release_to_provider") {
          const calc = fundReleaseService.calculateCommission(agreedPrice);
          finalProviderPayout = calc.netToProvider;
        }

        await fundReleaseService.releaseFunds({
          contractId: selectedDispute.contract_id,
          releasedBy: userId,
          releaseType: "dispute_resolution",
          notes: `Dispute resolved: ${resolutionReason}`,
          customAmounts: {
            clientRefund: clientRefund,
            providerPayout: finalProviderPayout
          }
        });
      }

      // Notify Client
      if (selectedDispute.contracts.client?.email) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";
        await sendDisputeResolutionNotification(
          selectedDispute.contracts.client.email,
          selectedDispute.contracts.client.full_name || "Client",
          "client",
          selectedDispute.contracts.projects.title,
          resolutionType as any,
          resolutionReason,
          resolutionType === "refund_to_client" ? agreedPrice : clientRefund,
          baseUrl
        );
        
        await notificationService.createNotification(
          selectedDispute.contracts.client_id,
          "Dispute Resolved",
          `The dispute for "${selectedDispute.contracts.projects.title}" has been resolved by an admin.`,
          "warning",
          `/project/${selectedDispute.contracts.project_id}`
        );
      }

      // Notify Provider
      if (selectedDispute.contracts.provider?.email) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";
        await sendDisputeResolutionNotification(
          selectedDispute.contracts.provider.email,
          selectedDispute.contracts.provider.full_name || "Service Provider",
          "provider",
          selectedDispute.contracts.projects.title,
          resolutionType as any,
          resolutionReason,
          resolutionType === "release_to_provider" ? agreedPrice : providerPayout,
          baseUrl
        );

        await notificationService.createNotification(
          selectedDispute.contracts.provider_id,
          "Dispute Resolved",
          `The dispute for "${selectedDispute.contracts.projects.title}" has been resolved by an admin.`,
          "warning",
          `/project/${selectedDispute.contracts.project_id}`
        );
      }

      toast({
        title: "Dispute Resolved",
        description: "The dispute has been resolved and parties have been notified.",
      });

      setResolutionDialogOpen(false);
      setSelectedDispute(null);
      await loadDisputes();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute.",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const getPhotosByType = (photoType: "before" | "after") => {
    return evidencePhotos.filter(p => p.photo_type === photoType);
  };

  return (
    <>
      <SEO 
        title="Disputes - BlueTika Control Centre" 
        description="Review and resolve active project disputes" 
      />
      
      <div className="min-h-screen flex flex-col">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dispute Management</h1>
            <p className="text-muted-foreground">Review and resolve active project disputes</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading disputes...</p>
            </div>
          ) : disputes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-success" />
                <p className="text-muted-foreground">No active disputes to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6">
                {disputes.map(dispute => {
                  const bidsAny = dispute.contracts.bids as any;
                  const agreedPrice = bidsAny?.agreed_price || bidsAny?.[0]?.agreed_price || 0;
                  
                  return (
                    <Card key={dispute.id} className="border-red-500/20">
                      <CardHeader className="bg-red-500/5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2 flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-5 w-5" />
                              Dispute: {dispute.contracts.projects.title}
                            </CardTitle>
                            <CardDescription className="space-y-1">
                              <p>Raised by: {dispute.raised_by_profile?.full_name || dispute.raised_by_profile?.email} ({dispute.raiser_role})</p>
                              <p>Date: {new Date(dispute.created_at).toLocaleString()}</p>
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                            Action Required
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Contract Details</h4>
                            <div className="space-y-1 text-muted-foreground">
                              <p>Client: {dispute.contracts.client?.full_name}</p>
                              <p>Provider: {dispute.contracts.provider?.full_name}</p>
                              <p className="font-medium text-foreground mt-2">Agreed Price: NZD ${agreedPrice.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Claim Description</h4>
                            <p className="text-muted-foreground italic">"{dispute.claim_description}"</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="flex-1">
                            <Link href={`/project/${dispute.contracts.project_id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Project
                            </Link>
                          </Button>
                          <Button
                            onClick={() => handleViewEvidence(dispute)}
                            variant="outline"
                            className="flex-1"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            View Evidence Photos
                          </Button>
                          <Button
                            onClick={() => handleOpenResolutionDialog(dispute)}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Resolve Dispute
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

      {/* Evidence Photo Viewer Dialog */}
      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evidence Photos</DialogTitle>
            <DialogDescription>
              Before and after photos submitted by both parties for "{selectedDispute?.contracts.projects.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Before Photos */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Before Photos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {getPhotosByType("before").map((photo) => (
                  <Card key={photo.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {photo.uploader_role === "client" ? "Client" : "Service Provider"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {photo.photo_urls && photo.photo_urls.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {photo.photo_urls.map((url: string, idx: number) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square rounded-lg overflow-hidden hover:opacity-80 transition"
                            >
                              <img
                                src={url}
                                alt={`Before photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No photos uploaded</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* After Photos */}
            <div>
              <h3 className="text-lg font-semibold mb-3">After Photos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {getPhotosByType("after").map((photo) => (
                  <Card key={photo.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {photo.uploader_role === "client" ? "Client" : "Service Provider"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {photo.photo_urls && photo.photo_urls.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {photo.photo_urls.map((url: string, idx: number) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square rounded-lg overflow-hidden hover:opacity-80 transition"
                            >
                              <img
                                src={url}
                                alt={`After photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No photos uploaded</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Record your decision for "{selectedDispute?.contracts.projects.title}"
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Resolution Decision</Label>
                <Select value={resolutionType} onValueChange={setResolutionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="release_to_provider">Release Full Amount to Provider</SelectItem>
                    <SelectItem value="refund_to_client">Refund Full Amount to Client</SelectItem>
                    <SelectItem value="partial_split">Partial Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resolutionType === "partial_split" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Refund Amount (NZD)</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 50.00" 
                      value={clientRefundAmount}
                      onChange={(e) => setClientRefundAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider Payout Amount (NZD)</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 150.00" 
                      value={providerPayoutAmount}
                      onChange={(e) => setProviderPayoutAmount(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">Resolution Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain the reason for this decision. This will be sent to both parties..."
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolutionDialogOpen(false)}
              disabled={resolving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveDispute}
              disabled={resolving || !resolutionType || !resolutionReason}
              className="bg-red-600 hover:bg-red-700"
            >
              {resolving ? "Processing..." : "Confirm Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}