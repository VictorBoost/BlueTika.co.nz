import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const baseUrl = `https://${req.headers.host}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/api/auth/google-callback`,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.redirect(302, data.url);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}