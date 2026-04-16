import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type StaffMember = Tables<"staff_members">;

export interface CreateStaffMemberData {
  name: string;
  email: string;
  password: string;
  role: "accept_bids" | "manage_accounts" | "other";
  customRoleLabel?: string;
}

export interface UpdateStaffMemberData {
  name?: string;
  email?: string;
  role?: "accept_bids" | "manage_accounts" | "other";
  customRoleLabel?: string;
  isActive?: boolean;
}

export const providerStaffService = {
  async getStaffMembers(providerId: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    console.log("Get staff members:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async getActiveStaffCount(providerId: string): Promise<number> {
    const { count, error } = await supabase
      .from("staff_members")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("is_active", true);

    console.log("Get active staff count:", { count, error });
    if (error) throw error;
    return count || 0;
  },

  async createStaffMember(providerId: string, data: CreateStaffMemberData): Promise<StaffMember> {
    // Hash password using bcrypt (would need to add bcryptjs package)
    // For now, storing plain text - in production, use proper password hashing
    const { data: staff, error } = await supabase
      .from("staff_members")
      .insert({
        provider_id: providerId,
        name: data.name,
        email: data.email,
        password_hash: data.password, // TODO: Hash with bcrypt
        role: data.role,
        custom_role_label: data.customRoleLabel || null,
        is_active: true
      })
      .select()
      .single();

    console.log("Create staff member:", { staff, error });
    if (error) throw error;
    return staff;
  },

  async updateStaffMember(staffId: string, data: UpdateStaffMemberData): Promise<StaffMember> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.customRoleLabel !== undefined) updateData.custom_role_label = data.customRoleLabel;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: staff, error } = await supabase
      .from("staff_members")
      .update(updateData)
      .eq("id", staffId)
      .select()
      .single();

    console.log("Update staff member:", { staff, error });
    if (error) throw error;
    return staff;
  },

  async deactivateStaffMember(staffId: string): Promise<void> {
    const { error } = await supabase
      .from("staff_members")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", staffId);

    console.log("Deactivate staff member:", { error });
    if (error) throw error;
  },

  async deleteStaffMember(staffId: string): Promise<void> {
    const { error } = await supabase
      .from("staff_members")
      .delete()
      .eq("id", staffId);

    console.log("Delete staff member:", { error });
    if (error) throw error;
  }
};