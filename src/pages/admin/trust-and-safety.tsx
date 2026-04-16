import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Ban, Shield, Clock, UserX, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { contentSafetyService } from "@/services/contentSafetyService";

interface BypassAttempt {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  content: string;
  detected_patterns: string[];
  context: string;
  attempt_count: number;
  created_at: string;
}

interface SuspendedAccount {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  suspension_type: string;
  reason: string;
  suspended_at: string;
  suspended_until: string | null;
  is_active: boolean;
}

export default function TrustAndSafety() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bypassAttempts, setBypassAttempts] = useState<BypassAttempt[]>([]);
  const [suspendedAccounts, setSuspendedAccounts] = useState<SuspendedAccount[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // For now, any authenticated user can access admin
    // TODO: Add proper admin role checking
    setIsAdmin(true);
    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [attempts, suspensions] = await Promise.all([
        contentSafetyService.getAllBypassAttempts(),
        contentSafetyService.getAllSuspensions(),
      ]);

      const formattedAttempts: BypassAttempt[] = attempts.map(a => ({
        id: a.id,
        user_id: a.user_id,
        user_name: a.profile?.full_name || "Unknown",
        user_email: a.profile?.email || "Unknown",
        content: a.content_attempted,
        detected_patterns: a.detected_patterns,
        context: a.page_location,
        attempt_count: a.escalation_level,
        created_at: a.created_at,
      }));

      setBypassAttempts(formattedAttempts);
      setSuspendedAccounts(suspensions);
    } catch (error) {
      console.error("Error loading trust & safety data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLiftSuspension = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("account_suspensions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      toast({
        title: "Suspension Lifted",
        description: "The user's account has been reactivated.",
      });

      await loadData();
    } catch (error) {
      console.error("Error lifting suspension:", error);
      toast({
        title: "Error",
        description: "Failed to lift suspension",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSuspensionBadge = (type: string) => {
    switch (type) {
      case "chat_suspension":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />24h Chat Ban</Badge>;
      case "auto_suspended":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-600"><AlertTriangle className="w-3 h-3 mr-1" />Auto-Suspended</Badge>;
      case "permanently_banned":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-600"><Ban className="w-3 h-3 mr-1" />Permanent Ban</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO title="Trust and Safety - BlueTika Admin" />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Shield className="w-10 h-10 text-accent" />
              Trust and Safety
            </h1>
            <p className="text-muted-foreground">
              Monitor bypass attempts, manage suspended accounts, and maintain platform integrity
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Escalation Policy:</strong> 1st = block, 2nd = warning flag, 3rd = 24h chat ban, 4th = auto-suspend, 5th = permanent ban
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="attempts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attempts" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Bypass Attempts ({bypassAttempts.length})
              </TabsTrigger>
              <TabsTrigger value="suspensions" className="flex items-center gap-2">
                <UserX className="w-4 h-4" />
                Suspended Accounts ({suspendedAccounts.filter(s => s.is_active).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attempts">
              <Card>
                <CardHeader>
                  <CardTitle>Bypass Attempt Log</CardTitle>
                  <CardDescription>
                    All attempts to share contact details, sorted by most recent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading...</p>
                  ) : bypassAttempts.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No bypass attempts recorded</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Context</TableHead>
                            <TableHead>Detected Patterns</TableHead>
                            <TableHead>Attempt #</TableHead>
                            <TableHead>Content Sample</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bypassAttempts.map((attempt) => (
                            <TableRow key={attempt.id}>
                              <TableCell className="font-mono text-sm">
                                {formatDate(attempt.created_at)}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{attempt.user_name}</p>
                                  <p className="text-xs text-muted-foreground">{attempt.user_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{attempt.context.replace(/_/g, " ")}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {attempt.detected_patterns.map((pattern, idx) => (
                                    <Badge key={idx} variant="destructive" className="text-xs">
                                      {pattern}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    attempt.attempt_count >= 5 ? "destructive" :
                                    attempt.attempt_count >= 3 ? "default" :
                                    "outline"
                                  }
                                >
                                  #{attempt.attempt_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <p className="text-sm truncate text-muted-foreground">
                                  {attempt.content.substring(0, 60)}...
                                </p>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suspensions">
              <Card>
                <CardHeader>
                  <CardTitle>Suspended Accounts</CardTitle>
                  <CardDescription>
                    Active and historical account suspensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading...</p>
                  ) : suspendedAccounts.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No suspended accounts</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Suspended At</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {suspendedAccounts.map((suspension) => (
                            <TableRow key={suspension.id} className={!suspension.is_active ? "opacity-50" : ""}>
                              <TableCell>
                                {suspension.is_active ? (
                                  <Badge variant="destructive">Active</Badge>
                                ) : (
                                  <Badge variant="outline">Lifted</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{suspension.user_name}</p>
                                  <p className="text-xs text-muted-foreground">{suspension.user_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getSuspensionBadge(suspension.suspension_type)}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <p className="text-sm">{suspension.reason}</p>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatDate(suspension.suspended_at)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {suspension.suspended_until
                                  ? formatDate(suspension.suspended_until)
                                  : suspension.suspension_type === "permanently_banned"
                                  ? <span className="text-red-600 font-semibold">Never</span>
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                {suspension.is_active && suspension.suspension_type !== "permanently_banned" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleLiftSuspension(suspension.user_id)}
                                  >
                                    Lift Suspension
                                  </Button>
                                )}
                                {suspension.suspension_type === "permanently_banned" && (
                                  <span className="text-xs text-muted-foreground">Permanent</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}