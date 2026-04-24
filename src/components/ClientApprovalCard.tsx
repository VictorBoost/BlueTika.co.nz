import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { paymentService } from "@/services/paymentService";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";

interface ClientApprovalCardProps {
  contractId: string;
  clientApprovalDeadline: string | null;
  paymentStatus: string;
  providerId: string;
  projectTitle: string;
  onApprovalComplete: () => void;
}

export function ClientApprovalCard({
  contractId,
  clientApprovalDeadline,
  paymentStatus,
  providerId,
  projectTitle,
  onApprovalComplete,
}: ClientApprovalCardProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  if (paymentStatus !== "held" || !clientApprovalDeadline) {
    return null;
  }

  const deadline = new Date(clientApprovalDeadline);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const isPastDeadline = now > deadline;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const { error } = await paymentService.capturePayment(contractId, "client_approval");
      
      if (error) throw error;

      await notificationService.createNotification(
        providerId,
        "Payment Released",
        "Payment for \"" + projectTitle + "\" has been approved and released. Funds will arrive in 2-3 business days.",
        "payment",
        contractId
      );

      toast({
        title: "Payment Released",
        description: "The provider's payment has been approved and will arrive in their account in 2-3 business days.",
      });

      setShowApprovalDialog(false);
      onApprovalComplete();
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to approve payment",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <>
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Payment Approval Required
          </CardTitle>
          <CardDescription>
            Your payment is being held securely. Please review the work and approve payment release.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">Time Remaining</p>
              <p className="text-sm text-muted-foreground">
                {isPastDeadline ? (
                  <span className="text-accent">Auto-releasing soon...</span>
                ) : (
                  `${hoursRemaining} hours until auto-release`
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-accent">{hoursRemaining}h</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <p>Your payment is held securely by BlueTika</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <p>Review the provider's work before approving</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p>If you don't approve within {Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60))} hours, payment will auto-release to the provider</p>
            </div>
          </div>

          <Button
            onClick={() => setShowApprovalDialog(true)}
            className="w-full"
            size="lg"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Approve & Release Payment
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payment Release?</AlertDialogTitle>
            <AlertDialogDescription>
              This will release the payment to the service provider. Funds will arrive in their account in 2-3 business days.
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-success hover:bg-success/90"
            >
              {isApproving ? "Approving..." : "Yes, Approve Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}