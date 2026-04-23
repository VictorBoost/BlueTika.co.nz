import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { sesEmailService } from "@/services/sesEmailService";
import { emailLogService } from "@/services/emailLogService";
import { notificationService } from "@/services/notificationService";

type Bid = Database["public"]["Tables"]["bids"]["Row"];

export const bidService = {
  async submitBid(projectId: string, providerId: string, bidAmount: number, coverLetter: string) {
    const { data, error } = await supabase
      .from("bids")
      .insert({
        project_id: projectId,
        provider_id: providerId,
        amount: bidAmount,
        message: coverLetter,
        status: "submitted",
      } as any)
      .select(`*, project:projects(title, client_id, id), provider:profiles!bids_provider_id_fkey(full_name, email)`)
      .single();

    if (error || !data) return { data: null, error };

    if (data.provider && data.project) {
      const emailSent = await sesEmailService.sendFirstBidSubmitted(
        (data.provider as any).email,
        (data.provider as any).full_name || "Provider",
        (data.project as any).title,
        (data.project as any).id,
        bidAmount
      );
      await emailLogService.logEmail((data.provider as any).email, "first_bid_submitted", emailSent ? "sent" : "failed", { bid_id: data.id, project_id: projectId });
    }

    if ((data.project as any)?.client_id) {
      await notificationService.createNotification({
        user_id: (data.project as any).client_id,
        type: "new_bid",
        title: "New Bid Received",
        message: `${(data.provider as any)?.full_name || "A provider"} submitted a bid of NZD $${bidAmount}`,
        link: `/project/${projectId}`,
      });
    }

    return { data, error: null };
  },

  async createBid(projectId: string, providerId: string, bidAmount: number, coverLetter: string) {
    return this.submitBid(projectId, providerId, bidAmount, coverLetter);
  },

  async acceptBid(bidId: string, clientId: string) {
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
      .eq("project_id", bid.project_id)
      .neq("id", bidId)
      .eq("status", "submitted");

    if (otherBids && otherBids.length > 0) {
      await supabase.from("bids").update({ status: "declined" }).eq("project_id", bid.project_id).neq("id", bidId);
      for (const otherBid of otherBids) {
        if (otherBid.provider) {
          const emailSent = await sesEmailService.sendBidDeclinedEmail((otherBid.provider as any).email, (otherBid.provider as any).full_name || "Provider", (bid.project as any)?.title || "Project");
          await emailLogService.logEmail((otherBid.provider as any).email, "bid_declined", emailSent ? "sent" : "failed", { bid_id: otherBid.id, project_id: bid.project_id });
        }
      }
    }

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        project_id: bid.project_id,
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

    if (bid.provider) {
      const providerEmailSent = await sesEmailService.sendEmail({
        to: (bid.provider as any).email,
        subject: "BlueTika: Your Bid Was Accepted! 🎉",
        htmlBody: `<p>Your bid was accepted for ${(bid.project as any)?.title}.</p>`
      });
      await emailLogService.logEmail((bid.provider as any).email, "bid_accepted_provider", providerEmailSent ? "sent" : "failed", { bid_id: bidId, contract_id: contract.id });
    }

    if ((bid.project as any)?.client) {
      const clientEmailSent = await sesEmailService.sendEmail({
        to: (bid.project as any).client.email,
        subject: "BlueTika: Bid Accepted - Next Steps",
        htmlBody: `<p>You accepted the bid for ${(bid.project as any).title}.</p>`
      });
      await emailLogService.logEmail((bid.project as any).client.email, "bid_accepted_client", clientEmailSent ? "sent" : "failed", { bid_id: bidId, contract_id: contract.id });
    }

    return { data: contract, error: null };
  },

  async getBidsByProject(projectId: string) {
    const { data, error } = await supabase.from("bids").select(`*, provider:profiles!bids_provider_id_fkey(*)`).eq("project_id", projectId).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async getBidsByProvider(providerId: string) {
    const { data, error } = await supabase.from("bids").select(`*, project:projects(*)`).eq("provider_id", providerId).order("created_at", { ascending: false });
    return { data: data || [], error };
  },

  async getProviderBids(providerId: string) {
    return this.getBidsByProvider(providerId);
  },

  async updateBid(bidId: string, updates: Partial<Bid>) {
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
    return { data: { url: "mock-url" }, error: null };
  }
};