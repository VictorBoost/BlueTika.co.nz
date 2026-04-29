import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface MarkCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
  isSubmitting?: boolean;
}

export function MarkCompleteModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
  isSubmitting = false,
}: MarkCompleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ready to Submit for Approval?</DialogTitle>
          <DialogDescription>
            Project: {projectTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please ensure you have completed all requirements before marking this work as complete.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm font-medium">Before you continue, make sure:</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span>All work has been completed to the agreed specifications</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span>You've taken "after" photos showing the completed work</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span>The client can inspect and verify the work quality</span>
              </div>
            </div>
          </div>

          <Alert className="border-accent bg-accent/5">
            <AlertDescription className="text-sm">
              <strong>What happens next:</strong> The client will have 48 hours to review and approve your work. 
              Funds will be released after approval or automatically if no dispute is filed within the timeframe.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Marking Complete..." : "Mark Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}