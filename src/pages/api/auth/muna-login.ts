import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { sesEmailService } from "@/services/sesEmailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Credentials required" });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error || !data.user) return res.status(401).json({ error: "Invalid admin credentials" });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, full_name")
      .eq("id", data.user.id)
      .single();

    if (profileError || !(profile as any)?.is_admin) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    await sesEmailService.sendEmail({
      to: "admin@bluetika.co.nz",
      subject: "BlueTika Admin Login Alert",
      htmlBody: `<h2>Admin Login Detected</h2><p>User: ${(profile as any).full_name} (${email})</p>`
    });

    res.setHeader(
      "Set-Cookie",
      `muna-access-token=${data.session?.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/muna; Max-Age=3600`
    );

    res.status(200).json({ user: data.user, session: data.session, isAdmin: true });
  } catch (error: any) {
    res.status(500).json({ error: "Authentication failed." });
  }
}