// Oq terak ko'k terak — jamoa yorib o'tish o'yini. Zaif bo'g'inni tanla, kuchni sozlab yorib o't.
// Pseudo-3D: perspektiv maydon, qo'l ushlashgan bolalar qatori, yugurib zarba.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { links: 5, target: 3, lives: 3, min: 0.25, max: 0.62, scan: 2.4, pow: 1.0, name: 'Ko\'cha' },
    { links: 5, target: 3, lives: 3, min: 0.30, max: 0.72, scan: 2.9, pow: 1.2, name: 'Mahalla' },
    { links: 6, target: 4, lives: 3, min: 0.34, max: 0.80, scan: 3.4, pow: 1.4, name: 'Tuman' },
    { links: 6, target: 4, lives: 2, min: 0.40, max: 0.86, scan: 3.9, pow: 1.6, name: 'Viloyat' },
    { links: 7, target: 5, lives: 2, min: 0.45, max: 0.92, scan: 4.4, pow: 1.9, name: 'Chempion' },
  ];
  const POW_MAX = 0.86; // eng kuchli zarba (0.86 dan kuchli bo'g'in yorilmaydi)

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let links = [], breaks = 0, target = 0, lives = 0, phase = 'select', hi = 0, sel = -1, pow = 0.3, msg = '';
  let runT = 0, runOk = false, lineY = 0;

  function newLinks() {
    const L = LEVELS[levelIdx]; links = [];
    for (let k = 0; k < L.links; k++) links.push({ str: L.min + Math.random() * (L.max - L.min), broken: false });
    // kamida bitta zaif bo'g'in bo'lsin (yechilishi uchun)
    links[Math.floor(Math.random() * links.length)].str = L.min;
  }
  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; target = L.target; lives = L.lives; breaks = 0;
    newLinks(); phase = 'select'; hi = 0; sel = -1; pow = 0.3; msg = ''; runT = 0; state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('breakPill').textContent = '💥 ' + breaks + '/' + target;
    document.getElementById('statePill').textContent = '❤ ' + lives + (phase === 'select' ? ' · zaifni tanla' : phase === 'charge' ? ' · kuch!' : '');
  }

  function action() {
    if (state !== 'play') return;
    if (phase === 'select') {
      const live = links.filter(l => !l.broken); if (!live.length) return;
      sel = Math.floor(hi) % links.length; while (links[sel] && links[sel].broken) sel = (sel + 1) % links.length;
      phase = 'charge'; pow = 0.3; if (window.SFX) SFX.tone(400, 0.05, { type: 'triangle', vol: 0.09 }); updateHud();
    } else if (phase === 'charge') {
      phase = 'run'; runT = 0; runOk = pow >= links[sel].str;
      if (window.SFX) SFX.tone(runOk ? 260 : 180, 0.12, { type: 'sawtooth', vol: 0.14, to: runOk ? 420 : 90 });
    }
  }
  function resolve() {
    if (runOk) { links[sel].broken = true; breaks++; flashT = 0.35;
      if (window.SFX) SFX.coin(); if (window.FX) FX.burst(linkX(sel), lineY, '#8dffb0', 20);
      if (breaks >= target) return win();
      msg = 'Yorib o\'tding! ✓'; setTimeout(() => { if (state === 'play') { newLinks(); phase = 'select'; sel = -1; msg = ''; updateHud(); } }, 900);
    } else { lives--; flashT = 0.4; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(8);
      if (lives <= 0) { msg = 'Yorib o\'tolmading! Qaytadan.'; setTimeout(() => { if (state === 'play') load(levelIdx); }, 1200); }
      else { msg = 'Qaytib ketding! (❤ ' + lives + ')'; setTimeout(() => { if (state === 'play') { phase = 'select'; sel = -1; msg = ''; updateHud(); } }, 1000); }
    }
    phase = 'result'; updateHud();
  }
  function win() { state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Yengilmas!', "Barcha jamoani yorib o'tding — kuch va ziyraklikda tengsizsan!", '↻ Qaytadan'), 1100); }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    const L = LEVELS[levelIdx];
    if (phase === 'select') { hi = (hi + L.scan * dt) % links.length; }
    else if (phase === 'charge') { pow = 0.3 + (Math.sin(tm * L.pow * 2.2) * 0.5 + 0.5) * (POW_MAX - 0.3); }
    else if (phase === 'run') { runT += dt; if (runT >= 0.5) return resolve(); }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lineY = H * 0.42;
  }
  function linkX(i) { const n = links.length; const spread = Math.min(W * 0.8, n * 120); return W / 2 + (i + 0.5 - n / 2) * (spread / n); }
  function kidX(i) { const n = links.length; const spread = Math.min(W * 0.8, n * 120); return W / 2 + (i - n / 2) * (spread / n); }
  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a3a58'); bg.addColorStop(0.5, '#3d5474'); bg.addColorStop(1, '#5a6f4a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    ctx.fillStyle = '#556e42'; ctx.fillRect(0, lineY + 30, W, H - lineY - 30);
    const R = Math.min(1.4, W / 620);
    const n = links.length;
    // qo'llar (bo'g'inlar) — qatordagi bolalar orasida
    for (let i = 0; i < n; i++) {
      const x = linkX(i), l = links[i];
      const hiSel = (phase === 'select' && Math.floor(hi) === i) || sel === i;
      if (l.broken) { ctx.strokeStyle = 'rgba(120,120,120,.4)'; ctx.setLineDash([4, 6]); }
      else { const s = l.str; ctx.strokeStyle = `hsl(${(1 - s) * 120}, 80%, ${hiSel ? 65 : 50}%)`; ctx.setLineDash([]); }
      ctx.lineWidth = (hiSel ? 8 : 5) * R; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(kidX(i) + 12 * R, lineY - 6 * R); ctx.lineTo(kidX(i + 1) - 12 * R, lineY - 6 * R); ctx.stroke(); ctx.setLineDash([]);
      // kuch belgisi (zaif=yashil)
      if (!l.broken && (phase === 'select' || phase === 'charge')) { ctx.fillStyle = `hsl(${(1 - l.str) * 120},80%,55%)`; ctx.beginPath(); ctx.arc(x, lineY - 26 * R, 4 * R, 0, 7); ctx.fill(); }
    }
    // bolalar (qator)
    for (let i = 0; i <= n; i++) drawKid(kidX(i), R, '#ff6a5a');
    // yuguruvchi (siz)
    drawRunner(R);
    if (window.FX) FX.render(ctx);
    // charge metri
    if (phase === 'charge') drawPow(R);
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.9); }
    if (flashT > 0) { const col = state === 'won' || (phase === 'result' && runOk) ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawKid(x, R, col) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, lineY + 24 * R, 12 * R, 4 * R, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(x, lineY - 30 * R, x, lineY + 20 * R); g.addColorStop(0, col); g.addColorStop(1, shade(col, 0.6));
    ctx.fillStyle = g; rr(x - 8 * R, lineY - 14 * R, 16 * R, 36 * R, 6 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, lineY - 20 * R, 7 * R, 0, 7); ctx.fill();
  }
  function drawRunner(R) {
    let x = W / 2, y = H * 0.78;
    if (phase === 'run') { const u = runT / 0.5; const tx = sel >= 0 ? linkX(sel) : W / 2; x = W / 2 + (tx - W / 2) * u; y = H * 0.78 + (lineY + 6 * R - H * 0.78) * u; if (!runOk && u > 0.7) y -= (u - 0.7) * 60; }
    else if (phase === 'result' && !runOk) { x = W / 2; y = H * 0.82; }
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 22 * R, 13 * R, 5 * R, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(x, y - 34 * R, x, y + 18 * R); g.addColorStop(0, '#5fe0ff'); g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g; rr(x - 9 * R, y - 16 * R, 18 * R, 38 * R, 7 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, y - 22 * R, 8 * R, 0, 7); ctx.fill();
  }
  function drawPow(R) {
    const bw = Math.min(320, W * 0.7), bx = (W - bw) / 2, by = H * 0.86, bh = 18;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(bx, by, bw, bh, 9); ctx.fill();
    // tanlangan bo'g'in kuchi chizig'i
    if (sel >= 0) { const sx = bx + bw * ((links[sel].str - 0.3) / (POW_MAX - 0.3)); ctx.strokeStyle = '#ff5a72'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, by - 4); ctx.lineTo(sx, by + bh + 4); ctx.stroke(); }
    ctx.fillStyle = pow >= (sel >= 0 ? links[sel].str : 1) ? '#8dffb0' : '#fbbf24'; rr(bx, by, bw * ((pow - 0.3) / (POW_MAX - 0.3)), bh, 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 ' + Math.round(Math.min(16, W / 30)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Bos — KUCH (qizil chiziqdan o\'tkaz)', W / 2, by - 8);
  }
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')'; }
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('oq-terak'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doAct = e => { if (e) e.preventDefault(); action(); };
  cv.addEventListener('mousedown', doAct); cv.addEventListener('touchstart', doAct, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doAct); actBtn.addEventListener('touchstart', doAct, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doAct(e); else if (e.code === 'KeyR') reset(); });

  window.OT2_TEST = {
    info: () => ({ level: levelIdx + 1, phase, breaks, target, lives, hi: +hi.toFixed(2), sel, pow: +pow.toFixed(3) }),
    state: () => state, act: () => action(),
    links: () => links.map(l => ({ str: +l.str.toFixed(3), broken: l.broken })),
    POW_MAX
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
