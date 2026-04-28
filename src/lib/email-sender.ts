import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AMAZON_SES_ACCESS_KEY!,
    secretAccessKey: process.env.AMAZON_SES_SECRET_KEY!,
  },
});

const DEFAULT_FROM_EMAIL = "noreply@bluetika.co.nz";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, from = DEFAULT_FROM_EMAIL } = options;

  console.log("📧 [EMAIL SENDER] Configuration check:");
  console.log("   AWS Region:", process.env.AWS_REGION || "us-east-1");
  console.log("   Access Key:", process.env.AMAZON_SES_ACCESS_KEY ? "✓ Set" : "✗ Missing");
  console.log("   Secret Key:", process.env.AMAZON_SES_SECRET_KEY ? "✓ Set" : "✗ Missing");
  console.log("   From:", from);
  console.log("   To:", to);
  console.log("   Subject:", subject);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📧 [EMAIL] Attempt ${attempt}/${MAX_RETRIES} - Sending to: ${to}`);

      const command = new SendEmailCommand({
        Source: from,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: html,
              Charset: "UTF-8",
            },
          },
        },
      });

      const response = await sesClient.send(command);
      const messageId = response.MessageId;

      console.log(`✅ [EMAIL] SUCCESS - MessageId: ${messageId}, To: ${to}`);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      lastError = error;
      console.error(`❌ [EMAIL] Attempt ${attempt} FAILED:`, {
        to,
        subject,
        errorName: error.name,
        errorCode: error.code || error.$metadata?.httpStatusCode,
        errorMessage: error.message,
        fullError: JSON.stringify(error, null, 2),
      });

      if (error.name === "MessageRejected" || error.message?.includes("Email address is not verified")) {
        console.error("🚨 [EMAIL] SES EMAIL NOT VERIFIED ERROR:");
        console.error("   The sender email address needs to be verified in Amazon SES.");
        console.error("   Current sender:", from);
        console.error("   Recipient:", to);
        console.error("   ");
        console.error("   SOLUTION: Verify email addresses in AWS SES Console:");
        console.error("   1. Go to: https://us-east-1.console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities");
        console.error("   2. Click 'Create identity'");
        console.error("   3. Select 'Email address'");
        console.error("   4. Enter: noreply@bluetika.co.nz");
        console.error("   5. Click 'Create identity'");
        console.error("   6. Check email and click verification link");
        console.error("   ");
        console.error("   OR if SES is in sandbox mode, also verify recipient emails:");
        console.error("   - Verify:", to);
        
        throw new Error(`SES Email Not Verified: ${from}. Please verify in AWS SES Console.`);
      }

      if (attempt < MAX_RETRIES) {
        const delayTime = RETRY_DELAY_MS * attempt;
        console.log(`⏳ [EMAIL] Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }

  const errorMessage = `Failed to send email after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`;
  console.error(`❌ [EMAIL] FINAL FAILURE:`, {
    to,
    subject,
    error: errorMessage,
    errorCode: (lastError as any)?.code || lastError?.name,
  });

  throw new Error(errorMessage);
}

