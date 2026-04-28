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
    // Step 1: Get or create profiles using Service Role (bypasses RLS)
    let clientProfile: any;
    let providerProfile: any;

    const { data: existingClient } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", clientEmail)
      .maybeSingle();

    if (existingClient) {
      clientProfile = existingClient;
      console.log("✅ Client profile exists");
    } else {
      // Create profile directly (assuming auth user exists or will be created later)
      const clientId = crypto.randomUUID();
      const { data: newClient, error } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: clientId,
          email: clientEmail,
          full_name: "Test Client",
          phone_number: "021 123 4567",
          city_region: "Auckland",
          account_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      clientProfile = newClient;
      console.log("✅ Client profile created");
      
      try {
        await sendRegistrationEmail(clientEmail, "Test Client", "client");
      } catch (e) {
        console.log("Welcome email skipped");
      }
    }

    const { data: existingProvider } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", providerEmail)
      .maybeSingle();

    if (existingProvider) {
      providerProfile = existingProvider;
      console.log("✅ Provider profile exists");
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
          verification_status: "verified",
          account_status: "active"
        })
        .select()
        .single();

      if (error) throw error;
      providerProfile = newProvider;
      console.log("✅ Provider profile created");
      
      try {
        await sendRegistrationEmail(providerEmail, "Test Provider", "provider");
      } catch (e) {
        console.log("Welcome email skipped");
      }
    }

    // Step 2: Create project
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

    // Step 3: Provider submits bid
    const bidAmount = 250;
    const { data: bid, error: bidError } = await supabaseAdmin
      .from("bids")
      .insert({
        project_id: project.id,
        provider_id: providerProfile.id,
        amount: bidAmount,
        message: "I can help with this project today.",
        estimated_timeline: "2-3 hours",
        status: "pending"
      })
      .select()
      .single();

    if (bidError) throw bidError;
    console.log("✅ Bid submitted");

    // Send bid notification
    try {
      await sendBidNotification(clientEmail, project.title, providerProfile.full_name || "Provider", bidAmount);
      console.log("✅ Bid email sent");
    } catch (e) {
      console.log("⚠️ Bid email skipped");
    }

    // Step 4: Accept bid (create contract)
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .insert({
        project_id: project.id,
        bid_id: bid.id,
        client_id: clientProfile.id,
        provider_id: providerProfile.id,
        final_amount: bidAmount,
        platform_fee: 25,
        payment_processing_fee: 7.55,
        status: "pending_payment",
        payment_status: "pending"
      })
      .select()
      .single();

    if (contractError) throw contractError;

    await supabaseAdmin.from("bids").update({ status: "accepted" }).eq("id", bid.id);
    await supabaseAdmin.from("projects").update({ status: "in_progress" }).eq("id", project.id);
    console.log("✅ Contract created");

    // Send contract notifications
    try {
      await sendContractNotification(clientEmail, providerEmail, project.title);
      console.log("✅ Contract emails sent");
    } catch (e) {
      console.log("⚠️ Contract emails skipped");
    }

    // Step 5: Complete work and release payment
    await supabaseAdmin.from("contracts").update({
      payment_status: "paid",
      work_done_at: new Date().toISOString(),
      status: "completed",
      funds_released_at: new Date().toISOString()
    }).eq("id", contract.id);

    // Add reviews
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

    console.log("✅ Work completed");

    // Send payment notifications
    try {
      await sendPaymentNotification(clientEmail, providerEmail, bidAmount);
      console.log("✅ Payment emails sent");
    } catch (e) {
      console.log("⚠️ Payment emails skipped");
    }

    return res.status(200).json({
      success: true,
      message: "Full cycle completed! Check your emails.",
      clientEmail,
      providerEmail,
      projectId: project.id,
      contractId: contract.id,
      finalAmount: bidAmount.toFixed(2),
      emailsSent: [
        "Welcome emails (if new profiles)",
        "Bid notification to client",
        "Contract notifications to both",
        "Payment notifications to both"
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