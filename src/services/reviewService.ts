import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export interface ReviewSubmission {
  contract_id: string;
  client_id: string;
  provider_id: string;
  reviewer_role: "client" | "provider";
  reviewee_role: "client" | "provider";
  rating: number;
  comment: string;
  is_public: boolean;
}

export interface ReviewWithContract extends Tables<"reviews"> {
  contracts: {
    id: string;
    project_title: string;
  };
  reviewer_profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * Submit a review for a contract
 */
export async function submitReview(review: ReviewSubmission) {
  const { data, error } = await supabase
    .from("reviews")
    .insert([review])
    .select()
    .single();

  if (error) {
    console.error("Error submitting review:", error);
    throw error;
  }

  return data;
}

/**
 * Get reviews for a specific user (as reviewee)
 */
export async function getUserReviews(userId: string, role: "client" | "provider") {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      contracts:contracts!reviews_contract_id_fkey(id, project_title),
      reviewer_profile:profiles!reviews_${role === "client" ? "provider" : "client"}_id_fkey(full_name, avatar_url)
    `)
    .eq(role === "client" ? "client_id" : "provider_id", userId)
    .eq("reviewee_role", role)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }

  return data || [];
}

/**
 * Get reviews for a specific contract
 */
export async function getContractReviews(contractId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contract reviews:", error);
    return [];
  }

  return data || [];
}

/**
 * Check if user has submitted their review for a contract
 */
export async function hasUserSubmittedReview(
  contractId: string,
  userId: string,
  role: "client" | "provider"
) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("contract_id", contractId)
    .eq(role === "client" ? "client_id" : "provider_id", userId)
    .eq("reviewer_role", role)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking review submission:", error);
    return false;
  }

  return !!data;
}

/**
 * Get average rating for a user
 */
export async function getUserAverageRating(userId: string, role: "client" | "provider") {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq(role === "client" ? "client_id" : "provider_id", userId)
    .eq("reviewee_role", role)
    .eq("is_public", true);

  if (error) {
    console.error("Error fetching user rating:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
  return {
    average: Math.round(average * 10) / 10,
    count: data.length
  };
}

/**
 * Check if both parties have submitted reviews for a contract
 */
export async function areBothReviewsSubmitted(contractId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("reviewer_role")
    .eq("contract_id", contractId);

  if (error) {
    console.error("Error checking reviews:", error);
    return false;
  }

  const roles = data?.map(r => r.reviewer_role) || [];
  return roles.includes("client") && roles.includes("provider");
}

/**
 * Update reminder sent timestamp
 */
export async function updateReminderSent(reviewId: string) {
  const { error } = await supabase
    .from("reviews")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) {
    console.error("Error updating reminder timestamp:", error);
  }
}