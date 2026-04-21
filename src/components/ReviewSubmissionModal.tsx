import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { submitReview } from "@/services/reviewService";
import { contractService } from "@/services/contractService";
import { sendAdminFundReleaseNotification, sendRoutineContractInvitation } from "@/services/sesEmailService";
import { areBothReviewsSubmitted } from "@/services/reviewService";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SafetyBanner } from "@/components/SafetyBanner";
import { contentSafetyService } from "@/services/contentSafetyService";

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  clientId: string;
  providerId: string;
  reviewerRole: "client" | "provider";
  revieweeName: string;
  projectTitle: string;
  onReviewSubmitted: () => void;
  onRoutinePromptTrigger?: () => void;
}

export function ReviewSubmissionModal({
  isOpen,
  onClose,
  contractId,
  clientId,
  providerId,
  reviewerRole,
  revieweeName,
  projectTitle,
  onReviewSubmitted,
  onRoutinePromptTrigger
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (reviewText.trim().length < 10) {
      toast({
        title: "Review Too Short",
        description: "Please write at least 10 characters for your review.",
        variant: "destructive"
      });
      return;
    }

    // Validate content safety
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const reviewCheck = contentSafetyService.checkContent(reviewText);
    if (reviewCheck.isBlocked) {
      toast({
        title: "Content Blocked",
        description: reviewCheck.message,
        variant: "destructive",
      });
      
      // Log bypass attempt
      await contentSafetyService.logBypassAttempt(
        user.id,
        reviewText,
        reviewCheck.detectedPatterns,
        "review_submission"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the review
      await submitReview({
        contract_id: contractId,
        client_id: clientId,
        provider_id: providerId,
        reviewer_role: reviewerRole,
        reviewee_role: reviewerRole === "client" ? "provider" : "client",
        rating,
        comment: reviewText,
        is_public: true
      });

      // Check if both reviews are now submitted
      const bothSubmitted = await areBothReviewsSubmitted(contractId);

      if (bothSubmitted) {
        // Update contract status
        await contractService.updateContractStatus(contractId, "Awaiting Fund Release");

        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";

        // Send admin notification
        await sendAdminFundReleaseNotification(contractId, projectTitle, baseUrl);

        // Send routine contract invitations to both parties
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", clientId)
          .single();

        const { data: providerProfile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", providerId)
          .single();

        if (clientProfile && providerProfile) {
          await sendRoutineContractInvitation(
            clientProfile.email,
            clientProfile.full_name || "there",
            "client",
            providerProfile.full_name || "Service Provider",
            projectTitle,
            contractId,
            baseUrl
          );

          await sendRoutineContractInvitation(
            providerProfile.email,
            providerProfile.full_name || "there",
            "provider",
            clientProfile.full_name || "Client",
            projectTitle,
            contractId,
            baseUrl
          );
        }

        toast({
          title: "Review Submitted",
          description: "Both reviews submitted. Admin has been notified to release funds."
        });

        // Trigger routine contract prompt after a short delay
        setTimeout(() => {
          onRoutinePromptTrigger?.();
        }, 1000);
      } else {
        toast({
          title: "Review Submitted",
          description: "Thank you for your review! Waiting for the other party to submit theirs."
        });
      }

      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Your Review</DialogTitle>
          <DialogDescription>
            Share your experience working with {revieweeName} on "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <SafetyBanner />

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Star Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {rating === 0 && "Select a rating"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Written Review */}
          <div className="space-y-2">
            <Label htmlFor="review">Written Review</Label>
            <Textarea
              id="review"
              placeholder="Share details about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {reviewText.length} characters (minimum 10)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}