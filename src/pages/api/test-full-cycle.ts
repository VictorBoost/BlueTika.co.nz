import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
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
          email: clientEmail,
          full_name: "Test Client",
          phone_number: "021 123 4567",
          city_region: "Auckland",
          is_client: true,
          is_provider: false,
          account_status: "active"
        })
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
          email: providerEmail,
          full_name: "Test Provider",
          phone_number: "027 987 6543",
          city_region: "Wellington",
          is_client: false,
          is_provider: true,
          verification_status: "verified",
          verification_tier: "Gold",
          account_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      providerProfile = newProvider;
    } else {
      providerProfile = existingProvider;
    }

    const categories = [
      { cat: "Plumbing", sub: "Repairs & Maintenance", title: "Fix Leaking Pipe" },
      { cat: "Electrical", sub: "Wiring", title: "Install New Outlets" },
      { cat: "Cleaning", sub: "Deep Clean", title: "End of Tenancy Cleaning" }
    ];
    const randomProject = categories[Math.floor(Math.random() * categories.length)];

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: clientProfile.id,
        title: randomProject.title,
        description: "Automated test project",
        category: randomProject.cat,
        subcategory: randomProject.sub,
        budget_min: 150,
        budget_max: 300,
        city_region: "Auckland",
        status: "open"
      })
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
        message: "I can help with this project today.",
        estimated_duration: "2-3 hours",
        status: "pending"
      })
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
      })
      .select()
      .single();

    if (contractError) throw contractError;

    await supabase.from("bids").update({ status: "accepted" }).eq("id", bid.id);
    await supabase.from("projects").update({ status: "in_progress" }).eq("id", project.id);

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

    await supabase.from("evidence_photos").insert([
      {
        contract_id: contract.id,
        photo_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        uploaded_by: providerProfile.id,
        description: "Before"
      }
    ]);

    await supabase.from("contracts").update({
      work_done_at: new Date().toISOString(),
      after_photos_submitted_at: new Date().toISOString(),
      status: "awaiting_fund_release",
      ready_for_release_at: new Date().toISOString()
    }).eq("id", contract.id);

    await supabase.from("reviews").insert({
      contract_id: contract.id,
      reviewer_id: providerProfile.id,
      reviewee_id: clientProfile.id,
      rating: 5,
      comment: "Great client!",
      review_type: "provider_to_client"
    });

    await supabase.from("contracts").update({
      payment_status: "released",
      status: "completed",
      funds_released_at: new Date().toISOString()
    }).eq("id", contract.id);

    await supabase.from("reviews").insert({
      contract_id: contract.id,
      reviewer_id: clientProfile.id,
      reviewee_id: providerProfile.id,
      rating: 5,
      comment: "Excellent work!",
      review_type: "client_to_provider"
    });

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