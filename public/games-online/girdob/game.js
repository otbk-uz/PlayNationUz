// Girdob — whirlpool flow-navigation. Qayiq oldinga suzadi; chap/o'ng burib
// yo'nalishni sozlaysan. Suvdagi girdoblar oqim hosil qiladi — ularni aylanib
// o't yoki oqimidan foydalanib tepadagi darvozaga yet. Girdob markaziga tortilsang
// jon yo'qotasan. 2.5D: qiya suv sathi, spiral girdoblar, izli qayiq.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // bosqichlar: girdoblar (nx,ny,R,swirl,pull), darvoza kengligi, oldinga tezlik
  const LEVELS = [
    { name: 'Ko\'l', fwd: 0.18, gate: 0.30, lives: 3, pools: [ [0.35, 0.55, 0.17, 1, 0.30], [0.68, 0.35, 0.16, -1, 0.28] ] },
    { name: 'Daryo', fwd: 0.19, gate: 0.26, lives: 3, pools: [ [0.28, 0.62, 0.17, 1, 0.32], [0.60, 0.5, 0.17, -1, 0.33], [0.72, 0.28, 0.15, 1, 0.30] ] },
    { name: 'Sarob', fwd: 0.20, gate: 0.24, lives: 3, pools: [ [0.32, 0.68, 0.18, -1, 0.35], [0.5, 0.5, 0.17, 1, 0.36], [0.68, 0.62, 0.16, -1, 0.34], [0.55, 0.30, 0.16, 1, 0.33] ] },
    { name: 'Bo\'ron', fwd: 0.21, gate: 0.22, lives: 3, pools: [ [0.25, 0.7, 0.18, 1, 0.38], [0.48, 0.58, 0.17, -1, 0.38], [0.72, 0.55, 0.18, 1, 0.37], [0.38, 0.38, 0.16, -1, 0.35], [0.62, 0.30, 0.16, 1, 0.35] ] },
    { name: 'Ummon', fwd: 0.22, gate: 0.20, lives: 3, pools: [ [0.28, 0.74, 0.19, -1, 0.40], [0.52, 0.64, 0.18, 1, 0.41], [0.74, 0.6, 0.18, -1, 0.40], [0.4, 0.46, 0.17, 1, 0.38], [0.62, 0.4, 0.17, -1, 0.38], [0.5, 0.26, 0.16, 1, 0.36] ] },
  ];
  const TURN = 3.0;      // burilish tezligi (rad/s)
  const EXITY = 0.14;    // darvoza balandligi (H ulushi)
  const STARTY = 0.86;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', tm = 0;
  let boat = { x: 0, y: 0, h: -Math.PI / 2 }, steer = 0, wake = [];
  let pools = [], fwd = 0, gateX = 0, gateW = 0, lives = 0, flashT = 0, flashCol = '', msg = '', msgT = 0, killed = 0;

  function BASE() { return Math.min(W, H); }

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    fwd = L.fwd; gateW = L.gate; lives = L.lives;
    gateX = 0.5; // darvoza markazi (nx)
    pools = L.pools.map(p => ({ x: p[0], y: p[1], R: p[2], dir: p[3], pull: p[4] }));
    spawn(); wake = []; steer = 0; flashT = 0; msg = ''; msgT = 0; killed = 0;
    state = 'play';
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function spawn() { boat.x = 0.5; boat.y = STARTY; boat.h = -Math.PI / 2; }
  function updateHud() {
    document.getElementById('progPill').textContent = '🌀 ' + (levelIdx + 1) + '/' + LEVELS.length;
    document.getElementById('statePill').textContent = '❤ ' + lives;
  }

  // oqim maydoni (normalizatsiyalangan koordinatada, birlik = H)
  function flow(nx, ny) {
    let vx = 0, vy = 0;
    for (const p of pools) {
      const dx = nx - p.x, dy = ny - p.y, dist = Math.hypot(dx, dy);
      if (dist < p.R && dist > 0.0001) {
        const f = (1 - dist / p.R);
        // tangensial (aylanma)
        const tx = -dy / dist, ty = dx / dist;
        vx += tx * p.dir * f * p.pull; vy += ty * p.dir * f * p.pull;
        // ichkariga tortish (zaif — chekkasi xavfsiz, faqat markaz o'ldiradi)
        vx += (-dx / dist) * f * p.pull * 0.3; vy += (-dy / dist) * f * p.pull * 0.3;
      }
    }
    return { x: vx, y: vy };
  }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (msgT > 0) { msgT -= dt; if (msgT <= 0) msg = ''; }
    if (state !== 'play') return;
    boat.h += steer * TURN * dt;
    const fl = flow(boat.x, boat.y);
    let vx = Math.cos(boat.h) * fwd + fl.x;
    let vy = Math.sin(boat.h) * fwd + fl.y;
    boat.x += vx * dt; boat.y += vy * dt;
    // yon devorlar — qaytarish
    if (boat.x < 0.04) { boat.x = 0.04; boat.h = Math.PI - boat.h; }
    if (boat.x > 0.96) { boat.x = 0.96; boat.h = Math.PI - boat.h; }
    if (boat.y > 0.98) { boat.y = 0.98; boat.h = -boat.h; }
    // iz
    wake.push({ x: boat.x, y: boat.y }); if (wake.length > 26) wake.shift();
    // girdob markaziga tortilish
    for (const p of pools) {
      if (Math.hypot(boat.x - p.x, boat.y - p.y) < p.R * 0.15) return sucked();
    }
    // darvozaga yetish
    if (boat.y < EXITY) {
      if (Math.abs(boat.x - gateX) < gateW / 2) return win();
      // devor — qaytar
      boat.y = EXITY; boat.h = -boat.h;
    }
  }

  function sucked() {
    lives--; killed++; flashT = 0.4; flashCol = '90,150,255';
    if (window.SFX) SFX.hit(); if (window.FX) FX.shake(9);
    if (lives <= 0) { msg = 'Girdob yutdi!'; msgT = 1.2; if (window.SFX) SFX.death();
      state = 'lost'; setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1200); return; }
    msg = 'Girdobga tushding!'; msgT = 1.1; spawn(); wake = []; updateHud();
  }
  function win() {
    state = 'won'; flashT = 0.5; flashCol = '141,255,180'; if (window.SFX) SFX.win();
    if (window.FX) { FX.burst(gateX * W, EXITY * H, '#8dffb0', 22); }
    if (levelIdx + 1 < LEVELS.length) { msg = 'Darvozadan o\'tding! 🌀'; msgT = 1.2; setTimeout(() => load(levelIdx + 1), 1200); }
    else setTimeout(() => showPanel('🎉 Ummon ustasi!', 'Barcha girdoblardan omon o\'tib darvozaga yetding — suv ustasi!', '↻ Qaytadan'), 1200);
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // 2.5D: yuqoriga uzoqlashgan sari gorizontal siqilish (qiya sath)
  function sx(nx, ny) { const t = ny; return W * (0.5 + (nx - 0.5) * (0.5 + 0.5 * t)); }
  function sy(ny) { return ny * H; }

  function render() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1c3a'); sky.addColorStop(EXITY, '#0e2a4e'); sky.addColorStop(1, '#0a3a5a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') { drawRipples(); return; }
    drawRipples();
    drawPools();
    drawWake();
    drawBoat();
    drawGate();
    if (window.FX) FX.render(ctx);
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '800 ' + Math.round(Math.min(30, W / 16)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.24); }
    if (flashT > 0) { ctx.fillStyle = 'rgba(' + flashCol + ',' + Math.min(.28, flashT) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  function drawRipples() {
    ctx.strokeStyle = 'rgba(150,210,255,.06)'; ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const ny = (i / 9 + (tm * 0.02) % (1 / 9));
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) { const nx = k / 20; const yy = sy(ny) + Math.sin(nx * 12 + tm + i) * 3; if (k === 0) ctx.moveTo(sx(nx, ny), yy); else ctx.lineTo(sx(nx, ny), yy); }
      ctx.stroke();
    }
  }

  function drawGate() {
    const y = sy(EXITY), lx = sx(gateX - gateW / 2, EXITY), rx = sx(gateX + gateW / 2, EXITY);
    // banner
    ctx.fillStyle = 'rgba(141,255,180,.14)'; ctx.fillRect(lx, 0, rx - lx, y);
    ctx.strokeStyle = 'rgba(141,255,180,.6)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, 0); ctx.moveTo(rx, y); ctx.lineTo(rx, 0); ctx.stroke(); ctx.setLineDash([]);
    // ustunlar
    for (const px of [lx, rx]) { ctx.fillStyle = '#7ad0a0'; ctx.beginPath(); ctx.arc(px, y, 8, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(200,255,220,.85)'; ctx.font = '700 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('DARVOZA', (lx + rx) / 2, y - 8);
  }

  function drawPools() {
    for (const p of pools) {
      const cx = sx(p.x, p.y), cy = sy(p.y), R = p.R * H;
      // funnel: konsentrik ellipslar (qiya => vertikal siqilgan)
      // spiral funnel: markazga qarab burilib boradigan bir tekis chizma
      ctx.strokeStyle = 'rgba(120,190,255,.4)'; ctx.lineWidth = 2; ctx.beginPath();
      const turns = 3.2, steps = 70, base = tm * 2.2 * p.dir;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps; const rad = R * (1 - u * 0.9);
        const a = base + u * turns * Math.PI * 2 * p.dir;
        const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad * 0.5;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // ikkinchi spiral (chuqurlik hissi)
      ctx.strokeStyle = 'rgba(80,150,230,.22)'; ctx.beginPath();
      for (let k = 0; k <= steps; k++) {
        const u = k / steps; const rad = R * (1 - u * 0.9);
        const a = base + Math.PI + u * turns * Math.PI * 2 * p.dir;
        const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad * 0.5;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // markaz (qorong'i quduq)
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, R * 0.3);
      g.addColorStop(0, '#04101f'); g.addColorStop(1, 'rgba(10,40,70,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.3, R * 0.16, 0, 0, 7); ctx.fill();
    }
  }

  function drawWake() {
    for (let i = 0; i < wake.length; i++) {
      const a = i / wake.length; const x = sx(wake[i].x, wake[i].y), y = sy(wake[i].y);
      ctx.fillStyle = 'rgba(180,230,255,' + (a * 0.4) + ')'; ctx.beginPath(); ctx.arc(x, y, 4 * a + 1, 0, 7); ctx.fill();
    }
  }

  function drawBoat() {
    const x = sx(boat.x, boat.y), y = sy(boat.y), s = (0.6 + 0.6 * boat.y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(boat.h + Math.PI / 2);
    // soya
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 6 * s, 12 * s, 5 * s, 0, 0, 7); ctx.fill();
    // qayiq (barg shakli)
    const g = ctx.createLinearGradient(0, -16 * s, 0, 12 * s); g.addColorStop(0, '#ffd88a'); g.addColorStop(1, '#c8863a');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(0, -16 * s); ctx.quadraticCurveTo(11 * s, 0, 0, 12 * s); ctx.quadraticCurveTo(-11 * s, 0, 0, -16 * s); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,.7)'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(0, -14 * s); ctx.lineTo(0, 10 * s); ctx.stroke();
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('girdob'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);

  function bindHold(btn, dir) {
    if (!btn) return;
    const dn = e => { if (e) e.preventDefault(); steer = dir; };
    const up = e => { if (e) e.preventDefault(); if (steer === dir) steer = 0; };
    btn.addEventListener('mousedown', dn); btn.addEventListener('touchstart', dn, { passive: false });
    btn.addEventListener('mouseup', up); btn.addEventListener('mouseleave', up);
    btn.addEventListener('touchend', up); btn.addEventListener('touchcancel', up);
  }
  bindHold(document.getElementById('leftBtn'), -1);
  bindHold(document.getElementById('rightBtn'), 1);
  addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') steer = -1;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') steer = 1;
    else if (e.code === 'KeyR') reset();
  });
  addEventListener('keyup', e => {
    if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && steer === -1) steer = 0;
    if ((e.code === 'ArrowRight' || e.code === 'KeyD') && steer === 1) steer = 0;
  });

  window.GR_TEST = {
    info: () => ({ level: levelIdx + 1, lives, x: +boat.x.toFixed(3), y: +boat.y.toFixed(3), h: +boat.h.toFixed(3), gateX, gateW, killed,
      pools: pools.map(p => ({ x: p.x, y: p.y, R: p.R })) }),
    state: () => state, input: (d) => { steer = d; }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
