import { useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";

export default function MunaRecovery() {
  const router = useRouter();
  const [recoveryKey, setRecoveryKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const masterKey = process.env.NEXT_PUBLIC_MASTER_RECOVERY_KEY;

    if (!masterKey) {
      setError("Recovery system not configured");
      return;
    }

    if (recoveryKey === masterKey) {
      // Clear password verification
      sessionStorage.removeItem("muna_password_verified");
      // Clear any lockouts
      localStorage.removeItem("muna_lockout");
      setSuccess(true);
      setTimeout(() => {
        router.push("/muna");
      }, 2000);
    } else {
      setError("Invalid recovery key");
      setRecoveryKey("");
    }
  };

  return (
    <>
      <SEO title="Recovery - BlueTika Control Centre" />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Control Centre Recovery</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Emergency recovery access
            </p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center p-4 rounded-md bg-success/10 border border-success/20">
                <p className="text-success">Recovery successful. Redirecting...</p>
              </div>
            ) : (
              <form onSubmit={handleRecovery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recovery-key">Master Recovery Key</Label>
                  <Input
                    id="recovery-key"
                    type="password"
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="Enter master recovery key"
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
                <Button type="submit" variant="destructive" className="w-full">
                  Recover Access
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/muna")}
                >
                  Back to Control Centre
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}