import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, Award, TrendingUp, MapPin, Briefcase, FileText } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Review = Tables<"reviews">;

interface ProviderProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Profile & {
    reviews?: Review[];
    provider_categories?: Array<{ categories: { name: string } }>;
    trade_certificates?: Array<{ certificate_type: string; document_url: string }>;
  } | null;
}

export function ProviderProfileModal({ open, onOpenChange, provider }: ProviderProfileModalProps) {
  if (!provider) return null;

  const tierConfig = {
    bronze: { name: "Bronze", icon: "🥉", color: "bg-amber-700/10 text-amber-700 border-amber-700/20" },
    silver: { name: "Silver", icon: "🥈", color: "bg-slate-400/10 text-slate-400 border-slate-400/20" },
    gold: { name: "Gold", icon: "🥇", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    platinum: { name: "Platinum", icon: "💎", color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" },
  };

  const tier = tierConfig[provider.commission_tier as keyof typeof tierConfig] || tierConfig.bronze;
  const isVerified = provider.verification_status === "approved";
  const rating = provider.average_rating || 0;
  const reviewCount = provider.total_reviews || 0;
  const responseRate = provider.response_rate || 0;
  const publicReviews = provider.reviews?.filter(r => r.is_public) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Service Provider Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Info */}
          <div>
            <h3 className="text-xl font-semibold mb-2">{provider.full_name || "Service Provider"}</h3>
            <div className="flex flex-wrap gap-2">
              {isVerified && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <Award className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge variant="outline" className={tier.color}>
                <span className="mr-1">{tier.icon}</span>
                {tier.name} Tier
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {rating > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{rating.toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {responseRate > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">{responseRate}%</p>
                      <p className="text-sm text-muted-foreground">Response rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Location */}
          {provider.location && (
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p>{provider.location}</p>
            </div>
          )}

          {/* Bio */}
          {provider.bio && (
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{provider.bio}</p>
            </div>
          )}

          {/* Service Categories */}
          {provider.provider_categories && provider.provider_categories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold">Service Categories</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {provider.provider_categories.map((pc, idx) => (
                  <Badge key={idx} variant="secondary">
                    {pc.categories.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Trade Certificates */}
          {provider.trade_certificates && provider.trade_certificates.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold">Trade Certificates</h4>
              </div>
              <div className="space-y-2">
                {provider.trade_certificates.map((cert, idx) => (
                  <a
                    key={idx}
                    href={cert.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{cert.certificate_type}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Reviews */}
          <div>
            <h4 className="font-semibold mb-4">Reviews ({publicReviews.length})</h4>
            {publicReviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {publicReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}