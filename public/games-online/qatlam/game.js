// Qatlam — precision tower stack. Tepada siljiydigan blokni to'g'ri paytda TASHLA;
// oldingi qatlamdan chiqib qolgan qismi kesilib tushadi. Aynan ustma-ust tushirsang
// "PULS" — blok kengayadi, kombo o'sadi. Nishon balandlikka yet. Pseudo-3D minora.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { target: 8, speed: 190, name: 'Poydevor' },
    { target: 10, speed: 230, name: 'Uy' },
    { target: 12, speed: 270, name: 'Minora' },
    { target: 14, speed: 320, name: 'Osmono\'par' },
    { target: 16, speed: 380, name: 'Bulut' },
  ];
  const BH = 34;           // qatlam balandligi (px)
  const YLINE = 0.62;      // eng ustki qo'yilgan qatlamning ekran chizig'i (H ulushi)
  const PERFECT = 7;       // puls uchun aniqlik (px)
  const MINW = 10;         // shu kenglikdan pastda mag'lub
  const LIVES0 = 3;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', tm = 0;
  let stack = [], mov = { x: 0, w: 0, dir: 1 }, speed = 0, target = 0, lives = 0, combo = 0;
  let flashT = 0, flashCol = '', msg = '', msgT = 0, falls = [], cam = 0, camTo = 0;

  function baseW() { return Math.min(W * 0.5, 320); }

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    target = L.target; speed = L.speed; lives = LIVES0; combo = 0;
    const w0 = baseW();
    stack = [{ x: W / 2, w: w0, hue: 200 }];
    spawnMover(); flashT = 0; msg = ''; msgT = 0; falls = []; cam = 0; camTo = 0;
    state = 'play';
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('progPill').textContent = '🏗️ ' + stack.length + '/' + target;
    document.getElementById('statePill').textContent = '❤ ' + lives + (combo > 1 ? ' · x' + combo : '');
  }
  function spawnMover() {
    const top = stack[stack.length - 1];
    mov.w = top.w; mov.dir = Math.random() < 0.5 ? 1 : -1;
    mov.x = mov.dir > 0 ? W * 0.14 : W * 0.86;
  }

  function drop() {
    if (state !== 'play') return;
    const top = stack[stack.length - 1];
    const ml = mov.x - mov.w / 2, mr = mov.x + mov.w / 2;
    const tl = top.x - top.w / 2, tr = top.x + top.w / 2;
    const ol = Math.max(ml, tl), or = Math.min(mr, tr);
    const overlap = or - ol;
    if (overlap < MINW) return miss();
    const perfect = Math.abs(mov.x - top.x) <= PERFECT;
    let nx, nw;
    if (perfect) { nx = top.x; nw = Math.min(top.w + 8, baseW()); combo++;
      if (window.SFX) SFX.tone(500 + combo * 40, 0.08, { type: 'triangle', vol: 0.13, to: 760 });
      if (window.FX) FX.burst(top.x, movY(), '#8dffb0', 12);
    } else {
      combo = 0; nx = (ol + or) / 2; nw = overlap;
      if (window.SFX) SFX.tone(300, 0.06, { type: 'square', vol: 0.1 });
      // kesilgan bo'lak tushadi
      if (mov.x > top.x) falls.push({ x: (or + mr) / 2, w: mr - or, y: movY(), vy: 0, vx: 1 });
      else falls.push({ x: (ml + ol) / 2, w: ol - ml, y: movY(), vy: 0, vx: -1 });
    }
    const hue = 200 + stack.length * 14;
    stack.push({ x: nx, w: nw, hue });
    camTo += BH;
    updateHud();
    if (stack.length >= target) return win();
    spawnMover();
  }

  function miss() {
    lives--; flashT = 0.4; flashCol = '255,90,90'; combo = 0;
    if (window.SFX) SFX.hit(); if (window.FX) FX.shake(8);
    falls.push({ x: mov.x, w: mov.w, y: screenY(stack.length), vy: 0, vx: mov.dir });
    if (lives <= 0) { msg = 'Minora quladi!'; msgT = 1.2; if (window.SFX) SFX.death();
      state = 'lost'; setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1200); return; }
    msg = 'Chetga ketdi!'; msgT = 1.0; updateHud(); spawnMover();
  }
  function win() {
    state = 'won'; flashT = 0.5; flashCol = '141,255,180'; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) { msg = 'Bosqich o\'tdi! 🏗️'; msgT = 1.2; setTimeout(() => load(levelIdx + 1), 1200); }
    else setTimeout(() => showPanel('🎉 Bosh me\'mor!', 'Barcha bosqichda minorani mustahkam qurding — aniqlik ustasi!', '↻ Qaytadan'), 1200);
  }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (msgT > 0) { msgT -= dt; if (msgT <= 0) msg = ''; }
    cam += (camTo - cam) * Math.min(1, dt * 8);
    for (const f of falls) { f.vy += 900 * dt; f.y += f.vy * dt; f.x += f.vx * 120 * dt; f.rot = (f.rot || 0) + dt * 3; }
    falls = falls.filter(f => f.y < H + 100);
    if (state !== 'play') return;
    const spd = speed + stack.length * 6;
    mov.x += mov.dir * spd * dt;
    const lo = W * 0.1, hi = W * 0.9;
    if (mov.x > hi) { mov.x = hi; mov.dir = -1; } if (mov.x < lo) { mov.x = lo; mov.dir = 1; }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function movY() { return H * YLINE - BH - (camTo - cam); }
  function slabY(levelIndex) { return H * YLINE + (stack.length - 1 - levelIndex) * BH - (camTo - cam); }

  function render() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1230'); sky.addColorStop(0.5, '#182a54'); sky.addColorStop(1, '#24406e');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawStars();
    if (state === 'menu') return;
    // stack (pastdan tepaga)
    for (let i = 0; i < stack.length; i++) drawSlab(stack[i], slabY(i), false);
    // tushayotgan bo'laklar
    for (const f of falls) drawFall(f);
    // moving block
    if (state === 'play') drawSlab({ x: mov.x, w: mov.w, hue: 200 + stack.length * 14 }, movY(), true);
    if (window.FX) FX.render(ctx);
    // markaz chizig'i (aniqlik uchun)
    if (state === 'play') { const top = stack[stack.length - 1]; ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(top.x, movY() - 20); ctx.lineTo(top.x, slabY(stack.length - 1) + BH); ctx.stroke(); ctx.setLineDash([]); }
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '800 ' + Math.round(Math.min(30, W / 16)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.2); }
    if (combo > 1 && state === 'play') { ctx.fillStyle = 'rgba(141,255,180,.9)'; ctx.font = '800 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('PULS x' + combo, W / 2, H * 0.16); }
    if (flashT > 0) { ctx.fillStyle = 'rgba(' + flashCol + ',' + Math.min(.28, flashT) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  let starCache = null;
  function drawStars() {
    if (!starCache) { starCache = []; for (let i = 0; i < 36; i++) starCache.push({ x: Math.random(), y: Math.random() * 0.5, r: Math.random() * 1.3 + 0.4 }); }
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (const s of starCache) { ctx.globalAlpha = 0.25 + 0.45 * Math.abs(Math.sin(tm * 0.7 + s.x * 9)); ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  const DEPTH = 14;  // 3D chuqurlik (px)
  function drawSlab(b, y, moving) {
    if (y > H + BH || y < -BH * 2) return;
    const x = b.x, w = b.w, hl = x - w / 2, hr = x + w / 2;
    const front = 'hsl(' + (b.hue % 360) + ',55%,52%)';
    const side = 'hsl(' + (b.hue % 360) + ',55%,38%)';
    const topc = 'hsl(' + (b.hue % 360) + ',50%,66%)';
    // front face
    ctx.fillStyle = moving ? 'hsl(' + (b.hue % 360) + ',70%,60%)' : front;
    ctx.fillRect(hl, y, w, BH);
    // top face (parallelogram, 3D)
    ctx.fillStyle = topc; ctx.beginPath(); ctx.moveTo(hl, y); ctx.lineTo(hl + DEPTH, y - DEPTH); ctx.lineTo(hr + DEPTH, y - DEPTH); ctx.lineTo(hr, y); ctx.closePath(); ctx.fill();
    // side face
    ctx.fillStyle = side; ctx.beginPath(); ctx.moveTo(hr, y); ctx.lineTo(hr + DEPTH, y - DEPTH); ctx.lineTo(hr + DEPTH, y - DEPTH + BH); ctx.lineTo(hr, y + BH); ctx.closePath(); ctx.fill();
    if (moving) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(hl, y, w, BH); }
  }
  function drawFall(f) {
    ctx.save(); ctx.translate(f.x, f.y + BH / 2); ctx.rotate((f.rot || 0) * f.vx);
    ctx.fillStyle = 'hsl(210,45%,48%)'; ctx.fillRect(-f.w / 2, -BH / 2, f.w, BH);
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('qatlam'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doAct = e => { if (e) e.preventDefault(); drop(); };
  cv.addEventListener('mousedown', doAct); cv.addEventListener('touchstart', doAct, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doAct); actBtn.addEventListener('touchstart', doAct, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doAct(e); else if (e.code === 'KeyR') reset(); });

  window.QT_TEST = {
    info: () => ({ level: levelIdx + 1, height: stack.length, target, lives, combo, movX: +mov.x.toFixed(1), topX: +stack[stack.length - 1].x.toFixed(1), topW: +stack[stack.length - 1].w.toFixed(1) }),
    state: () => state, drop: () => drop()
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
