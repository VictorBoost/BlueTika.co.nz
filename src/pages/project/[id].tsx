import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { BidCard } from "@/components/BidCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeft, MapPin, DollarSign, User } from "lucide-react";
import { projectService } from "@/services/projectService";
import { bidService } from "@/services/bidService";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;
type Bid = Tables<"bids">;

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<(Bid & { profiles?: { full_name: string | null; email: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [bidForm, setBidForm] = useState({ amount: "", message: "" });

  useEffect(() => {
    if (id) {
      loadProjectAndBids();
      checkAuth();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: session } = await authService.getSession();
    setUserId(session?.user?.id || null);
  };

  const loadProjectAndBids = async () => {
    setLoading(true);
    
    const { data: projectData } = await projectService.getProject(id as string);
    if (projectData) {
      setProject(projectData);
    }

    const { data: bidsData } = await bidService.getBidsForProject(id as string);
    if (bidsData) {
      setBids(bidsData);
    }
    
    setLoading(false);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a bid",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    const { data, error } = await bidService.createBid({
      project_id: id as string,
      provider_id: userId,
      amount: parseFloat(bidForm.amount),
      message: bidForm.message,
    });

    if (error) {
      toast({
        title: "Error submitting bid",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      toast({
        title: "Bid submitted!",
        description: "The project owner will review your bid",
      });
      setBidForm({ amount: "", message: "" });
      loadProjectAndBids();
    }
    
    setSubmitting(false);
  };

  const handleAcceptBid = async (bidId: string) => {
    setAccepting(bidId);
    
    const { data, error } = await bidService.acceptBid(bidId);
    
    if (error) {
      toast({
        title: "Error accepting bid",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      toast({
        title: "Bid accepted!",
        description: "A contract has been created. View it in your contracts page.",
      });
      loadProjectAndBids();
    }
    
    setAccepting(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button asChild>
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  const isProjectOwner = userId === project.client_id;
  const hasSubmittedBid = bids.some(bid => bid.provider_id === userId);

  return (
    <>
      <SEO 
        title={`${project.title} - BlueTika`} 
        description={project.description.substring(0, 155)} 
      />
      
      <div className="min-h-screen flex flex-col">
        <div className="container py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Project Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">{project.title}</CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{project.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Posted by Client</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-2xl font-bold">NZD ${project.budget.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bids Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Bids ({bids.length})</CardTitle>
                  <CardDescription>
                    {isProjectOwner 
                      ? "Review and accept bids from service providers" 
                      : "Bids submitted by service providers"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bids.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No bids yet</p>
                  ) : (
                    <div className="space-y-4">
                      {bids.map(bid => (
                        <BidCard 
                          key={bid.id} 
                          bid={bid} 
                          isProjectOwner={isProjectOwner}
                          onAccept={handleAcceptBid}
                          accepting={accepting === bid.id}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bid Submission Form */}
            {!isProjectOwner && project.status === "open" && (
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Submit a Bid</CardTitle>
                    <CardDescription>
                      {hasSubmittedBid ? "You've already submitted a bid" : "Place your bid on this project"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasSubmittedBid ? (
                      <p className="text-sm text-muted-foreground">
                        Your bid is pending review by the project owner.
                      </p>
                    ) : (
                      <form onSubmit={handleSubmitBid} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Your Bid (NZD)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="e.g. 4500"
                            min="1"
                            step="0.01"
                            value={bidForm.amount}
                            onChange={(e) => setBidForm(prev => ({ ...prev, amount: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            placeholder="Explain why you're the right fit for this project..."
                            rows={5}
                            value={bidForm.message}
                            onChange={(e) => setBidForm(prev => ({ ...prev, message: e.target.value }))}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting}>
                          {submitting ? "Submitting..." : "Submit Bid"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}