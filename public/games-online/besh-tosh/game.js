// Besh tosh — xalq epchillik o'yini. Toshni tepaga ot, tushguncha yerdagi toshlarni ilib ol, so'ng ilib tut.
// Pseudo-3D: perspektiv pol, soya + masshtab bilan chuqurlik.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { ground: 4, target: 1, air: 1.40, name: 'Birdan' },
    { ground: 4, target: 2, air: 1.30, name: 'Ikkidan' },
    { ground: 4, target: 3, air: 1.22, name: 'Uchdan' },
    { ground: 4, target: 4, air: 1.18, name: "To'rtdan" },
    { ground: 5, target: 3, air: 1.08, name: 'Usta' },
  ];
  const WIN_LO = 0.80, WIN_HI = 0.985; // ilib tutish oynasi (u bo'yicha)

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm0 = 0;
  let phase = 'ready'; // ready | air
  let stones = [], collected = 0, tosser = null;
  let airT = 0, airMax = 0, needThis = 0, grabbedThis = 0, spin = 0, catchGlow = 0;
  let handX = 0, handY = 0, floorY = 0, msg = '';

  function levelStones(n) {
    const arr = []; const cx = 0.5, cy = 0.52;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.6;
      const rad = 0.16 + (i % 2) * 0.06;
      arr.push({ x: cx + Math.cos(a) * rad * (H / W * 1.7), y: cy + Math.sin(a) * rad * 0.7, grabbed: false, fly: 0, tone: i,
        hue: 26 + (i * 13) % 30, rot: Math.random() * 6.28 });
    }
    return arr;
  }
  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    stones = levelStones(L.ground); collected = 0; phase = 'ready'; airT = 0; grabbedThis = 0; needThis = 0;
    tosser = { rest: true, hue: 20, rot: 0 }; msg = ''; state = 'play'; flashT = 0;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    const L = LEVELS[levelIdx];
    document.getElementById('statePill').textContent = '🪨 ' + collected + '/' + L.ground;
    document.getElementById('needPill').textContent = phase === 'air' ? ('il: ' + grabbedThis + '/' + needThis) : ('nishon: ' + Math.min(L.target, L.ground - collected));
  }

  function remaining() { return stones.filter(s => !s.grabbed).length; }

  function action() {
    if (state !== 'play') return;
    const L = LEVELS[levelIdx];
    if (phase === 'ready') {
      needThis = Math.min(L.target, remaining());
      if (needThis <= 0) return;
      phase = 'air'; airT = 0; airMax = L.air; grabbedThis = 0; spin = 0; tosser.rest = false; msg = '';
      if (window.SFX) SFX.tone(300, 0.1, { type: 'sine', vol: 0.12, to: 520 });
      updateHud(); return;
    }
    // phase === 'air'
    const u = airT / airMax;
    if (grabbedThis < needThis) {
      // eng yaqin ilinmagan toshni ol
      let best = null, bd = 1e9;
      for (const s of stones) if (!s.grabbed) { const d = Math.hypot(s.x - 0.5, s.y - 0.7); if (d < bd) { bd = d; best = s; } }
      if (best) { best.grabbed = true; best.fly = 0.001; grabbedThis++;
        if (window.SFX) SFX.tone(600 + grabbedThis * 90, 0.06, { type: 'triangle', vol: 0.12 });
        const p = floorPt(best.x, best.y); if (window.FX) FX.burst(p.x, p.y, '#e8c98a', 8);
        updateHud(); }
      return;
    }
    // need bajarilgan — ilib tutishga urin
    if (u >= WIN_LO && u <= WIN_HI) { catchSuccess(); }
    else if (u < WIN_LO) { /* hali erta — kuting */ msg = 'Sabr — tushayotganda tut!'; if (window.SFX) SFX.tone(200, 0.05, { type: 'square', vol: 0.06 }); }
  }
  function catchSuccess() {
    collected += grabbedThis; phase = 'ready'; tosser.rest = true; catchGlow = 0.4;
    if (window.SFX) SFX.coin();
    if (window.FX) FX.burst(handX, handY, '#8dffb0', 16);
    grabbedThis = 0; updateHud();
    if (collected >= LEVELS[levelIdx].ground) return win();
  }
  function fail(why) {
    phase = 'ready'; tosser.rest = true; flashT = 0.4; msg = why || 'Tushib ketdi!';
    if (window.SFX) SFX.hit(); if (window.FX) FX.shake(6);
    // shu bosqichni qayta boshla (toshlar joyiga qaytadi)
    setTimeout(() => { if (state === 'play') load(levelIdx); }, 700);
    state = 'fail';
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    if (window.FX) FX.burst(handX, handY - 30, '#8dffb0', 26);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Besh tosh ustasi!', "Birdan to'rttagacha — barcha bosqichda toshlarni epchillik bilan ilib olding!", '↻ Qaytadan'), 1100);
  }

  function update(dt) {
    tm0 += dt; if (flashT > 0) flashT -= dt; if (catchGlow > 0) catchGlow -= dt;
    for (const s of stones) if (s.grabbed && s.fly < 1) s.fly = Math.min(1, s.fly + dt * 4);
    if (state !== 'play') return;
    if (phase === 'air') {
      airT += dt; spin += dt * 8;
      if (airT >= airMax) {
        // yerga tushdi
        if (grabbedThis >= needThis) fail('Tutishni o‘tkazib yubording!');
        else fail('Yetarli tosh ilmading!');
      }
    }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    handX = W * 0.5; handY = H * 0.72; floorY = H * 0.5;
  }
  // perspektiv pol: normal (x,y)∈[0..1] -> ekran. y=0 orqa, y=1 old (yaqin)
  function floorPt(x, y) {
    const persp = 0.45 + y * 0.55; // yaqin bo'lsa kengroq
    const sx = W * 0.5 + (x - 0.5) * W * persp;
    const sy = H * 0.34 + y * H * 0.34;
    return { x: sx, y: sy, sc: 0.7 + y * 0.6 };
  }
  function render() {
    // fon: iliq xona/hovli
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#20304a'); g.addColorStop(0.55, '#2c3d55'); g.addColorStop(1, '#4a5a3e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // pol (perspektiv trapetsiya + gilam)
    const p0 = floorPt(0, 0), p1 = floorPt(1, 0), p2 = floorPt(1, 1), p3 = floorPt(0, 1);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
    const fg = ctx.createLinearGradient(0, p0.y, 0, p2.y); fg.addColorStop(0, '#6b7a4e'); fg.addColorStop(1, '#8a9a63');
    ctx.fillStyle = fg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) { const a = floorPt(0, i / 6), b = floorPt(1, i / 6); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    if (state === 'menu') return;
    // yerdagi toshlar (uzoqdan yaqinga)
    const ground = stones.filter(s => !s.grabbed).sort((a, b) => a.y - b.y);
    for (const s of ground) drawStone(s);
    // uchayotgan (ilingan) toshlar hand tomon
    for (const s of stones) if (s.grabbed && s.fly < 1) drawFlyStone(s);
    // qo'l (savat)
    drawHand();
    // tashlangan tosh
    drawTosser();
    if (window.FX) FX.render(ctx);
    // xabar
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '600 ' + Math.round(Math.min(22, W / 22)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.86); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function pebble(x, y, r, hue, rot, hi) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.2, 0, 0, r);
    g.addColorStop(0, `hsl(${hue},28%,${hi ? 74 : 64}%)`); g.addColorStop(1, `hsl(${hue},30%,${hi ? 46 : 38}%)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.82, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = `hsla(${hue},30%,25%,.5)`; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.34, r * 0.32, r * 0.2, -0.5, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawStone(s) {
    const p = floorPt(s.x, s.y); const r = 15 * p.sc * Math.min(1.3, W / 520);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + r * 0.5, r * 1.05, r * 0.42, 0, 0, 7); ctx.fill();
    pebble(p.x, p.y, r, s.hue, s.rot, false);
  }
  function drawFlyStone(s) {
    const from = floorPt(s.x, s.y); const to = { x: handX + (s.tone - 2) * 8, y: handY + 6 };
    const u = s.fly; const x = from.x + (to.x - from.x) * u, y = from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * 40;
    const r = 13 * Math.min(1.3, W / 520) * (1 - u * 0.25);
    pebble(x, y, r, s.hue, s.rot + u * 6, false);
  }
  function drawHand() {
    // savat/kaft
    const w = 60 * Math.min(1.4, W / 520), h = 20 * Math.min(1.4, W / 520);
    ctx.save();
    if (catchGlow > 0) { ctx.shadowColor = '#8dffb0'; ctx.shadowBlur = 20 * (catchGlow / 0.4); }
    // ilib tutish oynasi ochiq bo'lsa yorug'
    let ready = false; if (phase === 'air') { const u = airT / airMax; if (grabbedThis >= needThis && u >= WIN_LO && u <= WIN_HI) ready = true; }
    if (ready) { ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 26; }
    ctx.fillStyle = ready ? '#e7b768' : '#c69a5a';
    ctx.beginPath(); ctx.ellipse(handX, handY + 10, w, h, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#a87d43'; ctx.beginPath(); ctx.ellipse(handX, handY + 10, w, h * 0.6, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.restore();
    // yig'ilgan toshlar hisoblagichi (kaftda)
    for (let i = 0; i < Math.min(collected, 6); i++) pebble(handX - w * 0.6 + i * (w * 1.2 / 6), handY + 6, 6 * Math.min(1.3, W / 520), 26, i, false);
  }
  function drawTosser() {
    const R = Math.min(1.4, W / 520);
    if (phase === 'ready' || tosser.rest) {
      // kaftda tayyor
      pebble(handX, handY - 6, 15 * R, tosser.hue, 0, true);
      if (state === 'play' && phase === 'ready') { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '600 ' + Math.round(Math.min(18, W / 26)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText('OT ⬆', handX, handY + 46); }
      return;
    }
    // havoda
    const u = airT / airMax; const h = Math.sin(u * Math.PI) * H * 0.34;
    const x = handX, y = handY - 6 - h; const sc = 1 + Math.sin(u * Math.PI) * 0.55;
    // pol soyasi
    const shA = 0.32 * (1 - Math.sin(u * Math.PI) * 0.7), shS = 1 - Math.sin(u * Math.PI) * 0.5;
    ctx.fillStyle = `rgba(0,0,0,${shA})`; ctx.beginPath(); ctx.ellipse(handX, handY + 12, 18 * R * shS, 7 * R * shS, 0, 0, 7); ctx.fill();
    // tosh (aylanuvchi)
    const inWin = u >= WIN_LO && u <= WIN_HI && grabbedThis >= needThis;
    if (inWin) { ctx.save(); ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 22; }
    pebble(x, y, 15 * R * sc, tosser.hue, spin, true);
    if (inWin) ctx.restore();
    // TUT ko'rsatkichi
    if (grabbedThis >= needThis && u >= WIN_LO - 0.06) {
      ctx.fillStyle = inWin ? '#ffe08a' : 'rgba(255,255,255,.7)'; ctx.font = '700 ' + Math.round(Math.min(20, W / 24)) + 'px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(inWin ? 'TUT! ✋' : 'tayyorlan…', handX, handY + 50);
    }
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('besh-tosh'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  // canvas / tugma bosish = amal
  const doAct = e => { if (e) e.preventDefault(); action(); };
  cv.addEventListener('mousedown', doAct); cv.addEventListener('touchstart', doAct, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doAct); actBtn.addEventListener('touchstart', doAct, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') { doAct(e); } else if (e.code === 'KeyR') reset(); });

  window.BT_TEST = {
    info: () => ({ level: levelIdx + 1, phase, collected, need: needThis, grabbed: grabbedThis, remaining: remaining(), u: airMax ? airT / airMax : 0, ground: LEVELS[levelIdx].ground }),
    state: () => state, act: () => action(), WIN_LO, WIN_HI
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
