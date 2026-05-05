import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function UserManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
      if (!data.isAdmin) {
        router.push("/muna");
        return;
      }

      setIsAdmin(true);
      await loadUsers();
    } catch (error) {
      console.error("Admin verification error:", error);
      router.push("/muna");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  }

  async function toggleUserBlock(userId: string, currentStatus: string) {
    setActionLoading(userId);
    try {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: newStatus })
        .eq("id", userId);

      if (error) {
        alert("Failed to update user status: " + error.message);
        return;
      }

      alert(`User ${newStatus === "suspended" ? "blocked" : "unblocked"} successfully`);
      await loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(userId: string, userEmail: string) {
    if (!confirm(`Permanently delete user ${userEmail}? This cannot be undone.`)) return;

    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Failed to delete user: " + (data.error || "Unknown error"));
        return;
      }

      alert("User deleted successfully");
      await loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone_number?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/muna" className="text-primary hover:underline">
              ← Back to Control Centre
            </Link>
            <h1 className="text-2xl font-bold">User Management</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Block, unblock, or delete user accounts instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by email, name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <Alert>
                  <AlertDescription>No users found</AlertDescription>
                </Alert>
              ) : (
                filteredUsers.map(user => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{user.full_name || user.email}</p>
                          <Badge variant={user.account_status === "suspended" ? "destructive" : "default"}>
                            {user.account_status || "active"}
                          </Badge>
                          {user.is_client && <Badge variant="outline">Client</Badge>}
                          {user.is_provider && <Badge variant="outline">Provider</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone_number}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={user.account_status === "suspended" ? "default" : "destructive"}
                          size="sm"
                          onClick={() => toggleUserBlock(user.id, user.account_status || "active")}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? "..." : user.account_status === "suspended" ? "Unblock" : "Block"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(user.id, user.email || "")}
                          disabled={actionLoading === user.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Total users: {filteredUsers.length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}