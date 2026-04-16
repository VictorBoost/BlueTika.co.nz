import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Eye, ExternalLink, Bot, User } from "lucide-react";

export default function AdminVerifyProviders() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("verification_documents")
      .select(`
        *,
        provider:profiles!verification_documents_provider_id_fkey(id, full_name, first_name, email, phone_number),
        category:categories(id, name),
        subcategory:subcategories(id, name)
      `)
      .eq("status", "pending")
      .order("ai_confidence_score", { ascending: true, nullsFirst: false })
      .order("created_at");

    if (error) {
      console.error("Error loading documents:", error);
    } else {
      setDocuments(data || []);
    }

    setLoading(false);
  };

  const loadVerificationHistory = async (providerId: string) => {
    const { data, error } = await supabase
      .from("verification_logs")
      .select(`
        *,
        admin:profiles!verification_logs_admin_id_fkey(full_name, email)
      `)
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading history:", error);
    } else {
      setVerificationHistory(data || []);
      setHistoryDialogOpen(true);
    }
  };

  const handleReview = (document: any, action: "approve" | "reject") => {
    setSelectedDocument(document);
    setActionType(action);
    setRejectionReason("");
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedDocument) return;

    if (actionType === "reject" && !rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    const session = await supabase.auth.getSession();
    const reviewerId = session.data.session?.user?.id;

    if (!reviewerId) {
      toast({
        title: "Error",
        description: "You must be logged in to review documents",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("verification_documents")
      .update({
        status: actionType === "approve" ? "approved" : "rejected",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: actionType === "reject" ? rejectionReason : null,
      })
      .eq("id", selectedDocument.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Document ${actionType === "approve" ? "approved" : "rejected"} successfully.`,
      });

      loadDocuments();
      setDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const getConfidenceBadge = (score: number | null, autoApproved: boolean | null) => {
    if (autoApproved) {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <Bot className="h-3 w-3 mr-1" />
          Auto-Approved
        </Badge>
      );
    }

    if (!score) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          No AI Scan
        </Badge>
      );
    }

    if (score >= 85) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{score}%</Badge>;
    } else if (score >= 70) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{score}%</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{score}%</Badge>;
    }
  };

  return (
    <>
      <SEO 
        title="Verify Service Providers - Admin - BlueTika"
        description="Review and approve service provider verifications"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-white">
          <div className="container py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              BlueTika Admin
            </Link>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/admin/categories">Categories</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/admin/verify-domestic-helpers">Domestic Helpers</Link>
              </Button>
              <Button asChild>
                <Link href="/">Back to Site</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12">
          <div className="container">
            <Card>
              <CardHeader>
                <CardTitle>Service Provider Verifications</CardTitle>
                <CardDescription>
                  Review driver licences, trade certificates, and approve or reject verifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : documents.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No verification submissions yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>AI Confidence</TableHead>
                        <TableHead>AI Reason</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {doc.provider?.full_name || doc.provider?.first_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{doc.provider?.email}</p>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => loadVerificationHistory(doc.provider_id)}
                              >
                                View History
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{doc.document_type.replace(/_/g, " ")}</span>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getConfidenceBadge(doc.ai_confidence_score, doc.auto_approved)}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate" title={doc.ai_scan_reason}>
                              {doc.ai_scan_reason || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReview(doc, "approve")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReview(doc, "reject")}
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
        </main>
        
        <Footer />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Approve Verification" : "Reject Verification"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? `Approve ${selectedDocument?.provider?.full_name || selectedDocument?.provider?.first_name}'s verification?`
                  : `Provide a reason for rejecting ${selectedDocument?.provider?.full_name || selectedDocument?.provider?.first_name}'s verification`
                }
              </DialogDescription>
            </DialogHeader>

            {actionType === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Driver licence photo is too blurry, please upload a clearer image"
                  rows={4}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAction}>
                {actionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verification History</DialogTitle>
              <DialogDescription>
                Complete verification log for this service provider
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {verificationHistory.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{log.document_type.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={log.action === "auto_approve" || log.action === "manual_approve" ? "default" : "secondary"}>
                        {log.action === "auto_approve" && <Bot className="h-3 w-3 mr-1" />}
                        {log.action === "manual_approve" && <User className="h-3 w-3 mr-1" />}
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    {log.confidence_score && (
                      <p className="text-sm mb-1">
                        <span className="font-medium">AI Confidence:</span> {log.confidence_score}%
                      </p>
                    )}
                    {log.reason && (
                      <p className="text-sm text-muted-foreground">{log.reason}</p>
                    )}
                    {log.admin && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Reviewed by: {log.admin.full_name || log.admin.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}