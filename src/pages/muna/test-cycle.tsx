import { useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function TestCyclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientEmail, setClientEmail] = useState("goodnessgamo@gmail.com");
  const [providerEmail, setProviderEmail] = useState("koril_lotus@hotmail.com");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useState(() => {
    checkAdminAccess();
  });

  async function checkAdminAccess() {
    try {
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/muna/login");
        return;
      }

      const data = await response.json();
      if (response.status === 403 || !data.isAdmin) {
        router.push("/muna");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      router.push("/muna");
    }
  }

  async function runFullCycle() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/test-full-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEmail, providerEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Test failed");
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Test failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Full Cycle Test</h1>
          <p className="text-muted-foreground">Test complete bot automation from signup to payment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Enter emails to test the full cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Client Email</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Provider Email</Label>
              <Input
                type="email"
                value={providerEmail}
                onChange={(e) => setProviderEmail(e.target.value)}
                placeholder="provider@example.com"
              />
            </div>

            <Button
              onClick={runFullCycle}
              disabled={loading || !clientEmail || !providerEmail}
              className="w-full"
            >
              {loading ? "Running Test..." : "Run Full Cycle Test"}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                  <h3 className="font-semibold mb-2">✅ Test Successful!</h3>
                  <p className="text-sm">{result.message}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.data.client.email}</p>
                      <p className="text-xs text-muted-foreground">ID: {result.data.client.id}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Provider</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{result.data.provider.email}</p>
                      <p className="text-xs text-muted-foreground">ID: {result.data.provider.id}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium">{result.data.project.title}</p>
                      <p className="text-xs text-muted-foreground">ID: {result.data.project.id}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Contract</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Status: {result.data.contract.status}</p>
                      <p className="text-xs text-muted-foreground">ID: {result.data.contract.id}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{result.data.payment.success ? "✅ Paid" : "❌ Failed"}</p>
                      {result.data.payment.amount && (
                        <p className="text-xs text-muted-foreground">Amount: ${result.data.payment.amount}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Client gave: {result.data.reviews.client} ⭐</p>
                      <p className="text-sm">Provider gave: {result.data.reviews.provider} ⭐</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Steps</CardTitle>
            <CardDescription>What this test does:</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Creates or finds client and provider profiles with the emails you entered</li>
              <li>Client posts a project ("Plumbing Repair")</li>
              <li>Provider submits a bid ($220)</li>
              <li>Client accepts bid (creates contract)</li>
              <li>Bot payment triggered via Stripe (held in escrow)</li>
              <li>Provider uploads work evidence photos</li>
              <li>Provider reviews client (5 stars)</li>
              <li>Client releases funds and reviews provider (5 stars)</li>
              <li>Both emails receive confirmation via Amazon SES</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}