require('dotenv').config({ path: '.env.local' });
console.log("=== ENV CHECK ===");
console.log("AWS_REGION:", process.env.AWS_REGION);
console.log("AMAZON_SES_ACCESS_KEY starts with:", process.env.AMAZON_SES_ACCESS_KEY ? process.env.AMAZON_SES_ACCESS_KEY.substring(0, 5) + "..." : "MISSING");

const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

async function runTest() {
  try {
    console.log("\n=== SENDING TEST EMAIL ===");
    const sesClient = new SESClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AMAZON_SES_ACCESS_KEY,
        secretAccessKey: process.env.AMAZON_SES_SECRET_KEY,
      },
    });

    const command = new SendEmailCommand({
      Source: "noreply@bluetika.co.nz",
      Destination: { ToAddresses: ["support@bluetika.co.nz"] },
      Message: {
        Subject: { Data: "BlueTika Live Test" },
        Body: { Text: { Data: "Testing if the new credentials work." } },
      },
    });

    const res = await sesClient.send(command);
    console.log("✅ EMAIL SUCCESS! MessageId:", res.MessageId);
    console.log("\nThe AWS SES keys are officially working! We can now test the full flow.");
  } catch (err) {
    console.error("❌ EMAIL FAILED!");
    console.error("Error Type:", err.name);
    console.error("Message:", err.message);
  }
}

runTest();
