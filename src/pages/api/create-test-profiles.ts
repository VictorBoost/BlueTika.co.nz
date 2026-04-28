import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendRegistrationEmail } from "@/lib/email-sender";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clientEmail, providerEmail } = req.body;
  if (!clientEmail || !providerEmail) return res.status(400).json({ error: "Missing emails" });

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
    const { data: clientProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", clientEmail).maybeSingle();
    let clientUserId = clientProfile?.id;

    if (!clientUserId) {
      const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
        email: clientEmail,
        password: testPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: { full_name: "Test Client" }
      });
      
      if (error && !error.message.includes("already exists")) throw error;
      
      if (authData?.user) {
        clientUserId = authData.user.id;
        try { await sendRegistrationEmail(clientEmail, "Test Client", "client"); } catch(e){}
      } else {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        clientUserId = users.users.find((u: any) => u.email === clientEmail)?.id;
      }
    }

    if (clientUserId) {
      await supabaseAdmin.from("profiles").upsert({
        id: clientUserId,
        email: clientEmail,
        full_name: "Test Client",
        phone_number: "021 123 4567",
        city_region: "Auckland",
        is_client: true,
        is_provider: false,
        account_status: "active"
      });
    }

    // ==========================================
    // 2. SETUP PROVIDER (Bypass email confirmation)
    // ==========================================
    const { data: providerProfile } = await supabaseAdmin.from("profiles").select("id").eq("email", providerEmail).maybeSingle();
    let providerUserId = providerProfile?.id;

    if (!providerUserId) {
      const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
        email: providerEmail,
        password: testPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: { full_name: "Test Provider" }
      });
      
      if (error && !error.message.includes("already exists")) throw error;
      
      if (authData?.user) {
        providerUserId = authData.user.id;
        try { await sendRegistrationEmail(providerEmail, "Test Provider", "provider"); } catch(e){}
      } else {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        providerUserId = users.users.find((u: any) => u.email === providerEmail)?.id;
      }
    }

    if (providerUserId) {
      await supabaseAdmin.from("profiles").upsert({
        id: providerUserId,
        email: providerEmail,
        full_name: "Test Provider",
        phone_number: "027 987 6543",
        city_region: "Wellington",
        is_client: false,
        is_provider: true,
        verification_status: "approved",
        account_status: "active"
      });
    }

    return res.status(200).json({ success: true, message: "Profiles ready" });
  } catch (error: any) {
    console.error("❌ Profile creation error:", error);
    return res.status(500).json({ error: error.message || "Failed to create test profiles" });
  }
}