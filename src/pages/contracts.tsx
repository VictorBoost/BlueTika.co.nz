import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { contractService } from "@/services/contractService";
import { routineContractService } from "@/services/routineContractService";
import { cancellationService } from "@/services/cancellationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Clock, AlertCircle, XCircle, User, ArrowLeft } from "lucide-react";
import { ProgressSteps } from "@/components/ProgressSteps";
import { EvidencePhotoUpload } from "@/components/EvidencePhotoUpload";
import { ReviewSubmissionModal } from "@/components/ReviewSubmissionModal";
import { RoutineContractPrompt } from "@/components/RoutineContractPrompt";
import { ClientApprovalCard } from "@/components/ClientApprovalCard";
import { toast } from "@/hooks/use-toast";
import { SafetyBanner } from "@/components/SafetyBanner";
import { ProjectCard } from "@/components/ProjectCard";
import { MarkCompleteModal } from "@/components/MarkCompleteModal";
import { sesEmailService } from "@/services/sesEmailService";
import { notificationService } from "@/services/notificationService";
import { AdditionalChargeRequest } from "@/components/AdditionalChargeRequest";
import { AdditionalChargesList } from "@/components/AdditionalChargesList";
import { ContractChat } from "@/components/ContractChat";

type Contract = any;
type RoutineBooking = any;
type AdditionalCharge = any;

