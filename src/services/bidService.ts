import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Bid = Tables<"bids">;
export type BidInsert = Omit<Bid, "id" | "created_at" | "updated_at">;

export const bidService = {
  async createBid(bid: BidInsert) {
    const { data, error } = await supabase
      .from("bids")
      .insert(bid)
      .select(`
        *,
        provider:profiles!bids_provider_id_fkey(id, full_name, email, phone, bio)
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
        provider:profiles!bids_provider_id_fkey(id, full_name, email, phone, bio)
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
    // First, update the bid status
    const { data: bidData, error: bidError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bidId)
      .select()
      .single();

    if (bidError) {
      console.error("Bid acceptance error:", bidError);
      return { data: null, error: bidError };
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