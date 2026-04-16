import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Invoice = Tables<"invoices">;

export interface CreateInvoiceData {
  contractId: string;
  companyName: string;
  companyLogoUrl?: string;
  invoiceNumber: string;
  issuedDate: string;
  customColors?: {
    primary: string;
    accent: string;
  };
}

export const invoiceService = {
  async getInvoices(providerId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        contracts!inner(
          id,
          project_title,
          amount,
          client_id,
          profiles!contracts_client_id_fkey(email, full_name)
        )
      `)
      .eq("provider_id", providerId)
      .order("issued_date", { ascending: false });

    console.log("Get invoices:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        contracts!inner(
          id,
          project_title,
          amount,
          client_id,
          profiles!contracts_client_id_fkey(email, full_name)
        )
      `)
      .eq("id", invoiceId)
      .single();

    console.log("Get invoice by ID:", { data, error });
    if (error) throw error;
    return data;
  },

  async createInvoice(providerId: string, invoiceData: CreateInvoiceData): Promise<Invoice> {
    // Verify contract is completed and belongs to this provider
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, status, provider_id")
      .eq("id", invoiceData.contractId)
      .eq("provider_id", providerId)
      .eq("status", "completed")
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found or not completed");
    }

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        provider_id: providerId,
        contract_id: invoiceData.contractId,
        company_name: invoiceData.companyName,
        company_logo_url: invoiceData.companyLogoUrl || null,
        invoice_number: invoiceData.invoiceNumber,
        issued_date: invoiceData.issuedDate,
        custom_colors: invoiceData.customColors || { primary: "#1B4FD8", accent: "#06B6D4" }
      })
      .select()
      .single();

    console.log("Create invoice:", { data, error });
    if (error) throw error;
    return data;
  },

  async markInvoiceAsSent(invoiceId: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .update({
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", invoiceId);

    console.log("Mark invoice as sent:", { error });
    if (error) throw error;
  },

  async getCompletedContracts(providerId: string) {
    const { data, error } = await supabase
      .from("contracts")
      .select(`
        id,
        project_title,
        amount,
        completed_at,
        profiles!contracts_client_id_fkey(full_name, email)
      `)
      .eq("provider_id", providerId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    console.log("Get completed contracts:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async generateNextInvoiceNumber(providerId: string): Promise<string> {
    const { data: lastInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastInvoice) {
      return "INV-001";
    }

    const lastNumber = parseInt(lastInvoice.invoice_number.split("-")[1] || "0");
    return `INV-${String(lastNumber + 1).padStart(3, "0")}`;
  }
};