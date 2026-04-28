import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * Bot payment simulation endpoint
 * Confirms a PaymentIntent using Stripe test payment method
 * POST /api/bot-payment
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: "Missing paymentIntentId",
      });
    }

    // Confirm payment using Stripe test payment method
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa", // Stripe's test Visa card
      return_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/contracts`,
    });

    return res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error) {
    console.error("Bot payment error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    });
  }
}