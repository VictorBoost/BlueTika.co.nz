import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { sendBidNotification, sendContractNotification, sendPaymentNotification } from "@/lib/email-sender";
import { emailLogService } from "@/services/emailLogService";

/**
 * API endpoint to test complete bot cycle with real emails
 * POST /api/test-full-cycle
 * Body: { clientEmail: string, providerEmail: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clientEmail, providerEmail } = req.body;

  if (!clientEmail || !providerEmail) {
    return res.status(400).json({ error: "Both clientEmail and providerEmail are required" });
  }

  console.log("🧪 Starting full cycle test...");
  console.log("   Client:", clientEmail);
  console.log("   Provider:", providerEmail);

  try {
    // Step 1: Get or create profiles
    let { data: clientProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", clientEmail)
      .maybeSingle();

    let { data: providerProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", providerEmail)
      .maybeSingle();

    if (!clientProfile) {
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
      console.log("✅ Created client profile");
    }

    if (!providerProfile) {
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
      console.log("✅ Created provider profile");
    }

    // Randomize category for testing
    const categories = [
      { cat: "Plumbing", sub: "Repairs & Maintenance", title: "Test Project - Fix Leaking Pipe" },
      { cat: "Electrical", sub: "Wiring", title: "Test Project - Install New Outlets" },
      { cat: "Cleaning", sub: "Deep Clean", title: "Test Project - End of Tenancy Cleaning" },
      { cat: "Gardening", sub: "Lawn Care", title: "Test Project - Garden Clearance" },
      { cat: "Moving", sub: "Furniture Moving", title: "Test Project - Move Heavy Sofa" }
    ];
    const randomProject = categories[Math.floor(Math.random() * categories.length)];

    // Step 2: Create a project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: clientProfile.id,
        title: randomProject.title,
        description: "This is an automated test project with a randomized category.",
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
    console.log(`✅ Created project: ${project.id} (${randomProject.cat})`);

    // Step 3: Provider submits bid
    const bidAmount = Math.floor(Math.random() * 100) + 150;
    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .insert({
        project_id: project.id,
        provider_id: providerProfile.id,
        amount: bidAmount,
        message: "I can help with this project today. Experienced and ready to go.",
        estimated_duration: "2-3 hours",
        status: "pending"
      })
      .select()
      .single();

    if (bidError) throw bidError;
    console.log(`✅ Provider submitted bid: ${bid.id} ($${bidAmount})`);

    // Send bid notification email
    console.log("   📧 Sending bid notification to client...");
    try {
      await sendBidNotification(
        clientEmail,
        project.title,
        providerProfile.full_name || "Test Provider",
        bidAmount
      );
      await emailLogService.logEmail(clientEmail, "bid_notification", "sent", { bid_id: bid.id });
      console.log("   ✅ Bid notification email sent to client");
    } catch (emailErr: any) {
      console.error("   ❌ Bid notification failed:", emailErr.message);
      await emailLogService.logEmail(clientEmail, "bid_notification", "failed", { bid_id: bid.id, error: emailErr.message });
    }

    // Step 4: Client accepts bid (creates contract)
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
    console.log(`✅ Contract created: ${contract.id}`);

    // Update bid and project status
    await supabase.from("bids").update({ status: "accepted" }).eq("id", bid.id);
    await supabase.from("projects").update({ status: "in_progress" }).eq("id", project.id);

    // Send contract notification emails
    console.log("   📧 Sending contract notifications...");
    try {
      await sendContractNotification(clientEmail, providerEmail, project.title);
      await emailLogService.logEmail(clientEmail, "contract_created_client", "sent", { contract_id: contract.id });
      await emailLogService.logEmail(providerEmail, "contract_created_provider", "sent", { contract_id: contract.id });
      console.log("   ✅ Contract notification emails sent to both parties");
    } catch (emailErr: any) {
      console.error("   ❌ Contract notification failed:", emailErr.message);
      await emailLogService.logEmail(clientEmail, "contract_created_client", "failed", { contract_id: contract.id, error: emailErr.message });
    }

    // Step 5: Trigger bot payment
    console.log("💳 Triggering bot payment...");
    const baseUrl = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const paymentResponse = await fetch(`${baseUrl}/api/bot-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: contract.id })
    });

    const paymentResult = await paymentResponse.json();
    console.log("✅ Payment result:", paymentResult);

    // Step 6: Provider uploads work evidence
    await supabase.from("evidence_photos").insert([
      {
        contract_id: contract.id,
        photo_url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
        uploaded_by: providerProfile.id,
        description: "Before"
      },
      {
        contract_id: contract.id,
        photo_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
        uploaded_by: providerProfile.id,
        description: "After"
      }
    ]);

    await supabase.from("contracts").update({
      work_done_at: new Date().toISOString(),
      after_photos_submitted_at: new Date().toISOString(),
      status: "awaiting_fund_release",
      ready_for_release_at: new Date().toISOString()
    }).eq("id", contract.id);

    console.log("✅ Provider uploaded work evidence");

    // Step 7: Provider submits review of client
    await supabase.from("reviews").insert({
      contract_id: contract.id,
      reviewer_id: providerProfile.id,
      reviewee_id: clientProfile.id,
      rating: 5,
      comment: "Great client! Clear communication and prompt payment.",
      review_type: "provider_to_client"
    });
    console.log("✅ Provider submitted review of client (5 stars)");

    // Step 8: Client releases funds and reviews provider
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
      comment: "Excellent work! Highly recommend!",
      review_type: "client_to_provider"
    });
    console.log("✅ Client released funds and reviewed provider (5 stars)");

    // Send payment notification emails
    console.log("   📧 Sending payment release notifications...");
    try {
      await sendPaymentNotification(clientEmail, providerEmail, contract.final_amount);
      await emailLogService.logEmail(clientEmail, "payment_released_client", "sent", { contract_id: contract.id });
      await emailLogService.logEmail(providerEmail, "payment_released_provider", "sent", { contract_id: contract.id });
      console.log("   ✅ Payment notification emails sent to both parties");
    } catch (emailErr: any) {
      console.error("   ❌ Payment notification failed:", emailErr.message);
      await emailLogService.logEmail(clientEmail, "payment_released_client", "failed", { contract_id: contract.id, error: emailErr.message });
    }

    console.log("✅ Full cycle test completed successfully!");
    console.log("📧 Check both email addresses for all notifications:");
    console.log("   - Bid notification (client)");
    console.log("   - Contract created (both)");
    console.log("   - Payment released (both)");

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
    console.error("❌ Full cycle test error:", error);
    return res.status(500).json({ 
      error: error.message || "Unknown error occurred",
      details: error.toString()
    });
  }
}