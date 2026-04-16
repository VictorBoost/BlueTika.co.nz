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

    // Calculate days remaining in current period
    let daysRemaining = 0;
    if (currentDay <= billingDate) {
      daysRemaining = billingDate - currentDay;
    } else {
      const nextMonthDays = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
      daysRemaining = nextMonthDays - (currentDay - billingDate);
    }

    // Prorated amount = (days remaining / 30) * monthly price + monthly price
    const proratedAmount = (daysRemaining / 30) * monthlyPrice + monthlyPrice;
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