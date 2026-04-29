import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Bot, FileText, DollarSign, CheckCircle2, Star, RefreshCw, Filter, ArrowLeft } from "lucide-react";

interface BotActivityLog {
  id: string;
  bot_id: string;
  action_type: string;
  details: any;
  created_at: string;
  bot_profile?: {
    full_name: string;
    email: string;
  };
}

interface ActivityStats {
  total: number;
  post_project: number;
  submit_bid: number;
  accept_bid: number;
  complete_work: number;
  submit_review: number;
  make_payment: number;
  provider_bots: number;
  client_bots: number;
  total_projects: number;
  total_bids: number;
  total_contracts: number;
  paid_contracts: number;
  total_reviews: number;
}

export default function BotActivityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stats, setStats] = useState<ActivityStats>({
    total: 0,
    post_project: 0,
    submit_bid: 0,
    accept_bid: 0,
    complete_work: 0,
    submit_review: 0,
    make_payment: 0,
    provider_bots: 0,
    client_bots: 0,
    total_projects: 0,
    total_bids: 0,
    total_contracts: 0,
    paid_contracts: 0,
    total_reviews: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized && !loading) {
      loadActivities();
    }
  }, [filterType, isAuthorized, loading]);

  useEffect(() => {
    if (autoRefresh && !loading) {
      const interval = setInterval(loadActivities, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loading]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/muna");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();
      
      if (!profile || profile.email !== "bluetikanz@gmail.com") {
        router.push("/muna");
        return;
      }
      
      setIsAuthorized(true);
      setLoading(false);
    } catch (error) {
      console.error("Bot Activity - Access check failed:", error);
      router.push("/muna");
    }
  }

  const loadActivities = async () => {
    try {
      let query = supabase
        .from("bot_activity_logs")
        .select(`
          id,
          bot_id,
          action_type,
          details,
          created_at,
          bot_profile:profiles!bot_activity_logs_bot_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterType !== "all") {
        query = query.eq("action_type", filterType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data?.map(log => ({
        ...log,
        bot_profile: Array.isArray(log.bot_profile) ? log.bot_profile[0] : log.bot_profile
      })) || [];

      setActivities(formattedData);

      const { data: botProfiles } = await supabase
        .from("profiles")
        .select("id, is_client, is_provider")
        .eq("is_bot", true);

      const { data: botProjects } = await supabase
        .from("projects")
        .select("id, client_id")
        .in("client_id", botProfiles?.map(p => p.id) || []);

      const { data: botBids } = await supabase
        .from("bids")
        .select("id, provider_id")
        .in("provider_id", botProfiles?.map(p => p.id) || []);

      const { data: botContracts } = await supabase
        .from("contracts")
        .select("id, payment_status, client_id, provider_id");

      const { data: botReviews } = await supabase
        .from("reviews")
        .select("id, reviewer_id");

      const { data: allLogs } = await supabase
        .from("bot_activity_logs")
        .select("action_type");

      if (botProfiles) {
        const clientBots = botProfiles.filter(p => p.is_client).length;
        const providerBots = botProfiles.filter(p => p.is_provider).length;
        const totalProjects = botProjects?.length || 0;
        const totalBids = botBids?.length || 0;
        const totalContracts = botContracts?.length || 0;
        const paidContracts = botContracts?.filter(c => c.payment_status === 'held' || c.payment_status === 'released').length || 0;
        const totalReviews = botReviews?.length || 0;

        const newStats = {
          total: allLogs?.length || 0,
          post_project: allLogs?.filter(l => l.action_type === "post_project").length || 0,
          submit_bid: allLogs?.filter(l => l.action_type === "submit_bid").length || 0,
          accept_bid: allLogs?.filter(l => l.action_type === "accept_bid").length || 0,
          complete_work: allLogs?.filter(l => l.action_type === "complete_work").length || 0,
          submit_review: allLogs?.filter(l => l.action_type === "submit_review").length || 0,
          make_payment: allLogs?.filter(l => l.action_type === "make_payment").length || 0,
          provider_bots: providerBots,
          client_bots: clientBots,
          total_projects: totalProjects,
          total_bids: totalBids,
          total_contracts: totalContracts,
          paid_contracts: paidContracts,
          total_reviews: totalReviews,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error("Error loading activities", error);
      toast({
        title: "Error loading activities",
        description: "Failed to load bot activity logs",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <>
        <SEO title="Bot Activity Monitor" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  if (!isAuthorized) {
    return (
      <>
        <SEO title="Access Denied" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
              <Button onClick={() => router.push("/muna")}>Return to Control Centre</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Bot Activity Monitor" />
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.push("/muna")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Control Centre
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Bot Activity Monitor</h1>
            <p className="text-muted-foreground mt-2">Real-time bot activity feeds and automation logs</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select value={filterType} onValueChange={(value) => setFilterType(value)}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="post_project">Post Project</SelectItem>
                  <SelectItem value="submit_bid">Submit Bid</SelectItem>
                  <SelectItem value="accept_bid">Accept Bid</SelectItem>
                  <SelectItem value="complete_work">Complete Work</SelectItem>
                  <SelectItem value="submit_review">Submit Review</SelectItem>
                  <SelectItem value="make_payment">Make Payment</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <Label>Auto Refresh (30s)</Label>
              </div>
            </div>
            
            <Button onClick={loadActivities} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Provider Bots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.provider_bots}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Client Bots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.client_bots}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Projects Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.total_projects}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Bids Submitted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.total_bids}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Contracts Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.total_contracts}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Paid Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  <span className="text-2xl font-bold">{stats.paid_contracts}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Reviews Posted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.total_reviews}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest {activities.length} bot actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot Name</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No bot activity found
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {activity.bot_profile?.full_name || "Unknown Bot"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{activity.action_type.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {typeof activity.details === "string" 
                            ? activity.details 
                            : JSON.stringify(activity.details)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(activity.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}