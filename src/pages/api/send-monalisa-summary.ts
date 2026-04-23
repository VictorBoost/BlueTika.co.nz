import type { NextApiRequest, NextApiResponse } from "next";
import { sesEmailService } from "@/services/sesEmailService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const summary = req.body;

    const success = await sesEmailService.sendMonalisaWeeklySummary(
      "bluetikanz@gmail.com",
      summary.weekStartDate,
      summary.weekEndDate,
      summary
    );

    if (!success) {
      throw new Error("Failed to send email");
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error sending MonaLisa summary:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}