import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sendRegistrationEmail } from "@/lib/email-sender";

/**
 * API endpoint to create test profiles for email testing
 * POST /api/create-test-profiles
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

  console.log("🤖 Creating test profiles...");
  console.log("   Client:", clientEmail);
  console.log("   Provider:", providerEmail);

  try {
    const testPassword = "TestPassword123!";
    let clientUserId: string;
    let providerUserId: string;

    // Create client account
    const { data: clientAuth, error: clientAuthError } = await supabase.auth.signUp({
      email: clientEmail,
      password: testPassword,
    });

    if (clientAuthError) {
      // Check if user already exists
      const { data: existingClient } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", clientEmail)
        .single();

      if (existingClient) {
        clientUserId = existingClient.id;
        console.log("   ✅ Client already exists");
      } else {
        throw clientAuthError;
      }
    } else {
      if (!clientAuth.user) throw new Error("Client user creation failed");
      clientUserId = clientAuth.user.id;

      // Update client profile
      await supabase
        .from("profiles")
        .update({
          full_name: "Test Client",
          phone_number: "021 123 4567",
          city_region: "Auckland",
          is_provider: false,
          account_status: "active"
        })
        .eq("id", clientUserId);

      // Send welcome email
      try {
        await sendRegistrationEmail(clientEmail, "Test Client", "client");
        console.log("   ✅ Client welcome email sent");
      } catch (emailErr) {
        console.error("   ⚠️ Client welcome email failed");
      }

      console.log("   ✅ Client profile created");
    }

    // Create provider account
    const { data: providerAuth, error: providerAuthError } = await supabase.auth.signUp({
      email: providerEmail,
      password: testPassword,
    });

    if (providerAuthError) {
      // Check if user already exists
      const { data: existingProvider } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", providerEmail)
        .single();

      if (existingProvider) {
        providerUserId = existingProvider.id;
        console.log("   ✅ Provider already exists");
      } else {
        throw providerAuthError;
      }
    } else {
      if (!providerAuth.user) throw new Error("Provider user creation failed");
      providerUserId = providerAuth.user.id;

      // Update provider profile
      await supabase
        .from("profiles")
        .update({
          full_name: "Test Provider",
          phone_number: "027 987 6543",
          city_region: "Wellington",
          is_provider: true,
          verification_status: "verified",
          verification_tier: "Gold",
          account_status: "active"
        })
        .eq("id", providerUserId);

      // Send welcome email
      try {
        await sendRegistrationEmail(providerEmail, "Test Provider", "provider");
        console.log("   ✅ Provider welcome email sent");
      } catch (emailErr) {
        console.error("   ⚠️ Provider welcome email failed");
      }

      console.log("   ✅ Provider profile created");
    }

    return res.status(200).json({
      success: true,
      message: "Test profiles created successfully!",
      clientEmail,
      providerEmail,
      password: testPassword,
      clientUserId,
      providerUserId
    });

  } catch (error: any) {
    console.error("❌ Profile creation error:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to create test profiles",
      details: error.toString()
    });
  }
}