import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import * as stripeEscrow from "@/lib/stripe-escrow";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: "Payment intent ID required" });
  }

  try {
    // Capture payment in Stripe
    const captureResult = await stripeEscrow.capturePayment(paymentIntentId);

    if (!captureResult.success) {
      return res.status(400).json({ error: captureResult.error });
    }

    const approvalDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Update payment_tracking
    const { data: payment, error: updateError } = await supabase
      .from("payment_tracking")
      .update({
        status: "captured",
        stripe_charge_id: captureResult.chargeId,
        captured_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntentId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update payment tracking:", updateError);
      return res.status(500).json({ error: "Failed to update payment record" });
    }

    // Update contract
    await supabase
      .from("contracts")
      .update({
        payment_status: "held",
        client_approval_deadline: approvalDeadline.toISOString(),
        auto_release_eligible_at: approvalDeadline.toISOString(),
      })
      .eq("id", payment.contract_id);

    return res.status(200).json({
      success: true,
      payment,
      approvalDeadline,
    });
  } catch (error) {
    console.error("Payment capture error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to capture payment",
    });
  }
}