/**
 * Amazon SES Email Service
 * Sends transactional emails via Amazon SES
 */

const SES_API_ENDPOINT = process.env.NEXT_PUBLIC_SES_ENDPOINT || "";
const FROM_EMAIL = "noreply@bluetika.co.nz";

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Send email via Amazon SES
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!SES_API_ENDPOINT) {
    console.warn("SES_API_ENDPOINT not configured, skipping email send");
    return false;
  }

  try {
    const response = await fetch(SES_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        htmlBody: params.htmlBody,
        textBody: params.textBody || stripHtml(params.htmlBody)
      })
    });

    if (!response.ok) {
      console.error("SES email failed:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending SES email:", error);
    return false;
  }
}

/**
 * Send evidence photo reminder email
 */
export async function sendEvidencePhotoReminder(
  recipientEmail: string,
  recipientName: string,
  contractId: string,
  photoType: "before" | "after",
  projectTitle: string
): Promise<boolean> {
  const subject = `BlueTika: ${photoType === "before" ? "Before" : "After"} Photos Required`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1B4FD8; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #06B6D4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Evidence Photos Required</h1>
        </div>
        <div class="content">
          <p>Kia ora ${recipientName},</p>
          
          <p>This is a reminder to upload your <strong>${photoType} photos</strong> for the project:</p>
          
          <p><strong>${projectTitle}</strong></p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> Both parties must upload and confirm their ${photoType} photos. These photos are permanently locked once confirmed and serve as evidence for guarantee and dispute purposes.
          </div>
          
          <p>Please upload your photos as soon as possible:</p>
          
          <a href="https://bluetika.co.nz/contracts" class="button">Upload Photos Now</a>
          
          <p><strong>What you need to do:</strong></p>
          <ol>
            <li>Upload your ${photoType} photos</li>
            <li>Review and make any changes needed</li>
            <li>Click "Confirm" to lock them permanently</li>
          </ol>
          
          <p>Once both parties have confirmed their ${photoType} photos, ${photoType === "before" ? "work can proceed" : "the contract can be completed"}.</p>
          
          <p>Ngā mihi,<br>The BlueTika Team</p>
        </div>
        <div class="footer">
          <p>100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody
  });
}

/**
 * Send review reminder email
 */
export async function sendReviewReminder(
  recipientEmail: string,
  recipientName: string,
  contractId: string,
  projectTitle: string,
  otherPartyName: string,
  recipientRole: "client" | "provider"
): Promise<boolean> {
  const subject = "BlueTika: Share Your Experience 🌟";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1B4FD8; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #06B6D4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .highlight { background: #E0F2FE; border-left: 4px solid #06B6D4; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>We'd Love to Hear From You!</h1>
        </div>
        <div class="content">
          <p>Kia ora ${recipientName},</p>
          
          <p>We hope your recent project went well! Your feedback helps build trust in our BlueTika community.</p>
          
          <p><strong>Project:</strong> ${projectTitle}</p>
          
          <div class="highlight">
            <p><strong>✨ Your review matters!</strong></p>
            <p>By sharing your experience working with ${otherPartyName}, you're helping other Kiwis make informed decisions. It only takes a minute!</p>
          </div>
          
          <p>What we'd love to know:</p>
          <ul>
            <li>How would you rate your overall experience? (1-5 stars)</li>
            <li>What went well?</li>
            <li>Any other feedback to share?</li>
          </ul>
          
          <a href="https://bluetika.co.nz/contracts" class="button">Submit Your Review</a>
          
          <p><em>Once both reviews are submitted, we'll process the final payment release.</em></p>
          
          <p>Thanks for being part of the BlueTika community!</p>
          
          <p>Ngā mihi,<br>The BlueTika Team</p>
        </div>
        <div class="footer">
          <p>100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody
  });
}

/**
 * Send admin notification when both reviews are submitted and funds are ready for release
 */
