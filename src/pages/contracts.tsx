import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EvidencePhotoUpload } from "@/components/EvidencePhotoUpload";
import { ReviewSubmissionModal } from "@/components/ReviewSubmissionModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { DollarSign, MapPin, Calendar, CalendarPlus, CheckCircle, Camera, Star, AlertTriangle, AlertCircle } from "lucide-react";
import { contractService } from "@/services/contractService";
import { routineBookingService } from "@/services/routineBookingService";
import { authService } from "@/services/authService";
import { googleCalendarService } from "@/services/googleCalendarService";
import { disputeService } from "@/services/disputeService";
import { getEvidenceStatusSummary, getContractEvidencePhotos, type EvidenceStatusSummary, type EvidencePhoto } from "@/services/evidencePhotoService";
import { hasUserSubmittedReview, areBothReviewsSubmitted } from "@/services/reviewService";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Contract = Tables<"contracts">;
type RoutineBooking = Tables<"routine_bookings">;

type ExtendedContract = Contract & {
  project?: { title: string; location: string; booking_type?: string | null } | null;
  provider?: { full_name: string | null; email: string | null } | null;
  client?: { full_name: string | null; email: string | null } | null;
};

export default function Contracts() {
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<ExtendedContract[]>([]);
  const [routineBookings, setRoutineBookings] = useState<{[key: string]: RoutineBooking[]}>({});
  const [evidenceStatus, setEvidenceStatus] = useState<{[key: string]: EvidenceStatusSummary}>({});
  const [evidencePhotos, setEvidencePhotos] = useState<{[key: string]: EvidencePhoto[]}>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [checkingCalendar, setCheckingCalendar] = useState(true);
  const [addingToCalendar, setAddingToCalendar] = useState<{[key: string]: boolean}>({});
  const [expandedContracts, setExpandedContracts] = useState<{[key: string]: boolean}>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ExtendedContract | null>(null);
  const [userReviewStatus, setUserReviewStatus] = useState<{[key: string]: boolean}>({});
  const [bothReviewsSubmitted, setBothReviewsSubmitted] = useState<{[key: string]: boolean}>({});

  // Dispute state
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeContract, setDisputeContract] = useState<ExtendedContract | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [canDisputeCache, setCanDisputeCache] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadContracts();
    checkCalendarConnection();
    
    // Handle OAuth callback success
    if (router.query.calendar_connected === "true") {
      toast({
        title: "Google Calendar Connected",
        description: "You can now add contracts to your calendar.",
      });
      router.replace("/contracts", undefined, { shallow: true });
    }
    
    // Handle OAuth callback errors
    if (router.query.calendar_error) {
      toast({
        title: "Calendar Connection Failed",
        description: "Please try again.",
        variant: "destructive",
      });
      router.replace("/contracts", undefined, { shallow: true });
    }
  }, [router.query]);

  const checkCalendarConnection = async () => {
    setCheckingCalendar(true);
    const session = await authService.getCurrentSession();
    if (session?.user) {
      const connected = await googleCalendarService.isConnected(session.user.id);
      setCalendarConnected(connected);
    }
    setCheckingCalendar(false);
  };

  const loadContracts = async () => {
    setLoading(true);
    
    const session = await authService.getCurrentSession();
    if (session?.user) {
      setUserId(session.user.id);
      
      const { data: clientContracts } = await contractService.getUserContracts(session.user.id, "client");
      const { data: providerContracts } = await contractService.getUserContracts(session.user.id, "provider");
      
      const combined = [...(clientContracts || []), ...(providerContracts || [])] as unknown as ExtendedContract[];
      setContracts(combined);
      
      // Load routine bookings, evidence status, and photos for each contract
      const bookingsMap: {[key: string]: RoutineBooking[]} = {};
      const statusMap: {[key: string]: EvidenceStatusSummary} = {};
      const photosMap: {[key: string]: EvidencePhoto[]} = {};
      const reviewStatusMap: {[key: string]: boolean} = {};
      const bothReviewsMap: {[key: string]: boolean} = {};
      const canDisputeCache: {[key: string]: boolean} = {};
      
      for (const contract of combined) {
        if (contract.project?.booking_type === "routine") {
          const { data: bookings } = await routineBookingService.getContractBookings(contract.id);
          if (bookings && bookings.length > 0) {
            bookingsMap[contract.id] = bookings;
          }
        }
        
        // Check dispute eligibility
        const isClient = contract.client_id === session.user.id;
        const canDispute = await contractService.canRaiseDispute(contract.id, isClient ? "client" : "provider");
        canDisputeCache[contract.id] = canDispute;

        // Load evidence status and photos for active contracts
        if (contract.status === "active") {
          try {
            const status = await getEvidenceStatusSummary(contract.id);
            statusMap[contract.id] = status;
            
            const photos = await getContractEvidencePhotos(contract.id);
            photosMap[contract.id] = photos;
            
            // Check review status if both after photos are confirmed
            if (status.both_after_confirmed) {
              const isClient = contract.client_id === session.user.id;
              const hasReview = await hasUserSubmittedReview(
                contract.id,
                session.user.id,
                isClient ? "client" : "provider"
              );
              reviewStatusMap[contract.id] = hasReview;
              
              const bothReviews = await areBothReviewsSubmitted(contract.id);
              bothReviewsMap[contract.id] = bothReviews;
            }
          } catch (error) {
            console.error("Error loading evidence data:", error);
          }
        }
      }
      
      setRoutineBookings(bookingsMap);
      setEvidenceStatus(statusMap);
      setEvidencePhotos(photosMap);
      setUserReviewStatus(reviewStatusMap);
      setBothReviewsSubmitted(bothReviewsMap);
      setCanDisputeCache(canDisputeCache);
    }
    
    setLoading(false);
  };

  const toggleContract = (contractId: string) => {
    setExpandedContracts(prev => ({
      ...prev,
      [contractId]: !prev[contractId]
    }));
  };

  const handleEvidenceUpdate = async (contractId: string) => {
    try {
      const status = await getEvidenceStatusSummary(contractId);
      const photos = await getContractEvidencePhotos(contractId);
      setEvidenceStatus(prev => ({
        ...prev,
        [contractId]: status
      }));
      setEvidencePhotos(prev => ({
        ...prev,
        [contractId]: photos
      }));
    } catch (error) {
      console.error("Error updating evidence data:", error);
    }
  };

  const handleConnectCalendar = () => {
    const authUrl = googleCalendarService.getAuthUrl();
    window.location.href = authUrl;
  };

  const handleAddToCalendar = async (contract: ExtendedContract) => {
    if (!userId || !calendarConnected) {
      handleConnectCalendar();
      return;
    }

    setAddingToCalendar(prev => ({ ...prev, [contract.id]: true }));

    try {
      const isClient = contract.client_id === userId;
      const otherPartyName = isClient 
        ? (contract.provider?.full_name || contract.provider?.email || "Service Provider")
        : (contract.client?.full_name || contract.client?.email || "Client");

      // For routine contracts, add all upcoming sessions
      if (contract.project?.booking_type === "routine") {
        const bookings = routineBookings[contract.id] || [];
        const futureBookings = bookings.filter(b => 
          new Date(b.session_date) >= new Date() && !b.google_calendar_event_id
        );

        if (futureBookings.length === 0) {
          toast({
            title: "No Events to Add",
            description: "All sessions are already in your calendar or have passed.",
          });
          setAddingToCalendar(prev => ({ ...prev, [contract.id]: false }));
          return;
        }

        const result = await googleCalendarService.createRoutineBookingEvents(
          userId,
          futureBookings.map(b => ({
            id: b.id,
            session_date: b.session_date,
            project: { title: contract.project?.title || "Project" },
            day_of_week: b.day_of_week,
            provider: isClient ? { full_name: otherPartyName } : undefined,
            client: isClient ? undefined : { full_name: otherPartyName },
          })),
          contract.project?.location || "Location TBD",
          isClient
        );

        toast({
          title: "Calendar Events Added",
          description: `Added ${result.success} of ${futureBookings.length} sessions to your calendar.`,
        });

        // Reload to show updated calendar status
        await loadContracts();
      } else {
        // For one-time contracts, add single event
        if (contract.google_calendar_event_id) {
          toast({
            title: "Already Added",
            description: "This contract is already in your calendar.",
          });
          setAddingToCalendar(prev => ({ ...prev, [contract.id]: false }));
          return;
        }

        const eventId = await googleCalendarService.createContractEvent(
          userId,
          contract.id,
          contract.project?.title || "Project",
          otherPartyName,
          contract.created_at, // Using contract creation date as placeholder if no start date
          contract.project?.location || "Location TBD",
          isClient
        );

        if (eventId) {
          toast({
            title: "Added to Calendar",
            description: "Contract added to your Google Calendar.",
          });
          await loadContracts();
        }
      }
    } catch (error) {
      console.error("Calendar error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to calendar",
        variant: "destructive",
      });
    } finally {
      setAddingToCalendar(prev => ({ ...prev, [contract.id]: false }));
    }
  };

  const handleOpenReviewModal = (contract: ExtendedContract) => {
    setSelectedContract(contract);
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = async () => {
    if (selectedContract) {
      await loadContracts();
    }
  };

  const statusColors = {
    active: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  const getCalendarButtonText = (contract: ExtendedContract) => {
    if (contract.project?.booking_type === "routine") {
      const bookings = routineBookings[contract.id] || [];
      const futureBookings = bookings.filter(b => 
        new Date(b.session_date) >= new Date() && !b.google_calendar_event_id
      );
      const addedCount = bookings.filter(b => b.google_calendar_event_id).length;
      
      if (futureBookings.length === 0 && addedCount > 0) {
        return "All Sessions Added";
      }
      return `Add ${futureBookings.length} Sessions`;
    }
    
    return contract.google_calendar_event_id ? "Added to Calendar" : "Add to Calendar";
  };

  const isCalendarButtonDisabled = (contract: ExtendedContract) => {
    if (contract.project?.booking_type === "routine") {
      const bookings = routineBookings[contract.id] || [];
      const futureBookings = bookings.filter(b => 
        new Date(b.session_date) >= new Date() && !b.google_calendar_event_id
      );
      return futureBookings.length === 0;
    }
    return !!contract.google_calendar_event_id;
  };

  const getPhotosForUpload = (contractId: string, photoType: "before" | "after", role: "client" | "provider") => {
    const photos = evidencePhotos[contractId] || [];
    const photo = photos.find(p => p.photo_type === photoType && p.uploader_role === role);
    return photo?.photo_urls || [];
  };

  const handleMarkWorkDone = async (contractId: string) => {
    try {
      await contractService.markWorkDone(contractId);
      toast({
        title: "Work Marked as Done",
        description: "The 24-hour client dispute window has started.",
      });
      await loadContracts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contract status",
        variant: "destructive",
      });
    }
  };

  const handleOpenDisputeDialog = (contract: ExtendedContract) => {
    setDisputeContract(contract);
    setDisputeReason("");
    setDisputeDialogOpen(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputeContract || !userId || !disputeReason.trim()) return;

    setSubmittingDispute(true);
    try {
      const isClient = disputeContract.client_id === userId;
      
      await disputeService.createDispute({
        contractId: disputeContract.id,
        raisedBy: userId,
        raiserRole: isClient ? "client" : "provider",
        claimDescription: disputeReason
      });

      toast({
        title: "Dispute Raised",
        description: "Our admin team has been notified and will review the case.",
      });
      
      setDisputeDialogOpen(false);
      setDisputeContract(null);
      await loadContracts();
    } catch (error) {
      console.error("Dispute error:", error);
      toast({
        title: "Error",
        description: "Failed to raise dispute",
        variant: "destructive",
      });
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <>
      <SEO 
        title="My Contracts - BlueTika" 
        description="View and manage your active contracts on BlueTika." 
      />
      
      <div className="min-h-screen flex flex-col">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Contracts</h1>
            <p className="text-muted-foreground">Track your active and completed contracts</p>
          </div>

          {!checkingCalendar && !calendarConnected && (
            <Alert className="mb-6 border-accent/20 bg-accent/5">
              <CalendarPlus className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Connect Google Calendar to add your contracts to your schedule</span>
                <Button onClick={handleConnectCalendar} size="sm" variant="outline">
                  Connect Calendar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {calendarConnected && (
            <Alert className="mb-6 border-success/20 bg-success/5">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                Google Calendar connected - You can add contracts to your calendar
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No contracts yet</p>
                <Button asChild>
                  <Link href="/projects">Browse Projects</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {contracts.map(contract => {
                const isProvider = contract.provider_id === userId;
                const isClient = contract.client_id === userId;
                const hasRoutineBookings = contract.project?.booking_type === "routine" && routineBookings[contract.id]?.length > 0;
                const status = evidenceStatus[contract.id];
                const isExpanded = expandedContracts[contract.id];
                const hasSubmittedReview = userReviewStatus[contract.id];
                const bothReviews = bothReviewsSubmitted[contract.id];
                const showReviewButton = status?.both_after_confirmed && !hasSubmittedReview && !bothReviews;
                
                return (
                  <div key={contract.id} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">
                              {contract.project?.title || "Project"}
                            </CardTitle>
                            <CardDescription>
                              {isProvider 
                                ? `Client: ${contract.client?.full_name || contract.client?.email || "Client"}` 
                                : `Provider: ${contract.provider?.full_name || contract.provider?.email || "Service Provider"}`
                              }
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge variant="outline" className={statusColors[contract.status as keyof typeof statusColors] || "bg-muted"}>
                              {contract.status.replace(/_/g, " ")}
                            </Badge>
                            {contract.project?.booking_type === "routine" && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                Routine
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold text-foreground">
                              NZD ${contract.final_amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{contract.project?.location || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(contract.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {hasRoutineBookings && (
                          <div className="text-sm text-muted-foreground">
                            <p>
                              {routineBookings[contract.id].length} sessions scheduled
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2 flex-wrap">
                          <Button asChild variant="outline" className="flex-1">
                            <Link href={`/project/${contract.project_id}`}>
                              View Project
                            </Link>
                          </Button>
                          
                          {(contract.status === "active" || contract.status === "awaiting_fund_release") && (
                            <>
                              <Button
                                onClick={() => handleAddToCalendar(contract)}
                                disabled={isCalendarButtonDisabled(contract) || addingToCalendar[contract.id]}
                                variant={isCalendarButtonDisabled(contract) ? "outline" : "default"}
                                className="flex-1"
                              >
                                {addingToCalendar[contract.id] ? (
                                  <>Adding...</>
                                ) : isCalendarButtonDisabled(contract) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {getCalendarButtonText(contract)}
                                  </>
                                ) : (
                                  <>
                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                    {getCalendarButtonText(contract)}
                                  </>
                                )}
                              </Button>
                              
                              {status && (
                                <Button
                                  onClick={() => toggleContract(contract.id)}
                                  variant="outline"
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Photos
                                </Button>
                              )}

                              {isProvider && contract.status === "active" && status?.both_before_confirmed && !contract.work_done_at && (
                                <Button
                                  onClick={() => handleMarkWorkDone(contract.id)}
                                  variant="outline"
                                  className="bg-primary/5 hover:bg-primary/10 border-primary/20"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Work Done
                                </Button>
                              )}

                              {showReviewButton && (
                                <Button
                                  onClick={() => handleOpenReviewModal(contract)}
                                  variant="default"
                                  className="bg-accent hover:bg-accent/90"
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Submit Review
                                </Button>
                              )}
                              
                              {canDisputeCache[contract.id] && (
                                <Button
                                  onClick={() => handleOpenDisputeDialog(contract)}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Raise Dispute
                                </Button>
                              )}

                              {hasSubmittedReview && !bothReviews && (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20 py-2 px-3">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Review Submitted
                                </Badge>
                              )}

                              {bothReviews && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-2 px-3">
                                  Awaiting Fund Release
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Evidence Photos Section */}
                    {contract.status === "active" && status && isExpanded && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Evidence Photos</h3>
                        
                        {contract.work_done_at && (
                          <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-700">
                              Work has been marked as done. 
                              {isClient ? " You have 24 hours to raise a dispute if there are issues." : " Client has 24 hours to review."}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {/* Before Photos */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <EvidencePhotoUpload
                            contractId={contract.id}
                            photoType="before"
                            uploaderRole={isClient ? "client" : "provider"}
                            currentPhotos={getPhotosForUpload(contract.id, "before", isClient ? "client" : "provider")}
                            currentStatus={isClient ? status.client_before : status.provider_before}
                            otherPartyStatus={isClient ? status.provider_before : status.client_before}
                            onUpdate={() => handleEvidenceUpdate(contract.id)}
                          />
                        </div>

                        {/* After Photos - only show if both before photos are confirmed */}
                        {status.both_before_confirmed && (
                          <div className="grid md:grid-cols-2 gap-4">
                            <EvidencePhotoUpload
                              contractId={contract.id}
                              photoType="after"
                              uploaderRole={isClient ? "client" : "provider"}
                              currentPhotos={getPhotosForUpload(contract.id, "after", isClient ? "client" : "provider")}
                              currentStatus={isClient ? status.client_after : status.provider_after}
                              otherPartyStatus={isClient ? status.provider_after : status.client_after}
                              onUpdate={() => handleEvidenceUpdate(contract.id)}
                            />
                          </div>
                        )}

                        {!status.both_before_confirmed && (
                          <Alert>
                            <AlertDescription>
                              Both parties must confirm their before photos before work can begin and after photos can be uploaded.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <Footer />
      </div>

      {/* Dispute Submission Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Raise Dispute
            </DialogTitle>
            <DialogDescription>
              Please describe the issue in detail. Our admin team will review the evidence photos and your claim to reach a resolution.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dispute-reason">Claim Description</Label>
              <Textarea
                id="dispute-reason"
                placeholder="Describe what went wrong, referencing the evidence photos if applicable..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={5}
              />
            </div>
            <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertDescription>
                Once a dispute is raised, funds will be locked until an admin resolves the case.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisputeDialogOpen(false)}
              disabled={submittingDispute}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitDispute}
              disabled={submittingDispute || !disputeReason.trim()}
            >
              {submittingDispute ? "Submitting..." : "Submit Dispute Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          reviewerRole={selectedContract.client_id === userId ? "client" : "provider"}
          revieweeName={
            selectedContract.client_id === userId
              ? (selectedContract.provider?.full_name || selectedContract.provider?.email || "Service Provider")
              : (selectedContract.client?.full_name || selectedContract.client?.email || "Client")
          }
          projectTitle={selectedContract.project?.title || "Project"}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
}