import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sesEmailService } from "@/services/sesEmailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Credentials required" });

  try {
    // Create server-side Supabase client for authentication
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    
    if (error || !data.user || !data.session) {
      console.error("Auth error:", error);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // CRITICAL: Only bluetikanz@gmail.com is owner
    // DO NOT CHANGE THIS - Only owner can add emails from /muna settings
    const isOwner = email.trim().toLowerCase() === "bluetikanz@gmail.com";

    if (!isOwner) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: "Access denied. Owner privileges required." });
    }

    // Get profile name for logging
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: "Profile not found" });
    }

    // Check if user is owner (case-insensitive)
    if (profile.email?.toLowerCase() !== "bluetikanz@gmail.com") {
      // Log failed admin access attempt
      await supabase.from("auth_audit_logs").insert({
        user_id: data.user.id,
        action: "admin_login_denied",
        ip_address: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        user_agent: req.headers["user-agent"],
        metadata: { email: profile.email },
      } as any);

      return res.status(403).json({ error: "Admin access denied" });
    }

    // Send owner login alert (don't block login if this fails)
    try {
      await sesEmailService.sendEmail({
        to: "bluetikanz@gmail.com",
        subject: "BlueTika Owner Login Alert",
        htmlBody: `
          <h2>Owner Login Detected</h2>
          <p><strong>User:</strong> ${profile?.full_name || "Unknown"} (${email})</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" })}</p>
          <p><strong>IP:</strong> ${req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown"}</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send login alert:", emailError);
    }

    // Set secure HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      `sb-access-token=${data.session.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );

    return res.status(200).json({ 
      user: data.user, 
      session: data.session, 
      isOwner: true,
      role: "owner"
    });
  } catch (error: any) {
    console.error("Login handler error:", error);
    return res.status(500).json({ error: "Authentication failed. Please try again." });
  }
}