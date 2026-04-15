import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { email, name, currentTier, newTier, currentSales, requiredSales, daysLeft } = await req.json();

    if (!email || !name || !currentTier || !newTier) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const amountNeeded = Math.max(0, requiredSales - currentSales);

    // Call main app's SES service via internal endpoint
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-ses-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        to: email,
        subject: `BlueTika: Your ${currentTier} status needs attention`,
        html: generateHtmlBody(name, currentTier, newTier, currentSales, requiredSales, amountNeeded, daysLeft),
        text: generateTextBody(name, currentTier, newTier, currentSales, requiredSales, amountNeeded, daysLeft),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email via SES service");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tier warning email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

function generateHtmlBody(name: string, currentTier: string, newTier: string, currentSales: number, requiredSales: number, amountNeeded: number, daysLeft: number): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1B4FD8; margin: 0;">BlueTika</h1>
        <p style="color: #64748b; margin: 5px 0;">New Zealand's Trusted Marketplace</p>
      </div>

      <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h2 style="color: #92400E; margin: 0 0 10px 0;">⚠️ ${currentTier} Status Update Needed</h2>
        <p style="color: #78350F; margin: 0;">Kia ora ${name},</p>
      </div>

      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
        <p style="color: #334155; line-height: 1.6; margin: 0 0 15px 0;">
          Your <strong>${currentTier}</strong> commission tier status requires your attention.
        </p>

        <div style="background: #F8FAFC; border-left: 4px solid #1B4FD8; padding: 15px; margin: 20px 0;">
          <p style="color: #475569; margin: 0 0 10px 0; font-size: 14px;"><strong>Current Status:</strong></p>
          <p style="color: #64748b; margin: 0 0 5px 0; font-size: 14px;">60-day sales: <strong>$${currentSales.toFixed(2)} NZD</strong></p>
          <p style="color: #64748b; margin: 0 0 5px 0; font-size: 14px;">Required for ${currentTier}: <strong>$${requiredSales.toFixed(2)} NZD</strong></p>
          <p style="color: #EF4444; margin: 0; font-size: 14px;">Amount needed: <strong>$${amountNeeded.toFixed(2)} NZD</strong></p>
        </div>

        <p style="color: #334155; line-height: 1.6; margin: 15px 0;">
          Without additional sales in the next <strong>${daysLeft} days</strong>, your tier will update to <strong>${newTier}</strong>.
        </p>

        <p style="color: #334155; line-height: 1.6; margin: 15px 0;">
          <strong>Good news:</strong> Completing just one new project will keep your ${currentTier} status active!
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="https://bluetika.co.nz/projects" style="display: inline-block; background: #1B4FD8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Browse Projects
          </a>
        </div>
      </div>

      <div style="background: #F1F5F9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #334155; margin: 0 0 10px 0; font-size: 16px;">How to maintain your tier:</h3>
        <ul style="color: #64748b; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Submit competitive bids on active projects</li>
          <li>Complete ongoing contracts on time</li>
          <li>Maintain excellent service quality</li>
          <li>Build your BlueTika reputation</li>
        </ul>
      </div>

      <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; margin-top: 30px;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
          Questions? Contact us at <a href="mailto:support@bluetika.co.nz" style="color: #1B4FD8;">support@bluetika.co.nz</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz
        </p>
      </div>
    </div>
  `;
}

function generateTextBody(name: string, currentTier: string, newTier: string, currentSales: number, requiredSales: number, amountNeeded: number, daysLeft: number): string {
  return `
BlueTika - ${currentTier} Status Update Needed

Kia ora ${name},

Your ${currentTier} commission tier status requires your attention.

Current Status:
- 60-day sales: $${currentSales.toFixed(2)} NZD
- Required for ${currentTier}: $${requiredSales.toFixed(2)} NZD
- Amount needed: $${amountNeeded.toFixed(2)} NZD

Without additional sales in the next ${daysLeft} days, your tier will update to ${newTier}.

Good news: Completing just one new project will keep your ${currentTier} status active!

Browse projects at: https://bluetika.co.nz/projects

How to maintain your tier:
- Submit competitive bids on active projects
- Complete ongoing contracts on time
- Maintain excellent service quality
- Build your BlueTika reputation

Questions? Contact us at support@bluetika.co.nz

100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz
  `.trim();
}