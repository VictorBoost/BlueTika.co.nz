import type { NextApiRequest, NextApiResponse } from "next";
import { googleCalendarService } from "@/services/googleCalendarService";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, state, error } = req.query;

  if (error) {
    console.error("OAuth error:", error);
    return res.redirect("/contracts?calendar_error=access_denied");
  }

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    // Exchange code for tokens
    const tokens = await googleCalendarService.exchangeCode(code);

    // Get current user from session using Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return res.redirect("/login?calendar_error=not_authenticated");
    }

    // Save tokens to user profile
    await googleCalendarService.saveTokens(session.user.id, tokens);

    // Redirect back to contracts page or specific contract if state was provided
    const redirectUrl = state ? `/checkout/${state}` : "/contracts";
    return res.redirect(`${redirectUrl}?calendar_connected=true`);
  } catch (err) {
    console.error("Calendar OAuth callback error:", err);
    return res.redirect("/contracts?calendar_error=token_exchange_failed");
  }
}