import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function TestEmailPage() {
  const [clientEmail, setClientEmail] = useState("koril_lotus@hotmail.com");
  const [providerEmail, setProviderEmail] = useState("goodnessgamo@gmail.com");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runFullCycleTest() {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/test-full-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientEmail, providerEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Test failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Email System Test</h1>
          <p className="text-muted-foreground">
            Test complete email flow: Bid → Contract → Payment notifications
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Client Email (receives bid & payment notifications)
                </label>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Provider Email (receives contract & payment notifications)
                </label>
                <Input
                  type="email"
                  value={providerEmail}
                  onChange={(e) => setProviderEmail(e.target.value)}
                  placeholder="provider@example.com"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">What this test does:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>Creates test profiles for client & provider</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>Posts a project with random category</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>Provider submits bid → <strong>EMAIL to client</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>Client accepts bid (creates contract) → <strong>EMAIL to both</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>Bot processes payment automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>Provider uploads work evidence</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <span>Client releases funds → <strong>EMAIL to both</strong></span>
              </li>
            </ul>

            <Button
              onClick={runFullCycleTest}
              disabled={testing || !clientEmail || !providerEmail}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Full Cycle Test...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Run Full Email Test
                </>
              )}
            </Button>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card className="p-6 border-green-500 bg-green-50 dark:bg-green-950">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    ✅ Test Completed Successfully!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {result.message}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Client Email:</span>
                      <p className="font-medium">{result.clientEmail}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Provider Email:</span>
                      <p className="font-medium">{result.providerEmail}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Project ID:</span>
                      <p className="font-mono text-xs">{result.projectId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contract ID:</span>
                      <p className="font-mono text-xs">{result.contractId}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Final Amount:</span>
                      <p className="font-medium text-lg">NZD ${result.finalAmount}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-2 text-sm">📧 Emails Sent:</h4>
                    <ul className="space-y-1 text-sm">
                      {result.emailsSent?.map((email: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>{email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Check your inboxes!</strong> Both email addresses should have received:
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Bid notification (client only)</li>
                        <li>Contract created notification (both)</li>
                        <li>Payment released notification (both)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Check Vercel logs for detailed email sending status and debugging info
        </div>
      </div>
    </div>
  );
}