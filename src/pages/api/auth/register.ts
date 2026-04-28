import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sendRegistrationEmail } from "@/lib/email-sender";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, full_name, phone_number, city_region, is_provider } = req.body;

  if (!email || !password || !full_name || !phone_number || !city_region) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    // Update profile with additional information
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone_number,
        city_region,
        is_provider: is_provider || false,
      })
      .eq("id", authData.user.id);

    if (profileError) throw profileError;

    // Send welcome email
    try {
      await sendRegistrationEmail(
        email,
        full_name,
        is_provider ? "provider" : "client"
      );
      console.log("✅ Welcome email sent to:", email);
    } catch (emailError: any) {
      console.error("❌ Failed to send welcome email:", emailError.message);
      // Don't fail registration if email fails
    }

    return res.status(200).json({
      message: "Registration successful! Check your email for a welcome message.",
      user: authData.user,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: error.message });
  }
}