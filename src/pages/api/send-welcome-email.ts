import type { NextApiRequest, NextApiResponse } from "next";
import { sesEmailService } from "@/services/sesEmailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const success = await sesEmailService.sendWelcomeEmail(
      email,
      name,
      "https://bluetika.co.nz"
    );

    if (success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: "Failed to send email" });
    }
  } catch (error: any) {
    console.error("Welcome email API error:", error);
    return res.status(500).json({ error: error.message });
  }
}