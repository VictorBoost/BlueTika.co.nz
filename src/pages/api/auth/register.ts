import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sendRegistrationEmail } from "@/lib/email-sender";
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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz"}/auth/verify`,
      },
    });

    if (authError) return res.status(400).json({ error: authError.message });
    if (!authData.user) return res.status(400).json({ error: "Failed to create user account" });

    await supabase.from("profiles").update({
      full_name: fullName,
      user_type: userType,
    } as any).eq("id", authData.user.id);

    try {
      const emailResult = await sendRegistrationEmail(email, fullName, userType);
      await emailLogService.logEmail(email, "welcome", "sent", { 
        user_id: authData.user.id,
        message_id: emailResult.messageId 
      });
    } catch (emailError: any) {
      console.error("Failed to send registration email:", emailError);
      await emailLogService.logEmail(email, "welcome", "failed", { 
        user_id: authData.user.id, 
        error: emailError.message 
      });
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
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed." });
  }
}