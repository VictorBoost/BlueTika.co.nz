import { supabase } from "@/integrations/supabase/client";
import { sendBidNotification, sendContractNotification } from "@/lib/email-sender";
import { emailLogService } from "@/services/emailLogService";
import { notificationService } from "@/services/notificationService";

export const bidService = {
  async createBid(bidData: any) {
    // Delete any existing pending bids from this provider on this project
    const { error: deleteError } = await supabase
      .from("bids")
      .delete()
      .eq("project_id", bidData.project_id)
      .eq("provider_id", bidData.provider_id)
      .eq("status", "pending");
    
    if (deleteError) {
      console.error("Error deleting old bids:", deleteError);
    }

    const { data, error } = await supabase
      .from("bids")
      .insert(bidData)
      .select(`*, project:projects(title, client_id, id, client:profiles!projects_client_id_fkey(email, full_name)), provider:profiles!bids_provider_id_fkey(full_name, email)`)
      .single();

    if (error || !data) return { data: null, error };

    if (data.project && (data.project as any).client) {
      try {
        await sendBidNotification(
          (data.project as any).client.email,
          (data.project as any).title,
          (data.provider as any)?.full_name || "A provider",
          bidData.amount
        );
        await emailLogService.logEmail(
          (data.project as any).client.email, 
          "bid_notification", 
          "sent", 
          { bid_id: data.id, project_id: bidData.project_id }
        );
      } catch (emailError: any) {
        console.error("Failed to send bid notification:", emailError);
        await emailLogService.logEmail(
          (data.project as any).client.email, 
          "bid_notification", 
          "failed", 
          { bid_id: data.id, project_id: bidData.project_id, error: emailError.message }
        );
      }
    }

    if ((data.project as any)?.client_id) {
      await notificationService.createNotification(
        (data.project as any).client_id,
        "New Bid Received",
        `${(data.provider as any)?.full_name || "A provider"} submitted a bid of NZD $${bidData.amount}`,
        "info",
        `/project/${bidData.project_id}`
      );
    }

    return { data, error: null };
  },

  async acceptBid(bidId: string, projectId: string, clientId: string) {
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select(`*, project:projects(title, client_id, id, client:profiles!projects_client_id_fkey(email, full_name)), provider:profiles!bids_provider_id_fkey(email, full_name)`)
      .eq("id", bidId)
      .single();

    if (bidError || !bid) return { data: null, error: bidError };
    if ((bid.project as any)?.client_id !== clientId) return { data: null, error: new Error("Unauthorized") };

    const { data: acceptedBid, error: updateError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bidId)
      .select()
      .single();

    if (updateError) return { data: null, error: updateError };

    const { data: otherBids } = await supabase
      .from("bids")
      .select(`id, provider:profiles!bids_provider_id_fkey(email, full_name)`)
      .eq("project_id", projectId)
      .neq("id", bidId)
      .eq("status", "pending");

    if (otherBids && otherBids.length > 0) {
      await supabase.from("bids").update({ status: "declined" }).eq("project_id", projectId).neq("id", bidId);
    }

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        project_id: projectId,
        client_id: clientId,
        provider_id: bid.provider_id,
        bid_id: bidId,
        agreed_price: bid.amount,
        final_amount: bid.amount,
        status: "active",
        payment_status: "pending",
      } as any)
      .select()
      .single();

    if (contractError) return { data: null, error: contractError };

    if (bid.provider && (bid.project as any)?.client) {
      try {
        await sendContractNotification(
          (bid.project as any).client.email,
          (bid.provider as any).email,
          (bid.project as any)?.title || "Project"
        );
        await emailLogService.logEmail(
          (bid.project as any).client.email, 
          "contract_created_client", 
          "sent", 
          { bid_id: bidId, contract_id: contract.id }
        );
        await emailLogService.logEmail(
          (bid.provider as any).email, 
          "contract_created_provider", 
          "sent", 
          { bid_id: bidId, contract_id: contract.id }
        );
      } catch (emailError: any) {
        console.error("Failed to send contract notification:", emailError);
        await emailLogService.logEmail(
          (bid.project as any).client.email, 
          "contract_created_client", 
          "failed", 
          { bid_id: bidId, contract_id: contract.id, error: emailError.message }
        );
      }
    }

    return { data: contract, error: null };
  },

  async getBidsByProject(projectId: string) {
    const { data, error } = await supabase.from("bids").select(`*, profiles:profiles!bids_provider_id_fkey(*)`).eq("project_id", projectId).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async getBidsByProvider(providerId: string) {
    const { data, error } = await supabase.from("bids").select(`*, project:projects(*)`).eq("provider_id", providerId).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async getBidsByProviderWithSlug(providerId: string) {
    const { data, error } = await supabase.from("bids").select(`*, project:projects(id, title, slug)`).eq("provider_id", providerId).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async getProviderBids(providerId: string) {
    return this.getBidsByProvider(providerId);
  },

  async updateBid(bidId: string, updates: any) {
    const { data, error } = await supabase.from("bids").update(updates).eq("id", bidId).select().single();
    return { data, error };
  },

  async deleteBid(bidId: string, providerId: string) {
    const { data: bid } = await supabase.from("bids").select("provider_id, status").eq("id", bidId).single();
    if (!bid || bid.provider_id !== providerId) return { data: null, error: new Error("Unauthorized") };
    const { error } = await supabase.from("bids").delete().eq("id", bidId);
    return { data: !error, error };
  },

  async uploadTradeCertificate(file: File, providerId: string) {
    const fileName = `${providerId}-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("trade-certificates").upload(fileName, file);
    if (error) return null;
    const { data: urlData } = supabase.storage.from("trade-certificates").getPublicUrl(fileName);
    return urlData.publicUrl;
  }
};