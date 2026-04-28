import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import * as stripeEscrow from "@/lib/stripe-escrow";
import { sendPaymentNotification } from "@/lib/email-sender";
import { emailLogService } from "@/services/emailLogService";

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

  const { contractId, releaseMethod } = req.body;

  if (!contractId || !releaseMethod) {
    return res.status(400).json({ error: "Contract ID and release method required" });
  }

  if (!["client_approval", "auto_release", "admin_release"].includes(releaseMethod)) {
    return res.status(400).json({ error: "Invalid release method" });
  }

  try {
    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payment_tracking")
      .select(`
        *,
        provider:profiles!payment_tracking_provider_id_fkey(stripe_account_id, email),
        client:profiles!payment_tracking_client_id_fkey(email)
      `)
      .eq("contract_id", contractId)
      .eq("status", "captured")
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: "Payment not found or not captured" });
    }

    const provider = payment.provider as any;
    const client = payment.client as any;

    if (!provider?.stripe_account_id) {
      return res.status(400).json({
        error: "Provider does not have a connected Stripe account",
      });
    }

    // Calculate amount to provider (original amount minus 2% platform fee)
    const amountToProvider = payment.amount_nzd * (1 - 0.02);

    // Release payment in Stripe
    const releaseResult = await stripeEscrow.releasePayment(
      payment.stripe_payment_intent_id!,
      provider.stripe_account_id,
      amountToProvider
    );

    if (!releaseResult.success) {
      return res.status(400).json({ error: releaseResult.error });
    }

    // Update payment_tracking
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payment_tracking")
      .update({
        status: "released",
        stripe_transfer_id: releaseResult.transferId,
        release_method: releaseMethod,
        released_at: new Date().toISOString(),
        approved_at: releaseMethod === "client_approval" ? new Date().toISOString() : null,
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
        payment_status: "released",
        payment_captured_at: new Date().toISOString(),
        escrow_released_method: releaseMethod,
      })
      .eq("id", contractId);

    // Send email notifications
    if (client?.email && provider?.email) {
      try {
        await sendPaymentNotification(client.email, provider.email, payment.amount_nzd);
        await emailLogService.logEmail(
          client.email,
          "payment_released_client",
          "sent",
          { contract_id: contractId }
        );
        await emailLogService.logEmail(
          provider.email,
          "payment_released_provider",
          "sent",
          { contract_id: contractId }
        );
      } catch (emailError: any) {
        console.error("Failed to send payment notification:", emailError);
        await emailLogService.logEmail(
          client.email,
          "payment_released_client",
          "failed",
          { contract_id: contractId, error: emailError.message }
        );
      }
    }

    return res.status(200).json({
      success: true,
      payment: updatedPayment,
      transferId: releaseResult.transferId,
    });
  } catch (error) {
    console.error("Payment release error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to release payment",
    });
  }
}