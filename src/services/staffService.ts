import { supabase } from "@/integrations/supabase/client";

export const staffService = {
  // Get all staff members
  async getAllStaff(): Promise<any[]> {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Invite staff member (creates Supabase auth user + staff record)
  async inviteStaff(
    name: string,
    email: string,
    role: "verifier" | "support" | "finance" | "moderator"
  ): Promise<any> {
    // Validate email format (any domain now allowed)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate role
    const validRoles = ["support", "finance", "moderator", "verifier"];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role");
    }

    // Get current admin user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error("Not authenticated");

    // Check if staff already exists
    const { data: existing } = await supabase
      .from("staff")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      throw new Error("Staff member with this email already exists");
    }

    // Create Supabase auth user (sends invitation email)
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          role,
          is_staff: true,
        },
      }
    );

    if (authError) {
      // If user already exists, check if they're already staff
      if (authError.message?.includes("already registered")) {
        throw new Error("This email is already registered. They may already be a staff member.");
      }
      throw authError;
    }

    // Create staff record
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .insert({
        user_id: authData.user.id,
        name,
        email,
        role,
        is_active: true,
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (staffError) throw staffError;

    // Log the action
    await this.logAction(
      currentUser.id,
      currentUser.email || "admin",
      "invite_staff",
      "staff",
      staffData.id,
      { name, email, role }
    );

    return staffData;
  },

  // Update staff active status
  async updateStaffStatus(staffId: string, isActive: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("staff")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", staffId);

    if (error) throw error;

    // Log the action
    await this.logAction(
      user.id,
      user.email || "admin",
      isActive ? "activate_staff" : "deactivate_staff",
      "staff",
      staffId,
      { is_active: isActive }
    );
  },

  // Update staff role
  async updateStaffRole(staffId: string, role: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("staff")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", staffId);

    if (error) throw error;

    // Log the action
    await this.logAction(
      user.id,
      user.email || "admin",
      "update_staff_role",
      "staff",
      staffId,
      { role }
    );
  },

  // Get current staff member info (if logged in user is staff)
  async getCurrentStaffInfo(): Promise<any | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (error) return null;
    return data;
  },

  // Log audit action
  async logAction(
    staffUserId: string,
    staffEmail: string,
    action: string,
    recordType: string,
    recordId: string | null,
    details?: any
  ): Promise<void> {
    // Get staff record to get staff_id
    const { data: staffData } = await supabase
      .from("staff")
      .select("id, name")
      .eq("user_id", staffUserId)
      .single();

    if (!staffData) {
      console.warn("Staff record not found for audit log");
      return;
    }

    const { error } = await supabase.from("staff_audit_logs").insert({
      staff_id: staffData.id,
      staff_name: staffData.name,
      action,
      record_type: recordType,
      record_id: recordId,
      details,
    });

    if (error) console.error("Audit log error:", error);
  },

  // Get audit logs
  async getAuditLogs(limit = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from("staff_audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Check if user has permission for a specific action/page
  hasPermission(role: string, page: string): boolean {
    const permissions: Record<string, string[]> = {
      verifier: ["/muna/verify-providers", "/muna/verify-domestic-helpers"],
      support: ["/muna/disputes", "/muna/trust-and-safety"],
      finance: ["/muna/fund-releases", "/muna/commission-settings"],
      moderator: [
        "/muna/trust-and-safety",
        "/muna/moderation-settings",
      ],
    };

    return permissions[role]?.some((p) => page.startsWith(p)) || false;
  },

  // Get role display name
  getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      verifier: "Verifier",
      support: "Support Specialist",
      finance: "Finance Manager",
      moderator: "Content Moderator",
    };
    return roleNames[role] || role;
  },

  // Get role description
  getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      verifier: "Reviews and approves provider verification requests",
      support: "Handles disputes, reports, and user support",
      finance: "Manages fund releases and commission reports",
      moderator: "Reviews reports, bypass attempts, and content safety",
    };
    return descriptions[role] || "";
  },
};