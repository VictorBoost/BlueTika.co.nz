import type { NextApiRequest, NextApiResponse } from "next";
import { sesEmailService } from "@/services/sesEmailService";

/**
 * API endpoint to test Amazon SES email delivery
 * POST /api/test-email
 * Body: { email: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  console.log("🧪 Testing Amazon SES email delivery to:", email);

  try {
    const success = await sesEmailService.sendEmail({
      to: email,
      subject: "BlueTika Test Email - Amazon SES",
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1B4FD8; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .success { background: #10B981; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>Amazon SES Test Email</h1></div>
            <div class="content">
              <div class="success">
                <h2>✅ Success!</h2>
                <p>If you're reading this, Amazon SES is working correctly!</p>
              </div>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Sent from: support@bluetika.co.nz</li>
                <li>Delivered to: ${email}</li>
                <li>Service: Amazon SES via API Gateway</li>
                <li>Timestamp: ${new Date().toISOString()}</li>
              </ul>
              <p>This confirms that:</p>
              <ol>
                <li>✓ SES endpoint is configured</li>
                <li>✓ API Gateway is accessible</li>
                <li>✓ Email delivery is working</li>
                <li>✓ support@bluetika.co.nz is verified</li>
              </ol>
            </div>
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (success) {
      return res.status(200).json({ 
        success: true, 
        message: "Test email sent successfully. Check your inbox!",
        email: email
      });
    } else {
      return res.status(500).json({ 
        success: false,
        error: "Email sending failed. Check server logs for details."
      });
    }
  } catch (error: any) {
    console.error("❌ Test email error:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}