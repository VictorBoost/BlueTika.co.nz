import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, User, Clock, FileText, Star, TrendingUp, Award } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Bid = Tables<"bids">;

interface BidCardProps {
  bid: Bid & {
    profiles?: {
      full_name: string | null;
      email: string | null;
      average_rating: number | null;
      total_reviews: number | null;
      response_rate: number | null;
      commission_tier: string | null;
      verification_status: string | null;
    };
  };
  isProjectOwner?: boolean;
  onAccept?: (bidId: string) => void;
  onViewProvider?: (providerId: string) => void;
  accepting?: boolean;
}

export function BidCard({ bid, isProjectOwner, onAccept, onViewProvider, accepting }: BidCardProps) {
  const statusColors = {
    pending: "bg-accent/10 text-accent border-accent/20",
    accepted: "bg-success/10 text-success border-success/20",
    rejected: "bg-muted text-muted-foreground border-muted",
  };

  const tierConfig = {
    bronze: { name: "Bronze", icon: "🥉", color: "bg-amber-700/10 text-amber-700 border-amber-700/20" },
    silver: { name: "Silver", icon: "🥈", color: "bg-slate-400/10 text-slate-400 border-slate-400/20" },
    gold: { name: "Gold", icon: "🥇", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    platinum: { name: "Platinum", icon: "💎", color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" },
  };

  const tier = tierConfig[bid.profiles?.commission_tier as keyof typeof tierConfig] || tierConfig.bronze;
  const isVerified = bid.profiles?.verification_status === "approved";
  const rating = bid.profiles?.average_rating || 0;
  const reviewCount = bid.profiles?.total_reviews || 0;
  const responseRate = bid.profiles?.response_rate || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => onViewProvider?.(bid.provider_id)}
                className="flex items-center gap-2 hover:underline"
              >
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">
                  {bid.profiles?.full_name || bid.profiles?.email || "Service Provider"}
                </CardTitle>
              </button>
              {isVerified && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <Award className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge variant="outline" className={tier.color}>
                <span className="mr-1">{tier.icon}</span>
                {tier.name}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm">
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
              )}
              {responseRate > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>{responseRate}% response rate</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <CardDescription className="text-sm">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold text-foreground text-lg">
                    NZD ${bid.amount.toLocaleString()}
                  </span>
                </span>
              </CardDescription>
              {bid.estimated_timeline && (
                <CardDescription className="text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{bid.estimated_timeline}</span>
                </CardDescription>
              )}
            </div>
          </div>
          <Badge variant="outline" className={statusColors[bid.status]}>
            {bid.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">Terms & What's Included</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {bid.message}
          </p>
        </div>
        
        {bid.trade_certificate_url && (
          <div className="pt-2 border-t">
            <Button variant="outline" size="sm" asChild className="w-full">
              <a href={bid.trade_certificate_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                View Trade Certificate
              </a>
            </Button>
          </div>
        )}
      </CardContent>
      {isProjectOwner && bid.status === "pending" && onAccept && (
        <CardFooter className="flex gap-2">
          <Button 
            onClick={() => onViewProvider?.(bid.provider_id)}
            variant="outline"
            className="flex-1"
          >
            View Full Profile
          </Button>
          <Button 
            onClick={() => onAccept(bid.id)} 
            disabled={accepting}
            className="flex-1"
          >
            {accepting ? "Accepting..." : "Accept Bid"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}