// Test script for owner login flow
// Run with: node test-login.js

const BASE_URL = "https://bluetika.co.nz";
const OWNER_EMAIL = "bluetikanz@gmail.com";
const OWNER_PASSWORD = "BlueTika2026!";

async function testLogin() {
  console.log("\n🔐 Testing Owner Login Flow...\n");
  
  try {
    // Step 1: Login
    console.log("Step 1: Attempting login...");
    const loginResponse = await fetch(`${BASE_URL}/api/auth/muna-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: OWNER_EMAIL, 
        password: OWNER_PASSWORD 
      }),
    });

    const loginData = await loginResponse.json();
    console.log("Login Status:", loginResponse.status);
    console.log("Login Response:", JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.error("❌ Login failed:", loginData.error);
      return;
    }

    // Extract cookie from Set-Cookie header
    const setCookie = loginResponse.headers.get("set-cookie");
    console.log("\nSet-Cookie header:", setCookie);

    if (!setCookie) {
      console.error("❌ No cookie set!");
      return;
    }

    // Parse the cookie
    const cookieMatch = setCookie.match(/sb-access-token=([^;]+)/);
    if (!cookieMatch) {
      console.error("❌ Cookie format invalid!");
      return;
    }

    const accessToken = cookieMatch[1];
    console.log("✅ Access token extracted:", accessToken.substring(0, 20) + "...");

    // Step 2: Verify admin access
    console.log("\nStep 2: Verifying admin access...");
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-admin`, {
      method: "GET",
      headers: {
        "Cookie": `sb-access-token=${accessToken}`
      },
    });

    const verifyData = await verifyResponse.json();
    console.log("Verify Status:", verifyResponse.status);
    console.log("Verify Response:", JSON.stringify(verifyData, null, 2));

    if (!verifyResponse.ok) {
      console.error("❌ Verification failed:", verifyData.error);
      return;
    }

    if (verifyData.isOwner && verifyData.isAdmin) {
      console.log("\n✅ SUCCESS! Owner login works perfectly!");
      console.log(`   Email: ${verifyData.email}`);
      console.log(`   Role: ${verifyData.role}`);
      console.log(`   IsOwner: ${verifyData.isOwner}`);
      console.log(`   IsAdmin: ${verifyData.isAdmin}`);
    } else {
      console.error("❌ Owner verification failed:", verifyData);
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testLogin();