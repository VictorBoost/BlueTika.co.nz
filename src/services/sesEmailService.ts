/**
 * Amazon SES Email Service
 * Sends transactional emails via Amazon SES
 */

const SES_API_ENDPOINT = process.env.NEXT_PUBLIC_SES_ENDPOINT;
const FROM_EMAIL = "support@bluetika.co.nz";
const NOREPLY_EMAIL = "noreply@bluetika.co.nz";

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

// Basic HTML strip for text version fallback
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

const baseHtml = (title: string, content: string, baseUrl: string = "https://bluetika.co.nz") => `
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
    .highlight { background: #E0F2FE; border-left: 4px solid #06B6D4; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${title}</h1></div>
    <div class="content">${content}</div>
    <div class="footer"><p>100% NZ Owned · Kiwis Helping Kiwis · <a href="${baseUrl}">${baseUrl.replace('https://', '')}</a></p></div>
  </div>
</body>
</html>
`;

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!SES_API_ENDPOINT) {
    console.error("❌ CRITICAL: SES_API_ENDPOINT not configured!");
    console.error("   Current value:", SES_API_ENDPOINT);
    console.error("   Expected: A valid API Gateway URL");
    console.error("   Check .env.local for NEXT_PUBLIC_SES_ENDPOINT");
    return false;
  }
  
  console.log("📧 Attempting to send email via Amazon SES:");
  console.log("   To:", params.to);
  console.log("   Subject:", params.subject);
  console.log("   From:", FROM_EMAIL);
  console.log("   Endpoint:", SES_API_ENDPOINT);
  
  try {
    const payload = {
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      htmlBody: params.htmlBody,
      textBody: params.textBody || stripHtml(params.htmlBody)
    };
    
    console.log("   Payload size:", JSON.stringify(payload).length, "bytes");
    
    const response = await fetch(SES_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    console.log("   Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ SES API returned error:");
      console.error("   Status:", response.status);
      console.error("   Body:", errorText);
      return false;
    }
    
    const responseData = await response.text();
    console.log("✅ Email sent successfully!");
    console.log("   SES Response:", responseData);
    return true;
  } catch (error: any) {
    console.error("❌ Exception while sending SES email:");
    console.error("   Error type:", error.constructor.name);
    console.error("   Error message:", error.message);
    console.error("   Full error:", error);
    return false;
  }
}

export async function sendEvidencePhotoReminder(recipientEmail: string, recipientName: string, contractId: string, photoType: "before" | "after", projectTitle: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: `BlueTika: ${photoType === "before" ? "Before" : "After"} Photos Required`,
    htmlBody: baseHtml("Evidence Photos Required", `
      <p>Kia ora ${recipientName},</p>
      <p>This is a reminder to upload your <strong>${photoType} photos</strong> for the project: <strong>${projectTitle}</strong></p>
      <a href="${baseUrl}/contracts" class="button">Upload Photos Now</a>
    `, baseUrl)
  });
}

export async function sendReviewReminder(recipientEmail: string, recipientName: string, contractId: string, projectTitle: string, otherPartyName: string, recipientRole: "client" | "provider", baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Share Your Experience 🌟",
    htmlBody: baseHtml("We'd Love to Hear From You!", `
      <p>Kia ora ${recipientName},</p>
      <p>We hope your recent project went well! Your feedback helps build trust in our BlueTika community.</p>
      <a href="${baseUrl}/contracts" class="button">Submit Your Review</a>
    `, baseUrl)
  });
}

export async function sendAdminFundReleaseNotification(contractId: string, projectTitle: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: "support@bluetika.co.nz",
    subject: `BlueTika Admin: Funds Ready for Release - Contract ${contractId}`,
    htmlBody: baseHtml("✅ Reviews Completed", `<p>Contract ${contractId} is ready for fund release approval.</p>`, baseUrl)
  });
}

export async function sendFundReleaseNotification(recipientEmail: string, recipientName: string, recipientRole: "client" | "provider", projectTitle: string, agreedPrice: number, commissionAmount: number, netToProvider: number, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Payment Released 🎉",
    htmlBody: baseHtml("Payment Released!", `<p>Kia ora ${recipientName}, the payment for your project has been processed.</p>`, baseUrl)
  });
}

