import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type RoutineContract = Tables<"routine_contracts">;

export const routineContractService = {
  // Create routine contract agreement
  async createRoutineContract(data: {
    contract_id: string;
    client_id: string;
    provider_id: string;
    project_id: string;
    frequency: "weekly" | "fortnightly" | "monthly" | "custom";
    custom_days?: number;
    start_date: string;
    selected_days?: string[];
  }) {
    const { data: routine, error } = await supabase
      .from("routine_contracts")
      .insert({
        original_contract_id: data.contract_id,
        client_id: data.client_id,
        provider_id: data.provider_id,
        project_id: data.project_id,
        frequency: data.frequency,
        custom_days: data.custom_days,
        start_date: data.start_date,
        selected_days: data.selected_days,
        status: "active",
        client_agreed: false,
        provider_agreed: false,
      } as any)
      .select()
      .single();

    console.log("createRoutineContract:", { routine, error });
    return { data: routine, error };
  },

  // Record party agreement
  async recordAgreement(routineId: string, role: "client" | "provider") {
    const updates = role === "client" 
      ? { client_agreed: true, client_agreed_at: new Date().toISOString() }
      : { provider_agreed: true, provider_agreed_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from("routine_contracts")
      .update(updates)
      .eq("id", routineId)
      .select()
      .single();

    console.log("recordAgreement:", { data, error });
    return { data, error };
  },

  // Check if both parties agreed and generate bookings
  async checkAndGenerateBookings(routineId: string) {
    const { data: routine, error } = await supabase
      .from("routine_contracts")
      .select("*")
      .eq("id", routineId)
      .single();

    if (error || !routine) return { data: null, error };

    // Both parties must agree
    if (!routine.client_agreed || !routine.provider_agreed) {
      return { data: null, error: null };
    }

    // Generate initial bookings (next 8 weeks)
    const bookings = await this.generateBookings(routine);
    
    return { data: bookings, error: null };
  },

  // Generate bookings based on routine contract
  async generateBookings(routine: RoutineContract) {
    const bookings: any[] = [];
    const startDate = new Date(routine.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (8 * 7)); // 8 weeks ahead

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Check if this date should have a booking
      if (this.shouldCreateBooking(routine, currentDate)) {
        bookings.push({
          routine_contract_id: routine.id,
          project_id: routine.project_id,
          provider_id: routine.provider_id,
          client_id: routine.client_id,
          session_date: currentDate.toISOString().split("T")[0],
          day_of_week: this.getDayName(currentDate.getDay()),
          status: "scheduled",
          reminder_sent: false,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (bookings.length === 0) return { data: [], error: null };

    const { data, error } = await supabase
      .from("routine_bookings")
      .insert(bookings)
      .select();

    console.log("generateBookings:", { count: bookings.length, data, error });
    return { data, error };
  },

  // Check if booking should be created for this date
  shouldCreateBooking(routine: RoutineContract, date: Date): boolean {
    const startDate = new Date(routine.start_date);
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (routine.frequency) {
      case "weekly":
        return daysDiff % 7 === 0 && this.isDaySelected(routine, date);
      case "fortnightly":
        return daysDiff % 14 === 0 && this.isDaySelected(routine, date);
      case "monthly":
        return date.getDate() === startDate.getDate();
      case "custom":
        return daysDiff % (routine.custom_days || 7) === 0;
      default:
        return false;
    }
  },

  // Check if day of week is selected (for Domestic Helper)
  isDaySelected(routine: RoutineContract, date: Date): boolean {
    if (!routine.selected_days || routine.selected_days.length === 0) {
      return true; // No day restriction
    }

    const dayName = this.getDayName(date.getDay());
    return routine.selected_days.includes(dayName);
  },

  // Get day name from day number
  getDayName(dayNumber: number): string {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[dayNumber];
  },

  // Get all active routine contracts
  async getActiveRoutines(userId: string, role: "client" | "provider") {
    const column = role === "client" ? "client_id" : "provider_id";

    const { data, error } = await supabase
      .from("routine_contracts")
      .select(`
        *,
        project:projects(id, title, category_id, subcategory_id),
        client:profiles!routine_contracts_client_id_fkey(id, full_name, email),
        provider:profiles!routine_contracts_provider_id_fkey(id, full_name, email)
      `)
      .eq(column, userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    console.log("getActiveRoutines:", { data, error });
    return { data, error };
  },

  // Pause routine contract
  async pauseRoutine(routineId: string) {
    const { data, error } = await supabase
      .from("routine_contracts")
      .update({ status: "paused" as any, paused_at: new Date().toISOString() as any })
      .eq("id", routineId)
      .select()
      .single();

    // Cancel all future bookings
    await supabase
      .from("routine_bookings")
      .update({ status: "cancelled" })
      .eq("routine_contract_id", routineId)
      .gte("session_date", new Date().toISOString().split("T")[0])
      .eq("status", "scheduled");

    console.log("pauseRoutine:", { data, error });
    return { data, error };
  },

  // Cancel routine contract permanently
  async cancelRoutine(routineId: string) {
    const { data, error } = await supabase
      .from("routine_contracts")
      .update({ 
        status: "cancelled" as any, 
        cancelled_at: new Date().toISOString() as any
      })
      .eq("id", routineId)
      .select()
      .single();

    // Cancel all future bookings
    await supabase
      .from("routine_bookings")
      .update({ status: "cancelled" })
      .eq("routine_contract_id", routineId)
      .gte("session_date", new Date().toISOString().split("T")[0])
      .eq("status", "scheduled");

    console.log("cancelRoutine:", { data, error });
    return { data, error };
  },

  // Get upcoming bookings for routine
  async getUpcomingBookings(routineId: string, limit = 10) {
    const { data, error } = await supabase
      .from("routine_bookings")
      .select("*")
      .eq("routine_contract_id", routineId)
      .gte("session_date", new Date().toISOString().split("T")[0])
      .eq("status", "scheduled")
      .order("session_date")
      .limit(limit);

    return { data, error };
  },

  // Admin: Get all active routine contracts with revenue
  async getAllActiveRoutines() {
    const { data, error } = await supabase
      .from("routine_contracts")
      .select(`
        *,
        project:projects(id, title, category_id, subcategory_id),
        client:profiles!routine_contracts_client_id_fkey(id, full_name, email),
        provider:profiles!routine_contracts_provider_id_fkey(id, full_name, email),
        contract:contracts(id, agreed_price)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    console.log("getAllActiveRoutines:", { data, error });
    return { data, error };
  },

  // Calculate total recurring revenue
  calculateRecurringRevenue(routines: any[]): number {
    let totalMonthlyRevenue = 0;

    for (const routine of routines) {
      const price = routine.contract?.agreed_price || 0;
      
      switch (routine.frequency) {
        case "weekly":
          totalMonthlyRevenue += price * 4; // ~4 weeks per month
          break;
        case "fortnightly":
          totalMonthlyRevenue += price * 2;
          break;
        case "monthly":
          totalMonthlyRevenue += price;
          break;
        case "custom":
          if (routine.custom_days) {
            const sessionsPerMonth = 30 / routine.custom_days;
            totalMonthlyRevenue += price * sessionsPerMonth;
          }
          break;
      }
    }

    return totalMonthlyRevenue;
  },
};