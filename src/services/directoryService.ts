import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DirectoryListing = Tables<"directory_listings">;
export type DirectoryCategory = Tables<"directory_categories">;

export interface DirectorySearchParams {
  keyword?: string;
  categoryId?: string;
  city?: string;
  featured?: boolean;
}

export interface ListingWithCategory extends DirectoryListing {
  directory_categories?: DirectoryCategory | null;
  profiles?: {
    verification_tier?: string | null;
    full_name?: string | null;
  } | null;
}

/**
 * Fetch all directory listings with optional search/filter
 */
export async function getDirectoryListings(
  params?: DirectorySearchParams
): Promise<{ data: ListingWithCategory[] | null; error: any }> {
  let query = supabase
    .from("directory_listings")
    .select(`
      *,
      directory_categories!directory_listings_category_id_fkey(*),
      profiles!directory_listings_provider_id_fkey(id, verification_tier, full_name)
    `)
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (params?.categoryId) {
    query = query.eq("category_id", params.categoryId);
  }

  if (params?.city) {
    query = query.ilike("city", `%${params.city}%`);
  }

  if (params?.keyword) {
    query = query.or(`business_name.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`);
  }

  if (params?.featured) {
    query = query.eq("featured", true);
  }

  const { data, error } = await query;
  console.log("Directory listings query:", { data, error, params });
  return { data: data as any, error };
}

/**
 * Get a single directory listing by slug
 */
export async function getDirectoryListingBySlug(
  slug: string
): Promise<{ data: ListingWithCategory | null; error: any }> {
  const { data, error } = await supabase
    .from("directory_listings")
    .select(`
      *,
      directory_categories!directory_listings_category_id_fkey(*),
      profiles!directory_listings_provider_id_fkey(id, verification_tier, full_name)
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  console.log("Directory listing by slug:", { data, error, slug });
  return { data: data as any, error };
}

/**
 * Create a new directory listing
 */
export async function createDirectoryListing(listing: {
  business_name: string;
  category_id: string;
  city: string;
  description: string;
  phone: string;
  website?: string;
  photos?: string[];
  slug: string;
}): Promise<{ data: DirectoryListing | null; error: any }> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    return { data: null, error: { message: "Authentication required" } };
  }

  const { data, error } = await supabase
    .from("directory_listings")
    .insert({
      ...listing,
      claimed_by: session.session.user.id,
    })
    .select()
    .single();

  console.log("Create directory listing:", { data, error });
  return { data, error };
}

/**
 * Update an existing directory listing
 */
export async function updateDirectoryListing(
  id: string,
  updates: Partial<DirectoryListing>
): Promise<{ data: DirectoryListing | null; error: any }> {
  const { data, error } = await supabase
    .from("directory_listings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  console.log("Update directory listing:", { data, error });
  return { data, error };
}

/**
 * Toggle featured status (admin only)
 */
export async function toggleFeaturedListing(
  id: string,
  featured: boolean
): Promise<{ data: DirectoryListing | null; error: any }> {
  return updateDirectoryListing(id, { featured });
}

/**
 * Deactivate a listing (soft delete)
 */
export async function deactivateListing(
  id: string
): Promise<{ data: DirectoryListing | null; error: any }> {
  return updateDirectoryListing(id, { is_active: false });
}

/**
 * Get all active listings (for admin)
 */
export async function getAllDirectoryListings(): Promise<{
  data: ListingWithCategory[] | null;
  error: any;
}> {
  const { data, error } = await supabase
    .from("directory_listings")
    .select(`
      *,
      directory_categories!directory_listings_category_id_fkey(*),
      profiles!directory_listings_provider_id_fkey(id, verification_tier, full_name)
    `)
    .order("created_at", { ascending: false });

  return { data: data as any, error };
}

/**
 * Delete a listing completely (admin only)
 */
export async function deleteDirectoryListing(
  id: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("directory_listings")
    .delete()
    .eq("id", id);
  return { error };
}

/**
 * Get listings claimed by current user
 */
export async function getMyListings(): Promise<{
  data: ListingWithCategory[] | null;
  error: any;
}> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    return { data: null, error: { message: "Authentication required" } };
  }

  const { data, error } = await supabase
    .from("directory_listings")
    .select(`
      *,
      directory_categories!directory_listings_category_id_fkey(*)
    `)
    .eq("claimed_by", session.session.user.id)
    .order("created_at", { ascending: false });

  console.log("My listings:", { data, error });
  return { data: data as any, error };
}