import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, MapPin, Briefcase, FileText, Flag, User, Phone, Mail, Calendar, CheckCircle2, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
import { ReportModal } from "./ReportModal";
import { getProfileBadges } from "@/services/badgeService";
import type { ProviderBadge as BadgeType } from "@/services/badgeService";
import { ProviderBadge } from "./ProviderBadge";

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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useEffect(() => {
    if (!provider) return;

    async function loadBadges() {
      try {
        const earnedBadges = await getProfileBadges(provider.id);
        setBadges(earnedBadges);
      } catch (error) {
        console.error("Error loading badges:", error);
      } finally {
        setLoadingBadges(false);
      }
    }
    loadBadges();
  }, [provider]);

  if (!provider) return null;

  const rating = provider.average_rating || 0;
  const reviewCount = provider.total_reviews || 0;
  const responseRate = provider.response_rate || 0;
  const publicReviews = provider.reviews?.filter(r => r.is_public) || [];

  const formatMemberSince = () => {
    if (!provider.created_at) return null;
    const date = new Date(provider.created_at);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const memberSince = formatMemberSince();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl flex flex-wrap items-center gap-3">
                  <span>{provider.full_name || "Service Provider"}</span>
                  <ProviderBadge 
                    verificationTier={provider.current_tier}
                    verificationStatus={provider.verification_status}
                    commissionTier={provider.commission_tier}
                  />
                </DialogTitle>
                {memberSince && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {memberSince}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportModalOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Flag className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">
                <User className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="credentials">
                <Briefcase className="h-4 w-4 mr-2" />
                Credentials
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-2" />
                Reviews ({publicReviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {!loadingBadges && badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <ProviderBadge key={badge.id} achievementBadge={badge} />
                  ))}
                </div>
              )}

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

              {provider.location && (
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p>{provider.location}</p>
                </div>
              )}

              {provider.bio && (
                <div>
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{provider.bio}</p>
                </div>
              )}

              {/* Contact Information Section */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Contact Information</h4>
                
                {hasPaidContract ? (
                  <>
                    {provider.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{provider.phone}</span>
                      </div>
                    )}
                    {provider.profiles?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{provider.profiles.email}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <div className="flex items-center gap-2 text-accent mb-2">
                      <MessageSquare className="h-5 w-5" />
                      <span className="font-semibold">Connect via BlueTika</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contact information becomes available after accepting their bid and completing payment. 
                      All communication happens securely through our platform.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-6 mt-6">
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

              {(!provider.provider_categories || provider.provider_categories.length === 0) &&
               (!provider.trade_certificates || provider.trade_certificates.length === 0) && (
                <p className="text-muted-foreground text-center py-8">No credentials available</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-6">
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
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        targetType="user"
        targetId={provider.id}
        targetName={provider.full_name || "Service Provider"}
      />
    </>
  );
}