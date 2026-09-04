// Arqon tortish — xalq kuch o'yini. Ritmga mos tortib, ip belgisini o'z tomoningga o'tkaz.
// Pseudo-3D: perspektiv maydon, ikki jamoa, chuqurlik.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { ai: 0.14, sweep: 1.3, zone: 0.22, name: 'Qishloq' },
    { ai: 0.18, sweep: 1.5, zone: 0.20, name: 'Mahalla' },
    { ai: 0.22, sweep: 1.7, zone: 0.18, name: 'Tuman' },
    { ai: 0.27, sweep: 1.9, zone: 0.16, name: 'Viloyat' },
    { ai: 0.30, sweep: 2.2, zone: 0.15, name: 'Chempion' },
  ];
  const PULL = 0.12, SLIP = 0.045;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let pos = 0, sweep = 0, sweepDir = 1, combo = 0, shakeT = 0, pullT = 0, aiPullT = 0, msg = '';
  let zoneLo = 0.6, zoneHi = 0.82, groundY = 0;

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    pos = 0; sweep = 0; sweepDir = 1; combo = 0; msg = ''; pullT = 0; aiPullT = 0; shakeT = 0;
    const zc = 0.72; zoneLo = zc - L.zone / 2; zoneHi = zc + L.zone / 2;
    state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    const pct = Math.round((pos + 1) / 2 * 100);
    document.getElementById('statePill').textContent = pos > 0.05 ? ('💪 SIZ ' + pct + '%') : pos < -0.05 ? ('🤖 AI ' + (100 - pct) + '%') : '⚖ teng';
    document.getElementById('comboPill').textContent = 'kombo ' + combo;
  }
  const inZone = () => sweep >= zoneLo && sweep <= zoneHi;

  function pull() {
    if (state !== 'play') return;
    if (inZone()) {
      combo = Math.min(6, combo + 1); pos += PULL + combo * 0.015; pullT = 0.2; shakeT = 0.15;
      if (window.SFX) SFX.tone(220 + combo * 40, 0.07, { type: 'sawtooth', vol: 0.13, to: 340 });
      if (window.FX) FX.burst(W * 0.5 + pos * W * 0.3, groundY - 10, '#ffd88a', 6);
    } else {
      combo = 0; pos -= SLIP; if (window.SFX) SFX.tone(140, 0.06, { type: 'square', vol: 0.06 });
    }
    if (pos >= 1) { pos = 1; return win(); }
    updateHud();
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (window.FX) FX.burst(W * 0.7, groundY - 20, '#8dffb0', 24);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Arqon chempioni!', "Barcha bosqichda raqib jamoani yengib ipni o'z tomoningga tuduring — kuch senda!", '↻ Qaytadan'), 1100);
  }
  function lose() {
    state = 'lost'; flashT = 0.5; msg = 'Raqib tortib ketdi! Qaytadan.'; if (window.SFX) SFX.death(); if (window.FX) FX.shake(9);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1100);
  }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (pullT > 0) pullT -= dt; if (aiPullT > 0) aiPullT -= dt; if (shakeT > 0) shakeT -= dt;
    if (state !== 'play') return;
    const L = LEVELS[levelIdx];
    // sweep indikatori (0..1 tebranadi)
    sweep += sweepDir * L.sweep * dt; if (sweep > 1) { sweep = 1; sweepDir = -1; } if (sweep < 0) { sweep = 0; sweepDir = 1; }
    // AI doimiy tortadi
    pos -= L.ai * dt; if (Math.random() < L.ai * dt * 2) aiPullT = 0.18;
    if (pos <= -1) { pos = -1; return lose(); }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.5;
  }
  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a3a58'); bg.addColorStop(0.5, '#3d5474'); bg.addColorStop(1, '#5a6f4a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // pol (perspektiv)
    ctx.fillStyle = '#556e42'; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; for (let i = 1; i <= 6; i++) { const y = groundY + (H - groundY) * i / 7; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // g'alaba/mag'lubiyat chiziqlari
    const winX = W * 0.5 + 0.72 * W * 0.3, loseX = W * 0.5 - 0.72 * W * 0.3;
    ctx.strokeStyle = 'rgba(141,255,180,.5)'; ctx.setLineDash([7, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(winX, groundY - 70); ctx.lineTo(winX, groundY + 40); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,100,100,.5)'; ctx.beginPath(); ctx.moveTo(loseX, groundY - 70); ctx.lineTo(loseX, groundY + 40); ctx.stroke(); ctx.setLineDash([]);
    const sh = shakeT > 0 ? (Math.random() * 2 - 1) * 3 : 0;
    ctx.save(); ctx.translate(sh, 0);
    // arqon (ip)
    const flagX = W * 0.5 + pos * W * 0.3, ry = groundY - 26;
    ctx.strokeStyle = '#c9a05a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(loseX - 40, ry); ctx.lineTo(winX + 40, ry); ctx.stroke();
    // markaziy belgi (tasma)
    ctx.fillStyle = '#ff4d5a'; ctx.fillRect(flagX - 3, ry - 16, 6, 32);
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(flagX, ry - 16); ctx.lineTo(flagX + 20, ry - 10); ctx.lineTo(flagX, ry - 4); ctx.closePath(); ctx.fill();
    // jamoalar
    drawTeam(flagX + 46, ry, 1, '#22d3ee', pullT > 0);   // SIZ (o'ng)
    drawTeam(flagX - 46, ry, -1, '#ff6a5a', aiPullT > 0); // AI (chap)
    ctx.restore();
    if (window.FX) FX.render(ctx);
    // sweep bar (ritm)
    drawSweep();
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.9); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawTeam(x, ry, dir, col, pulling) {
    const R = Math.min(1.4, W / 560); const lean = pulling ? 0.35 : 0.15;
    for (let i = 0; i < 3; i++) {
      const px = x + dir * i * 30 * R; const py = ry + 2;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(px, py + 20 * R, 14 * R, 5 * R, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(px, py); ctx.rotate(-dir * lean);
      const g = ctx.createLinearGradient(0, -34 * R, 0, 0); g.addColorStop(0, col); g.addColorStop(1, shade(col, 0.6));
      ctx.fillStyle = g; rr(-8 * R, -30 * R, 16 * R, 30 * R, 6 * R); ctx.fill();
      ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(0, -34 * R, 7 * R, 0, 7); ctx.fill();
      // qo'llar ipda
      ctx.strokeStyle = shade(col, 0.75); ctx.lineWidth = 4 * R; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -20 * R); ctx.lineTo(-dir * 14 * R, -24 * R); ctx.stroke();
      ctx.restore();
    }
  }
  function drawSweep() {
    const bw = Math.min(360, W * 0.8), bx = (W - bw) / 2, by = H * 0.82, bh = 22;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(bx, by, bw, bh, 10); ctx.fill();
    // sweet zone
    ctx.fillStyle = 'rgba(141,255,180,.3)'; rr(bx + bw * zoneLo, by, bw * (zoneHi - zoneLo), bh, 6); ctx.fill();
    // indikator
    const ix = bx + bw * sweep; ctx.fillStyle = inZone() ? '#8dffb0' : '#ffd24a';
    ctx.beginPath(); ctx.moveTo(ix, by - 6); ctx.lineTo(ix + 7, by - 16); ctx.lineTo(ix - 7, by - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = inZone() ? '#8dffb0' : '#fff'; ctx.fillRect(ix - 2, by, 4, bh);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 ' + Math.round(Math.min(17, W / 28)) + 'px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Yashil zonada TORT — ketma-ket ursang kombo o\'sadi', W / 2, by - 26);
  }
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')'; }
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('arqon'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doPull = e => { if (e) e.preventDefault(); pull(); };
  cv.addEventListener('mousedown', doPull); cv.addEventListener('touchstart', doPull, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doPull); actBtn.addEventListener('touchstart', doPull, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doPull(e); else if (e.code === 'KeyR') reset(); });

  window.AR_TEST = {
    info: () => ({ level: levelIdx + 1, pos: +pos.toFixed(3), sweep: +sweep.toFixed(3), zoneLo: +zoneLo.toFixed(3), zoneHi: +zoneHi.toFixed(3), inZone: inZone(), combo }),
    state: () => state, pull: () => pull()
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
