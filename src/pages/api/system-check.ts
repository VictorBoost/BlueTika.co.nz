import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type SystemCheckResult = {
  supabase: {
    success: boolean;
    data?: any;
    error?: string;
  };
  stripe: {
    success: boolean;
    data?: any;
    error?: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SystemCheckResult>
) {
  const results: SystemCheckResult = {
    supabase: { success: false },
    stripe: { success: false },
  };

  // Test Supabase Connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      results.supabase.error = "Missing Supabase credentials in environment";
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from("bot_accounts")
        .select("id, profile_id, bot_type, is_active")
        .limit(1)
        .maybeSingle();

      if (error) {
        results.supabase.error = error.message;
      } else {
        results.supabase.success = true;
        results.supabase.data = data || "No bot accounts found (table is empty)";
      }
    }
  } catch (error: any) {
    results.supabase.error = error.message || String(error);
  }

  // Test Stripe Connection
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      results.stripe.error = "Missing STRIPE_SECRET_KEY in environment";
    } else {
      const stripe = new Stripe(stripeKey, {
        apiVersion: "2024-11-20.acacia",
      });

      const balance = await stripe.balance.retrieve();

      results.stripe.success = true;
      results.stripe.data = {
        available: balance.available,
        pending: balance.pending,
        currency: balance.available[0]?.currency || "N/A",
      };
    }
  } catch (error: any) {
    results.stripe.error = error.message || String(error);
  }

  return res.status(200).json(results);
}