import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = req.cookies["sb-access-token"];

    if (!accessToken) {
      return res.status(200).json({ user: null, session: null });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      res.setHeader(
        "Set-Cookie",
        "sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      );
      return res.status(200).json({ user: null, session: null });
    }

    return res.status(200).json({
      user,
      session: { access_token: accessToken },
    });
  } catch (error) {
    console.error("Session error:", error);
    return res.status(200).json({ user: null, session: null });
  }
}