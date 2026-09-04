// Sakrash arqoni (skakalka) — xalq epchillik o'yini. Arqon pastga kelganda sakra, tripka tushma.
// Pseudo-3D: perspektiv pol, soya+masshtab bilan balandlik, aylanuvchi arqon.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { target: 8, speed: 0.75, name: 'Boshlang\'ich' },
    { target: 12, speed: 0.92, name: 'Yengil' },
    { target: 16, speed: 1.10, name: 'O\'rta' },
    { target: 20, speed: 1.32, name: 'Tez' },
    { target: 25, speed: 1.58, name: 'Usta' },
  ];
  const GRAV = 12.5, JUMP_V = 4.6; // sakrash fizikasi (birlik: "balandlik")

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let p = 0, prevP = 0, jumps = 0, target = 0, height = 0, vy = 0, grounded = true;
  let groundY = 0, msg = '', tripT = 0;

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; target = L.target; jumps = 0;
    p = 0.0; prevP = 0; height = 0; vy = 0; grounded = true; msg = ''; tripT = 0;
    state = 'play'; flashT = 0; fit();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('targetPill').textContent = '🎯 ' + target;
    document.getElementById('statePill').textContent = '🤸 ' + jumps + '/' + target;
  }

  function jump() {
    if (state !== 'play') return;
    if (grounded) { grounded = false; vy = JUMP_V; if (window.SFX) SFX.tone(420, 0.08, { type: 'square', vol: 0.1, to: 650 }); }
  }
  function trip() {
    state = 'lost'; flashT = 0.45; tripT = 0.5; msg = 'Tripka tushding! (' + jumps + ') Qaytadan.';
    if (window.SFX) SFX.hit(); if (window.FX) FX.shake(7);
    setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1100);
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (window.FX) FX.burst(W / 2, groundY - 40, '#8dffb0', 24);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Arqon ustasi!', "Barcha bosqichda tripka tushmay sakrading — chinakam chaqqon!", '↻ Qaytadan'), 1100);
  }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (tripT > 0) tripT -= dt;
    if (state !== 'play') return;
    // sakrash fizikasi
    if (!grounded) { height += vy * dt; vy -= GRAV * dt; if (height <= 0) { height = 0; vy = 0; grounded = true; } }
    // arqon aylanishi
    prevP = p; p += LEVELS[levelIdx].speed * dt; if (p >= 1) p -= 1;
    // arqon pastga (oyoq) yetgan lahza: p 0.5 dan o'tganda
    if (prevP < 0.5 && p >= 0.5) {
      if (height > 0.2) { jumps++; if (window.SFX) SFX.tone(700, 0.05, { type: 'triangle', vol: 0.08 }); if (window.FX) FX.burst(W / 2, groundY - 6, '#ffd88a', 6); updateHud();
        if (jumps >= target) return win(); }
      else return trip();
    }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = H * 0.72;
  }
  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#243a52'); bg.addColorStop(0.7, '#39536e'); bg.addColorStop(1, '#4a6a52');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') return;
    // pol (perspektiv)
    ctx.fillStyle = '#4f6b45'; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; for (let i = 1; i <= 5; i++) { const y = groundY + (H - groundY) * i / 6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const R = Math.min(1.5, W / 520);
    const cx = W / 2;
    // arqon geometriyasi: control point p bo'yicha yuqoridan pastga
    // cos(2πp): p=0 -> yuqori (bosh ustida), p=0.5 -> past (oyoq/pol)
    const arcW = 150 * R; const lx = cx - arcW, rx = cx + arcW;
    const handY = groundY - 70 * R;
    const swing = Math.cos(p * Math.PI * 2); // +1 yuqori, -1 past
    const ctrlY = groundY + 6 - (swing * 0.5 + 0.5) * (groundY + 6 - (handY - 150 * R));
    const behind = p > 0.5; // orqada (o'yinchi oldida chizilmaydi)
    // ushlovchilar (do'stlar)
    drawHolder(lx, handY, 1, R); drawHolder(rx, handY, -1, R);
    // arqon (orqa yarim — o'yinchi ortida bo'lsa avval chiz)
    function drawRope() {
      ctx.strokeStyle = behind ? 'rgba(230,180,90,.55)' : '#e8b84a'; ctx.lineWidth = 3.5 * R; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lx, handY); ctx.quadraticCurveTo(cx, ctrlY, rx, handY); ctx.stroke();
    }
    if (behind) drawRope();
    // o'yinchi
    drawPlayer(cx, R);
    if (!behind) drawRope();
    if (window.FX) FX.render(ctx);
    // katta hisoblagich
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '800 ' + Math.round(Math.min(52, W / 9)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(jumps + '', cx, H * 0.2);
    // xavf indikatori: arqon pastga yaqin
    if (state === 'play') { const danger = ctrlY > groundY - 40; if (danger && grounded) { ctx.fillStyle = 'rgba(255,120,120,.9)'; ctx.font = '700 ' + Math.round(Math.min(20, W / 24)) + 'px system-ui'; ctx.fillText('SAKRA!', cx, groundY + 40); } }
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.fillText(msg, cx, H * 0.9); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawHolder(x, hy, dir, R) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, groundY + 6, 16 * R, 5 * R, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(x, groundY - 60 * R, x, groundY); g.addColorStop(0, '#b98cf0'); g.addColorStop(1, '#7b52c0');
    ctx.fillStyle = g; rr(x - 9 * R, groundY - 52 * R, 18 * R, 52 * R, 7 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, groundY - 58 * R, 8 * R, 0, 7); ctx.fill();
    // qo'l arqonga
    ctx.strokeStyle = '#6b45a8'; ctx.lineWidth = 4 * R; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, groundY - 40 * R); ctx.lineTo(x + dir * 8 * R, hy); ctx.stroke();
  }
  function drawPlayer(x, R) {
    const y = groundY - height * 26 * R; const b = height * 26 * R;
    // soya (balandlikda kichrayadi)
    const shS = 1 - Math.min(0.6, height * 0.5);
    ctx.fillStyle = `rgba(0,0,0,${0.32 * shS})`; ctx.beginPath(); ctx.ellipse(x, groundY + 6, 13 * R * shS, 5 * R * shS, 0, 0, 7); ctx.fill();
    // oyoqlar bukilishi (sakraganda)
    const tuck = Math.min(1, height * 0.8);
    const g = ctx.createLinearGradient(x, y - 44 * R, x, y); g.addColorStop(0, '#5fe0ff'); g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g; rr(x - 9 * R, y - 40 * R, 18 * R, 38 * R - tuck * 8 * R, 7 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, y - 46 * R, 8 * R, 0, 7); ctx.fill();
    // oyoqlar
    ctx.strokeStyle = '#1f6f9a'; ctx.lineWidth = 5 * R; ctx.lineCap = 'round';
    const legLen = (10 - tuck * 6) * R;
    ctx.beginPath(); ctx.moveTo(x - 4 * R, y - 4 * R); ctx.lineTo(x - 4 * R, y - 4 * R + legLen);
    ctx.moveTo(x + 4 * R, y - 4 * R); ctx.lineTo(x + 4 * R, y - 4 * R + legLen); ctx.stroke();
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('sakrash'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doJump = e => { if (e) e.preventDefault(); jump(); };
  cv.addEventListener('mousedown', doJump); cv.addEventListener('touchstart', doJump, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doJump); actBtn.addEventListener('touchstart', doJump, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') doJump(e); else if (e.code === 'KeyR') reset(); });

  window.SK_TEST = {
    info: () => ({ level: levelIdx + 1, jumps, target, p: +p.toFixed(3), height: +height.toFixed(2), grounded }),
    state: () => state, jump: () => jump()
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
