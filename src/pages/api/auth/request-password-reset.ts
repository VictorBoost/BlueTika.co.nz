import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sendPasswordResetEmail } from "@/services/sesEmailService";
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

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      // Don't reveal if email exists or not (security best practice)
      return res.status(200).json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link shortly." 
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
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

    // Send password reset email via SES
    const baseUrl = req.headers.origin || "https://bluetika.co.nz";
    const emailSent = await sendPasswordResetEmail(
      email,
      profile.full_name || "there",
      resetToken,
      baseUrl
    );

    if (!emailSent) {
      console.error("Failed to send password reset email");
      // Still return success to user (don't reveal email sending failure)
    }

    // Log the email attempt
    await supabase.from("email_logs").insert({
      recipient_email: email,
      email_type: "password_reset",
      subject: "BlueTika: Reset Your Password",
      status: emailSent ? "sent" : "failed",
      error_message: emailSent ? null : "SES send failed",
    });

    return res.status(200).json({ 
      success: true, 
      message: "If an account exists with this email, you will receive a password reset link shortly." 
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}