import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[PROJECT-LIFECYCLE] Starting automated project lifecycle management");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ============================================
    // STEP 1: Expire unassigned projects 7 days after deadline
    // ============================================
    console.log("[EXPIRATION] Checking for expired unassigned projects...");
    
    const { data: expiredProjects, error: expiredError } = await supabase
      .from("projects")
      .select("id, title, deadline")
      .eq("status", "open")
      .not("deadline", "is", null)
      .lt("deadline", sevenDaysAgo.toISOString());

    if (expiredError) {
      console.error("[EXPIRATION] Error fetching expired projects:", expiredError);
    } else if (expiredProjects && expiredProjects.length > 0) {
      console.log(`[EXPIRATION] Found ${expiredProjects.length} projects to expire`);
      
      for (const project of expiredProjects) {
        const { error: updateError } = await supabase
          .from("projects")
          .update({ 
            status: "expired",
            updated_at: now.toISOString()
          })
          .eq("id", project.id);

        if (updateError) {
          console.error(`[EXPIRATION] Failed to expire project ${project.id}:`, updateError);
        } else {
          console.log(`[EXPIRATION] Expired project: ${project.title} (${project.id})`);
        }
      }
    } else {
      console.log("[EXPIRATION] No expired projects found");
    }

    // ============================================
    // STEP 2: Auto-approve cancellation requests after 48 hours
    // ============================================
    console.log("[CANCELLATION] Checking for auto-approval eligible requests...");
    
    const { data: pendingRequests, error: pendingError } = await supabase
      .from("cancellation_requests")
      .select(`
        *,
        contract:contracts(
          id,
          status,
          project:projects(title, client_id),
          client_id,
          provider_id
        )
      `)
      .eq("status", "pending")
      .lt("auto_approval_deadline", now.toISOString());

    if (pendingError) {
      console.error("[CANCELLATION] Error fetching pending requests:", pendingError);
    } else if (pendingRequests && pendingRequests.length > 0) {
      console.log(`[CANCELLATION] Found ${pendingRequests.length} requests to auto-approve`);

      for (const request of pendingRequests) {
        // Auto-approve the request
        const { error: approvalError } = await supabase
          .from("cancellation_requests")
          .update({
            status: "auto_approved",
            responded_at: now.toISOString(),
            response_note: "Auto-approved after 48-hour response window expired"
          })
          .eq("id", request.id);

        if (approvalError) {
          console.error(`[CANCELLATION] Failed to auto-approve request ${request.id}:`, approvalError);
          continue;
        }

        // Cancel the contract
        const { error: contractError } = await supabase
          .from("contracts")
          .update({
            status: "cancelled",
            updated_at: now.toISOString()
          })
          .eq("id", request.contract_id);

        if (contractError) {
          console.error(`[CANCELLATION] Failed to cancel contract ${request.contract_id}:`, contractError);
        } else {
          console.log(`[CANCELLATION] Auto-approved and cancelled contract: ${request.contract_id}`);

          // Archive the project
          const { error: archiveError } = await supabase
            .from("projects")
            .update({
              status: "archived",
              updated_at: now.toISOString()
            })
            .eq("id", request.contract.project.id);

          if (archiveError) {
            console.error(`[CANCELLATION] Failed to archive project:`, archiveError);
          }
        }
      }
    } else {
      console.log("[CANCELLATION] No requests eligible for auto-approval");
    }

    // ============================================
    // STEP 3: Auto-cancel overdue inactive contracts
    // ============================================
    console.log("[OVERDUE] Checking for overdue inactive contracts...");
    
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: overdueContracts, error: overdueError } = await supabase
      .from("contracts")
      .select(`
        id,
        status,
        updated_at,
        project:projects(id, title, deadline)
      `)
      .in("status", ["active", "in_progress"])
      .lt("updated_at", thirtyDaysAgo.toISOString());

    if (overdueError) {
      console.error("[OVERDUE] Error fetching overdue contracts:", overdueError);
    } else if (overdueContracts && overdueContracts.length > 0) {
      console.log(`[OVERDUE] Found ${overdueContracts.length} overdue contracts`);

      for (const contract of overdueContracts) {
        // Check if project deadline has also passed
        if (contract.project.deadline && new Date(contract.project.deadline) < now) {
          const { error: cancelError } = await supabase
            .from("contracts")
            .update({
              status: "cancelled",
              updated_at: now.toISOString()
            })
            .eq("id", contract.id);

          if (cancelError) {
            console.error(`[OVERDUE] Failed to cancel contract ${contract.id}:`, cancelError);
          } else {
            console.log(`[OVERDUE] Auto-cancelled overdue contract: ${contract.id}`);

            // Archive the project
            const { error: archiveError } = await supabase
              .from("projects")
              .update({
                status: "archived",
                updated_at: now.toISOString()
              })
              .eq("id", contract.project.id);

            if (archiveError) {
              console.error(`[OVERDUE] Failed to archive project:`, archiveError);
            }
          }
        }
      }
    } else {
      console.log("[OVERDUE] No overdue contracts found");
    }

    console.log("[PROJECT-LIFECYCLE] Automated lifecycle management completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Project lifecycle management completed",
        expiredProjects: expiredProjects?.length || 0,
        autoApprovedRequests: pendingRequests?.length || 0,
        cancelledOverdue: overdueContracts?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PROJECT-LIFECYCLE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});