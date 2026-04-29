import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    // Call bot-complete-contracts Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/bot-complete-contracts`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || "Edge Function failed",
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bot completion cycle triggered successfully",
      results: data,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Test bot cycle error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}