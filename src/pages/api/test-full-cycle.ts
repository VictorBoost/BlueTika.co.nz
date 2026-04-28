import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendBidNotification, sendContractNotification, sendPaymentNotification, sendRegistrationEmail } from "@/lib/email-sender";

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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Step 1: Get or create client profile
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
          account_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      clientProfile = newClient;
      console.log("✅ Client created");
    }

    // Step 2: Get or create provider profile
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
          is_provider: true,
          verification_status: "verified",
          account_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      providerProfile = newProvider;
      console.log("✅ Provider created");
    }

    // Step 3: Create project
    const categories = [
      { cat: "Plumbing", sub: "Repairs & Maintenance", title: "Test Plumbing Repair" },
      { cat: "Electrical", sub: "Wiring", title: "Test Electrical Work" },
      { cat: "Cleaning", sub: "Deep Clean", title: "Test Cleaning Job" }
    ];
    const randomProject = categories[Math.floor(Math.random() * categories.length)];

    const { data: project, error: projectError } = await supabaseAdmin
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

    await sendContractNotification(clientEmail, providerEmail, project.title);
    console.log("✅ Contract notification emails sent");

    // Step 6: Simulate bot payment
    console.log("💳 Simulating bot payment...");
    await supabaseAdmin.from("contracts").update({
      payment_status: "paid",
      status: "in_progress"
    }).eq("id", contract.id);
    console.log("✅ Payment processed");

    // Step 7: Upload evidence
    await supabaseAdmin.from("evidence_photos").insert([
      {
        contract_id: contract.id,
        photo_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        uploaded_by: providerProfile.id,
        description: "Before"
      }
    ]);

    await supabaseAdmin.from("contracts").update({
      work_done_at: new Date().toISOString(),
      after_photos_submitted_at: new Date().toISOString(),
      status: "awaiting_fund_release",
      ready_for_release_at: new Date().toISOString()
    }).eq("id", contract.id);

    // Step 8: Submit reviews
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

    await supabaseAdmin.from("contracts").update({
      payment_status: "released",
      status: "completed",
      funds_released_at: new Date().toISOString()
    }).eq("id", contract.id);

    console.log("✅ Reviews submitted");

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