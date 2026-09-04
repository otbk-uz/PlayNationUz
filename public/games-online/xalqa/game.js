// Xalqa otish — nishonga xalqa (halqa) otish. Aim + masofani sozlab qoziqqa ilib ol.
// Pseudo-3D: perspektiv maydon, qoziqlar chuqurlikda, uchayotgan xalqa soya+arc bilan.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { pegs: 4, rings: 7, target: 3, catch: 0.17, aim: 0.9, pow: 0.8, name: 'Yaqin' },
    { pegs: 5, rings: 7, target: 4, catch: 0.15, aim: 1.05, pow: 0.95, name: 'O\'rta' },
    { pegs: 5, rings: 7, target: 5, catch: 0.13, aim: 1.2, pow: 1.1, name: 'Uzoq' },
    { pegs: 6, rings: 8, target: 5, catch: 0.12, aim: 1.35, pow: 1.25, name: 'Aniq' },
    { pegs: 6, rings: 8, target: 6, catch: 0.11, aim: 1.5, pow: 1.4, name: 'Usta' },
  ];

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let pegs = [], ringsLeft = 0, target = 0, ringed = 0, phase = 'aim', aim = 0, pow = 0, fly = null, msg = '';
  let horizonY = 0, nearY = 0;

  function rand(seed) { let x = seed; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; }

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; const rnd = rand(7000 + idx * 53);
    pegs = []; for (let i = 0; i < L.pegs; i++) { const x = -0.75 + rnd() * 1.5, z = 0.28 + rnd() * 0.66; pegs.push({ x, z, ringed: false }); }
    ringsLeft = L.rings; target = Math.min(L.target, L.pegs); ringed = 0; phase = 'aim'; aim = 0; pow = 0; fly = null; msg = '';
    state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('ringPill').textContent = '⭕ ' + ringsLeft;
    document.getElementById('statePill').textContent = '🎯 ' + ringed + '/' + target;
  }

  function tossTo(x, z) {
    if (state !== 'play' || fly) return;
    fly = { x0: 0, z0: 0, x, z, t: 0, dur: 0.5 + z * 0.5, spin: 0 };
    phase = 'fly'; ringsLeft--; if (window.SFX) SFX.tone(300, 0.08, { type: 'sine', vol: 0.1, to: 500 });
    updateHud();
  }
  function action() {
    if (state !== 'play') return;
    if (phase === 'aim') { phase = 'power'; if (window.SFX) SFX.tone(480, 0.05, { type: 'triangle', vol: 0.09 }); }
    else if (phase === 'power') { tossTo(aim, pow); }
  }
  function land() {
    // eng yaqin ilinmagan qoziq
    const L = LEVELS[levelIdx]; let best = null, bd = 1e9;
    for (const p of pegs) if (!p.ringed) { const d = Math.hypot(p.x - fly.x, (p.z - fly.z) * 1.4); if (d < bd) { bd = d; best = p; } }
    const pt = proj(fly.x, fly.z);
    if (best && bd < L.catch) { best.ringed = true; ringed++; if (window.SFX) SFX.coin(); if (window.FX) FX.burst(pt.x, pt.y, '#8dffb0', 16); }
    else { if (window.SFX) SFX.tone(160, 0.1, { type: 'square', vol: 0.06 }); if (window.FX) FX.burst(pt.x, pt.y, '#c9a05a', 8); }
    fly = null; phase = 'aim'; aim = 0; pow = 0;
    updateHud();
    if (ringed >= target) return win();
    if (ringsLeft <= 0) return lose();
  }
  function win() { state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Aniq nishonchi!', "Barcha bosqichda xalqalarni qoziqqa ilding — nishonda tengsizsan!", '↻ Qaytadan'), 1100); }
  function lose() { state = 'lost'; flashT = 0.5; msg = 'Xalqalar tugadi (' + ringed + '/' + target + '). Qaytadan.'; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(6);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1200); }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    const L = LEVELS[levelIdx];
    if (phase === 'aim') aim = Math.sin(tm * L.aim) * 0.85;
    else if (phase === 'power') pow = 0.28 + (Math.sin(tm * L.pow) * 0.5 + 0.5) * 0.66;
    else if (phase === 'fly') { fly.t += dt; fly.spin += dt * 12; if (fly.t >= fly.dur) return land(); }
  }

  // ── perspektiv ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizonY = H * 0.30; nearY = H * 0.80;
  }
  const nearHW = () => W * 0.44, farHW = () => W * 0.12;
  function proj(x, z) { const t = Math.max(0, Math.min(1, z)); const y = nearY + (horizonY - nearY) * t; const hw = nearHW() * (1 - t) + farHW() * t; return { x: W / 2 + x * hw, y, sc: 1 - t * 0.62 }; }

  function render() {
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 20); sky.addColorStop(0, '#2a2038'); sky.addColorStop(1, '#4a3a55');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizonY + 20);
    if (state === 'menu') return;
    // maydon
    const nl = proj(-1, 0), nr = proj(1, 0), fl = proj(-1, 1), fr = proj(1, 1);
    ctx.beginPath(); ctx.moveTo(nl.x, nl.y); ctx.lineTo(fl.x, fl.y); ctx.lineTo(fr.x, fr.y); ctx.lineTo(nr.x, nr.y); ctx.closePath();
    const fg = ctx.createLinearGradient(0, horizonY, 0, nearY); fg.addColorStop(0, '#3a5240'); fg.addColorStop(1, '#557049'); ctx.fillStyle = fg; ctx.fill();
    for (let i = 1; i <= 4; i++) { const a = proj(-1, i / 5), b = proj(1, i / 5); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    // qoziqlar (uzoqdan yaqinga)
    const sorted = [...pegs].sort((a, b) => b.z - a.z);
    for (const p of sorted) drawPeg(p);
    // uchayotgan xalqa
    if (fly) drawFlyRing();
    // otuvchi qo'l
    drawThrower();
    if (window.FX) FX.render(ctx);
    // metrlar
    if (phase === 'aim' || phase === 'power') drawMeters();
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.92); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawPeg(p) {
    const b = proj(p.x, p.z); const sc = b.sc * Math.min(1.5, W / 520); const hgt = 46 * sc;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 12 * sc, 5 * sc, 0, 0, 7); ctx.fill();
    // qoziq
    const g = ctx.createLinearGradient(b.x - 5 * sc, 0, b.x + 5 * sc, 0); g.addColorStop(0, '#c88a4a'); g.addColorStop(1, '#8a5a2b');
    ctx.fillStyle = g; ctx.fillRect(b.x - 4 * sc, b.y - hgt, 8 * sc, hgt);
    ctx.fillStyle = '#e0a860'; ctx.beginPath(); ctx.ellipse(b.x, b.y - hgt, 5 * sc, 2.5 * sc, 0, 0, 7); ctx.fill();
    // ilingan xalqalar
    if (p.ringed) { ctx.strokeStyle = '#8dffb0'; ctx.lineWidth = 4 * sc; ctx.beginPath(); ctx.ellipse(b.x, b.y - 8 * sc, 14 * sc, 6 * sc, 0, 0, 7); ctx.stroke();
      ctx.shadowColor = '#8dffb0'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0; }
  }
  function drawFlyRing() {
    const u = fly.t / fly.dur; const x = fly.x0 + (fly.x - fly.x0) * u, z = fly.z0 + (fly.z - fly.z0) * u;
    const p = proj(x, z); const arc = Math.sin(u * Math.PI) * H * 0.18; const y = p.y - arc; const sc = p.sc * Math.min(1.5, W / 520);
    // soya
    ctx.fillStyle = `rgba(0,0,0,${0.28 * (1 - Math.sin(u * Math.PI) * 0.6)})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, 13 * sc, 5 * sc, 0, 0, 7); ctx.fill();
    // xalqa (perspektivada egilgan ellips, aylanadi)
    ctx.save(); ctx.translate(x < fly.x ? p.x : p.x, y); ctx.rotate(fly.spin * 0.3);
    ctx.strokeStyle = '#ff5a72'; ctx.lineWidth = 5 * sc; ctx.beginPath(); ctx.ellipse(0, 0, 15 * sc, 8 * sc, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2 * sc; ctx.beginPath(); ctx.ellipse(0, 0, 15 * sc, 8 * sc, 0, -2.4, -0.6); ctx.stroke();
    ctx.restore();
  }
  function drawThrower() {
    const R = Math.min(1.4, W / 560); const x = W / 2, y = nearY + 8;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + 12 * R, 20 * R, 6 * R, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(x, y - 40 * R, x, y); g.addColorStop(0, '#5fe0ff'); g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g; rr(x - 10 * R, y - 36 * R, 20 * R, 36 * R, 7 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, y - 42 * R, 8 * R, 0, 7); ctx.fill();
    // qo'lidagi xalqa (agar tayyor)
    if (phase !== 'fly' && ringsLeft > 0) { ctx.strokeStyle = '#ff5a72'; ctx.lineWidth = 4 * R; ctx.beginPath(); ctx.ellipse(x + 12 * R, y - 24 * R, 9 * R, 5 * R, 0, 0, 7); ctx.stroke(); }
  }
  function drawMeters() {
    const L = LEVELS[levelIdx];
    if (phase === 'aim') {
      // aim: gorizontal ko'rsatkich yuqorida
      const a = proj(aim, 0.5); ctx.strokeStyle = 'rgba(255,220,120,.8)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x, horizonY); ctx.lineTo(a.x, nearY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(a.x, nearY - 40); ctx.lineTo(a.x - 8, nearY - 54); ctx.lineTo(a.x + 8, nearY - 54); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 ' + Math.round(Math.min(18, W / 26)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Bos — YO\'NALISH (chap-o\'ng)', W / 2, horizonY - 14);
    } else {
      // power: masofa ko'rsatkichi (near->far)
      const p = proj(aim, pow); ctx.fillStyle = 'rgba(141,255,180,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, 10 * p.sc, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(141,255,180,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 16 * p.sc, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 ' + Math.round(Math.min(18, W / 26)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Bos — MASOFA (yashil nuqta qoziqqa tushsin)', W / 2, horizonY - 14);
    }
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('xalqa'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doAct = e => { if (e) e.preventDefault(); action(); };
  cv.addEventListener('mousedown', doAct); cv.addEventListener('touchstart', doAct, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doAct); actBtn.addEventListener('touchstart', doAct, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doAct(e); else if (e.code === 'KeyR') reset(); });

  window.XA_TEST = {
    info: () => ({ level: levelIdx + 1, ringsLeft, ringed, target, phase }),
    state: () => state, pegs: () => pegs.map(p => ({ x: p.x, z: p.z, ringed: p.ringed })),
    tossTo: (x, z) => { if (phase === 'aim' || phase === 'power') tossTo(x, z); }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
