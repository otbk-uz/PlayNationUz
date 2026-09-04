// Uch qadah — kuzatuv o'yini. Uzuk qaysi qadah (piyola) ostida — aralashtirilgach top.
// Pseudo-3D: perspektiv stol, gumbaz qadahlar, soya, almashinuv arc bilan.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { cups: 3, swaps: 5, dur: 0.55, rounds: 3, name: 'Boshlang\'ich' },
    { cups: 3, swaps: 8, dur: 0.45, rounds: 3, name: 'Yengil' },
    { cups: 4, swaps: 10, dur: 0.40, rounds: 3, name: 'O\'rta' },
    { cups: 4, swaps: 13, dur: 0.32, rounds: 3, name: 'Tez' },
    { cups: 5, swaps: 16, dur: 0.26, rounds: 3, name: 'Usta' },
  ];

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let cups = [], ringCup = 0, phase = 'idle', roundsLeft = 0, roundsTotal = 0, msg = '';
  let swapQ = [], swapT = 0, swapA = -1, swapB = -1, revealT = 0, tableY = 0;

  function rand(seed) { let x = seed; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; }
  let rnd = Math.random;

  function slotX(slot, n) { const spread = Math.min(W * 0.62, n * 130); return W / 2 + (slot - (n - 1) / 2) * (spread / Math.max(1, n - 1) || 0); }

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    cups = []; for (let s = 0; s < L.cups; s++) cups.push({ slot: s, x: 0, lift: 0 });
    ringCup = Math.floor(Math.random() * L.cups);
    roundsTotal = L.rounds; roundsLeft = L.rounds; msg = ''; state = 'play'; flashT = 0;
    fit(); startRound();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('roundPill').textContent = '🔎 ' + (roundsTotal - roundsLeft + (phase === 'done' ? 0 : 1)) + '/' + roundsTotal;
    document.getElementById('statePill').textContent = phase === 'reveal' ? 'Eslab qol!' : phase === 'shuffle' ? 'Kuzat…' : phase === 'guess' ? 'Qaysi biri?' : LEVELS[levelIdx].name;
  }
  function startRound() {
    const L = LEVELS[levelIdx];
    for (const c of cups) c.lift = 0;
    // qadahlarni slotlar bo'yicha tartibla
    cups.sort((a, b) => a.slot - b.slot);
    ringCup = Math.floor(Math.random() * cups.length);
    phase = 'reveal'; revealT = 0; msg = 'Uzuk shu yerda!';
    // almashinuv navbatini tayyorla
    swapQ = []; let slots = cups.length;
    for (let k = 0; k < L.swaps; k++) { let a = Math.floor(Math.random() * slots), b = Math.floor(Math.random() * slots); if (a === b) b = (b + 1) % slots; swapQ.push([a, b]); }
    updateHud();
  }
  function beginShuffle() { phase = 'shuffle'; msg = ''; nextSwap(); }
  function nextSwap() {
    if (!swapQ.length) { phase = 'guess'; msg = 'Uzuk qaysi qadahda?'; updateHud(); return; }
    const [a, b] = swapQ.shift(); swapA = a; swapB = b; swapT = 0;
    if (window.SFX) SFX.tone(300, 0.04, { type: 'sine', vol: 0.05 });
    updateHud();
  }
  function guess(slot) {
    if (state !== 'play' || phase !== 'guess') return;
    const picked = cups.find(c => c.slot === slot); if (!picked) return;
    const correct = cups.indexOf(picked) === ringCup;
    // uzuk turgan qadahni ko'tar
    const rc = cups[ringCup]; rc.lift = 1; picked.lift = 1;
    if (correct) { if (window.SFX) SFX.coin(); const rx = slotX(rc.slot, cups.length); if (window.FX) FX.burst(rx, tableY - 30, '#8dffb0', 16);
      roundsLeft--; flashT = 0.35; phase = 'done';
      if (roundsLeft <= 0) return setTimeout(() => win(), 900);
      msg = 'Topding! ✓'; setTimeout(() => { if (state === 'play') startRound(); }, 1000);
    } else { if (window.SFX) SFX.hit(); if (window.FX) FX.shake(6); flashT = 0.4; phase = 'done'; msg = 'Xato! Qaytadan.';
      setTimeout(() => { if (state === 'play') load(levelIdx); }, 1200); }
    updateHud();
  }
  function win() { state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 O\'tkir ko\'z!', "Barcha bosqichda uzukni yo'qotmay kuzatding — diqqating zo'r!", '↻ Qaytadan'), 1100); }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt;
    for (const c of cups) { const tx = slotX(c.slot, cups.length); c.x += (tx - c.x) * Math.min(1, dt * 14); if (phase !== 'reveal' && phase !== 'done') c.lift += (0 - c.lift) * Math.min(1, dt * 10); }
    if (state !== 'play') return;
    if (phase === 'reveal') {
      revealT += dt; const rc = cups[ringCup]; rc.lift = Math.min(1, revealT / 0.4); if (revealT > 1.1) { rc.lift = 0; beginShuffle(); }
    } else if (phase === 'shuffle') {
      swapT += dt; const L = LEVELS[levelIdx]; const u = Math.min(1, swapT / L.dur);
      const ca = cups.find(c => c.slot === swapA), cb = cups.find(c => c.slot === swapB);
      if (ca && cb) { const xa = slotX(swapA, cups.length), xb = slotX(swapB, cups.length);
        ca.x = xa + (xb - xa) * u; cb.x = xb + (xa - xb) * u; ca.arc = Math.sin(u * Math.PI) * 18; cb.arc = -Math.sin(u * Math.PI) * 6; }
      if (u >= 1) { if (ca && cb) { const t = ca.slot; ca.slot = cb.slot; cb.slot = t; ca.arc = 0; cb.arc = 0; } nextSwap(); }
    }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tableY = H * 0.56; for (const c of cups) c.x = slotX(c.slot, cups.length);
  }
  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a2038'); bg.addColorStop(1, '#3d2e28');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // stol (perspektiv ellips)
    ctx.save(); ctx.fillStyle = '#5a4632'; ctx.beginPath(); ctx.ellipse(W / 2, tableY + 20, W * 0.42, 70, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(W / 2, tableY + 26, W * 0.42, 70, 0, 0, 7); ctx.fill(); ctx.restore();
    // uzuk (ko'tarilgan qadah ostida ko'rinadi)
    const sorted = [...cups].sort((a, b) => a.x - b.x);
    // avval uzukni chiz (agar qadahi ko'tarilgan)
    const rc = cups[ringCup]; if (rc.lift > 0.2) drawRing(rc.x, tableY);
    for (const c of sorted) drawCup(c);
    if (window.FX) FX.render(ctx);
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(26, W / 18)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.24); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : (phase === 'done' && msg.indexOf('Xato') >= 0) ? '255,90,90' : '141,255,180'; ctx.fillStyle = `rgba(${col},${Math.min(.28, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawRing(x, y) {
    ctx.save(); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 5; ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(x, y - 6, 13, 7, 0, 0, 7); ctx.stroke(); ctx.restore();
  }
  function drawCup(c) {
    const R = Math.min(1.5, W / 560); const x = c.x, lift = c.lift * 46 * R + (c.arc || 0); const baseY = tableY - lift;
    // soya
    ctx.fillStyle = `rgba(0,0,0,${0.3 * (1 - c.lift * 0.5)})`; ctx.beginPath(); ctx.ellipse(x, tableY + 8, 34 * R, 11 * R, 0, 0, 7); ctx.fill();
    // qadah (gumbaz)
    const g = ctx.createLinearGradient(x - 30 * R, baseY - 60 * R, x + 30 * R, baseY);
    g.addColorStop(0, '#e07b4a'); g.addColorStop(0.5, '#c85f30'); g.addColorStop(1, '#9a4620');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 30 * R, baseY);
    ctx.bezierCurveTo(x - 30 * R, baseY - 66 * R, x + 30 * R, baseY - 66 * R, x + 30 * R, baseY);
    ctx.closePath(); ctx.fill();
    // og'iz ellipsi
    ctx.fillStyle = '#7a3818'; ctx.beginPath(); ctx.ellipse(x, baseY, 30 * R, 9 * R, 0, 0, 7); ctx.fill();
    // yaltiroq
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(x - 9 * R, baseY - 34 * R, 6 * R, 18 * R, -0.2, 0, 7); ctx.fill();
    // uchidagi tugma
    ctx.fillStyle = '#e8a860'; ctx.beginPath(); ctx.arc(x, baseY - 62 * R, 5 * R, 0, 7); ctx.fill();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('uch-qadah'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  function pt(e) { const r = cv.getBoundingClientRect(); const c = e.touches ? e.touches[0] : e; return { x: c.clientX - r.left, y: c.clientY - r.top }; }
  function pick(e) { if (e) e.preventDefault(); if (phase !== 'guess') return; const p = pt(e);
    // eng yaqin qadahni topa
    let best = null, bd = 1e9; for (const c of cups) { const d = Math.abs(p.x - c.x); if (d < bd) { bd = d; best = c; } }
    if (best && bd < 60 * Math.min(1.5, W / 560)) guess(best.slot);
  }
  cv.addEventListener('mousedown', pick); cv.addEventListener('touchstart', pick, { passive: false });
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); else if (phase === 'guess' && /Digit[1-5]/.test(e.code)) { const s = +e.code.slice(5) - 1; if (s < cups.length) guess(s); } });

  window.UQ_TEST = {
    info: () => ({ level: levelIdx + 1, phase, roundsLeft, roundsTotal, cups: cups.length }),
    state: () => state,
    // uzuk turgan qadahning hozirgi sloti (test uchun)
    ringSlot: () => cups[ringCup] ? cups[ringCup].slot : -1,
    guessSlot: (s) => guess(s)
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
