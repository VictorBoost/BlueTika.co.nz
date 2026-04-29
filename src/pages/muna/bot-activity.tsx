import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
import { Activity, Bot, FileText, DollarSign, CheckCircle2, Star, RefreshCw, Filter } from "lucide-react";

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
  // Entity counts
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
  const [trendData, setTrendData] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized && !loading) {
      loadActivities();
    }
  }, [filterType, sortBy, isAuthorized, loading]);

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

      // Get direct bot stats from database
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

      // Action type stats
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
    }
  };

  return (
    <div>
      <SEO title="Bot Activity" description="View recent bot activity logs." />
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => setFilterType(value)}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="post_project">Post Project</SelectItem>
              <SelectItem value="submit_bid">Submit Bid</SelectItem>
              <SelectItem value="accept_bid">Accept Bid</SelectItem>
              <SelectItem value="complete_work">Complete Work</SelectItem>
              <SelectItem value="submit_review">Submit Review</SelectItem>
              <SelectItem value="make_payment">Make Payment</SelectItem>
            </SelectContent>
          </Select>
          <Switch checked={autoRefresh} onCheckedChange={(checked) => setAutoRefresh(checked)} />
          <Label className="ml-2">Auto Refresh</Label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Activity</CardTitle>
            <CardDescription>Total number of bot activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Provider Bots</CardTitle>
            <CardDescription>Total number of provider bots.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.provider_bots}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client Bots</CardTitle>
            <CardDescription>Total number of client bots.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.client_bots}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Projects</CardTitle>
            <CardDescription>Total number of projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.total_projects}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Bids</CardTitle>
            <CardDescription>Total number of bids.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.total_bids}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Contracts</CardTitle>
            <CardDescription>Total number of contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.total_contracts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Paid Contracts</CardTitle>
            <CardDescription>Total number of paid contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.paid_contracts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Reviews</CardTitle>
            <CardDescription>Total number of reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6" />
                <span className="font-bold text-xl">{stats.total_reviews}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableHead>ID</TableHead>
            <TableHead>Bot</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Created At</TableHead>
          </TableHeader>
          <TableBody>
            {activities.map(activity => (
              <TableRow key={activity.id}>
                <TableCell>{activity.id}</TableCell>
                <TableCell>{activity.bot_profile?.full_name || activity.bot_id}</TableCell>
                <TableCell>{activity.action_type}</TableCell>
                <TableCell>{activity.details}</TableCell>
                <TableCell>{new Date(activity.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}