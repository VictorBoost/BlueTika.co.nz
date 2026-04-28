import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sendBidNotification, sendContractNotification, sendPaymentNotification } from "@/lib/email-sender";
import { emailLogService } from "@/services/emailLogService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clientEmail, providerEmail } = req.body;

  if (!clientEmail || !providerEmail) {
    return res.status(400).json({ error: "Both clientEmail and providerEmail are required" });
  }

  console.log("🧪 Full cycle test starting");
  console.log("Client:", clientEmail);
  console.log("Provider:", providerEmail);

  try {
    let clientProfile: any;
    let providerProfile: any;

    const { data: existingClient } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", clientEmail)
      .maybeSingle();

    if (!existingClient) {
      const { data: newClient, error } = await supabase
        .from("profiles")
        .insert({
          id: crypto.randomUUID(),
          email: clientEmail,
          full_name: "Test Client",
          phone_number: "021 123 4567",
          city_region: "Auckland",
          account_status: "active"
        } as any)
        .select()
        .single();

      if (error) throw error;
      clientProfile = newClient;
    } else {
      clientProfile = existingClient;
    }

    const { data: existingProvider } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", providerEmail)
      .maybeSingle();

    if (!existingProvider) {
      const { data: newProvider, error } = await supabase
        .from("profiles")
        .insert({
          id: crypto.randomUUID(),
          email: providerEmail,
          full_name: "Test Provider",
          phone_number: "027 987 6543",
          city_region: "Wellington",
          verification_status: "verified",
          account_status: "active"
        } as any)
        .select()
        .single();

      if (error) throw error;
      providerProfile = newProvider;
    } else {
      providerProfile = existingProvider;
    }

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .limit(1)
      .single();

    const categoryId = categories?.id || "00000000-0000-0000-0000-000000000001";

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: clientProfile.id,
        title: "Test Project - Plumbing Repair",
        description: "Automated test project",
        category_id: categoryId,
        budget: 250,
        city_region: "Auckland",
        status: "open"
      } as any)
      .select()
      .single();

    if (projectError) throw projectError;

    const bidAmount = Math.floor(Math.random() * 100) + 150;
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({
        project_id: project.id,
        provider_id: providerProfile.id,
        amount: bidAmount,
        estimated_timeline: "2-3 hours",
        status: "pending"
      } as any)
      .select()
      .single();

    if (bidError) throw bidError;

    try {
      await sendBidNotification(clientEmail, project.title, providerProfile.full_name || "Test Provider", bidAmount);
      await emailLogService.logEmail(clientEmail, "bid_notification", "sent", { bid_id: bid.id });
    } catch (emailErr: any) {
      console.error("Bid email failed:", emailErr.message);
      await emailLogService.logEmail(clientEmail, "bid_notification", "failed", { bid_id: bid.id, error: emailErr.message });
    }

    const platformFee = Math.round(bid.amount * 0.10 * 100) / 100;
    const paymentFee = Math.round(bid.amount * 0.029 * 100) / 100 + 0.30;

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        project_id: project.id,
        bid_id: bid.id,
        client_id: clientProfile.id,
        provider_id: providerProfile.id,
        final_amount: bid.amount,
        platform_fee: platformFee,
        payment_processing_fee: paymentFee,
        status: "pending_payment",
        payment_status: "pending"
      } as any)
      .select()
      .single();

    if (contractError) throw contractError;

    await supabase.from("bids").update({ status: "accepted" } as any).eq("id", bid.id);
    await supabase.from("projects").update({ status: "in_progress" } as any).eq("id", project.id);

    try {
      await sendContractNotification(clientEmail, providerEmail, project.title);
      await emailLogService.logEmail(clientEmail, "contract_created_client", "sent", { contract_id: contract.id });
      await emailLogService.logEmail(providerEmail, "contract_created_provider", "sent", { contract_id: contract.id });
    } catch (emailErr: any) {
      console.error("Contract email failed:", emailErr.message);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await fetch(`${baseUrl}/api/bot-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: contract.id })
    });

    await supabase.from("contracts").update({
      work_done_at: new Date().toISOString(),
      status: "awaiting_fund_release",
      ready_for_release_at: new Date().toISOString()
    } as any).eq("id", contract.id);

    await supabase.from("reviews").insert({
      contract_id: contract.id,
      client_id: clientProfile.id,
      provider_id: providerProfile.id,
      rating: 5,
      comment: "Great client!",
      reviewee_role: "client",
      reviewer_role: "provider"
    } as any);

    await supabase.from("contracts").update({
      payment_status: "released",
      status: "completed",
      funds_released_at: new Date().toISOString()
    } as any).eq("id", contract.id);

    await supabase.from("reviews").insert({
      contract_id: contract.id,
      client_id: clientProfile.id,
      provider_id: providerProfile.id,
      rating: 5,
      comment: "Excellent work!",
      reviewee_role: "provider",
      reviewer_role: "client"
    } as any);

    try {
      await sendPaymentNotification(clientEmail, providerEmail, contract.final_amount);
      await emailLogService.logEmail(clientEmail, "payment_released_client", "sent", { contract_id: contract.id });
      await emailLogService.logEmail(providerEmail, "payment_released_provider", "sent", { contract_id: contract.id });
    } catch (emailErr: any) {
      console.error("Payment email failed:", emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Full cycle test completed - check your emails!",
      clientEmail,
      providerEmail,
      projectId: project.id,
      contractId: contract.id,
      finalAmount: contract.final_amount.toFixed(2),
      emailsSent: [
        "Bid notification to client",
        "Contract notification to both parties",
        "Payment notification to both parties"
      ]
    });

  } catch (error: any) {
    console.error("Test failed:", error);
    return res.status(500).json({ 
      error: error.message || "Test failed",
      details: error.toString()
    });
  }
}