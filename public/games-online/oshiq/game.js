// Oshiq (ashiq) — xalq o'yini. Soqqangni otib, raqib oshiqlarini doiradan tashqariga urib chiqar.
// Pseudo-3D: nishab doira, 3D-soyali oshiqlar, drop-shadow.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { targets: 3, shots: 5, ring: 0.36 },
    { targets: 4, shots: 5, ring: 0.34 },
    { targets: 5, shots: 6, ring: 0.32 },
    { targets: 6, shots: 6, ring: 0.30 },
    { targets: 7, shots: 7, ring: 0.28 },
  ];
  const FRICTION = 0.985, STOP = 6, MAXV = 1500;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let bones = [], striker = null, ringR = 0.34, shotsLeft = 0, outCount = 0, totalT = 0;
  let cx = 0, cy = 0, rx = 0, ry = 0, R = 1;
  let aiming = false, aimX = 0, aimY = 0, moving = false, msg = '';

  function rand(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; ringR = L.ring; shotsLeft = L.shots; totalT = L.targets; outCount = 0;
    fit();
    bones = [];
    const rnd = rand(1000 + idx * 97);
    // nishon oshiqlar — doira ichida halqa bo'ylab
    for (let i = 0; i < L.targets; i++) {
      const ang = (i / L.targets) * Math.PI * 2 + rnd() * 0.5;
      const rr = (0.25 + rnd() * 0.45) * rx * 0.8;
      bones.push({ x: cx + Math.cos(ang) * rr, y: cy + Math.sin(ang) * rr * (ry / rx), vx: 0, vy: 0, r: R, target: true, out: false, hue: 34 + i * 7 });
    }
    striker = { x: cx, y: cy + ry + R * 3.2, vx: 0, vy: 0, r: R * 1.12, target: false, out: false, hue: 200, striker: true };
    moving = false; aiming = false; msg = ''; state = 'play'; flashT = 0;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('shotPill').textContent = '🎯 ' + shotsLeft;
    document.getElementById('statePill').textContent = '🦴 ' + outCount + '/' + totalT;
  }

  function outsideRing(b) { const dx = (b.x - cx) / rx, dy = (b.y - cy) / ry; return dx * dx + dy * dy > 1; }

  function launch(vx, vy) {
    if (moving || state !== 'play') return;
    const sp = Math.hypot(vx, vy); if (sp > MAXV) { vx = vx / sp * MAXV; vy = vy / sp * MAXV; }
    striker.vx = vx; striker.vy = vy; moving = true; shotsLeft--;
    if (window.SFX) SFX.tone(200, 0.08, { type: 'square', vol: 0.13, to: 380 });
    updateHud();
  }

  function step(dt) {
    // integratsiya + ishqalanish
    const all = [striker, ...bones.filter(b => !b.out)];
    for (const b of all) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.vx *= FRICTION; b.vy *= FRICTION;
      if (Math.hypot(b.vx, b.vy) < STOP) { b.vx = 0; b.vy = 0; }
    }
    // to'qnashuvlar (circle-circle, teng massa)
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j]; const dx = b.x - a.x, dy = b.y - a.y; let d = Math.hypot(dx, dy); const rr = a.r + b.r;
      if (d < rr && d > 0.0001) {
        const nx = dx / d, ny = dy / d; const overlap = rr - d;
        a.x -= nx * overlap / 2; a.y -= ny * overlap / 2; b.x += nx * overlap / 2; b.y += ny * overlap / 2;
        const dvx = b.vx - a.vx, dvy = b.vy - a.vy; const rel = dvx * nx + dvy * ny;
        if (rel < 0) { const imp = -rel * 0.94; a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny;
          if (Math.abs(rel) > 40 && window.SFX) SFX.tone(420 + Math.random() * 200, 0.04, { type: 'triangle', vol: 0.08 }); }
      }
    }
    // doiradan chiqqan nishonlar (faqat otishdan keyin, harakat davomida)
    if (moving) for (const b of bones) if (!b.out && b.target) {
      const dx = (b.x - cx) / rx, dy = (b.y - cy) / ry; const e = dx * dx + dy * dy;
      const slow = Math.hypot(b.vx, b.vy) < 40;
      if ((e > 1.05 && slow) || e > 1.6) { b.out = true; outCount++;
        if (window.SFX) SFX.coin(); if (window.FX) FX.burst(b.x, b.y, '#ffd88a', 16); updateHud();
        if (outCount >= totalT) return win(); }
    }
    // harakat tugadimi?
    if (moving) {
      const anyMove = all.some(b => b.vx !== 0 || b.vy !== 0);
      if (!anyMove) { moving = false; resolveShot(); }
    }
  }
  function resolveShot() {
    // soqqa doiradan tashqarida bo'lsa qaytar
    if (outsideRing(striker)) { striker.x = cx; striker.y = cy + ry + R * 3.2; striker.vx = striker.vy = 0; }
    if (outCount >= totalT) return;
    if (shotsLeft <= 0) { // otishlar tugadi
      state = 'lost'; flashT = 0.4; msg = 'Otishlar tugadi! Qaytadan.'; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(6);
      setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1100);
    }
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Oshiqboz usta!', "Barcha bosqichda raqib oshiqlarini doiradan urib chiqarding — haqiqiy oshiqboz!", '↻ Qaytadan'), 1100);
  }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt;
    if (state !== 'play') { return; }
    // barqarorlik uchun sub-step
    const n = 3; for (let k = 0; k < n; k++) step(dt / n);
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W * 0.5; cy = H * 0.44; const base = Math.min(W, H);
    rx = base * ringR * (W > H ? 1.15 : 1.0); ry = rx * 0.60; R = Math.max(12, base * 0.032);
  }
  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a2036'); bg.addColorStop(1, '#3a2e28');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // yer (tuproq)
    ctx.save();
    // doira (perspektiv ellips)
    ctx.beginPath(); ctx.ellipse(cx, cy, rx + R, ry + R * 0.6, 0, 0, 7);
    const fg = ctx.createRadialGradient(cx, cy - ry * 0.3, rx * 0.2, cx, cy, rx * 1.2);
    fg.addColorStop(0, '#7a6a4a'); fg.addColorStop(1, '#5a4a34'); ctx.fillStyle = fg; ctx.fill();
    // doira chizig'i (oq)
    ctx.strokeStyle = 'rgba(255,245,220,.7)'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    // oshiqlar (uzoqdan yaqinga: y bo'yicha)
    const draw = [striker, ...bones.filter(b => !b.out)].sort((a, b) => a.y - b.y);
    for (const b of draw) drawBone(b);
    // aim ko'rsatkichi
    if (aiming && !moving) {
      const dx = striker.x - aimX, dy = striker.y - aimY; const p = Math.min(1, Math.hypot(dx, dy) / (R * 10));
      ctx.strokeStyle = 'rgba(255,220,120,.8)'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(striker.x, striker.y); ctx.lineTo(striker.x + dx * 1.4, striker.y + dy * 1.4); ctx.stroke(); ctx.setLineDash([]);
      // power ok uchi
      ctx.fillStyle = p > 0.8 ? '#ff5a72' : '#ffd24a';
      ctx.beginPath(); ctx.arc(striker.x + dx * 1.4, striker.y + dy * 1.4, 5 + p * 4, 0, 7); ctx.fill();
    }
    if (window.FX) FX.render(ctx);
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.9); }
    if (!moving && !aiming && state === 'play' && outCount < totalT) {
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '600 ' + Math.round(Math.min(17, W / 28)) + 'px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('Soqqani orqaga tortib qo\'yvor — otish', W / 2, H * 0.9);
    }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawBone(b) {
    const sc = b.r / 20 * (0.9 + (b.y - (cy - ry)) / (2 * ry) * 0.2);
    // soya
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + b.r * 0.5, b.r * 1.05, b.r * 0.42, 0, 0, 7); ctx.fill();
    // oshiq shakli (knucklebone: ikki bo'rtiq + o'rtasi ingichka)
    ctx.save(); ctx.translate(b.x, b.y);
    const base = b.striker ? '#8fb8e0' : `hsl(${b.hue},45%,68%)`, dark = b.striker ? '#3f6fa0' : `hsl(${b.hue},48%,42%)`;
    const g = ctx.createLinearGradient(-b.r, -b.r, b.r, b.r); g.addColorStop(0, base); g.addColorStop(1, dark);
    ctx.fillStyle = g; ctx.strokeStyle = `hsla(${b.striker ? 210 : b.hue},40%,25%,.6)`; ctx.lineWidth = 1.2;
    // gavda
    rr(-b.r * 0.85, -b.r * 0.6, b.r * 1.7, b.r * 1.2, b.r * 0.42); ctx.fill(); ctx.stroke();
    // ikki bo'rtiq (uchlari)
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(-b.r * 0.6, -b.r * 0.5, b.r * 0.42, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(b.r * 0.6, -b.r * 0.5, b.r * 0.42, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-b.r * 0.6, b.r * 0.5, b.r * 0.42, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(b.r * 0.6, b.r * 0.5, b.r * 0.42, 0, 7); ctx.fill();
    // yaltiroq
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-b.r * 0.3, -b.r * 0.35, b.r * 0.4, b.r * 0.24, -0.5, 0, 7); ctx.fill();
    if (b.striker) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = 'bold ' + Math.round(b.r * 0.7) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('S', 0, 0); }
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('oshiq'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  function pt(e) { const r = cv.getBoundingClientRect(); const c = e.touches ? e.touches[0] : e; return { x: (c.clientX - r.left) * W / r.width, y: (c.clientY - r.top) * H / r.height }; }
  function down(e) { if (moving || state !== 'play') return; e.preventDefault(); aiming = true; const p = pt(e); aimX = p.x; aimY = p.y; }
  function move(e) { if (!aiming) return; e.preventDefault(); const p = pt(e); aimX = p.x; aimY = p.y; }
  function up(e) { if (!aiming) return; if (e) e.preventDefault(); aiming = false;
    const dx = striker.x - aimX, dy = striker.y - aimY; const pull = Math.hypot(dx, dy);
    if (pull > R * 0.5) launch(dx * 5.5, dy * 5.5); }
  cv.addEventListener('mousedown', down); cv.addEventListener('mousemove', move); addEventListener('mouseup', up);
  cv.addEventListener('touchstart', down, { passive: false }); cv.addEventListener('touchmove', move, { passive: false }); addEventListener('touchend', up);
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); });

  window.OS_TEST = {
    info: () => ({ level: levelIdx + 1, shotsLeft, outCount, totalT, moving, striker: { x: striker.x, y: striker.y } }),
    state: () => state,
    aimAt: () => { // eng yaqin nishonga qarab kuchli ot (test)
      const t = bones.filter(b => !b.out); if (!t.length) return;
      let best = t[0], bd = 1e9; for (const b of t) { const d = Math.hypot(b.x - striker.x, b.y - striker.y); if (d < bd) { bd = d; best = b; } }
      const dx = best.x - striker.x, dy = best.y - striker.y, len = Math.hypot(dx, dy) || 1;
      launch(dx / len * MAXV, dy / len * MAXV);
    },
    knockAllOut: () => { for (const b of bones) if (!b.out) { b.out = true; outCount++; } updateHud(); win(); }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
