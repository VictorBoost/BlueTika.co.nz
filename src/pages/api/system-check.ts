import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results: any = {
    supabase: { success: false, data: null, error: null },
    stripe: { success: false, data: null, error: null },
  };

  // 1. Check Supabase - Get one bot account
  try {
    const { data, error } = await supabase
      .from("bot_accounts")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      results.supabase.error = error.message;
    } else {
      results.supabase.success = true;
      results.supabase.data = data;
    }
  } catch (error: any) {
    results.supabase.error = error.message || String(error);
  }

  // 2. Check Stripe - Get account balance
  try {
    const balance = await stripe.balance.retrieve();
    results.stripe.success = true;
    results.stripe.data = balance;
  } catch (error: any) {
    results.stripe.error = error.message || String(error);
  }

  return res.status(200).json(results);
}