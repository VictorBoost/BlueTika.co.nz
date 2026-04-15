import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AcceptBidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  providerName: string;
  bidAmount: number;
}

export function AcceptBidModal({ open, onOpenChange, onConfirm, providerName, bidAmount }: AcceptBidModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Accept this bid?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to accept <span className="font-semibold">{providerName}'s</span> bid of{" "}
              <span className="font-semibold">NZD ${bidAmount.toLocaleString()}</span>.
            </p>
            <p className="text-destructive font-medium">
              Accepting this bid will automatically decline all other bids on this listing. This action cannot be undone.
            </p>
            <p>Are you sure you want to proceed?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Accept Bid
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}