export async function sendAdminDisputeNotification(contractId: string, projectTitle: string, raisedBy: string, raiserRole: "client" | "provider", baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: "support@bluetika.co.nz",
    subject: `BlueTika Admin: Dispute Raised - Contract ${contractId}`,
    htmlBody: baseHtml("⚠️ Dispute Raised", `<p>A dispute has been raised by ${raisedBy} (${raiserRole}) for project ${projectTitle}.</p>`, baseUrl)
  });
}

export async function sendDisputeResolutionNotification(recipientEmail: string, recipientName: string, recipientRole: "client" | "provider", projectTitle: string, resolutionType: string, resolutionReason: string, amount?: number, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Dispute Resolved",
    htmlBody: baseHtml("Dispute Resolved", `<p>Kia ora ${recipientName}, the dispute for your project has been resolved.</p>`, baseUrl)
  });
}

export async function sendTierWarningEmail(recipientEmail: string, recipientName: string, currentTier: string, newTier: string, currentSales: number, requiredSales: number, daysLeft: number, baseUrl: string = "https://bluetika.co.nz"): Promise<void> {
  await sendEmail({
    to: recipientEmail,
    subject: `BlueTika: Your ${currentTier} status needs attention`,
    htmlBody: baseHtml("⚠️ Tier Status Update Needed", `<p>Kia ora ${recipientName}, your ${currentTier} commission tier status requires your attention.</p>`, baseUrl)
  });
}

export async function sendAdditionalChargeRequestEmail(recipientEmail: string, recipientName: string, providerName: string, projectTitle: string, amount: number, reason: string, chargeId: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Additional Charge Request",
    htmlBody: baseHtml("Additional Charge Request", `<p>Kia ora ${recipientName}, ${providerName} requested an additional NZD $${amount}.</p>`, baseUrl)
  });
}

export async function sendAdditionalChargeResponseEmail(recipientEmail: string, recipientName: string, clientName: string, projectTitle: string, amount: number, status: "approved" | "declined", baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: `BlueTika: Additional Charge ${status === "approved" ? "Approved ✅" : "Declined"}`,
    htmlBody: baseHtml(`Additional Charge ${status === "approved" ? "Approved" : "Declined"}`, `<p>Kia ora ${recipientName}, the charge of NZD $${amount} was ${status}.</p>`, baseUrl)
  });
}

export async function sendAdditionalChargePaymentEmail(recipientEmail: string, recipientName: string, recipientRole: "client" | "provider", projectTitle: string, chargeAmount: number, commissionAmount: number, netToProvider: number, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Additional Charge Payment Confirmed 💰",
    htmlBody: baseHtml("Payment Confirmed!", `<p>Kia ora ${recipientName}, the additional charge payment has been processed.</p>`, baseUrl)
  });
}

export async function sendRoutineContractInvitation(recipientEmail: string, recipientName: string, recipientRole: "client" | "provider", otherPartyName: string, projectTitle: string, routineId: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Set Up Routine Arrangement?",
    htmlBody: baseHtml("Routine Arrangement Available", `<p>Kia ora ${recipientName}, would you like to set up a routine arrangement with ${otherPartyName}?</p>`, baseUrl)
  });
}

export async function sendSessionReminderEmail(recipientEmail: string, recipientName: string, recipientRole: "client" | "provider", otherPartyName: string, projectTitle: string, sessionDate: string, location: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: `BlueTika: Session Reminder - ${projectTitle}`,
    htmlBody: baseHtml("⏰ Session in 48 Hours", `<p>Kia ora ${recipientName}, reminder that you have a scheduled session coming up.</p>`, baseUrl)
  });
}

export async function sendAdminSuspensionAlert(userName: string, userEmail: string, attemptCount: number, suspensionType: "auto_suspended" | "permanently_banned", baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: "support@bluetika.co.nz",
    subject: `BlueTika Admin: User ${suspensionType === "permanently_banned" ? "Permanently Banned" : "Auto-Suspended"}`,
    htmlBody: baseHtml("⚠️ Security Alert", `<p>User ${userName} (${userEmail}) has been ${suspensionType}.</p>`, baseUrl)
  });
}

