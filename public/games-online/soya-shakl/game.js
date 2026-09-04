// Soya Shakl — nishon siluetni bo'laklar bilan aniq qopla (bo'shliqsiz, chiqmasdan).
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    {"w":3,"h":3,"target":[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],"pieces":[[[0,0],[0,1],[0,2],[1,0],[1,1]],[[0,2],[1,0],[1,1],[1,2]]]},
    {"w":4,"h":3,"target":[[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3]],"pieces":[[[0,0],[0,1],[1,0],[2,0]],[[0,1],[0,2],[1,0],[1,1]],[[0,2],[1,0],[1,1],[1,2]]]},
    {"w":4,"h":4,"target":[[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[3,0],[3,1],[3,2],[3,3]],"pieces":[[[0,0],[0,1],[1,1],[2,1]],[[0,0],[0,1],[1,0],[1,1],[2,0]],[[0,0],[1,0],[2,0],[2,1]],[[0,1],[1,0],[1,1]]]},
    {"w":5,"h":5,"target":[[0,2],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[2,4],[3,1],[3,2],[3,3],[4,2]],"pieces":[[[0,0],[1,0],[1,1],[2,0]],[[0,1],[1,0],[1,1],[2,1],[2,2],[3,2]],[[0,0],[0,1],[1,0]]]},
    {"w":5,"h":4,"target":[[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2],[1,3],[1,4],[2,0],[2,1],[2,2],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4]],"pieces":[[[0,0],[0,1],[0,2],[1,0],[2,0]],[[0,2],[1,0],[1,1],[1,2],[2,2],[3,2]],[[0,0],[1,0],[2,0],[3,0]],[[0,1],[0,2],[1,0],[1,1],[1,2]]]},
    {"w":5,"h":5,"target":[[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2],[1,3],[1,4],[2,0],[2,1],[2,2],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4],[4,0],[4,1],[4,2],[4,3],[4,4]],"pieces":[[[0,0],[0,1],[1,0]],[[0,0],[0,1],[0,2],[1,0]],[[0,1],[1,0],[1,1]],[[0,1],[1,0],[1,1],[2,1]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[1,0],[1,1]],[[0,0],[1,0],[1,1]]]},
    {"w":7,"h":7,"target":[[0,3],[1,2],[1,3],[1,4],[2,1],[2,2],[2,3],[2,4],[2,5],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[4,1],[4,2],[4,3],[4,4],[4,5],[5,2],[5,3],[5,4],[6,3]],"pieces":[[[0,0],[1,0],[1,1],[2,0]],[[0,2],[1,1],[1,2],[2,0],[2,1]],[[0,0],[0,1],[1,0]],[[0,1],[1,0],[1,1],[2,1]],[[0,0],[1,0],[2,0],[2,1],[3,0]],[[0,1],[0,2],[1,0],[1,1]]]},
    {"w":6,"h":5,"target":[[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5]],"pieces":[[[0,0],[0,1],[0,2],[1,1]],[[0,0],[0,1],[1,1]],[[0,1],[1,1],[2,0],[2,1]],[[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,1],[1,0],[1,1],[1,2]],[[0,0],[0,1],[1,0],[1,1]],[[0,3],[1,0],[1,1],[1,2],[1,3]]]},
    {"w":5,"h":6,"target":[[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,1],[1,2],[1,3],[1,4],[2,0],[2,1],[2,2],[2,3],[2,4],[3,0],[3,1],[3,2],[3,3],[3,4],[4,0],[4,1],[4,2],[4,3],[4,4],[5,0],[5,1],[5,2],[5,3],[5,4]],"pieces":[[[0,0],[0,1],[1,0],[1,1],[2,0]],[[0,0],[0,1],[0,2],[1,0]],[[0,1],[0,2],[1,0],[1,1],[2,1],[3,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,1],[1,1],[2,1],[3,0],[3,1]],[[0,0],[1,0],[1,1]],[[0,0],[0,1],[0,2]]]},
    {"w":6,"h":6,"target":[[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[5,0],[5,1],[5,2],[5,3],[5,4],[5,5]],"pieces":[[[0,0],[0,1],[0,2],[0,3]],[[0,1],[0,2],[1,0],[1,1],[2,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,0],[0,1],[1,0]],[[0,1],[1,0],[1,1],[1,2]],[[0,1],[1,0],[1,1],[1,2],[2,0],[2,1]],[[0,1],[0,2],[1,0],[1,1],[1,2]]]},
  ];
  const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#fb7185', '#60a5fa', '#f59e0b', '#4ade80', '#e879f9'];

  let levelIdx = 0, L = LEVELS[0];
  let targetSet = new Set(), pieces = [], cover = new Map();
  let W = 3, H = 3, filled = 0, total = 9, state = 'menu';
  let sel = -1;                 // tanlangan bo'lak indeksi (-1 = yo'q)
  let ghost = null;             // {r, c, ok}
  let flashT = 0, flashCol = '52,211,153', shakeT = 0;

  const key = (r, c) => r + ',' + c;

  function normalize(cells) {
    let mr = Infinity, mc = Infinity;
    for (const [r, c] of cells) { if (r < mr) mr = r; if (c < mc) mc = c; }
    return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }
  function rotateCW(cells) { return normalize(cells.map(([r, c]) => [c, -r])); }
  function bbox(cells) {
    let mr = 0, mc = 0;
    for (const [r, c] of cells) { if (r > mr) mr = r; if (c > mc) mc = c; }
    return [mr + 1, mc + 1];   // [h, w]
  }

  function load(idx) {
    levelIdx = idx; L = LEVELS[idx]; W = L.w; H = L.h;
    targetSet = new Set(L.target.map(([r, c]) => key(r, c)));
    total = L.target.length; filled = 0; cover = new Map();
    pieces = L.pieces.map((cells, i) => ({
      base: normalize(cells.map(c => c.slice())),
      cells: normalize(cells.map(c => c.slice())),
      color: COLORS[i % COLORS.length],
      placed: false, pr: 0, pc: 0
    }));
    sel = -1; ghost = null; state = 'play';
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updHud(); fit();
  }
  function updHud() { document.getElementById('fillPill').textContent = '◪ ' + filled + '/' + total; }
  function reset() { load(levelIdx); }

  function cellsAt(p, pr, pc) { return p.cells.map(([dr, dc]) => [pr + dr, pc + dc]); }
  function canPlace(p, pr, pc, ignore) {
    for (const [r, c] of cellsAt(p, pr, pc)) {
      if (!targetSet.has(key(r, c))) return false;
      const o = cover.get(key(r, c));
      if (o !== undefined && o !== ignore) return false;
    }
    return true;
  }
  function place(pi, pr, pc) {
    const p = pieces[pi];
    if (!canPlace(p, pr, pc, pi)) { shakeT = 0.3; if (window.SFX) SFX.hit(); return false; }
    // ilgari joylangan bo'lsa, eskisini tozala
    if (p.placed) removeFrom(pi);
    for (const [r, c] of cellsAt(p, pr, pc)) cover.set(key(r, c), pi);
    p.placed = true; p.pr = pr; p.pc = pc;
    filled = cover.size; updHud();
    if (window.SFX) SFX.tone(420 + pi * 30, 0.07, { type: 'triangle', vol: 0.1, to: 520 });
    sel = -1; ghost = null; layoutTray();
    if (filled === total) win();
    return true;
  }
  function removeFrom(pi) {
    for (const [k, v] of cover) if (v === pi) cover.delete(k);
    pieces[pi].placed = false; filled = cover.size; updHud();
  }
  function pickUp(pi) {
    removeFrom(pi); sel = pi; layoutTray();
    if (window.SFX) SFX.tone(300, 0.05, { type: 'sine', vol: 0.08 });
  }

  function win() {
    state = 'won'; flashT = 0.5; flashCol = '52,211,153';
    if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 950);
    else setTimeout(() => showPanel(true, '🎉 Ajoyib!', 'Barcha siluetni to\'liq yig\'ib chiqding — soya ustasi bo\'lding!', '↻ Qaytadan'), 950);
  }

  function rotateSel() {
    if (sel < 0 || state !== 'play') return;
    const p = pieces[sel];
    p.cells = rotateCW(p.cells);
    if (window.SFX) SFX.tone(520, 0.05, { type: 'square', vol: 0.07 });
  }

  // ── layout ──
  let GC = 40, gx = 0, gy = 0;             // grid cell + origin
  let trayY = 0, trayH = 120, slots = [];   // tray slotlar
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const topPad = 78;
    trayH = Math.min(150, Math.max(108, innerHeight * 0.2));
    trayY = innerHeight - trayH;
    const availH = trayY - topPad - 18, availW = innerWidth - 28;
    GC = Math.min(availW / W, availH / H); GC = Math.max(26, Math.min(74, GC));
    gx = (innerWidth - W * GC) / 2;
    gy = topPad + (availH - H * GC) / 2;
    layoutTray();
  }
  function layoutTray() {
    slots = [];
    const un = pieces.map((p, i) => i).filter(i => !pieces[i].placed);
    const n = un.length; if (!n) return;
    const pad = 8, sw = Math.min(96, (innerWidth - pad) / n - pad);
    const totalW = n * (sw + pad) - pad, startX = (innerWidth - totalW) / 2;
    un.forEach((pi, k) => { slots.push({ pi, x: startX + k * (sw + pad), y: trayY + 12, w: sw, h: trayH - 24 }); });
  }

  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function drawCell(x, y, s, color, alpha) {
    ctx.globalAlpha = alpha; ctx.fillStyle = color;
    rr(x + 1.5, y + 1.5, s - 3, s - 3, s * 0.18); ctx.fill();
    ctx.globalAlpha = alpha * 0.5; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    rr(x + 1.5, y + 1.5, s - 3, s - 3, s * 0.18); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function render() {
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight);
    bgg.addColorStop(0, '#0a0d1c'); bgg.addColorStop(1, '#0c1226');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu') return;

    const shX = shakeT > 0 ? (Math.sin(shakeT * 60) * 4) : 0;
    ctx.save(); ctx.translate(shX, 0);

    // nishon silueti — bo'sh kataklar
    for (const kk of targetSet) {
      const [r, c] = kk.split(',').map(Number);
      const x = gx + c * GC, y = gy + r * GC;
      if (!cover.has(kk)) {
        ctx.fillStyle = 'rgba(255,255,255,.055)';
        rr(x + 1.5, y + 1.5, GC - 3, GC - 3, GC * 0.18); ctx.fill();
        ctx.strokeStyle = 'rgba(140,170,255,.22)'; ctx.lineWidth = 1.4;
        rr(x + 1.5, y + 1.5, GC - 3, GC - 3, GC * 0.18); ctx.stroke();
      }
    }
    // joylangan bo'laklar
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i]; if (!p.placed) continue;
      for (const [r, c] of cellsAt(p, p.pr, p.pc)) drawCell(gx + c * GC, gy + r * GC, GC, p.color, 0.92);
    }
    // ghost (tanlangan bo'lak joylashuvi)
    if (sel >= 0 && ghost) {
      const p = pieces[sel];
      for (const [dr, dc] of p.cells) {
        const r = ghost.r + dr, c = ghost.c + dc;
        const x = gx + c * GC, y = gy + r * GC;
        drawCell(x, y, GC, ghost.ok ? p.color : '#fb7185', ghost.ok ? 0.5 : 0.4);
      }
    }
    ctx.restore();

    // tray fon
    ctx.fillStyle = 'rgba(8,11,24,.82)'; ctx.fillRect(0, trayY, innerWidth, trayH);
    ctx.strokeStyle = 'rgba(140,170,255,.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, trayY + 0.5); ctx.lineTo(innerWidth, trayY + 0.5); ctx.stroke();
    for (const sl of slots) {
      const p = pieces[sl.pi], selq = sl.pi === sel;
      ctx.fillStyle = selq ? 'rgba(34,211,238,.14)' : 'rgba(255,255,255,.035)';
      rr(sl.x, sl.y, sl.w, sl.h, 12); ctx.fill();
      ctx.strokeStyle = selq ? 'rgba(34,211,238,.7)' : 'rgba(140,170,255,.18)';
      ctx.lineWidth = selq ? 2 : 1; rr(sl.x, sl.y, sl.w, sl.h, 12); ctx.stroke();
      // mini shakl
      const [bh, bw] = bbox(p.cells);
      const ms = Math.min((sl.w - 16) / bw, (sl.h - 16) / bh); const msC = Math.min(ms, 22);
      const ox = sl.x + (sl.w - bw * msC) / 2, oy = sl.y + (sl.h - bh * msC) / 2;
      for (const [dr, dc] of p.cells) drawCell(ox + dc * msC, oy + dr * msC, msC, p.color, selq ? 1 : 0.82);
    }

    if (shakeT > 0) shakeT -= 0.016;
    if (flashT > 0) { ctx.fillStyle = `rgba(${flashCol},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); flashT -= 0.016; }
  }

  function frame() { render(); requestAnimationFrame(frame); }

  // ── panel ──
  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); }
    else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('soya-shakl'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('rotateBtn').addEventListener('click', rotateSel);
  addEventListener('keydown', e => {
    if (e.code === 'KeyR') { if (sel >= 0) rotateSel(); else reset(); }
  });

  // ── input ──
  function pos(e) { const rect = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - rect.left, t.clientY - rect.top]; }
  function trayHit(x, y) { for (const sl of slots) if (x >= sl.x && x <= sl.x + sl.w && y >= sl.y && y <= sl.y + sl.h) return sl.pi; return -1; }
  function gridCell(x, y) {
    const c = Math.floor((x - gx) / GC), r = Math.floor((y - gy) / GC);
    return [r, c];
  }
  function anchorFor(x, y, p) {
    const [r, c] = gridCell(x, y);
    const [bh, bw] = bbox(p.cells);
    return [r - Math.floor((bh - 1) / 2), c - Math.floor((bw - 1) / 2)];
  }
  function updGhost(x, y) {
    if (sel < 0) { ghost = null; return; }
    if (y >= trayY) { ghost = null; return; }
    const p = pieces[sel];
    const [pr, pc] = anchorFor(x, y, p);
    ghost = { r: pr, c: pc, ok: canPlace(p, pr, pc, sel) };
  }

  let down = false;
  function onDown(e) {
    e.preventDefault(); if (state !== 'play') return;
    const [x, y] = pos(e); down = true;
    if (y >= trayY) {                         // tray: bo'lak tanlash
      const pi = trayHit(x, y);
      if (pi >= 0) { sel = (sel === pi ? -1 : pi); ghost = null; if (window.SFX) SFX.tone(360, 0.04, { type: 'sine', vol: 0.06 }); }
      return;
    }
    // grid ustida
    if (sel >= 0) { updGhost(x, y); return; }
    // tanlanmagan — joylangan bo'lakni olib tashlash
    const [r, c] = gridCell(x, y);
    const pi = cover.get(key(r, c));
    if (pi !== undefined) pickUp(pi);
  }
  function onMove(e) {
    if (sel < 0 || state !== 'play') return;
    if (down) e.preventDefault();
    const [x, y] = pos(e); updGhost(x, y);
  }
  function onUp(e) {
    if (!down) return; down = false;
    if (sel < 0 || state !== 'play') return;
    const [x, y] = pos(e);
    if (y >= trayY) return;                    // tray ustida qo'yvorildi — bekor
    const p = pieces[sel];
    const [pr, pc] = anchorFor(x, y, p);
    place(sel, pr, pc);
  }
  cv.addEventListener('mousedown', onDown); cv.addEventListener('mousemove', onMove); addEventListener('mouseup', onUp);
  cv.addEventListener('touchstart', onDown, { passive: false });
  cv.addEventListener('touchmove', onMove, { passive: false });
  cv.addEventListener('touchend', onUp);

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
