import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/**
 * Validation endpoint to check escrow system readiness
 * GET /api/escrow/validate
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const checks = {
    stripe_keys: false,
    supabase_connection: false,
    payment_tracking_table: false,
    contracts_table: false,
    profiles_table: false,
  };

  const errors: string[] = [];

  try {
    // 1. Check Stripe keys
    if (process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      checks.stripe_keys = true;
    } else {
      errors.push("Missing STRIPE_SECRET_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    }

    // 2. Check Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: connectionError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (!connectionError) {
      checks.supabase_connection = true;
      checks.profiles_table = true;
    } else {
      errors.push(`Supabase connection failed: ${connectionError.message}`);
    }

    // 3. Check payment_tracking table
    const { error: paymentError } = await supabase
      .from("payment_tracking")
      .select("id")
      .limit(1);

    if (!paymentError) {
      checks.payment_tracking_table = true;
    } else {
      errors.push(`payment_tracking table check failed: ${paymentError.message}`);
    }

    // 4. Check contracts table
    const { error: contractError } = await supabase
      .from("contracts")
      .select("id")
      .limit(1);

    if (!contractError) {
      checks.contracts_table = true;
    } else {
      errors.push(`contracts table check failed: ${contractError.message}`);
    }

    const allChecksPass = Object.values(checks).every((check) => check === true);

    return res.status(200).json({
      ready: allChecksPass,
      checks,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(500).json({
      ready: false,
      checks,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    });
  }
}