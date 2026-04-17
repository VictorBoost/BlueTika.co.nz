import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { supabase } from "@/integrations/supabase/client";

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
    const { userId, email, returnUrl, refreshUrl } = req.body;

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "NZ",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save Stripe account ID to profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_account_id: account.id })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    res.status(200).json({ 
      accountId: account.id, 
      accountLinkUrl: accountLink.url 
    });
  } catch (error: any) {
    console.error("Stripe Connect error:", error);
    res.status(500).json({ error: error.message });
  }
}