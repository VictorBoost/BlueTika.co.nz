import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendRegistrationEmail } from "@/lib/email-sender";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clientEmail, providerEmail } = req.body;
  if (!clientEmail || !providerEmail) return res.status(400).json({ error: "Missing emails" });

  console.log("🧪 Creating test profiles...");
  console.log("   Client:", clientEmail);
  console.log("   Provider:", providerEmail);

  // Use Service Role to bypass RLS and email confirmation
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const testPassword = "TestPassword123!";
    
    // ==========================================
    // 1. SETUP CLIENT (Bypass email confirmation)
    // ==========================================
    console.log("📧 Setting up client:", clientEmail);
    
    const { data: clientProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", clientEmail).maybeSingle();
    let clientUserId = clientProfile?.id;

    if (!clientUserId) {
      console.log("   Creating new auth user for client...");
      const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
        email: clientEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: "Test Client" }
      });
      
      if (error && !error.message.includes("already exists")) {
        console.error("   ❌ Auth creation failed:", error);
        throw error;
      }
      
      if (authData?.user) {
        clientUserId = authData.user.id;
        console.log("   ✅ Auth user created:", clientUserId);
        try { 
          await sendRegistrationEmail(clientEmail, "Test Client", "client"); 
          console.log("   ✅ Welcome email sent");
        } catch(e: any) {
          console.error("   ⚠️ Welcome email failed:", e.message);
        }
      } else {
        console.log("   User might already exist, fetching...");
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        clientUserId = users.users.find((u: any) => u.email === clientEmail)?.id;
        console.log("   Found existing user:", clientUserId);
      }
    } else {
      console.log("   ✅ Profile already exists:", clientUserId);
    }

    if (clientUserId) {
      console.log("   Updating profile...");
      const { error: updateError } = await supabaseAdmin.from("profiles").upsert({
        id: clientUserId,
        email: clientEmail,
        full_name: "Test Client",
        phone_number: "021 123 4567",
        city_region: "Auckland",
        is_client: true,
        is_provider: false,
        account_status: "active"
      });
      
      if (updateError) {
        console.error("   ❌ Profile update failed:", updateError);
        throw updateError;
      }
      console.log("   ✅ Client profile updated");
    }

    // ==========================================
    // 2. SETUP PROVIDER (Bypass email confirmation)
    // ==========================================
    console.log("📧 Setting up provider:", providerEmail);
    
    const { data: providerProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", providerEmail).maybeSingle();
    let providerUserId = providerProfile?.id;

    if (!providerUserId) {
      console.log("   Creating new auth user for provider...");
      const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
        email: providerEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: "Test Provider" }
      });
      
      if (error && !error.message.includes("already exists")) {
        console.error("   ❌ Auth creation failed:", error);
        throw error;
      }
      
      if (authData?.user) {
        providerUserId = authData.user.id;
        console.log("   ✅ Auth user created:", providerUserId);
        try { 
          await sendRegistrationEmail(providerEmail, "Test Provider", "provider"); 
          console.log("   ✅ Welcome email sent");
        } catch(e: any) {
          console.error("   ⚠️ Welcome email failed:", e.message);
        }
      } else {
        console.log("   User might already exist, fetching...");
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        providerUserId = users.users.find((u: any) => u.email === providerEmail)?.id;
        console.log("   Found existing user:", providerUserId);
      }
    } else {
      console.log("   ✅ Profile already exists:", providerUserId);
    }

    if (providerUserId) {
      console.log("   Updating profile...");
      const { error: updateError } = await supabaseAdmin.from("profiles").update({
        first_name: "Test",
        last_name: "Provider", 
        full_name: "Test Provider",
        phone_number: "027 987 6543",
        city_region: "Wellington",
        is_client: false,
        is_provider: true,
        verification_status: "verified",
        account_status: "active"
      }).eq("id", providerUserId);
      
      if (updateError) {
        console.error("   ❌ Profile update failed:", updateError);
        throw updateError;
      }
      console.log("   ✅ Provider profile updated");
    }

    console.log("✅ All profiles ready!");
    return res.status(200).json({ success: true, message: "Profiles ready" });
  } catch (error: any) {
    console.error("❌ Profile creation error:", error);
    return res.status(500).json({ error: error.message || "Failed to create test profiles" });
  }
}