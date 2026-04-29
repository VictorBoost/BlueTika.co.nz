import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Call the bot-complete-contracts Edge Function
    const { data, error } = await supabase.functions.invoke("bot-complete-contracts", {
      body: { limit: 10 }
    });

    if (error) {
      console.error("Error invoking bot-complete-contracts:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bot completion cycle completed successfully",
      results: data,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error in test-bot-cycle:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}