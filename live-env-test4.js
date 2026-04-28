const fs = require('fs');
const dotenv = require('dotenv');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const accessKeyId = envConfig.AMAZON_SES_ACCESS_KEY || envConfig.AWS_ACCESS_KEY_ID;
const secretAccessKey = envConfig.AMAZON_SES_SECRET_KEY || envConfig.AWS_SECRET_ACCESS_KEY;
const region = envConfig.AWS_REGION || 'us-east-1';

console.log("=== TEST RUN #4 ===");
console.log("Region:", region);
console.log("Access Key begins with:", accessKeyId ? accessKeyId.substring(0, 5) + "..." : "MISSING");
console.log("Secret Key begins with:", secretAccessKey ? secretAccessKey.substring(0, 5) + "..." : "MISSING");
console.log("Secret Key length:", secretAccessKey ? secretAccessKey.length : 0);

// Strip any accidental quotes just in case
const cleanAccessKey = accessKeyId ? accessKeyId.replace(/['"]/g, '').trim() : '';
const cleanSecretKey = secretAccessKey ? secretAccessKey.replace(/['"]/g, '').trim() : '';

const client = new SESClient({
  region: region,
  credentials: {
    accessKeyId: cleanAccessKey,
    secretAccessKey: cleanSecretKey,
  },
});

async function runTest() {
  try {
    const command = new SendEmailCommand({
      Source: "support@bluetika.co.nz",
      Destination: { ToAddresses: ["support@bluetika.co.nz"] },
      Message: {
        Subject: { Data: "AWS SES Key Test #4" },
        Body: { Text: { Data: "If you receive this, the keys are working perfectly!" } }
      }
    });
    
    console.log("Sending email...");
    const response = await client.send(command);
    console.log("✅ SUCCESS! Email sent perfectly.");
    console.log("Message ID:", response.MessageId);
  } catch (err) {
    console.error("❌ FAILED!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.$metadata) console.error("HTTP Status:", err.$metadata.httpStatusCode);
  }
}

runTest();
