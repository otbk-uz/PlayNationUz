// Kurash — o'zbek milliy sporti. Belbog'dan ushlab, ritmda tortib ustunlik ol va HALOL tashla.
// Pseudo-3D: perspektiv gilam, ikki polvon, tashlash animatsiyasi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { target: 2, lives: 2, ai: 0.16, sweep: 1.4, zone: 0.24, name: 'Qishloq' },
    { target: 2, lives: 2, ai: 0.20, sweep: 1.6, zone: 0.21, name: 'Tuman' },
    { target: 3, lives: 2, ai: 0.24, sweep: 1.8, zone: 0.18, name: 'Viloyat' },
    { target: 3, lives: 2, ai: 0.29, sweep: 2.0, zone: 0.16, name: 'Respublika' },
    { target: 3, lives: 2, ai: 0.34, sweep: 2.3, zone: 0.14, name: 'Jahon' },
  ];
  const THROW_TH = 0.85, PUSH = 0.13;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let lev = 0, sweep = 0, sweepDir = 1, combo = 0, wins = 0, target = 0, lives = 0;
  let zoneLo = 0.6, zoneHi = 0.82, msg = '', anim = 0, animKind = '', shakeT = 0;

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; target = L.target; lives = L.lives; wins = 0;
    lev = 0; sweep = 0; sweepDir = 1; combo = 0; msg = ''; anim = 0; animKind = ''; shakeT = 0;
    const zc = 0.72; zoneLo = zc - L.zone / 2; zoneHi = zc + L.zone / 2;
    state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('winPill').textContent = '🏅 ' + wins + '/' + target;
    document.getElementById('statePill').textContent = '❤ ' + lives + ' · kombo ' + combo;
  }
  const inZone = () => sweep >= zoneLo && sweep <= zoneHi;

  function push() {
    if (state !== 'play' || anim > 0) return;
    if (inZone()) { combo = Math.min(6, combo + 1); lev += PUSH + combo * 0.015; shakeT = 0.1;
      if (window.SFX) SFX.tone(220 + combo * 40, 0.06, { type: 'sawtooth', vol: 0.12, to: 360 });
      if (lev >= THROW_TH) return halol();
    } else { combo = 0; lev -= 0.05; if (window.SFX) SFX.tone(150, 0.05, { type: 'square', vol: 0.06 }); }
    if (lev <= -1) return thrown();
    updateHud();
  }
  function halol() {
    lev = 1; anim = 0.9; animKind = 'win'; wins++; flashT = 0.4; combo = 0;
    if (window.SFX) SFX.win(); if (window.FX) FX.burst(W * 0.5, H * 0.44, '#8dffb0', 22);
    msg = 'HALOL! 🏅'; updateHud();
    setTimeout(() => { if (state !== 'play') return; if (wins >= target) return win(); lev = 0; anim = 0; msg = ''; updateHud(); }, 1000);
  }
  function thrown() {
    lev = -1; anim = 0.9; animKind = 'lose'; lives--; flashT = 0.4; combo = 0; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(9);
    msg = 'Tashlab yuborishdi!'; updateHud();
    setTimeout(() => { if (state !== 'play') return; if (lives <= 0) return lose(); lev = 0; anim = 0; msg = ''; updateHud(); }, 1100);
  }
  function win() { state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Jahon chempioni!', "Barcha bosqichda raqiblarni halol tashlading — kurash pahlavoni!", '↻ Qaytadan'), 1100); }
  function lose() { state = 'lost'; flashT = 0.5; msg = 'Yutqazding! Qaytadan.'; if (window.SFX) SFX.death(); if (window.FX) FX.shake(9);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1200); }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (shakeT > 0) shakeT -= dt; if (anim > 0) anim -= dt;
    if (state !== 'play' || anim > 0) return;
    const L = LEVELS[levelIdx];
    sweep += sweepDir * L.sweep * dt; if (sweep > 1) { sweep = 1; sweepDir = -1; } if (sweep < 0) { sweep = 0; sweepDir = 1; }
    lev -= L.ai * dt; if (lev <= -1) return thrown();
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a2438'); bg.addColorStop(0.55, '#5a3a30'); bg.addColorStop(1, '#7a5030');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // gilam (perspektiv doira)
    const gy = H * 0.55; ctx.save();
    const gg = ctx.createRadialGradient(W / 2, gy - 20, 30, W / 2, gy, W * 0.5); gg.addColorStop(0, '#3f7d52'); gg.addColorStop(1, '#2c5a3c');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(W / 2, gy, W * 0.44, H * 0.2, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,.4)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(W / 2, gy, W * 0.38, H * 0.17, 0, 0, 7); ctx.stroke(); ctx.restore();
    const sh = shakeT > 0 ? (Math.random() * 2 - 1) * 4 : 0;
    ctx.save(); ctx.translate(sh, 0);
    drawWrestlers(gy);
    ctx.restore();
    if (window.FX) FX.render(ctx);
    // sweep metri
    if (anim <= 0 && state === 'play') drawSweep();
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '800 ' + Math.round(Math.min(30, W / 16)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.24); }
    if (flashT > 0) { const col = (state === 'won' || animKind === 'win') ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawWrestlers(gy) {
    const R = Math.min(1.5, W / 560); const cx = W / 2;
    // lev bo'yicha egilish: +lev siz g'olib (raqib orqaga)
    const push = lev * 40 * R; const throwing = anim > 0;
    let youX = cx - 46 * R, oppX = cx + 46 * R, youY = gy - 30 * R, oppY = gy - 30 * R, youRot = 0, oppRot = 0;
    if (throwing && animKind === 'win') { const u = 1 - anim / 0.9; oppX = cx + 46 * R + u * 40 * R; oppY = gy - 30 * R + u * 30 * R; oppRot = u * 1.6; }
    else if (throwing && animKind === 'lose') { const u = 1 - anim / 0.9; youX = cx - 46 * R - u * 40 * R; youY = gy - 30 * R + u * 30 * R; youRot = -u * 1.6; }
    else { youX -= push; oppX -= push * 0.6; }
    // soya
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(youX, gy + 8 * R, 24 * R, 7 * R, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(oppX, gy + 8 * R, 24 * R, 7 * R, 0, 0, 7); ctx.fill();
    // belbog' (ular orasidagi ushlash)
    if (!throwing) { ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 6 * R; ctx.beginPath(); ctx.moveTo(youX + 14 * R, youY + 6 * R); ctx.lineTo(oppX - 14 * R, oppY + 6 * R); ctx.stroke(); }
    drawPolvon(youX, youY, youRot, R, '#22d3ee');   // SIZ (moviy)
    drawPolvon(oppX, oppY, oppRot, R, '#ff5a5a');    // raqib (qizil)
  }
  function drawPolvon(x, y, rot, R, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createLinearGradient(0, -44 * R, 0, 30 * R); g.addColorStop(0, col); g.addColorStop(1, shade(col, 0.6));
    ctx.fillStyle = g; rr(-14 * R, -30 * R, 28 * R, 54 * R, 10 * R); ctx.fill();
    // belbog'
    ctx.fillStyle = '#e8c060'; ctx.fillRect(-14 * R, 2 * R, 28 * R, 8 * R);
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(0, -38 * R, 10 * R, 0, 7); ctx.fill();
    // qo'llar (oldinga cho'zilgan)
    ctx.strokeStyle = shade(col, 0.8); ctx.lineWidth = 6 * R; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -16 * R); ctx.lineTo(18 * R, -6 * R); ctx.stroke();
    ctx.restore();
  }
  function drawSweep() {
    const bw = Math.min(360, W * 0.82), bx = (W - bw) / 2, by = H * 0.82, bh = 20;
    // ustunlik ko'rsatkichi (lev)
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(bx, by - 34, bw, 12, 6); ctx.fill();
    const lx = bx + bw * ((lev + 1) / 2); ctx.fillStyle = lev >= 0 ? '#8dffb0' : '#ff6a5a';
    if (lev >= 0) { rr(bx + bw / 2, by - 34, bw / 2 * lev, 12, 6); ctx.fill(); } else { rr(bx + bw / 2 + bw / 2 * lev, by - 34, -bw / 2 * lev, 12, 6); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx + bw / 2, by - 38); ctx.lineTo(bx + bw / 2, by - 20); ctx.stroke();
    // HALOL chizig'i
    const tx = bx + bw * ((THROW_TH + 1) / 2); ctx.strokeStyle = 'rgba(141,255,180,.8)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(tx, by - 40); ctx.lineTo(tx, by - 18); ctx.stroke(); ctx.setLineDash([]);
    // sweep zona
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(bx, by, bw, bh, 9); ctx.fill();
    ctx.fillStyle = 'rgba(141,255,180,.3)'; rr(bx + bw * zoneLo, by, bw * (zoneHi - zoneLo), bh, 6); ctx.fill();
    const ix = bx + bw * sweep; ctx.fillStyle = inZone() ? '#8dffb0' : '#ffd24a'; ctx.fillRect(ix - 2, by - 4, 4, bh + 8);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 ' + Math.round(Math.min(16, W / 30)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Yashil zonada TORT — HALOL chizig\'iga yet', W / 2, by - 46);
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('kurash'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doAct = e => { if (e) e.preventDefault(); push(); };
  cv.addEventListener('mousedown', doAct); cv.addEventListener('touchstart', doAct, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doAct); actBtn.addEventListener('touchstart', doAct, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doAct(e); else if (e.code === 'KeyR') reset(); });

  window.KR_TEST = {
    info: () => ({ level: levelIdx + 1, wins, target, lives, lev: +lev.toFixed(3), sweep: +sweep.toFixed(3), inZone: inZone(), anim: +anim.toFixed(2) }),
    state: () => state, push: () => push()
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
