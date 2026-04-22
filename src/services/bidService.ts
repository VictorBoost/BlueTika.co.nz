import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { sendBidDeclinedEmail } from "./sesEmailService";

export type Bid = Tables<"bids">;
export type BidInsert = Omit<Bid, "id" | "created_at" | "updated_at">;

export const bidService = {
  async createBid(bid: BidInsert) {
    const { data, error } = await supabase
      .from("bids")
      .insert(bid)
      .select(`
        *,
        profiles!bids_provider_id_fkey(
          id,
          full_name,
          email,
          phone,
          bio,
          average_rating,
          total_reviews,
          response_rate,
          commission_tier,
          verification_status
        )
      `)
      .single();

    console.log("createBid:", { data, error });
    if (error) console.error("Bid create error:", error);
    return { data, error };
  },

  async updateBidStatus(bidId: string, status: "pending" | "accepted" | "rejected") {
    const { data, error } = await supabase
      .from("bids")
      .update({ status })
      .eq("id", bidId)
      .select()
      .single();

    console.log("updateBidStatus:", { data, error });
    if (error) console.error("Bid status update error:", error);
    return { data, error };
  },

  async getProjectBids(projectId: string) {
    const { data, error } = await supabase
      .from("bids")
      .select(`
        *,
        profiles!bids_provider_id_fkey(
          id,
          full_name,
          email,
          phone,
          bio,
          average_rating,
          total_reviews,
          response_rate,
          commission_tier,
          verification_status
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    console.log("getProjectBids:", { data, error });
    if (error) console.error("Bids fetch error:", error);
    return { data, error };
  },

  async getProviderBids(providerId: string) {
    const { data, error } = await supabase
      .from("bids")
      .select(`
        *,
        projects!bids_project_id_fkey(
          id,
          title,
          budget,
          location,
          status,
          category:categories!projects_category_id_fkey(name)
        )
      `)
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    console.log("getProviderBids:", { data, error });
    if (error) console.error("Provider bids fetch error:", error);
    return { data, error };
  },

  async acceptBid(bidId: string, projectId: string, clientId: string) {
    // Get the bid details first
    const { data: bidData, error: bidFetchError } = await supabase
      .from("bids")
      .select("*, profiles!bids_provider_id_fkey(email, full_name)")
      .eq("id", bidId)
      .single();

    if (bidFetchError) {
      console.error("Bid fetch error:", bidFetchError);
      return { data: null, error: bidFetchError };
    }

    // Get project title for email
    const { data: projectData } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    // Update the accepted bid
    const { error: acceptError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bidId);

    if (acceptError) {
      console.error("Bid acceptance error:", acceptError);
      return { data: null, error: acceptError };
    }

    // Get all pending bids that will be declined (for email notifications)
    const { data: pendingBids } = await supabase
      .from("bids")
      .select("id, profiles!bids_provider_id_fkey(email, full_name)")
      .eq("project_id", projectId)
      .neq("id", bidId)
      .eq("status", "pending");

    // Auto-decline all other pending bids for this project
    const { error: declineError } = await supabase
      .from("bids")
      .update({ status: "rejected" })
      .eq("project_id", projectId)
      .neq("id", bidId)
      .eq("status", "pending");

    if (declineError) {
      console.error("Auto-decline error:", declineError);
    }

    // Send email notifications to declined service providers
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";
    if (pendingBids && pendingBids.length > 0 && projectData) {
      await Promise.all(
        pendingBids.map(bid => {
          if (bid.profiles?.email) {
            return sendBidDeclinedEmail(
              bid.profiles.email,
              bid.profiles.full_name || "there",
              projectData.title,
              baseUrl
            );
          }
          return Promise.resolve();
        })
      );
    }

    // Create the contract
    const { data: contractData, error: contractError } = await supabase
      .from("contracts")
      .insert({
        project_id: projectId,
        provider_id: bidData.provider_id,
        client_id: clientId,
        bid_id: bidId,
        final_amount: bidData.amount,
        status: "active",
      })
      .select()
      .single();

    if (contractError) {
      console.error("Contract creation error:", contractError);
      return { data: null, error: contractError };
    }

    // Update project status to in_progress
    await supabase
      .from("projects")
      .update({ status: "in_progress" })
      .eq("id", projectId);

    console.log("acceptBid:", { bidData, contractData });
    return { data: contractData, error: null };
  },

  async uploadTradeCertificate(file: File, providerId: string): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${providerId}-${Date.now()}.${fileExt}`;
    const filePath = `trade-certificates/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-media")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Trade certificate upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("project-media")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};