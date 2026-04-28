const dotenv = require('dotenv');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

dotenv.config({ path: '.env.local' });

const accessKeyId = process.env.AMAZON_SES_ACCESS_KEY;
const secretAccessKey = process.env.AMAZON_SES_SECRET_KEY;
const region = process.env.AWS_REGION || "us-east-1";

console.log("=== AWS SES TEST ===");
console.log("Region:", region);
console.log("Access Key starts with:", accessKeyId ? accessKeyId.substring(0, 4) + "..." : "MISSING");
console.log("Secret Key starts with:", secretAccessKey ? secretAccessKey.substring(0, 4) + "..." : "MISSING");

const client = new SESClient({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

async function runTest() {
  try {
    const command = new SendEmailCommand({
      Source: "noreply@bluetika.co.nz",
      Destination: { ToAddresses: ["support@bluetika.co.nz"] },
      Message: {
        Subject: { Data: "BlueTika - Final SES Connection Test" },
        Body: { Text: { Data: "If you receive this, the AWS SES keys are working perfectly!" } }
      }
    });
    
    console.log("Sending email...");
    const response = await client.send(command);
    console.log("✅ SUCCESS! MessageId:", response.MessageId);
  } catch (err) {
    console.error("❌ FAILED!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.$metadata) console.error("HTTP Status:", err.$metadata.httpStatusCode);
  }
}

runTest();
