import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
  created_at?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

function getURL() {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000/";
  url = url.startsWith("http") ? url : `https://${url}`;
  url = url.endsWith("/") ? url : `${url}/`;
  return url;
}

export const authService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email || "",
        user_metadata: user.user_metadata,
        created_at: user.created_at
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  },

  async signUp(email: string, password: string, metadata: {
    first_name: string;
    last_name: string;
    phone_number: string;
    city_region: string;
    is_client: boolean;
    is_provider: boolean;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: undefined, // Disable email confirmation redirect
      },
    });

    return { user: data.user, session: data.session, error };
  },

  async signInWithPassword(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign in" } 
      };
    }
  },

  async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getURL()}api/auth/google-callback`
        }
      });
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (error) {
      return { error: { message: "An unexpected error occurred during Google sign in" } };
    }
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (error) {
      return { error: { message: "An unexpected error occurred during sign out" } };
    }
  },

  async resetPasswordForEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`
      });
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (error) {
      return { error: { message: "An unexpected error occurred" } };
    }
  },

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null };
    } catch (error) {
      return { error: { message: "An unexpected error occurred" } };
    }
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};