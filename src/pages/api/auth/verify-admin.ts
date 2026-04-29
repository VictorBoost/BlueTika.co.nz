import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("🔍 [verify-admin] Starting verification check...");
  
  if (req.method !== "GET") {
    console.log("❌ [verify-admin] Wrong method:", req.method);
    return res.status(405).json({ error: "Method not allowed", isAdmin: false });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("🔍 [verify-admin] Checking session from cookies...");
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "") || req.cookies["sb-access-token"];
    
    console.log("🔍 [verify-admin] Token exists?", !!token);
    
    if (!token) {
      console.log("❌ [verify-admin] No token found in cookies or headers");
      return res.status(401).json({ error: "No session", isAdmin: false });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    console.log("🔍 [verify-admin] User lookup result:", {
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message
    });

    if (userError || !user) {
      console.log("❌ [verify-admin] User lookup failed:", userError?.message);
      return res.status(401).json({ error: "Invalid session", isAdmin: false });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    console.log("🔍 [verify-admin] Profile lookup result:", {
      profileEmail: profile?.email,
      error: profileError?.message
    });

    if (profileError || !profile) {
      console.log("❌ [verify-admin] Profile not found:", profileError?.message);
      return res.status(401).json({ error: "Profile not found", isAdmin: false });
    }

    const isAdmin = profile.email?.toLowerCase() === "bluetikanz@gmail.com";
    
    console.log("🔍 [verify-admin] Final admin check:", {
      email: profile.email,
      normalized: profile.email?.toLowerCase(),
      expected: "bluetikanz@gmail.com",
      isAdmin
    });

    if (isAdmin) {
      console.log("✅ [verify-admin] Admin access GRANTED");
    } else {
      console.log("❌ [verify-admin] Admin access DENIED - wrong email");
    }

    return res.status(200).json({ isAdmin });
  } catch (error: any) {
    console.error("💥 [verify-admin] Exception caught:", error.message);
    return res.status(500).json({ error: error.message, isAdmin: false });
  }
}