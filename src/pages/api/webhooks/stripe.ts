import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { supabase } from "@/integrations/supabase/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_MARKETPLACE || "";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET_MARKETPLACE not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ error: "No signature" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const contractId = paymentIntent.metadata.contractId;
        const isAdditionalCharge = paymentIntent.metadata.additional_charge_id;

        if (isAdditionalCharge) {
          // Handle additional charge payment - use raw update to avoid type conflicts
          const { error: chargeError } = await supabase
            .from("additional_charges")
            .update({ 
              status: "paid" as any,
              paid_at: new Date().toISOString() as any,
            })
            .eq("id", isAdditionalCharge);

          if (chargeError) {
            console.error("Error updating additional charge:", chargeError);
          } else {
            console.log(`Additional charge ${isAdditionalCharge} marked as paid`);
          }
        } else if (contractId) {
          // Handle main contract payment
          const { error: contractError } = await supabase
            .from("contracts")
            .update({ 
              payment_status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", contractId);

          if (contractError) {
            console.error("Error updating contract payment:", contractError);
          } else {
            console.log(`Contract ${contractId} payment marked as paid`);
          }
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        
        const isComplete = account.details_submitted && 
                          account.charges_enabled && 
                          account.payouts_enabled;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            stripe_account_status: (isComplete ? "active" : "pending") as any,
          })
          .eq("stripe_account_id", account.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
        } else {
          console.log(`Updated Stripe status for account ${account.id}`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${event.type}: ${subscription.id}`);
        // Add subscription handling logic here if needed
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${subscription.id}`);
        // Add subscription cancellation logic here if needed
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice payment failed: ${invoice.id}`);
        // Add failed payment handling logic here
        break;
      }

      case "account.application.deauthorized": {
        const application = event.data.object as any;
        const accountId = application.id || application.account;
        
        if (accountId) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              stripe_account_id: null as any,
              stripe_account_status: "not_connected" as any
            })
            .eq("stripe_account_id", accountId);

          if (updateError) {
            console.error("Error disconnecting account:", updateError);
          } else {
            console.log(`Disconnected account ${accountId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: error.message });
  }
}