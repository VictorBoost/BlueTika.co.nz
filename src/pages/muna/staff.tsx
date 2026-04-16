import { useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, LogIn, CheckCircle2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { staffService } from "@/services/staffService";

export default function StaffLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const staff = await staffService.staffLogin(email, password);

      toast({
        title: "Login Successful",
        description: `Welcome back, ${staff.name}!`,
      });

      // Store staff session
      localStorage.setItem("staff_session", JSON.stringify({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      }));

      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        verifier: "/muna/verify-providers",
        support: "/muna/disputes",
        finance: "/muna/fund-releases",
        moderator: "/muna/trust-and-safety",
      };

      router.push(roleRoutes[staff.role] || "/muna");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or account deactivated",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Staff Login - BlueTika" />
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-accent" />
            </div>
            <CardTitle className="text-2xl text-center">Staff Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@bluetika.co.nz"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>

            <Alert className="mt-6">
              <AlertDescription className="text-xs">
                <strong>Role-Based Access:</strong> You'll be redirected to the appropriate admin section based on your assigned role.
              </AlertDescription>
            </Alert>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Staff Roles:</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-600">Verifier</Badge>
                  <span className="text-xs text-muted-foreground">Verification queue only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">Support</Badge>
                  <span className="text-xs text-muted-foreground">Disputes, reports, user contact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-600">Finance</Badge>
                  <span className="text-xs text-muted-foreground">Fund releases, commission reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-600">Moderator</Badge>
                  <span className="text-xs text-muted-foreground">Reports, bypass attempts, suspensions</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}