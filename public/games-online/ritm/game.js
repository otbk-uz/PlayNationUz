// Ritm Yugurish — ritmga mos cheksiz yuguruvchi. Sakra (past nayza), sirg'al (tepa to'sin).
// Harakatni zarbaga (beat) mosla — kombo o'sadi. Tezlik tobora oshadi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const BPM = 132, BEAT = 60 / BPM;
  const GRAV = 2100, JUMP = -760, MAXFALL = 1400;
  const HITWIN = 0.14;                 // zarbaga tushish oynasi (s)

  let W = 0, H = 0, groundY = 0, px = 120;
  let state = 'menu';
  let speed = 350, dist = 0, score = 0, bonus = 0, combo = 0, bestCombo = 0;
  let best = 0;
  let beatT = 0, pulse = 0, spawnGap = 1.2, speedTimer = 0, elapsed = 0, diff = 0;
  let flash = 0, flashCol = '255,255,255', shakeT = 0;
  const obs = [];       // {x,w,type,h,top}
  const bg = [];        // fon ustunlari
  const pop = [];       // kombo matnlari
  const stars = [];     // uzoq yulduzlar
  const sky = [];       // parallaks siluet binolar
  const dust = [];      // qo'nish changi
  let player = null, actx = null;

  try { best = parseInt(localStorage.getItem('ritm_best') || '0', 10) || 0; } catch (e) {}

  function reset() {
    speed = 350; dist = 0; score = 0; bonus = 0; combo = 0; bestCombo = 0;
    beatT = 0; pulse = 0; spawnGap = 1.2; speedTimer = 0; elapsed = 0; diff = 0; flash = 0; shakeT = 0;
    obs.length = 0; pop.length = 0;
    player = { feet: groundY, vy: 0, grounded: true, sliding: 0, w: 40 };
    document.getElementById('scorePill').textContent = '0';
    document.getElementById('bestPill').textContent = 'Rekord ' + best;
  }

  function beep(freq, dur, vol) {
    if (!actx) return;
    try { const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = freq; o.type = 'sine'; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(vol, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
      o.start(); o.stop(actx.currentTime + dur); } catch (e) {}
  }

  function playerH() { return player.sliding > 0 ? 26 : 54; }

  function doJump() {
    if (state !== 'play') return;
    onInput('jump');
    if (player.grounded) { player.vy = JUMP; player.grounded = false; player.sliding = 0; if (window.SFX) SFX.jump(); }
  }
  function doSlide() {
    if (state !== 'play') return;
    onInput('slide');
    player.sliding = 0.5;
    if (window.SFX) SFX.tone(520, 0.16, { type: 'sawtooth', vol: 0.1, to: 180 });
    if (!player.grounded) player.vy = Math.max(player.vy, 900); // havoda bo'lsa tez tushadi
  }
  function onInput(kind) {
    // zarbaga yaqinlikni tekshir
    const phase = beatT % BEAT, off = Math.min(phase, BEAT - phase);
    if (off <= HITWIN) {
      combo++; bestCombo = Math.max(bestCombo, combo);
      bonus += 5 + combo * 2;
      pop.push({ x: px, y: groundY - 120, t: 0, txt: 'x' + combo, col: '#34d399' });
      flash = 0.18; flashCol = '52,211,153'; if (window.SFX) SFX.coin();
    } else { combo = 0; }
  }

  function spawn() {
    const type = Math.random() < 0.56 ? 'jump' : 'slide';
    if (type === 'jump') {
      const tall = Math.random() < (0.25 + 0.45 * diff);
      obs.push({ x: W + 40, w: 34, type: 'spike', h: tall ? 66 : 42 });
    } else {
      obs.push({ x: W + 40, w: 48, barTop: groundY - 150, barBot: groundY - 56, type: 'bar' });
    }
  }

  function hit(o) {
    const h = playerH(), top = player.feet - h;
    const pr = { x: px, y: top, w: player.w, h };
    if (o.type === 'spike') {
      const r = { x: o.x, y: groundY - o.h, w: o.w, h: o.h };
      return pr.x < r.x + r.w && pr.x + pr.w > r.x && pr.y < r.y + r.h && pr.y + pr.h > r.y;
    } else {
      const r = { x: o.x, y: o.barTop, w: o.w, h: o.barBot - o.barTop };
      return pr.x < r.x + r.w && pr.x + pr.w > r.x && pr.y < r.y + r.h && pr.y + pr.h > r.y;
    }
  }

  function gameOver() {
    if (state !== 'play') return;
    state = 'dead'; shakeT = 0.4; flash = 0.25; flashCol = '251,113,133';
    if (score > best) { best = score; try { localStorage.setItem('ritm_best', String(best)); } catch (e) {} }
    if (window.SFX) { SFX.hit(); SFX.music(null); }
    if (window.Analytics) try { Analytics.track('gameover', { game: 'ritm', score, combo: bestCombo }); } catch (e) {}
    setTimeout(() => showPanel(true, "💥 Yiqilding!", "Ochko: <b>" + score + "</b> · Eng uzun kombo: <b>" + bestCombo + "</b><br>Rekord: <b>" + best + "</b>", "↻ Yana"), 550);
  }

  function update(dt) {
    const scr = state === 'play' ? speed : 60;
    for (const c of bg) { c.x -= c.v * scr * dt; if (c.x < -c.w) { c.x = W + Math.random() * 80; c.h = 30 + Math.random() * 160; } }
    for (const s of sky) { s.x -= s.v * scr * dt; if (s.x < -s.w) { s.x = W + Math.random() * 120; s.h = 60 + Math.random() * 200; } }
    for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.life += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 200 * dt; if (d.life >= d.max) dust.splice(i, 1); }
    if (flash > 0) flash -= dt; if (shakeT > 0) shakeT -= dt;
    beatT += dt; const prevPulse = pulse; pulse = Math.max(0, pulse - dt / BEAT);
    if (Math.floor((beatT) / BEAT) !== Math.floor((beatT - dt) / BEAT)) { pulse = 1; }
    for (let i = pop.length - 1; i >= 0; i--) { pop[i].t += dt; pop[i].y -= 30 * dt; if (pop[i].t > 0.7) pop.splice(i, 1); }

    if (state !== 'play') return;
    // qiyinlik oshishi
    elapsed += dt; diff = Math.min(1, elapsed / 55);
    speedTimer += dt; if (speedTimer > 4) { speedTimer = 0; speed = Math.min(730, speed + 17); }
    dist += speed * dt;
    score = Math.floor(dist / 9) + bonus;
    document.getElementById('scorePill').textContent = score;

    // o'yinchi fizikasi
    const p = player;
    if (p.sliding > 0) p.sliding -= dt;
    const wasAir = !p.grounded;
    p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);
    p.feet += p.vy * dt;
    if (p.feet >= groundY) {
      if (wasAir && p.vy > 200) { if (window.SFX) SFX.land(); for (let i = 0; i < 6; i++) dust.push({ x: px + p.w / 2 + (Math.random() - 0.5) * p.w, y: groundY, vx: -(60 + Math.random() * 120), vy: -(20 + Math.random() * 60), life: 0, max: 0.35 + Math.random() * 0.25 }); }
      p.feet = groundY; p.vy = 0; p.grounded = true;
    } else p.grounded = false;

    // to'siqlar
    for (let i = obs.length - 1; i >= 0; i--) {
      obs[i].x -= speed * dt;
      if (hit(obs[i])) return gameOver();
      if (obs[i].x + (obs[i].w || 40) < -20) obs.splice(i, 1);
    }
    // spawn — qiyinlik oshgani sari zichroq
    const rightmost = obs.length ? Math.max(...obs.map(o => o.x)) : -1e9;
    if (rightmost < W - spawnGap * speed) {
      spawn();
      const base = 1.45 - 0.62 * diff;                 // 1.45 → 0.83
      spawnGap = Math.max(0.62, base * (0.85 + Math.random() * 0.32));
    }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H - Math.min(150, H * 0.22);
    px = Math.max(90, W * 0.2);
    if (player && player.grounded) player.feet = groundY;
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function render() {
    let sx = 0, sy = 0; if (shakeT > 0) { sx = (Math.random() - 0.5) * 9 * shakeT / 0.4; sy = (Math.random() - 0.5) * 9 * shakeT / 0.4; }
    ctx.save(); ctx.translate(sx, sy);
    // fon
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0716'); g.addColorStop(0.55, '#140a24'); g.addColorStop(1, '#1a0f2c'); ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
    // yulduzlar (beat bilan jimirlaydi)
    for (const s of stars) { ctx.globalAlpha = s.a * (0.6 + 0.6 * pulse); ctx.fillStyle = '#c9b8ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // uzoq siluet binolar (parallaks)
    for (const s of sky) { ctx.fillStyle = `rgba(60,30,90,${0.5})`; ctx.fillRect(s.x, groundY - s.h, s.w, s.h);
      ctx.fillStyle = 'rgba(167,139,250,0.10)'; ctx.fillRect(s.x, groundY - s.h, s.w, 3); }
    // beat pulse halo
    if (pulse > 0) { ctx.fillStyle = `rgba(167,139,250,${0.10 * pulse})`; ctx.fillRect(-10, -10, W + 20, H + 20); }
    // fon ustunlari (equalizer)
    for (const c of bg) { const hh = c.h * (0.7 + 0.5 * pulse * c.b);
      ctx.fillStyle = `rgba(124,58,237,${0.12 + 0.12 * c.b})`; ctx.fillRect(c.x, groundY - hh, c.w, hh); }

    // yer
    ctx.strokeStyle = 'rgba(167,139,250,0.5)'; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(167,139,250,0.7)'; ctx.shadowBlur = 14 + 10 * pulse;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(124,58,237,0.10)'; ctx.fillRect(0, groundY, W, H - groundY);
    // beat chizig'i (o'yinchi oldida — zarba markeri)
    const phase = (beatT % BEAT) / BEAT;
    ctx.strokeStyle = `rgba(52,211,153,${0.25 + 0.35 * (1 - Math.abs(0.5 - phase) * 2)})`; ctx.lineWidth = 2;
    ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(px + 20, 40); ctx.lineTo(px + 20, groundY); ctx.stroke(); ctx.setLineDash([]);

    // to'siqlar
    for (const o of obs) {
      if (o.type === 'spike') {
        ctx.fillStyle = '#fb7185'; ctx.shadowColor = 'rgba(251,113,133,0.7)'; ctx.shadowBlur = 12;
        const n = o.h > 50 ? 3 : 2;
        for (let i = 0; i < n; i++) { const bx = o.x + i * (o.w / n);
          ctx.beginPath(); ctx.moveTo(bx, groundY); ctx.lineTo(bx + o.w / n / 2, groundY - o.h); ctx.lineTo(bx + o.w / n, groundY); ctx.fill(); }
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#22d3ee'; ctx.shadowColor = 'rgba(34,211,238,0.7)'; ctx.shadowBlur = 12;
        rr(o.x, o.barTop, o.w, o.barBot - o.barTop, 6); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(34,211,238,0.15)'; ctx.fillRect(o.x + o.w / 2 - 2, o.barBot, 4, groundY - o.barBot);
      }
    }

    // qo'nish changi
    for (const d of dust) { ctx.globalAlpha = Math.max(0, 1 - d.life / d.max) * 0.6; ctx.fillStyle = '#c9b8ff';
      ctx.beginPath(); ctx.arc(d.x, d.y, 2 + 3 * (1 - d.life / d.max), 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;

    // o'yinchi
    if (player) {
      const h = playerH(), top = player.feet - h, cx = px + player.w / 2, dead = state === 'dead';
      // yer soyasi
      const sha = player.grounded ? 1 : 0.4; ctx.fillStyle = `rgba(0,0,0,${0.3 * sha})`;
      ctx.beginPath(); ctx.ellipse(cx, groundY, player.w * 0.55, 6, 0, 0, 7); ctx.fill();
      // aura
      const gr = ctx.createRadialGradient(cx, player.feet - h / 2, 4, cx, player.feet - h / 2, 62);
      gr.addColorStop(0, dead ? 'rgba(251,113,133,0.5)' : 'rgba(251,191,36,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, player.feet - h / 2, 62, 0, 7); ctx.fill();
      // oyoq izlari
      ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 3;
      for (let i = 1; i <= 3; i++) { ctx.globalAlpha = 0.4 / i; ctx.beginPath(); ctx.moveTo(px - i * 12, player.feet - 6); ctx.lineTo(px - i * 12 - 14, player.feet - 6); ctx.stroke(); }
      ctx.globalAlpha = 1;
      // tana — gradient + glow
      ctx.shadowColor = dead ? 'rgba(251,113,133,0.7)' : 'rgba(251,191,36,0.6)'; ctx.shadowBlur = 16;
      const bg2 = ctx.createLinearGradient(0, top, 0, top + h);
      bg2.addColorStop(0, dead ? '#fda4b4' : '#fde08a'); bg2.addColorStop(1, dead ? '#fb7185' : '#f59e0b');
      ctx.fillStyle = bg2; rr(px, top, player.w, h, 12); ctx.fill(); ctx.shadowBlur = 0;
      // yaltiroq
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; rr(px + 5, top + 5, player.w - 10, h * 0.24, 6); ctx.fill();
      // ko'zlar + catchlight
      ctx.fillStyle = '#201400'; ctx.beginPath();
      ctx.arc(cx + 4, top + h * 0.36, 4, 0, 7); ctx.arc(cx + 14, top + h * 0.36, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath();
      ctx.arc(cx + 5.5, top + h * 0.33, 1.4, 0, 7); ctx.arc(cx + 15.5, top + h * 0.33, 1.4, 0, 7); ctx.fill();
    }

    // kombo pop
    for (const p of pop) { ctx.globalAlpha = 1 - p.t / 0.7; ctx.fillStyle = p.col; ctx.font = 'bold 24px system-ui'; ctx.textAlign = 'center'; ctx.fillText(p.txt, p.x + 20, p.y); }
    ctx.globalAlpha = 1;
    // kombo hisoblagich
    if (combo > 1 && state === 'play') { ctx.fillStyle = '#34d399'; ctx.font = 'bold 30px system-ui'; ctx.textAlign = 'center';
      ctx.globalAlpha = 0.9; ctx.fillText('KOMBO x' + combo, W / 2, 100); ctx.globalAlpha = 1; }

    ctx.restore();
    if (flash > 0) { ctx.fillStyle = `rgba(${flashCol},${Math.min(0.4, flash * 1.5)})`; ctx.fillRect(0, 0, W, H); }
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  function startGame() {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('ritm'); }
    showPanel(false); reset(); state = 'play';
  }
  document.getElementById('startBtn').addEventListener('click', startGame);

  const jkeys = ['Space', 'ArrowUp', 'KeyW'], skeys = ['ArrowDown', 'KeyS'];
  addEventListener('keydown', e => {
    if (jkeys.includes(e.code)) { if (!e.repeat) doJump(); e.preventDefault(); }
    if (skeys.includes(e.code)) { doSlide(); e.preventDefault(); }
  });
  function tap(id, fn) { const el = document.getElementById(id); if (!el) return;
    const f = e => { e.preventDefault(); fn(); };
    el.addEventListener('touchstart', f, { passive: false }); el.addEventListener('mousedown', f); }
  tap('btnJump', doJump); tap('btnSlide', doSlide);
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('touch').style.display = 'block';

  fit(); addEventListener('resize', fit);
  for (let i = 0; i < 14; i++) bg.push({ x: Math.random() * innerWidth, w: 26 + Math.random() * 30, h: 30 + Math.random() * 160, v: 0.35 + Math.random() * 0.5, b: Math.random() });
  for (let i = 0; i < 10; i++) sky.push({ x: Math.random() * innerWidth, w: 40 + Math.random() * 60, h: 60 + Math.random() * 200, v: 0.14 + Math.random() * 0.12 });
  for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight * 0.6, r: 0.6 + Math.random() * 1.4, a: 0.12 + Math.random() * 0.3 });
  player = { feet: groundY, vy: 0, grounded: true, sliding: 0, w: 40 };
  document.getElementById('bestPill').textContent = 'Rekord ' + best;
  requestAnimationFrame(frame);
})();
