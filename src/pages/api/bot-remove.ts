import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: number; failed: number; errors: string[] } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const { count, killAll } = req.body;

  try {
    let bots;

    if (killAll) {
      const { data } = await admin.from("bot_accounts").select("profile_id");
      bots = data;
    } else {
      const { data } = await admin
        .from("bot_accounts")
        .select("profile_id")
        .order("created_at", { ascending: true })
        .limit(count || 50);
      bots = data;
    }

    if (!bots || bots.length === 0) {
      return res.status(200).json({ success: 0, failed: 0, errors: ["No bots found"] });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const bot of bots) {
      try {
        const { error } = await admin.auth.admin.deleteUser(bot.profile_id);
        if (error) {
          results.failed++;
          results.errors.push(`Failed to delete ${bot.profile_id}: ${error.message}`);
        } else {
          results.success++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Exception deleting ${bot.profile_id}: ${error.message}`);
      }
    }

    return res.status(200).json(results);
  } catch (e: any) {
    console.error("bot-remove error:", e);
    return res.status(500).json({ error: e.message, success: 0, failed: 0, errors: [e.message] });
  }
}
