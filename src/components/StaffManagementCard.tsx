import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { providerStaffService } from "@/services/providerStaffService";
import { Users, Plus, Trash2, Power, PowerOff, DollarSign } from "lucide-react";
import type { StaffMember } from "@/services/providerStaffService";

interface StaffManagementCardProps {
  providerId: string;
}

export function StaffManagementCard({ providerId }: StaffManagementCardProps) {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "accept_bids" as "accept_bids" | "manage_accounts" | "other",
    customRoleLabel: ""
  });

  useEffect(() => {
    loadStaff();
  }, [providerId]);

  const loadStaff = async () => {
    try {
      const data = await providerStaffService.getStaffMembers(providerId);
      setStaff(data);
    } catch (error) {
      console.error("Error loading staff:", error);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.role === "other" && !formData.customRoleLabel) {
      toast({
        title: "Error",
        description: "Please provide a custom role label",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await providerStaffService.createStaffMember(providerId, formData);
      toast({
        title: "Success",
        description: "Staff member added successfully"
      });
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "accept_bids",
        customRoleLabel: ""
      });
      loadStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleToggleActive = async (staffId: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await providerStaffService.deactivateStaffMember(staffId);
        toast({
          title: "Success",
          description: "Staff member deactivated"
        });
      } else {
        await providerStaffService.updateStaffMember(staffId, { isActive: true });
        toast({
          title: "Success",
          description: "Staff member reactivated"
        });
      }
      loadStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to permanently delete this staff member?")) {
      return;
    }

    try {
      await providerStaffService.deleteStaffMember(staffId);
      toast({
        title: "Success",
        description: "Staff member deleted"
      });
      loadStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive"
      });
    }
  };

  const getRoleLabel = (member: StaffMember) => {
    if (member.role === "accept_bids") return "Accept bids and manage contracts";
    if (member.role === "manage_accounts") return "Manage accounts";
    return member.custom_role_label || "Other";
  };

  const activeStaffCount = staff.filter(s => s.is_active).length;
  const monthlyCost = activeStaffCount * 2;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Management
            </CardTitle>
            <CardDescription>
              Manage team members who help run your business
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>
                  Each staff member costs $2/month added to your subscription
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accept_bids">Accept bids and manage contracts</SelectItem>
                      <SelectItem value="manage_accounts">Manage accounts</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customRole">Custom Role Label</Label>
                    <Input
                      id="customRole"
                      value={formData.customRoleLabel}
                      onChange={(e) => setFormData({ ...formData, customRoleLabel: e.target.value })}
                      placeholder="e.g., Customer Support"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStaff} disabled={loading}>
                  {loading ? "Adding..." : "Add Staff"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            <strong>{activeStaffCount} active staff member{activeStaffCount !== 1 ? "s" : ""}</strong>
            {activeStaffCount > 0 && ` · $${monthlyCost}/month added to your subscription`}
          </AlertDescription>
        </Alert>

        {staff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No staff members yet. Add your first team member to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    <Badge variant={member.is_active ? "default" : "secondary"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-sm text-muted-foreground">{getRoleLabel(member)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(member.id, member.is_active)}
                    className="gap-2"
                  >
                    {member.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStaff(member.id)}
                    className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}