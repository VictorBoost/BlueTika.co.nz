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

  const { amount, contractId, platformFee, paymentProcessingFee, captureMethod = "manual" } = req.body;

  if (!amount || !contractId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "nzd",
      capture_method: captureMethod, // "manual" holds funds, "automatic" charges immediately
      metadata: {
        contractId,
        platformFee: platformFee?.toString() || "0",
        paymentProcessingFee: paymentProcessingFee?.toString() || "0",
      },
      description: `BlueTika Contract #${contractId}`,
      statement_descriptor: "BlueTika",
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment intent",
    });
  }
}