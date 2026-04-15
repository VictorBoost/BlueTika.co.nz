import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { projectService } from "@/services/projectService";
import { bidService } from "@/services/bidService";
import { BidCard } from "@/components/BidCard";
import { ProviderProfileModal } from "@/components/ProviderProfileModal";
import { AcceptBidModal } from "@/components/AcceptBidModal";
import { MapPin, DollarSign, Calendar, AlertCircle, Clock, Tag, Video as VideoIcon, RefreshCw, FileText, Shield } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Project = Tables<"projects">;
type Bid = Tables<"bids">;

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isDHVerified, setIsDHVerified] = useState(false);
  const [commissionTier, setCommissionTier] = useState<string>("bronze");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [tradeCertFile, setTradeCertFile] = useState<File | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [acceptBidModalOpen, setAcceptBidModalOpen] = useState(false);
  const [bidToAccept, setBidToAccept] = useState<any>(null);
  const [bidData, setBidData] = useState({
    amount: "",
    estimated_timeline: "",
    message: "",
  });

  useEffect(() => {
    if (id) {
      loadProject();
      checkUser();
    }
  }, [id]);

  useEffect(() => {
    if (project?.expires_at && !project?.is_expired) {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [project]);

  const updateTimeRemaining = () => {
    if (!project?.expires_at) return;
    
    const now = new Date();
    const expiresAt = new Date(project.expires_at);
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining("Expired");
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h remaining`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    } else {
      setTimeRemaining(`${minutes}m remaining`);
    }
  };

  const checkUser = async () => {
    const session = await authService.getCurrentSession();
    if (session?.user) {
      setCurrentUser(session.user);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_provider, verification_status, domestic_helper_verified, commission_tier")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        setIsProvider(profile.is_provider || false);
        setIsVerified(profile.verification_status === "approved");
        setIsDHVerified(profile.domestic_helper_verified || false);
        setCommissionTier(profile.commission_tier || "bronze");
      }
    }
  };

  const loadProject = async () => {
    setLoading(true);
    const { data, error } = await projectService.getProject(id as string);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
      router.push("/projects");
    } else {
      setProject(data);
      setBids(data?.bids || []);
    }
    
    setLoading(false);
  };

  const handleViewProvider = async (providerId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        reviews!reviews_provider_id_fkey(
          id,
          rating,
          comment,
          is_public,
          created_at
        ),
        provider_categories!provider_categories_provider_id_fkey(
          categories!provider_categories_category_id_fkey(name)
        ),
        trade_certificates!trade_certificates_provider_id_fkey(
          certificate_type,
          document_url
        )
      `)
      .eq("id", providerId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load provider profile",
        variant: "destructive",
      });
      return;
    }

    setSelectedProvider(data);
    setProviderModalOpen(true);
  };

  const handleAcceptBidClick = (bid: any) => {
    setBidToAccept(bid);
    setAcceptBidModalOpen(true);
  };

  const handleConfirmAcceptBid = async () => {
    if (!bidToAccept || !project || !currentUser) return;

    setAccepting(true);
    setAcceptBidModalOpen(false);

    const { data, error } = await bidService.acceptBid(
      bidToAccept.id,
      project.id,
      currentUser.id
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept bid. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Bid accepted! Redirecting to checkout...",
      });
      // Redirect to checkout page with the contract ID
      router.push(`/checkout/${data.id}`);
    }

    setAccepting(false);
    setBidToAccept(null);
  };

  const handleReopenProject = async () => {
    if (!project) return;
    
    setReopening(true);
    
    const { data, error } = await supabase
      .from("projects")
      .update({
        is_expired: false,
        status: "open",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        reopened_count: (project.reopened_count || 0) + 1,
        last_reopened_at: new Date().toISOString(),
      })
      .eq("id", project.id)
      .select()
      .single();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to reopen project",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Project reopened for 30 more days",
      });
      setProject(data);
    }
    
    setReopening(false);
  };

  const handleTradeCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Trade certificate must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, JPG, or PNG file",
        variant: "destructive",
      });
      return;
    }

    setTradeCertFile(file);
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a bid",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    
    if (!isProvider) {
      toast({
        title: "Provider account required",
        description: "Only service providers can submit bids",
        variant: "destructive",
      });
      return;
    }
    
    if (!isVerified) {
      toast({
        title: "Verification required",
        description: "Please complete verification before submitting bids",
        variant: "destructive",
      });
      router.push("/provider/verify");
      return;
    }

    const isDomesticHelper = project.category?.name === "Domestic Helper";
    if (isDomesticHelper && !isDHVerified) {
      toast({
        title: "Domestic Helper verification required",
        description: "You must complete Domestic Helper verification (including police check and first aid certificate) to bid on this listing",
        variant: "destructive",
      });
      router.push("/provider/verify-domestic-helper");
      return;
    }
    
    setSubmitting(true);

    let tradeCertUrl = null;
    if (tradeCertFile) {
      setUploadingCert(true);
      tradeCertUrl = await bidService.uploadTradeCertificate(tradeCertFile, currentUser.id);
      setUploadingCert(false);
      
      if (!tradeCertUrl) {
        toast({
          title: "Upload failed",
          description: "Failed to upload trade certificate. Please try again.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    }
    
    const { data, error } = await bidService.createBid({
      project_id: id as string,
      provider_id: currentUser.id,
      amount: parseFloat(bidData.amount),
      estimated_timeline: bidData.estimated_timeline,
      message: bidData.message,
      trade_certificate_url: tradeCertUrl,
      status: "pending",
      is_visible: true
    });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Bid submitted successfully!",
      });
      setBidData({ amount: "", estimated_timeline: "", message: "" });
      setTradeCertFile(null);
      loadProject();
    }
    
    setSubmitting(false);
  };

  const formatDatePreference = () => {
    if (!project) return "";
    
    switch (project.date_preference) {
      case "asap_flexible":
        return "ASAP or Flexible";
      case "specific_date":
        return `Specific Date: ${new Date(project.specific_date).toLocaleDateString()}`;
      case "date_range":
        return `${new Date(project.date_from).toLocaleDateString()} - ${new Date(project.date_to).toLocaleDateString()}`;
      default:
        return "Not specified";
    }
  };

  const getTierInfo = () => {
    const tiers = {
      bronze: { name: "Bronze", color: "bg-amber-700/10 text-amber-700 border-amber-700/20" },
      silver: { name: "Silver", color: "bg-slate-400/10 text-slate-400 border-slate-400/20" },
      gold: { name: "Gold", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      platinum: { name: "Platinum", color: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" },
    };
    return tiers[commissionTier as keyof typeof tiers] || tiers.bronze;
  };

  if (loading) {
    return (
      <>
        <SEO title="Loading Project - BlueTika" />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </>
    );
  }

  if (!project) {
    return null;
  }

  const statusColors: Record<string, string> = {
    open: "bg-success/10 text-success border-success/20",
    in_progress: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-muted text-muted-foreground border-muted",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  const isOwner = currentUser?.id === project.client_id;
  const isDomesticHelper = project.category?.name === "Domestic Helper";
  const canBid = isProvider && isVerified && !isOwner && project.status === "open" && !project.is_expired && (!isDomesticHelper || isDHVerified);
  const photos = project.photos || [];
  const hasMedia = photos.length > 0 || project.video_url;
  const tierInfo = getTierInfo();

  return (
    <>
      <SEO 
        title={`${project.title} - BlueTika`}
        description={project.description}
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
              {currentUser ? (
                <>
                  {isProvider && (
                    <Button variant="ghost" asChild>
                      <Link href="/my-bids">My Bids</Link>
                    </Button>
                  )}
                  <Button asChild>
                    <Link href="/contracts">My Contracts</Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 py-12">
          <div className="container max-w-5xl">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-3xl mb-2">{project.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Badge variant="outline" className={statusColors[project.status]}>
                            {project.status.replace("_", " ")}
                          </Badge>
                          {project.category && (
                            <Badge variant="secondary">
                              <Tag className="h-3 w-3 mr-1" />
                              {project.category.name}
                            </Badge>
                          )}
                          {project.subcategory && (
                            <Badge variant="outline">
                              {project.subcategory.name}
                            </Badge>
                          )}
                          {project.is_expired && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {project.is_expired && isOwner && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>This project has expired. Reopen it to accept new bids.</span>
                          <Button 
                            onClick={handleReopenProject} 
                            disabled={reopening}
                            size="sm"
                            className="ml-4"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {reopening ? "Reopening..." : "Reopen Project"}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {!project.is_expired && project.expires_at && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          {timeRemaining} until this project expires
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <h3 className="font-semibold text-lg mb-2">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                    </div>

                    {hasMedia && (
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Project Media</h3>
                        
                        {photos.length > 0 && (
                          <div className="space-y-4">
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                              <img
                                src={photos[selectedPhotoIndex]}
                                alt={`Project photo ${selectedPhotoIndex + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {photos.length > 1 && (
                              <div className="grid grid-cols-5 gap-2">
                                {photos.map((photo: string, index: number) => (
                                  <button
                                    key={index}
                                    onClick={() => setSelectedPhotoIndex(index)}
                                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                                      index === selectedPhotoIndex
                                        ? "border-primary"
                                        : "border-transparent hover:border-muted-foreground"
                                    }`}
                                  >
                                    <img
                                      src={photo}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {project.video_url && (
                          <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <VideoIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Project Video</span>
                            </div>
                            <video
                              controls
                              className="w-full rounded-lg"
                              src={project.video_url}
                            >
                              Your browser does not support video playback.
                            </video>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm font-medium">Budget</span>
                        </div>
                        <p className="text-2xl font-bold">
                          NZD ${project.budget.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm font-medium">Location</span>
                        </div>
                        <p className="text-lg">{project.location}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">Date Preference</span>
                        </div>
                        <p className="text-lg">{formatDatePreference()}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Posted</span>
                        </div>
                        <p className="text-lg">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isDomesticHelper && isProvider && !isDHVerified && !isOwner && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>Domestic Helper verification required to bid on this listing (police check + first aid certificate)</span>
                        <Button variant="outline" size="sm" asChild className="ml-4">
                          <Link href="/provider/verify-domestic-helper">
                            Complete Verification
                          </Link>
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {canBid && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Submit Your Bid</CardTitle>
                          <CardDescription>
                            Make your offer for this project
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={tierInfo.color}>
                          {tierInfo.name} Tier
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleBidSubmit} className="space-y-4">
                        <Alert className="bg-accent/5 border-accent/20">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <p className="font-medium mb-1">Commission Rate: 8% (Promotional)</p>
                            <p className="text-sm text-muted-foreground">
                              Currently all tiers are at 8% promotional rate. Standard rates will apply after the promotional period.
                            </p>
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label htmlFor="amount">Your Bid Amount (NZD) *</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder={project.budget.toString()}
                            value={bidData.amount}
                            onChange={(e) => setBidData({ ...bidData, amount: e.target.value })}
                            min="0"
                            step="0.01"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            8% commission will be added to your bid at checkout
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timeline">Estimated Timeline *</Label>
                          <Input
                            id="timeline"
                            placeholder="e.g., 2 weeks, 3-5 days, 1 month"
                            value={bidData.estimated_timeline}
                            onChange={(e) => setBidData({ ...bidData, estimated_timeline: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Description of Terms & What's Included *</Label>
                          <Textarea
                            id="message"
                            placeholder="Explain your approach, what's included in your bid, payment terms, and why you're the right person for this job..."
                            value={bidData.message}
                            onChange={(e) => setBidData({ ...bidData, message: e.target.value })}
                            rows={6}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tradeCert">Trade Certificate (Optional)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="tradeCert"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleTradeCertUpload}
                              className="cursor-pointer"
                            />
                          </div>
                          {tradeCertFile && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{tradeCertFile.name} ({(tradeCertFile.size / 1024 / 1024).toFixed(2)}MB)</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG, or PNG. Max 10MB
                          </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting || uploadingCert}>
                          {submitting ? "Submitting..." : uploadingCert ? "Uploading certificate..." : "Submit Bid"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {!isProvider && !isOwner && currentUser && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Only verified service providers can submit bids
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{project.client?.full_name || "Anonymous"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{project.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Bids ({bids.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bids.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No bids yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {bids.map((bid: any) => (
                          <BidCard 
                            key={bid.id} 
                            bid={bid}
                            isProjectOwner={isOwner}
                            onAccept={handleAcceptBidClick}
                            onViewProvider={handleViewProvider}
                            accepting={accepting}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />

        <ProviderProfileModal
          open={providerModalOpen}
          onOpenChange={setProviderModalOpen}
          provider={selectedProvider}
        />

        <AcceptBidModal
          open={acceptBidModalOpen}
          onOpenChange={setAcceptBidModalOpen}
          onConfirm={handleConfirmAcceptBid}
          providerName={bidToAccept?.profiles?.full_name || bidToAccept?.profiles?.email || "Service Provider"}
          bidAmount={bidToAccept?.amount || 0}
        />
      </div>
    </>
  );
}