function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Work Sans', Arial, sans-serif;
          line-height: 1.6;
          color: #0A0E1A;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #1B4FD8;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .footer {
          background-color: #0A0E1A;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #06B6D4;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #0891B2;
        }
        a {
          color: #1B4FD8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">BlueTika</h1>
        <p style="margin: 5px 0 0 0;">Find Local Help. Get it Done.</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0;"><strong>100% NZ Owned · Kiwis Helping Kiwis</strong></p>
        <p style="margin: 10px 0 0 0;">bluetika.co.nz</p>
      </div>
    </body>
    </html>
  `;
}

export async function sendRegistrationEmail(
  userEmail: string,
  userName: string,
  userRole: string
): Promise<EmailResult> {
  const subject = `Kia ora, ${userName}! Welcome to BlueTika`;

  const content = `
    <h2>Kia ora ${userName}!</h2>
    <p>Chur! Welcome to BlueTika - New Zealand's trusted local marketplace.</p>
    
    ${
      userRole === "client"
        ? `
      <p>You're all set to post projects and find the perfect service provider for your needs.</p>
      <p><strong>Here's what you can do:</strong></p>
      <ul>
        <li>Post projects and get competitive bids</li>
        <li>Review provider profiles and ratings</li>
        <li>Communicate securely through our platform</li>
        <li>Make safe payments with escrow protection</li>
      </ul>
    `
        : `
      <p>You're all set to start bidding on projects and growing your business.</p>
      <p><strong>Here's what you can do:</strong></p>
      <ul>
        <li>Browse and bid on projects</li>
        <li>Build your reputation with reviews</li>
        <li>Get verified to stand out</li>
        <li>Receive secure payments through our platform</li>
      </ul>
    `
    }
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz"}" class="button">
        Get Started
      </a>
    </p>
    
    <p>Questions? We're here to help! Reply to this email or visit our FAQ.</p>
    
    <p>Ka kite,<br>The BlueTika Team</p>
  `;

  const html = getEmailTemplate(content);

  return await sendEmail({ to: userEmail, subject, html });
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<EmailResult> {
  const subject = "Reset your BlueTika password";

  const content = `
    <h2>Kia ora,</h2>
    <p>No worries, we'll get you sorted.</p>
    
    <p>We received a request to reset your password. Click the button below to choose a new password:</p>
    
    <p>
      <a href="${resetLink}" class="button">
        Reset Password
      </a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
    
    <p><strong>This link expires in 1 hour.</strong></p>
    
    <p>If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>
    
    <p>Cheers,<br>The BlueTika Team</p>
  `;

  const html = getEmailTemplate(content);

  return await sendEmail({ to: email, subject, html });
}

export async function sendEmailVerification(
  email: string,
  verificationLink: string
): Promise<EmailResult> {
  const subject = "Verify your BlueTika email";

  const content = `
    <h2>Kia ora,</h2>
    <p>Thanks for signing up to BlueTika!</p>
    
    <p>Just one more step - please verify your email address by clicking the button below:</p>
    
    <p>
      <a href="${verificationLink}" class="button">
        Verify Email
      </a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationLink}</p>
    
    <p>This link expires in 24 hours.</p>
    
    <p>If you didn't create an account with BlueTika, you can safely ignore this email.</p>
    
    <p>Ka kite,<br>The BlueTika Team</p>
  `;

  const html = getEmailTemplate(content);

  return await sendEmail({ to: email, subject, html });
}

export async function sendBidNotification(
  clientEmail: string,
  projectTitle: string,
  providerName: string,
  bidAmount: number
): Promise<EmailResult> {
  const subject = `New bid on your project: ${projectTitle}`;

  const content = `
    <h2>Kia ora,</h2>
    <p>Good news! You've received a new bid on your project.</p>
    
    <p><strong>Project:</strong> ${projectTitle}</p>
    <p><strong>Provider:</strong> ${providerName}</p>
    <p><strong>Bid Amount:</strong> NZD $${bidAmount.toFixed(2)}</p>
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz"}/projects" class="button">
        View Bid Details
      </a>
    </p>
    
    <p>Review the provider's profile, check their ratings, and accept the bid when you're ready.</p>
    
    <p>Cheers,<br>The BlueTika Team</p>
  `;

  const html = getEmailTemplate(content);

  return await sendEmail({ to: clientEmail, subject, html });
}

export async function sendContractNotification(
  clientEmail: string,
  providerEmail: string,
  projectTitle: string
): Promise<EmailResult> {
  const subject = `Contract created: ${projectTitle}`;

  const clientContent = `
    <h2>Kia ora,</h2>
    <p>Sweet! Your contract has been created.</p>
    
    <p><strong>Project:</strong> ${projectTitle}</p>
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz"}/contracts" class="button">
        View Contract
      </a>
    </p>
    
    <p>Your payment is held securely in escrow and will be released to the provider once the work is completed.</p>
    
    <p>Stay in touch with your provider through the BlueTika messaging system.</p>
    
    <p>Cheers,<br>The BlueTika Team</p>
  `;

  const providerContent = `
    <h2>Kia ora,</h2>
    <p>Congratulations! Your bid has been accepted.</p>
    
    <p><strong>Project:</strong> ${projectTitle}</p>
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz"}/contracts" class="button">
        View Contract
      </a>
    </p>
    
    <p>The client's payment is secured in escrow. Once you complete the work and the client approves, the funds will be released to you.</p>
    
    <p>Keep the client updated on your progress through the BlueTika messaging system.</p>
    
    <p>Cheers,<br>The BlueTika Team</p>
  `;

  const clientHtml = getEmailTemplate(clientContent);
  const providerHtml = getEmailTemplate(providerContent);

  await sendEmail({ to: clientEmail, subject, html: clientHtml });

  return await sendEmail({ to: providerEmail, subject, html: providerHtml });
}

export async function sendPaymentNotification(
  clientEmail: string,
  providerEmail: string,
  amount: number
): Promise<EmailResult> {
  const subject = `Payment of NZD $${amount.toFixed(2)} processed`;

  const clientContent = `
    <h2>Kia ora,</h2>
    <p>Your payment has been processed successfully.</p>
    
    <p><strong>Amount:</strong> NZD $${amount.toFixed(2)}</p>
    
    <p>The funds have been released from escrow to your service provider.</p>
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz"}/contracts" class="button">
        View Contract
      </a>
    </p>
    
    <p>Thank you for using BlueTika! We'd love to hear about your experience.</p>
    
    <p>Cheers,<br>The BlueTika Team</p>
  `;

  const providerContent = `
    <h2>Kia ora,</h2>
    <p>Chur! Payment has been released to you.</p>
    
    <p><strong>Amount:</strong> NZD $${amount.toFixed(2)}</p>
    
    <p>The funds will appear in your connected Stripe account within 2-3 business days.</p>
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://bluetika.co.nz"}/contracts" class="button">
        View Contract
      </a>
    </p>
    
    <p>Thanks for being part of the BlueTika community!</p>
    
    <p>Cheers,<br>The BlueTika Team</p>
  `;

  const clientHtml = getEmailTemplate(clientContent);
  const providerHtml = getEmailTemplate(providerContent);

  await sendEmail({ to: clientEmail, subject, html: clientHtml });

  return await sendEmail({ to: providerEmail, subject, html: providerHtml });
}