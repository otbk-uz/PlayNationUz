// Yumronqoziq — reaksiya o'yini. Inidan chiqqan yumronqozizni tez ur, chumchuqni urma.
// Pseudo-3D: 2.5D izometrik maydon, inlar, ko'tarilib chiqadigan personaj + soya.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { time: 25, target: 12, up: 1.15, gap: 0.85, bird: 0, name: 'Boshlang\'ich' },
    { time: 25, target: 18, up: 1.00, gap: 0.68, bird: 0, name: 'Yengil' },
    { time: 28, target: 24, up: 0.90, gap: 0.55, bird: 0.18, name: 'O\'rta' },
    { time: 28, target: 30, up: 0.78, gap: 0.45, bird: 0.24, name: 'Tez' },
    { time: 30, target: 38, up: 0.66, gap: 0.36, bird: 0.30, name: 'Usta' },
  ];
  const GR = 3, GC = 3; // 3x3 in

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let holes = [], score = 0, target = 0, timeLeft = 0, spawnT = 0, msg = '', combo = 0;
  let ox = 0, oy = 0, scale = 1, TW = 92, TH = 52;

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; target = L.target; score = 0; timeLeft = L.time; combo = 0;
    holes = []; for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) holes.push({ r, c, st: 'empty', t: 0, up: 0, bird: false, hitT: 0 });
    spawnT = 0.5; msg = ''; state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('timePill').textContent = '⏱ ' + Math.ceil(timeLeft);
    document.getElementById('statePill').textContent = '🔨 ' + score + '/' + target;
  }

  function spawn() {
    const L = LEVELS[levelIdx];
    const empty = holes.filter(h => h.st === 'empty'); if (!empty.length) return;
    const h = empty[Math.floor(Math.random() * empty.length)];
    h.st = 'rising'; h.t = 0; h.up = 0; h.bird = Math.random() < L.bird; h.hitT = 0;
  }
  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; return (score >= target ? win() : lose()); }
    const L = LEVELS[levelIdx];
    spawnT -= dt; if (spawnT <= 0) { spawn(); spawnT = L.gap * (0.7 + Math.random() * 0.6); }
    for (const h of holes) {
      if (h.hitT > 0) { h.hitT -= dt; if (h.hitT <= 0) h.st = 'empty'; continue; }
      if (h.st === 'rising') { h.up += dt / 0.14; if (h.up >= 1) { h.up = 1; h.st = 'up'; h.t = 0; } }
      else if (h.st === 'up') { h.t += dt; if (h.t >= L.up) { h.st = 'hiding'; } }
      else if (h.st === 'hiding') { h.up -= dt / 0.16; if (h.up <= 0) { h.up = 0; h.st = 'empty'; } }
    }
    if (score >= target) return win();
    updateHud();
  }
  function whack(h) {
    if (h.bird) { // chumchuqni urish — jarima
      combo = 0; score = Math.max(0, score - 1); h.st = 'hiding'; flashT = 0.3;
      if (window.SFX) SFX.tone(180, 0.12, { type: 'sawtooth', vol: 0.12, to: 80 }); if (window.FX) { const p = iso(h.r, h.c); FX.burst(p.x, p.y - 20, '#ffd24a', 12); }
      updateHud(); return;
    }
    combo = Math.min(9, combo + 1); score++; h.st = 'hit'; h.hitT = 0.25;
    if (window.SFX) SFX.tone(400 + combo * 40, 0.06, { type: 'square', vol: 0.12, to: 700 });
    const p = iso(h.r, h.c); if (window.FX) FX.burst(p.x, p.y - 22, '#8dffb0', 12);
    updateHud();
    if (score >= target) return win();
  }
  function win() { if (state !== 'play') return; state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Chaqqon qo\'l!', "Barcha bosqichda yumronqozizlarni ilg'ading — reaksiyada tengsizsan!", '↻ Qaytadan'), 1100); }
  function lose() { state = 'lost'; flashT = 0.5; msg = 'Vaqt tugadi (' + score + '/' + target + '). Qaytadan.'; if (window.SFX) SFX.death(); if (window.FX) FX.shake(7);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1200); }

  // ── iso ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mapW = (GR + GC) * TW / 2, mapH = (GR + GC) * TH / 2;
    scale = Math.min(1.3, (W - 40) / mapW, (H - 260) / mapH); scale = Math.max(0.55, scale);
    ox = W / 2; oy = (H - 150) / 2 - (GR + GC) * TH / 4 * scale + 30;
  }
  function iso(r, c) { return { x: ox + (c - r) * TW / 2 * scale, y: oy + (c + r) * TH / 2 * scale }; }

  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#243a52'); bg.addColorStop(0.6, '#3a5442'); bg.addColorStop(1, '#4a6a3e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // maydon (yaxlit yashil disk)
    const c0 = iso((GR - 1) / 2, (GC - 1) / 2);
    ctx.save(); ctx.fillStyle = '#5a7a44'; ctx.beginPath(); ctx.ellipse(c0.x, c0.y, (GR + GC) * TW / 4 * scale + 40 * scale, (GR + GC) * TH / 4 * scale + 24 * scale, 0, 0, 7); ctx.fill(); ctx.restore();
    // inlar + personajlar (uzoqdan yaqinga)
    const sorted = [...holes].sort((a, b) => (a.r + a.c) - (b.r + b.c));
    for (const h of sorted) drawHole(h);
    for (const h of sorted) if (h.up > 0.01 || h.st === 'hit') drawGopher(h);
    if (window.FX) FX.render(ctx);
    if (combo >= 3 && state === 'play') { ctx.fillStyle = 'rgba(141,255,180,.85)'; ctx.font = '800 ' + Math.round(Math.min(22, W / 24)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('KOMBO x' + combo, W / 2, H * 0.16); }
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.9); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : state === 'lost' ? '255,90,90' : '255,200,80'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawHole(h) {
    const p = iso(h.r, h.c); const w = 30 * scale, hh = 15 * scale;
    ctx.fillStyle = '#2c2016'; ctx.beginPath(); ctx.ellipse(p.x, p.y, w, hh, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3e2c1c'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 2 * scale, w * 0.92, hh * 0.9, 0, 0, 7); ctx.fill();
  }
  function drawGopher(h) {
    const p = iso(h.r, h.c); const s = scale; const rise = h.up * 30 * s; const y = p.y - rise;
    ctx.save();
    if (h.bird) {
      // chumchuq (urma!)
      const g = ctx.createLinearGradient(p.x, y - 30 * s, p.x, y); g.addColorStop(0, '#ffd24a'); g.addColorStop(1, '#e0921f');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, y - 12 * s, 15 * s, 17 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff7a3a'; ctx.beginPath(); ctx.moveTo(p.x - 15 * s, y - 12 * s); ctx.lineTo(p.x - 24 * s, y - 10 * s); ctx.lineTo(p.x - 15 * s, y - 7 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(p.x - 5 * s, y - 16 * s, 2.4 * s, 0, 7); ctx.fill();
    } else {
      // yumronqoziq
      const flat = h.st === 'hit' ? 0.5 : 1;
      const g = ctx.createLinearGradient(p.x, y - 34 * s, p.x, y); g.addColorStop(0, '#b08a5a'); g.addColorStop(1, '#7a5c34');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, y - 14 * s * flat, 16 * s, 19 * s * flat, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8d0a8'; ctx.beginPath(); ctx.ellipse(p.x, y - 8 * s * flat, 9 * s, 9 * s * flat, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(p.x - 5 * s, y - 18 * s * flat, 2.2 * s, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 5 * s, y - 18 * s * flat, 2.2 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#5a3c1c'; ctx.beginPath(); ctx.arc(p.x, y - 13 * s * flat, 2 * s, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('yumronqoziq'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  function hitAt(cx, cy) {
    if (state !== 'play') return;
    let best = null, bd = 1e9;
    for (const h of holes) { if (h.st !== 'up' && h.st !== 'rising') continue; const p = iso(h.r, h.c); const d = Math.hypot(cx - p.x, cy - (p.y - h.up * 30 * scale - 14 * scale)); if (d < 40 * scale && d < bd) { bd = d; best = h; } }
    if (best) whack(best);
  }
  function pt(e) { const r = cv.getBoundingClientRect(); const c = e.touches ? e.touches[0] : e; return { x: c.clientX - r.left, y: c.clientY - r.top }; }
  cv.addEventListener('mousedown', e => { e.preventDefault(); const p = pt(e); hitAt(p.x, p.y); });
  cv.addEventListener('touchstart', e => { e.preventDefault(); const p = pt(e); hitAt(p.x, p.y); }, { passive: false });
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); });

  window.YQ_TEST = {
    info: () => ({ level: levelIdx + 1, score, target, timeLeft: +timeLeft.toFixed(1), combo }),
    state: () => state,
    upHoles: () => holes.map((h, i) => ({ i, st: h.st, bird: h.bird })).filter(h => h.st === 'up' || h.st === 'rising'),
    whackIndex: (i) => { const h = holes[i]; if (h && (h.st === 'up' || h.st === 'rising')) whack(h); }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
