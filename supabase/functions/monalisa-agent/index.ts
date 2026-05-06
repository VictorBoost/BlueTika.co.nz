import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ErrorFinding {
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: any;
  suggested_fix: string;
  status: "detected" | "investigating" | "fixing" | "resolved";
  detected_at: string;
  related_user_id?: string;
  related_contract_id?: string;
  related_project_id?: string;
}

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if MonaLisa is active
    const { data: settings } = await supabase
      .from("monalisa_settings")
      .select("is_active")
      .single();

    if (!settings?.is_active) {
      return new Response(JSON.stringify({ message: "MonaLisa is deactivated" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const findings: ErrorFinding[] = [];
    const now = new Date().toISOString();

    // ============================================
    // 1. PAYMENT BYPASS DETECTION
    // ============================================
    
    // Check for contracts with payment_status issues
    const { data: paymentIssues } = await supabase
      .from("contracts")
      .select("id, client_id, provider_id, final_amount, payment_status, stripe_payment_intent_id, created_at")
      .or("payment_status.eq.pending,payment_status.eq.confirmed")
      .not("stripe_payment_intent_id", "is", null)
      .lt("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    for (const contract of paymentIssues || []) {
      const { data: paymentRecord } = await supabase
        .from("payment_tracking")
        .select("status, amount_nzd")
        .eq("contract_id", contract.id)
        .maybeSingle();

      if (!paymentRecord) {
        findings.push({
          category: "payment_bypass",
          severity: "critical",
          title: "Missing Payment Record",
          description: `Contract ${contract.id} has Stripe PI but no payment_tracking record`,
          evidence: { contract_id: contract.id, stripe_pi: contract.stripe_payment_intent_id },
          suggested_fix: "Verify payment intent status and create missing payment_tracking record",
          status: "detected",
          detected_at: now,
          related_contract_id: contract.id,
        });
      }
    }

    // Check for duplicate payments
    const { data: duplicatePayments } = await supabase
      .from("payment_tracking")
      .select("contract_id, stripe_payment_intent_id, count:id")
      .group("contract_id", "stripe_payment_intent_id")
      .having("count", "gt", 1);

    for (const dup of duplicatePayments || []) {
      findings.push({
        category: "payment_bypass",
        severity: "critical",
        title: "Duplicate Payment Detected",
        description: `Multiple payments found for contract ${dup.contract_id}`,
        evidence: dup,
        suggested_fix: "Investigate and refund duplicate payment",
        status: "detected",
        detected_at: now,
        related_contract_id: dup.contract_id,
      });
    }

    // ============================================
    // 2. LOOPEHOLE DETECTION
    // ============================================

    // Check for contracts with unusually low amounts (potential fee avoidance)
    const { data: lowAmountContracts } = await supabase
      .from("contracts")
      .select("id, final_amount, platform_fee, payment_processing_fee")
      .lt("final_amount", 20)
      .eq("payment_status", "held");

    for (const contract of lowAmountContracts || []) {
      if (!contract.platform_fee || contract.platform_fee === 0) {
        findings.push({
          category: "fee_avoidance",
          severity: "high",
          title: "Zero Platform Fee Detected",
          description: `Contract ${contract.id} has ${contract.final_amount} NZD but no platform fee`,
          evidence: { contract_id: contract.id, amount: contract.final_amount },
          suggested_fix: "Verify platform fee calculation and update if needed",
          status: "detected",
          detected_at: now,
          related_contract_id: contract.id,
        });
      }
    }

    // Check for users with multiple accounts (potential bypass)
    const { data: duplicateEmails } = await supabase
      .from("profiles")
      .select("email")
      .group("email")
      .having("count", "gt", 1);

    for (const dup of duplicateEmails || []) {
      findings.push({
        category: "account_bypass",
        severity: "high",
        title: "Duplicate Email Accounts",
        description: `Email ${dup.email} used in multiple accounts`,
        evidence: { email: dup.email },
        suggested_fix: "Investigate and merge or suspend duplicate accounts",
        status: "detected",
        detected_at: now,
      });
    }

    // ============================================
    // 3. ERROR PATTERN DETECTION
    // ============================================

    // Check for failed Stripe payments
    const { data: failedPayments } = await supabase
      .from("payment_tracking")
      .select("contract_id, status, error_message, created_at")
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    for (const payment of failedPayments || []) {
      findings.push({
        category: "payment_error",
        severity: "medium",
        title: "Failed Payment",
        description: `Payment failed for contract ${payment.contract_id}: ${payment.error_message}`,
        evidence: { contract_id: payment.contract_id, error: payment.error_message },
        suggested_fix: "Review payment error and notify user",
        status: "detected",
        detected_at: now,
        related_contract_id: payment.contract_id,
      });
    }

    // Check for bot contracts with real user payments (potential fraud)
    const { data: suspiciousContracts } = await supabase
      .from("contracts")
      .select("id, client_id, provider_id, payment_status")
      .eq("payment_status", "held");

    for (const contract of suspiciousContracts || []) {
      const { data: clientBot } = await supabase
        .from("bot_accounts")
        .select("id")
        .eq("profile_id", contract.client_id)
        .maybeSingle();

      const { data: providerBot } = await supabase
        .from("bot_accounts")
        .select("id")
        .eq("profile_id", contract.provider_id)
        .maybeSingle();

      if ((clientBot && !providerBot) || (!clientBot && providerBot)) {
        findings.push({
          category: "mixed_bot_real",
          severity: "high",
          title: "Mixed Bot/Real User Contract",
          description: `Contract ${contract.id} involves both bot and real user`,
          evidence: { contract_id: contract.id, client_is_bot: !!clientBot, provider_is_bot: !!providerBot },
          suggested_fix: "Review contract legitimacy",
          status: "detected",
          detected_at: now,
          related_contract_id: contract.id,
        });
      }
    }

    // ============================================
    // 4. ANTICIPATING PROBLEMS
    // ============================================

    // Check for contracts approaching auto-release without approval
    const { data: approachingRelease } = await supabase
      .from("contracts")
      .select("id, created_at, work_done_at, after_photos_submitted_at")
      .eq("status", "active")
      .not("work_done_at", "is", null)
      .is("after_photos_submitted_at", null)
      .lt("work_done_at", new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString());

    for (const contract of approachingRelease || []) {
      findings.push({
        category: "anticipated_issue",
        severity: "medium",
        title: "Work Done Without Photo Submission",
        description: `Contract ${contract.id} work completed but no after photos submitted`,
        evidence: { contract_id: contract.id, work_done_at: contract.work_done_at },
        suggested_fix: "Follow up with provider for photo submission or auto-release will trigger",
        status: "detected",
        detected_at: now,
        related_contract_id: contract.id,
      });
    }

    // Check for users with high dispute rates
    const { data: highDisputeUsers } = await supabase
      .from("disputes")
      .select("user_id")
      .group("user_id")
      .having("count", "gt", 3);

    for (const user of highDisputeUsers || []) {
      findings.push({
        category: "high_risk_user",
        severity: "high",
        title: "High Dispute Rate User",
        description: `User ${user.user_id} has multiple disputes`,
        evidence: { user_id: user.user_id },
        suggested_fix: "Consider account review or temporary suspension",
        status: "detected",
        detected_at: now,
        related_user_id: user.user_id,
      });
    }

    // ============================================
    // 5. SAVE FINDINGS
    // ============================================

    for (const finding of findings) {
      await supabase.from("monalisa_error_findings").insert({
        category: finding.category,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        suggested_fix: finding.suggested_fix,
        status: finding.status,
        detected_at: finding.detected_at,
        related_user_id: finding.related_user_id,
        related_contract_id: finding.related_contract_id,
        related_project_id: finding.related_project_id,
      });

      await supabase.from("monalisa_logs").insert({
        action_type: finding.category,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        related_user_id: finding.related_user_id,
        related_contract_id: finding.related_contract_id,
        related_project_id: finding.related_project_id,
        metadata: { 
          evidence: finding.evidence,
          suggested_fix: finding.suggested_fix,
          status: finding.status
        },
      });
    }

    await supabase
      .from("monalisa_settings")
      .update({ last_check_at: now })
      .eq("id", "00000000-0000-0000-0000-000000000000");

    return new Response(
      JSON.stringify({
        success: true,
        message: "MonaLisa proactive error detection completed",
        summary: {
          total_findings: findings.length,
          by_category: findings.reduce((acc, f) => {
            acc[f.category] = (acc[f.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          by_severity: findings.reduce((acc, f) => {
            acc[f.severity] = (acc[f.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          findings: findings.slice(0, 10),
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("MonaLisa error:", error);
    
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("monalisa_error_findings").insert({
        category: "system_error",
        severity: "critical",
        title: "MonaLisa Agent Error",
        description: error.message,
        evidence: { stack: error.stack },
        suggested_fix: "Review and fix MonaLisa agent code",
        status: "detected",
        detected_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to log error:", e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});