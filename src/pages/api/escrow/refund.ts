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

  const { contractId, reason } = req.body;

  if (!contractId || !reason) {
    return res.status(400).json({ error: "Contract ID and reason required" });
  }

  try {
    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_tracking")
      .select("*")
      .eq("contract_id", contractId)
      .eq("status", "captured")
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: "Payment not found or not captured" });
    }

    // Refund in Stripe
    const refundResult = await stripeEscrow.refundPayment(
      payment.stripe_payment_intent_id!,
      reason
    );

    if (!refundResult.success) {
      return res.status(400).json({ error: refundResult.error });
    }

    // Update payment_tracking
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payment_tracking")
      .update({
        status: "refunded",
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
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
        payment_status: "refunded",
        status: "cancelled",
      })
      .eq("id", contractId);

    return res.status(200).json({
      success: true,
      payment: updatedPayment,
      refundId: refundResult.refundId,
    });
  } catch (error) {
    console.error("Payment refund error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to refund payment",
    });
  }
}