export async function sendBidDeclinedEmail(recipientEmail: string, recipientName: string, projectTitle: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Bid Not Accepted",
    htmlBody: baseHtml("Bid Update", `
      <p>Kia ora ${recipientName},</p>
      <p>Thank you for submitting your bid for <strong>${projectTitle}</strong>.</p>
      <p>Unfortunately, the client has accepted another bid for this project.</p>
      <p>Don't be discouraged — there are plenty of other opportunities available. Keep bidding!</p>
      <a href="${baseUrl}/projects" class="button">Browse Open Projects</a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">Every successful service provider has received declined bids. Your next win is just around the corner!</p>
    `, baseUrl)
  });
}

export async function sendPasswordResetEmail(recipientEmail: string, recipientName: string, resetToken: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;
  return sendEmail({
    to: recipientEmail,
    subject: "BlueTika: Reset Your Password",
    htmlBody: baseHtml("Reset Your Password", `
      <p>Kia ora ${recipientName},</p>
      <p>We received a request to reset your password for your BlueTika account.</p>
      <p>Click the button below to set a new password:</p>
      <a href="${resetLink}" class="button">Reset Password</a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      <p style="margin-top: 10px; color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email. Your password will not be changed.</p>
      <div class="warning" style="margin-top: 20px;">
        <p style="margin: 0; font-size: 14px;"><strong>Security tip:</strong> Never share your password reset link with anyone.</p>
      </div>
    `, baseUrl)
  });
}

export async function sendWelcomeEmail(recipientEmail: string, recipientName: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "Welcome to BlueTika! 🎉",
    htmlBody: baseHtml("Welcome to BlueTika!", `
      <p>Kia ora ${recipientName},</p>
      <p>Welcome to <strong>BlueTika</strong> — New Zealand's trusted marketplace connecting Kiwis with local service providers.</p>
      <div class="highlight">
        <h3 style="margin-top: 0;">Getting Started</h3>
        <p style="margin-bottom: 0;">✓ Post projects and get bids from verified service providers<br>
        ✓ Browse our directory of skilled professionals<br>
        ✓ Enjoy secure payments with 8% promo commission (limited time!)</p>
      </div>
      <a href="${baseUrl}/projects" class="button">Browse Projects</a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">Need help? Our team is here to support you every step of the way.</p>
    `, baseUrl)
  });
}

export async function sendFirstProjectPosted(recipientEmail: string, recipientName: string, projectTitle: string, projectId: string, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "🎉 Your First Project is Live on BlueTika!",
    htmlBody: baseHtml("Your Project is Live!", `
      <p>Kia ora ${recipientName},</p>
      <p>Congratulations! Your project <strong>"${projectTitle}"</strong> is now live on BlueTika.</p>
      <div class="highlight">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <p style="margin-bottom: 0;">
          ✓ Verified service providers will review your project<br>
          ✓ You'll receive competitive bids within 24-48 hours<br>
          ✓ Review provider profiles, ratings, and past work<br>
          ✓ Accept the bid that best fits your needs
        </p>
      </div>
      <a href="${baseUrl}/project/${projectId}" class="button">View Your Project</a>
      <div class="warning" style="margin-top: 20px;">
        <p style="margin: 0; font-size: 14px;"><strong>Pro Tip:</strong> Respond quickly to bids and questions — providers are more likely to prioritize responsive clients!</p>
      </div>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">Your funds are held securely until the job is completed. Only released after both parties submit reviews.</p>
    `, baseUrl)
  });
}

export async function sendFirstBidSubmitted(recipientEmail: string, recipientName: string, projectTitle: string, projectId: string, bidAmount: number, baseUrl: string = "https://bluetika.co.nz"): Promise<boolean> {
  return sendEmail({
    to: recipientEmail,
    subject: "🎉 Your First Bid is Submitted on BlueTika!",
    htmlBody: baseHtml("Your Bid is Live!", `
      <p>Kia ora ${recipientName},</p>
      <p>Congratulations! You've submitted your first bid on BlueTika for the project <strong>"${projectTitle}"</strong> at <strong>NZD $${bidAmount.toFixed(2)}</strong>.</p>
      <div class="highlight">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <p style="margin-bottom: 0;">
          ✓ The client will review your bid and profile<br>
          ✓ They may ask questions — respond quickly to stand out!<br>
          ✓ If accepted, you'll be notified immediately<br>
          ✓ Complete the work and get paid securely
        </p>
      </div>
      <a href="${baseUrl}/project/${projectId}" class="button">View Project</a>
      <div class="warning" style="margin-top: 20px;">
        <p style="margin: 0; font-size: 14px;"><strong>Pro Tip:</strong> Keep your profile updated with recent work, photos, and reviews to build trust with clients!</p>
      </div>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">Payment is held securely until job completion. Commission is tier-based (currently 8% promo rate).</p>
    `, baseUrl)
  });
}

