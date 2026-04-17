import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accountId } = req.query;

    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({ error: "Account ID required" });
    }

    const account = await stripe.accounts.retrieve(accountId);

    res.status(200).json({ account });
  } catch (error: any) {
    console.error("Account status error:", error);
    res.status(500).json({ error: error.message });
  }
}