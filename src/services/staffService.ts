import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Staff = Tables<"staff">;
type StaffRole = "verifier" | "support" | "finance" | "moderator";

interface CreateStaffData {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}

interface StaffAuditLog {
  staff_id?: string;
  staff_name: string;
  action: string;
  record_type: string;
  record_id?: string;
  details?: any;
}

export const staffService = {
  // Create staff account
  async createStaff(data: CreateStaffData) {
    // Hash password (in production, use proper bcrypt hashing)
    const passwordHash = btoa(data.password); // Simple base64 for demo

    const { data: staff, error } = await supabase
      .from("staff" as any)
      .insert({
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        role: data.role,
        created_by: (await supabase.auth.getSession()).data.session?.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await this.logAuditAction({
      staff_name: "Owner",
      action: "create_staff",
      record_type: "staff",
      record_id: staff.id,
      details: { name: data.name, email: data.email, role: data.role },
    });

    return staff;
  },

  // Get all staff
  async getAllStaff() {
    const { data, error } = await supabase
      .from("staff" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get staff by ID
  async getStaffById(id: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update staff active status
  async updateStaffStatus(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from("staff" as any)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await this.logAuditAction({
      staff_name: "Owner",
      action: isActive ? "activate_staff" : "deactivate_staff",
      record_type: "staff",
      record_id: id,
      details: { status: isActive },
    });

    return data;
  },

  // Staff login
  async staffLogin(email: string, password: string) {
    const { data: staff, error } = await supabase
      .from("staff" as any)
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (error || !staff) {
      throw new Error("Invalid credentials or account deactivated");
    }

    // Verify password (in production, use proper bcrypt comparison)
    const passwordHash = btoa(password);
    if (staff.password_hash !== passwordHash) {
      throw new Error("Invalid credentials");
    }

    // Log audit
    await this.logAuditAction({
      staff_id: staff.id,
      staff_name: staff.name,
      action: "staff_login",
      record_type: "auth",
      details: { role: staff.role },
    });

    return staff;
  },

  // Log audit action
  async logAuditAction(log: StaffAuditLog) {
    const { error } = await supabase.from("staff_audit_logs" as any).insert({
      staff_id: log.staff_id || null,
      staff_name: log.staff_name,
      action: log.action,
      record_type: log.record_type,
      record_id: log.record_id || null,
      details: log.details || {},
    });

    if (error) console.error("Audit log error:", error);
  },

  // Get audit logs
  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from("staff_audit_logs" as any)
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Check staff permissions
  hasPermission(role: StaffRole, page: string): boolean {
    const permissions: Record<StaffRole, string[]> = {
      verifier: ["/muna/verify-providers", "/muna/verify-domestic-helpers"],
      support: ["/muna/disputes", "/muna/reports"],
      finance: ["/muna/fund-releases", "/muna/commission-settings"],
      moderator: [
        "/muna/trust-and-safety",
        "/muna/moderation-settings",
        "/muna/reports",
      ],
    };

    return permissions[role]?.some((p) => page.startsWith(p)) || false;
  },
};