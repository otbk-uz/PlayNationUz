import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://gxbiznuvinnfitppovsd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_twgNdvLwFh1gbMpqCSp0UA_OrbLMIrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadAllGames() {
  console.log("Authenticating developer session with Supabase...");

  // Sign in or sign up dev account
  const email = `maroqli_admin_dev@maroqli.uz`;
  const password = "MaroqliDev2026!SecurePassword";

  let userId = null;

  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData?.user) {
    userId = signInData.user.id;
    console.log("Signed in existing developer user:", userId);
  } else {
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpErr || !signUpData.user) {
      console.error("Failed to authenticate with Supabase:", signUpErr);
      return;
    }
    userId = signUpData.user.id;
    console.log("Created new developer user:", userId);
  }

  // Ensure profile has GAMEDEV role
  await supabase.from('profiles').upsert({
    id: userId,
    username: 'Maroqli_Official',
    full_name: 'Maroqli.uz Platform',
    role: 'GAMEDEV'
  });

  const gamesDir = 'd:/project/maroqli-uz/public/games-online';
  const dirs = fs.readdirSync(gamesDir).filter(f => {
    return fs.statSync(path.join(gamesDir, f)).isDirectory() && f !== '_template';
  });

  console.log(`Uploading ${dirs.length} games to Supabase DB...`);

  const gamesToInsert = [];

  for (const dir of dirs) {
    const fullPath = path.join(gamesDir, dir);
    const readmePath = path.join(fullPath, 'README.txt');
    const indexPath = path.join(fullPath, 'index.html');
    
    let title = dir.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let description = `${title} — qiziqarli va sarguzashtli onlayn brauzer o'yini. Platformamizda bepul o'ynang!`;
    
    if (fs.existsSync(readmePath)) {
      const readmeText = fs.readFileSync(readmePath, 'utf8');
      const lines = readmeText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const firstLine = lines[0].replace(/[\=\-\_\—\–].*/, '').trim();
        if (firstLine) title = firstLine;
      }
      const descLines = lines.filter(l => !l.includes('=') && !l.includes('TARKIB') && !l.includes('QANDAY') && !l.includes('UzIndieGame'));
      if (descLines.length > 1) {
        description = descLines.slice(1, 4).join(' ');
      }
    }

    if (fs.existsSync(indexPath)) {
      const htmlText = fs.readFileSync(indexPath, 'utf8');
      const match = htmlText.match(/<title>(.*?)<\/title>/i);
      if (match && match[1]) {
        const parsedTitle = match[1].replace(/—.*/, '').replace(/-.*/, '').trim();
        if (parsedTitle && parsedTitle.length < 40) title = parsedTitle;
      }
    }

    let cover = `/games-online/${dir}/covers/${dir}.png`;
    const coversDir = path.join(fullPath, 'covers');
    if (fs.existsSync(coversDir)) {
      const coverFiles = fs.readdirSync(coversDir).filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
      if (coverFiles.length > 0) {
        cover = `/games-online/${dir}/covers/${coverFiles[0]}`;
      }
    } else {
      cover = null;
    }

    gamesToInsert.push({
      developer_id: userId,
      title: title,
      slug: dir,
      price: 0,
      premium_price: 0,
      platform: 'WEB',
      description: description,
      language: "O'zbek",
      sys_requirements: 'Brauzer (Chrome, Firefox, Safari, Edge)',
      demo_url: `/games-online/${dir}/index.html`,
      cover: cover,
      rating: 5.0
    });
  }

  // Upload games in batches of 10
  let uploadedCount = 0;
  for (let i = 0; i < gamesToInsert.length; i += 10) {
    const batch = gamesToInsert.slice(i, i + 10);
    const { data, error } = await supabase
      .from('developed_games')
      .upsert(batch, { onConflict: 'slug' })
      .select('id, slug, title');

    if (error) {
      console.error(`Batch ${i / 10 + 1} upload error:`, error);
    } else {
      uploadedCount += (data?.length || batch.length);
      console.log(`Batch ${i / 10 + 1} uploaded successfully (${batch.length} games).`);
    }
  }

  console.log(`\n🎉 SUCCESS! Total ${uploadedCount} / ${gamesToInsert.length} HTML5 games uploaded directly into Supabase DB!`);
}

uploadAllGames();
