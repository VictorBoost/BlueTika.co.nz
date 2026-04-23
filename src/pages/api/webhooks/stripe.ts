import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { supabase } from "@/integrations/supabase/client";
import { sesEmailService } from "@/services/sesEmailService";
import { emailLogService } from "@/services/emailLogService";
import { receiptService } from "@/services/receiptService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-02-24.acacia" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_MARKETPLACE || "";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!webhookSecret) return res.status(500).json({ error: "Webhook secret not configured" });

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "No signature" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const contractId = paymentIntent.metadata.contractId;
      const isAdditionalCharge = paymentIntent.metadata.additional_charge_id;

      if (isAdditionalCharge) {
        const { data: charge } = await supabase.from("additional_charges").update({ status: "paid" } as any).eq("id", isAdditionalCharge).select(`*, contract:contracts(project:projects(title, client:profiles!projects_client_id_fkey(email, full_name)), provider:profiles!contracts_provider_id_fkey(email, full_name))`).single();

        if (charge && (charge.contract as any)?.provider) {
          const providerEmailSent = await sesEmailService.sendEmail({ to: (charge.contract as any).provider.email, subject: "Charge Paid", htmlBody: "<p>Paid</p>" });
          await emailLogService.logEmail((charge.contract as any).provider.email, "charge_paid", providerEmailSent ? "sent" : "failed", { charge_id: isAdditionalCharge });
        }

        if (charge && (charge.contract as any)?.project?.client) {
          const clientEmailSent = await sesEmailService.sendEmail({ to: (charge.contract as any).project.client.email, subject: "Charge Confirmed", htmlBody: "<p>Confirmed</p>" });
          await emailLogService.logEmail((charge.contract as any).project.client.email, "charge_confirmed", clientEmailSent ? "sent" : "failed", { charge_id: isAdditionalCharge });
        }
      } else if (contractId) {
        const { data: contract } = await supabase.from("contracts").update({ payment_status: "paid" } as any).eq("id", contractId).select(`*, project:projects(title, client:profiles!projects_client_id_fkey(email, full_name)), provider:profiles!contracts_provider_id_fkey(email, full_name)`).single();

        if (contract && (contract as any).provider) {
          const providerEmailSent = await sesEmailService.sendEmail({ to: (contract as any).provider.email, subject: "Payment Received", htmlBody: "<p>Payment received</p>" });
          await emailLogService.logEmail((contract as any).provider.email, "payment_received", providerEmailSent ? "sent" : "failed", { contract_id: contractId });
        }

        if (contract && (contract as any).project?.client) {
          const clientEmailSent = await sesEmailService.sendEmail({ to: (contract as any).project.client.email, subject: "Payment Confirmed", htmlBody: "<p>Payment Confirmed</p>" });
          await emailLogService.logEmail((contract as any).project.client.email, "payment_confirmed", clientEmailSent ? "sent" : "failed", { contract_id: contractId });

          try {
            const receipt = await receiptService.generateReceipt(contractId);
            if (receipt) await receiptService.sendClientReceipt(receipt);
          } catch (e) {
            console.error("Receipt error", e);
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    res.status(500).json({ error: "Webhook processing failed." });
  }
}