import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, MapPin, Calendar } from "lucide-react";
import { contractService } from "@/services/contractService";
import { authService } from "@/services/authService";
import type { Tables } from "@/integrations/supabase/types";

type Contract = Tables<"contracts">;

export default function Contracts() {
  const [contracts, setContracts] = useState<(Contract & {
    projects?: { title: string; location: string };
    profiles?: { full_name: string | null; email: string | null };
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    
    const { data: session } = await authService.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      const { data } = await contractService.getContractsForUser(session.user.id);
      if (data) {
        setContracts(data);
      }
    }
    
    setLoading(false);
  };

  const statusColors = {
    active: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <>
      <SEO 
        title="My Contracts - BlueTika" 
        description="View and manage your active contracts on BlueTika." 
      />
      
      <div className="min-h-screen flex flex-col">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Contracts</h1>
            <p className="text-muted-foreground">Track your active and completed contracts</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No contracts yet</p>
                <Button asChild>
                  <Link href="/projects">Browse Projects</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {contracts.map(contract => {
                const isProvider = contract.provider_id === userId;
                return (
                  <Card key={contract.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">
                            {contract.projects?.title || "Project"}
                          </CardTitle>
                          <CardDescription>
                            {isProvider ? "You are the service provider" : `Provider: ${contract.profiles?.full_name || contract.profiles?.email || "Service Provider"}`}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={statusColors[contract.status]}>
                          {contract.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-foreground">
                            NZD ${contract.final_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{contract.projects?.location || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(contract.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/project/${contract.project_id}`}>
                          View Project
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    </>
  );
}