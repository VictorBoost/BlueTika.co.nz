require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('- Service Key length:', supabaseServiceKey?.length || 0);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing required environment variables!');
  console.error('Please check .env.local file for:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const NZ_FIRST_NAMES = [
  "Aroha", "Hemi", "Kiri", "Matiu", "Ngaire", "Rawiri", "Tane", "Whetu",
  "James", "Sophie", "Liam", "Emma", "Oliver", "Charlotte", "Mason", "Amelia",
  "Jack", "Mia", "Noah", "Harper", "Lucas", "Isla", "Cooper", "Grace",
  "Hunter", "Zoe", "Joshua", "Ruby", "Ryan", "Lily", "Cameron", "Ella",
  "Thomas", "Hannah", "Benjamin", "Olivia", "Samuel", "Ava", "William", "Chloe"
];

const NZ_LAST_NAMES = [
  "Smith", "Brown", "Wilson", "Taylor", "Anderson", "Thomas", "Jackson", "White",
  "Harris", "Martin", "Thompson", "Young", "Walker", "Clark", "Wright", "Green",
  "Hall", "Hughes", "King", "Lee", "Robinson", "Wood", "Campbell", "Mitchell",
  "Te Rangi", "Ngata", "Takerei", "Parata", "Kingi", "Tamati", "Matene", "Rata",
  "Patel", "Singh", "Wong", "Chen", "Kumar", "Li", "Zhang", "Kim"
];

const NZ_CITIES = [
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
  "Dunedin", "Palmerston North", "Napier", "Nelson", "Rotorua"
];

const PROVIDER_BIOS = [
  "Experienced professional with 5+ years in the industry. Quality workmanship guaranteed.",
  "Licensed and insured. Providing top-notch service across the greater {city} area.",
  "Family-owned business serving Kiwi homes since 2015. Honest pricing, reliable service."
];

const CLIENT_BIOS = [
  "Homeowner looking for reliable service providers in {city}.",
  "Small business owner needing professional help for various projects.",
  "Looking for trusted tradies to help with home improvements."
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function generateBots(count = 50) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const batch = Date.now();
  const results = { success: 0, failed: 0, errors: [] };
  const providerCount = Math.floor(count * 0.4);
  const clientCount = count - providerCount;

  console.log(`🤖 Generating ${count} bots (${providerCount} providers, ${clientCount} clients)...`);

  // Generate provider bots
  for (let i = 0; i < providerCount; i++) {
    try {
      const firstName = randomItem(NZ_FIRST_NAMES);
      const lastName = randomItem(NZ_LAST_NAMES);
      const city = randomItem(NZ_CITIES);
      const email = `bot.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${batch}.${i}@bluetika.test`;
      const password = `BotPass${batch}!`;
      const fullName = `${firstName} ${lastName}`;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          is_bot: true
        }
      });

      if (authError || !authData.user) {
        results.failed++;
        const errorMsg = `Provider ${i}: ${authError?.message || 'Unknown auth error'}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        continue;
      }

      // Update profile
      const { error: profileError } = await supabase.from("profiles").update({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        city_region: city,
        location: city,
        phone_number: `021 ${randomInRange(100, 999)} ${randomInRange(1000, 9999)}`,
        is_client: true,
        is_provider: true,
        verification_status: "approved",
        bio: randomItem(PROVIDER_BIOS).replace("{city}", city)
      }).eq("id", authData.user.id);

      if (profileError) {
        console.error(`⚠️ Profile update error for ${email}:`, profileError);
      }

      // Create bot account
      const { error: botError } = await supabase.from("bot_accounts").insert({
        profile_id: authData.user.id,
        bot_type: "service_provider",
        generation_batch: batch
      });

      if (botError) {
        console.error(`⚠️ Bot account creation error for ${email}:`, botError);
      }

      results.success++;
      process.stdout.write(`✅ Provider bot ${i + 1}/${providerCount}\r`);
    } catch (error) {
      results.failed++;
      const errorMsg = `Provider ${i}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`\n❌ ${errorMsg}`);
    }
  }

  console.log(`\n✅ Provider bots complete!`);

  // Generate client bots
  for (let i = 0; i < clientCount; i++) {
    try {
      const firstName = randomItem(NZ_FIRST_NAMES);
      const lastName = randomItem(NZ_LAST_NAMES);
      const city = randomItem(NZ_CITIES);
      const email = `bot.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${batch}.${i + providerCount}@bluetika.test`;
      const password = `BotPass${batch}!`;
      const fullName = `${firstName} ${lastName}`;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          is_bot: true
        }
      });

      if (authError || !authData.user) {
        results.failed++;
        const errorMsg = `Client ${i}: ${authError?.message || 'Unknown auth error'}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        continue;
      }

      // Update profile
      const { error: profileError } = await supabase.from("profiles").update({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        city_region: city,
        location: city,
        phone_number: `021 ${randomInRange(100, 999)} ${randomInRange(1000, 9999)}`,
        is_client: true,
        is_provider: false,
        bio: randomItem(CLIENT_BIOS).replace("{city}", city)
      }).eq("id", authData.user.id);

      if (profileError) {
        console.error(`⚠️ Profile update error for ${email}:`, profileError);
      }

      // Create bot account
      const { error: botError } = await supabase.from("bot_accounts").insert({
        profile_id: authData.user.id,
        bot_type: "client",
        generation_batch: batch
      });

      if (botError) {
        console.error(`⚠️ Bot account creation error for ${email}:`, botError);
      }

      results.success++;
      process.stdout.write(`✅ Client bot ${i + 1}/${clientCount}\r`);
    } catch (error) {
      results.failed++;
      const errorMsg = `Client ${i}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`\n❌ ${errorMsg}`);
    }
  }

  console.log(`\n\n🎉 Bot generation complete!`);
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0 && results.errors.length <= 10) {
    console.log(`\nErrors:`);
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  return results;
}

// Run it
generateBots(50).then(() => process.exit(0)).catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});