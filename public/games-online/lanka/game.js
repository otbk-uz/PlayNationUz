// Lanka — xalq epchillik o'yini. Lankani oyoq bilan tepib havoda ushlab tur, nishon soniga yet.
// Pseudo-3D: perspektiv pol, balandlikni soya+masshtab bilan ko'rsatadi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { target: 5, grav: 620, drift: 40, name: 'Boshlang\'ich' },
    { target: 9, grav: 700, drift: 60, name: 'Yengil' },
    { target: 14, grav: 800, drift: 85, name: 'O\'rta' },
    { target: 19, grav: 900, drift: 110, name: 'Qiyin' },
    { target: 25, grav: 1020, drift: 140, name: 'Usta' },
  ];
  const KICK_H = 46, REACH = 60, RUN = 260, LAUNCH = 430;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let lanka = null, charX = 0, charVX = 0, rally = 0, target = 0, best = 0, msg = '';
  let groundY = 0, kickFlash = 0, footAng = 0;

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; target = L.target; rally = 0;
    fit();
    lanka = { x: W * 0.5, h: 120, vy: -120, vx: (Math.random() * 2 - 1) * L.drift, spin: 0, feather: 0 };
    charX = W * 0.5; charVX = 0; msg = ''; kickFlash = 0; state = 'play'; flashT = 0;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('targetPill').textContent = '🎯 ' + target;
    document.getElementById('statePill').textContent = '🦶 ' + rally + '/' + target;
  }

  const reachable = () => Math.abs(charX - lanka.x) < REACH;
  const inZone = () => lanka.h <= KICK_H && lanka.vy > 0; // pastga tushayotgan va past
  function kick() {
    if (state !== 'play') return;
    if (inZone() && reachable()) {
      // markazga qarab gorizontal, balandlikka tepish; vaqt aniqligi bonus beradi
      const acc = 1 - lanka.h / KICK_H; // pastroq = kuchliroq
      lanka.vy = -(LAUNCH * (0.82 + acc * 0.28));
      const toC = (W * 0.5 - lanka.x); lanka.vx = lanka.vx * 0.3 + Math.sign(toC) * Math.min(Math.abs(toC) * 1.2, 120) + (Math.random() * 2 - 1) * LEVELS[levelIdx].drift * 0.6;
      lanka.spin += 3; rally++; best = Math.max(best, rally); kickFlash = 0.18; footAng = -0.9;
      if (window.SFX) SFX.tone(300 + rally * 12, 0.06, { type: 'square', vol: 0.12, to: 520 });
      if (window.FX) FX.burst(lanka.x, groundY - lanka.h, '#ffd88a', 8);
      updateHud();
      if (rally >= target) return win();
    } else {
      // xato tepish — kichik jazosiz, faqat oyoq silkinadi
      footAng = -0.5; if (window.SFX) SFX.tone(160, 0.05, { type: 'sine', vol: 0.05 });
    }
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Lanka ustasi!', "Barcha bosqichda lankani tushirmay ushlab turding — chinakam epchil!", '↻ Qaytadan'), 1100);
  }
  function drop() {
    state = 'lost'; flashT = 0.45; msg = 'Lanka tushdi! (' + rally + ') Qaytadan.'; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(6);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1100);
  }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (kickFlash > 0) kickFlash -= dt;
    footAng += (0 - footAng) * Math.min(1, dt * 8);
    if (state !== 'play') return;
    const L = LEVELS[levelIdx];
    // lanka fizikasi
    lanka.vy += L.grav * dt; lanka.h -= lanka.vy * dt; lanka.x += lanka.vx * dt; lanka.spin += dt * 6; lanka.feather += dt * 12;
    // devor (chetlardan qaytish)
    const m = 30; if (lanka.x < m) { lanka.x = m; lanka.vx = Math.abs(lanka.vx); } if (lanka.x > W - m) { lanka.x = W - m; lanka.vx = -Math.abs(lanka.vx); }
    // personaj lanka ostiga yuguradi (cheklangan tezlik)
    const tx = lanka.x; const d = tx - charX; charVX = Math.max(-RUN, Math.min(RUN, d * 5));
    charX += charVX * dt; charX = Math.max(24, Math.min(W - 24, charX));
    // yerga tushdimi?
    if (lanka.h <= 0) { lanka.h = 0; return drop(); }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.78;
  }
  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#243a52'); bg.addColorStop(0.7, '#3a5570'); bg.addColorStop(1, '#4a6a54');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // pol (perspektiv)
    ctx.fillStyle = '#4f6b45'; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) { const y = groundY + (H - groundY) * (i / 6); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // kick zonasi ko'rsatkichi
    const zy = groundY - KICK_H;
    ctx.strokeStyle = inZone() && reachable() ? 'rgba(141,255,180,.5)' : 'rgba(255,255,255,.12)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(W, zy); ctx.stroke(); ctx.setLineDash([]);
    // lanka soyasi
    const shScale = 1 - Math.min(0.75, lanka.h / 260);
    ctx.fillStyle = `rgba(0,0,0,${0.3 * shScale})`; ctx.beginPath(); ctx.ellipse(lanka.x, groundY + 4, 16 * shScale, 6 * shScale, 0, 0, 7); ctx.fill();
    // personaj
    drawChar();
    // lanka
    drawLanka();
    if (window.FX) FX.render(ctx);
    // rally katta
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '800 ' + Math.round(Math.min(54, W / 9)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.5 + kickFlash * 2; ctx.fillText(rally + '', W / 2, H * 0.2); ctx.globalAlpha = 1;
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.fillText(msg, W / 2, H * 0.9); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawChar() {
    const R = Math.min(1.4, W / 560); const x = charX, y = groundY;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 22 * R, 7 * R, 0, 0, 7); ctx.fill();
    // tana
    const g = ctx.createLinearGradient(x, y - 60 * R, x, y); g.addColorStop(0, '#5fe0ff'); g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g; rr(x - 10 * R, y - 54 * R, 20 * R, 42 * R, 8 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, y - 60 * R, 9 * R, 0, 7); ctx.fill();
    // tayanch oyoq
    ctx.strokeStyle = '#1f6f9a'; ctx.lineWidth = 6 * R; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 3 * R, y - 14 * R); ctx.lineTo(x - 5 * R, y - 2 * R); ctx.stroke();
    // tepuvchi oyoq (footAng bo'yicha ko'tariladi)
    ctx.save(); ctx.translate(x + 3 * R, y - 20 * R); ctx.rotate(footAng);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18 * R, 6 * R); ctx.stroke();
    ctx.fillStyle = '#e8b06a'; ctx.beginPath(); ctx.ellipse(18 * R, 7 * R, 6 * R, 4 * R, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawLanka() {
    const R = Math.min(1.4, W / 560); const sc = R * (0.85 + Math.min(0.5, lanka.h / 300));
    const x = lanka.x, y = groundY - lanka.h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(lanka.spin) * 0.3);
    // patlar (yuqoriga)
    for (let i = -2; i <= 2; i++) {
      ctx.strokeStyle = ['#e8e0d0', '#d0c4a8', '#bcae8e'][(i + 2) % 3]; ctx.lineWidth = 2 * sc; ctx.lineCap = 'round';
      const fa = i * 0.35 + Math.sin(lanka.feather + i) * 0.12;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(fa) * 16 * sc, -18 * sc - Math.cos(fa) * 6 * sc); ctx.stroke();
    }
    // og'irlik (pastda — qo'rg'oshin/tugun)
    const g = ctx.createRadialGradient(-2 * sc, -2 * sc, 1, 0, 0, 8 * sc); g.addColorStop(0, '#8a94a0'); g.addColorStop(1, '#454d58');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 7 * sc, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('lanka'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doKick = e => { if (e) e.preventDefault(); kick(); };
  cv.addEventListener('mousedown', doKick); cv.addEventListener('touchstart', doKick, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doKick); actBtn.addEventListener('touchstart', doKick, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doKick(e); else if (e.code === 'KeyR') reset(); });

  window.LN_TEST = {
    info: () => ({ level: levelIdx + 1, rally, target, h: +lanka.h.toFixed(1), vy: +lanka.vy.toFixed(0), canKick: inZone() && reachable() }),
    state: () => state, kick: () => kick()
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
