import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { routineContractService } from "@/services/routineContractService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminRoutineContractsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  async function checkAdminAndLoadData() {
    try {
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403 || !data.isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        router.push("/muna");
        return;
      }

      setIsAdmin(true);
      await loadRoutineContracts();
    } catch (error) {
      console.error("Admin verification error:", error);
      router.push("/muna");
    }
  }

  async function loadRoutineContracts() {
    setLoading(true);

    const { data, error } = await routineContractService.getAllActiveRoutines();

    if (error) {
      console.error("Error loading routine contracts:", error);
      // Suppress disruptive error toast, fallback to data if partially loaded
      setRoutines(data || []);
      const revenue = routineContractService.calculateRecurringRevenue(data || []);
      setTotalRevenue(revenue);
      setLoading(false);
      return;
    }

    setRoutines(data || []);
    const revenue = routineContractService.calculateRecurringRevenue(data || []);
    setTotalRevenue(revenue);
    setLoading(false);
  }

  const getFrequencyLabel = (routine: any) => {
    switch (routine.frequency) {
      case "weekly":
        return "Weekly";
      case "fortnightly":
        return "Fortnightly";
      case "monthly":
        return "Monthly";
      case "custom":
        return `Every ${routine.custom_days} days`;
      default:
        return routine.frequency;
    }
  };

  const getStatusBadge = (routine: any) => {
    if (!routine.client_agreed || !routine.provider_agreed) {
      return <Badge variant="outline">Pending Agreement</Badge>;
    }
    if (routine.status === "active" || routine.is_active) {
      return <Badge className="bg-green-600">Active</Badge>;
    }
    if (routine.status === "paused" || routine.paused_at) {
      return <Badge variant="secondary">Paused</Badge>;
    }
    if (routine.status === "cancelled" || routine.cancelled_at) {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO title="Routine Contracts - BlueTika Admin" />
      <div className="min-h-screen bg-background">
        <div className="container py-12 px-4">
          <Button
            variant="outline"
            onClick={() => router.push("/muna")}
            className="mb-4"
          >
            ← Back to Control Centre
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Routine Contract Management</h1>
            <p className="text-muted-foreground">Monitor all active routine arrangements and recurring revenue</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Routines</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routines.length}</div>
                <p className="text-xs text-muted-foreground">Ongoing arrangements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalRevenue.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Estimated monthly</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Agreements</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {routines.filter(r => !r.client_agreed || !r.provider_agreed).length}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
          </div>

          {/* Routine Contracts List */}
          <Card>
            <CardHeader>
              <CardTitle>All Routine Contracts</CardTitle>
              <CardDescription>Active and pending routine arrangements</CardDescription>
            </CardHeader>
            <CardContent>
              {routines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No routine contracts found
                </div>
              ) : (
                <div className="space-y-4">
                  {routines.map((routine) => (
                    <div key={routine.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{routine.project?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {routine.client?.full_name} → {routine.provider?.full_name}
                          </p>
                        </div>
                        {getStatusBadge(routine)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p className="font-medium">{getFrequencyLabel(routine)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">
                            {new Date(routine.start_date).toLocaleDateString("en-NZ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contract Value</p>
                          <p className="font-medium">
                            ${routine.contract?.agreed_price?.toLocaleString("en-NZ", { minimumFractionDigits: 2 }) || "0.00"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Agreement Status</p>
                          <p className="font-medium">
                            {routine.client_agreed ? "✓" : "○"} Client / {routine.provider_agreed ? "✓" : "○"} Provider
                          </p>
                        </div>
                      </div>

                      {routine.selected_days && routine.selected_days.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Days:</span>
                          <div className="flex gap-1">
                            {routine.selected_days.map((day: string) => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-muted-foreground">
                        Created: {new Date(routine.created_at).toLocaleDateString("en-NZ")}
                        {routine.paused_at && ` • Paused: ${new Date(routine.paused_at).toLocaleDateString("en-NZ")}`}
                        {routine.cancelled_at && ` • Cancelled: ${new Date(routine.cancelled_at).toLocaleDateString("en-NZ")}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}