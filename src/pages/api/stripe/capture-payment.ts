import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: "Payment intent ID is required" });
  }

  try {
    // Capture the held payment
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return res.status(200).json({
      success: true,
      paymentIntent,
    });
  } catch (error) {
    console.error("Payment capture error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to capture payment",
    });
  }
}