export async function sendDocumentAutoApproved(toEmail: string, providerName: string, documentType: string, confidenceScore: number, baseUrl: string = "https://bluetika.co.nz") {
  return sendEmail({
    to: toEmail,
    subject: `✓ ${documentType} Auto-Verified - BlueTika`,
    htmlBody: baseHtml("✓ Document Auto-Verified!", `
      <p>Kia ora ${providerName},</p>
      <p>Great news! Your <strong>${documentType}</strong> has been automatically verified by our AI system (Score: ${confidenceScore}%).</p>
    `, baseUrl)
  });
}

export async function sendDocumentManuallyApproved(toEmail: string, providerName: string, documentType: string, baseUrl: string = "https://bluetika.co.nz") {
  return sendEmail({
    to: toEmail,
    subject: `✓ ${documentType} Verified - BlueTika`,
    htmlBody: baseHtml("✓ Document Verified!", `
      <p>Kia ora ${providerName},</p>
      <p>Your <strong>${documentType}</strong> has been reviewed and approved by our verification team.</p>
    `, baseUrl)
  });
}

export async function sendDocumentRejected(toEmail: string, providerName: string, documentType: string, rejectionReason: string, baseUrl: string = "https://bluetika.co.nz") {
  return sendEmail({
    to: toEmail,
    subject: `Action Required: ${documentType} Not Verified - BlueTika`,
    htmlBody: baseHtml("Action Required", `
      <p>Kia ora ${providerName},</p>
      <p>We've reviewed your <strong>${documentType}</strong>, but it was rejected.</p>
      <p>Reason: ${rejectionReason}</p>
    `, baseUrl)
  });
}

