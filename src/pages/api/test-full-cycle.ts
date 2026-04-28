import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendBidNotification, sendContractNotification, sendPaymentNotification, sendRegistrationEmail } from "@/lib/email-sender";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clientEmail, providerEmail } = req.body;
  if (!clientEmail || !providerEmail) {
    return res.status(400).json({ error: "Both emails required" });
  }

  console.log("🧪 Full cycle test starting");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Step 1: Create or get client profile
    let clientProfile: any;
    const { data: existingClient } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", clientEmail)
      .maybeSingle();

    if (existingClient) {
      clientProfile = existingClient;
      console.log("✅ Client exists");
    } else {
      const clientId = crypto.randomUUID();
      const { data: newClient, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: clientId,
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
      console.log("✅ Client created");
      
      try {
        await sendRegistrationEmail(clientEmail, "Test Client", "client");
        console.log("✅ Welcome email sent to client");
      } catch (e) {
        console.log("⚠️ Welcome email skipped");
      }
    }

    // Step 2: Create or get provider profile
    let providerProfile: any;
    const { data: existingProvider } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", providerEmail)
      .maybeSingle();

    if (existingProvider) {
      providerProfile = existingProvider;
      console.log("✅ Provider exists");
    } else {
      const providerId = crypto.randomUUID();
      const { data: newProvider, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: providerId,
          email: providerEmail,
          full_name: "Test Provider",
          phone_number: "027 987 6543",
          city_region: "Wellington",
          is_client: false,
          is_provider: true,
          verification_status: "verified",
          account_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      providerProfile = newProvider;
      console.log("✅ Provider created");
      
      try {
        await sendRegistrationEmail(providerEmail, "Test Provider", "provider");
        console.log("✅ Welcome email sent to provider");
      } catch (e) {
        console.log("⚠️ Welcome email skipped");
      }
    }

    // Step 3: Create project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert({
        client_id: clientProfile.id,
        title: "Test Plumbing Repair",
        description: "Automated test project",
        category: "Plumbing",
        subcategory: "Repairs & Maintenance",
        budget_min: 150,
        budget_max: 300,
        city_region: "Auckland",
        status: "open"
      })
      .select()
      .single();

    if (projectError) throw projectError;
    console.log("✅ Project created");

    // Step 4: Submit bid
    const bidAmount = 250;
    const { data: bid, error: bidError } = await supabaseAdmin
      .from("bids")
      .insert({
        project_id: project.id,
        provider_id: providerProfile.id,
        amount: bidAmount,
        message: "I can help with this project.",
        estimated_timeline: "2-3 hours",
        status: "pending"
      })
      .select()
      .single();

    if (bidError) throw bidError;
    console.log("✅ Bid submitted");

    // Send bid notification email
    await sendBidNotification(clientEmail, project.title, providerProfile.full_name || "Test Provider", bidAmount);
    console.log("✅ Bid notification email sent");

    const platformFee = Math.round(bid.amount * 0.10 * 100) / 100;
    const paymentFee = Math.round(bid.amount * 0.029 * 100) / 100 + 0.30;

    // Step 5: Accept bid (create contract)
    const { data: contract, error: contractError } = await supabaseAdmin
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
    console.log(`✅ Contract created: ${contract.id}`);

    await supabaseAdmin.from("bids").update({ status: "accepted" }).eq("id", bid.id);
    await supabaseAdmin.from("projects").update({ status: "in_progress" }).eq("id", project.id);

    // Send contract notification emails
    await sendContractNotification(clientEmail, providerEmail, project.title);
    console.log("✅ Contract notification emails sent");

    // Simulate bot payment
    console.log("💳 Simulating bot payment...");
    await supabaseAdmin.from("contracts").update({
      payment_status: "paid",
      status: "in_progress"
    }).eq("id", contract.id);
    console.log("✅ Payment processed");

    // Upload evidence
    await supabaseAdmin.from("evidence_photos").insert([
      {
        contract_id: contract.id,
        photo_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        uploaded_by: providerProfile.id,
        description: "Before"
      }
    ]);

    await supabaseAdmin.from("reviews").insert([
      {
        contract_id: contract.id,
        client_id: clientProfile.id,
        provider_id: providerProfile.id,
        rating: 5,
        comment: "Excellent work!",
        reviewer_role: "client",
        reviewee_role: "provider"
      },
      {
        contract_id: contract.id,
        client_id: clientProfile.id,
        provider_id: providerProfile.id,
        rating: 5,
        comment: "Great client!",
        reviewer_role: "provider",
        reviewee_role: "client"
      }
    ]);

    console.log("✅ Reviews submitted");

    // Send payment notification emails
    await sendPaymentNotification(clientEmail, providerEmail, contract.final_amount);
    console.log("✅ Payment notification emails sent");

    return res.status(200).json({
      success: true,
      message: "Full cycle test completed - check your emails!",
      clientEmail,
      providerEmail,
      projectId: project.id,
      contractId: contract.id,
      finalAmount: contract.final_amount.toFixed(2),
      emailsSent: [
        "Welcome emails (both accounts)",
        "Bid notification to client",
        "Contract notification to both parties",
        "Payment notification to both parties"
      ]
    });

  } catch (error: any) {
    console.error("❌ Test error:", error);
    return res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
}