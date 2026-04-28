import type { NextApiRequest, NextApiResponse } from "next";
import { sendBidNotification } from "@/lib/email-sender";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  console.log("🧪 Testing email send to:", email);
  console.log("📧 Environment check:");
  console.log("   AWS_REGION:", process.env.AWS_REGION);
  console.log("   AMAZON_SES_ACCESS_KEY:", process.env.AMAZON_SES_ACCESS_KEY ? "✓ Set" : "✗ Missing");
  console.log("   AMAZON_SES_SECRET_KEY:", process.env.AMAZON_SES_SECRET_KEY ? "✓ Set" : "✗ Missing");

  try {
    const result = await sendBidNotification(
      email,
      "Test Project - Plumbing Repair",
      "Test Provider",
      250
    );

    console.log("✅ Email sent successfully:", result);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully!",
      messageId: result.messageId,
      recipient: email,
    });
  } catch (error: any) {
    console.error("❌ Email send failed:", error);
    console.error("   Error name:", error.name);
    console.error("   Error message:", error.message);
    console.error("   Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: (error as any).code,
      details: error.toString(),
    });
  }
}