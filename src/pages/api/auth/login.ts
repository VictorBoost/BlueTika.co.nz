import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) return res.status(401).json({ error: error.message });
    if (!data.user) return res.status(401).json({ error: "Invalid credentials" });

    // Set secure httpOnly cookie
    res.setHeader(
      "Set-Cookie",
      `sb-access-token=${data.session?.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );

    res.status(200).json({ user: data.user, session: data.session });
  } catch (error: any) {
    res.status(500).json({ error: "Authentication failed." });
  }
}