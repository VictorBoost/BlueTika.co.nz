import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      
      if (error.message.includes("Invalid login credentials")) {
        return res.status(401).json({ error: "Incorrect email or password" });
      }
      
      if (error.message.includes("Email not confirmed")) {
        return res.status(401).json({ error: "Please verify your email address" });
      }
      
      return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(401).json({ error: "Failed to create session" });
    }

    res.setHeader(
      "Set-Cookie",
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    );

    return res.status(200).json({
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      error: error?.message || "Connection error. Please try again." 
    });
  }
}