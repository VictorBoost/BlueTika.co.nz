import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Category = Tables<"categories">;
type CategoryInsert = TablesInsert<"categories">;

export const categoryService = {
  // Get all active categories
  async getAllCategories(): Promise<{ data: Category[] | null; error: any }> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    console.log("getAllCategories:", { data, error });
    return { data, error };
  },

  // Get all categories (including inactive) for admin
  async getAllCategoriesAdmin(): Promise<{ data: Category[] | null; error: any }> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    console.log("getAllCategoriesAdmin:", { data, error });
    return { data, error };
  },

  // Get single category
  async getCategory(id: string): Promise<{ data: Category | null; error: any }> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    console.log("getCategory:", { data, error });
    return { data, error };
  },

  // Create category
  async createCategory(category: CategoryInsert): Promise<{ data: Category | null; error: any }> {
    const { data, error } = await supabase
      .from("categories")
      .insert(category)
      .select()
      .single();

    console.log("createCategory:", { data, error });
    return { data, error };
  },

  // Update category
  async updateCategory(id: string, updates: Partial<Category>): Promise<{ data: Category | null; error: any }> {
    const { data, error } = await supabase
      .from("categories")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    console.log("updateCategory:", { data, error });
    return { data, error };
  },

  // Delete category
  async deleteCategory(id: string): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    console.log("deleteCategory:", { data, error });
    return { data, error };
  },

  // Toggle category active status
  async toggleActive(id: string, isActive: boolean): Promise<{ data: Category | null; error: any }> {
    return this.updateCategory(id, { is_active: isActive });
  },
};