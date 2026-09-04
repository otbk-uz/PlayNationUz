// Rezonans — slayderlar bilan to'lqinni nishon to'lqinga moslash (signal sozlash).
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const TAU = Math.PI * 2;

  // parametr qadamlari
  const STEPS = {
    A1: [0.3, 0.45, 0.6, 0.75, 0.9],
    f1: [1, 2, 3, 4, 5],
    p1: [0, 0.5 * Math.PI, Math.PI, 1.5 * Math.PI],
    A2: [0.15, 0.3, 0.45],
    f2: [2, 3, 4, 6],
    p2: [0, Math.PI],
  };
  const LABEL = { A1: 'Amplituda', f1: 'Chastota', p1: 'Faza', A2: 'Amplituda ²', f2: 'Chastota ²', p2: 'Faza ²' };
  // bosqichlar: nHarm + faol parametrlar
  const LCFG = [
    { h: 1, act: ['A1'] },
    { h: 1, act: ['f1'] },
    { h: 1, act: ['A1', 'f1'] },
    { h: 1, act: ['A1', 'f1', 'p1'] },
    { h: 2, act: ['A1', 'f1', 'A2'] },
    { h: 2, act: ['A1', 'f1', 'A2', 'f2'] },
    { h: 2, act: ['A1', 'f1', 'p1', 'A2', 'f2'] },
    { h: 2, act: ['f1', 'p1', 'A2', 'f2', 'p2'] },
    { h: 2, act: ['A1', 'f1', 'p1', 'A2', 'f2', 'p2'] },
    { h: 2, act: ['A1', 'f1', 'p1', 'A2', 'f2', 'p2'] },
  ];
  const NLEV = LCFG.length;

  let levelIdx = 0, cfg, target = {}, val = {}, active = [], nHarm = 1;
  let state = 'menu', flashT = 0, matchPct = 0, err = 1, drag = -1;

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function load(idx) {
    levelIdx = idx; cfg = LCFG[idx]; nHarm = cfg.h; active = cfg.act.slice();
    const rnd = mulberry32((0x9e37 ^ (idx * 2654435761)) >>> 0);
    const keys = nHarm === 2 ? ['A1', 'f1', 'p1', 'A2', 'f2', 'p2'] : ['A1', 'f1', 'p1'];
    target = {}; val = {};
    for (const k of keys) {
      const n = STEPS[k].length;
      target[k] = Math.floor(rnd() * n);
      if (active.includes(k)) { let s = Math.floor(rnd() * n); if (s === target[k]) s = (s + 1) % n; val[k] = s; }
      else val[k] = target[k];
    }
    state = 'play'; flashT = 0; drag = -1;
    recompute();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    fit();
  }

  function wave(x, P) {
    let y = STEPS.A1[P.A1] * Math.sin(TAU * STEPS.f1[P.f1] * x + STEPS.p1[P.p1]);
    if (nHarm === 2) y += STEPS.A2[P.A2] * Math.sin(TAU * STEPS.f2[P.f2] * x + STEPS.p2[P.p2]);
    return y;
  }
  function recompute() {
    let e = 0; const K = 240;
    for (let i = 0; i <= K; i++) { const x = i / K; e += Math.abs(wave(x, val) - wave(x, target)); }
    err = e / (K + 1);
    matchPct = Math.max(0, Math.min(100, Math.round(100 * (1 - err / 1.1))));
    document.getElementById('matchPill').textContent = '〰 ' + matchPct + '%';
    if (state === 'play' && err < 0.02) win();
  }
  function win() {
    state = 'won'; flashT = 0.6; if (window.SFX) { SFX.win(); }
    if (window.FX) { for (let i = 0; i < 3; i++) FX.burst(innerWidth / 2, oscY + oscH / 2, '#8dffb0', 16); FX.shake(6); }
    if (levelIdx + 1 < NLEV) setTimeout(() => load(levelIdx + 1), 1050);
    else setTimeout(() => showPanel(true, '🎉 Rezonans ustasi!', "Barcha to'lqinni moslab rezonansga erishding — chastota ustasi bo'lding!", '↻ Qaytadan'), 1050);
  }
  function reset() { load(levelIdx); }

  // ── layout ──
  let oscX = 0, oscY = 0, oscW = 0, oscH = 0, sliders = [];
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 80;
    oscX = 18; oscW = innerWidth - 36; oscY = top;
    const sliderArea = Math.min(innerHeight * 0.5, active.length * 74 + 30);
    oscH = innerHeight - top - sliderArea - 24;
    oscH = Math.max(150, oscH);
    // slayderlar
    sliders = [];
    const sy0 = oscY + oscH + 26, sh = 60, gap = 12;
    active.forEach((k, i) => {
      sliders.push({ key: k, x: oscX + 12, y: sy0 + i * (sh + gap), w: oscW - 24, h: sh });
    });
  }

  function render(t) {
    const bg = ctx.createLinearGradient(0, 0, 0, innerHeight);
    bg.addColorStop(0, '#080c18'); bg.addColorStop(1, '#060810');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !cfg) return;
    drawOsc(t);
    for (const s of sliders) drawSlider(s);
    if (window.FX) FX.render(ctx);
    if (flashT > 0) { ctx.fillStyle = `rgba(140,255,180,${Math.min(.35, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); flashT -= 0.016; }
  }
  function drawOsc(t) {
    // panel
    ctx.save(); ctx.fillStyle = 'rgba(10,16,30,.7)';
    rr(oscX, oscY, oscW, oscH, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,255,.16)'; ctx.lineWidth = 1.5; rr(oscX, oscY, oscW, oscH, 16); ctx.stroke();
    ctx.clip();
    // panjara
    ctx.strokeStyle = 'rgba(120,160,255,.06)'; ctx.lineWidth = 1;
    for (let gx = 0; gx <= 8; gx++) { const x = oscX + oscW * gx / 8; ctx.beginPath(); ctx.moveTo(x, oscY); ctx.lineTo(x, oscY + oscH); ctx.stroke(); }
    for (let gy = 0; gy <= 4; gy++) { const y = oscY + oscH * gy / 4; ctx.beginPath(); ctx.moveTo(oscX, y); ctx.lineTo(oscX + oscW, y); ctx.stroke(); }
    const midY = oscY + oscH / 2, amp = oscH * 0.36, matched = err < 0.02;
    const scroll = matched ? 0 : t * 0.0004;
    // nishon to'lqin (xira)
    plot(P => wave(P, target), midY, amp, matched ? '#8dffb0' : '#39c0ff', matched ? 0.9 : 0.4, 3, scroll);
    // o'yinchi to'lqin (yorqin)
    const col = matched ? '#8dffb0' : (matchPct > 70 ? '#ffd23f' : '#ff8a5c');
    plot(P => wave(P, val), midY, amp, col, 1, 2.4, scroll);
    ctx.restore();
    // moslik meter
    ctx.fillStyle = '#9fb2d6'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('Moslik ' + matchPct + '%', oscX + oscW - 12, oscY + 10);
  }
  function plot(fn, midY, amp, color, alpha, lw, scroll) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); const K = 220;
    for (let i = 0; i <= K; i++) { const x = i / K; const sx = oscX + x * oscW; const sy = midY - fn((x + scroll) % 1) * amp;
      i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }
    ctx.stroke(); ctx.restore();
  }
  function drawSlider(s) {
    const steps = STEPS[s.key], n = steps.length, ti = target[s.key], vi = val[s.key];
    const trackY = s.y + s.h * 0.62, tx = s.x + 10, tw = s.w - 20;
    // label + qiymat
    ctx.fillStyle = '#c9d6f0'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(LABEL[s.key], s.x + 4, s.y + 14);
    // track
    ctx.strokeStyle = 'rgba(150,175,235,.22)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, trackY); ctx.lineTo(tx + tw, trackY); ctx.stroke();
    // qadam nuqtalari
    for (let i = 0; i < n; i++) { const x = tx + tw * i / (n - 1);
      ctx.fillStyle = 'rgba(150,175,235,.3)'; ctx.beginPath(); ctx.arc(x, trackY, 2.5, 0, 7); ctx.fill(); }
    // handle
    const hx = tx + tw * vi / (n - 1); const ok = vi === ti;
    ctx.save(); ctx.shadowColor = ok ? '#8dffb0' : '#39c0ff'; ctx.shadowBlur = 14;
    ctx.fillStyle = ok ? '#8dffb0' : '#eaf4ff'; ctx.beginPath(); ctx.arc(hx, trackY, 11, 0, 7); ctx.fill(); ctx.restore();
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function frame(t) { render(t); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); }
    else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('rezonans'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);

  function pos(e) { const rect = cv.getBoundingClientRect(); const tt = e.touches ? e.touches[0] : e; return [tt.clientX - rect.left, tt.clientY - rect.top]; }
  function setFromX(i, x) {
    const s = sliders[i], steps = STEPS[s.key], n = steps.length, tx = s.x + 10, tw = s.w - 20;
    let f = (x - tx) / tw; f = Math.max(0, Math.min(1, f));
    const idx = Math.round(f * (n - 1));
    if (val[s.key] !== idx) { val[s.key] = idx; if (window.SFX) SFX.tone(300 + idx * 40, 0.03, { type: 'sine', vol: 0.05 }); recompute(); }
  }
  function onDown(e) {
    e.preventDefault(); if (state !== 'play') return;
    const [x, y] = pos(e);
    for (let i = 0; i < sliders.length; i++) { const s = sliders[i]; if (y >= s.y && y <= s.y + s.h) { drag = i; setFromX(i, x); return; } }
  }
  function onMove(e) { if (drag < 0 || state !== 'play') return; e.preventDefault(); const [x] = pos(e); setFromX(drag, x); }
  function onUp() { drag = -1; }
  cv.addEventListener('mousedown', onDown); cv.addEventListener('mousemove', onMove); addEventListener('mouseup', onUp);
  cv.addEventListener('touchstart', onDown, { passive: false }); cv.addEventListener('touchmove', onMove, { passive: false }); cv.addEventListener('touchend', onUp);

  window.RZ_TEST = { solve: () => { for (const k of active) val[k] = target[k]; recompute(); return matchPct + '% err=' + err.toFixed(3); } };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
