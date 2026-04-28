import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendBidNotification, sendContractNotification, sendPaymentNotification } from "@/lib/email-sender";
import { emailLogService } from "@/services/emailLogService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clientEmail, providerEmail } = req.body;
  if (!clientEmail || !providerEmail) return res.status(400).json({ error: "Required" });

  // Use Service Role to bypass all RLS policies for reliable testing
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const baseUrl = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    // 1. Let the bot setup verified profiles
    const createProfilesResponse = await fetch(`${baseUrl}/api/create-test-profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail, providerEmail })
    });

    if (!createProfilesResponse.ok) throw new Error("Profile creation failed");

    const { data: clientProfile } = await supabaseAdmin.from("profiles").select("*").eq("email", clientEmail).single();
    const { data: providerProfile } = await supabaseAdmin.from("profiles").select("*").eq("email", providerEmail).single();

    if (!clientProfile || !providerProfile) throw new Error("Profiles not found");

    // 2. Post Project
    const { data: project, error: projectError } = await supabaseAdmin.from("projects").insert({
      client_id: clientProfile.id,
      title: "Automated Test Project - Plumbing Repair",
      description: "Test project for email cycle",
      budget: 250,
      location: "Auckland",
      status: "open"
    }).select().single();
    if (projectError) throw projectError;

    // 3. Submit Bid
    const bidAmount = 250;
    const { data: bid, error: bidError } = await supabaseAdmin.from("bids").insert({
      project_id: project.id,
      provider_id: providerProfile.id,
      amount: bidAmount,
      message: "I can help with this job today.",
      status: "pending"
    }).select().single();
    if (bidError) throw bidError;

    try { await sendBidNotification(clientEmail, project.title, providerProfile.full_name || "Provider", bidAmount); } catch(e){}

    // 4. Accept Bid (Create Contract)
    const { data: contract, error: contractError } = await supabaseAdmin.from("contracts").insert({
      project_id: project.id,
      bid_id: bid.id,
      client_id: clientProfile.id,
      provider_id: providerProfile.id,
      final_amount: bidAmount,
      status: "pending_payment",
      payment_status: "pending"
    }).select().single();
    if (contractError) throw contractError;

    await supabaseAdmin.from("bids").update({ status: "accepted" }).eq("id", bid.id);
    await supabaseAdmin.from("projects").update({ status: "in_progress" }).eq("id", project.id);

    try { await sendContractNotification(clientEmail, providerEmail, project.title); } catch(e){}

    // 5. Simulate Payment
    await fetch(`${baseUrl}/api/bot-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: contract.id })
    });

    // 6. Complete Work & Release Escrow
    await supabaseAdmin.from("contracts").update({
      work_done_at: new Date().toISOString(),
      status: "awaiting_fund_release",
      ready_for_release_at: new Date().toISOString()
    }).eq("id", contract.id);

    // Reviews
    await supabaseAdmin.from("reviews").insert([
      { contract_id: contract.id, client_id: clientProfile.id, provider_id: providerProfile.id, reviewer_role: "provider", reviewee_role: "client", rating: 5, comment: "Great" },
      { contract_id: contract.id, client_id: clientProfile.id, provider_id: providerProfile.id, reviewer_role: "client", reviewee_role: "provider", rating: 5, comment: "Good" }
    ]);

    await supabaseAdmin.from("contracts").update({
      payment_status: "released",
      status: "completed",
      funds_released_at: new Date().toISOString()
    }).eq("id", contract.id);

    try { await sendPaymentNotification(clientEmail, providerEmail, contract.final_amount); } catch(e){}

    return res.status(200).json({
      success: true,
      message: "Full cycle test completed! Check your emails.",
      clientEmail,
      providerEmail,
      projectId: project.id,
      contractId: contract.id,
      finalAmount: contract.final_amount
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}