export async function sendMonalisaWeeklySummary(
  recipientEmail: string,
  weekStartDate: string,
  weekEndDate: string,
  summary: {
    botStats: {
      totalBots: number;
      newBotsThisWeek: number;
      activeBots: number;
      projectsPosted: number;
      bidsSubmitted: number;
      contractsCreated: number;
      paymentsProcessed: number;
    };
    issues: {
      critical: number;
      warnings: number;
      topIssues: Array<{ type: string; count: number; description: string }>;
    };
    suggestions: Array<{ priority: string; suggestion: string }>;
    systemHealth: {
      overallScore: number;
      uptime: string;
      errorRate: number;
    };
  },
  baseUrl: string = "https://bluetika.co.nz"
): Promise<boolean> {
  const healthColor = summary.systemHealth.overallScore >= 80 ? '#10B981' : 
                      summary.systemHealth.overallScore >= 60 ? '#F59E0B' : '#EF4444';

  const issuesHtml = summary.issues.topIssues.length > 0 ? `
    <h3 style="color: #1B4FD8; margin-top: 30px;">⚠️ Top Issues This Week</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
      <thead>
        <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 12px; text-align: left;">Issue Type</th>
          <th style="padding: 12px; text-align: left;">Occurrences</th>
          <th style="padding: 12px; text-align: left;">Description</th>
        </tr>
      </thead>
      <tbody>
        ${summary.issues.topIssues.map(issue => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px;">${issue.type}</td>
            <td style="padding: 12px; font-weight: bold; color: ${issue.count > 10 ? '#EF4444' : '#F59E0B'};">${issue.count}</td>
            <td style="padding: 12px; font-size: 14px; color: #666;">${issue.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #10B981; margin-top: 20px;">✅ No significant issues detected this week!</p>';

  const suggestionsHtml = summary.suggestions.length > 0 ? `
    <h3 style="color: #1B4FD8; margin-top: 30px;">💡 MonaLisa Suggestions</h3>
    <div style="margin-top: 15px;">
      ${summary.suggestions.map((item, idx) => `
        <div style="background: ${item.priority === 'high' ? '#FEF3C7' : '#E0F2FE'}; 
                    border-left: 4px solid ${item.priority === 'high' ? '#F59E0B' : '#06B6D4'}; 
                    padding: 15px; margin-bottom: 15px; border-radius: 4px;">
          <strong style="color: ${item.priority === 'high' ? '#F59E0B' : '#06B6D4'};">
            ${item.priority === 'high' ? '🔥 High Priority' : '💡 Suggestion'} #${idx + 1}:
          </strong>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;">${item.suggestion}</p>
        </div>
      `).join('')}
    </div>
  ` : '<p style="color: #666; margin-top: 20px;">No suggestions this week - system running smoothly!</p>';

  return sendEmail({
    to: recipientEmail,
    subject: `MonaLisa Weekly Summary: ${weekStartDate} - ${weekEndDate}`,
    htmlBody: baseHtml("MonaLisa Weekly Summary", `
      <div style="background: linear-gradient(135deg, #1B4FD8 0%, #06B6D4 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="margin: 0; font-size: 28px;">🤖 MonaLisa Weekly Report</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">${weekStartDate} → ${weekEndDate}</p>
      </div>

      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1B4FD8; margin-top: 0;">📊 System Health Score</h3>
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="font-size: 48px; font-weight: bold; color: ${healthColor};">
            ${summary.systemHealth.overallScore}%
          </div>
          <div style="flex: 1;">
            <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
              <div style="background: ${healthColor}; height: 100%; width: ${summary.systemHealth.overallScore}%; 
                          transition: width 0.5s ease;"></div>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">
              Uptime: ${summary.systemHealth.uptime} | Error Rate: ${summary.systemHealth.errorRate.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      <h3 style="color: #1B4FD8; margin-top: 30px;">🤖 Bot Activity This Week</h3>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
        <div style="background: #E0F2FE; padding: 20px; border-radius: 8px; border-left: 4px solid #06B6D4;">
          <div style="font-size: 32px; font-weight: bold; color: #06B6D4;">${summary.botStats.totalBots}</div>
          <div style="font-size: 14px; color: #0369a1; margin-top: 5px;">Total Bots Active</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            +${summary.botStats.newBotsThisWeek} new this week
          </div>
        </div>
        <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; border-left: 4px solid #10B981;">
          <div style="font-size: 32px; font-weight: bold; color: #10B981;">${summary.botStats.projectsPosted}</div>
          <div style="font-size: 14px; color: #047857; margin-top: 5px;">Projects Posted</div>
        </div>
        <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B;">
          <div style="font-size: 32px; font-weight: bold; color: #F59E0B;">${summary.botStats.bidsSubmitted}</div>
          <div style="font-size: 14px; color: #D97706; margin-top: 5px;">Bids Submitted</div>
        </div>
        <div style="background: #F3E8FF; padding: 20px; border-radius: 8px; border-left: 4px solid #A855F7;">
          <div style="font-size: 32px; font-weight: bold; color: #A855F7;">${summary.botStats.contractsCreated}</div>
          <div style="font-size: 14px; color: #7C3AED; margin-top: 5px;">Contracts Created</div>
        </div>
      </div>

      <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #EF4444;">
        <h4 style="margin: 0 0 10px 0; color: #DC2626;">⚠️ Issues Detected</h4>
        <div style="display: flex; gap: 30px;">
          <div>
            <span style="font-size: 24px; font-weight: bold; color: #DC2626;">${summary.issues.critical}</span>
            <span style="font-size: 14px; color: #991B1B; margin-left: 5px;">Critical</span>
          </div>
          <div>
            <span style="font-size: 24px; font-weight: bold; color: #F59E0B;">${summary.issues.warnings}</span>
            <span style="font-size: 14px; color: #D97706; margin-left: 5px;">Warnings</span>
          </div>
        </div>
      </div>

      ${issuesHtml}
      ${suggestionsHtml}

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          This automated report was generated by MonaLisa AI monitoring system.
        </p>
        <a href="${baseUrl}/muna/monalisa" class="button" style="margin-top: 15px;">View Full MonaLisa Dashboard</a>
      </div>
    `, baseUrl)
  });
}

export async function sendWorkCompleteNotification(
  clientEmail: string,
  clientName: string,
  providerName: string,
  projectTitle: string,
  contractId: string,
  baseUrl: string = "https://bluetika.co.nz"
): Promise<boolean> {
  return sendEmail({
    to: clientEmail,
    subject: `Work Completed - ${projectTitle}`,
    htmlBody: baseHtml("Work Completed - Please Review", `
      <p>Kia ora ${clientName},</p>
      <p><strong>${providerName}</strong> has marked the work as completed for your project: <strong>"${projectTitle}"</strong></p>
      
      <div class="highlight">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <p style="margin-bottom: 0;">
          ✓ You have <strong>48 hours</strong> to review the completed work<br>
          ✓ The provider will upload "after" photos for your review<br>
          ✓ You can approve the work or raise a dispute if needed<br>
          ✓ If no action is taken within 48 hours, the work will be automatically approved
        </p>
      </div>

      <a href="${baseUrl}/contracts" class="button">Review Work Now</a>

      <div class="warning" style="margin-top: 20px;">
        <p style="margin: 0; font-size: 14px;">
          <strong>Important:</strong> If you have any concerns about the work quality, please raise a dispute within the 48-hour window. 
          After this period, the payment will be automatically released.
        </p>
      </div>

      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        Need help? Contact us at support@bluetika.co.nz
      </p>
    `, baseUrl)
  });
}

export async function sendContractMessageNotification(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  projectTitle: string,
  contractId: string,
  baseUrl: string
): Promise<void> {
  const contractUrl = `${baseUrl}/contracts`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1B4FD8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #06B6D4; margin: 20px 0; }
        .button { display: inline-block; background: #1B4FD8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Message on BlueTika</h1>
        </div>
        <div class="content">
          <p>Hi ${recipientName},</p>
          <p><strong>${senderName}</strong> sent you a message about:</p>
          <p style="font-size: 18px; color: #1B4FD8;"><strong>${projectTitle}</strong></p>
          
          <div class="message-box">
            <p style="margin: 0;">${messagePreview}${messagePreview.length >= 100 ? "..." : ""}</p>
          </div>

          <p>Reply directly on BlueTika to keep the conversation going:</p>
          <a href="${contractUrl}" class="button">View Message & Reply</a>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>💡 Tip:</strong> All communication stays secure on our platform. Never share contact details or arrange payments outside BlueTika.
          </p>
        </div>
        <div class="footer">
          <p>BlueTika - Kiwis Helping Kiwis</p>
          <p>100% NZ Owned | <a href="${baseUrl}">bluetika.co.nz</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Hi ${recipientName},

${senderName} sent you a message about: ${projectTitle}

Message preview:
"${messagePreview}${messagePreview.length >= 100 ? "..." : ""}"

Reply on BlueTika: ${contractUrl}

💡 Tip: All communication stays secure on our platform. Never share contact details or arrange payments outside BlueTika.

---
BlueTika - Kiwis Helping Kiwis
100% NZ Owned | bluetika.co.nz
  `;

  await sendEmail({
    to: recipientEmail,
    subject: `💬 ${senderName} sent you a message on BlueTika`,
    htmlBody,
    textBody
  });
}

export const sesEmailService = {
  sendEmail,
  sendEvidencePhotoReminder,
  sendReviewReminder,
  sendAdminFundReleaseNotification,
  sendFundReleaseNotification,
  sendAdminDisputeNotification,
  sendDisputeResolutionNotification,
  sendTierWarningEmail,
  sendAdditionalChargeRequestEmail,
  sendAdditionalChargeResponseEmail,
  sendAdditionalChargePaymentEmail,
  sendRoutineContractInvitation,
  sendSessionReminderEmail,
  sendAdminSuspensionAlert,
  sendBidDeclinedEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFirstProjectPosted,
  sendFirstBidSubmitted,
  sendDocumentAutoApproved,
  sendDocumentManuallyApproved,
  sendDocumentRejected,
  sendMonalisaWeeklySummary,
  sendWorkCompleteNotification,
  sendContractMessageNotification
};