const baseUrl = "http://localhost:3000";

async function testEscrowSystem() {
  console.log("=== ESCROW SYSTEM TEST ===\n");

  try {
    // Test 1: Validate system
    console.log("1. Validating system...");
    const validateRes = await fetch(`${baseUrl}/api/escrow/validate`);
    const validateData = await validateRes.json();
    
    console.log("✓ Validation result:");
    console.log(JSON.stringify(validateData, null, 2));
    
    if (!validateData.ready) {
      console.log("\n❌ System not ready. Fix errors above.");
      return;
    }

    console.log("\n✅ System validated!\n");

    // Test 2: Full cycle test
    console.log("2. Running full payment cycle test...");
    const cycleRes = await fetch(`${baseUrl}/api/test-full-cycle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const cycleData = await cycleRes.json();

    console.log("\n✓ Full cycle test result:");
    if (cycleData.log) {
      cycleData.log.forEach(line => console.log(line));
    }

    if (cycleData.success) {
      console.log("\n✅ FULL CYCLE TEST PASSED!");
      console.log("\nSummary:");
      console.log(JSON.stringify(cycleData.summary, null, 2));
    } else {
      console.log("\n❌ Full cycle test failed");
      console.log("Error:", cycleData.error);
    }

  } catch (error) {
    console.error("\n❌ Test error:", error.message);
  }
}

testEscrowSystem();