// Klass (chizgich) — xalq bolalar o'yini. Ritmda sakrab klass kataklaridan o't, tosh turgan katakni chetlab.
// Pseudo-3D: perspektiv klass maydoni, kataklar chuqurlikda, sakrovchi o'yinchi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { steps: 6, marker: 3, time: 22, ring: 1.1, name: 'Boshlang\'ich' },
    { steps: 7, marker: 4, time: 22, ring: 1.3, name: 'Yengil' },
    { steps: 8, marker: 3, time: 24, ring: 1.55, name: 'O\'rta' },
    { steps: 9, marker: 6, time: 24, ring: 1.8, name: 'Qiyin' },
    { steps: 10, marker: 4, time: 26, ring: 2.1, name: 'Usta' },
  ];
  const SWEET_LO = 0.70, SWEET_HI = 0.96;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let steps = 0, marker = 0, i = 0, dir = 1, reachedTop = false, timeLeft = 0, g = 0, stun = 0, msg = '', hopA = 0;
  let horizonY = 0, nearY = 0;

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; steps = L.steps; marker = L.marker; timeLeft = L.time;
    i = 0; dir = 1; reachedTop = false; g = 0; stun = 0; msg = ''; hopA = 0; state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('timePill').textContent = '⏱ ' + Math.ceil(timeLeft);
    document.getElementById('statePill').textContent = reachedTop ? ('⬇ ' + i) : ('⬆ ' + i + '/' + steps);
  }
  const inSweet = () => g >= SWEET_LO && g <= SWEET_HI;

  function hop() {
    if (state !== 'play' || stun > 0) return;
    if (inSweet()) {
      let next = i + dir;
      if (next === marker) next = i + 2 * dir; // tosh katagini chetlab o't
      if (next > steps) next = steps;
      if (next < 0) next = 0;
      i = next; hopA = 1;
      if (window.SFX) SFX.tone(440 + i * 25, 0.07, { type: 'triangle', vol: 0.1, to: 560 });
      const p = stepPos(i); if (window.FX) FX.burst(p.x, p.y, '#8dffb0', 8);
      if (!reachedTop && i >= steps) { reachedTop = true; dir = -1; }
      else if (reachedTop && i <= 0) return win();
      updateHud();
    } else { stun = 0.36; hopA = -0.5; if (window.SFX) SFX.tone(150, 0.1, { type: 'square', vol: 0.07 }); if (window.FX) FX.shake(4); }
  }
  function win() { state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Klass ustasi!', "Barcha maydonni toshni chetlab, ritmda sakrab o'tding — chinakam chaqqon!", '↻ Qaytadan'), 1100); }
  function lose() { state = 'lost'; flashT = 0.5; msg = 'Vaqt tugadi! Qaytadan.'; if (window.SFX) SFX.death(); if (window.FX) FX.shake(7);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1200); }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (stun > 0) stun -= dt; if (hopA > -1) hopA = Math.max(-1, hopA - dt * 4);
    if (state !== 'play') return;
    timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; return lose(); }
    g += LEVELS[levelIdx].ring * dt; if (g >= 1) g -= 1;
    updateHud();
  }

  // ── perspektiv ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    horizonY = H * 0.26; nearY = H * 0.82;
  }
  // katak indeksi (0..steps) -> ekran (0 pastda/yaqin, steps yuqorida/uzoq)
  function stepPos(idx) {
    const t = idx / (steps + 0.5); const y = nearY + (horizonY - nearY) * t;
    const sc = 1 - t * 0.6; return { x: W / 2, y, sc, t };
  }
  function stepHalfW(sc) { return (W * 0.16) * sc; }

  function render() {
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 20); sky.addColorStop(0, '#243a52'); sky.addColorStop(1, '#5a7a6a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizonY + 20);
    ctx.fillStyle = '#6a6152'; ctx.fillRect(0, horizonY + 20, W, H - horizonY - 20);
    if (state === 'menu') return;
    // kataklar (uzoqdan yaqinga: yuqoridan pastga)
    for (let k = steps; k >= 1; k--) drawStep(k);
    // o'yinchi
    drawPlayer();
    if (window.FX) FX.render(ctx);
    // ritm ko'rsatkichi
    if (state === 'play') drawRing();
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.92); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawStep(k) {
    const p = stepPos(k), pw = stepPos(k - 1); const hw = stepHalfW(p.sc), hwB = stepHalfW(pw.sc);
    const yTop = p.y, yBot = pw.y;
    ctx.beginPath(); ctx.moveTo(p.x - hw, yTop); ctx.lineTo(p.x + hw, yTop); ctx.lineTo(pw.x + hwB, yBot); ctx.lineTo(pw.x - hwB, yBot); ctx.closePath();
    const isNext = (k === i + dir) || (k === i + 2 * dir && i + dir === marker);
    ctx.fillStyle = k === marker ? '#7a5a3a' : ((k % 2) ? '#d8cbb0' : '#c7b896');
    ctx.fill(); ctx.strokeStyle = 'rgba(60,50,30,.5)'; ctx.lineWidth = 2; ctx.stroke();
    // raqam
    ctx.fillStyle = 'rgba(70,55,30,.7)'; ctx.font = 'bold ' + Math.round(18 * p.sc + 6) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(k + '', p.x, (yTop + yBot) / 2);
    // tosh
    if (k === marker) { const cy = (yTop + yBot) / 2; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, cy + 6 * p.sc, 13 * p.sc, 5 * p.sc, 0, 0, 7); ctx.fill();
      const gg = ctx.createRadialGradient(p.x - 3 * p.sc, cy - 3 * p.sc, 1, p.x, cy, 11 * p.sc); gg.addColorStop(0, '#a89a86'); gg.addColorStop(1, '#5a5048');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(p.x, cy, 11 * p.sc, 8 * p.sc, 0, 0, 7); ctx.fill(); }
  }
  function drawPlayer() {
    const p = stepPos(i); const R = Math.min(1.5, W / 520) * p.sc; const jump = Math.max(0, hopA) * 22 * R;
    const y = p.y - 6 * R - jump;
    ctx.fillStyle = `rgba(0,0,0,${0.3 * (1 - Math.max(0, hopA) * 0.5)})`; ctx.beginPath(); ctx.ellipse(p.x, p.y - 2 * R, 12 * R, 5 * R, 0, 0, 7); ctx.fill();
    const gg = ctx.createLinearGradient(p.x, y - 40 * R, p.x, y); gg.addColorStop(0, '#5fe0ff'); gg.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = gg; rr(p.x - 8 * R, y - 34 * R, 16 * R, 32 * R, 6 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(p.x, y - 39 * R, 7 * R, 0, 7); ctx.fill();
    // bitta oyoq (klass — bir oyoqda)
    ctx.strokeStyle = '#1f6f9a'; ctx.lineWidth = 4 * R; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x, y - 4 * R); ctx.lineTo(p.x, y + 6 * R - jump * 0.2); ctx.stroke();
  }
  function drawRing() {
    // keyingi katak ustida qisqaruvchi halqa (ritm)
    let target = i + dir; if (target === marker) target = i + 2 * dir;
    if (target < 0 || target > steps) target = Math.max(0, Math.min(steps, target));
    const p = stepPos(target); const leap = (i + dir === marker);
    const rad = (34 - g * 24) * p.sc * Math.min(1.5, W / 520);
    ctx.strokeStyle = inSweet() ? '#8dffb0' : (leap ? '#ffd24a' : 'rgba(255,255,255,.6)'); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y - 20 * p.sc, Math.max(4, rad), 0, 7); ctx.stroke();
    if (inSweet()) { ctx.fillStyle = 'rgba(141,255,180,.9)'; ctx.font = '700 ' + Math.round(Math.min(18, W / 26)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(leap ? 'SAKRA! (toshdan o\'t)' : 'SAKRA!', W / 2, H * 0.14); }
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('klass'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doHop = e => { if (e) e.preventDefault(); hop(); };
  cv.addEventListener('mousedown', doHop); cv.addEventListener('touchstart', doHop, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doHop); actBtn.addEventListener('touchstart', doHop, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') doHop(e); else if (e.code === 'KeyR') reset(); });

  window.KL_TEST = {
    info: () => ({ level: levelIdx + 1, i, steps, marker, dir, reachedTop, timeLeft: +timeLeft.toFixed(1), g: +g.toFixed(3), sweet: inSweet(), stun: +stun.toFixed(2) }),
    state: () => state, hop: () => hop(), SWEET_LO, SWEET_HI
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
