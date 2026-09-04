// Bir Chiziq — Euler path boshqotirmasi. Barcha chiziqlarni qalamni uzmay, har birini bir marta chiz.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // Har figura: n = uchlar [x,y] (0..1), e = qirralar [i,j].  Barchasi Euler-path'li (tasdiqlangan).
  const LEVELS = [
    {"n":[[0.3,0.7],[0.7,0.7],[0.5,0.3]],"e":[[0,1],[1,2],[2,0]]},
    {"n":[[0.3,0.3],[0.7,0.3],[0.7,0.7],[0.3,0.7]],"e":[[0,1],[1,2],[2,3],[3,0]]},
    {"n":[[0.25,0.65],[0.75,0.65],[0.75,0.35],[0.25,0.35],[0.5,0.18]],"e":[[0,1],[1,2],[2,3],[3,0],[3,4],[4,2]]},
    {"n":[[0.2,0.3],[0.2,0.7],[0.5,0.5],[0.8,0.3],[0.8,0.7]],"e":[[0,2],[2,1],[1,0],[3,2],[2,4],[4,3]]},
    {"n":[[0.5,0.16],[0.86,0.42],[0.72,0.84],[0.28,0.84],[0.14,0.42]],"e":[[0,2],[2,4],[4,1],[1,3],[3,0]]},
    {"n":[[0.3,0.75],[0.7,0.75],[0.7,0.45],[0.3,0.45],[0.5,0.25]],"e":[[0,1],[1,2],[2,3],[3,0],[3,4],[4,2]]},
    {"n":[[0.3,0.3],[0.5,0.3],[0.7,0.3],[0.3,0.5],[0.5,0.5],[0.7,0.5]],"e":[[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5]]},
    {"n":[[0.5,0.18],[0.82,0.36],[0.82,0.7],[0.5,0.86],[0.18,0.7],[0.18,0.36]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,3]]},
    {"n":[[0.3,0.72],[0.7,0.72],[0.7,0.46],[0.3,0.46],[0.5,0.26]],"e":[[0,1],[1,2],[2,3],[3,0],[3,4],[4,2],[0,2]]},
    {"n":[[0.5,0.16],[0.74,0.26],[0.84,0.5],[0.74,0.74],[0.5,0.84],[0.26,0.74],[0.16,0.5],[0.26,0.26]],"e":[[0,3],[1,4],[2,5],[3,6],[4,7],[5,0],[6,1],[7,2]]},
    {"n":[[0.15,0.72],[0.5,0.72],[0.85,0.72],[0.325,0.34],[0.675,0.34]],"e":[[0,1],[1,2],[0,3],[3,1],[1,4],[4,2],[3,4]]},
    {"n":[[0.5,0.14],[0.85,0.4],[0.72,0.82],[0.28,0.82],[0.15,0.4]],"e":[[0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[2,4],[4,1],[1,3],[3,0]]},
    {"n":[[0.25,0.3],[0.5,0.3],[0.75,0.3],[0.25,0.7],[0.5,0.7],[0.75,0.7]],"e":[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5],[2,4]]},
    {"n":[[0.5,0.15],[0.83,0.33],[0.83,0.67],[0.5,0.85],[0.17,0.67],[0.17,0.33]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,2],[2,4],[4,0]]},
    {"n":[[0.2,0.7],[0.8,0.7],[0.8,0.4],[0.2,0.4],[0.5,0.2],[0.5,0.7]],"e":[[0,1],[1,2],[2,3],[3,0],[3,4],[4,2],[0,5],[5,2],[3,5],[5,1]]},
    {"n":[[0.25,0.35],[0.5,0.35],[0.75,0.35],[0.25,0.65],[0.5,0.65],[0.75,0.65]],"e":[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]]},
    {"n":[[0.5,0.16],[0.766,0.288],[0.831,0.576],[0.648,0.806],[0.352,0.806],[0.169,0.576],[0.234,0.288]],"e":[[0,3],[1,4],[2,5],[3,6],[4,0],[5,1],[6,2]]},
    {"n":[[0.5,0.16],[0.78,0.5],[0.5,0.84],[0.22,0.5],[0.5,0.5]],"e":[[0,1],[1,2],[2,3],[3,0],[0,4],[4,2]]},
    {"n":[[0.5,0.15],[0.83,0.33],[0.83,0.67],[0.5,0.85],[0.17,0.67],[0.17,0.33],[0.5,0.5]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[3,6]]},
    {"n":[[0.5,0.14],[0.781,0.276],[0.851,0.58],[0.656,0.824],[0.344,0.824],[0.149,0.58],[0.219,0.276]],"e":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[0,3],[1,4],[2,5],[3,6],[4,0],[5,1],[6,2]]},
  ];

  let levelIdx = 0, L = null;      // {nodes:[{x,y}], edges:[{a,b,drawn}], odd:[i..]}
  let current = -1, history = [];  // history: edge indices in draw order
  let nodePath = [];               // uchlar ketma-ketligi: [start, n1, n2, ...]
  let state = 'menu', winT = 0, flashT = 0, shakeT = 0;
  let pointer = null, drawing = false, idle = 0;
  const motes = [], burst = [];
  const TRAIL = [[34,211,238], [96,165,250], [167,139,250]];   // cyan → violet gradient
  function mix(a, b, t) { return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)]; }
  function trailCol(t) { t = Math.max(0, Math.min(1, t)); const s = t * (TRAIL.length - 1), i = Math.min(TRAIL.length - 2, Math.floor(s)); return mix(TRAIL[i], TRAIL[i+1], s - i); }

  function edgeKey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }

  function load(idx) {
    const raw = LEVELS[idx];
    const nodes = raw.n.map(p => ({ nx: p[0], ny: p[1], x: 0, y: 0 }));
    const edges = raw.e.map(e => ({ a: e[0], b: e[1], drawn: false }));
    const deg = new Array(nodes.length).fill(0);
    edges.forEach(e => { deg[e.a]++; deg[e.b]++; });
    const odd = [];
    for (let i = 0; i < nodes.length; i++) if (deg[i] % 2) odd.push(i);
    L = { nodes, edges, odd, deg };
    current = -1; history = []; nodePath = []; drawing = false; idle = 0; state = 'play';
    levelIdx = idx;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updateProg(); layout();
  }
  function updateProg() {
    const d = L ? L.edges.filter(e => e.drawn).length : 0, t = L ? L.edges.length : 0;
    document.getElementById('progPill').textContent = d + '/' + t;
  }
  function reset() { if (state === 'menu' || !L) return; load(levelIdx); }
  function undo() {
    if (!L || !history.length || state !== 'play') return;
    const ei = history.pop(); L.edges[ei].drawn = false;
    if (window.SFX) SFX.undo();
    nodePath.pop();
    current = nodePath.length ? nodePath[nodePath.length - 1] : -1;
    if (current < 0) nodePath = [];
    updateProg();
  }

  function nodeAt(mx, my) {
    if (!L) return -1; let best = -1, bd = 1e9;
    for (let i = 0; i < L.nodes.length; i++) { const n = L.nodes[i]; const d = Math.hypot(mx - n.x, my - n.y);
      if (d < RAD * 1.7 && d < bd) { bd = d; best = i; } }
    return best;
  }
  function edgeBetween(a, b) {
    for (let i = 0; i < L.edges.length; i++) { const e = L.edges[i];
      if ((e.a === a && e.b === b) || (e.a === b && e.b === a)) return i; }
    return -1;
  }
  function advance(to) {
    if (to < 0 || to === current) return;
    const ei = edgeBetween(current, to);
    if (ei < 0 || L.edges[ei].drawn) return;   // qo'shni emas yoki chizilgan
    L.edges[ei].drawn = true; history.push(ei);
    if (window.SFX) SFX.blip(history.length);
    if (!nodePath.length) nodePath.push(current);
    current = to; nodePath.push(to); idle = 0;
    updateProg();
    if (L.edges.every(e => e.drawn)) win();
    else if (window.Analytics) try { Analytics.track('edge', { game: 'bir-chiziq', level: levelIdx + 1 }); } catch (e) {}
  }

  function win() {
    flashT = 0.35; drawing = false;
    // g'alaba portlashi — barcha uchlardan uchqunlar
    for (const n of L.nodes) for (let k = 0; k < 5; k++) {
      const a = Math.random() * 7, sp = 60 + Math.random() * 160;
      const c = trailCol(Math.random());
      burst.push({ x: n.x, y: n.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.7 + Math.random() * 0.5, col: c });
    }
    if (levelIdx + 1 < LEVELS.length) { if (window.SFX) SFX.levelup(); state = 'between'; setTimeout(() => load(levelIdx + 1), 620); }
    else { state = 'win'; winT = 0; if (window.SFX) SFX.win();
      showPanel(true, "🎉 Zo'r!", "Barcha figurani bir chiziqda chizib chiqding — Euler ustasi bo'lding!", "↻ Qaytadan");
      if (window.Analytics) try { Analytics.track('win', { game: 'bir-chiziq' }); } catch (e) {} }
  }

  // ── layout / render ──
  let W = 0, H = 0, OX = 0, OY = 0, FS = 400, RAD = 13;
  function layout() {
    const side = Math.min(W - 40, H - 190);
    FS = Math.max(160, side);
    OX = (W - FS) / 2; OY = (H - FS) / 2 + 10;
    RAD = Math.max(9, FS * 0.032);
    if (L) for (const n of L.nodes) { n.x = OX + n.nx * FS; n.y = OY + n.ny * FS; }
  }
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  function render() {
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#080b16'); g.addColorStop(1, '#0d1020');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // markaziy nur + zarrachalar
    const rg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.62);
    rg.addColorStop(0, 'rgba(56,110,190,0.10)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    for (const m of motes) { ctx.globalAlpha = m.a; ctx.fillStyle = '#9fc0ff'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (!L) { ctx.restore(); return; }
    let sx = 0, sy = 0; if (shakeT > 0) { sx = (Math.random() - 0.5) * 7 * shakeT / 0.2; sy = (Math.random() - 0.5) * 7 * shakeT / 0.2; }
    ctx.translate(sx, sy);

    // chizilmagan qirralar
    ctx.lineCap = 'round';
    for (const e of L.edges) { if (e.drawn) continue; const A = L.nodes[e.a], B = L.nodes[e.b];
      ctx.strokeStyle = 'rgba(150,170,220,0.18)'; ctx.lineWidth = RAD * 0.42; ctx.setLineDash([2, RAD * 0.7]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); }
    ctx.setLineDash([]);
    // chizilgan qirralar — trail bo'yicha cyan→violet gradient, ikki qatlam glow
    const total = Math.max(1, L.edges.length);
    for (let hi = 0; hi < history.length; hi++) {
      const e = L.edges[history[hi]], A = L.nodes[e.a], B = L.nodes[e.b];
      const c0 = trailCol(hi / total), c1 = trailCol((hi + 1) / total);
      const lg = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
      lg.addColorStop(0, `rgb(${c0[0]},${c0[1]},${c0[2]})`); lg.addColorStop(1, `rgb(${c1[0]},${c1[1]},${c1[2]})`);
      ctx.strokeStyle = lg; ctx.lineWidth = RAD * 0.66;
      ctx.shadowColor = `rgba(${c0[0]},${c0[1]},${c0[2]},0.85)`; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // jonli chiziq (current -> pointer)
    if (drawing && current >= 0 && pointer) { const A = L.nodes[current];
      ctx.strokeStyle = 'rgba(167,139,250,0.75)'; ctx.lineWidth = RAD * 0.5; ctx.setLineDash([RAD * 0.5, RAD * 0.5]);
      ctx.lineDashOffset = -performance.now() / 30;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0; }

    // portlash uchqunlari
    for (const p of burst) { const a = 1 - p.life / p.max; ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = `rgb(${p.col[0]},${p.col[1]},${p.col[2]})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, RAD * 0.28 * a + 1, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;

    // uchlar
    const drawnAny = history.length > 0;
    for (let i = 0; i < L.nodes.length; i++) { const n = L.nodes[i];
      const isCur = i === current;
      // boshlash maslahati: hech narsa chizilmagan bo'lsa, toq uchlar jimirlaydi
      const hint = !drawnAny && L.odd.includes(i);
      if (hint) { const pl = 0.5 + 0.5 * Math.sin(performance.now() / 260);
        ctx.fillStyle = `rgba(52,211,153,${0.25 * pl})`; ctx.beginPath(); ctx.arc(n.x, n.y, RAD * (1.6 + 0.5 * pl), 0, 7); ctx.fill(); }
      if (isCur) { const pl = 0.6 + 0.4 * Math.sin(performance.now() / 200);
        ctx.fillStyle = `rgba(167,139,250,${0.35 * pl})`; ctx.beginPath(); ctx.arc(n.x, n.y, RAD * 1.9, 0, 7); ctx.fill(); }
      // gradientli sharcha + halqa
      const base = isCur ? [167,139,250] : (hint ? [52,211,153] : [207,224,255]);
      const rg2 = ctx.createRadialGradient(n.x - RAD*0.3, n.y - RAD*0.3, RAD*0.15, n.x, n.y, RAD);
      rg2.addColorStop(0, '#ffffff'); rg2.addColorStop(0.35, `rgb(${base[0]},${base[1]},${base[2]})`);
      rg2.addColorStop(1, `rgb(${Math.round(base[0]*0.6)},${Math.round(base[1]*0.6)},${Math.round(base[2]*0.6)})`);
      ctx.fillStyle = rg2; ctx.beginPath(); ctx.arc(n.x, n.y, RAD, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(${base[0]},${base[1]},${base[2]},0.9)`; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(10,14,28,0.85)'; ctx.beginPath(); ctx.arc(n.x, n.y, RAD * 0.4, 0, 7); ctx.fill();
      // qalam uchqunchasi joriy uchda
      if (isCur) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(n.x, n.y, RAD * 0.16, 0, 7); ctx.fill(); }
    }

    ctx.restore();
    if (flashT > 0) { ctx.fillStyle = `rgba(52,211,153,${Math.min(0.4, flashT)})`; ctx.fillRect(0, 0, W, H); }
    // "boshdan boshla" maslahati agar tiqilib qolsa
    if (state === 'play' && drawnAny && current >= 0 && !L.edges.every(e => e.drawn) && idle > 2.2 && !movesLeft()) {
      ctx.fillStyle = '#f472b6'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('Tiqilib qolding — ↶ orqaga yoki ↺ qaytadan', W / 2, H - 30);
    }
    ctx.restore();
  }
  function movesLeft() { if (current < 0) return true;
    for (const e of L.edges) if (!e.drawn && (e.a === current || e.b === current)) return true; return false; }

  let last = 0;
  function frame(t) { const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (flashT > 0) flashT -= dt; if (shakeT > 0) shakeT -= dt; if (state === 'play') idle += dt;
    for (const m of motes) { m.y -= m.v * dt; m.x += Math.sin(m.y / 50 + m.p) * 5 * dt; if (m.y < -8) { m.y = H + 8; m.x = Math.random() * W; } }
    for (let i = burst.length - 1; i >= 0; i--) { const p = burst[i]; p.life += dt; p.vy += 240 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; if (p.life >= p.max) burst.splice(i, 1); }
    render(); requestAnimationFrame(frame); }

  // ── pointer ──
  function pos(e) { const r = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top }; }
  function down(e) {
    if (state !== 'play') return; e.preventDefault();
    pointer = pos(e); const ni = nodeAt(pointer.x, pointer.y);
    if (ni < 0) return;
    if (current < 0) { current = ni; nodePath = [ni]; drawing = true; idle = 0; return; }   // boshlash
    if (ni === current) { drawing = true; return; }                        // davom
    // qo'shni bo'lsa — o't
    const ei = edgeBetween(current, ni);
    if (ei >= 0 && !L.edges[ei].drawn) { drawing = true; advance(ni); }
    else if (!history.length) { current = ni; nodePath = [ni]; drawing = true; }  // hali chizmagan — boshni ko'chir
  }
  function move(e) {
    if (state !== 'play' || !drawing) return; e.preventDefault();
    pointer = pos(e); const ni = nodeAt(pointer.x, pointer.y);
    if (ni >= 0 && ni !== current) { const ei = edgeBetween(current, ni); if (ei >= 0 && !L.edges[ei].drawn) advance(ni); }
  }
  function up(e) { drawing = false; pointer = null; }

  cv.addEventListener('mousedown', down); cv.addEventListener('mousemove', move); addEventListener('mouseup', up);
  cv.addEventListener('touchstart', down, { passive: false }); cv.addEventListener('touchmove', move, { passive: false });
  addEventListener('touchend', up); addEventListener('touchcancel', up);
  addEventListener('keydown', e => { if (e.code === 'KeyR') { reset(); } if (e.code === 'KeyZ') { undo(); } });
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('resetBtn').addEventListener('click', reset);

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('bir-chiziq'); } showPanel(false); if (state === 'win' || state === 'menu') load(0); });

  for (let i = 0; i < 30; i++) motes.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: 5 + Math.random() * 14, r: 0.7 + Math.random() * 1.5, a: 0.1 + Math.random() * 0.22, p: Math.random() * 7 });
  fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
