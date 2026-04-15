<![CDATA[
import { supabase } from "@/integrations/supabase/client";
import { authService } from "./authService";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = typeof window !== "undefined" 
  ? `${window.location.origin}/api/google-calendar-callback`
  : "";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export type CalendarEvent = {
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
};

export const googleCalendarService = {
  // Generate OAuth2 authorization URL
  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  // Exchange authorization code for tokens
  async exchangeCode(code: string) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Token exchange error:", error);
      throw new Error("Failed to exchange authorization code");
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  },

  // Save tokens to user profile
  async saveTokens(userId: string, tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }) {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error } = await supabase
      .from("profiles")
      .update({
        google_calendar_access_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error saving tokens:", error);
      throw error;
    }

    return true;
  },

  // Get stored tokens for user
  async getStoredTokens(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expires_at")
      .eq("id", userId)
      .single();

    if (error || !data?.google_calendar_access_token) {
      return null;
    }

    return {
      access_token: data.google_calendar_access_token,
      refresh_token: data.google_calendar_refresh_token,
      expires_at: data.google_calendar_token_expires_at,
    };
  },

  // Refresh access token using refresh token
  async refreshAccessToken(userId: string, refreshToken: string) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Token refresh error:", error);
      throw new Error("Failed to refresh access token");
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await supabase
      .from("profiles")
      .update({
        google_calendar_access_token: data.access_token,
        google_calendar_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", userId);

    return data.access_token;
  },

  // Get valid access token (refresh if needed)
  async getValidAccessToken(userId: string): Promise<string | null> {
    const tokens = await this.getStoredTokens(userId);
    if (!tokens) return null;

    const expiresAt = new Date(tokens.expires_at || 0);
    const now = new Date();

    // If token expires in less than 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      if (!tokens.refresh_token) return null;
      return await this.refreshAccessToken(userId, tokens.refresh_token);
    }

    return tokens.access_token;
  },

  // Check if user has connected Google Calendar
  async isConnected(userId: string): Promise<boolean> {
    const tokens = await this.getStoredTokens(userId);
    return !!tokens?.access_token;
  },

  // Create a calendar event
  async createEvent(userId: string, event: CalendarEvent): Promise<string | null> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error("Google Calendar not connected. Please authorize first.");
    }

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start,
          timeZone: "Pacific/Auckland",
        },
        end: {
          dateTime: event.end,
          timeZone: "Pacific/Auckland",
        },
        reminders: event.reminders || {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 24 * 60 }, // 24 hours before
          ],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Calendar event creation error:", error);
      throw new Error("Failed to create calendar event");
    }

    const data = await response.json();
    return data.id;
  },

  // Delete a calendar event
  async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) return false;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok;
  },

  // Create contract calendar event
  async createContractEvent(
    userId: string,
    contractId: string,
    projectTitle: string,
    otherPartyName: string,
    date: string,
    location: string,
    isClient: boolean
  ): Promise<string | null> {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const contractUrl = `${baseUrl}/contracts`;

    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2); // Default 2-hour duration

    const event: CalendarEvent = {
      summary: `${projectTitle} - BlueTika`,
      description: `${isClient ? "Service Provider" : "Client"}: ${otherPartyName}\n\nView contract: ${contractUrl}`,
      location: location,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    const eventId = await this.createEvent(userId, event);

    if (eventId) {
      // Save event ID to contract
      await supabase
        .from("contracts")
        .update({ google_calendar_event_id: eventId })
        .eq("id", contractId);
    }

    return eventId;
  },

  // Create routine booking calendar events (batch)
  async createRoutineBookingEvents(
    userId: string,
    bookings: Array<{
      id: string;
      session_date: string;
      project: { title: string };
      day_of_week: string;
      provider?: { full_name: string | null };
      client?: { full_name: string | null };
    }>,
    location: string,
    isClient: boolean
  ): Promise<{ success: number; failed: number }> {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    let success = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        const otherPartyName = isClient
          ? (booking.provider?.full_name || "Service Provider")
          : (booking.client?.full_name || "Client");

        const startDate = new Date(booking.session_date + "T09:00:00");
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 2);

        const event: CalendarEvent = {
          summary: `${booking.project.title} - BlueTika`,
          description: `${isClient ? "Service Provider" : "Client"}: ${otherPartyName}\n\nView schedule: ${baseUrl}/contracts`,
          location: location,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        };

        const eventId = await this.createEvent(userId, event);

        if (eventId) {
          await supabase
            .from("routine_bookings")
            .update({ google_calendar_event_id: eventId })
            .eq("id", booking.id);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to create event for booking ${booking.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  },

  // Disconnect Google Calendar
  async disconnect(userId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        google_calendar_access_token: null,
        google_calendar_refresh_token: null,
        google_calendar_token_expires_at: null,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error disconnecting Google Calendar:", error);
      throw error;
    }

    return true;
  },
};
</file_contents>
