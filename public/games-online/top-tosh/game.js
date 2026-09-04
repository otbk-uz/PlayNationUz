// To'p-tosh — xalq dodgeball o'yini. Chetdan otilgan to'plardan qochib, vaqt tugaguncha omon qol.
// Pseudo-3D: 2.5D izometrik maydon, ko'tarilgan chegara, to'p va o'yinchida soya.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { time: 15, rate: 1.25, bspeed: 3.2, name: 'Boshlang\'ich' },
    { time: 18, rate: 1.00, bspeed: 3.7, name: 'Yengil' },
    { time: 20, rate: 0.72, bspeed: 4.4, name: 'O\'rta' },
    { time: 22, rate: 0.58, bspeed: 5.0, name: 'Qiyin' },
    { time: 25, rate: 0.46, bspeed: 5.6, name: 'Usta' },
  ];
  const R = 11, C = 11; // maydon (chegara bilan)
  const TW = 56, TH = 28, WALLH = 24, SPEED = 3.9, HITR = 0.5;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let player = null, balls = [], timeLeft = 0, spawnT = 0, moveDir = null, keyDir = {};
  let ox = 0, oy = 0, scale = 1, bob = 0, msg = '';

  const isWall = (r, c) => (r <= 0 || c <= 0 || r >= R - 1 || c >= C - 1);

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    player = { r: (R - 1) / 2, c: (C - 1) / 2 }; balls = []; timeLeft = L.time; spawnT = 0.4;
    moveDir = null; keyDir = {}; msg = ''; state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('timePill').textContent = '⏱ ' + Math.ceil(timeLeft);
    document.getElementById('statePill').textContent = '⚾ ' + balls.length;
  }

  function spawnBall() {
    const L = LEVELS[levelIdx];
    // chetdan tasodifiy nuqta
    const edge = Math.floor(Math.random() * 4); let r, c;
    if (edge === 0) { r = 0.6; c = 1 + Math.random() * (C - 2); }
    else if (edge === 1) { r = R - 1.6; c = 1 + Math.random() * (C - 2); }
    else if (edge === 2) { c = 0.6; r = 1 + Math.random() * (R - 2); }
    else { c = C - 1.6; r = 1 + Math.random() * (R - 2); }
    // o'yinchiga (biroz oldindan) yo'nalish
    const lead = 0.3; const tr = player.r, tc = player.c;
    let dr = tr - r + (Math.random() - 0.5) * lead, dc = tc - c + (Math.random() - 0.5) * lead;
    const d = Math.hypot(dr, dc) || 1; dr /= d; dc /= d;
    balls.push({ r, c, vr: dr * L.bspeed, vc: dc * L.bspeed, hop: Math.random() * 6, hue: [4, 20, 200, 320][Math.floor(Math.random() * 4)] });
    if (window.SFX) SFX.tone(300, 0.05, { type: 'square', vol: 0.06, to: 200 });
  }
  function update(dt) {
    bob += dt * 6; if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; return win(); }
    // o'yinchi
    let d = moveDir; if (!d) { let dr = 0, dc = 0; if (keyDir.up) { dr -= 1; dc -= 1; } if (keyDir.down) { dr += 1; dc += 1; } if (keyDir.left) { dr += 1; dc -= 1; } if (keyDir.right) { dr -= 1; dc += 1; } if (dr || dc) d = [dr, dc]; }
    if (d) { const len = Math.hypot(d[0], d[1]) || 1; const nr = player.r + d[0] / len * SPEED * dt, nc = player.c + d[1] / len * SPEED * dt;
      if (!isWall(nr, player.c)) player.r = Math.max(1, Math.min(R - 2, nr)); if (!isWall(player.r, nc)) player.c = Math.max(1, Math.min(C - 2, nc)); }
    // to'plar
    const L = LEVELS[levelIdx];
    spawnT -= dt; if (spawnT <= 0) { spawnBall(); spawnT = L.rate * (0.7 + Math.random() * 0.6); }
    for (const b of balls) { b.r += b.vr * dt; b.c += b.vc * dt; b.hop += dt * 10; }
    balls = balls.filter(b => b.r > -1 && b.r < R + 1 && b.c > -1 && b.c < C + 1);
    // to'qnashuv
    for (const b of balls) if (Math.hypot(b.r - player.r, b.c - player.c) < HITR) return hit();
    updateHud();
  }
  function hit() {
    state = 'lost'; flashT = 0.5; msg = 'To\'p tegdi! Qaytadan.'; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(9);
    const p = iso(player.r, player.c); if (window.FX) FX.burst(p.x, p.y - 14, '#ff6a5a', 18);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1000);
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    const p = iso(player.r, player.c); if (window.FX) FX.burst(p.x, p.y - 14, '#8dffb0', 24);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Qochish ustasi!', "Barcha bosqichda to'plardan omon qolding — chaqqonlikda tengsizsan!", '↻ Qaytadan'), 1100);
  }

  // ── iso ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mapW = (R + C) * TW / 2, mapH = (R + C) * TH / 2 + WALLH;
    scale = Math.min(1.2, (W - 30) / mapW, (H - 250) / mapH); scale = Math.max(0.5, scale);
    ox = W / 2; oy = (H - 150) / 2 - (R + C) * TH / 4 * scale + 40;
  }
  function iso(r, c) { return { x: ox + (c - r) * TW / 2 * scale, y: oy + (c + r) * TH / 2 * scale }; }
  function diamond(p, w, h) { ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x - w, p.y); ctx.closePath(); }

  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0e1c30'); bg.addColorStop(1, '#08111e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // pol
    for (let r = 1; r < R - 1; r++) for (let c = 1; c < C - 1; c++) drawGround(r, c);
    // chegara devor
    const walls = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (isWall(r, c)) walls.push({ d: r + c, r, c });
    // painter: devor + to'p + o'yinchi (r+c bo'yicha)
    const items = walls.map(w => ({ ...w, kind: 'wall' }));
    for (const b of balls) items.push({ d: b.r + b.c + 0.5, kind: 'ball', b });
    items.push({ d: player.r + player.c + 0.5, kind: 'player' });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) { if (it.kind === 'wall') drawWall(it.r, it.c); else if (it.kind === 'ball') drawBall(it.b); else drawPlayer(); }
    if (window.FX) FX.render(ctx);
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.9); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.32, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawGround(r, c) {
    const p = iso(r, c), w = TW / 2 * scale, h = TH / 2 * scale;
    diamond(p, w, h); ctx.fillStyle = ((r + c) % 2) ? '#182a44' : '#1b2f4c'; ctx.fill();
    ctx.strokeStyle = 'rgba(90,140,200,.14)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function drawWall(r, c) {
    const p = iso(r, c), w = TW / 2 * scale, h = TH / 2 * scale, Hh = WALLH * scale;
    ctx.fillStyle = '#233350'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x, p.y + h - Hh); ctx.lineTo(p.x - w, p.y - Hh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a2740'; ctx.beginPath(); ctx.moveTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x, p.y + h - Hh); ctx.lineTo(p.x + w, p.y - Hh); ctx.closePath(); ctx.fill();
    const top = { x: p.x, y: p.y - Hh }; diamond(top, w, h); ctx.fillStyle = '#37507a'; ctx.fill(); ctx.strokeStyle = 'rgba(150,190,250,.2)'; ctx.stroke();
  }
  function drawBall(b) {
    const p = iso(b.r, b.c); const s = scale; const hop = Math.abs(Math.sin(b.hop)) * 6 * s;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 9 * s, 4 * s, 0, 0, 7); ctx.fill();
    const y = p.y - 8 * s - hop;
    const g = ctx.createRadialGradient(p.x - 3 * s, y - 3 * s, 1, p.x, y, 10 * s);
    g.addColorStop(0, `hsl(${b.hue},85%,68%)`); g.addColorStop(1, `hsl(${b.hue},80%,38%)`);
    ctx.fillStyle = g; ctx.shadowColor = `hsl(${b.hue},85%,55%)`; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x, y, 9 * s, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(p.x - 3 * s, y - 3 * s, 3 * s, 0, 7); ctx.fill();
  }
  function drawPlayer() {
    const p = iso(player.r, player.c); const s = scale; const b = Math.sin(bob) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 11 * s, 5 * s, 0, 0, 7); ctx.fill();
    const bodyY = p.y - 16 * s + b;
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10;
    const g = ctx.createLinearGradient(p.x, bodyY - 6 * s, p.x, p.y); g.addColorStop(0, '#5fe0ff'); g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g; rr(p.x - 7 * s, bodyY, 14 * s, 20 * s, 6 * s); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(p.x, bodyY - 4 * s, 6 * s, 0, 7); ctx.fill();
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('top-tosh'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.querySelectorAll('.dpad .tbtn').forEach(bn => {
    const dir = bn.getAttribute('data-dir');
    const map = { up: [-1, -1], down: [1, 1], left: [1, -1], right: [-1, 1], mid: null };
    const set = e => { e.preventDefault(); moveDir = map[dir]; };
    const clr = e => { e.preventDefault(); if (moveDir === map[dir]) moveDir = null; };
    bn.addEventListener('touchstart', set, { passive: false }); bn.addEventListener('touchend', clr);
    bn.addEventListener('mousedown', set); bn.addEventListener('mouseup', clr); bn.addEventListener('mouseleave', clr);
  });
  addEventListener('keydown', e => { const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; if (m[e.code]) { keyDir[m[e.code]] = 1; e.preventDefault(); } else if (e.code === 'KeyR') reset(); });
  addEventListener('keyup', e => { const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; if (m[e.code]) keyDir[m[e.code]] = 0; });

  window.TT_TEST = {
    info: () => ({ level: levelIdx + 1, timeLeft: +timeLeft.toFixed(1), balls: balls.length, player: { r: +player.r.toFixed(2), c: +player.c.toFixed(2) } }),
    state: () => state, tp: (r, c) => { player.r = r; player.c = c; },
    move: (dr, dc) => { moveDir = (dr || dc) ? [dr, dc] : null; },
    // qochish uchun eng yaxshi yo'nalish (repulsiya + markazga tortish) — test AI
    dodgeDir: () => {
      let fr = 0, fc = 0;
      for (const b of balls) { const dr = player.r - b.r, dc = player.c - b.c; const d = Math.hypot(dr, dc) || 0.01; if (d < 4) { const w = 1 / (d * d); fr += dr / d * w; fc += dc / d * w; } }
      fr += ((R - 1) / 2 - player.r) * 0.15; fc += ((C - 1) / 2 - player.c) * 0.15; // markazga mayl
      const m = Math.hypot(fr, fc); if (m < 0.01) return [0, 0];
      return [fr / m, fc / m];
    }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
