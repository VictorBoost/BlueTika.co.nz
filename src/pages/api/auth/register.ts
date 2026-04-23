import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sesEmailService } from "@/services/sesEmailService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("\n=== REGISTRATION ENDPOINT CALLED ===");
  console.log("Method:", req.method);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, firstName, lastName, phoneNumber, cityRegion, isClient, isProvider } = req.body;
  console.log("Registration attempt for:", email);
  console.log("Fields received:", { firstName, lastName, phoneNumber, cityRegion, isClient, isProvider });

  if (!email || !password || !firstName || !lastName || !phoneNumber || !cityRegion) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate environment variables
  console.log("Environment check:", {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    supabaseAnonKey: !!supabaseAnonKey
  });

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables");
    return res.status(500).json({ error: "Server configuration error. Please contact support." });
  }

  try {
    console.log("Creating Supabase admin client...");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user
    console.log("Creating auth user...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
      }
    });

    if (authError) {
      console.error("❌ Auth creation error:", authError);
      
      if (authError.message.includes("already registered")) {
        return res.status(400).json({ error: "This email is already registered" });
      }
      
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      console.error("❌ User creation failed: no user returned");
      return res.status(400).json({ error: "User creation failed" });
    }

    console.log("✅ Auth user created:", authData.user.id);

    // Create or update profile (trigger might have created it already)
    console.log("Creating/updating profile...");
    
    // First, try to get existing profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          city_region: cityRegion,
          is_client: isClient || false,
          is_provider: isProvider || false,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("⚠️ Profile update error:", profileError);
      } else {
        console.log("✅ Profile updated");
      }
    } else {
      // Create new profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: email,
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          city_region: cityRegion,
          is_client: isClient || false,
          is_provider: isProvider || false,
        });

      if (profileError) {
        console.error("❌ Profile creation error:", profileError);
        // Delete the auth user since profile creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: "Failed to create profile. Please try again." });
      } else {
        console.log("✅ Profile created");
      }
    }

    // Sign in to create session using regular client (not admin)
    console.log("Creating session...");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      console.error("❌ Session creation error:", signInError);
      // User was created successfully, just couldn't auto-login
      return res.status(200).json({ 
        success: true,
        message: "Registration successful! Please log in to continue.",
        requiresManualLogin: true
      });
    }

    console.log("✅ Session created");

    // Set session cookie
    res.setHeader(
      "Set-Cookie",
      `sb-access-token=${signInData.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
    );

    // Send welcome email asynchronously (non-blocking)
    console.log("Sending welcome email (async)...");
    sesEmailService.sendWelcomeEmail(email, `${firstName} ${lastName}`, "https://bluetika.co.nz").then(emailSent => {
      console.log(emailSent ? "✅ Welcome email sent" : "⚠️ Welcome email failed");
    }).catch(error => {
      console.error("⚠️ Welcome email failed (non-critical):", error);
    });

    console.log("✅ Registration complete!");
    console.log("=== REGISTRATION ENDPOINT COMPLETE ===\n");

    return res.status(200).json({
      user: signInData.user,
      session: signInData.session,
    });
  } catch (error: any) {
    console.error("❌ REGISTRATION ERROR:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return res.status(500).json({ 
      error: error?.message || "Connection error. Please try again." 
    });
  }
}