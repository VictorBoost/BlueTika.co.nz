import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sendPasswordResetEmail } from "@/lib/email-sender";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      return res.status(200).json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link shortly." 
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { error: tokenError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: profile.id,
        email: email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error creating reset token:", tokenError);
      return res.status(500).json({ error: "Failed to create reset token" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz";
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
      
      await supabase.from("email_logs").insert({
        recipient_email: email,
        email_type: "password_reset",
        subject: "Reset your BlueTika password",
        status: "sent",
      });
    } catch (emailError: any) {
      console.error("Failed to send password reset email:", emailError);
      
      await supabase.from("email_logs").insert({
        recipient_email: email,
        email_type: "password_reset",
        subject: "Reset your BlueTika password",
        status: "failed",
        error_message: emailError.message,
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "If an account exists with this email, you will receive a password reset link shortly." 
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}