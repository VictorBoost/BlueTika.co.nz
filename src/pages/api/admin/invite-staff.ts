import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; staffId?: string } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: "Missing required fields: name, email, role" });
  }

  const validRoles = ["support", "finance", "moderator", "verifier"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    // Verify the requester is the owner
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "") || req.cookies["sb-access-token"];

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!profile || profile.email?.toLowerCase() !== "bluetikanz@gmail.com") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Check if staff already exists
    const { data: existing } = await admin
      .from("staff")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Staff member with this email already exists" });
    }

    // Create Supabase auth user (sends invitation email)
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          role,
          is_staff: true,
        },
      }
    );

    if (authError) {
      if (authError.message?.includes("already registered")) {
        return res.status(409).json({ error: "This email is already registered. They may already be a staff member." });
      }
      return res.status(500).json({ error: authError.message });
    }

    // Create staff record
    const { data: staffData, error: staffError } = await admin
      .from("staff")
      .insert({
        user_id: authData.user.id,
        name,
        email,
        role,
        is_active: true,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (staffError) {
      return res.status(500).json({ error: staffError.message });
    }

    // Log the action
    await admin.from("staff_audit_logs").insert({
      staff_id: staffData.id,
      staff_name: name,
      action: "invite_staff",
      record_type: "staff",
      record_id: staffData.id,
      details: { name, email, role },
    });

    return res.status(200).json({ success: true, staffId: staffData.id });
  } catch (e: any) {
    console.error("invite-staff error:", e);
    return res.status(500).json({ error: e.message });
  }
}
