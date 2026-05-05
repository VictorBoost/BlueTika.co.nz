import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export interface BotAutomationPayload {
  isActive: boolean;
  actions: string[];
}

export interface BotAutomationStatsPayload {
  totalBots: number;
  clientBots: number;
  providerBots: number;
  totalProjects: number;
  totalBids: number;
  totalContracts: number;
  paidContracts: number;
  totalReviews: number;
  errorSummary: Record<string, number>;
  recentErrors: Array<Record<string, unknown>>;
}

export interface BotAutomationStatusResponse {
  automation: BotAutomationPayload;
  stats: BotAutomationStatsPayload;
}

const DEFAULT_ACTIONS: string[] = [
  "Generate bot accounts (clients & providers)",
  "Post projects from client bots",
  "Submit bids from provider bots",
  "Accept winning bids",
  "Process payments",
  "Complete contracts",
  "Submit reviews",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BotAutomationStatusResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Server misconfigured: Supabase credentials missing" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const [
      configResult,
      botsTotalResult,
      clientBotsResult,
      providerBotsResult,
      projectsResult,
      bidsResult,
      contractsTotalResult,
      paidContractsResult,
      reviewsResult,
      errorsResult,
      recentErrorsResult,
    ] = await Promise.all([
      admin.from("bot_configuration").select("automation_enabled").eq("id", "00000000-0000-0000-0000-000000000001").maybeSingle(),
      admin.from("bot_accounts").select("id", { count: "exact", head: true }),
      admin.from("bot_accounts").select("id", { count: "exact", head: true }).eq("bot_type", "client"),
      admin.from("bot_accounts").select("id", { count: "exact", head: true }).eq("bot_type", "provider"),
      admin.from("projects").select("id", { count: "exact", head: true }),
      admin.from("bids").select("id", { count: "exact", head: true }),
      admin.from("contracts").select("id", { count: "exact", head: true }),
      admin
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .in("payment_status", ["paid", "held", "released", "completed"]),
      admin.from("reviews").select("id", { count: "exact", head: true }),
      admin
        .from("bot_activity_logs")
        .select("action_type")
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("bot_activity_logs")
        .select("*")
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (configResult.error) {
      console.error("bot-automation-status bot_configuration:", configResult.error);
    }
    if (botsTotalResult.error) console.error("bot-automation-status bot_accounts:", botsTotalResult.error);
    if (clientBotsResult.error) console.error("bot-automation-status bot_accounts client:", clientBotsResult.error);
    if (providerBotsResult.error) console.error("bot-automation-status bot_accounts provider:", providerBotsResult.error);
    if (projectsResult.error) console.error("bot-automation-status projects:", projectsResult.error);
    if (bidsResult.error) console.error("bot-automation-status bids:", bidsResult.error);
    if (contractsTotalResult.error) console.error("bot-automation-status contracts:", contractsTotalResult.error);
    if (paidContractsResult.error) console.error("bot-automation-status paid contracts:", paidContractsResult.error);
    if (reviewsResult.error) console.error("bot-automation-status reviews:", reviewsResult.error);
    if (errorsResult.error) console.error("bot-automation-status bot_activity_logs:", errorsResult.error);
    if (recentErrorsResult.error)
      console.error("bot-automation-status bot_activity_logs recent:", recentErrorsResult.error);

    const errorSummary: Record<string, number> = {};
    for (const row of errorsResult.data ?? []) {
      const key = row.action_type || "unknown";
      errorSummary[key] = (errorSummary[key] || 0) + 1;
    }

    const payload: BotAutomationStatusResponse = {
      automation: {
        isActive: Boolean(configResult.data?.automation_enabled),
        actions: [...DEFAULT_ACTIONS],
      },
      stats: {
        totalBots: botsTotalResult.count ?? 0,
        clientBots: clientBotsResult.count ?? 0,
        providerBots: providerBotsResult.count ?? 0,
        totalProjects: projectsResult.count ?? 0,
        totalBids: bidsResult.count ?? 0,
        totalContracts: contractsTotalResult.count ?? 0,
        paidContracts: paidContractsResult.count ?? 0,
        totalReviews: reviewsResult.count ?? 0,
        errorSummary,
        recentErrors: (recentErrorsResult.data ?? []) as Array<Record<string, unknown>>,
      },
    };

    return res.status(200).json(payload);
  } catch (e) {
    console.error("bot-automation-status:", e);
    return res.status(500).json({ error: "Failed to load automation status" });
  }
}
