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
    return res.status(500).json({ error: "Server misconfigured: Supabase credentials missing" });
  }

  const { enable } = req.body;

  if (typeof enable !== "boolean") {
    return res.status(400).json({ error: "Missing or invalid 'enable' boolean" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { error } = await admin
      .from("bot_configuration")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        automation_enabled: enable,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("bot-automation-toggle error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("bot-automation-toggle:", e);
    return res.status(500).json({ error: "Failed to toggle automation" });
  }
}
