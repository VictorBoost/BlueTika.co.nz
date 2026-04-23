import type { NextApiRequest, NextApiResponse } from "next";
import { sesEmailService } from "@/services/sesEmailService";
import { emailLogService } from "@/services/emailLogService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { to, subject, html, metadata } = req.body;
  if (!to || !subject || !html) return res.status(400).json({ error: "Missing required fields" });

  try {
    const emailSent = await sesEmailService.sendEmail({ to, subject, htmlBody: html });

    if (!emailSent) {
      await emailLogService.logEmail(to, "receipt", "failed", { ...metadata, error: "SES unavailable" });
      return res.status(500).json({ success: false, error: "Email service unavailable." });
    }

    await emailLogService.logEmail(to, "receipt", "sent", metadata || {});
    res.status(200).json({ success: true });
  } catch (error: any) {
    await emailLogService.logEmail(to, "receipt", "failed", { ...metadata, error: error.message });
    res.status(500).json({ success: false, error: "Failed to send receipt." });
  }
}