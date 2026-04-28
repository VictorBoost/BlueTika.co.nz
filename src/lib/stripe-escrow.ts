import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export interface CreatePaymentIntentOptions {
  amount_nzd: number;
  client_id: string;
  provider_id: string;
  contract_id: string;
  platform_fee: number;
  payment_processing_fee: number;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CaptureResult {
  success: boolean;
  chargeId?: string;
  error?: string;
}

export interface ReleaseResult {
  success: boolean;
  transferId?: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Creates a Stripe PaymentIntent with manual capture (escrow)
 * Funds are authorized but not captured until explicitly released
 */
export async function createPaymentIntent(
  options: CreatePaymentIntentOptions
): Promise<PaymentIntentResult> {
  try {
    const totalAmountCents = Math.round(
      (options.amount_nzd + options.platform_fee + options.payment_processing_fee) * 100
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: "nzd",
      capture_method: "manual", // CRITICAL: Holds funds in escrow
      metadata: {
        client_id: options.client_id,
        provider_id: options.provider_id,
        contract_id: options.contract_id,
        amount_nzd: options.amount_nzd.toString(),
        platform_fee: options.platform_fee.toString(),
        payment_processing_fee: options.payment_processing_fee.toString(),
      },
      description: `BlueTika Contract #${options.contract_id}`,
      statement_descriptor: "BlueTika",
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Stripe createPaymentIntent error:", error);
    throw error;
  }
}

/**
 * Captures a held payment intent (moves funds from pending to captured)
 * This happens after client successfully pays via Stripe Elements
 */
export async function capturePayment(
  paymentIntentId: string
): Promise<CaptureResult> {
  try {
    // First verify the payment intent exists and is capturable
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "requires_capture") {
      return {
        success: false,
        error: `Payment intent cannot be captured. Status: ${intent.status}`,
      };
    }

    // Capture the payment (holds funds in Stripe balance)
    const capturedIntent = await stripe.paymentIntents.capture(paymentIntentId);

    return {
      success: true,
      chargeId: capturedIntent.charges.data[0]?.id,
    };
  } catch (error) {
    console.error("Stripe capturePayment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to capture payment",
    };
  }
}

/**
 * Releases escrowed funds to provider's Stripe Connected Account
 * Only call after client approval or auto-release conditions met
 */
export async function releasePayment(
  paymentIntentId: string,
  providerStripeAccountId: string,
  amountToProvider: number
): Promise<ReleaseResult> {
  try {
    // Verify payment intent is captured
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      return {
        success: false,
        error: `Payment must be captured first. Status: ${intent.status}`,
      };
    }

    if (!providerStripeAccountId) {
      return {
        success: false,
        error: "Provider does not have a Stripe Connected Account",
      };
    }

    // Transfer funds to provider (minus BlueTika 2% platform fee)
    const transferAmountCents = Math.round(amountToProvider * 100);

    const transfer = await stripe.transfers.create({
      amount: transferAmountCents,
      currency: "nzd",
      destination: providerStripeAccountId,
      source_transaction: intent.charges.data[0]?.id,
      metadata: {
        payment_intent_id: paymentIntentId,
        contract_id: intent.metadata.contract_id,
      },
      description: `Payment release for contract ${intent.metadata.contract_id}`,
    });

    return {
      success: true,
      transferId: transfer.id,
    };
  } catch (error) {
    console.error("Stripe releasePayment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to release payment",
    };
  }
}

/**
 * Refunds a captured payment back to the client
 * Used for disputes or cancellations
 */
export async function refundPayment(
  paymentIntentId: string,
  reason: string
): Promise<RefundResult> {
  try {
    // Verify payment intent is captured
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      return {
        success: false,
        error: `Payment must be captured before refunding. Status: ${intent.status}`,
      };
    }

    const chargeId = intent.charges.data[0]?.id;

    if (!chargeId) {
      return {
        success: false,
        error: "No charge found for this payment intent",
      };
    }

    // Create refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: "requested_by_customer",
      metadata: {
        contract_id: intent.metadata.contract_id,
        refund_reason: reason,
      },
    });

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error) {
    console.error("Stripe refundPayment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refund payment",
    };
  }
}

/**
 * Retrieves payment intent status from Stripe
 * Used for verification and status checks
 */
export async function getPaymentIntentStatus(paymentIntentId: string) {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
      metadata: intent.metadata,
    };
  } catch (error) {
    console.error("Stripe getPaymentIntentStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retrieve payment intent",
    };
  }
}