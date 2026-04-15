import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProgressSteps } from "@/components/ProgressSteps";
import { HelpCircle, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { contractService } from "@/services/contractService";
import { paymentService } from "@/services/paymentService";
import { notificationService } from "@/services/notificationService";
import { authService } from "@/services/authService";
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

export default function Checkout() {
  const router = useRouter();
  const { contractId } = router.query;
  const [contract, setContract] = useState<(Contract & {
    projects?: { title: string };
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

  useEffect(() => {
    if (contractId) {
      loadContract();
      loadProcessingPercentage();
    }
  }, [contractId]);

  const loadContract = async () => {
    setLoading(true);
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const { data } = await contractService.getUserContracts(session.user.id, "client");
    const foundContract = data?.find(c => c.id === contractId);

    if (foundContract) {
      setContract(foundContract);
      if (foundContract.payment_status === "confirmed") {
        setPaymentConfirmed(true);
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
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
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
                </div>

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
                  {processing ? "Processing..." : `Pay NZD $${fees.total.toLocaleString()}`}
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