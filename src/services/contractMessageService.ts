import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ContractMessage = Tables<"contract_messages">;

export async function sendMessage(
  contractId: string,
  senderId: string,
  message: string
): Promise<{ data: ContractMessage | null; error: Error | null }> {
  try {
    if (!message.trim()) {
      return { data: null, error: new Error("Message cannot be empty") };
    }

    if (message.length > 500) {
      return { data: null, error: new Error("Message too long (max 500 characters)") };
    }

    const { data, error } = await supabase
      .from("contract_messages")
      .insert({
        contract_id: contractId,
        sender_id: senderId,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error sending message:", error);
    return { data: null, error: error as Error };
  }
}

export async function getMessages(
  contractId: string
): Promise<{ data: ContractMessage[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("contract_messages")
      .select(`
        *,
        sender:profiles!contract_messages_sender_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { data: [], error: error as Error };
  }
}

export async function markAsRead(
  messageId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from("contract_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: error as Error };
  }
}

export async function subscribeToMessages(
  contractId: string,
  callback: (message: ContractMessage) => void
) {
  const channel = supabase
    .channel(`contract-messages-${contractId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "contract_messages",
        filter: `contract_id=eq.${contractId}`,
      },
      (payload) => {
        callback(payload.new as ContractMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}