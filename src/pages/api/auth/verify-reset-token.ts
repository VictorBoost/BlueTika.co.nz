import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Check if token exists and is valid
    const { data: resetToken, error } = await supabase
      .from("password_reset_tokens")
      .select("*, profiles!password_reset_tokens_user_id_fkey(email)")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (error || !resetToken) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Check if token has expired
    const expiresAt = new Date(resetToken.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: "Token has expired" });
    }

    return res.status(200).json({ 
      valid: true,
      email: resetToken.email 
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}