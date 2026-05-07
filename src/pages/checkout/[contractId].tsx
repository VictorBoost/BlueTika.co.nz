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
import { Loader2, HelpCircle, ShieldCheck, CheckCircle2, Calendar, AlertCircle } from "lucide-react";
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

interface CheckoutFormProps {
  contract: Contract & {
    project?: { title: string; slug?: string | null };
    profiles?: { full_name: string | null; email: string | null };
  };
  clientSecret: string;
  platformFee: number;
  paymentProcessingFee: number;
  totalAmount: number;
}

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
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";
        const receipt = await receiptService.generateReceipt(contract.id, baseUrl);
        if (receipt) {
          await Promise.all([
            receiptService.sendClientReceipt(receipt, baseUrl),
            receiptService.sendProviderReceipt(receipt, baseUrl),
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
        "payment",
        contract.id
      );

      await notificationService.createNotification(
        contract.provider_id,
        "Payment received",
        `Payment received for "${contract.project?.title}". Complete the work and upload evidence photos to release funds.`,
        "payment",
        contract.id
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
          <span>NZD ${platformFee.toLocaleString()}</span>
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
          <span>NZD ${paymentProcessingFee.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>GST:</span>
          <span>Not applicable</span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>NZD ${totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Your payment will be held securely until the project is complete and both parties have reviewed each other.
        </AlertDescription>
      </Alert>

      <Button 
        type="submit"
        disabled={processing} 
        className="w-full"
        size="lg"
      >
        {processing ? "Processing..." : `Pay NZD ${totalAmount.toLocaleString()}`}
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
    projects?: { title: string; location: string; specific_date?: string | null; date_from?: string | null; slug?: string | null };
    profiles?: { full_name: string | null; email: string | null };
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [processingPercentage, setProcessingPercentage] = useState(2.65);
  const [fees, setFees] = useState({
    platformFee: 0,
    processingFee: 0,
    total: 0,
  });
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    if (contractId) {
      loadContract();
      loadProcessingPercentage();
      initStripe();
    }
  }, [contractId]);

  const initStripe = async () => {
    const stripe = await paymentService.getStripe();
    setStripePromise(stripe);
  };

  const loadContract = async () => {
    setLoading(true);
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const { data } = await contractService.getUserContracts(session.user.id);
    const foundContract = data?.find(c => c.id === contractId);

    if (foundContract) {
      setContract(foundContract);
      if (foundContract.payment_status === "confirmed") {
        setPaymentConfirmed(true);
      } else {
        // Create payment intent when contract is loaded
        createPaymentIntent(foundContract);
      }
    }
    setLoading(false);
  };

  const createPaymentIntent = async (contractData: typeof contract) => {
    if (!contractData) return;

    const { data, error } = await paymentService.createPaymentIntent(contractData.id);
    
    if (error || !data) {
      console.error("Failed to create payment intent:", error);
      return;
    }

    setClientSecret(data.clientSecret);
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

          <Alert className="mb-6 border-accent bg-accent/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Payment Protection Notice:</strong> To keep your funds safe, all communication and extra payments must happen within BlueTika. Once the Service Provider submits 'After' photos, you have 24 hours to raise a dispute. Any workmanship guarantees after payment release are handled directly between you and the Provider. Approved funds are released every Friday.
            </AlertDescription>
          </Alert>

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

                <div className="flex gap-4">
                  <Button onClick={() => router.push("/contracts")} variant="outline" className="flex-1">
                    View Contracts
                  </Button>
                  <Button onClick={() => router.push(`/project/${contract.projects?.slug || contract.project_id}`)} className="flex-1">
                    View Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : clientSecret && stripePromise ? (
            <Card>
              <CardHeader>
                <CardTitle>Complete Payment</CardTitle>
                <CardDescription>Your payment will be held securely until the job is complete</CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    contract={contract}
                    clientSecret={clientSecret}
                    platformFee={fees.platformFee}
                    paymentProcessingFee={fees.processingFee}
                    totalAmount={fees.total}
                  />
                </Elements>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Preparing checkout...</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Footer />
      </div>
    </>
  );
}