export async function sendAdminFundReleaseNotification(
  contractId: string,
  projectTitle: string
): Promise<boolean> {
  const adminEmail = "admin@bluetika.co.nz";
  const subject = `BlueTika Admin: Funds Ready for Release - Contract ${contractId}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; background: #1B4FD8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .info-box { background: white; border: 1px solid #E5E7EB; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Reviews Completed</h1>
        </div>
        <div class="content">
          <p><strong>Action Required:</strong> Both parties have submitted their reviews. Contract is ready for fund release approval.</p>
          
          <div class="info-box">
            <p><strong>Contract ID:</strong> ${contractId}</p>
            <p><strong>Project:</strong> ${projectTitle}</p>
            <p><strong>Status:</strong> Awaiting Fund Release</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Review both submitted reviews</li>
            <li>Verify all contract requirements are met</li>
            <li>Approve and release funds to service provider</li>
          </ol>
          
          <a href="https://bluetika.co.nz/contracts" class="button">Review Contract</a>
          
          <p>This is an automated notification from the BlueTika platform.</p>
        </div>
        <div class="footer">
          <p>BlueTika Admin System · bluetika.co.nz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    htmlBody
  });
}

/**
 * Send fund release notification to client and provider
 */
export async function sendFundReleaseNotification(
  recipientEmail: string,
  recipientName: string,
  recipientRole: "client" | "provider",
  projectTitle: string,
  agreedPrice: number,
  commissionAmount: number,
  netToProvider: number
): Promise<boolean> {
  const subject = "BlueTika: Payment Released 🎉";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .amount-box { background: #E0F2FE; border: 2px solid #06B6D4; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .amount { font-size: 32px; font-weight: bold; color: #1B4FD8; }
        .breakdown { background: white; border: 1px solid #E5E7EB; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
        .breakdown-row:last-child { border-bottom: none; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Released!</h1>
        </div>
        <div class="content">
          <p>Kia ora ${recipientName},</p>
          
          <p>Great news! The payment for your project has been processed.</p>
          
          <p><strong>Project:</strong> ${projectTitle}</p>
          
          ${recipientRole === "provider" ? `
            <div class="amount-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Amount Released to You</p>
              <div class="amount">NZD $${netToProvider.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            
            <div class="breakdown">
              <h3 style="margin-top: 0;">Payment Breakdown</h3>
              <div class="breakdown-row">
                <span>Agreed Price</span>
                <span>NZD $${agreedPrice.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="breakdown-row">
                <span>BlueTika Commission</span>
                <span>- NZD $${commissionAmount.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div class="breakdown-row">
                <span>Net Amount to You</span>
                <span>NZD $${netToProvider.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <p>The funds will be transferred to your registered bank account within 2-3 business days.</p>
          ` : `
            <div class="amount-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Total Paid</p>
              <div class="amount">NZD $${agreedPrice.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            
            <p>Thank you for using BlueTika! The service provider will receive their payment within 2-3 business days.</p>
          `}
          
          <p>This project is now complete. We hope you had a great experience!</p>
          
          <p>Ngā mihi,<br>The BlueTika Team</p>
        </div>
        <div class="footer">
          <p>100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody
  });
}

/**
 * Send dispute notification to admin
 */
export async function sendAdminDisputeNotification(
  contractId: string,
  projectTitle: string,
  raisedBy: string,
  raiserRole: "client" | "provider"
): Promise<boolean> {
  const adminEmail = "admin@bluetika.co.nz";
  const subject = `BlueTika Admin: Dispute Raised - Contract ${contractId}`;

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
          <h1>⚠️ Dispute Raised</h1>
        </div>
        <div class="content">
          <div class="warning-box">
            <strong>Immediate Action Required:</strong> A dispute has been raised and requires admin review.
          </div>
          
          <div class="info-box">
            <p><strong>Contract ID:</strong> ${contractId}</p>
            <p><strong>Project:</strong> ${projectTitle}</p>
            <p><strong>Raised By:</strong> ${raisedBy} (${raiserRole})</p>
          </div>
          
          <p><strong>Admin Actions Needed:</strong></p>
          <ol>
            <li>Review before and after evidence photos</li>
            <li>Read written claims from both parties</li>
            <li>Make resolution decision:
              <ul>
                <li>Release full amount to service provider</li>
                <li>Refund full amount to client</li>
                <li>Partial split with custom amounts</li>
              </ul>
            </li>
            <li>Record decision with reason note</li>
          </ol>
          
          <a href="https://bluetika.co.nz/admin/disputes" class="button">Review Dispute</a>
          
          <p>This requires immediate attention to ensure fair resolution.</p>
        </div>
        <div class="footer">
          <p>BlueTika Admin System · bluetika.co.nz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    htmlBody
  });
}

/**
 * Send dispute resolution notification to client and provider
 */
export async function sendDisputeResolutionNotification(
  recipientEmail: string,
  recipientName: string,
  recipientRole: "client" | "provider",
  projectTitle: string,
  resolutionType: "release_to_provider" | "refund_to_client" | "partial_split",
  resolutionReason: string,
  amount?: number
): Promise<boolean> {
  const subject = "BlueTika: Dispute Resolved";

  const resolutionMessages = {
    release_to_provider: {
      client: "After careful review, the full payment has been released to the service provider.",
      provider: "After careful review, you will receive the full agreed payment.",
    },
    refund_to_client: {
      client: "After careful review, you will receive a full refund.",
      provider: "After careful review, the full payment has been refunded to the client.",
    },
    partial_split: {
      client: `After careful review, a partial settlement has been arranged. You will receive NZD $${amount?.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      provider: `After careful review, a partial settlement has been arranged. You will receive NZD $${amount?.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
    },
  };

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1B4FD8; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .resolution-box { background: #E0F2FE; border: 2px solid #06B6D4; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .reason-box { background: white; border: 1px solid #E5E7EB; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Dispute Resolved</h1>
        </div>
        <div class="content">
          <p>Kia ora ${recipientName},</p>
          
          <p>The dispute for your project has been reviewed and resolved by our admin team.</p>
          
          <p><strong>Project:</strong> ${projectTitle}</p>
          
          <div class="resolution-box">
            <h3 style="margin-top: 0;">Resolution</h3>
            <p>${resolutionMessages[resolutionType][recipientRole]}</p>
          </div>
          
          <div class="reason-box">
            <h4 style="margin-top: 0;">Admin Decision Notes</h4>
            <p>${resolutionReason}</p>
          </div>
          
          ${amount !== undefined && amount > 0 ? `
            <p>Your payment of NZD $${amount.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will be processed within 2-3 business days.</p>
          ` : ""}
          
          <p>If you have any questions about this resolution, please contact our support team.</p>
          
          <p>Ngā mihi,<br>The BlueTika Team</p>
        </div>
        <div class="footer">
          <p>100% NZ Owned · Kiwis Helping Kiwis · bluetika.co.nz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    htmlBody
  });
}

/**
 * Send tier drop warning email
 */
export async function sendTierWarningEmail(
  recipientEmail: string,
  recipientName: string,
  currentTier: string,
  newTier: string,
  currentSales: number,
  requiredSales: number,
  daysLeft: number
): Promise<void> {
  const amountNeeded = Math.max(0, requiredSales - currentSales);
  
  const subject = `BlueTika: Your ${currentTier} status needs attention`;
  
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1B4FD8; margin: 0;">BlueTika</h1>
        <p style="color: #64748b; margin: 5px 0;">New Zealand's Trusted Marketplace</p>
      </div>

      <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h2 style="color: #92400E; margin: 0 0 10px 0;">⚠️ ${currentTier} Status Update Needed</h2>
        <p style="color: #78350F; margin: 0;">Kia ora ${recipientName},</p>
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

  const textBody = `
BlueTika - ${currentTier} Status Update Needed

Kia ora ${recipientName},

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

  await sendEmail(recipientEmail, subject, htmlBody, textBody);
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}