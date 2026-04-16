import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AccountingEntry = Tables<"accounting_entries">;

export interface CreateAccountingEntryData {
  entryType: "income" | "expense";
  amount: number;
  gstIncluded: boolean;
  description: string;
  entryDate: string;
  contractId?: string;
}

export interface AccountingSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  incomeWithGst: number;
  expensesWithGst: number;
}

export const accountingService = {
  async getEntries(providerId: string): Promise<AccountingEntry[]> {
    const { data, error } = await supabase
      .from("accounting_entries")
      .select("*")
      .eq("provider_id", providerId)
      .order("entry_date", { ascending: false });

    console.log("Get accounting entries:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async createEntry(providerId: string, entryData: CreateAccountingEntryData): Promise<AccountingEntry> {
    const { data, error } = await supabase
      .from("accounting_entries")
      .insert({
        provider_id: providerId,
        entry_type: entryData.entryType,
        amount: entryData.amount,
        gst_included: entryData.gstIncluded,
        description: entryData.description,
        entry_date: entryData.entryDate,
        contract_id: entryData.contractId || null
      })
      .select()
      .single();

    console.log("Create accounting entry:", { data, error });
    if (error) throw error;
    return data;
  },

  async updateEntry(entryId: string, entryData: Partial<CreateAccountingEntryData>): Promise<AccountingEntry> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (entryData.entryType) updateData.entry_type = entryData.entryType;
    if (entryData.amount !== undefined) updateData.amount = entryData.amount;
    if (entryData.gstIncluded !== undefined) updateData.gst_included = entryData.gstIncluded;
    if (entryData.description) updateData.description = entryData.description;
    if (entryData.entryDate) updateData.entry_date = entryData.entryDate;

    const { data, error } = await supabase
      .from("accounting_entries")
      .update(updateData)
      .eq("id", entryId)
      .select()
      .single();

    console.log("Update accounting entry:", { data, error });
    if (error) throw error;
    return data;
  },

  async deleteEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from("accounting_entries")
      .delete()
      .eq("id", entryId);

    console.log("Delete accounting entry:", { error });
    if (error) throw error;
  },

  async getSummary(providerId: string): Promise<AccountingSummary> {
    const entries = await this.getEntries(providerId);

    const summary = entries.reduce(
      (acc, entry) => {
        const amount = parseFloat(entry.amount as any);
        if (entry.entry_type === "income") {
          acc.totalIncome += amount;
          if (entry.gst_included) acc.incomeWithGst += amount;
        } else {
          acc.totalExpenses += amount;
          if (entry.gst_included) acc.expensesWithGst += amount;
        }
        return acc;
      },
      {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        incomeWithGst: 0,
        expensesWithGst: 0
      }
    );

    summary.netAmount = summary.totalIncome - summary.totalExpenses;
    return summary;
  },

  async getEntriesByDateRange(
    providerId: string,
    startDate: string,
    endDate: string
  ): Promise<AccountingEntry[]> {
    const { data, error } = await supabase
      .from("accounting_entries")
      .select("*")
      .eq("provider_id", providerId)
      .gte("entry_date", startDate)
      .lte("entry_date", endDate)
      .order("entry_date", { ascending: false });

    console.log("Get entries by date range:", { data, error });
    if (error) throw error;
    return data || [];
  }
};