import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ModerationSettingsPanel } from "@/components/ModerationSettingsPanel";
import { ArrowLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ModerationSettingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      console.log("🔐 Verifying admin access...");
      
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      
      console.log("Admin verification response:", { status: response.status, isAdmin: data.isAdmin });
      
      if (response.status === 401) {
        console.log("❌ Unauthorized - redirecting to login");
        router.push("/muna/login");
        return;
      }

      if (response.status === 403 || !data.isAdmin) {
        console.log("❌ Not admin - redirecting to muna");
        router.push("/muna");
        return;
      }

      console.log("✅ Admin access verified");
      setIsAdmin(true);
    } catch (error) {
      console.error("❌ Admin verification error:", error);
      router.push("/muna");
    } finally {
      setLoading(false);
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Moderation Settings - BlueTika Admin"
        description="Configure automatic approval and manual review settings for content moderation"
      />

      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/muna/trust-and-safety">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Safety Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="h-6 w-6" />
                    Moderation Settings
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Configure auto-approval and manual review for different content types
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => router.push("/muna")}
            className="mb-4"
          >
            ← Back to Control Centre
          </Button>

          <ModerationSettingsPanel />
        </div>
      </div>
    </>
  );
}