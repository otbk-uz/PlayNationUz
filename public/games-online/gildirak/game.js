// G'ildirak (obruch) — xalq o'yini. Tayoq bilan g'ildirakni boshqarib, to'siqlardan chetlab manzilga yet.
// Pseudo-3D: perspektiv yo'l, to'siqlar yaqinlashganda kattalashadi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LANES = [-0.68, 0, 0.68];
  const LEVELS = [
    { rows: 8, dz: 5.0, speed: 3.0, block: 1, name: 'Ko\'cha' },
    { rows: 10, dz: 4.6, speed: 3.4, block: 1, name: 'Mahalla' },
    { rows: 12, dz: 4.3, speed: 3.9, block: 2, name: 'Bozor' },
    { rows: 14, dz: 4.1, speed: 4.3, block: 2, name: 'Shahar' },
    { rows: 16, dz: 3.9, speed: 4.7, block: 2, name: 'Usta' },
  ];
  const VIEW = 22, STEER = 2.7, HOOPR = 0.26, OBSR = 0.28;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let s = 0, courseLen = 0, hoopX = 0, targetX = 0, obstacles = [], keyDir = {}, dragX = null;
  let horizonY = 0, nearY = 0, msg = '', roll = 0, prevS = 0;

  function rand(seed) { let x = seed; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; }

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; const rnd = rand(4200 + idx * 131);
    obstacles = []; let prevOpen = 1;
    for (let i = 0; i < L.rows; i++) {
      const z = 8 + i * L.dz;
      // ochiq yo'lakni tanla (oldingiga qo'shni bo'lsin — yetib boradi)
      const open = Math.max(0, Math.min(2, prevOpen + (Math.floor(rnd() * 3) - 1)));
      prevOpen = open;
      const nBlock = 1 + Math.floor(rnd() * L.block); // 1..block ta yo'lak yopiladi
      let blocked = 0;
      for (let ln = 0; ln < 3 && blocked < nBlock; ln++) { const cand = (open + 1 + ln) % 3; if (cand !== open) { obstacles.push({ z, lane: cand, x: LANES[cand], t: Math.floor(rnd() * 3) }); blocked++; } }
    }
    courseLen = 8 + L.rows * L.dz + 6;
    s = 0; prevS = 0; hoopX = 0; targetX = 0; keyDir = {}; dragX = null; msg = ''; state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('distPill').textContent = '📍 ' + Math.round(Math.min(100, s / courseLen * 100)) + '%';
    document.getElementById('statePill').textContent = '🛞 ' + LEVELS[levelIdx].name;
  }

  function update(dt) {
    tm += dt; roll += dt * 8; if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    const L = LEVELS[levelIdx];
    prevS = s; s += L.speed * dt;
    // boshqaruv
    if (dragX !== null) targetX = Math.max(-1, Math.min(1, dragX));
    else { let tx = hoopX; if (keyDir.left) tx = -1; else if (keyDir.right) tx = 1; targetX = tx; }
    const dx = targetX - hoopX; hoopX += Math.max(-STEER * dt, Math.min(STEER * dt, dx));
    hoopX = Math.max(-1, Math.min(1, hoopX));
    // to'qnashuv: to'siq hoop chizig'idan (z=0) o'tganda
    for (const o of obstacles) { if (o.hit) continue; const zPrev = o.z - prevS, zNow = o.z - s;
      if (zPrev > 0 && zNow <= 0.0) { if (Math.abs(o.x - hoopX) < HOOPR + OBSR) { o.hit = true; return crash(); } }
    }
    if (s >= courseLen) return win();
    updateHud();
  }
  function crash() {
    state = 'lost'; flashT = 0.5; msg = 'To\'siqqa urilding! Qaytadan.'; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(9);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1000);
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win(); if (window.FX) FX.burst(W / 2, nearY - 20, '#8dffb0', 24);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 G\'ildirak ustasi!', "Barcha ko'chadan g'ildiragingni tushirmay olib o'tding — mohir haydovchi!", '↻ Qaytadan'), 1100);
  }

  // ── perspektiv yo'l ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizonY = H * 0.30; nearY = H * 0.82;
  }
  const nearHW = () => W * 0.46, farHW = () => W * 0.03;
  function proj(x, z) {
    const t = Math.max(0, Math.min(1, z / VIEW));
    const y = nearY + (horizonY - nearY) * t;
    const hw = nearHW() * (1 - t) + farHW() * t;
    return { x: W / 2 + x * hw, y, sc: 1 - t * 0.82, hw };
  }
  function render() {
    // osmon
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 30); sky.addColorStop(0, '#213a5c'); sky.addColorStop(1, '#6f97c0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizonY + 30);
    if (state === 'menu') { return; }
    // yo'l (trapetsiya)
    const nl = proj(-1, 0), nr = proj(1, 0), fl = proj(-1, VIEW), fr = proj(1, VIEW);
    ctx.beginPath(); ctx.moveTo(nl.x, nl.y); ctx.lineTo(fl.x, fl.y); ctx.lineTo(fr.x, fr.y); ctx.lineTo(nr.x, nr.y); ctx.closePath();
    const rg = ctx.createLinearGradient(0, horizonY, 0, nearY); rg.addColorStop(0, '#6a5a44'); rg.addColorStop(1, '#8a7654'); ctx.fillStyle = rg; ctx.fill();
    // yo'l chiziqlari (harakatlanadigan) — chuqurlik
    for (let z = Math.ceil(s) - s; z < VIEW; z += 2) { const a = proj(-1, z), b = proj(1, z); ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    // yo'lak chiziqlari
    for (const lx of [-0.34, 0.34]) { const a = proj(lx, 0), b = proj(lx, VIEW); ctx.strokeStyle = 'rgba(255,240,200,.12)'; ctx.setLineDash([10, 14]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); }
    // to'siqlar (uzoqdan yaqinga)
    const vis = obstacles.filter(o => !o.hit && o.z - s > -0.5 && o.z - s < VIEW).sort((a, b) => (b.z - s) - (a.z - s));
    for (const o of vis) drawObstacle(o.x, o.z - s, o.t);
    // g'ildirak (old, z=0)
    drawHoop();
    if (window.FX) FX.render(ctx);
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.92); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawObstacle(x, z, type) {
    const p = proj(x, z); const s2 = p.sc * Math.min(1.5, W / 520); const rr2 = 34 * s2;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, rr2 * 0.9, rr2 * 0.32, 0, 0, 7); ctx.fill();
    // tosh/g'ov
    const g = ctx.createLinearGradient(p.x, p.y - rr2, p.x, p.y); g.addColorStop(0, '#9a9488'); g.addColorStop(1, '#5c5750');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p.x - rr2 * 0.9, p.y);
    ctx.lineTo(p.x - rr2 * 0.6, p.y - rr2 * 0.85); ctx.lineTo(p.x - rr2 * 0.1, p.y - rr2 * 1.05);
    ctx.lineTo(p.x + rr2 * 0.5, p.y - rr2 * 0.8); ctx.lineTo(p.x + rr2 * 0.9, p.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function drawHoop() {
    const p = proj(hoopX, 0); const R = Math.min(1.5, W / 520) * 1.1; const rr2 = 40 * R;
    // soya
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, rr2 * 0.9, rr2 * 0.3, 0, 0, 7); ctx.fill();
    // g'ildirak (halqa)
    ctx.save(); ctx.translate(p.x, p.y - rr2 * 0.7);
    ctx.strokeStyle = '#d9d2c4'; ctx.lineWidth = 6 * R;
    ctx.beginPath(); ctx.ellipse(0, 0, rr2 * 0.8, rr2 * 0.82, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 2 * R;
    // spitsalar (aylanadi)
    for (let i = 0; i < 4; i++) { const a = roll + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rr2 * 0.8, Math.sin(a) * rr2 * 0.82); ctx.lineTo(-Math.cos(a) * rr2 * 0.8, -Math.sin(a) * rr2 * 0.82); ctx.stroke(); }
    // yaltiroq
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3 * R; ctx.beginPath(); ctx.ellipse(0, 0, rr2 * 0.8, rr2 * 0.82, 0, -2.2, -0.9); ctx.stroke();
    ctx.restore();
    // boshqaruvchi tayoq
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4 * R; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x + rr2 * 0.9, p.y - rr2 * 1.4); ctx.lineTo(p.x + rr2 * 0.4, p.y - rr2 * 0.7); ctx.stroke();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('gildirak'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  // drag: yo'l bo'ylab chapga-o'ngga
  function ptx(e) { const r = cv.getBoundingClientRect(); const c = e.touches ? e.touches[0] : e; return ((c.clientX - r.left) / r.width - 0.5) * 2.1; }
  cv.addEventListener('mousedown', e => { e.preventDefault(); dragX = ptx(e); });
  cv.addEventListener('mousemove', e => { if (dragX !== null) dragX = ptx(e); });
  addEventListener('mouseup', () => { dragX = null; });
  cv.addEventListener('touchstart', e => { e.preventDefault(); dragX = ptx(e); }, { passive: false });
  cv.addEventListener('touchmove', e => { e.preventDefault(); dragX = ptx(e); }, { passive: false });
  addEventListener('touchend', () => { dragX = null; });
  document.querySelectorAll('.dpad .tbtn').forEach(bn => {
    const dir = bn.getAttribute('data-dir'); if (dir !== 'left' && dir !== 'right') return;
    const set = e => { e.preventDefault(); keyDir[dir] = 1; };
    const clr = e => { e.preventDefault(); keyDir[dir] = 0; };
    bn.addEventListener('touchstart', set, { passive: false }); bn.addEventListener('touchend', clr);
    bn.addEventListener('mousedown', set); bn.addEventListener('mouseup', clr); bn.addEventListener('mouseleave', clr);
  });
  addEventListener('keydown', e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyDir.left = 1; else if (e.code === 'ArrowRight' || e.code === 'KeyD') keyDir.right = 1; else if (e.code === 'KeyR') reset(); });
  addEventListener('keyup', e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') keyDir.left = 0; else if (e.code === 'ArrowRight' || e.code === 'KeyD') keyDir.right = 0; });

  window.GL_TEST = {
    info: () => ({ level: levelIdx + 1, pct: +(s / courseLen * 100).toFixed(1), hoopX: +hoopX.toFixed(2), s: +s.toFixed(2) }),
    state: () => state,
    // eng yaqin oldindagi to'siq yo'laklari (test AI uchun)
    threats: () => obstacles.filter(o => !o.hit && o.z - s > 0 && o.z - s < 6).map(o => ({ z: +(o.z - s).toFixed(2), x: o.x })),
    steer: (tx) => { dragX = Math.max(-1, Math.min(1, tx)); }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
