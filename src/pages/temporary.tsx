import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function TemporarySystemCheck() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runSystemCheck = async () => {
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch("/api/system-check");
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setResults({
        error: error.message || "Failed to fetch system check",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Check</h1>
        <p className="text-muted-foreground">Verify Supabase and Stripe connections</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Diagnostics</CardTitle>
          <CardDescription>
            Tests real connections to Supabase (bot_accounts) and Stripe (account balance)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runSystemCheck} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running System Check...
              </>
            ) : (
              "Run System Check"
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          {/* Supabase Results */}
          <Card className={results.supabase?.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.supabase?.success ? "✅" : "❌"} Supabase Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.supabase?.success ? (
                <div>
                  <p className="text-green-400 font-semibold mb-3">SUCCESS</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(results.supabase.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <p className="text-red-400 font-semibold mb-3">FAILED</p>
                  <pre className="bg-red-950/20 border border-red-500/20 p-4 rounded-lg text-red-300 text-sm">
                    {results.supabase?.error || "Unknown error"}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stripe Results */}
          <Card className={results.stripe?.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.stripe?.success ? "✅" : "❌"} Stripe Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.stripe?.success ? (
                <div>
                  <p className="text-green-400 font-semibold mb-3">SUCCESS</p>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(results.stripe.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <p className="text-red-400 font-semibold mb-3">FAILED</p>
                  <pre className="bg-red-950/20 border border-red-500/20 p-4 rounded-lg text-red-300 text-sm">
                    {results.stripe?.error || "Unknown error"}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Global Error */}
          {results.error && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle>❌ System Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-red-950/20 border border-red-500/20 p-4 rounded-lg text-red-300 text-sm">
                  {results.error}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}