// Soya Teatri — bo'laklarni burab qo'shma soyani nishon siluetga moslash.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // ── shakl kutubxonasi (pivotga nisbatan, birlik kvadrat masshtabida) ──
  const SHAPES = {
    bar:   [[-0.19,-0.065],[0.19,-0.065],[0.19,0.065],[-0.19,0.065]],
    blade: [[-0.26,-0.05],[0.22,-0.03],[0.22,0.05],[-0.26,0.05]],
    tri:   [[-0.17,0.15],[0.19,0.13],[0.02,-0.21]],
    wedge: [[0,0],[0.30,0.02],[0.27,0.13],[0.17,0.23]],
    trap:  [[-0.21,0.11],[0.21,0.11],[0.12,-0.13],[-0.12,-0.13]],
    ell:   [[-0.17,-0.17],[0.05,-0.17],[0.05,-0.01],[-0.03,-0.01],[-0.03,0.17],[-0.17,0.17]],
    kite:  [[0,-0.22],[0.15,0.02],[0,0.20],[-0.15,0.02]],
  };
  const SHAPE_KEYS = Object.keys(SHAPES);
  const RIM = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa'];
  const STEP = Math.PI / 4;   // 45°
  const MASKN = 96;

  // levels: bo'laklar soni oshib boradi
  const LCFG = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
  const NLEV = LCFG.length;

  let levelIdx = 0, pieces = [], state = 'menu';
  let targetMask = null, curMask = null;
  let matchPct = 0, mism = 1, flashT = 0;

  // offscreen mask canvas
  const mc = document.createElement('canvas'); mc.width = MASKN; mc.height = MASKN;
  const mctx = mc.getContext('2d', { willReadFrequently: true });

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function polyAt(p, ang) {
    const s = SHAPES[p.shape], ca = Math.cos(ang), sa = Math.sin(ang), out = [];
    for (const [x, y] of s) {
      const rx = x * p.sz, ry = y * p.sz;
      out.push([p.px + (rx * ca - ry * sa), p.py + (rx * sa + ry * ca)]);
    }
    return out;
  }

  function load(idx) {
    levelIdx = idx;
    const K = LCFG[idx];
    const rnd = mulberry32((0xBEEF ^ (idx * 2654435761)) >>> 0);
    pieces = [];
    const rp = 0.055 + 0.04 * Math.min(1, K / 5);
    for (let i = 0; i < K; i++) {
      const a0 = (i / K) * Math.PI * 2 + rnd() * 0.6;
      const shape = SHAPE_KEYS[Math.floor(rnd() * SHAPE_KEYS.length)];
      const sz = 0.85 + rnd() * 0.5;
      const sol = Math.floor(rnd() * 8);
      let st = (sol + 1 + Math.floor(rnd() * 6)) % 8;   // scrambled, sol'dan farqli
      pieces.push({
        shape, sz,
        px: 0.5 + Math.cos(a0) * rp, py: 0.5 + Math.sin(a0) * rp,
        sol, angleI: st, disp: st * STEP, rim: RIM[i % RIM.length]
      });
    }
    // target mask (yechim burchaklarida)
    targetMask = rasterize(pieces.map(p => p.sol));
    state = 'play'; flashT = 0;
    recompute();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    fit();
  }

  function rasterize(angsSteps) {
    mctx.clearRect(0, 0, MASKN, MASKN);
    mctx.fillStyle = '#fff';
    for (let i = 0; i < pieces.length; i++) {
      const poly = polyAt(pieces[i], angsSteps[i] * STEP);
      mctx.beginPath();
      for (let j = 0; j < poly.length; j++) { const x = poly[j][0] * MASKN, y = poly[j][1] * MASKN; j ? mctx.lineTo(x, y) : mctx.moveTo(x, y); }
      mctx.closePath(); mctx.fill();
    }
    const d = mctx.getImageData(0, 0, MASKN, MASKN).data;
    const m = new Uint8Array(MASKN * MASKN);
    for (let k = 0; k < m.length; k++) m[k] = d[k * 4 + 3] > 128 ? 1 : 0;
    return m;
  }

  function recompute() {
    curMask = rasterize(pieces.map(p => p.angleI));
    let inter = 0, uni = 0, mm = 0;
    for (let k = 0; k < curMask.length; k++) {
      const t = targetMask[k], c = curMask[k];
      if (t && c) inter++; if (t || c) uni++; if (t !== c) mm++;
    }
    mism = mm; matchPct = uni ? Math.round(100 * inter / uni) : 100;
    document.getElementById('matchPill').textContent = '◐ ' + matchPct + '%';
    if (state === 'play' && mism === 0) win();
  }

  function win() {
    state = 'won'; flashT = 0.5;
    if (window.SFX) SFX.win();
    const c = toScreen(0.5, 0.5); if (window.FX) FX.burst(c.x, c.y, '#ffe0a0', 26);
    if (levelIdx + 1 < NLEV) setTimeout(() => load(levelIdx + 1), 1000);
    else setTimeout(() => showPanel(true, "🎉 Soya ustasi!", "Barcha siluetni aynan yig'ib chiqding — yorug'lik va soya senga bo'ysundi!", "↻ Qaytadan"), 1000);
  }

  function rotatePiece(i) {
    if (state !== 'play') return;
    pieces[i].angleI = (pieces[i].angleI + 1) % 8;
    if (window.SFX) SFX.tone(320 + i * 25, 0.05, { type: 'triangle', vol: 0.06, to: 460 });
    recompute();
  }
  function reset() { load(levelIdx); }

  // ── layout ──
  let PL = 300, ox = 0, oy = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 96, availH = innerHeight - top - 28, availW = innerWidth - 28;
    PL = Math.min(availW, availH); PL = Math.max(220, Math.min(560, PL));
    ox = (innerWidth - PL) / 2; oy = top + (availH - PL) / 2;
  }
  function toScreen(x, y) { return { x: ox + x * PL, y: oy + y * PL }; }

  function pathPoly(poly) {
    ctx.beginPath();
    for (let j = 0; j < poly.length; j++) { const s = toScreen(poly[j][0], poly[j][1]); j ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y); }
    ctx.closePath();
  }

  // ── render ──
  function render(t) {
    // sahna foni + tepadagi chiroq nuri
    const bg = ctx.createLinearGradient(0, 0, 0, innerHeight);
    bg.addColorStop(0, '#0c1020'); bg.addColorStop(1, '#070a13');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    // chiroq halosi
    const lamp = ctx.createRadialGradient(innerWidth / 2, oy - 30, 10, innerWidth / 2, oy - 30, PL * 0.9);
    lamp.addColorStop(0, 'rgba(255,240,200,.16)'); lamp.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = lamp; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !pieces.length) return;

    // "parda" ramkasi
    ctx.strokeStyle = 'rgba(150,180,240,.12)'; ctx.lineWidth = 2;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(ox - 6, oy - 6, PL + 12, PL + 12, 16); ctx.stroke(); }

    // nishon siluet — yumshoq "ruh"
    ctx.save();
    for (const p of pieces) { pathPoly(polyAt(p, p.sol * STEP)); }
    ctx.fillStyle = 'rgba(255,238,206,.09)'; ctx.fill('evenodd');
    ctx.restore();
    // nishon konturi (yaqinlashganda yashilroq)
    const near = matchPct / 100;
    ctx.save(); ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 0.03;
    ctx.strokeStyle = mism === 0 ? '#8dffb0' : `rgba(${255 - near * 160},${220 + near * 20},${170 + near * 40},.55)`;
    ctx.lineWidth = 2;
    for (const p of pieces) { pathPoly(polyAt(p, p.sol * STEP)); ctx.stroke(); }
    ctx.restore();

    // joriy bo'laklar (qorong'i okklyuderlar + neon rim)
    for (const p of pieces) {
      p.disp += (p.angleI * STEP - p.disp) * 0.25;
      // eng qisqa yo'l bilan aylanish uchun disp'ni normalizatsiya qilmaymiz — kichik STEP
      const poly = polyDisp(p);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
      pathPoly(poly); ctx.fillStyle = '#0b0f1a'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = p.rim; ctx.shadowBlur = state === 'won' ? 20 : 10;
      pathPoly(poly); ctx.strokeStyle = p.rim; ctx.lineWidth = 2.4; ctx.globalAlpha = state === 'won' ? 1 : 0.9; ctx.stroke(); ctx.restore();
      // pivot nuqta
      const pv = toScreen(p.px, p.py);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(pv.x, pv.y, 2.6, 0, 7); ctx.fill();
    }

    if (window.FX) FX.render(ctx);
    if (flashT > 0) { ctx.fillStyle = `rgba(160,230,180,${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); flashT -= 0.016; }
  }
  function polyDisp(p) {
    const s = SHAPES[p.shape], ca = Math.cos(p.disp), sa = Math.sin(p.disp), out = [];
    for (const [x, y] of s) { const rx = x * p.sz, ry = y * p.sz; out.push([p.px + (rx * ca - ry * sa), p.py + (rx * sa + ry * ca)]); }
    return out;
  }

  function frame(t) { render(t); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  // ── panel ──
  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); }
    else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('soya-teatri'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);

  function pointInPoly(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = toScreen(poly[i][0], poly[i][1]), b = toScreen(poly[j][0], poly[j][1]);
      if (((a.y > py) !== (b.y > py)) && (px < (b.x - a.x) * (py - a.y) / (b.y - a.y) + a.x)) inside = !inside;
    }
    return inside;
  }
  function pos(e) { const rect = cv.getBoundingClientRect(); const tt = e.touches ? e.touches[0] : e; return [tt.clientX - rect.left, tt.clientY - rect.top]; }
  function onDown(e) {
    e.preventDefault(); if (state !== 'play') return;
    const [x, y] = pos(e);
    // eng ustki (oxirgi) mos bo'lakni tanlaymiz
    for (let i = pieces.length - 1; i >= 0; i--) {
      if (pointInPoly(x, y, polyAt(pieces[i], pieces[i].angleI * STEP))) { rotatePiece(i); return; }
    }
    // hech biriga tegmasa — eng yaqin pivotli bo'lakni bur (mobil qulaylik)
    let best = -1, bd = 1e9;
    for (let i = 0; i < pieces.length; i++) { const pv = toScreen(pieces[i].px, pieces[i].py); const d = (pv.x - x) ** 2 + (pv.y - y) ** 2; if (d < bd) { bd = d; best = i; } }
    if (best >= 0 && bd < (PL * 0.28) ** 2) rotatePiece(best);
  }
  cv.addEventListener('mousedown', onDown);
  cv.addEventListener('touchstart', onDown, { passive: false });

  window.ST_TEST = { solve: () => { for (const p of pieces) p.angleI = p.sol; recompute(); return mism; } };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
