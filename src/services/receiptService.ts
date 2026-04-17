import { supabase } from "@/integrations/supabase/client";

interface ReceiptData {
  contractId: string;
  projectTitle: string;
  providerName: string;
  clientEmail: string;
  providerEmail: string;
  agreedPrice: number;
  platformFee: number;
  paymentProcessingFee: number;
  totalAmount: number;
  paymentDate: string;
  receiptNumber: string;
}

export const receiptService = {
  async generateReceipt(contractId: string): Promise<ReceiptData | null> {
    const { data: contract, error } = await supabase
      .from("contracts")
      .select(`
        *,
        project:projects(title),
        provider:profiles!contracts_provider_id_fkey(full_name, email),
        client:profiles!contracts_client_id_fkey(email)
      `)
      .eq("id", contractId)
      .single();

    if (error || !contract) {
      console.error("Error fetching contract for receipt:", error);
      return null;
    }

    // Generate unique receipt number
    const receiptNumber = `BT-${Date.now()}-${contractId.slice(0, 8).toUpperCase()}`;

    return {
      contractId,
      projectTitle: contract.project?.title || "Untitled Project",
      providerName: contract.provider?.full_name || "Service Provider",
      clientEmail: contract.client?.email || "",
      providerEmail: contract.provider?.email || "",
      agreedPrice: contract.final_amount || 0,
      platformFee: contract.platform_fee || 0,
      paymentProcessingFee: contract.payment_processing_fee || 0,
      totalAmount: contract.total_amount || 0,
      paymentDate: new Date().toISOString(),
      receiptNumber,
    };
  },

  async sendClientReceipt(receipt: ReceiptData): Promise<void> {
    const html = this.generateClientReceiptHTML(receipt);
    
    try {
      const response = await fetch("/api/send-receipt-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: receipt.clientEmail,
          subject: `Payment Receipt - ${receipt.projectTitle}`,
          html,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send client receipt");
      }
    } catch (error) {
      console.error("Error sending client receipt:", error);
      throw error;
    }
  },

  async sendProviderReceipt(receipt: ReceiptData): Promise<void> {
    const html = this.generateProviderReceiptHTML(receipt);
    
    try {
      const response = await fetch("/api/send-receipt-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: receipt.providerEmail,
          subject: `Payment Received - ${receipt.projectTitle}`,
          html,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send provider receipt");
      }
    } catch (error) {
      console.error("Error sending provider receipt:", error);
      throw error;
    }
  },

  generateClientReceiptHTML(receipt: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1B4FD8; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .receipt-number { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .receipt-number strong { font-size: 16px; color: #1B4FD8; }
    .details { margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-weight: 500; }
    .detail-value { font-weight: 600; text-align: right; }
    .total-row { background: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 6px; }
    .total-row .detail-label { font-size: 18px; color: #111827; }
    .total-row .detail-value { font-size: 20px; color: #1B4FD8; }
    .escrow-notice { background: #dbeafe; border-left: 4px solid #1B4FD8; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .escrow-notice p { margin: 0; font-size: 14px; color: #1e40af; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    .footer a { color: #1B4FD8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Payment Receipt</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">BlueTika.co.nz</p>
  </div>
  
  <div class="content">
    <div class="receipt-number">
      <strong>Receipt #${receipt.receiptNumber}</strong>
    </div>

    <p>Thank you for your payment! Here are the details of your transaction:</p>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Project</span>
        <span class="detail-value">${receipt.projectTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Service Provider</span>
        <span class="detail-value">${receipt.providerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Date</span>
        <span class="detail-value">${new Date(receipt.paymentDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Agreed Price</span>
        <span class="detail-value">$${receipt.agreedPrice.toFixed(2)} NZD</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Platform Fee (2%)</span>
        <span class="detail-value">$${receipt.platformFee.toFixed(2)} NZD</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Processing</span>
        <span class="detail-value">$${receipt.paymentProcessingFee.toFixed(2)} NZD</span>
      </div>
    </div>

    <div class="total-row">
      <div class="detail-row" style="border: none;">
        <span class="detail-label">Total Paid</span>
        <span class="detail-value">$${receipt.totalAmount.toFixed(2)} NZD</span>
      </div>
    </div>

    <div class="escrow-notice">
      <p><strong>🔒 Your payment is secure</strong></p>
      <p>Your funds are held safely by BlueTika until the project is complete, evidence photos are submitted, and both parties have reviewed each other. Your money does not move until the job is done.</p>
    </div>
  </div>

  <div class="footer">
    <p>Questions? Contact us at <a href="mailto:support@bluetika.co.nz">support@bluetika.co.nz</a></p>
    <p style="margin-top: 10px;">100% NZ Owned · Kiwis Helping Kiwis</p>
    <p><a href="https://bluetika.co.nz">bluetika.co.nz</a></p>
  </div>
</body>
</html>
    `.trim();
  },

  generateProviderReceiptHTML(receipt: ReceiptData): string {
    const providerAmount = receipt.agreedPrice; // They receive the agreed price
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .receipt-number { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .receipt-number strong { font-size: 16px; color: #10B981; }
    .details { margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-weight: 500; }
    .detail-value { font-weight: 600; text-align: right; }
    .earnings-box { background: #d1fae5; border: 2px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .earnings-box h2 { margin: 0 0 10px 0; color: #065f46; font-size: 16px; font-weight: 600; }
    .earnings-box .amount { font-size: 32px; font-weight: 700; color: #10B981; margin: 10px 0; }
    .next-steps { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .next-steps h3 { margin-top: 0; color: #111827; font-size: 16px; }
    .next-steps ol { margin: 0; padding-left: 20px; }
    .next-steps li { margin: 8px 0; color: #4b5563; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
    .footer a { color: #10B981; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Payment Received! 🎉</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">BlueTika.co.nz</p>
  </div>
  
  <div class="content">
    <div class="receipt-number">
      <strong>Receipt #${receipt.receiptNumber}</strong>
    </div>

    <p>Great news! Your client has paid for the project. The funds are now held securely in escrow.</p>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Project</span>
        <span class="detail-value">${receipt.projectTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Date</span>
        <span class="detail-value">${new Date(receipt.paymentDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>

    <div class="earnings-box">
      <h2>Your Earnings</h2>
      <div class="amount">$${providerAmount.toFixed(2)} NZD</div>
      <p style="margin: 0; color: #065f46; font-size: 14px;">Released after project completion</p>
    </div>

    <div class="next-steps">
      <h3>📋 Next Steps</h3>
      <ol>
        <li>Complete the work as agreed</li>
        <li>Upload evidence photos when finished</li>
        <li>Both parties submit reviews</li>
        <li>Funds automatically released to your Stripe account</li>
      </ol>
    </div>

    <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 14px;">
      <strong>⏰ Remember:</strong> The funds are held in escrow for your protection. They'll be released once you've submitted evidence photos and both parties have reviewed each other.
    </p>
  </div>

  <div class="footer">
    <p>Questions? Contact us at <a href="mailto:support@bluetika.co.nz">support@bluetika.co.nz</a></p>
    <p style="margin-top: 10px;">100% NZ Owned · Kiwis Helping Kiwis</p>
    <p><a href="https://bluetika.co.nz">bluetika.co.nz</a></p>
  </div>
</body>
</html>
    `.trim();
  },
};