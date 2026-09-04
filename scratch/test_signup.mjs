import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gxbiznuvinnfitppovsd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_twgNdvLwFh1gbMpqCSp0UA_OrbLMIrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  const email = `tempdev_${Date.now()}@maroqli.uz`;
  const password = "Password123!";

  console.log("Creating temp user:", email);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpErr) {
    console.error("SignUp error:", signUpErr);
    return;
  }

  console.log("Signed up user:", signUpData.user?.id);

  // Set profile role to GAMEDEV
  if (signUpData.user) {
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: signUpData.user.id,
      username: `dev_${Date.now()}`,
      full_name: 'Temp Developer',
      role: 'GAMEDEV'
    });
    console.log("Profile update result:", profErr);

    // Try inserting a test game
    const { data: gameData, error: gameErr } = await supabase.from('developed_games').upsert({
      developer_id: signUpData.user.id,
      title: 'Test Web Game',
      slug: 'test-web-game',
      price: 0,
      platform: 'WEB',
      description: 'Test description'
    });

    console.log("Game insert result:", gameData, gameErr);
  }
}

testAuth();
