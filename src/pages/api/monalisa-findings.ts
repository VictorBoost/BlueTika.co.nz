import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { 
    category, 
    severity, 
    status = "detected", 
    limit = 50,
    contract_id,
    user_id 
  } = req.query;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("monalisa_error_findings")
      .select(`
        *,
        related_user:profiles!monalisa_error_findings_related_user_id_fkey(full_name, email),
        related_contract:contracts!monalisa_error_findings_related_contract_id_fkey(final_amount, status)
      `)
      .order("detected_at", { ascending: false })
      .limit(Number(limit));

    if (category) {
      query = query.eq("category", category as string);
    }
    if (severity) {
      query = query.eq("severity", severity as string);
    }
    if (status) {
      query = query.eq("status", status as string);
    }
    if (contract_id) {
      query = query.eq("related_contract_id", contract_id as string);
    }
    if (user_id) {
      query = query.eq("related_user_id", user_id as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      findings: data,
    });
  } catch (error) {
    console.error("MonaLisa findings error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}