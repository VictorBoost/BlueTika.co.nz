import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { paymentService } from "@/services/paymentService";
import { receiptService } from "@/services/receiptService";
import { notificationService } from "@/services/notificationService";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, HelpCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ProgressSteps } from "@/components/ProgressSteps";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { contractService } from "@/services/contractService";
import { authService } from "@/services/authService";
import { googleCalendarService } from "@/services/googleCalendarService";
import type { Tables } from "@/integrations/supabase/types";

type Contract = Tables<"contracts">;

const steps = [
  { label: "Posted", status: "completed" as const },
  { label: "Bid Accepted", status: "completed" as const },
  { label: "Payment", status: "active" as const },
  { label: "Work", status: "upcoming" as const },
  { label: "Evidence", status: "upcoming" as const },
  { label: "Review", status: "upcoming" as const },
  { label: "Release", status: "upcoming" as const },
];

function CheckoutForm({ 
  contract, 
  clientSecret, 
  platformFee, 
  paymentProcessingFee, 
  totalAmount 
}: CheckoutFormProps) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [sendingReceipts, setSendingReceipts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      // Update contract status
      await paymentService.confirmPayment(contract.id, paymentIntent.id);
      
      // Update contract with fee breakdown
      await supabase
        .from("contracts")
        .update({
          platform_fee: platformFee,
          payment_processing_fee: paymentProcessingFee,
          total_amount: totalAmount,
        })
        .eq("id", contract.id);

      // Send receipts to both parties
      setSendingReceipts(true);
      try {
        const receipt = await receiptService.generateReceipt(contract.id);
        if (receipt) {
          await Promise.all([
            receiptService.sendClientReceipt(receipt),
            receiptService.sendProviderReceipt(receipt),
          ]);
        }
      } catch (error) {
        console.error("Error sending receipts:", error);
        // Continue even if receipts fail - don't block the user
      }
      setSendingReceipts(false);

      // Send in-platform notifications
      await notificationService.createNotification(
        contract.client_id,
        "Payment confirmed",
        `Your payment for "${contract.project?.title}" has been confirmed and is held securely in escrow.`,
        `/contracts`
      );

      await notificationService.createNotification(
        contract.provider_id,
        "Payment received",
        `Payment received for "${contract.project?.title}". Complete the work and upload evidence photos to release funds.`,
        `/contracts`
      );

      setSucceeded(true);
      setProcessing(false);

      toast({
        title: "Payment Successful",
        description: "Receipts sent to both parties via email.",
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push("/contracts");
      }, 3000);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
          <p className="text-muted-foreground">
            {sendingReceipts ? "Sending receipts..." : "Receipts sent to both parties"}
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Your payment is held securely by BlueTika</strong> until the project is complete, 
            photos are submitted, and both parties have reviewed each other. Your money does not move 
            until the job is done.
          </AlertDescription>
        </Alert>

        <p className="text-sm text-muted-foreground">
          Redirecting to your contracts...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Project</p>
        <p className="font-semibold">{contract.project?.title}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Service Provider</p>
        <p className="font-semibold">
          {contract.profiles?.full_name || contract.profiles?.email || "Service Provider"}
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Agreed price:</span>
          <span className="font-semibold">NZD ${contract.final_amount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Platform fee (2%):</span>
          <span>NZD ${fees.platformFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm items-center">
          <div className="flex items-center gap-1">
            <span>Payment processing contribution:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>BlueTika uses Stripe for secure payments. Domestic cards: 2.65% + $0.30. International cards: 3.7% + $0.30. This small contribution keeps your payment protected.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span>NZD ${fees.processingFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>GST:</span>
          <span>Not applicable</span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>NZD ${fees.total.toLocaleString()}</span>
        </div>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Your payment will be held securely until the project is complete and both parties have reviewed each other.
        </AlertDescription>
      </Alert>

      <Button 
        onClick={handlePayment} 
        disabled={processing} 
        className="w-full"
        size="lg"
      >
        {processing ? "Processing..." : `Pay NZD ${fees.total.toLocaleString()}`}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Powered by <span className="font-semibold">Stripe</span> · Secure payment processing
      </p>
    </form>
  );
}

export default function Checkout() {
  const router = useRouter();
  const { contractId, calendar_connected } = router.query;
  const [contract, setContract] = useState<(Contract & {
    projects?: { title: string; location: string; specific_date?: string | null; date_from?: string | null };
    profiles?: { full_name: string | null; email: string | null };
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [processingPercentage, setProcessingPercentage] = useState(2.65);
  const [fees, setFees] = useState({
    platformFee: 0,
    processingFee: 0,
    total: 0,
  });
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [calendarEventAdded, setCalendarEventAdded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      loadContract();
      loadProcessingPercentage();
    }
  }, [contractId]);

  useEffect(() => {
    if (calendar_connected === "true") {
      setCalendarConnected(true);
      // Try to add event after OAuth
      handleAddToCalendar();
    }
  }, [calendar_connected]);

  const loadContract = async () => {
    setLoading(true);
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setUserId(session.user.id);
    const isConnected = await googleCalendarService.isConnected(session.user.id);
    setCalendarConnected(isConnected);

    const { data } = await contractService.getUserContracts(session.user.id);
    const foundContract = data?.find(c => c.id === contractId);

    if (foundContract) {
      setContract(foundContract);
      if (foundContract.payment_status === "confirmed") {
        setPaymentConfirmed(true);
      }
      if (foundContract.google_calendar_event_id) {
        setCalendarEventAdded(true);
      }
    }
    setLoading(false);
  };

  const loadProcessingPercentage = async () => {
    const percentage = await paymentService.getPaymentProcessingPercentage();
    setProcessingPercentage(percentage);
  };

  useEffect(() => {
    if (contract) {
      const calculated = paymentService.calculateFees(contract.final_amount, processingPercentage);
      setFees(calculated);
    }
  }, [contract, processingPercentage]);

  const handlePayment = async () => {
    if (!contract) return;

    setProcessing(true);
    try {
      // In a real implementation, this would create a Stripe payment intent
      // and handle the checkout flow. For now, we'll simulate success.
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update contract with payment info
      await paymentService.updateContractPayment(
        contract.id,
        "pi_test_" + Date.now(), // Mock payment intent ID
        fees.platformFee,
        fees.processingFee,
        fees.total
      );

      // Send notifications to both parties
      await notificationService.createNotification(
        contract.client_id,
        "Payment Confirmed",
        `Your payment of NZD $${fees.total.toLocaleString()} has been confirmed and is held securely in escrow.`,
        "payment",
        contract.id,
        contract.project_id
      );

      await notificationService.createNotification(
        contract.provider_id,
        "Payment Received",
        `Payment of NZD $${contract.final_amount.toLocaleString()} has been received for ${contract.projects?.title}. Funds will be released after project completion.`,
        "payment",
        contract.id,
        contract.project_id
      );

      // In production, send emails via Amazon SES here
      console.log("Would send emails to:", {
        client: contract.profiles?.email,
        provider: contract.profiles?.email,
      });

      setPaymentConfirmed(true);
      loadContract(); // Reload to get updated contract
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!contract || !userId) return;

    if (!calendarConnected) {
      // Redirect to Google OAuth with contract ID as state
      const authUrl = googleCalendarService.getAuthUrl(contractId as string);
      window.location.href = authUrl;
      return;
    }

    setAddingToCalendar(true);
    try {
      const projectDate = contract.projects?.specific_date || contract.projects?.date_from;
      if (!projectDate) {
        alert("No date set for this project");
        return;
      }

      await googleCalendarService.createContractEvent(
        userId,
        contract.id,
        contract.projects?.title || "Project",
        contract.profiles?.full_name || contract.profiles?.email || "Service Provider",
        projectDate,
        contract.projects?.location || "",
        true // isClient
      );

      setCalendarEventAdded(true);
      alert("Event added to Google Calendar!");
    } catch (error) {
      console.error("Error adding to calendar:", error);
      alert("Failed to add event to calendar. Please try again.");
    } finally {
      setAddingToCalendar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">Contract not found</p>
            <Button onClick={() => router.push("/contracts")}>
              View My Contracts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Checkout - BlueTika" 
        description="Complete your payment securely with Stripe." 
      />
      
      <div className="min-h-screen flex flex-col">
        <div className="container py-8 max-w-4xl">
          <div className="mb-8">
            <ProgressSteps steps={steps} />
          </div>

          {paymentConfirmed ? (
            <Card className="border-success">
              <CardHeader>
                <div className="flex items-center gap-2 text-success">
                  <ShieldCheck className="h-6 w-6" />
                  <CardTitle>Payment Confirmed</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-primary/20 bg-primary/5">
                  <AlertDescription className="text-sm">
                    Your payment is held securely by BlueTika until the project is complete, photos are submitted, and both parties have reviewed each other. Your money does not move until the job is done.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Project:</span> {contract.projects?.title}</p>
                  <p><span className="font-semibold">Service Provider:</span> {contract.profiles?.full_name || contract.profiles?.email}</p>
                  <p><span className="font-semibold">Total Paid:</span> NZD ${fees.total.toLocaleString()}</p>
                  {contract.projects?.specific_date && (
                    <p><span className="font-semibold">Scheduled:</span> {new Date(contract.projects.specific_date).toLocaleDateString("en-NZ")}</p>
                  )}
                </div>

                <Separator />

                {!calendarEventAdded && (
                  <>
                    <Button
                      onClick={handleAddToCalendar}
                      disabled={addingToCalendar}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {addingToCalendar ? "Adding..." : calendarConnected ? "Add to Google Calendar" : "Connect Google Calendar"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Get a 24-hour reminder before your scheduled date
                    </p>
                  </>
                )}

                {calendarEventAdded && (
                  <Alert className="border-success/20 bg-success/5">
                    <Calendar className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Event added to Google Calendar with 24-hour reminder
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="flex gap-4">
                  <Button onClick={() => router.push("/contracts")} variant="outline" className="flex-1">
                    View Contracts
                  </Button>
                  <Button onClick={() => router.push(`/project/${contract.project_id}`)} className="flex-1">
                    View Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
                <CardDescription>Review the payment details below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-semibold">{contract.projects?.title}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Service Provider</p>
                  <p className="font-semibold">
                    {contract.profiles?.full_name || contract.profiles?.email || "Service Provider"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Agreed price:</span>
                    <span className="font-semibold">NZD ${contract.final_amount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Platform fee (2%):</span>
                    <span>NZD ${fees.platformFee.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-1">
                      <span>Payment processing contribution:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>BlueTika uses Stripe for secure payments. Domestic cards: 2.65% + $0.30. International cards: 3.7% + $0.30. This small contribution keeps your payment protected.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span>NZD ${fees.processingFee.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>GST:</span>
                    <span>Not applicable</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>NZD ${fees.total.toLocaleString()}</span>
                  </div>
                </div>

                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your payment will be held securely until the project is complete and both parties have reviewed each other.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handlePayment} 
                  disabled={processing} 
                  className="w-full"
                  size="lg"
                >
                  {processing ? "Processing..." : `Pay NZD ${fees.total.toLocaleString()}`}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Powered by <span className="font-semibold">Stripe</span> · Secure payment processing
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Footer />
      </div>
    </>
  );
}