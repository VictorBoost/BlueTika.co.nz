import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { bidService } from "@/services/bidService";
import { DollarSign, Clock, AlertCircle, FileText, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Bid = Tables<"bids">;

export default function MyBids() {
  const router = useRouter();
  const { toast } = useToast();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setCurrentUser(session.user);
    loadBids(session.user.id);
  };

  const loadBids = async (providerId: string) => {
    setLoading(true);
    const { data, error } = await bidService.getProviderBids(providerId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load your bids",
        variant: "destructive",
      });
    } else {
      setBids(data || []);
    }
    setLoading(false);
  };

  const statusColors = {
    pending: "bg-accent/10 text-accent border-accent/20",
    accepted: "bg-success/10 text-success border-success/20",
    rejected: "bg-muted text-muted-foreground border-muted",
  };

  const groupedBids = {
    pending: bids.filter(b => b.status === "pending"),
    accepted: bids.filter(b => b.status === "accepted"),
    rejected: bids.filter(b => b.status === "rejected"),
  };

  return (
    <>
      <SEO 
        title="My Bids - BlueTika" 
        description="View all your submitted project bids and their status" 
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-card">
          <div className="container py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              BlueTika
            </Link>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/projects">Browse Projects</Link>
              </Button>
              <Button asChild>
                <Link href="/contracts">My Contracts</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12">
          <div className="container max-w-5xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">My Bids</h1>
              <p className="text-muted-foreground">Track all your submitted project bids</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your bids...</p>
              </div>
            ) : bids.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No bids yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start bidding on projects to grow your business
                  </p>
                  <Button asChild>
                    <Link href="/projects">Browse Projects</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {groupedBids.pending.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Pending ({groupedBids.pending.length})
                    </h2>
                    <div className="grid gap-4">
                      {groupedBids.pending.map(bid => (
                        <BidStatusCard key={bid.id} bid={bid} />
                      ))}
                    </div>
                  </div>
                )}

                {groupedBids.accepted.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Accepted ({groupedBids.accepted.length})
                    </h2>
                    <div className="grid gap-4">
                      {groupedBids.accepted.map(bid => (
                        <BidStatusCard key={bid.id} bid={bid} />
                      ))}
                    </div>
                  </div>
                )}

                {groupedBids.rejected.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Declined ({groupedBids.rejected.length})
                    </h2>
                    <div className="grid gap-4">
                      {groupedBids.rejected.map(bid => (
                        <BidStatusCard key={bid.id} bid={bid} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}

function BidStatusCard({ bid }: { bid: any }) {
  const statusColors = {
    pending: "bg-accent/10 text-accent border-accent/20",
    accepted: "bg-success/10 text-success border-success/20",
    rejected: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">
              {bid.projects?.title || "Project"}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={statusColors[bid.status]}>
                {bid.status}
              </Badge>
              {bid.projects?.category && (
                <Badge variant="secondary">
                  {bid.projects.category.name}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="outline" asChild size="sm">
            <Link href={`/project/${bid.projects?.slug || bid.project_id}`}>
              View Project <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Your Bid</span>
            </div>
            <p className="text-xl font-bold">NZD ${bid.amount.toLocaleString()}</p>
          </div>
          {bid.estimated_timeline && (
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Timeline</span>
              </div>
              <p className="text-lg">{bid.estimated_timeline}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Your Message</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {bid.message}
          </p>
        </div>

        {bid.trade_certificate_url && (
          <div>
            <p className="text-sm font-medium mb-2">Trade Certificate</p>
            <Button variant="outline" size="sm" asChild>
              <a href={bid.trade_certificate_url} target="_blank" rel="noopener noreferrer">
                View Certificate
              </a>
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground pt-2 border-t">
          Submitted {new Date(bid.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}