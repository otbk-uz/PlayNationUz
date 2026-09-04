// Chillak (chillik) — xalq o'yini. Kaltak bilan chillakni urib, imkon qadar uzoqqa uchir.
// Pseudo-3D: perspektiv maydon, masofa bayroqlari, uchayotgan chillak masshtab+soya bilan uzoqlashadi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // nishon masofa (qadam) — har bosqichda oshadi
  const LEVELS = [
    { target: 30, name: 'Boshlang\'ich' },
    { target: 45, name: 'O\'rta' },
    { target: 60, name: 'Kuchli' },
    { target: 78, name: 'Zarbdor' },
    { target: 95, name: 'Usta' },
  ];
  const G = 9.8, PWR_SPD = 2.1, ANG_SPD = 1.7;

  let W = 0, H = 0, levelIdx = 0, state = 'menu', flashT = 0, tm = 0;
  let phase = 'power'; // power | angle | fly | done
  let power = 0.6, angle = 45, lastDist = 0, target = 30, maxD = 60;
  let fly = null; // {d, land, apex, prog, vx?, spin}
  let best = 0, msg = '';

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; target = L.target; maxD = Math.round(target * 1.35);
    phase = 'power'; power = 0.6; angle = 45; fly = null; lastDist = 0; msg = ''; state = 'play'; flashT = 0;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('targetPill').textContent = '🎯 ' + target + ' qadam';
    document.getElementById('statePill').textContent = phase === 'fly' ? '🏏 uchmoqda…' : lastDist ? ('oxirgi: ' + lastDist) : (phase === 'power' ? 'Kuch tanla' : 'Burchak tanla');
  }

  function launch(p01, angDeg) {
    power = p01; angle = angDeg; const v = 6 + power * 10; const a = angDeg * Math.PI / 180;
    const range = v * v * Math.sin(2 * a) / G * 4.2;
    const land = Math.max(2, Math.round(range));
    fly = { d: 0, land, apex: Math.max(8, v * Math.sin(a) * 2.4), prog: 0, spin: 0, t: 0, dur: 0.5 + v * Math.sin(a) * 0.11 };
    phase = 'fly'; if (window.SFX) SFX.tone(180, 0.09, { type: 'square', vol: 0.14, to: 320 });
    updateHud();
  }
  function action() {
    if (state !== 'play') return;
    if (phase === 'power') { phase = 'angle'; if (window.SFX) SFX.tone(500, 0.05, { type: 'triangle', vol: 0.1 }); updateHud(); }
    else if (phase === 'angle') { launch(power, angle); }
  }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    if (phase === 'power') power = 0.35 + (Math.sin(tm * PWR_SPD) * 0.5 + 0.5) * 0.65;
    else if (phase === 'angle') angle = 20 + (Math.sin(tm * ANG_SPD) * 0.5 + 0.5) * 50;
    else if (phase === 'fly') {
      fly.t += dt; fly.spin += dt * 14; fly.prog = Math.min(1, fly.t / fly.dur);
      fly.d = fly.land * fly.prog;
      if (fly.prog >= 1) {
        lastDist = fly.land; best = Math.max(best, lastDist); phase = 'done';
        const p = fieldPt(fly.d); if (window.FX) FX.burst(p.x, p.y, '#e8c98a', 14);
        if (lastDist >= target) { if (window.SFX) SFX.win(); msg = '🎉 ' + lastDist + ' qadam — o\'tding!'; flashT = 0.4; setTimeout(() => nextLevel(), 1200); }
        else { if (window.SFX) SFX.hit(); msg = lastDist + ' qadam — yetmadi (' + target + '). Qaytadan!'; flashT = 0.35; setTimeout(() => { if (state === 'play') load(levelIdx); }, 1300); }
        updateHud();
      }
    }
  }
  function nextLevel() {
    if (levelIdx + 1 < LEVELS.length) load(levelIdx + 1);
    else { state = 'won'; showPanel('🎉 Chillak ustasi!', "Barcha bosqichda nishon masofaga chillakni uchirding — haqiqiy chillakboz!", '↻ Qaytadan'); }
  }

  // ── perspektiv maydon ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const launchY = () => H * 0.80, horizonY = () => H * 0.30;
  // masofa d (qadam) -> ekran nuqtasi (maydon markazi bo'ylab uzoqqa)
  function fieldPt(d) {
    const t = Math.min(1, d / maxD);
    const y = launchY() + (horizonY() - launchY()) * t;
    const x = W * 0.5;
    return { x, y, sc: 1 - t * 0.72 };
  }
  function render() {
    // osmon
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY() + 20); sky.addColorStop(0, '#213a5c'); sky.addColorStop(1, '#5b7ea6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizonY() + 20);
    // maydon (perspektiv trapetsiya)
    const nl = fieldPt(0), fh = { x: W * 0.5, y: horizonY() };
    const nearHalf = W * 0.62, farHalf = W * 0.06;
    ctx.beginPath();
    ctx.moveTo(W * 0.5 - nearHalf, launchY() + 30); ctx.lineTo(W * 0.5 - farHalf, horizonY());
    ctx.lineTo(W * 0.5 + farHalf, horizonY()); ctx.lineTo(W * 0.5 + nearHalf, launchY() + 30); ctx.closePath();
    const fg = ctx.createLinearGradient(0, horizonY(), 0, launchY() + 30); fg.addColorStop(0, '#6d8a4a'); fg.addColorStop(1, '#8fb15f');
    ctx.fillStyle = fg; ctx.fill();
    if (state === 'menu') return;
    // masofa bayroqlari (10 qadamda bir) + nishon chizig'i
    for (let d = 10; d <= maxD; d += 10) {
      const p = fieldPt(d); const isT = false;
      ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1;
      const hw = (nearHalf - (nearHalf - farHalf) * (d / maxD));
      ctx.beginPath(); ctx.moveTo(p.x - hw, p.y); ctx.lineTo(p.x + hw, p.y); ctx.stroke();
      ctx.fillStyle = 'rgba(230,240,255,.5)'; ctx.font = Math.round(11 * p.sc + 6) + 'px system-ui'; ctx.textAlign = 'left';
      ctx.fillText(d + '', p.x + hw + 4, p.y + 4);
    }
    // nishon chizig'i (qizil)
    const tp = fieldPt(target); const thw = (nearHalf - (nearHalf - farHalf) * (target / maxD));
    ctx.strokeStyle = 'rgba(255,90,90,.9)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.moveTo(tp.x - thw, tp.y); ctx.lineTo(tp.x + thw, tp.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ff9a9a'; ctx.font = 'bold ' + Math.round(12 * tp.sc + 7) + 'px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('🎯 ' + target, tp.x, tp.y - 8);
    // chillakboz (kaltak bilan)
    drawThrower();
    // uchayotgan chillak
    if (phase === 'fly' || phase === 'done') drawChillak();
    if (window.FX) FX.render(ctx);
    // metrlar (power/angle)
    if (phase === 'power' || phase === 'angle') drawMeters();
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '700 ' + Math.round(Math.min(24, W / 20)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.90); }
    if (flashT > 0) { const col = lastDist >= target ? '141,255,180' : '255,90,90'; ctx.fillStyle = `rgba(${col},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawThrower() {
    const R = Math.min(1.4, W / 560); const x = W * 0.5, y = launchY();
    // soya
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 16 * R, 26 * R, 8 * R, 0, 0, 7); ctx.fill();
    // tana
    const g = ctx.createLinearGradient(x, y - 40 * R, x, y); g.addColorStop(0, '#5fe0ff'); g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g; rr(x - 9 * R, y - 34 * R, 18 * R, 34 * R, 7 * R); ctx.fill();
    ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(x, y - 40 * R, 8 * R, 0, 7); ctx.fill();
    // kaltak (dast) — zamahga qarab buriladi
    let swing = 0; if (phase === 'angle') swing = -0.5 - angle / 90; else if (phase === 'power') swing = -0.4; else if (phase === 'fly') swing = 0.5;
    ctx.save(); ctx.translate(x + 8 * R, y - 24 * R); ctx.rotate(swing);
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 5 * R; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(30 * R, -4 * R); ctx.stroke();
    ctx.restore();
  }
  function drawChillak() {
    const p = fieldPt(fly.d); const R = Math.min(1.4, W / 560) * p.sc;
    const h = Math.sin(fly.prog * Math.PI) * fly.apex * (H * 0.008);
    const y = p.y - h;
    // soya
    ctx.fillStyle = `rgba(0,0,0,${0.3 * (1 - Math.sin(fly.prog * Math.PI) * 0.6)})`;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 10 * R, 4 * R, 0, 0, 7); ctx.fill();
    // chillak (kalta tayoq) — aylanadi
    ctx.save(); ctx.translate(p.x, y); ctx.rotate(fly.spin);
    const g = ctx.createLinearGradient(-12 * R, 0, 12 * R, 0); g.addColorStop(0, '#c98b46'); g.addColorStop(0.5, '#e8b06a'); g.addColorStop(1, '#a9722f');
    ctx.fillStyle = g; rr(-13 * R, -4 * R, 26 * R, 8 * R, 4 * R); ctx.fill();
    ctx.fillStyle = 'rgba(80,50,20,.5)'; ctx.fillRect(-9 * R, -4 * R, 2 * R, 8 * R); ctx.fillRect(6 * R, -4 * R, 2 * R, 8 * R);
    ctx.restore();
  }
  function drawMeters() {
    const bw = Math.min(320, W * 0.7), bx = (W - bw) / 2, by = H * 0.62, bh = 16;
    // power bar
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(bx, by, bw, bh, 8); ctx.fill();
    const pv = phase === 'power' ? power : power;
    // sweet zone (yuqori qism)
    ctx.fillStyle = 'rgba(141,255,180,.25)'; rr(bx + bw * 0.72, by, bw * 0.28, bh, 8); ctx.fill();
    ctx.fillStyle = phase === 'power' ? '#fbbf24' : '#6b7a8a';
    rr(bx, by, bw * ((pv - 0.35) / 0.65), bh, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'left'; ctx.fillText('KUCH', bx, by - 6);
    // angle indicator (arc)
    const ax = W * 0.5, ay = by + 58, ar = 42;
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ax, ay, ar, Math.PI, Math.PI * 1.5); ctx.stroke();
    // sweet ~45
    ctx.strokeStyle = 'rgba(141,255,180,.5)'; ctx.beginPath(); ctx.arc(ax, ay, ar, Math.PI + (40 / 90) * (Math.PI / 2), Math.PI + (50 / 90) * (Math.PI / 2)); ctx.stroke();
    const aa = Math.PI + (angle / 90) * (Math.PI / 2);
    ctx.strokeStyle = phase === 'angle' ? '#22d3ee' : '#6b7a8a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(aa) * ar, ay + Math.sin(aa) * ar); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('BURCHAK ' + Math.round(angle) + '°', ax, ay + 22);
    // ko'rsatma
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 ' + Math.round(Math.min(18, W / 26)) + 'px system-ui';
    ctx.fillText(phase === 'power' ? 'Bos — KUCHni belgila' : 'Bos — BURCHAKni belgila (≈45° eng uzoq)', W / 2, by - 30);
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('chillak'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doAct = e => { if (e) e.preventDefault(); action(); };
  cv.addEventListener('mousedown', doAct); cv.addEventListener('touchstart', doAct, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doAct); actBtn.addEventListener('touchstart', doAct, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doAct(e); else if (e.code === 'KeyR') reset(); });

  window.CH_TEST = {
    info: () => ({ level: levelIdx + 1, phase, target, lastDist, power: +power.toFixed(2), angle: +angle.toFixed(1) }),
    state: () => state, act: () => action(),
    forceThrow: (p01, angDeg) => { if (state === 'play' && (phase === 'power' || phase === 'angle')) launch(p01, angDeg); }
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
