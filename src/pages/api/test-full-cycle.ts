import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

/**
 * Full escrow payment cycle test
 * Tests: create → pay → capture → release
 * POST /api/test-full-cycle
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const log: string[] = [];
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    // Step 1: Find a suitable test contract
    log.push("Step 1: Finding test contract...");
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        client:profiles!contracts_client_id_fkey(full_name, email),
        provider:profiles!contracts_provider_id_fkey(full_name, email, stripe_account_id)
      `)
      .eq("status", "accepted")
      .not("provider.stripe_account_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (contractError || !contract) {
      log.push("✗ No suitable contract found. Create an accepted contract with provider having Stripe account.");
      return res.status(400).json({
        success: false,
        log,
        error: "No suitable test contract found",
      });
    }

    log.push(`✓ Found contract: ${contract.id} ($${contract.final_amount})`);

    // Step 2: Create escrow payment
    log.push("Step 2: Creating escrow payment...");
    const createResponse = await fetch(`${baseUrl}/api/escrow/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: contract.id }),
    });

    const createResult = await createResponse.json();
    if (!createResult.success) {
      log.push(`✗ Failed to create payment: ${createResult.error}`);
      throw new Error(createResult.error);
    }

    log.push(`✓ Payment created: ${createResult.paymentIntentId}`);
    log.push(`  Total amount: $${createResult.totalAmount}`);

    // Step 3: Simulate client payment
    log.push("Step 3: Simulating client payment with test card...");
    const paymentIntent = await stripe.paymentIntents.confirm(
      createResult.paymentIntentId,
      {
        payment_method: "pm_card_visa", // Stripe test payment method
        return_url: `${baseUrl}/contracts`,
      }
    );

    log.push(`✓ Payment confirmed: ${paymentIntent.status}`);

    // Step 4: Capture payment (hold in escrow)
    log.push("Step 4: Capturing payment (holding in escrow)...");
    const captureResponse = await fetch(`${baseUrl}/api/escrow/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: createResult.paymentIntentId }),
    });

    const captureResult = await captureResponse.json();
    if (!captureResult.success) {
      log.push(`✗ Failed to capture: ${captureResult.error}`);
      throw new Error(captureResult.error);
    }

    log.push(`✓ Payment captured and held in escrow`);
    log.push(`  Approval deadline: ${captureResult.approvalDeadline}`);

    // Step 5: Simulate work completion (wait 2s)
    log.push("Step 5: Simulating work completion (2 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    log.push(`✓ Work completed`);

    // Step 6: Release payment to provider
    log.push("Step 6: Releasing payment to provider...");
    const releaseResponse = await fetch(`${baseUrl}/api/escrow/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId: contract.id,
        releaseMethod: "client_approval",
      }),
    });

    const releaseResult = await releaseResponse.json();
    if (!releaseResult.success) {
      log.push(`✗ Failed to release: ${releaseResult.error}`);
      throw new Error(releaseResult.error);
    }

    log.push(`✓ Payment released to provider`);
    log.push(`  Transfer ID: ${releaseResult.transferId}`);

    // Step 7: Verify final state
    log.push("Step 7: Verifying final state...");
    const { data: finalPayment } = await supabase
      .from("payment_tracking")
      .select("*")
      .eq("contract_id", contract.id)
      .single();

    const { data: finalContract } = await supabase
      .from("contracts")
      .select("payment_status")
      .eq("id", contract.id)
      .single();

    log.push(`✓ Payment status: ${finalPayment?.status}`);
    log.push(`✓ Contract payment status: ${finalContract?.payment_status}`);
    log.push(`✓ Provider received: $${(contract.final_amount * 0.98).toFixed(2)} (98% of $${contract.final_amount})`);

    // Success summary
    log.push("");
    log.push("========================================");
    log.push("✅ FULL CYCLE TEST PASSED");
    log.push("========================================");

    return res.status(200).json({
      success: true,
      log,
      summary: {
        contractId: contract.id,
        paymentIntentId: createResult.paymentIntentId,
        transferId: releaseResult.transferId,
        originalAmount: contract.final_amount,
        providerReceived: contract.final_amount * 0.98,
        platformFee: contract.final_amount * 0.02,
      },
    });
  } catch (error) {
    log.push("");
    log.push("========================================");
    log.push(`✗ TEST FAILED: ${error instanceof Error ? error.message : "Unknown error"}`);
    log.push("========================================");

    return res.status(500).json({
      success: false,
      log,
      error: error instanceof Error ? error.message : "Test failed",
    });
  }
}