import type { NextApiRequest, NextApiResponse } from "next";
import { sesEmailService } from "@/services/sesEmailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { adminEmail, ipAddress, timestamp } = req.body;

    if (!adminEmail || !ipAddress || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz";
    const ownerEmail = "bluetikanz@gmail.com";

    // Format timestamp
    const loginTime = new Date(timestamp).toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      dateStyle: "full",
      timeStyle: "long",
    });

    // Send email alert to owner
    const success = await sesEmailService.sendEmail({
      to: ownerEmail,
      subject: "🔐 BlueTika Control Centre Login Alert",
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1B4FD8 0%, #06B6D4 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🔐 Control Centre Login</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">A successful login to the BlueTika Control Centre was just recorded:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${adminEmail}</p>
              <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ipAddress}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${loginTime}</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">If this wasn't you, immediately use the emergency recovery endpoint at ${baseUrl}/muna/recovery</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p style="margin: 5px 0;">100% NZ Owned · Kiwis Helping Kiwis</p>
            <p style="margin: 5px 0;">bluetika.co.nz</p>
          </div>
        </body>
        </html>
      `,
    });

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to send email" });
    }
  } catch (error) {
    console.error("Error sending admin login alert:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}