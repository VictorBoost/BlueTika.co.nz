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
    const { name, email, phone, subject, message, domain, screenshots = [] } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Build email body with rich formatting
    const screenshotHtml = screenshots.length > 0 
      ? `<div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
          <strong style="color: #1B4FD8;">Attached Screenshots:</strong><br/>
          ${screenshots.map((url: string, idx: number) => `
            <div style="margin: 10px 0;">
              <p style="margin: 5px 0; font-size: 12px; color: #666;">Screenshot ${idx + 1}:</p>
              <img src="${url}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
            </div>
          `).join('')}
        </div>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1B4FD8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; }
          .field:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #1B4FD8; margin-bottom: 5px; }
          .value { color: #333; }
          .domain-badge { 
            background: #FEF3C7; 
            color: #92400E; 
            padding: 4px 12px; 
            border-radius: 12px; 
            display: inline-block; 
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Contact Form Submission</h1>
            <div class="domain-badge">Submitted from: ${domain}</div>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name:</div>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <div class="label">Email Address:</div>
              <div class="value"><a href="mailto:${email}" style="color: #1B4FD8;">${email}</a></div>
            </div>
            <div class="field">
              <div class="label">Phone Number:</div>
              <div class="value">${phone}</div>
            </div>
            <div class="field">
              <div class="label">Subject:</div>
              <div class="value">${subject}</div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div class="value">${message.replace(/\n/g, '<br/>')}</div>
            </div>
            ${screenshotHtml}
          </div>
        </div>
      </body>
      </html>
    `;

    // Send notification to admin
    const adminEmail = "support@bluetika.co.nz";
    
    const adminHtmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B4FD8;">New Contact Form Submission</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Submission Details</h3>
          <p><strong>Domain Source:</strong> ${domain || 'Unknown'}</p>
          <p><strong>Sender Email:</strong> ${email}</p>
          <p><strong>Sender Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        </div>

        <div style="background: white; padding: 20px; border-left: 4px solid #1B4FD8; margin: 20px 0;">
          <h3 style="margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>

        <div style="margin-top: 30px; padding: 15px; background: #e8f4fd; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Reply directly to:</strong> ${email}<br>
            <strong>Form submitted from:</strong> ${domain}
          </p>
        </div>
      </div>
    `;

    await sesEmailService.sendEmail({
      to: adminEmail,
      subject: `Contact Form: ${subject || 'New Message'} from ${domain}`,
      htmlBody: adminHtmlBody,
    });

    // Send confirmation to user
    const userHtmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1B4FD8;">Thank You for Contacting BlueTika</h2>
        
        <p>Hi ${name},</p>
        
        <p>We've received your message and will get back to you within 24 hours.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Message</h3>
          <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>

        <p>If you need immediate assistance, please call us at <strong>0800 BLUETIKA</strong></p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
          <p>Best regards,<br>
          The BlueTika Team<br>
          support@bluetika.co.nz</p>
        </div>
      </div>
    `;

    await sesEmailService.sendEmail({
      to: email,
      subject: "BlueTika: We've received your message",
      htmlBody: userHtmlBody,
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return res.status(500).json({ error: error.message });
  }
}