import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { DollarSign, MapPin, Calendar, CalendarPlus, CheckCircle, AlertCircle } from "lucide-react";
import { contractService } from "@/services/contractService";
import { routineBookingService } from "@/services/routineBookingService";
import { authService } from "@/services/authService";
import { googleCalendarService } from "@/services/googleCalendarService";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Contract = Tables<"contracts">;
type RoutineBooking = Tables<"routine_bookings">;

export default function Contracts() {
  const router = useRouter();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<(Contract & {
    projects?: { title: string; location: string };
    profiles?: { full_name: string | null; email: string | null };
  })[]>([]);
  const [routineBookings, setRoutineBookings] = useState<{[key: string]: RoutineBooking[]}>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [checkingCalendar, setCheckingCalendar] = useState(true);
  const [addingToCalendar, setAddingToCalendar] = useState<{[key: string]: boolean}>({});

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
      
      const combined = [...(clientContracts || []), ...(providerContracts || [])];
      setContracts(combined);
      
      // Load routine bookings for each contract
      const bookingsMap: {[key: string]: RoutineBooking[]} = {};
      for (const contract of combined) {
        if (contract.is_routine) {
          const { data: bookings } = await routineBookingService.getContractBookings(contract.id);
          if (bookings && bookings.length > 0) {
            bookingsMap[contract.id] = bookings;
          }
        }
      }
      setRoutineBookings(bookingsMap);
    }
    
    setLoading(false);
  };

  const handleConnectCalendar = () => {
    const authUrl = googleCalendarService.getAuthUrl();
    window.location.href = authUrl;
  };

  const handleAddToCalendar = async (contract: Contract & {
    projects?: { title: string; location: string };
    profiles?: { full_name: string | null; email: string | null };
  }) => {
    if (!userId || !calendarConnected) {
      handleConnectCalendar();
      return;
    }

    setAddingToCalendar(prev => ({ ...prev, [contract.id]: true }));

    try {
      const isClient = contract.client_id === userId;
      const otherPartyName = isClient 
        ? (contract.profiles?.full_name || contract.profiles?.email || "Service Provider")
        : "Client";

      // For routine contracts, add all upcoming sessions
      if (contract.is_routine) {
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
            project: { title: contract.projects?.title || "Project" },
            day_of_week: b.day_of_week,
            provider: isClient ? { full_name: otherPartyName } : undefined,
            client: isClient ? undefined : { full_name: otherPartyName },
          })),
          contract.projects?.location || "Location TBD",
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
          contract.projects?.title || "Project",
          otherPartyName,
          contract.created_at, // Using contract creation date as placeholder
          contract.projects?.location || "Location TBD",
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

  const statusColors = {
    active: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  const getCalendarButtonText = (contract: Contract) => {
    if (contract.is_routine) {
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

  const isCalendarButtonDisabled = (contract: Contract) => {
    if (contract.is_routine) {
      const bookings = routineBookings[contract.id] || [];
      const futureBookings = bookings.filter(b => 
        new Date(b.session_date) >= new Date() && !b.google_calendar_event_id
      );
      return futureBookings.length === 0;
    }
    return !!contract.google_calendar_event_id;
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
                const hasRoutineBookings = contract.is_routine && routineBookings[contract.id]?.length > 0;
                
                return (
                  <Card key={contract.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">
                            {contract.projects?.title || "Project"}
                          </CardTitle>
                          <CardDescription>
                            {isProvider ? "You are the service provider" : `Provider: ${contract.profiles?.full_name || contract.profiles?.email || "Service Provider"}`}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant="outline" className={statusColors[contract.status]}>
                            {contract.status}
                          </Badge>
                          {contract.is_routine && (
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
                          <span>{contract.projects?.location || "N/A"}</span>
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
                      
                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1">
                          <Link href={`/project/${contract.project_id}`}>
                            View Project
                          </Link>
                        </Button>
                        
                        {contract.status === "active" && (
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    </>
  );
}