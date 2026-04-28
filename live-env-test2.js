const dotenv = require('dotenv');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

dotenv.config({ path: '.env.local' });

console.log("=== Checking Keys ===");
console.log("Access Key starts with:", process.env.AMAZON_SES_ACCESS_KEY ? process.env.AMAZON_SES_ACCESS_KEY.substring(0, 4) : 'Missing');
console.log("Secret Key starts with:", process.env.AMAZON_SES_SECRET_KEY ? process.env.AMAZON_SES_SECRET_KEY.substring(0, 4) : 'Missing');
console.log("Region in env:", process.env.AWS_REGION);

const client = new SESClient({
  region: "us-east-1", // Forcing us-east-1 based on our previous discussion
  credentials: {
    accessKeyId: process.env.AMAZON_SES_ACCESS_KEY,
    secretAccessKey: process.env.AMAZON_SES_SECRET_KEY,
  },
});

const command = new SendEmailCommand({
  Source: "noreply@bluetika.co.nz",
  Destination: { ToAddresses: ["support@bluetika.co.nz"] },
  Message: {
    Subject: { Data: "Test Email from BlueTika" },
    Body: { Text: { Data: "This is a test email to verify AWS SES credentials." } }
  }
});

client.send(command)
  .then(res => console.log("✅ SUCCESS! Message ID:", res.MessageId))
  .catch(err => {
    console.error("❌ FAILED!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
  });
