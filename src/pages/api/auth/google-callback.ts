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

  const { code } = req.query;

  if (!code || typeof code !== "string") {
    return res.redirect("/login?error=no_code");
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Code exchange error:", error);
      return res.redirect("/login?error=code_exchange_failed");
    }

    if (!data.session) {
      return res.redirect("/login?error=no_session");
    }

    res.setHeader(
      "Set-Cookie",
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    );

    return res.redirect("/");
  } catch (error) {
    console.error("Google callback error:", error);
    return res.redirect("/login?error=callback_failed");
  }
}