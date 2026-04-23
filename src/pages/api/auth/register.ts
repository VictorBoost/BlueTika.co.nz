import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sesEmailService } from "@/services/sesEmailService";
import { emailLogService } from "@/services/emailLogService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, password, fullName, userType } = req.body;

  if (!email || !password || !fullName || !userType) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://bluetika.co.nz"}/auth/verify`,
      },
    });

    if (authError) return res.status(400).json({ error: authError.message });
    if (!authData.user) return res.status(400).json({ error: "Failed to create user account" });

    // Bypass strict typing to safely update extended profile fields
    await supabase.from("profiles").update({
      full_name: fullName,
      user_type: userType,
    } as any).eq("id", authData.user.id);

    const emailSent = await sesEmailService.sendWelcomeEmail(email, fullName);

    if (emailSent) {
      await emailLogService.logEmail(email, "welcome", "sent", { user_id: authData.user.id });
    } else {
      await emailLogService.logEmail(email, "welcome", "failed", { user_id: authData.user.id, error: "SES failed" });
    }

    if (authData.session) {
      res.setHeader(
        "Set-Cookie",
        `sb-access-token=${authData.session.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
      );
    }

    res.status(201).json({
      user: authData.user,
      session: authData.session,
      message: "Registration successful!",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Registration failed." });
  }
}