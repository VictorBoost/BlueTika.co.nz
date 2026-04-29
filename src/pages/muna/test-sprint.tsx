import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Play, ArrowLeft } from "lucide-react";

type TestResult = {
  step: string;
  status: "✅ PASS" | "❌ FAIL" | "⏳ RUNNING";
  details?: string;
  error?: string;
};

type TestResponse = {
  summary: {
    total: number;
    passed: number;
    failed: number;
    success: boolean;
  };
  results: TestResult[];
  testData?: {
    botClient: { id: string; name: string };
    botProvider: { id: string; name: string };
    project: { id: string; title: string };
    contract: { id: string; status: string; payment_status: string };
  };
  error?: string;
};

export default function TestSprintPage() {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResponse | null>(null);

  async function runTest() {
    setTesting(true);
    setTestResults(null);

    try {
      const response = await fetch("/api/test-sprint-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setTestResults(data);
    } catch (error: any) {
      setTestResults({
        summary: { total: 0, passed: 0, failed: 1, success: false },
        results: [
          {
            step: "API Call Failed",
            status: "❌ FAIL",
            error: error.message,
          },
        ],
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.push("/muna")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">🧪 Sprint Features Test</CardTitle>
            <CardDescription>
              Automated test of the 8-hour sprint implementation:
              <br />
              Contact hiding • Chat messaging • Email notifications • Additional payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertDescription>
                <strong>What this test does:</strong>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Creates bot client and provider accounts</li>
                  <li>Posts a project and submits a bid</li>
                  <li>Accepts bid and creates contract</li>
                  <li>Verifies contact info hidden before payment</li>
                  <li>Simulates payment completion</li>
                  <li>Tests chat messaging between client and provider</li>
                  <li>Tests additional payment request flow</li>
                  <li>Verifies all data stored correctly</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={runTest}
              disabled={testing}
              size="lg"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Run Complete Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {testResults && (
          <Card className={testResults.summary.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Test Results</span>
                <Badge
                  variant={testResults.summary.success ? "default" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {testResults.summary.passed}/{testResults.summary.total} Passed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === "✅ PASS"
                      ? "bg-green-50 border-green-200"
                      : result.status === "❌ FAIL"
                      ? "bg-red-50 border-red-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === "✅ PASS" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : result.status === "❌ FAIL" ? (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{result.step}</p>
                      {result.details && (
                        <p className="text-sm text-muted-foreground mt-1">{result.details}</p>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">❌ {result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {testResults.testData && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-3">Test Data Created:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Client Bot:</p>
                      <p className="font-medium">{testResults.testData.botClient.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Provider Bot:</p>
                      <p className="font-medium">{testResults.testData.botProvider.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Project:</p>
                      <p className="font-medium">{testResults.testData.project.title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contract Status:</p>
                      <p className="font-medium">
                        {testResults.testData.contract.status} / {testResults.testData.contract.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}