import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { FileText, MessageSquare, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

interface Contract {
  id: string;
  status: string;
  payment_status: string;
  final_amount: number;
  platform_fee: number;
  payment_processing_fee: number;
  total_amount: number;
  created_at: string;
  work_done_at: string | null;
  funds_released_at: string | null;
  project: { title: string };
  client: { full_name: string; email: string };
  provider: { full_name: string; email: string };
  contract_messages: Array<{
    id: string;
    message: string;
    sender_id: string;
    created_at: string;
    sender: { full_name: string };
  }>;
}

export default function ContractsMonitor() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profile?.email?.toLowerCase() !== "bluetikanz@gmail.com") {
      router.push("/muna");
      return;
    }

    setIsAuthorized(true);
    loadContracts();
  }

  async function loadContracts() {
    setLoading(true);
    
    let query = supabase
      .from("contracts")
      .select(`
        *,
        project:projects(title),
        client:profiles!contracts_client_id_fkey(full_name, email),
        provider:profiles!contracts_provider_id_fkey(full_name, email),
        contract_messages(
          id,
          message,
          sender_id,
          created_at,
          sender:profiles(full_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load contracts:", error);
    } else {
      setContracts(data as any);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (isAuthorized) {
      loadContracts();
    }
  }, [filterStatus]);

  function getStatusColor(status: string) {
    switch (status) {
      case "active": return "bg-blue-500/20 text-blue-400";
      case "awaiting_fund_release": return "bg-yellow-500/20 text-yellow-400";
      case "completed": return "bg-green-500/20 text-green-400";
      case "disputed": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  }

  function getPaymentStatusColor(status: string) {
    switch (status) {
      case "pending": return "bg-orange-500/20 text-orange-400";
      case "held": return "bg-blue-500/20 text-blue-400";
      case "released": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  }

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">📋 Contract Monitoring Dashboard</h1>
          <Button onClick={() => loadContracts()} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Contracts</div>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-bold text-blue-400">
              {contracts.filter(c => c.status === "active").length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Awaiting Release</div>
            <div className="text-2xl font-bold text-yellow-400">
              {contracts.filter(c => c.status === "awaiting_fund_release").length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-400">
              {contracts.filter(c => c.status === "completed").length}
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({contracts.length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="awaiting_fund_release">Awaiting Release</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="disputed">Disputed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Contracts List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {contracts.map((contract) => (
            <Card 
              key={contract.id} 
              className="p-4 hover:border-primary cursor-pointer transition-colors"
              onClick={() => setSelectedContract(contract)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{contract.project?.title || "Untitled Project"}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      Contract #{contract.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={getStatusColor(contract.status)}>
                      {contract.status}
                    </Badge>
                    <Badge className={getPaymentStatusColor(contract.payment_status)}>
                      {contract.payment_status}
                    </Badge>
                  </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Client</div>
                    <div className="font-medium">{contract.client?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{contract.client?.email}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Provider</div>
                    <div className="font-medium">{contract.provider?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{contract.provider?.email}</div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="font-semibold">${contract.final_amount?.toFixed(2) || "0.00"}</span>
                  </div>
                  {contract.payment_status === "held" && (
                    <span className="text-xs text-yellow-400">Escrow</span>
                  )}
                  {contract.payment_status === "released" && (
                    <span className="text-xs text-green-400">Released</span>
                  )}
                </div>

                {/* Messages Indicator */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{contract.contract_messages?.length || 0} messages</span>
                  </div>
                  <div className="text-xs">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Warning Indicators */}
                {contract.status === "awaiting_fund_release" && !contract.funds_released_at && (
                  <Alert className="py-2">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Client hasn't released funds - will auto-release after 48h
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          ))}
        </div>

        {contracts.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Contracts Found</h3>
            <p className="text-muted-foreground">
              {filterStatus === "all" 
                ? "No contracts exist yet."
                : `No contracts with status "${filterStatus}".`}
            </p>
          </Card>
        )}

        {/* Contract Detail Modal */}
        {selectedContract && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedContract(null)}
          >
            <Card 
              className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {selectedContract.project?.title || "Untitled Project"}
                    </h2>
                    <div className="text-sm text-muted-foreground">
                      Contract #{selectedContract.id}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContract(null)}>
                    Close
                  </Button>
                </div>

                {/* Status & Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Contract Status</div>
                    <Badge className={getStatusColor(selectedContract.status)}>
                      {selectedContract.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Payment Status</div>
                    <Badge className={getPaymentStatusColor(selectedContract.payment_status)}>
                      {selectedContract.payment_status}
                    </Badge>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <Card className="p-4 bg-muted">
                  <h3 className="font-semibold mb-3">💰 Payment Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Amount:</span>
                      <span className="font-medium">${selectedContract.final_amount?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee (8%):</span>
                      <span className="font-medium">${selectedContract.platform_fee?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee (2.9% + $0.30):</span>
                      <span className="font-medium">${selectedContract.payment_processing_fee?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Paid:</span>
                      <span className="text-green-400">${selectedContract.total_amount?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </Card>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Client</h4>
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{selectedContract.client?.full_name}</div>
                      <div className="text-muted-foreground">{selectedContract.client?.email}</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Provider</h4>
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{selectedContract.provider?.full_name}</div>
                      <div className="text-muted-foreground">{selectedContract.provider?.email}</div>
                    </div>
                  </Card>
                </div>

                {/* Messages */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chat Messages ({selectedContract.contract_messages?.length || 0})
                  </h3>
                  <Card className="p-4 bg-muted max-h-64 overflow-y-auto">
                    {selectedContract.contract_messages && selectedContract.contract_messages.length > 0 ? (
                      <div className="space-y-3">
                        {selectedContract.contract_messages
                          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                          .map((msg) => (
                            <div key={msg.id} className="p-3 bg-background rounded">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-sm">
                                  {msg.sender?.full_name || "Unknown"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        No messages yet
                      </div>
                    )}
                  </Card>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold mb-3">📅 Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Contract Created: {new Date(selectedContract.created_at).toLocaleString()}</span>
                    </div>
                    {selectedContract.work_done_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Work Completed: {new Date(selectedContract.work_done_at).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedContract.funds_released_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Funds Released: {new Date(selectedContract.funds_released_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bypass Warning */}
                {selectedContract.contract_messages && selectedContract.contract_messages.length > 0 && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Anti-Bypass Monitor:</strong> All messages are logged. Any attempts to arrange off-platform payments will be flagged.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}