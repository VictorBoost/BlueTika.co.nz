import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { sesEmailService } from "@/services/sesEmailService";

type Project = Tables<"projects">;

// Generate a URL-friendly slug from a title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const projectService = {
  async createProject(projectData: any): Promise<{ data: Project | null; error: any }> {
    // Generate slug from title if not provided
    if (!projectData.slug && projectData.title) {
      projectData.slug = generateSlug(projectData.title);
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select()
      .single();

    if (data && !error) {
      // Ping sitemap to notify search engines of new project
      try {
        fetch("/api/ping-sitemap", { method: "POST" }).catch(e => console.log("Sitemap ping failed:", e));
      } catch (e) {
        console.log("Sitemap ping failed (non-critical):", e);
      }
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
        contract:contracts!contracts_project_id_fkey(
          id,
          status,
          payment_status,
          reviews(id, rating, comment, is_public, created_at)
        ),
        bids(
          *,
          profiles:profiles!bids_provider_id_fkey(id, full_name, email, phone, bio, average_rating, total_reviews, response_rate, commission_tier, verification_status, created_at)
        )
      `)
      .eq("id", projectId)
      .maybeSingle();

    console.log("getProject:", { projectId, data, error });
    if (error) console.error("Project fetch error:", error);
    return { data, error };
  },

  async getProjectBySlug(slug: string) {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:profiles!projects_client_id_fkey(id, full_name, email, phone, location),
        category:categories(id, name, slug),
        contract:contracts!contracts_project_id_fkey(
          id,
          status,
          payment_status,
          reviews(id, rating, comment, is_public, created_at)
        ),
        bids(
          *,
          profiles:profiles!bids_provider_id_fkey(id, full_name, email, phone, bio, average_rating, total_reviews, response_rate, commission_tier, verification_status, created_at)
        )
      `)
      .eq("slug", slug)
      .maybeSingle();

    console.log("getProjectBySlug:", { slug, data, error });
    if (error) console.error("Project fetch error:", error);
    return { data, error };
  },

  async updateProjectSlug(projectId: string, title: string) {
    const slug = generateSlug(title);
    const { data, error } = await supabase
      .from("projects")
      .update({ slug })
      .eq("id", projectId)
      .select()
      .single();

    console.log("updateProjectSlug:", { projectId, slug, data, error });
    if (error) console.error("Project slug update error:", error);
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