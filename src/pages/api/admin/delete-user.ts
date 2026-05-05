import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // Verify the requester is the owner
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "") || req.cookies["sb-access-token"];

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!profile || profile.email?.toLowerCase() !== "bluetikanz@gmail.com") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete the user from auth (cascades to profiles and related data)
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("delete-user error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error("delete-user:", e);
    return res.status(500).json({ error: e.message });
  }
}
