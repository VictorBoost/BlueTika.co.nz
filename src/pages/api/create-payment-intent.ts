import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, contractId, platformFee, paymentProcessingFee } = req.body;

    // CRITICAL: Create payment intent that holds funds in BlueTika's Stripe account
    // Funds are NOT transferred to provider's connected account yet
    // They will be transferred manually by admin after work completion + reviews
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Amount in cents
      currency: "nzd",
      metadata: {
        contractId,
        platformFee: platformFee.toString(),
        paymentProcessingFee: paymentProcessingFee.toString(),
      },
      description: `BlueTika Contract ${contractId} - Payment held in escrow`,
      // NO application_fee_amount or transfer_data here
      // Funds stay in BlueTika's account until admin manually releases them
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({ error: error.message });
  }
}