import { supabase } from "@/integrations/supabase/client";

export const staffService = {
  // Get all staff
  async getAllStaff(): Promise<any[]> {
    const { data, error } = await supabase
      .from("staff" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create staff
  async createStaff(
    name: string,
    email: string,
    passwordHash: string,
    role: string,
    createdBy: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from("staff" as any)
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role,
        is_active: true,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deactivate staff
  async deactivateStaff(id: string): Promise<void> {
    const { error } = await supabase
      .from("staff" as any)
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
  },

  // Update staff active status
  async updateStaffStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from("staff" as any)
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) throw error;
  },

  // Staff login
  async authenticateStaff(email: string, passwordHash: string): Promise<any> {
    const { data, error } = await supabase
      .from("staff" as any)
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      throw new Error("Invalid credentials or account deactivated");
    }

    if (data.password_hash !== passwordHash) {
      throw new Error("Invalid credentials");
    }

    return data;
  },

  // Log audit action
  async logAction(
    staffId: string,
    action: string,
    recordType: string,
    recordId: string,
    details?: any
  ): Promise<void> {
    const { error } = await supabase.from("staff_audit_logs" as any).insert({
      staff_id: staffId,
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
      .from("staff_audit_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Check permissions
  hasPermission(role: string, page: string): boolean {
    const permissions: Record<string, string[]> = {
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