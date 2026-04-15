import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, User } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Bid = Tables<"bids">;

interface BidCardProps {
  bid: Bid & {
    profiles?: {
      full_name: string | null;
      email: string | null;
    };
  };
  isProjectOwner?: boolean;
  onAccept?: (bidId: string) => void;
  accepting?: boolean;
}

export function BidCard({ bid, isProjectOwner, onAccept, accepting }: BidCardProps) {
  const statusColors = {
    pending: "bg-accent/10 text-accent border-accent/20",
    accepted: "bg-success/10 text-success border-success/20",
    rejected: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">
                {bid.profiles?.full_name || bid.profiles?.email || "Service Provider"}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold text-foreground">
                    NZD ${bid.amount.toLocaleString()}
                  </span>
                </span>
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[bid.status]}>
            {bid.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {bid.message}
        </p>
      </CardContent>
      {isProjectOwner && bid.status === "pending" && onAccept && (
        <CardFooter>
          <Button 
            onClick={() => onAccept(bid.id)} 
            disabled={accepting}
            className="w-full"
          >
            {accepting ? "Accepting..." : "Accept Bid"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}