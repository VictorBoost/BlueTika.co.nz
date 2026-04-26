import { useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TestEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("goodnessgamo@gmail.com");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function testEmail() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Email test failed");
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Email test failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Amazon SES Email Test</h1>
          <p className="text-muted-foreground">Verify email delivery is working</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>Send a test email via Amazon SES to verify configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <Button
              onClick={testEmail}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Test Email"}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm font-semibold text-destructive">❌ Error</p>
                <p className="text-sm text-destructive mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">Check browser console and server logs for details</p>
              </div>
            )}

            {result && result.success && (
              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <p className="text-sm font-semibold text-success">✅ Success!</p>
                <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                <p className="text-xs text-muted-foreground mt-2">Sent to: {result.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Expected Setup:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>NEXT_PUBLIC_SES_ENDPOINT must be set in .env.local</li>
                <li>API Gateway URL must be accessible</li>
                <li>support@bluetika.co.nz must be verified in AWS SES</li>
                <li>Recipient email must be verified (if in sandbox mode)</li>
              </ol>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-mono">FROM: support@bluetika.co.nz</p>
                <p className="text-xs font-mono">TO: {email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.push("/muna")}>
          Back to Control Centre
        </Button>
      </div>
    </div>
  );
}