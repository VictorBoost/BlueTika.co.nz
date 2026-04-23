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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { count = 50 } = req.body;
    const batch = Date.now();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    // 80% clients (buyers who post projects) / 20% providers (sellers who bid)
    const clientCount = Math.floor(count * 0.8);
    const providerCount = count - clientCount;

    console.log(`Generating ${count} bots: ${clientCount} clients, ${providerCount} providers`);

    // Generate provider bots (20%)
    for (let i = 0; i < providerCount; i++) {
      try {
        const firstName = randomItem(NZ_FIRST_NAMES);
        const lastName = randomItem(NZ_LAST_NAMES);
        const city = randomItem(NZ_CITIES);
        const email = `bot.provider.${i}.${batch}@bluetika.test`;
        const password = `BotPass${batch}!`;

        console.log(`Creating provider bot ${i + 1}/${providerCount}: ${email}`);

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
            is_bot: true
          }
        });

        if (authError || !authData.user) {
          results.failed++;
          results.errors.push(`Provider ${i}: ${authError?.message || "User creation failed"}`);
          console.error(`Provider ${i} auth error:`, authError);
          continue;
        }

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
          results.failed++;
          results.errors.push(`Provider ${i} profile: ${profileError.message}`);
          console.error(`Provider ${i} profile error:`, profileError);
          continue;
        }

        const { error: botError } = await supabaseAdmin.from("bot_accounts").insert({
          profile_id: authData.user.id,
          bot_type: "provider",
          generation_batch: batch,
          is_active: true
        });

        if (botError) {
          results.failed++;
          results.errors.push(`Provider ${i} bot_account: ${botError.message}`);
          console.error(`Provider ${i} bot_account error:`, botError);
          continue;
        }

        results.success++;
        console.log(`✓ Provider bot ${i + 1} created successfully`);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Provider ${i}: ${error.message || "Unknown error"}`);
        console.error(`Provider ${i} exception:`, error);
      }
    }

    // Generate client bots (80% - these post projects)
    for (let i = 0; i < clientCount; i++) {
      try {
        const firstName = randomItem(NZ_FIRST_NAMES);
        const lastName = randomItem(NZ_LAST_NAMES);
        const city = randomItem(NZ_CITIES);
        const email = `bot.client.${i}.${batch}@bluetika.test`;
        const password = `BotPass${batch}!`;

        console.log(`Creating client bot ${i + 1}/${clientCount}: ${email}`);

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
            is_bot: true
          }
        });

        if (authError || !authData.user) {
          results.failed++;
          results.errors.push(`Client ${i}: ${authError?.message || "User creation failed"}`);
          console.error(`Client ${i} auth error:`, authError);
          continue;
        }

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
          results.failed++;
          results.errors.push(`Client ${i} profile: ${profileError.message}`);
          console.error(`Client ${i} profile error:`, profileError);
          continue;
        }

        const { error: botError } = await supabaseAdmin.from("bot_accounts").insert({
          profile_id: authData.user.id,
          bot_type: "client",
          generation_batch: batch,
          is_active: true
        });

        if (botError) {
          results.failed++;
          results.errors.push(`Client ${i} bot_account: ${botError.message}`);
          console.error(`Client ${i} bot_account error:`, botError);
          continue;
        }

        results.success++;
        console.log(`✓ Client bot ${i + 1} created successfully`);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Client ${i}: ${error.message || "Unknown error"}`);
        console.error(`Client ${i} exception:`, error);
      }
    }

    console.log(`Bot generation complete: ${results.success} success, ${results.failed} failed`);
    return res.status(200).json(results);
  } catch (error: any) {
    console.error("Fatal error in bot generation:", error);
    return res.status(500).json({ 
      success: 0, 
      failed: 50, 
      errors: [error.message || "Unknown server error"] 
    });
  }
}