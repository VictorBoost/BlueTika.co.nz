import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Shield, UserX, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { staffService } from "@/services/staffService";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  staff_name: string;
  action: string;
  record_type: string;
  record_id: string | null;
  details: any;
  timestamp: string;
}

export default function StaffManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", role: "verifier" });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setIsAdmin(true);
    await loadData();
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffData, logsData] = await Promise.all([
        staffService.getAllStaff(),
        staffService.getAuditLogs(50),
      ]);

      setStaffList(staffData);
      setAuditLogs(logsData);
    } catch (error) {
      console.error("Error loading staff data:", error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await staffService.createStaff({
        name: newStaff.name,
        email: newStaff.email,
        password: newStaff.password,
        role: newStaff.role as "verifier" | "support" | "finance" | "moderator",
      });

      toast({
        title: "Staff Created",
        description: `${newStaff.name} has been added to the team.`,
      });

      setCreateDialogOpen(false);
      setNewStaff({ name: "", email: "", password: "", role: "verifier" });
      await loadData();
    } catch (error) {
      console.error("Error creating staff:", error);
      toast({
        title: "Error",
        description: "Failed to create staff account",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await staffService.deactivateStaff(id);
      setStaffList((prev: any[]) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: false } : s))
      );
      toast({
        title: "Account Deactivated",
        description: "The staff account has been deactivated successfully.",
      });
    } catch (error) {
      console.error("Error deactivating staff:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate staff account",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (staffId: string, isActive: boolean) => {
    try {
      await staffService.updateStaffStatus(staffId, !isActive);
      toast({
        title: isActive ? "Staff Deactivated" : "Staff Activated",
        description: `Staff account has been ${isActive ? "deactivated" : "reactivated"}.`,
      });
      await loadData();
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      verifier: "bg-blue-500/10 text-blue-600 border-blue-600",
      support: "bg-green-500/10 text-green-600 border-green-600",
      finance: "bg-purple-500/10 text-purple-600 border-purple-600",
      moderator: "bg-orange-500/10 text-orange-600 border-orange-600",
    };
    return (
      <Badge variant="outline" className={roleColors[role] || ""}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO title="Staff Management - BlueTika Admin" />
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-accent" />
                Staff Management
              </h1>
              <p className="text-muted-foreground">
                Create and manage staff accounts with role-based access control
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Staff
            </Button>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>All staff accounts with their roles and access levels</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : staffList.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No staff members yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffList.map((member: any) => (
                          <TableRow key={member.id} className={!member.is_active ? "opacity-50" : ""}>
                            <TableCell>
                              {member.is_active ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-600">
                                  <UserX className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{getRoleBadge(member.role)}</TableCell>
                            <TableCell className="font-mono text-sm">{formatDate(member.created_at)}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleStatus(member.id, member.is_active)}
                              >
                                {member.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Complete history of all staff actions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Staff</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Record Type</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">{formatDate(log.timestamp)}</TableCell>
                            <TableCell className="font-medium">{log.staff_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action.replace(/_/g, " ")}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{log.record_type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {JSON.stringify(log.details)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff Account</DialogTitle>
            <DialogDescription>
              Add a new staff member with role-based access to specific admin functions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verifier">Verifier (verification queue only)</SelectItem>
                  <SelectItem value="support">Support (disputes, reports, user contact)</SelectItem>
                  <SelectItem value="finance">Finance (fund releases, commission reports)</SelectItem>
                  <SelectItem value="moderator">Moderator (reports, bypass attempts, suspensions)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Staff will receive email with login credentials. They can log in at /muna/staff.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStaff}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}