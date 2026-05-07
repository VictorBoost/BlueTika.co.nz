import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { monalisaService } from "@/services/monalisaService";
import { Bell, AlertTriangle, Info, CheckCircle, ExternalLink } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MonalisaLog = Database["public"]["Tables"]["monalisa_logs"]["Row"];

export default function MonalisaLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<MonalisaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  useEffect(() => {
    checkOwnerAccess();
    loadLogs();
  }, []);

  const checkOwnerAccess = async () => {
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

      if (response.status === 403 || !data.isAdmin || !data.isOwner) {
        router.push("/muna");
        return;
      }
    } catch (error) {
      console.error("Owner verification error:", error);
      router.push("/muna");
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    const { logs: data } = await monalisaService.getLogs(100, 0);
    setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType !== "all" && log.action_type !== filterType) return false;
    if (filterSeverity !== "all" && log.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary"> = {
      critical: "destructive",
      warning: "default",
      info: "secondary",
    };
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>;
  };

  const getActionTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="text-xs">
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading MonaLisa logs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="MonaLisa Logs - BlueTika Admin"
        description="MonaLisa AI agent activity logs and system monitoring"
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => router.push("/muna/monalisa")}
            className="mb-4"
          >
            ← Back to MonaLisa
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mt-4">MonaLisa Activity Logs</h1>
            <p className="text-muted-foreground mt-2">
              AI agent monitoring and system health reports
            </p>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="all">All Types</option>
                  <option value="post_review">Post Review</option>
                  <option value="contract_review">Contract Review</option>
                  <option value="user_flag">User Flag</option>
                  <option value="system_health">System Health</option>
                  <option value="suggestion">Suggestion</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="ml-auto flex items-end">
                <Button onClick={loadLogs} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          {/* Logs List */}
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No logs found</p>
              </Card>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getSeverityIcon(log.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityBadge(log.severity)}
                        {getActionTypeBadge(log.action_type)}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{log.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        {log.description}
                      </p>

                      {/* Quick Links */}
                      <div className="flex gap-2">
                        {log.related_project_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/project/${log.related_project_id}`)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Project
                          </Button>
                        )}
                        {log.related_contract_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push("/contracts")}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Contract
                          </Button>
                        )}
                        {log.related_user_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push("/muna/verify-providers")}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View User
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}