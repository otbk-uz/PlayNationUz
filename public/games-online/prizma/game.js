// Prizma — oq nurni RGB ga ajratib ko'zgular bilan sensorlarга yo'naltir.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [{"R":5,"C":6,"source":[4,1,-1,0],"prism":[3,1],"mirrors":[[1,1],[2,3]],"sensors":[[3,0,"R"],[1,0,"G"],[3,3,"B"]],"sol":["\\","/"]},{"R":6,"C":6,"source":[2,5,0,-1],"prism":[2,4],"mirrors":[[3,1],[2,3]],"sensors":[[5,4,"R"],[5,3,"G"],[1,4,"B"]],"sol":["/","/"]},{"R":6,"C":6,"source":[2,5,0,-1],"prism":[2,4],"mirrors":[[3,0],[2,1]],"sensors":[[3,4,"R"],[0,1,"G"],[0,4,"B"]],"sol":["/","\\"]},{"R":6,"C":6,"source":[5,3,-1,0],"prism":[3,3],"mirrors":[[5,1],[3,5],[2,0]],"sensors":[[3,0,"R"],[0,3,"G"],[1,5,"B"]],"sol":["/","/","/"]},{"R":6,"C":7,"source":[0,5,1,0],"prism":[2,5],"mirrors":[[4,5],[3,4],[1,1]],"sensors":[[2,6,"R"],[4,3,"G"],[2,0,"B"]],"sol":["/","/","/"]},{"R":7,"C":7,"source":[5,0,0,1],"prism":[5,1],"mirrors":[[5,6],[3,5],[0,6]],"sensors":[[3,1,"R"],[0,0,"G"],[6,1,"B"]],"sol":["/","/","\\"]},{"R":7,"C":7,"source":[4,6,0,-1],"prism":[4,5],"mirrors":[[1,5],[2,2],[1,3]],"sensors":[[6,5,"R"],[4,1,"G"],[1,4,"B"]],"sol":["\\","/","/"]},{"R":7,"C":8,"source":[2,7,0,-1],"prism":[2,6],"mirrors":[[5,1],[6,7],[2,2],[5,5]],"sensors":[[3,6,"R"],[4,2,"G"],[0,6,"B"]],"sol":["/","/","/","/"]},{"R":8,"C":8,"source":[3,0,0,1],"prism":[3,3],"mirrors":[[4,1],[0,5],[2,3],[2,2]],"sensors":[[2,5,"R"],[3,5,"G"],[5,3,"B"]],"sol":["/","/","/","/"]},{"R":8,"C":8,"source":[0,6,1,0],"prism":[1,6],"mirrors":[[1,2],[2,1],[1,7],[4,6],[2,7]],"sensors":[[7,1,"R"],[4,7,"G"],[3,2,"B"]],"sol":["/","/","\\","\\","/"]}];

  const COL = { R: '#ff5545', G: '#37e07d', B: '#4f8bff', W: '#eaf4ff' };
  const N = [-1, 0], E = [0, 1], S = [1, 0], W = [0, -1];
  const dstr = d => d[0] + ',' + d[1];
  const LEFT = { '-1,0': W, '0,-1': S, '1,0': E, '0,1': N };
  const RIGHT = { '-1,0': E, '0,1': S, '1,0': W, '0,-1': N };
  function refl(d, m) {
    const k = dstr(d);
    if (m === '/') return ({ '0,1': N, '-1,0': E, '0,-1': S, '1,0': W })[k];
    return ({ '0,1': S, '1,0': E, '0,-1': N, '-1,0': W })[k];
  }

  let levelIdx = 0, L, R = 5, C = 6, mirrors = [], mstate = [], sensors = [];
  let segs = [], lit = {}, state = 'menu', flashT = 0;
  const key = (r, c) => r + ',' + c;

  function load(idx) {
    levelIdx = idx; L = LEVELS[idx]; R = L.R; C = L.C;
    mirrors = L.mirrors.map(m => m.slice());
    sensors = L.sensors.map(s => ({ r: s[0], c: s[1], col: s[2], spin: 0 }));
    // deterministik scramble (yechim bo'lmasin)
    let seed = 0x51ed ^ (idx * 2654435761);
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    mstate = mirrors.map(() => (rnd() < 0.5 ? '/' : '\\'));
    // boshlanish YECHILGAN bo'lmasin (bir nechta yechim bo'lishi mumkin)
    for (let att = 0; att < 60 && litCount(mstate) === sensors.length && mirrors.length; att++) {
      const k = Math.floor(rnd() * mirrors.length); mstate[k] = mstate[k] === '/' ? '\\' : '/';
    }
    state = 'play'; flashT = 0;
    simulate();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    fit();
  }

  function trace(ms) {
    const mir = new Map(); mirrors.forEach((m, i) => mir.set(key(m[0], m[1]), ms[i]));
    const sset = new Map(); sensors.forEach(s => sset.set(key(s.r, s.c), s.col));
    const prism = key(L.prism[0], L.prism[1]);
    const outSegs = []; const litSets = {}; sensors.forEach(s => litSets[key(s.r, s.c)] = new Set());
    const seen = new Set();
    const stack = [[L.source[0], L.source[1], [L.source[2], L.source[3]], 'W']];
    let steps = 0;
    while (stack.length && steps < 20000) {
      steps++;
      const [r, c, d, col] = stack.pop();
      const nr = r + d[0], nc = c + d[1];
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) { outSegs.push([r, c, r + d[0] * 0.5, c + d[1] * 0.5, col]); continue; }
      const sk = nr + ',' + nc + ',' + dstr(d) + ',' + col;
      if (seen.has(sk)) continue; seen.add(sk);
      outSegs.push([r, c, nr, nc, col]);
      const ck = key(nr, nc);
      if (ck === prism) {
        if (col === 'W') { stack.push([nr, nc, d, 'G']); stack.push([nr, nc, LEFT[dstr(d)], 'R']); stack.push([nr, nc, RIGHT[dstr(d)], 'B']); }
        else stack.push([nr, nc, d, col]);
        continue;
      }
      if (mir.has(ck)) { stack.push([nr, nc, refl(d, mir.get(ck)), col]); continue; }
      if (sset.has(ck)) { litSets[ck].add(col); continue; }
      stack.push([nr, nc, d, col]);
    }
    let n = 0; for (const s of sensors) if (litSets[key(s.r, s.c)].has(s.col)) n++;
    return { segs: outSegs, lit: litSets, count: n };
  }
  function litCount(ms) { return trace(ms).count; }
  function simulate() {
    const r = trace(mstate); segs = r.segs; lit = r.lit;
    document.getElementById('litPill').textContent = '◎ ' + r.count + '/' + sensors.length;
    if (state === 'play' && r.count === sensors.length) win();
  }

  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    for (const s of sensors) { const p = cc(s.r, s.c); if (window.FX) FX.burst(p.x, p.y, COL[s.col], 20); }
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1000);
    else setTimeout(() => showPanel(true, '🎉 Optik usta!', "Barcha bosqichda nurni ranglarga ajratib to'g'ri yo'naltirding — yorug'lik ustasi!", '↻ Qaytadan'), 1000);
  }
  function toggleMirror(i) {
    if (state !== 'play') return;
    mstate[i] = mstate[i] === '/' ? '\\' : '/';
    mirrors[i].spin = 1;
    if (window.SFX) SFX.tone(520, 0.05, { type: 'square', vol: 0.06, to: 700 });
    simulate();
  }
  function reset() { load(levelIdx); }

  // ── layout ──
  let GC = 48, gx = 0, gy = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 80, availH = innerHeight - top - 24, availW = innerWidth - 24;
    GC = Math.min(availW / C, availH / R); GC = Math.max(34, Math.min(88, GC));
    gx = (innerWidth - C * GC) / 2; gy = top + (availH - R * GC) / 2;
  }
  function cc(r, c) { return { x: gx + c * GC + GC / 2, y: gy + r * GC + GC / 2 }; }

  // ── render ──
  function render(t) {
    const bg = ctx.createRadialGradient(innerWidth / 2, innerHeight / 2, 40, innerWidth / 2, innerHeight / 2, Math.max(innerWidth, innerHeight) * 0.7);
    bg.addColorStop(0, '#0b1020'); bg.addColorStop(1, '#06080f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !L) return;
    // panjara
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const x = gx + c * GC, y = gy + r * GC;
      ctx.strokeStyle = 'rgba(140,170,255,.05)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, GC - 1, GC - 1);
    }
    // nurlar (glow)
    ctx.lineCap = 'round';
    for (const pass of [0, 1]) {
      for (const s of segs) {
        const a = cc(s[0], s[1]), b = cc(s[2], s[3]); const col = COL[s[4]];
        ctx.save();
        if (pass === 0) { ctx.globalAlpha = 0.5; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.strokeStyle = col; ctx.lineWidth = 7; }
        else { ctx.globalAlpha = 1; ctx.strokeStyle = s[4] === 'W' ? '#ffffff' : col; ctx.lineWidth = 2.4; }
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
      }
    }
    // prizma
    drawPrism(t);
    // manba
    drawSource();
    // ko'zgular
    for (let i = 0; i < mirrors.length; i++) drawMirror(i, t);
    // sensorlar
    for (const s of sensors) drawSensor(s, t);
    if (window.FX) FX.render(ctx);
    if (flashT > 0) { ctx.fillStyle = `rgba(180,220,255,${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); flashT -= 0.016; }
  }
  function drawSource() {
    const p = cc(L.source[0], L.source[1]); const r = GC * 0.28;
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 22;
    const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#9fc4ff');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); ctx.restore();
  }
  function drawPrism(t) {
    const p = cc(L.prism[0], L.prism[1]); const s = GC * 0.34;
    ctx.save(); ctx.translate(p.x, p.y); ctx.shadowColor = '#cfe0ff'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.92, s * 0.7); ctx.lineTo(-s * 0.92, s * 0.7); ctx.closePath();
    const g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, 'rgba(255,90,90,.5)'); g.addColorStop(0.5, 'rgba(120,230,150,.5)'); g.addColorStop(1, 'rgba(90,140,255,.5)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
  }
  function drawMirror(i, t) {
    const m = mirrors[i], p = cc(m[0], m[1]); const s = GC * 0.34;
    const ang = mstate[i] === '/' ? -Math.PI / 4 : Math.PI / 4;
    if (m.spin) { m.spin -= 0.12; if (m.spin < 0) m.spin = 0; }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang + (m.spin || 0) * 0.5);
    // yaltiroq metall tayoq
    ctx.shadowColor = '#bfe8ff'; ctx.shadowBlur = 10;
    const g = ctx.createLinearGradient(0, -s, 0, s); g.addColorStop(0, '#eaf6ff'); g.addColorStop(0.5, '#7fb0d8'); g.addColorStop(1, '#cfeaff');
    ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
    ctx.restore();
    // tap hint halqasi
    ctx.strokeStyle = 'rgba(140,180,255,.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, GC * 0.42, 0, 7); ctx.stroke();
  }
  function drawSensor(s, t) {
    const p = cc(s.r, s.c); const r = GC * 0.3; const on = lit[key(s.r, s.c)].has(s.col);
    ctx.save(); ctx.translate(p.x, p.y);
    if (on) { ctx.shadowColor = COL[s.col]; ctx.shadowBlur = 22;
      ctx.fillStyle = COL[s.col]; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.lineWidth = 3; ctx.strokeStyle = COL[s.col]; ctx.globalAlpha = on ? 1 : 0.55;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, 7); ctx.stroke();
    if (on) { ctx.globalAlpha = 1; ctx.fillStyle = '#06131a'; ctx.font = `bold ${Math.floor(GC * 0.26)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', 0, 1); }
    ctx.restore();
  }

  function frame(t) { render(t); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); }
    else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('prizma'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  function pos(e) { const rect = cv.getBoundingClientRect(); const tt = e.touches ? e.touches[0] : e; return [tt.clientX - rect.left, tt.clientY - rect.top]; }
  function onDown(e) {
    e.preventDefault(); if (state !== 'play') return;
    const [x, y] = pos(e);
    for (let i = 0; i < mirrors.length; i++) { const p = cc(mirrors[i][0], mirrors[i][1]); if ((p.x - x) ** 2 + (p.y - y) ** 2 < (GC * 0.5) ** 2) { toggleMirror(i); return; } }
  }
  cv.addEventListener('mousedown', onDown); cv.addEventListener('touchstart', onDown, { passive: false });

  window.PZ_TEST = { solve: () => { mstate = L.sol.slice(); simulate(); let n = 0; for (const s of sensors) if (lit[key(s.r, s.c)].has(s.col)) n++; return n + '/' + sensors.length; } };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
