import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://gxbiznuvinnfitppovsd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_twgNdvLwFh1gbMpqCSp0UA_OrbLMIrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function upload() {
  console.log("Checking Supabase connection...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, role').limit(5);
  console.log("Profiles result:", profiles, pErr);

  // Let's get dev_id
  let devId = null;
  if (profiles && profiles.length > 0) {
    const admin = profiles.find(p => p.role === 'ADMIN' || p.role === 'GAMEDEV');
    devId = admin ? admin.id : profiles[0].id;
  }
  console.log("Selected devId:", devId);

  // Read games JSON or parse sql
  // Let's check existing games in Supabase
  const { data: existingGames, error: gErr } = await supabase.from('developed_games').select('id, slug, title').limit(10);
  console.log("Existing games count / sample:", existingGames?.length, existingGames, gErr);
}

upload();
