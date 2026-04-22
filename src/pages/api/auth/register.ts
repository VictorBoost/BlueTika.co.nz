import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sesEmailService } from "@/services/sesEmailService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, firstName, lastName, phoneNumber, cityRegion, isClient, isProvider } = req.body;

  if (!email || !password || !firstName || !lastName || !phoneNumber || !cityRegion) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
      }
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      
      if (authError.message.includes("already registered")) {
        return res.status(400).json({ error: "This email is already registered" });
      }
      
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: "User creation failed" });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        city_region: cityRegion,
        is_client: isClient || false,
        is_provider: isProvider || false,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      console.error("Session creation error:", signInError);
      return res.status(400).json({ error: "Registration successful but failed to log in. Please log in manually." });
    }

    res.setHeader(
      "Set-Cookie",
      `sb-access-token=${signInData.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    );

    sesEmailService.sendWelcomeEmail(email, `${firstName} ${lastName}`, "https://bluetika.co.nz").catch(error => {
      console.error("Welcome email failed (non-critical):", error);
    });

    return res.status(200).json({
      user: signInData.user,
      session: signInData.session,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({ 
      error: error?.message || "Connection error. Please try again." 
    });
  }
}