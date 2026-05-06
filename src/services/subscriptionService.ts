import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SubscriptionPlan = Tables<"subscription_plans">;
export type ProviderSubscription = Tables<"provider_subscriptions">;

export interface SubscribeData {
  planId: string;
  billingDate: number;
}

export const subscriptionService = {
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("monthly_price", { ascending: false });

    console.log("Get available plans:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async getProviderSubscriptions(providerId: string): Promise<ProviderSubscription[]> {
    const { data, error } = await supabase
      .from("provider_subscriptions")
      .select(`
        *,
        subscription_plans!inner(name, description, monthly_price, feature_key)
      `)
      .eq("provider_id", providerId)
      .eq("status", "active");

    console.log("Get provider subscriptions:", { data, error });
    if (error) throw error;
    return data || [];
  },

  async hasSubscription(providerId: string, featureKey: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("provider_subscriptions")
      .select("id")
      .eq("provider_id", providerId)
      .eq("status", "active")
      .eq("subscription_plans.feature_key", featureKey)
      .single();

    return !error && !!data;
  },

  async calculateProratedAmount(monthlyPrice: number, billingDate: number): Promise<number> {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Calculate days remaining until the 1st of next month
    // All subscriptions align to the 1st of the month
    let daysRemaining = 0;
    if (currentDay <= 1) {
      // Already at or before the 1st, next billing is next month 1st
      daysRemaining = daysInMonth - 1;
    } else {
      // Calculate days until next 1st
      daysRemaining = daysInMonth - currentDay + 1;
    }

    // Minimum 30 days proration
    const effectiveDays = Math.max(daysRemaining, 30);

    // Prorated amount = (days remaining / 30) * monthly price
    // This gives a minimum of 1 month charge, scaling up for longer periods
    const proratedAmount = (effectiveDays / 30) * monthlyPrice;
    return parseFloat(proratedAmount.toFixed(2));
  },

  async createSubscription(
    providerId: string,
    planId: string,
    stripeSubscriptionId: string,
    billingDate: number
  ): Promise<ProviderSubscription> {
    const { data, error } = await supabase
      .from("provider_subscriptions")
      .insert({
        provider_id: providerId,
        plan_id: planId,
        stripe_subscription_id: stripeSubscriptionId,
        status: "active",
        billing_date: billingDate
      })
      .select()
      .single();

    console.log("Create subscription:", { data, error });
    if (error) throw error;
    return data;
  },

  async suspendSubscription(subscriptionId: string, gracePeriodDays: number = 3): Promise<void> {
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);

    const { error } = await supabase
      .from("provider_subscriptions")
      .update({
        status: "suspended",
        grace_period_ends_at: gracePeriodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionId);

    console.log("Suspend subscription:", { error });
    if (error) throw error;
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from("provider_subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionId);

    console.log("Cancel subscription:", { error });
    if (error) throw error;
  },

  async reactivateSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from("provider_subscriptions")
      .update({
        status: "active",
        grace_period_ends_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionId);

    console.log("Reactivate subscription:", { error });
    if (error) throw error;
  },

  async getTotalMonthlyBilling(providerId: string): Promise<number> {
    const subscriptions = await this.getProviderSubscriptions(providerId);
    return subscriptions.reduce((total, sub: any) => {
      return total + parseFloat(sub.subscription_plans.monthly_price);
    }, 0);
  }
};