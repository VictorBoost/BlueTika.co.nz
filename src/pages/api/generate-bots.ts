import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const NZ_FIRST_NAMES = [
  "Aroha", "Hemi", "Kiri", "Matiu", "Ngaire", "Rawiri", "Tane", "Whetu",
  "James", "Sophie", "Liam", "Emma", "Oliver", "Charlotte", "Mason", "Amelia",
  "Jack", "Mia", "Noah", "Harper", "Lucas", "Isla", "Cooper", "Grace"
];

const NZ_LAST_NAMES = [
  "Smith", "Brown", "Wilson", "Taylor", "Anderson", "Thomas", "Jackson", "White",
  "Harris", "Martin", "Thompson", "Young", "Walker", "Clark", "Wright", "Green",
  "Patel", "Singh", "Wong", "Chen", "Kumar", "Li", "Zhang", "Kim"
];

const NZ_CITIES = [
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
  "Dunedin", "Palmerston North", "Napier", "Nelson", "Rotorua"
];

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== BOT GENERATION STARTED ===");
  console.log("Method:", req.method);
  
  if (req.method !== "POST") {
    console.log("ERROR: Method not allowed");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Request body:", req.body);
    const { count = 50 } = req.body;
    const batch = Date.now();
    
    console.log("Configuration:");
    console.log("- Count:", count);
    console.log("- Batch:", batch);
    console.log("- Supabase URL:", supabaseUrl);
    console.log("- Service Key exists:", !!supabaseServiceKey);
    console.log("- Service Key length:", supabaseServiceKey?.length);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log("✓ Supabase admin client created");

    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    // 80% clients (buyers who post projects) / 20% providers (sellers who bid)
    const clientCount = Math.floor(count * 0.8);
    const providerCount = count - clientCount;

    console.log(`\n=== GENERATION PLAN ===`);
    console.log(`Total: ${count} bots`);
    console.log(`Clients: ${clientCount} (80%)`);
    console.log(`Providers: ${providerCount} (20%)`);

    // Generate provider bots (20%)
    console.log(`\n=== CREATING ${providerCount} PROVIDER BOTS ===`);
    
    for (let i = 0; i < providerCount; i++) {
      console.log(`\n--- Provider Bot ${i + 1}/${providerCount} ---`);
      
      try {
        const firstName = randomItem(NZ_FIRST_NAMES);
        const lastName = randomItem(NZ_LAST_NAMES);
        const city = randomItem(NZ_CITIES);
        const email = `bot.provider.${i}.${batch}@bluetika.test`;
        const password = `BotPass${batch}!`;

        console.log(`Name: ${firstName} ${lastName}`);
        console.log(`Email: ${email}`);
        console.log(`City: ${city}`);
        console.log(`Password length: ${password.length}`);

        console.log("Creating auth user...");
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
            is_bot: true
          }
        });

        if (authError) {
          console.error("❌ Auth creation FAILED:");
          console.error("Error code:", authError.code);
          console.error("Error message:", authError.message);
          console.error("Full error:", JSON.stringify(authError, null, 2));
          results.failed++;
          results.errors.push(`Provider ${i} auth: ${authError.message}`);
          continue;
        }

        if (!authData?.user) {
          console.error("❌ No user data returned (but no error)");
          results.failed++;
          results.errors.push(`Provider ${i}: No user data returned`);
          continue;
        }

        console.log("✓ Auth user created, ID:", authData.user.id);

        console.log("Waiting 100ms for trigger...");
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Checking if profile exists...");
        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (checkError) {
          console.error("❌ Profile check FAILED:");
          console.error("Error code:", checkError.code);
          console.error("Error message:", checkError.message);
          console.error("Full error:", JSON.stringify(checkError, null, 2));
        } else {
          console.log("Profile exists:", !!existingProfile);
        }

        if (!existingProfile) {
          console.log("Profile doesn't exist, inserting...");
          const profileData = {
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            city_region: city,
            location: city,
            phone_number: `021 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
            is_client: true,
            is_provider: true,
            verification_status: "approved",
            bio: `Experienced ${city} service provider. Quality workmanship guaranteed.`
          };
          
          console.log("Profile data:", JSON.stringify(profileData, null, 2));
          
          const { error: profileInsertError } = await supabaseAdmin
            .from("profiles")
            .insert(profileData);

          if (profileInsertError) {
            console.error("❌ Profile INSERT FAILED:");
            console.error("Error code:", profileInsertError.code);
            console.error("Error message:", profileInsertError.message);
            console.error("Error hint:", profileInsertError.hint);
            console.error("Error details:", profileInsertError.details);
            console.error("Full error:", JSON.stringify(profileInsertError, null, 2));
            results.failed++;
            results.errors.push(`Provider ${i} profile insert: ${profileInsertError.message}`);
            continue;
          }
          
          console.log("✓ Profile inserted");
        } else {
          console.log("Profile exists, updating...");
          const { error: profileError } = await supabaseAdmin.from("profiles").update({
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            city_region: city,
            location: city,
            phone_number: `021 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
            is_client: true,
            is_provider: true,
            verification_status: "approved",
            bio: `Experienced ${city} service provider. Quality workmanship guaranteed.`
          }).eq("id", authData.user.id);

          if (profileError) {
            console.error("❌ Profile UPDATE FAILED:");
            console.error("Error code:", profileError.code);
            console.error("Error message:", profileError.message);
            console.error("Full error:", JSON.stringify(profileError, null, 2));
            results.failed++;
            results.errors.push(`Provider ${i} profile update: ${profileError.message}`);
            continue;
          }
          
          console.log("✓ Profile updated");
        }

        console.log("Inserting bot_account...");
        const botAccountData = {
          profile_id: authData.user.id,
          bot_type: "provider",
          generation_batch: batch,
          is_active: true
        };
        
        console.log("Bot account data:", JSON.stringify(botAccountData, null, 2));
        
        const { error: botError } = await supabaseAdmin
          .from("bot_accounts")
          .insert(botAccountData);

        if (botError) {
          console.error("❌ Bot account INSERT FAILED:");
          console.error("Error code:", botError.code);
          console.error("Error message:", botError.message);
          console.error("Error hint:", botError.hint);
          console.error("Error details:", botError.details);
          console.error("Full error:", JSON.stringify(botError, null, 2));
          results.failed++;
          results.errors.push(`Provider ${i} bot_account: ${botError.message}`);
          continue;
        }

        console.log("✓ Bot account inserted");
        results.success++;
        console.log(`✅ Provider bot ${i + 1} COMPLETE`);
        
      } catch (error: any) {
        console.error(`❌ EXCEPTION in provider ${i}:`);
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error:", JSON.stringify(error, null, 2));
        results.failed++;
        results.errors.push(`Provider ${i} exception: ${error.message}`);
      }
    }

    // Generate client bots (80% - these post projects)
    console.log(`\n=== CREATING ${clientCount} CLIENT BOTS ===`);
    
    for (let i = 0; i < clientCount; i++) {
      console.log(`\n--- Client Bot ${i + 1}/${clientCount} ---`);
      
      try {
        const firstName = randomItem(NZ_FIRST_NAMES);
        const lastName = randomItem(NZ_LAST_NAMES);
        const city = randomItem(NZ_CITIES);
        const email = `bot.client.${i}.${batch}@bluetika.test`;
        const password = `BotPass${batch}!`;

        console.log(`Name: ${firstName} ${lastName}`);
        console.log(`Email: ${email}`);
        console.log(`City: ${city}`);

        console.log("Creating auth user...");
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
            is_bot: true
          }
        });

        if (authError) {
          console.error("❌ Auth creation FAILED:");
          console.error("Error code:", authError.code);
          console.error("Error message:", authError.message);
          console.error("Full error:", JSON.stringify(authError, null, 2));
          results.failed++;
          results.errors.push(`Client ${i} auth: ${authError.message}`);
          continue;
        }

        if (!authData?.user) {
          console.error("❌ No user data returned");
          results.failed++;
          results.errors.push(`Client ${i}: No user data returned`);
          continue;
        }

        console.log("✓ Auth user created, ID:", authData.user.id);

        console.log("Waiting 100ms for trigger...");
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Checking if profile exists...");
        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (checkError) {
          console.error("❌ Profile check FAILED:");
          console.error("Error:", JSON.stringify(checkError, null, 2));
        } else {
          console.log("Profile exists:", !!existingProfile);
        }

        if (!existingProfile) {
          console.log("Profile doesn't exist, inserting...");
          const profileData = {
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            city_region: city,
            location: city,
            phone_number: `021 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
            is_client: true,
            is_provider: false,
            bio: `Homeowner looking for reliable service providers in ${city}.`
          };
          
          console.log("Profile data:", JSON.stringify(profileData, null, 2));
          
          const { error: profileInsertError } = await supabaseAdmin
            .from("profiles")
            .insert(profileData);

          if (profileInsertError) {
            console.error("❌ Profile INSERT FAILED:");
            console.error("Error code:", profileInsertError.code);
            console.error("Error message:", profileInsertError.message);
            console.error("Error hint:", profileInsertError.hint);
            console.error("Error details:", profileInsertError.details);
            console.error("Full error:", JSON.stringify(profileInsertError, null, 2));
            results.failed++;
            results.errors.push(`Client ${i} profile insert: ${profileInsertError.message}`);
            continue;
          }
          
          console.log("✓ Profile inserted");
        } else {
          console.log("Profile exists, updating...");
          const { error: profileError } = await supabaseAdmin.from("profiles").update({
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            city_region: city,
            location: city,
            phone_number: `021 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
            is_client: true,
            is_provider: false,
            bio: `Homeowner looking for reliable service providers in ${city}.`
          }).eq("id", authData.user.id);

          if (profileError) {
            console.error("❌ Profile UPDATE FAILED:");
            console.error("Error:", JSON.stringify(profileError, null, 2));
            results.failed++;
            results.errors.push(`Client ${i} profile update: ${profileError.message}`);
            continue;
          }
          
          console.log("✓ Profile updated");
        }

        console.log("Inserting bot_account...");
        const botAccountData = {
          profile_id: authData.user.id,
          bot_type: "client",
          generation_batch: batch,
          is_active: true
        };
        
        console.log("Bot account data:", JSON.stringify(botAccountData, null, 2));
        
        const { error: botError } = await supabaseAdmin
          .from("bot_accounts")
          .insert(botAccountData);

        if (botError) {
          console.error("❌ Bot account INSERT FAILED:");
          console.error("Error code:", botError.code);
          console.error("Error message:", botError.message);
          console.error("Error hint:", botError.hint);
          console.error("Error details:", botError.details);
          console.error("Full error:", JSON.stringify(botError, null, 2));
          results.failed++;
          results.errors.push(`Client ${i} bot_account: ${botError.message}`);
          continue;
        }

        console.log("✓ Bot account inserted");
        results.success++;
        console.log(`✅ Client bot ${i + 1} COMPLETE`);
        
      } catch (error: any) {
        console.error(`❌ EXCEPTION in client ${i}:`);
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error:", JSON.stringify(error, null, 2));
        results.failed++;
        results.errors.push(`Client ${i} exception: ${error.message}`);
      }
    }

    console.log("\n=== GENERATION COMPLETE ===");
    console.log("Success:", results.success);
    console.log("Failed:", results.failed);
    console.log("Errors:", results.errors);
    
    return res.status(200).json(results);
    
  } catch (error: any) {
    console.error("\n=== FATAL ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    return res.status(500).json({ 
      success: 0, 
      failed: 50, 
      errors: [error.message || "Unknown server error"] 
    });
  }
}