import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SES_API_ENDPOINT = Deno.env.get("SES_ENDPOINT") || "";
const FROM_EMAIL = "noreply@bluetika.co.nz";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userName, userEmail, attemptCount, suspensionType } = await req.json();

    if (!userName || !userEmail || !attemptCount || !suspensionType) {
      return new Response("Missing required fields", { status: 400 });
    }

    const subject = suspensionType === "permanently_banned"
      ? "BlueTika Admin: User Permanently Banned"
      : "BlueTika Admin: User Auto-Suspended";

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #1B4FD8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .info-box { background: white; border: 1px solid #E5E7EB; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ ${suspensionType === "permanently_banned" ? "User Permanently Banned" : "User Auto-Suspended"}</h1>
          </div>
          <div class="content">
            <div class="warning-box">
              <strong>Bypass Attempt Escalation:</strong> User has triggered ${suspensionType === "permanently_banned" ? "permanent ban" : "automatic suspension"} after ${attemptCount} attempts to share contact details.
            </div>
            
            <div class="info-box">
              <p><strong>User Name:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Total Attempts:</strong> ${attemptCount}</p>
              <p><strong>Action Taken:</strong> ${suspensionType === "permanently_banned" ? "Permanently Banned" : "Auto-Suspended"}</p>
            </div>
            
            <p><strong>What happened:</strong></p>
            <p>The user repeatedly attempted to share personal contact information (phone numbers, emails, social media, URLs, or bank account details) in violation of platform policies.</p>
            
            <p><strong>Escalation Timeline:</strong></p>
            <ul>
              <li>1st attempt: Message blocked</li>
              <li>2nd attempt: Warning flag added</li>
              <li>3rd attempt: 24-hour chat suspension</li>
              <li>4th attempt: Auto-suspended (current if applicable)</li>
              <li>5th attempt: Permanently banned (current if applicable)</li>
            </ul>
            
            ${suspensionType === "permanently_banned" ? `
              <p><strong>Admin Actions Available:</strong></p>
              <ul>
                <li>Review bypass attempt logs</li>
                <li>Confirm permanent ban is appropriate</li>
                <li>Consider appeal if circumstances warrant</li>
              </ul>
            ` : `
              <p><strong>Admin Actions Available:</strong></p>
              <ul>
                <li>Review bypass attempt logs</li>
                <li>Manually lift suspension if warranted</li>
                <li>Monitor for future violations</li>
              </ul>
            `}
            
            <a href="https://bluetika.co.nz/admin/trust-and-safety" class="button">Review User Account</a>
            
            <p>This is an automated security alert from the BlueTika platform.</p>
          </div>
          <div class="footer">
            <p>BlueTika Admin System · bluetika.co.nz</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
BlueTika Admin Alert - ${suspensionType === "permanently_banned" ? "User Permanently Banned" : "User Auto-Suspended"}

User has triggered ${suspensionType === "permanently_banned" ? "permanent ban" : "automatic suspension"} after ${attemptCount} attempts to share contact details.

User Name: ${userName}
Email: ${userEmail}
Total Attempts: ${attemptCount}
Action Taken: ${suspensionType === "permanently_banned" ? "Permanently Banned" : "Auto-Suspended"}

What happened:
The user repeatedly attempted to share personal contact information (phone numbers, emails, social media, URLs, or bank account details) in violation of platform policies.

Escalation Timeline:
- 1st attempt: Message blocked
- 2nd attempt: Warning flag added
- 3rd attempt: 24-hour chat suspension
- 4th attempt: Auto-suspended (current if applicable)
- 5th attempt: Permanently banned (current if applicable)

Review user account at: https://bluetika.co.nz/admin/trust-and-safety

This is an automated security alert from the BlueTika platform.
    `.trim();

    if (!SES_API_ENDPOINT) {
      console.warn("SES_API_ENDPOINT not configured");
      return new Response(JSON.stringify({ success: false, error: "SES not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(SES_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: "admin@bluetika.co.nz",
        subject,
        htmlBody,
        textBody
      })
    });

    if (!response.ok) {
      console.error("SES email failed:", await response.text());
      return new Response(JSON.stringify({ success: false, error: "Email send failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});