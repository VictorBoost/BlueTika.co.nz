import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { verificationService } from "@/services/verificationService";
import { CheckCircle, XCircle, FileText, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function VerifyDomesticHelpers() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403 || !data.isAdmin) {
        router.push("/muna");
        return;
      }

      setIsAdmin(true);
      loadVerifications();
    } catch (error) {
      console.error("Admin verification error:", error);
      router.push("/muna");
    }
  };

  const loadVerifications = async () => {
    setLoading(true);
    const { data } = await verificationService.getPendingVerifications();
    if (data) {
      setVerifications(data);
    }
    setLoading(false);
  };

  const handleApprove = async (doc: any) => {
    const session = await authService.getCurrentSession();
    if (!session?.user) return;

    const { error } = await verificationService.updateDocumentStatus(
      doc.id,
      "approved",
      session.user.id
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve document",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Approved",
        description: "Document approved successfully",
      });

      // Update provider verification status if all docs approved
      await checkAndUpdateProviderStatus(doc.provider_id);
      loadVerifications();
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason) return;

    const session = await authService.getCurrentSession();
    if (!session?.user) return;

    const { error } = await verificationService.updateDocumentStatus(
      selectedDoc.id,
      "rejected",
      session.user.id,
      rejectionReason
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject document",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Rejected",
        description: "Document rejected",
      });
      setReviewDialog(false);
      setSelectedDoc(null);
      setRejectionReason("");
      loadVerifications();
    }
  };

  const checkAndUpdateProviderStatus = async (providerId: string) => {
    // Check if all required documents are approved
    const { data: allDocs } = await verificationService.getProviderDocuments(providerId);
    
    if (allDocs) {
      const allApproved = allDocs.every(d => d.status === "approved");
      if (allApproved) {
        await verificationService.updateProviderVerificationStatus(
          providerId,
          "verified",
          true
        );
      }
    }
  };

  const openRejectDialog = (doc: any) => {
    setSelectedDoc(doc);
    setReviewDialog(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO title="Verify Domestic Helpers - BlueTika Admin" />
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
            <h1 className="text-4xl font-bold mb-2">Domestic Helper Verification</h1>
            <p className="text-muted-foreground">
              Review and approve enhanced verification documents
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>
                Review NZ Police Checks, First Aid Certificates, and references
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading verifications...</p>
                </div>
              ) : verifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending verifications</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.provider?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{doc.provider?.email}</p>
                            {doc.provider?.phone_number && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="h-3 w-3" />
                                {doc.provider.phone_number}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doc.subcategory?.name || doc.category?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {doc.document_type === "police_check" && "NZ Police Check"}
                            {doc.document_type === "first_aid" && "First Aid Certificate"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.file_url, "_blank")}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success"
                              onClick={() => handleApprove(doc)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => openRejectDialog(doc)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this document. The service provider will see this message.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Document is expired or unclear"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason}
            >
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}