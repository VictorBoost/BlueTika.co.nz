import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type CancellationRequest = Database["public"]["Tables"]["cancellation_requests"]["Row"];
type CancellationRequestInsert = Database["public"]["Tables"]["cancellation_requests"]["Insert"];

/**
 * Create a new cancellation request for a contract
 * Auto-approval deadline is set to 48 hours from now
 */
export async function createCancellationRequest(
  contractId: string,
  requesterId: string,
  requesterRole: "client" | "provider",
  reason: string
): Promise<{ data: CancellationRequest | null; error: any }> {
  const autoApprovalDeadline = new Date();
  autoApprovalDeadline.setHours(autoApprovalDeadline.getHours() + 48);

  const { data, error } = await supabase
    .from("cancellation_requests")
    .insert({
      contract_id: contractId,
      requester_id: requesterId,
      requester_role: requesterRole,
      reason: reason,
      auto_approval_deadline: autoApprovalDeadline.toISOString(),
      status: "pending"
    })
    .select()
    .single();

  console.log("Create cancellation request:", { data, error });
  return { data, error };
}

/**
 * Get cancellation request for a contract
 */
export async function getCancellationRequest(
  contractId: string
): Promise<{ data: CancellationRequest | null; error: any }> {
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("*")
    .eq("contract_id", contractId)
    .eq("status", "pending")
    .maybeSingle();

  console.log("Get cancellation request:", { data, error });
  return { data, error };
}

/**
 * Respond to a cancellation request
 */
export async function respondToCancellationRequest(
  requestId: string,
  status: "approved" | "rejected",
  responseNote?: string
): Promise<{ data: CancellationRequest | null; error: any }> {
  const { data, error } = await supabase
    .from("cancellation_requests")
    .update({
      status: status,
      responded_at: new Date().toISOString(),
      response_note: responseNote
    })
    .eq("id", requestId)
    .select()
    .single();

  console.log("Respond to cancellation request:", { data, error });
  return { data, error };
}

/**
 * Get pending cancellation requests approaching deadline
 * Used by cron job to auto-approve requests after 48 hours
 */
export async function getPendingRequestsPastDeadline(): Promise<{
  data: CancellationRequest[] | null;
  error: any;
}> {
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select("*")
    .eq("status", "pending")
    .lt("auto_approval_deadline", new Date().toISOString());

  console.log("Get pending requests past deadline:", { data, error });
  return { data, error };
}

/**
 * Auto-approve a cancellation request
 */
export async function autoApproveCancellationRequest(
  requestId: string
): Promise<{ data: CancellationRequest | null; error: any }> {
  const { data, error } = await supabase
    .from("cancellation_requests")
    .update({
      status: "auto_approved",
      responded_at: new Date().toISOString(),
      response_note: "Auto-approved after 48-hour response window expired"
    })
    .eq("id", requestId)
    .select()
    .single();

  console.log("Auto-approve cancellation request:", { data, error });
  return { data, error };
}

/**
 * Get all cancellation requests for a user's contracts
 */
export async function getUserCancellationRequests(
  userId: string
): Promise<{ data: CancellationRequest[] | null; error: any }> {
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select(`
      *,
      contract:contracts(
        id,
        project:projects(title),
        client:profiles!contracts_client_id_fkey(full_name),
        provider:profiles!contracts_provider_id_fkey(full_name)
      )
    `)
    .or(`requester_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  console.log("Get user cancellation requests:", { data, error });
  return { data, error };
}