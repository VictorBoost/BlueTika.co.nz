import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    console.log("getProfile:", { data, error });
    if (error) console.error("Profile fetch error:", error);
    return { data, error };
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    
    console.log("updateProfile:", { data, error });
    if (error) console.error("Profile update error:", error);
    return { data, error };
  },

  async toggleUserType(userId: string, type: "client" | "provider", enabled: boolean) {
    const updates: Partial<Profile> = type === "client" 
      ? { is_client: enabled } 
      : { is_provider: enabled };
      
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    
    console.log("toggleUserType:", { data, error });
    if (error) console.error("User type toggle error:", error);
    return { data, error };
  },
};