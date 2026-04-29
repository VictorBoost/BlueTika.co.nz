import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OWNER_EMAIL = "bluetikanz@gmail.com";

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
      return res.status(401).json({ 
        isAdmin: false, 
        isOwner: false,
        error: "Not authenticated" 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return res.status(401).json({ 
        isAdmin: false, 
        isOwner: false,
        error: "Invalid session" 
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: "Profile not found", isAdmin: false });
    }

    // Check if user is owner (case-insensitive)
    const isAdmin = profile.email?.toLowerCase() === "bluetikanz@gmail.com";

    return res.status(200).json({ isAdmin });
  } catch (error) {
    console.error("Admin verification error:", error);
    return res.status(500).json({ 
      isAdmin: false, 
      isOwner: false,
      error: "Server error" 
    });
  }
}