export default function ContractsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [routineContracts, setRoutineContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [routinePromptOpen, setRoutinePromptOpen] = useState(false);
  const [routinePromptContract, setRoutinePromptContract] = useState<any>(null);
  const [cancellationRequests, setCancellationRequests] = useState<Record<string, any>>({});
  const [showCancellationForm, setShowCancellationForm] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [submittingCancellation, setSubmittingCancellation] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [markCompleteModalOpen, setMarkCompleteModalOpen] = useState(false);
  const [selectedContractForComplete, setSelectedContractForComplete] = useState<any>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  async function checkUserAndLoadData() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);
    
    await loadContracts(user.id);
    await loadRoutineContracts(user.id);
    await loadCancellationRequests(user.id);
    await loadMyProjects(user.id);
  }

  async function loadMyProjects(userId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        category:categories(name),
        subcategory:subcategories(name),
        bids(id)
      `)
      .eq("client_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const projectsWithStats = data.map((p: any) => ({
        ...p,
        bid_count: Array.isArray(p.bids) ? p.bids.length : 0
      }));
      setMyProjects(projectsWithStats);
    }
  }

  async function loadContracts(userId: string) {
    const { data, error } = await contractService.getUserContracts(userId);

    if (error) {
      console.error("Error loading contracts:", error);
      toast({
        title: "Load Failed",
        description: "Could not load your contracts.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    setContracts(data || []);
    setLoading(false);
  }

  async function loadRoutineContracts(userId: string) {
    // Load as client
    const { data: clientRoutines } = await routineContractService.getActiveRoutines(userId, "client");
    // Load as provider
    const { data: providerRoutines } = await routineContractService.getActiveRoutines(userId, "provider");
    
    const allRoutines = [...(clientRoutines || []), ...(providerRoutines || [])];
    setRoutineContracts(allRoutines);
  }

  async function loadCancellationRequests(userId: string) {
    const { data } = await cancellationService.getUserCancellationRequests(userId);
    
    if (data) {
      const requestsMap: Record<string, any> = {};
      data.forEach((req: any) => {
        requestsMap[req.contract_id] = req;
      });
      setCancellationRequests(requestsMap);
    }
  }

  async function handleRequestCancellation(contractId: string) {
    if (!cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation",
        variant: "destructive"
      });
      return;
    }

    setSubmittingCancellation(true);

    try {
      const contract = contracts.find(c => c.id === contractId);
      const isClient = contract.client_id === user?.id;
      
      const { data, error } = await cancellationService.createCancellationRequest(
        contractId,
        user!.id,
        isClient ? "client" : "provider",
        cancellationReason
      );

      if (error) {
        toast({
          title: "Request Failed",
          description: "Could not submit cancellation request",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Request Submitted",
          description: "The other party has 48 hours to respond before auto-cancellation"
        });
        setShowCancellationForm(null);
        setCancellationReason("");
        await loadCancellationRequests(user!.id);
      }
    } catch (error) {
      console.error("Error requesting cancellation:", error);
      toast({
        title: "Error",
        description: "Failed to submit cancellation request",
        variant: "destructive"
      });
    } finally {
      setSubmittingCancellation(false);
    }
  }

  async function handleRespondToCancellation(requestId: string, status: "approved" | "rejected") {
    const { error } = await cancellationService.respondToCancellationRequest(
      requestId,
      status,
      status === "rejected" ? "Cancellation rejected by other party" : undefined
    );

    if (error) {
      toast({
        title: "Response Failed",
        description: "Could not respond to cancellation request",
        variant: "destructive"
      });
      return;
    }

    if (status === "approved") {
      toast({
        title: "Cancellation Approved",
        description: "The contract has been cancelled"
      });
    } else {
      toast({
        title: "Cancellation Rejected",
        description: "The cancellation request has been rejected"
      });
    }

    if (user) {
      await loadContracts(user.id);
      await loadCancellationRequests(user.id);
    }
  }

  function handleOpenReviewModal(contract: any) {
    setSelectedContract(contract);
    setReviewModalOpen(true);
  }

  function handleReviewSubmitted() {
    if (user) {
      loadContracts(user.id);
    }
  }

  function handleRoutinePromptTrigger() {
    if (selectedContract) {
      setRoutinePromptContract(selectedContract);
      setRoutinePromptOpen(true);
    }
  }

  async function handlePauseRoutine(routineId: string) {
    const { error } = await routineContractService.pauseRoutine(routineId);
    
    if (error) {
      toast({
        title: "Action Failed",
        description: "Could not pause routine.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Routine Paused",
      description: "All future sessions have been cancelled."
    });

    if (user) loadRoutineContracts(user.id);
  }

  async function handleCancelRoutine(routineId: string) {
    const { error } = await routineContractService.cancelRoutine(routineId);
    
    if (error) {
      toast({
        title: "Action Failed",
        description: "Could not cancel routine.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Routine Cancelled",
      description: "This routine arrangement has been cancelled permanently."
    });

    if (user) loadRoutineContracts(user.id);
  }

  async function handleMarkWorkComplete() {
    if (!selectedContractForComplete || !user) return;

    setIsMarkingComplete(true);

    try {
      const { data, error } = await contractService.markWorkComplete(selectedContractForComplete.id);

      if (error) {
        toast({
          title: "Failed to Mark Complete",
          description: "Could not update contract status. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Send notification to client
      const clientEmail = selectedContractForComplete.client.email;
      const clientName = selectedContractForComplete.client.full_name;
      const providerName = selectedContractForComplete.provider.full_name;
      const projectTitle = selectedContractForComplete.project.title;

      // Create in-app notification
      await notificationService.createNotification(
        selectedContractForComplete.client_id,
        "Work Completed - Please Review",
        `${providerName} has completed work on "${projectTitle}". You have 48 hours to review.`,
        "contract",
        selectedContractForComplete.id
      );

      // Send email notification
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";
      await sesEmailService.sendWorkCompleteNotification(
        clientEmail,
        clientName,
        providerName,
        projectTitle,
        selectedContractForComplete.id,
        baseUrl
      );

      toast({
        title: "Work Marked Complete",
        description: "The client has been notified and has 48 hours to review your work."
      });

      setMarkCompleteModalOpen(false);
      setSelectedContractForComplete(null);
      await loadContracts(user.id);
    } catch (error) {
      console.error("Error marking work complete:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMarkingComplete(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header with Navigation */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} title="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="text-xl font-bold text-primary px-0 hover:bg-transparent">
              BlueTika
            </Button>
            <Button variant="ghost" onClick={() => router.push("/projects")}>
              Browse Projects
            </Button>
          </div>
          <Button variant="outline" onClick={() => router.push("/account")} className="gap-2">
            <User className="h-4 w-4" />
            My Profile
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Contracts</h1>
          <p className="text-muted-foreground">Track your ongoing projects and agreements</p>
        </div>

        <Alert className="mb-6 border-accent bg-accent/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Protection Notice:</strong> To keep your funds safe, all communication and extra payments must happen within BlueTika. Once the Service Provider submits &apos;After&apos; photos, the Client has 24 hours to raise a dispute. Any workmanship guarantees after payment release are handled directly between the Client and Provider. Approved funds are released to your account every Friday.
          </AlertDescription>
        </Alert>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Contract Lifecycle:</strong> Cancellation requests give the other party 48 hours to respond before auto-cancellation. Completed/cancelled contracts move to archive and are not deleted.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Contracts</TabsTrigger>
            <TabsTrigger value="routine">Routine Arrangements ({routineContracts.length})</TabsTrigger>
            <TabsTrigger value="completed">Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : myProjects.length === 0 && contracts.filter(c => c.status !== "Completed" && c.status !== "Awaiting Fund Release" && c.status !== "cancelled").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No active projects or contracts found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* My Posted Projects Section */}
                {myProjects.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">Awaiting Bids</span>
                      My Posted Projects
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {myProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} isOwner={true} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Contracts Section */}
                {contracts.filter(c => c.status !== "Completed" && c.status !== "Awaiting Fund Release" && c.status !== "cancelled").length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Active Contracts</h3>
                    {contracts
                      .filter(c => c.status !== "Completed" && c.status !== "Awaiting Fund Release" && c.status !== "cancelled")
                      .map((contract) => {
                        const isClient = contract.client_id === user?.id;
                        const otherParty = isClient ? contract.provider : contract.client;
                        const cancellationRequest = cancellationRequests[contract.id];
                        const isPendingCancellation = cancellationRequest?.status === "pending";
                        const isRequester = cancellationRequest?.requester_id === user?.id;
                        
                        return (
                          <Card key={contract.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle>{contract.project?.title || 'Unknown Project'}</CardTitle>
                                  <CardDescription>
                                    {isClient ? "Service Provider" : "Client"}: {otherParty?.full_name}
                                  </CardDescription>
                                </div>
                                <Badge>{contract.status}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Client Approval Card - only for clients with held payments */}
                              {isClient && contract.payment_status === "held" && (
                                <ClientApprovalCard
                                  contractId={contract.id}
                                  clientApprovalDeadline={contract.client_approval_deadline}
                                  paymentStatus={contract.payment_status || ""}
                                  projectTitle={contract.project?.title || "Project"}
                                  stripePayoutScheduledFor={(contract as { stripe_payout_scheduled_for?: string | null }).stripe_payout_scheduled_for}
                                  clientWorkAcceptedAt={(contract as { client_work_accepted_at?: string | null }).client_work_accepted_at}
                                  onApprovalComplete={() => loadContracts(user!.id)}
                                />
                              )}

                              {isPendingCancellation && (
                                <Alert variant="destructive">
                                  <XCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    {isRequester ? (
                                      <>
                                        <strong>Cancellation Requested</strong>
                                        <br />
                                        Waiting for {isClient ? "provider" : "client"} response. Auto-cancellation in 48 hours.
                                        <br />
                                        <span className="text-xs">Deadline: {new Date(cancellationRequest.auto_approval_deadline).toLocaleString("en-NZ")}</span>
                                      </>
                                    ) : (
                                      <>
                                        <strong>Cancellation Request Received</strong>
                                        <br />
                                        {isClient ? "Provider" : "Client"} has requested to cancel this contract.
                                        <br />
                                        <strong>Reason:</strong> {cancellationRequest.reason}
                                        <div className="flex gap-2 mt-3">
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleRespondToCancellation(cancellationRequest.id, "approved")}
                                          >
                                            Approve Cancellation
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRespondToCancellation(cancellationRequest.id, "rejected")}
                                          >
                                            Reject
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </AlertDescription>
                                </Alert>
                              )}

                              <ProgressSteps steps={[
                                { label: "Active", status: contract.status === "active" ? "active" : "completed" },
                                { label: "Work Done", status: contract.status === "Work Completed" ? "active" : (contract.status === "Evidence Uploaded" || contract.status === "Completed" || contract.status === "Awaiting Fund Release" ? "completed" : "upcoming") },
                                { label: "Completed", status: contract.status === "Completed" || contract.status === "Awaiting Fund Release" ? "completed" : "upcoming" }
                              ]} />
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Agreed Price</p>
                                  <p className="font-semibold">${contract.final_amount?.toFixed(2) || contract.agreed_price?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Start Date</p>
                                  <p className="font-semibold">
                                    {contract.agreed_start_date ? new Date(contract.agreed_start_date).toLocaleDateString("en-NZ") : "Not Set"}
                                  </p>
                                </div>
                              </div>

                              {/* Cancellation Request Section */}
                              {!isPendingCancellation && contract.status === "active" && (
                                <div className="border-t pt-4 mt-4">
                                  {showCancellationForm === contract.id ? (
                                    <div className="space-y-3">
                                      <Label>Reason for Cancellation</Label>
                                      <Textarea
                                        placeholder="Please explain why you want to cancel this contract..."
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        rows={3}
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleRequestCancellation(contract.id)}
                                          disabled={submittingCancellation}
                                        >
                                          {submittingCancellation ? "Submitting..." : "Submit Request"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setShowCancellationForm(null);
                                            setCancellationReason("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setShowCancellationForm(contract.id)}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Request Cancellation
                                    </Button>
                                  )}
                                </div>
                              )}

                              {/* Mark Work Complete button for provider */}
                              {!isClient && contract.status === "active" && (
                                <div className="border-t pt-4 mt-4">
                                  <Button
                                    onClick={() => {
                                      setSelectedContractForComplete(contract);
                                      setMarkCompleteModalOpen(true);
                                    }}
                                    className="w-full"
                                  >
                                    Mark Work Complete
                                  </Button>
                                  <p className="text-sm text-muted-foreground mt-2 text-center">
                                    Mark complete when all work is finished and ready for client review
                                  </p>
                                </div>
                              )}

                              {/* Evidence upload for provider when Work Completed */}
                              {!isClient && contract.status === "Work Completed" && (
                                <EvidencePhotoUpload
                                  contractId={contract.id}
                                  photoType="after"
                                  uploaderRole="provider"
                                  currentPhotos={[]}
                                  currentStatus="not_uploaded"
                                  otherPartyStatus="not_uploaded"
                                  onUpdate={() => loadContracts(user!.id)}
                                />
                              )}

                              {/* Review submission when evidence uploaded */}
                              {contract.status === "Evidence Uploaded" && (
                                <Button onClick={() => handleOpenReviewModal(contract)}>
                                  Submit Review
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="routine" className="space-y-4">
            {routineContracts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No routine arrangements found
                </CardContent>
              </Card>
            ) : (
              routineContracts.map((routine) => {
                const isClient = routine.client_id === user?.id;
                const otherParty = isClient ? routine.provider : routine.client;
                
                return (
                  <Card key={routine.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{routine.project.title}</CardTitle>
                          <CardDescription>
                            {isClient ? "Service Provider" : "Client"}: {otherParty?.full_name}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p className="font-semibold capitalize">{routine.frequency}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-semibold">
                            {new Date(routine.start_date).toLocaleDateString("en-NZ")}
                          </p>
                        </div>
                      </div>

                      {routine.selected_days && routine.selected_days.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Days of Week:</p>
                          <div className="flex gap-2 flex-wrap">
                            {routine.selected_days.map((day: string) => (
                              <Badge key={day} variant="outline">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseRoutine(routine.id)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelRoutine(routine.id)}
                        >
                          Cancel Routine
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {contracts.filter(c => c.status === "Completed" || c.status === "Awaiting Fund Release" || c.status === "cancelled").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No archived contracts found
                </CardContent>
              </Card>
            ) : (
              contracts
                .filter(c => c.status === "Completed" || c.status === "Awaiting Fund Release" || c.status === "cancelled")
                .map((contract) => {
                  const isClient = contract.client_id === user?.id;
                  const otherParty = isClient ? contract.provider : contract.client;
                  
                  return (
                    <Card key={contract.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{contract.project.title}</CardTitle>
                            <CardDescription>
                              {isClient ? "Service Provider" : "Client"}: {otherParty?.full_name}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">{contract.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Final Price</p>
                            <p className="font-semibold">${contract.agreed_price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{contract.status === "cancelled" ? "Cancelled" : "Completed"}</p>
                            <p className="font-semibold">
                              {new Date(contract.updated_at).toLocaleDateString("en-NZ")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Submission Modal */}
      {selectedContract && (
        <ReviewSubmissionModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedContract(null);
          }}
          contractId={selectedContract.id}
          clientId={selectedContract.client_id}
          providerId={selectedContract.provider_id}
          reviewerRole={selectedContract.client_id === user?.id ? "client" : "provider"}
          revieweeName={
            selectedContract.client_id === user?.id
              ? selectedContract.provider?.full_name || "Provider"
              : selectedContract.client?.full_name || "Client"
          }
          projectTitle={selectedContract.project.title}
          onReviewSubmitted={handleReviewSubmitted}
          onRoutinePromptTrigger={handleRoutinePromptTrigger}
        />
      )}

      {/* Routine Contract Prompt */}
      {routinePromptContract && (
        <RoutineContractPrompt
          isOpen={routinePromptOpen}
          onClose={() => {
            setRoutinePromptOpen(false);
            setRoutinePromptContract(null);
          }}
          contractId={routinePromptContract.id}
          projectId={routinePromptContract.project_id}
          clientId={routinePromptContract.client_id}
          providerId={routinePromptContract.provider_id}
          clientName={routinePromptContract.client?.full_name || "Client"}
          providerName={routinePromptContract.provider?.full_name || "Provider"}
          projectTitle={routinePromptContract.project.title}
          userRole={routinePromptContract.client_id === user?.id ? "client" : "provider"}
          isDomesticHelper={routinePromptContract.project.category_id === "domestic-helper"}
        />
      )}

      {/* Mark Work Complete Modal */}
      {selectedContractForComplete && (
        <MarkCompleteModal
          isOpen={markCompleteModalOpen}
          onClose={() => {
            setMarkCompleteModalOpen(false);
            setSelectedContractForComplete(null);
          }}
          onConfirm={handleMarkWorkComplete}
          projectTitle={selectedContractForComplete.project.title}
          isSubmitting={isMarkingComplete}
        />
      )}

      {/* Contract Chat - Only for paid contracts */}
      {selectedContract?.payment_status === "paid" && user && (
        <ContractChat
          contractId={selectedContract.id}
          currentUserId={user.id}
          clientId={selectedContract.client_id}
          providerId={selectedContract.provider_id}
          clientName={selectedContract.client?.full_name || "Client"}
          providerName={selectedContract.provider?.full_name || "Provider"}
        />
      )}

      {/* Additional Charges Section */}
      {user?.id === selectedContract?.provider_id && 
        selectedContract?.status === "in_progress" && (
        <AdditionalChargeRequest 
          contractId={selectedContract.id}
          providerId={selectedContract.provider_id}
          clientId={selectedContract.client_id}
          onRequestSubmitted={() => { if (user) loadContracts(user.id); }}
        />
      )}

      {/* List of All Additional Charges */}
      {selectedContract && (
        <AdditionalChargesList
          charges={selectedContract.additional_charges || []}
          isClient={user?.id === selectedContract.client_id}
          onUpdate={() => { if (user) loadContracts(user.id); }}
        />
      )}
    </div>
  );
}