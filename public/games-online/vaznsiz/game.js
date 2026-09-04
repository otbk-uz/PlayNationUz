// Vaznsiz To'p — zero-g flick. Orqaga tort-qo'yvor (sling); devorlardan sakraydi; yulduz yig'.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const AW = 1000, AH = 640;                 // mantiqiy arena
  const R = 18, SR = 20, REST = 0.86, FR = 0.16;   // to'p r, yulduz r, restitution, friction/sek

  // wall: [x,y,w,h] ; star: [x,y] ; ball: [x,y]
  const LEVELS = [
    { ball: [150, 320], stars: [[850, 320]], walls: [], par: 1 },
    { ball: [150, 150], stars: [[850, 500]], walls: [[470, 0, 60, 420]], par: 2 },
    { ball: [150, 320], stars: [[850, 150], [850, 500]], walls: [[470, 200, 60, 440]], par: 3 },
    { ball: [150, 540], stars: [[850, 100], [150, 100]], walls: [[300, 0, 60, 460], [640, 180, 60, 460]], par: 3 },
    { ball: [500, 560], stars: [[120, 90], [880, 90], [500, 90]], walls: [[0, 200, 380, 60], [620, 200, 380, 60]], par: 4 },
    { ball: [150, 320], stars: [[850, 320], [500, 110], [500, 530]], walls: [[300, 250, 400, 140]], par: 4 },
    { ball: [120, 120], stars: [[880, 120], [880, 520], [120, 520]], walls: [[260, 160, 60, 320], [680, 160, 60, 320], [320, 160, 360, 60]], par: 5 },
    { ball: [500, 320], stars: [[110, 110], [890, 110], [110, 530], [890, 530]], walls: [[430, 250, 140, 140]], par: 5 },
    { ball: [150, 320], stars: [[850, 90], [850, 550], [500, 320]], walls: [[300, 0, 55, 260], [300, 380, 55, 260], [650, 190, 55, 260]], par: 6 },
    { ball: [500, 580], stars: [[120, 110], [500, 110], [880, 110], [500, 330]], walls: [[0, 220, 400, 55], [600, 220, 400, 55], [430, 400, 140, 55]], par: 6 },
  ];

  let levelIdx = 0, walls, stars, ball, par, shots, collected, total;
  let state = 'menu', aiming = false, aimX = 0, aimY = 0, flashT = 0, shakeT = 0;
  const dust = [];

  function load(idx) {
    const L = LEVELS[idx]; levelIdx = idx; par = L.par;
    walls = L.walls.map(w => ({ x: w[0], y: w[1], w: w[2], h: w[3] }));
    stars = L.stars.map(s => ({ x: s[0], y: s[1], got: false }));
    total = stars.length; collected = 0; shots = 0;
    ball = { x: L.ball[0], y: L.ball[1], vx: 0, vy: 0 };
    state = 'play'; aiming = false; dust.length = 0;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updHud(); fit();
  }
  function updHud() { document.getElementById('starPill').textContent = '★ ' + collected + '/' + total;
    document.getElementById('shotPill').textContent = 'Zarba ' + shots + ' · Par ' + par; }
  function reset() { load(levelIdx); }
  const moving = () => Math.hypot(ball.vx, ball.vy) > 6;

  function shoot(dx, dy) {
    const pull = Math.min(260, Math.hypot(dx, dy)); if (pull < 12) return;
    const a = Math.atan2(dy, dx); const power = pull * 13;
    ball.vx = -Math.cos(a) * power; ball.vy = -Math.sin(a) * power;
    shots++; updHud(); if (window.SFX) SFX.tone(300, 0.12, { type: 'square', vol: 0.12, to: 620 });
  }

  function collideRect(rc) {
    const cx = Math.max(rc.x, Math.min(ball.x, rc.x + rc.w)), cy = Math.max(rc.y, Math.min(ball.y, rc.y + rc.h));
    let dx = ball.x - cx, dy = ball.y - cy, d2 = dx*dx + dy*dy;
    if (d2 < R*R) { let d = Math.sqrt(d2) || 0.001, nx = dx/d, ny = dy/d;
      ball.x = cx + nx*R; ball.y = cy + ny*R; const vn = ball.vx*nx + ball.vy*ny;
      if (vn < 0) { ball.vx -= (1+REST)*vn*nx; ball.vy -= (1+REST)*vn*ny; if (window.SFX && Math.abs(vn) > 60) SFX.tone(200, 0.05, { type: 'sine', vol: 0.06 }); } }
  }

  function physics(dt) {
    const sp = Math.hypot(ball.vx, ball.vy); if (sp < 0.01) return;
    const steps = Math.max(1, Math.ceil(sp * dt / (R * 0.5)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      ball.x += ball.vx * h; ball.y += ball.vy * h;
      if (ball.x < R) { ball.x = R; ball.vx = -ball.vx * REST; } if (ball.x > AW - R) { ball.x = AW - R; ball.vx = -ball.vx * REST; }
      if (ball.y < R) { ball.y = R; ball.vy = -ball.vy * REST; } if (ball.y > AH - R) { ball.y = AH - R; ball.vy = -ball.vy * REST; }
      for (const w of walls) collideRect(w);
      for (const s of stars) if (!s.got && Math.hypot(ball.x - s.x, ball.y - s.y) < R + SR) { s.got = true; collected++; updHud(); flashT = 0.15;
        for (let k = 0; k < 8; k++) dust.push({ x: s.x, y: s.y, a: Math.random()*7, sp: 60+Math.random()*120, t: 0 });
        if (window.SFX) SFX.coin();
        if (collected >= total && state === 'play') { win(); return; } }
    }
    ball.vx *= Math.pow(FR, dt); ball.vy *= Math.pow(FR, dt);
    if (Math.hypot(ball.vx, ball.vy) < 6) { ball.vx = 0; ball.vy = 0; }
  }
  function win() { state = 'won'; flashT = 0.4; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 800);
    else setTimeout(() => showPanel(true, "🎉 Ajoyib!", "Barcha bosqichda yulduzlarni yig'ding — kosmik snayper bo'lding!", "↻ Qaytadan"), 800);
  }

  function update(dt) {
    if (flashT > 0) flashT -= dt; if (shakeT > 0) shakeT -= dt;
    for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.t += dt*2; d.x += Math.cos(d.a)*d.sp*dt; d.y += Math.sin(d.a)*d.sp*dt; if (d.t >= 1) dust.splice(i, 1); }
    if (state === 'play') physics(dt);
    // to'p to'xtagach yulduz to'liq bo'lsa g'alaba (physics ichida ham tekshiriladi)
  }

  // ── render ──
  let SC = 1, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    SC = Math.min((innerWidth - 24) / AW, (innerHeight - 150) / AH);
    OX = (innerWidth - AW * SC) / 2; OY = (innerHeight - AH * SC) / 2 + 6;
  }
  const TX = x => OX + x * SC, TY = y => OY + y * SC;
  function rr(x, y, w, h, r) { r = Math.min(r, w/2, h/2); ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function starPath(cx, cy, rad, rot) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i*Math.PI/5, rr2 = i%2?rad*0.45:rad; ctx.lineTo(cx+Math.cos(a)*rr2, cy+Math.sin(a)*rr2); } ctx.closePath(); }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#070a16'); bgg.addColorStop(1, '#0a0f24');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!ball) { ctx.restore(); return; }
    let sx = 0, sy = 0; if (shakeT > 0) { sx=(Math.random()-.5)*6*shakeT; sy=(Math.random()-.5)*6*shakeT; }
    ctx.translate(sx, sy);
    // arena
    ctx.fillStyle = '#0a1020'; rr(TX(0), TY(0), AW*SC, AH*SC, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(120,150,220,0.25)'; ctx.lineWidth = 2; rr(TX(0), TY(0), AW*SC, AH*SC, 14); ctx.stroke();
    // devorlar
    for (const w of walls) { const g = ctx.createLinearGradient(0, TY(w.y), 0, TY(w.y+w.h)); g.addColorStop(0, '#2a3556'); g.addColorStop(1, '#182339');
      ctx.fillStyle = g; rr(TX(w.x), TY(w.y), w.w*SC, w.h*SC, 6); ctx.fill();
      ctx.fillStyle = 'rgba(150,180,235,0.15)'; rr(TX(w.x)+2, TY(w.y)+2, w.w*SC-4, 4, 2); ctx.fill(); }
    // yulduzlar
    for (const s of stars) { if (s.got) continue; ctx.save(); ctx.shadowColor = 'rgba(251,191,36,0.8)'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24'; starPath(TX(s.x), TY(s.y), SR*SC, performance.now()/900); ctx.fill();
      ctx.fillStyle = '#fff7d6'; starPath(TX(s.x), TY(s.y), SR*SC*0.5, performance.now()/900); ctx.fill(); ctx.restore(); }
    // dust
    for (const d of dust) { ctx.globalAlpha = 1-d.t; ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(TX(d.x), TY(d.y), 3*(1-d.t)+1, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    // nishon chizig'i
    if (aiming) { const bx = TX(ball.x), by = TY(ball.y), dx = aimX - bx, dy = aimY - by, pull = Math.min(260*SC, Math.hypot(dx,dy));
      const a = Math.atan2(dy, dx);
      ctx.strokeStyle = 'rgba(251,191,36,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([6,6]);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - Math.cos(a)*pull, by - Math.sin(a)*pull); ctx.stroke(); ctx.setLineDash([]);
      // power arrow head
      const ex = bx - Math.cos(a)*pull, ey = by - Math.sin(a)*pull;
      ctx.fillStyle = 'rgba(251,191,36,0.8)'; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, 7); ctx.fill(); }
    // to'p
    const bx = TX(ball.x), by = TY(ball.y), br = R*SC;
    ctx.save(); ctx.shadowColor = 'rgba(56,189,248,0.7)'; ctx.shadowBlur = 14;
    const g = ctx.createRadialGradient(bx-br*0.3, by-br*0.3, br*0.2, bx, by, br); g.addColorStop(0, '#eaf7ff'); g.addColorStop(1, '#38bdf8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill(); ctx.restore();
    if (state === 'play' && !moving()) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, br + 4 + 2*Math.sin(performance.now()/300), 0, 7); ctx.stroke(); }
    ctx.restore();
    if (flashT > 0) { ctx.fillStyle = `rgba(251,191,36,${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last)/1000 || 0); last = t; if (state !== 'menu') update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('vaznsiz'); } showPanel(false); if (state === 'win' || state === 'menu') load(0); });
  document.getElementById('resetBtn').addEventListener('click', reset);
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); });

  function pos(e) { const rect = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - rect.left, t.clientY - rect.top]; }
  function onDown(e) { if (state !== 'play' || moving()) return; e.preventDefault(); const p = pos(e);
    const bx = TX(ball.x), by = TY(ball.y); if (Math.hypot(p[0]-bx, p[1]-by) < R*SC*3.5) { aiming = true; aimX = p[0]; aimY = p[1]; } }
  function onMove(e) { if (!aiming) return; e.preventDefault(); const p = pos(e); aimX = p[0]; aimY = p[1]; }
  function onUp(e) { if (!aiming) return; aiming = false; const bx = TX(ball.x), by = TY(ball.y);
    shoot((aimX - bx) / SC, (aimY - by) / SC); }
  cv.addEventListener('mousedown', onDown); addEventListener('mousemove', onMove); addEventListener('mouseup', onUp);
  cv.addEventListener('touchstart', onDown, { passive: false }); cv.addEventListener('touchmove', onMove, { passive: false }); addEventListener('touchend', onUp);

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
