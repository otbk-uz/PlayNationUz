// Varrak Jang — osmonda varrak (gudiparan) urushi. Ipingni raqib ipiga ishqalab uzib tashla.
// Pseudo-3D osmon: parallaks bulutlar, quyosh, chuqurlik.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // Bosqichlar: raqiblar soni va tezligi
  const LEVELS = [
    { enemies: 1, espd: 0.24 },
    { enemies: 2, espd: 0.28 },
    { enemies: 3, espd: 0.32 },
    { enemies: 3, espd: 0.40 },
    { enemies: 4, espd: 0.44 },
  ];
  const COLORS = ['#ff5a72', '#fbbf24', '#a78bfa', '#34d399', '#fb7185'];

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, t = 0;
  let player = null, enemies = [], clouds = [], winLeft = 0;
  let keyDir = {}, dragActive = false, dragX = 0, dragY = 0;

  // normal koord: x,y ∈ [0..1]. Anchor pastda.
  const P_ANCHOR = { x: 0.5, y: 1.08 };
  const fx = x => x * W, fy = y => y * H;
  const BAND = { x0: 0.08, x1: 0.92, y0: 0.10, y1: 0.60 };
  const clampX = x => Math.max(BAND.x0, Math.min(BAND.x1, x));
  const clampY = y => Math.max(BAND.y0, Math.min(BAND.y1, y));

  function makeEnemy(i, n, espd) {
    let ax = n === 1 ? 0.3 : (0.15 + 0.7 * i / (n - 1));
    if (Math.abs(ax - 0.5) < 0.05) ax += 0.09; // o'yinchi anchor (0.5) bilan ustma-ust tushmasin
    return { anchor: { x: ax, y: 1.08 }, x: ax, y: 0.24 + 0.12 * Math.sin(i), px: ax, py: 0.3,
      color: COLORS[i % COLORS.length], dead: false, driftx: 0, drifty: 0, duel: 0,
      seed: Math.random() * 6.28, sw: 0.5 + Math.random() * 0.6, aggro: 0, vx: 0, vy: 0, speed: 0 };
  }
  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    player = { anchor: { ...P_ANCHOR }, x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0, speed: 0, tail: [] };
    enemies = []; for (let i = 0; i < L.enemies; i++) enemies.push(makeEnemy(i, L.enemies, L.espd));
    winLeft = L.enemies; state = 'play'; flashT = 0;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() { const alive = enemies.filter(e => !e.dead).length; document.getElementById('statePill').textContent = '🪁 ' + (enemies.length - alive) + '/' + enemies.length; }

  // segment kesishuv
  function segX(a, b, c, d) {
    const r1 = (b.x - a.x), r2 = (b.y - a.y), s1 = (d.x - c.x), s2 = (d.y - c.y);
    const den = r1 * s2 - r2 * s1; if (Math.abs(den) < 1e-9) return null;
    const t = ((c.x - a.x) * s2 - (c.y - a.y) * s1) / den;
    const u = ((c.x - a.x) * r2 - (c.y - a.y) * r1) / den;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { x: a.x + t * r1, y: a.y + t * r2 };
  }

  function update(dt) {
    t += dt; if (flashT > 0) flashT -= dt;
    // bulutlar
    for (const c of clouds) { c.x += c.spd * dt; if (c.x > 1.2) c.x = -0.2; }
    if (state !== 'play') return;
    const L = LEVELS[levelIdx];
    // o'yinchi harakati
    player.px = player.x; player.py = player.y;
    if (dragActive) { player.x += (clampX(dragX) - player.x) * Math.min(1, dt * 12); player.y += (clampY(dragY) - player.y) * Math.min(1, dt * 12); }
    else { let dx = 0, dy = 0; if (keyDir.left) dx -= 1; if (keyDir.right) dx += 1; if (keyDir.up) dy -= 1; if (keyDir.down) dy += 1;
      const sp = 0.9; player.x = clampX(player.x + dx * sp * dt); player.y = clampY(player.y + dy * sp * dt); }
    player.vx = (player.x - player.px) / dt; player.vy = (player.y - player.py) / dt;
    player.speed = Math.hypot(player.vx, player.vy);
    player.tail.unshift({ x: player.x, y: player.y }); if (player.tail.length > 10) player.tail.pop();

    // raqiblar
    for (const e of enemies) {
      if (e.dead) { e.driftx += 0.25 * dt; e.drifty -= 0.12 * dt; e.x += 0.4 * dt; e.y -= 0.15 * dt; continue; }
      e.px = e.x; e.py = e.y;
      // wander + raqibning ipini kesishga intilish (aggro)
      const wx = 0.5 + 0.32 * Math.sin(t * e.sw + e.seed);
      const wy = 0.26 + 0.14 * Math.sin(t * e.sw * 1.3 + e.seed * 2);
      // aggro: o'yinchi ipiga yaqinlash
      let tx = wx, ty = wy;
      if (e.aggro > 0.3) { tx = player.x + (e.x - player.x) * 0.2; ty = player.y * 0.8 + 0.12; }
      e.x = clampX(e.x + (tx - e.x) * Math.min(1, dt * (1.2 + L.espd * 2)) * (L.espd / 0.3));
      e.y = clampY(e.y + (ty - e.y) * Math.min(1, dt * 1.2) * (L.espd / 0.3));
      e.vx = (e.x - e.px) / dt; e.vy = (e.y - e.py) / dt; e.speed = Math.hypot(e.vx, e.vy);
      e.aggro += (Math.random() - 0.45) * dt * 0.4; e.aggro = Math.max(0, Math.min(1, e.aggro));
    }
    // duel: iplar kesishsa ishqalanish
    for (const e of enemies) {
      if (e.dead) continue;
      const cross = segX(player.anchor, player, e.anchor, e);
      if (cross) {
        const adv = (player.speed - e.speed * 0.75 - 0.18);
        e.duel += adv * dt * 1.05;
        e.duel = Math.max(-1, Math.min(1, e.duel));
        e.crossPt = cross;
        if (window.SFX && Math.random() < 0.25) SFX.tone(1200 + Math.random() * 800, 0.02, { type: 'sawtooth', vol: 0.03 });
        if (e.duel >= 1) { e.dead = true; e.driftx = 0; e.drifty = 0; winLeft--; if (window.SFX) SFX.coin();
          if (window.FX) FX.burst(fx(cross.x), fy(cross.y), e.color, 22); updateHud();
          if (winLeft <= 0) return win(); }
        else if (e.duel <= -1) return lose();
      } else { e.crossPt = null; e.duel += (0 - e.duel) * Math.min(1, dt * 1.5); }
    }
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Osmon hukmdori!', "Barcha raqib varraklarni uzib tushirding — varrak jang ustasi!", '↻ Qaytadan'), 1100);
  }
  function lose() { state = 'lost'; flashT = 0.6; if (window.SFX) SFX.death(); if (window.FX) FX.shake(9); setTimeout(() => load(levelIdx), 950); }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!clouds.length) { clouds = []; for (let i = 0; i < 9; i++) clouds.push({ x: Math.random(), y: 0.05 + Math.random() * 0.7, s: 0.5 + Math.random() * 1.3, spd: 0.008 + Math.random() * 0.02, a: 0.12 + Math.random() * 0.22 }); }
  }
  function render() {
    // osmon gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a5fb4'); g.addColorStop(0.45, '#4a92d8'); g.addColorStop(0.8, '#9fcbe8'); g.addColorStop(1, '#d8ecf5');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // quyosh
    const sun = ctx.createRadialGradient(W * 0.8, H * 0.16, 6, W * 0.8, H * 0.16, 160);
    sun.addColorStop(0, 'rgba(255,250,220,.95)'); sun.addColorStop(0.3, 'rgba(255,240,180,.5)'); sun.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
    // orqa bulutlar (uzoq)
    for (const c of clouds) if (c.s < 1.0) drawCloud(c);
    if (state === 'menu') return;
    // yer chizig'i (pastda, chuqurlik uchun)
    ctx.fillStyle = 'rgba(60,110,70,.35)'; ctx.fillRect(0, H - 12, W, 12);
    // varraklar + iplar
    for (const e of enemies) drawKite(e, false);
    drawKite(player, true);
    // yaqin bulutlar (old, parallaks chuqurlik)
    for (const c of clouds) if (c.s >= 1.0) drawCloud(c);
    if (window.FX) FX.render(ctx);
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : state === 'lost' ? '255,80,90' : '255,255,255'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawCloud(c) {
    const x = fx(c.x), y = fy(c.y), s = 34 * c.s;
    ctx.save(); ctx.globalAlpha = c.a; ctx.fillStyle = '#ffffff';
    for (const o of [[0, 0, 1], [-1.1, 0.2, 0.75], [1.1, 0.2, 0.8], [-0.5, -0.5, 0.7], [0.6, -0.4, 0.65]]) {
      ctx.beginPath(); ctx.ellipse(x + o[0] * s, y + o[1] * s, s * o[2], s * o[2] * 0.62, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  function drawString(anchor, kite, col, duel) {
    const ax = fx(anchor.x), ay = fy(anchor.y), kx = fx(kite.x), ky = fy(kite.y);
    // biroz osilgan ip (kvadrat egri)
    const mx = (ax + kx) / 2, my = (ay + ky) / 2 + 14;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, kx, ky);
    if (duel > 0.05) ctx.strokeStyle = 'rgba(141,255,180,' + (0.4 + duel * 0.5) + ')';
    else if (duel < -0.05) ctx.strokeStyle = 'rgba(255,90,90,' + (0.4 - duel * 0.5) + ')';
    else ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = 1.6; ctx.stroke();
  }
  function drawKite(k, isPlayer) {
    const kx = fx(k.x), ky = fy(k.y);
    // depth scale: balandroq = kichikroq
    const depth = 0.8 + (k.y - BAND.y0) / (BAND.y1 - BAND.y0) * 0.5;
    const sz = (isPlayer ? 30 : 26) * depth * Math.min(1.4, W / 620);
    const col = isPlayer ? '#22d3ee' : k.color;
    // ip
    drawString(k.anchor, k, isPlayer ? '#fff' : k.color, isPlayer ? 0 : k.duel);
    // dumi (tail)
    ctx.save();
    const tilt = Math.max(-0.5, Math.min(0.5, (k.vx || 0) * 0.5));
    ctx.translate(kx, ky); ctx.rotate(tilt);
    // dum lentasi
    ctx.strokeStyle = col; ctx.globalAlpha = 0.7; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, sz * 0.9);
    for (let i = 1; i <= 6; i++) { const yy = sz * 0.9 + i * sz * 0.5; const xx = Math.sin(t * 6 + i) * sz * 0.4 * (i / 6); ctx.lineTo(xx, yy); }
    ctx.stroke(); ctx.globalAlpha = 1;
    // rombsimon varrak
    const dark = shade(col, 0.6);
    ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.7, 0); ctx.lineTo(0, sz * 0.9); ctx.lineTo(-sz * 0.7, 0); ctx.closePath();
    const gg = ctx.createLinearGradient(-sz, -sz, sz, sz); gg.addColorStop(0, col); gg.addColorStop(1, dark);
    ctx.fillStyle = gg; ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    // sparlar (skelet)
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(0, sz * 0.9); ctx.moveTo(-sz * 0.7, 0); ctx.lineTo(sz * 0.7, 0); ctx.stroke();
    // yaltiroq
    ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.7, 0); ctx.lineTo(0, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
    ctx.restore();
    // duel uchqun nuqtasi
    if (!isPlayer && k.crossPt) {
      const cx = fx(k.crossPt.x), cy = fy(k.crossPt.y);
      ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = k.duel > 0 ? '#8dffb0' : '#ff5a5a';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(cx, cy, 3 + Math.abs(Math.sin(t * 30)) * 2, 0, 7); ctx.fill(); ctx.restore();
    }
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  let last = 0;
  function frame(tm) { const dt = Math.min(0.033, (tm - last) / 1000 || 0); last = tm; update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('varrak'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  // drag boshqaruvi (butun canvas)
  function pt(e) { const r = cv.getBoundingClientRect(); const c = e.touches ? e.touches[0] : e; return { x: (c.clientX - r.left) / r.width, y: (c.clientY - r.top) / r.height }; }
  function down(e) { e.preventDefault(); dragActive = true; const p = pt(e); dragX = p.x; dragY = p.y; }
  function move(e) { if (!dragActive) return; e.preventDefault(); const p = pt(e); dragX = p.x; dragY = p.y; }
  function up() { dragActive = false; }
  cv.addEventListener('mousedown', down); cv.addEventListener('mousemove', move); addEventListener('mouseup', up);
  cv.addEventListener('touchstart', down, { passive: false }); cv.addEventListener('touchmove', move, { passive: false }); addEventListener('touchend', up);
  // dpad
  document.querySelectorAll('.dpad .tbtn').forEach(bn => {
    const dir = bn.getAttribute('data-dir'); if (dir === 'mid') return;
    const set = e => { e.preventDefault(); keyDir[dir] = 1; };
    const clr = e => { e.preventDefault(); keyDir[dir] = 0; };
    bn.addEventListener('touchstart', set, { passive: false }); bn.addEventListener('touchend', clr);
    bn.addEventListener('mousedown', set); bn.addEventListener('mouseup', clr); bn.addEventListener('mouseleave', clr);
  });
  addEventListener('keydown', e => { const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; if (m[e.code]) { keyDir[m[e.code]] = 1; e.preventDefault(); } else if (e.code === 'KeyR') reset(); });
  addEventListener('keyup', e => { const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; if (m[e.code]) keyDir[m[e.code]] = 0; });

  window.VR_TEST = {
    info: () => ({ level: levelIdx + 1, winLeft, enemies: enemies.map(e => ({ x: e.x, y: e.y, ax: e.anchor.x, dead: e.dead, duel: e.duel, cross: !!e.crossPt })) }),
    state: () => state,
    setPlayer: (x, y) => { player.x = x; player.y = y; },
    // haqiqiy boshqaruv (drag) — test uchun tezlik hosil qiladi
    drive: (x, y) => { dragActive = true; dragX = x; dragY = y; },
    release: () => { dragActive = false; },
    winNow: () => { for (const e of enemies) if (!e.dead) { e.dead = true; winLeft--; } updateHud(); if (winLeft <= 0) win(); }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
