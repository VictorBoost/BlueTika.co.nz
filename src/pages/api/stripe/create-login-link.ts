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

  try {
    const { stripeAccountId } = req.body;

    const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);

    res.status(200).json({ url: loginLink.url });
  } catch (error: any) {
    console.error("Login link error:", error);
    res.status(500).json({ error: error.message });
  }
}