import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gxbiznuvinnfitppovsd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_twgNdvLwFh1gbMpqCSp0UA_OrbLMIrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findAdmin() {
  const { data, error } = await supabase.from('profiles').select('id, username, full_name, role').eq('role', 'GAMEDEV');
  console.log("GAMEDEV profiles:", data, error);
}

findAdmin();
