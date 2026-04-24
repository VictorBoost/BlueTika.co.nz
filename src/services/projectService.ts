import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { sesEmailService } from "./sesEmailService";

export type Project = Tables<"projects">;

export const projectService = {
  async createProject(projectData: Omit<Project, "id" | "created_at">): Promise<{ data: Project | null; error: any }> {
    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    if (data && !error) {
      // Check if this is the user's first project and send email
      await this.checkAndSendFirstProjectEmail(projectData.client_id, data);
    }

    return { data, error };
  },

  async checkAndSendFirstProjectEmail(userId: string, project: Project): Promise<void> {
    try {
      // Count total projects by this user
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("client_id", userId);

      // If this is their first project, send welcome email
      if (count === 1) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (profile?.email && profile?.full_name) {
          await sesEmailService.sendFirstProjectPosted(
            profile.email,
            profile.full_name,
            project.title,
            project.id,
            "https://bluetika.co.nz"
          );
        }
      }
    } catch (error) {
      console.error("Error checking/sending first project email:", error);
    }
  },

  async getAllProjects(status?: string): Promise<{ data: Project[] | null; error: any }> {
    let query = supabase
      .from("projects")
      .select(`
        *,
        bids(id)
      `)
      .order("created_at", { ascending: false });
      
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query;
    console.log("getAllProjects:", { count: data?.length, error });
    if (error) console.error("Projects fetch error:", error);
    return { data, error };
  },

  async getProject(projectId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:profiles!projects_client_id_fkey(id, full_name, email, phone, location),
        category:categories(id, name, slug),
        bids(
          *,
          provider:profiles!bids_provider_id_fkey(id, full_name, email, phone, bio)
        )
      `)
      .eq("id", projectId)
      .single();

    console.log("getProject:", { data, error });
    if (error) console.error("Project fetch error:", error);
    return { data, error };
  },

  async updateProject(projectId: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    console.log("updateProject:", { data, error });
    if (error) console.error("Project update error:", error);
    return { data, error };
  },

  async deleteProject(projectId: string) {
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    console.log("deleteProject:", { data, error });
    if (error) console.error("Project delete error:", error);
    return { data, error };
  },
};