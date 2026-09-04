// Rang Kimyosi — quvurlarni burab rangli oqimlarni ulash va aralashtirish.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [{"R":4,"C":4,"cells":[{"r":0,"c":1,"kind":"pipe","dirs":6},{"r":0,"c":2,"kind":"pipe","dirs":12},{"r":1,"c":0,"kind":"sink","dirs":2,"target":["C"]},{"r":1,"c":1,"kind":"pipe","dirs":9},{"r":1,"c":2,"kind":"source","dirs":1,"color":"C"}]},{"R":4,"C":5,"cells":[{"r":2,"c":3,"kind":"sink","dirs":4,"target":["M","Y"]},{"r":3,"c":0,"kind":"source","dirs":2,"color":"M"},{"r":3,"c":1,"kind":"pipe","dirs":10},{"r":3,"c":2,"kind":"pipe","dirs":10},{"r":3,"c":3,"kind":"pipe","dirs":11},{"r":3,"c":4,"kind":"source","dirs":8,"color":"Y"}]},{"R":5,"C":5,"cells":[{"r":0,"c":2,"kind":"sink","dirs":2,"target":["C"]},{"r":0,"c":3,"kind":"pipe","dirs":10},{"r":0,"c":4,"kind":"pipe","dirs":12},{"r":1,"c":4,"kind":"source","dirs":1,"color":"C"},{"r":2,"c":0,"kind":"source","dirs":4,"color":"C"},{"r":2,"c":1,"kind":"source","dirs":4,"color":"M"},{"r":3,"c":0,"kind":"pipe","dirs":7},{"r":3,"c":1,"kind":"pipe","dirs":9},{"r":4,"c":0,"kind":"sink","dirs":1,"target":["C","M"]}]},{"R":5,"C":5,"cells":[{"r":0,"c":3,"kind":"pipe","dirs":6},{"r":0,"c":4,"kind":"pipe","dirs":12},{"r":1,"c":2,"kind":"source","dirs":4,"color":"Y"},{"r":1,"c":3,"kind":"pipe","dirs":5},{"r":1,"c":4,"kind":"sink","dirs":1,"target":["M"]},{"r":2,"c":1,"kind":"sink","dirs":2,"target":["C","Y"]},{"r":2,"c":2,"kind":"pipe","dirs":13},{"r":2,"c":3,"kind":"source","dirs":1,"color":"M"},{"r":3,"c":2,"kind":"pipe","dirs":3},{"r":3,"c":3,"kind":"source","dirs":8,"color":"C"}]},{"R":5,"C":6,"cells":[{"r":0,"c":3,"kind":"source","dirs":4,"color":"C"},{"r":0,"c":4,"kind":"source","dirs":4,"color":"M"},{"r":1,"c":2,"kind":"sink","dirs":2,"target":["C","M","Y"]},{"r":1,"c":3,"kind":"pipe","dirs":15},{"r":1,"c":4,"kind":"pipe","dirs":13},{"r":2,"c":3,"kind":"source","dirs":1,"color":"C"},{"r":2,"c":4,"kind":"source","dirs":1,"color":"Y"},{"r":3,"c":3,"kind":"source","dirs":4,"color":"Y"},{"r":3,"c":4,"kind":"pipe","dirs":6},{"r":3,"c":5,"kind":"sink","dirs":8,"target":["Y"]},{"r":4,"c":2,"kind":"source","dirs":2,"color":"Y"},{"r":4,"c":3,"kind":"pipe","dirs":11},{"r":4,"c":4,"kind":"pipe","dirs":9}]},{"R":6,"C":5,"cells":[{"r":2,"c":3,"kind":"source","dirs":4,"color":"Y"},{"r":2,"c":4,"kind":"source","dirs":4,"color":"C"},{"r":3,"c":0,"kind":"pipe","dirs":6},{"r":3,"c":1,"kind":"pipe","dirs":14},{"r":3,"c":2,"kind":"source","dirs":8,"color":"M"},{"r":3,"c":3,"kind":"pipe","dirs":7},{"r":3,"c":4,"kind":"pipe","dirs":13},{"r":4,"c":0,"kind":"pipe","dirs":5},{"r":4,"c":1,"kind":"sink","dirs":1,"target":["C","M"]},{"r":4,"c":2,"kind":"sink","dirs":2,"target":["C","M","Y"]},{"r":4,"c":3,"kind":"pipe","dirs":9},{"r":4,"c":4,"kind":"source","dirs":1,"color":"M"},{"r":5,"c":0,"kind":"source","dirs":1,"color":"C"}]},{"R":6,"C":6,"cells":[{"r":0,"c":3,"kind":"pipe","dirs":6},{"r":0,"c":4,"kind":"pipe","dirs":10},{"r":0,"c":5,"kind":"pipe","dirs":12},{"r":1,"c":2,"kind":"source","dirs":2,"color":"M"},{"r":1,"c":3,"kind":"pipe","dirs":9},{"r":1,"c":4,"kind":"source","dirs":4,"color":"C"},{"r":1,"c":5,"kind":"sink","dirs":1,"target":["M"]},{"r":2,"c":3,"kind":"source","dirs":2,"color":"Y"},{"r":2,"c":4,"kind":"pipe","dirs":15},{"r":2,"c":5,"kind":"source","dirs":8,"color":"Y"},{"r":3,"c":3,"kind":"sink","dirs":4,"target":["C"]},{"r":3,"c":4,"kind":"pipe","dirs":3},{"r":3,"c":5,"kind":"sink","dirs":8,"target":["C","Y"]},{"r":4,"c":2,"kind":"source","dirs":4,"color":"C"},{"r":4,"c":3,"kind":"pipe","dirs":5},{"r":5,"c":2,"kind":"pipe","dirs":3},{"r":5,"c":3,"kind":"pipe","dirs":11},{"r":5,"c":4,"kind":"source","dirs":8,"color":"C"}]},{"R":6,"C":6,"cells":[{"r":0,"c":1,"kind":"sink","dirs":4,"target":["M","Y"]},{"r":1,"c":1,"kind":"pipe","dirs":5},{"r":2,"c":0,"kind":"source","dirs":4,"color":"Y"},{"r":2,"c":1,"kind":"pipe","dirs":5},{"r":3,"c":0,"kind":"pipe","dirs":3},{"r":3,"c":1,"kind":"pipe","dirs":11},{"r":3,"c":2,"kind":"source","dirs":8,"color":"M"},{"r":4,"c":0,"kind":"source","dirs":2,"color":"M"},{"r":4,"c":1,"kind":"pipe","dirs":12},{"r":4,"c":2,"kind":"source","dirs":4,"color":"C"},{"r":5,"c":1,"kind":"pipe","dirs":3},{"r":5,"c":2,"kind":"pipe","dirs":11},{"r":5,"c":3,"kind":"pipe","dirs":10},{"r":5,"c":4,"kind":"sink","dirs":8,"target":["C","M"]}]},{"R":6,"C":7,"cells":[{"r":0,"c":2,"kind":"sink","dirs":2,"target":["C","M"]},{"r":0,"c":3,"kind":"pipe","dirs":12},{"r":0,"c":4,"kind":"source","dirs":4,"color":"M"},{"r":0,"c":6,"kind":"sink","dirs":4,"target":["Y"]},{"r":1,"c":2,"kind":"source","dirs":2,"color":"C"},{"r":1,"c":3,"kind":"pipe","dirs":11},{"r":1,"c":4,"kind":"pipe","dirs":9},{"r":1,"c":5,"kind":"source","dirs":2,"color":"Y"},{"r":1,"c":6,"kind":"pipe","dirs":13},{"r":2,"c":3,"kind":"source","dirs":2,"color":"C"},{"r":2,"c":4,"kind":"pipe","dirs":12},{"r":2,"c":5,"kind":"pipe","dirs":6},{"r":2,"c":6,"kind":"pipe","dirs":9},{"r":3,"c":2,"kind":"sink","dirs":2,"target":["C","Y"]},{"r":3,"c":3,"kind":"pipe","dirs":14},{"r":3,"c":4,"kind":"pipe","dirs":9},{"r":3,"c":5,"kind":"source","dirs":1,"color":"Y"},{"r":4,"c":3,"kind":"source","dirs":1,"color":"Y"}]},{"R":7,"C":6,"cells":[{"r":0,"c":3,"kind":"pipe","dirs":6},{"r":0,"c":4,"kind":"pipe","dirs":14},{"r":0,"c":5,"kind":"source","dirs":8,"color":"C"},{"r":1,"c":3,"kind":"source","dirs":1,"color":"M"},{"r":1,"c":4,"kind":"pipe","dirs":5},{"r":2,"c":3,"kind":"pipe","dirs":6},{"r":2,"c":4,"kind":"pipe","dirs":9},{"r":2,"c":5,"kind":"source","dirs":4,"color":"M"},{"r":3,"c":0,"kind":"sink","dirs":4,"target":["C","M","Y"]},{"r":3,"c":2,"kind":"source","dirs":4,"color":"C"},{"r":3,"c":3,"kind":"sink","dirs":1,"target":["C","M"]},{"r":3,"c":4,"kind":"pipe","dirs":6},{"r":3,"c":5,"kind":"pipe","dirs":13},{"r":4,"c":0,"kind":"pipe","dirs":7},{"r":4,"c":1,"kind":"pipe","dirs":10},{"r":4,"c":2,"kind":"pipe","dirs":9},{"r":4,"c":3,"kind":"source","dirs":2,"color":"Y"},{"r":4,"c":4,"kind":"pipe","dirs":9},{"r":4,"c":5,"kind":"sink","dirs":1,"target":["M","Y"]},{"r":5,"c":0,"kind":"pipe","dirs":7},{"r":5,"c":1,"kind":"source","dirs":8,"color":"Y"},{"r":6,"c":0,"kind":"source","dirs":1,"color":"M"}]},{"R":7,"C":7,"cells":[{"r":0,"c":2,"kind":"pipe","dirs":6},{"r":0,"c":3,"kind":"pipe","dirs":12},{"r":1,"c":1,"kind":"source","dirs":2,"color":"Y"},{"r":1,"c":2,"kind":"pipe","dirs":9},{"r":1,"c":3,"kind":"pipe","dirs":5},{"r":1,"c":6,"kind":"source","dirs":4,"color":"C"},{"r":2,"c":3,"kind":"pipe","dirs":5},{"r":2,"c":4,"kind":"pipe","dirs":6},{"r":2,"c":5,"kind":"pipe","dirs":14},{"r":2,"c":6,"kind":"pipe","dirs":13},{"r":3,"c":3,"kind":"sink","dirs":1,"target":["Y"]},{"r":3,"c":4,"kind":"source","dirs":1,"color":"C"},{"r":3,"c":5,"kind":"source","dirs":1,"color":"M"},{"r":3,"c":6,"kind":"sink","dirs":1,"target":["C","M"]},{"r":5,"c":0,"kind":"pipe","dirs":6},{"r":5,"c":1,"kind":"source","dirs":8,"color":"M"},{"r":5,"c":2,"kind":"sink","dirs":4,"target":["C","M"]},{"r":5,"c":3,"kind":"source","dirs":4,"color":"C"},{"r":6,"c":0,"kind":"pipe","dirs":3},{"r":6,"c":1,"kind":"pipe","dirs":10},{"r":6,"c":2,"kind":"pipe","dirs":11},{"r":6,"c":3,"kind":"pipe","dirs":9}]},{"R":7,"C":7,"cells":[{"r":2,"c":4,"kind":"source","dirs":2,"color":"C"},{"r":2,"c":5,"kind":"pipe","dirs":12},{"r":2,"c":6,"kind":"source","dirs":4,"color":"C"},{"r":3,"c":3,"kind":"source","dirs":4,"color":"Y"},{"r":3,"c":4,"kind":"source","dirs":4,"color":"M"},{"r":3,"c":5,"kind":"pipe","dirs":3},{"r":3,"c":6,"kind":"pipe","dirs":13},{"r":4,"c":2,"kind":"source","dirs":2,"color":"C"},{"r":4,"c":3,"kind":"pipe","dirs":11},{"r":4,"c":4,"kind":"pipe","dirs":15},{"r":4,"c":5,"kind":"sink","dirs":8,"target":["C","M","Y"]},{"r":4,"c":6,"kind":"sink","dirs":1,"target":["C"]},{"r":5,"c":3,"kind":"source","dirs":4,"color":"Y"},{"r":5,"c":4,"kind":"source","dirs":1,"color":"C"},{"r":5,"c":5,"kind":"source","dirs":4,"color":"M"},{"r":6,"c":3,"kind":"pipe","dirs":3},{"r":6,"c":4,"kind":"pipe","dirs":10},{"r":6,"c":5,"kind":"pipe","dirs":11},{"r":6,"c":6,"kind":"sink","dirs":8,"target":["M","Y"]}]}];

  // yo'nalish bitlari
  const N = 1, E = 2, S = 4, W = 8;
  const DR = { 1: [-1, 0], 4: [1, 0], 2: [0, 1], 8: [0, -1] };
  const OPP = { 1: 4, 4: 1, 2: 8, 8: 2 };
  const rot = m => ((m << 1) | (m >> 3)) & 15;

  // rang xaritasi (subtraktiv CMY)
  const MIX = {
    '':    { hex: '#243049', glow: '#2a3a58', name: '—', empty: true },
    'C':   { hex: '#22e0d8', glow: '#22e0d8', name: 'moviy' },
    'M':   { hex: '#ff45b5', glow: '#ff45b5', name: 'pushti' },
    'Y':   { hex: '#ffd23f', glow: '#ffd23f', name: 'sariq' },
    'CM':  { hex: '#4f63ff', glow: '#4f63ff', name: "ko'k" },
    'CY':  { hex: '#37e07d', glow: '#37e07d', name: 'yashil' },
    'MY':  { hex: '#ff5545', glow: '#ff5545', name: 'qizil' },
    'CMY': { hex: '#b0763f', glow: '#c78a4a', name: 'jigarrang' },
  };
  const keyOf = arr => arr.slice().sort().join('');

  let levelIdx = 0, L, cells = [], grid = new Map(), R = 4, C = 4;
  let sinks = [], total = 0, solved = 0, state = 'menu';
  let flashT = 0, winT = 0;
  const K = (r, c) => r + ',' + c;

  function load(idx) {
    levelIdx = idx; L = LEVELS[idx]; R = L.R; C = L.C;
    cells = L.cells.map(o => ({
      r: o.r, c: o.c, kind: o.kind, base: o.dirs, dirs: o.dirs,
      color: o.color || null, target: o.target || null,
      rotatable: o.kind === 'pipe', spin: 0
    }));
    grid = new Map(); cells.forEach(cell => grid.set(K(cell.r, cell.c), cell));
    // pipe'larni deterministik burab boshlaymiz (har safar bir xil boshqotirma)
    let seed = 0x9e37 ^ (idx * 2654435761);
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (const cell of cells) if (cell.rotatable) {
      let n = 1 + Math.floor(rnd() * 3);
      // hech bo'lmaganda boshlanish yechilgan holatda bo'lmasin
      for (let i = 0; i < n; i++) cell.dirs = rot(cell.dirs);
    }
    sinks = cells.filter(c => c.kind === 'sink'); total = sinks.length;
    state = 'play'; flashT = 0; winT = 0;
    recompute();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    fit();
  }

  // union-find bilan komponentlar va har idish rangi
  let compColor = new Map();   // cell -> mix key string
  function recompute() {
    const parent = new Map(); cells.forEach(c => parent.set(c, c));
    const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
    const uni = (a, b) => parent.set(find(a), find(b));
    for (const cell of cells) {
      for (const d in DR) {
        const db = +d;
        if (cell.dirs & db) {
          const nb = grid.get(K(cell.r + DR[d][0], cell.c + DR[d][1]));
          if (nb && (nb.dirs & OPP[db])) uni(cell, nb);
        }
      }
    }
    const csrc = new Map();
    for (const cell of cells) if (cell.kind === 'source') {
      const r = find(cell); if (!csrc.has(r)) csrc.set(r, new Set());
      csrc.get(r).add(cell.color);
    }
    compColor = new Map();
    for (const cell of cells) {
      const set = csrc.get(find(cell));
      compColor.set(cell, set ? keyOf([...set]) : '');
    }
    solved = 0;
    for (const s of sinks) { if (compColor.get(s) === keyOf(s.target)) solved++; }
    document.getElementById('fillPill').textContent = '◉ ' + solved + '/' + total;
    if (state === 'play' && solved === total) win();
  }

  function win() {
    state = 'won'; winT = 1; flashT = 0.5;
    if (window.SFX) SFX.win();
    for (const s of sinks) { const p = cellCenter(s); if (window.FX) FX.burst(p.x, p.y, MIX[keyOf(s.target)].hex, 20); }
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1000);
    else setTimeout(() => showPanel(true, "🎉 Kimyogar!", "Barcha bosqichda ranglarni to'g'ri aralashtirding — rang ustasi bo'lding!", "↻ Qaytadan"), 1000);
  }

  function rotateCell(cell) {
    if (state !== 'play' || !cell.rotatable) return;
    cell.dirs = rot(cell.dirs); cell.spin = -Math.PI / 2;
    if (window.SFX) SFX.tone(300 + Math.random() * 60, 0.05, { type: 'square', vol: 0.06, to: 420 });
    recompute();
  }
  function reset() { if (state === 'play' || state === 'won') load(levelIdx); }

  // ── layout ──
  let GC = 60, gx = 0, gy = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 78, availH = innerHeight - top - 24, availW = innerWidth - 24;
    GC = Math.min(availW / C, availH / R); GC = Math.max(34, Math.min(92, GC));
    gx = (innerWidth - C * GC) / 2; gy = top + (availH - R * GC) / 2;
  }
  function cellCenter(cell) { return { x: gx + cell.c * GC + GC / 2, y: gy + cell.r * GC + GC / 2 }; }

  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ── render ──
  function render(t) {
    // fon: chuqur laboratoriya gradienti + panjara
    const bg = ctx.createRadialGradient(innerWidth / 2, gy + R * GC / 2, 40, innerWidth / 2, innerHeight / 2, Math.max(innerWidth, innerHeight) * 0.75);
    bg.addColorStop(0, '#111a2e'); bg.addColorStop(1, '#080b16');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !cells.length) return;

    // panjara katakchalari
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const x = gx + c * GC, y = gy + r * GC;
      ctx.fillStyle = 'rgba(255,255,255,.018)';
      rr(x + 2, y + 2, GC - 4, GC - 4, GC * 0.14); ctx.fill();
    }

    const arm = Math.max(7, GC * 0.16);
    // avval quvur "kanal"larini (qorong'i g'ilof) chizamiz
    for (const cell of cells) drawPipeArms(cell, t, arm, false);
    // keyin ustidan rangli oqim
    for (const cell of cells) drawPipeArms(cell, t, arm, true);
    // hub / manba / idish
    for (const cell of cells) drawNode(cell, t, arm);

    if (window.FX) FX.render(ctx);
    if (flashT > 0) { ctx.fillStyle = `rgba(140,230,180,${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); flashT -= 0.016; }
  }

  function drawPipeArms(cell, t, arm, colored) {
    const p = cellCenter(cell);
    const key = compColor.get(cell) || '';
    const mix = MIX[key];
    ctx.save(); ctx.translate(p.x, p.y);
    if (cell.spin) { ctx.rotate(cell.spin); cell.spin += (0 - cell.spin) * 0.28; if (Math.abs(cell.spin) < 0.01) cell.spin = 0; }
    for (const d in DR) {
      const db = +d; if (!(cell.dirs & db)) continue;
      const dir = DR[d], ex = dir[1] * GC / 2, ey = dir[0] * GC / 2;
      if (!colored) {
        ctx.strokeStyle = '#0c1322'; ctx.lineWidth = arm + 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = 'rgba(150,180,240,.10)'; ctx.lineWidth = arm + 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex, ey); ctx.stroke();
      } else if (!mix.empty) {
        ctx.save(); ctx.shadowColor = mix.glow; ctx.shadowBlur = 14;
        ctx.strokeStyle = mix.hex; ctx.lineWidth = arm; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();
        // oqim yorug'lik nuqtalari
        const flow = (t * 0.06) % 1;
        const fx = ex * flow, fy = ey * flow;
        ctx.globalAlpha = 0.85; ctx.fillStyle = '#eafff9';
        ctx.beginPath(); ctx.arc(fx, fy, arm * 0.22, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    // markaz hub
    if (!colored) { ctx.fillStyle = '#0c1322'; ctx.beginPath(); ctx.arc(0, 0, arm * 0.72 + 3, 0, 7); ctx.fill(); }
    else if (!mix.empty) { ctx.save(); ctx.shadowColor = mix.glow; ctx.shadowBlur = 12; ctx.fillStyle = mix.hex;
      ctx.beginPath(); ctx.arc(0, 0, arm * 0.6, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }

  function drawNode(cell, t, arm) {
    const p = cellCenter(cell); const rad = GC * 0.3;
    if (cell.kind === 'source') {
      const mix = MIX[cell.color];
      ctx.save(); ctx.shadowColor = mix.glow; ctx.shadowBlur = 20;
      const g = ctx.createRadialGradient(p.x - rad * 0.3, p.y - rad * 0.3, rad * 0.15, p.x, p.y, rad);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, mix.hex); g.addColorStop(1, mix.hex);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 7); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.font = `bold ${Math.floor(GC * 0.26)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('◉', p.x, p.y + 1);
    } else if (cell.kind === 'sink') {
      const cur = compColor.get(cell) || '';
      const want = keyOf(cell.target); const okk = cur === want;
      const tgt = MIX[want];
      // idish oltiburchak
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3, hx = Math.cos(a) * rad * 1.15, hy = Math.sin(a) * rad * 1.15; i ? ctx.lineTo(hx, hy) : ctx.moveTo(hx, hy); }
      ctx.closePath();
      // ichki joriy rang
      const curMix = MIX[cur] || MIX[''];
      ctx.fillStyle = curMix.empty ? 'rgba(20,28,46,.9)' : curMix.hex; ctx.fill();
      // nishon halqa
      ctx.shadowColor = okk ? '#8dffb0' : tgt.glow; ctx.shadowBlur = okk ? 22 : 12;
      ctx.strokeStyle = okk ? '#8dffb0' : tgt.hex; ctx.lineWidth = okk ? 4 : 3; ctx.stroke();
      ctx.restore();
      // belgisi
      ctx.fillStyle = okk ? '#eafff2' : 'rgba(255,255,255,.85)';
      ctx.font = `bold ${Math.floor(GC * 0.3)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(okk ? '✓' : '⬡', p.x, p.y + 1);
    }
  }

  let last = 0;
  function frame(t) {
    render(t);
    if (window.FX) FX.update(16);
    requestAnimationFrame(frame);
  }

  // ── panel ──
  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); }
    else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('rang-kimyo'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);

  function pos(e) { const rect = cv.getBoundingClientRect(); const tt = e.touches ? e.touches[0] : e; return [tt.clientX - rect.left, tt.clientY - rect.top]; }
  function onDown(e) {
    e.preventDefault(); if (state !== 'play') return;
    const [x, y] = pos(e);
    const c = Math.floor((x - gx) / GC), r = Math.floor((y - gy) / GC);
    const cell = grid.get(K(r, c));
    if (cell) rotateCell(cell);
  }
  cv.addEventListener('mousedown', onDown);
  cv.addEventListener('touchstart', onDown, { passive: false });

  // test yordamchisi (foydalanuvchi interfeysiga ulanmagan): yechilgan holatga qo'yadi
  window.RK_TEST = { solve: () => { for (const c of cells) if (c.rotatable) c.dirs = c.base; recompute(); return solved + '/' + total; }, cells: () => cells };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
