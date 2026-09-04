// Molekula — atomlarni bog'lar bilan ulab valentlikni qondir (kesishmasdan, yaxlit).
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [{"gw":4,"gh":4,"atoms":[{"r":2,"c":3,"v":1,"el":"H"},{"r":1,"c":2,"v":2,"el":"O"},{"r":3,"c":2,"v":4,"el":"C"},{"r":3,"c":3,"v":3,"el":"N"}],"sol":[{"a":1,"b":2,"o":2},{"a":0,"b":3,"o":1},{"a":2,"b":3,"o":2}]},{"gw":4,"gh":4,"atoms":[{"r":1,"c":0,"v":3,"el":"N"},{"r":0,"c":1,"v":2,"el":"O"},{"r":1,"c":1,"v":4,"el":"C"},{"r":3,"c":0,"v":4,"el":"C"},{"r":3,"c":2,"v":3,"el":"N"}],"sol":[{"a":1,"b":2,"o":2},{"a":3,"b":4,"o":3},{"a":0,"b":2,"o":2},{"a":0,"b":3,"o":1}]},{"gw":5,"gh":4,"atoms":[{"r":0,"c":0,"v":1,"el":"H"},{"r":0,"c":1,"v":3,"el":"N"},{"r":2,"c":1,"v":3,"el":"N"},{"r":1,"c":4,"v":2,"el":"O"},{"r":0,"c":3,"v":1,"el":"H"},{"r":2,"c":4,"v":4,"el":"C"}],"sol":[{"a":1,"b":2,"o":1},{"a":0,"b":1,"o":1},{"a":1,"b":4,"o":1},{"a":2,"b":5,"o":2},{"a":3,"b":5,"o":2}]},{"gw":5,"gh":5,"atoms":[{"r":0,"c":4,"v":1,"el":"H"},{"r":1,"c":3,"v":4,"el":"C"},{"r":1,"c":4,"v":4,"el":"C"},{"r":2,"c":3,"v":2,"el":"O"},{"r":4,"c":2,"v":1,"el":"H"},{"r":4,"c":3,"v":2,"el":"O"}],"sol":[{"a":1,"b":3,"o":1},{"a":0,"b":2,"o":1},{"a":3,"b":5,"o":1},{"a":4,"b":5,"o":1},{"a":1,"b":2,"o":3}]},{"gw":5,"gh":5,"atoms":[{"r":1,"c":3,"v":1,"el":"H"},{"r":1,"c":0,"v":2,"el":"O"},{"r":1,"c":1,"v":1,"el":"H"},{"r":2,"c":2,"v":1,"el":"H"},{"r":4,"c":0,"v":3,"el":"N"},{"r":4,"c":2,"v":4,"el":"C"},{"r":4,"c":3,"v":2,"el":"O"}],"sol":[{"a":4,"b":5,"o":2},{"a":1,"b":2,"o":1},{"a":0,"b":6,"o":1},{"a":1,"b":4,"o":1},{"a":3,"b":5,"o":1},{"a":5,"b":6,"o":1}]},{"gw":5,"gh":5,"atoms":[{"r":0,"c":0,"v":3,"el":"N"},{"r":3,"c":0,"v":4,"el":"C"},{"r":1,"c":1,"v":1,"el":"H"},{"r":0,"c":3,"v":3,"el":"N"},{"r":1,"c":3,"v":4,"el":"C"},{"r":2,"c":3,"v":2,"el":"O"},{"r":4,"c":0,"v":2,"el":"O"},{"r":2,"c":4,"v":1,"el":"H"}],"sol":[{"a":3,"b":4,"o":2},{"a":4,"b":5,"o":1},{"a":5,"b":7,"o":1},{"a":0,"b":1,"o":2},{"a":0,"b":3,"o":1},{"a":1,"b":6,"o":2},{"a":2,"b":4,"o":1}]},{"gw":6,"gh":5,"atoms":[{"r":0,"c":0,"v":4,"el":"C"},{"r":4,"c":0,"v":4,"el":"C"},{"r":3,"c":2,"v":3,"el":"N"},{"r":0,"c":1,"v":1,"el":"H"},{"r":3,"c":3,"v":3,"el":"N"},{"r":3,"c":5,"v":1,"el":"H"},{"r":4,"c":2,"v":4,"el":"C"},{"r":4,"c":3,"v":2,"el":"O"}],"sol":[{"a":6,"b":7,"o":2},{"a":4,"b":5,"o":1},{"a":0,"b":3,"o":1},{"a":2,"b":4,"o":2},{"a":0,"b":1,"o":3},{"a":2,"b":6,"o":1},{"a":1,"b":6,"o":1}]},{"gw":6,"gh":6,"atoms":[{"r":1,"c":0,"v":4,"el":"C"},{"r":1,"c":3,"v":4,"el":"C"},{"r":1,"c":5,"v":2,"el":"O"},{"r":3,"c":4,"v":3,"el":"N"},{"r":2,"c":0,"v":3,"el":"N"},{"r":3,"c":5,"v":4,"el":"C"},{"r":3,"c":1,"v":2,"el":"O"},{"r":2,"c":3,"v":4,"el":"C"},{"r":3,"c":3,"v":4,"el":"C"}],"sol":[{"a":3,"b":5,"o":3},{"a":0,"b":4,"o":2},{"a":7,"b":8,"o":2},{"a":6,"b":8,"o":2},{"a":4,"b":7,"o":1},{"a":2,"b":5,"o":1},{"a":1,"b":2,"o":1},{"a":1,"b":7,"o":1},{"a":0,"b":1,"o":2}]},{"gw":6,"gh":6,"atoms":[{"r":0,"c":1,"v":4,"el":"C"},{"r":2,"c":0,"v":2,"el":"O"},{"r":0,"c":4,"v":4,"el":"C"},{"r":5,"c":1,"v":2,"el":"O"},{"r":0,"c":5,"v":2,"el":"O"},{"r":5,"c":5,"v":3,"el":"N"},{"r":2,"c":4,"v":3,"el":"N"},{"r":5,"c":0,"v":1,"el":"H"},{"r":4,"c":4,"v":2,"el":"O"},{"r":2,"c":1,"v":3,"el":"N"}],"sol":[{"a":3,"b":5,"o":2},{"a":6,"b":8,"o":2},{"a":0,"b":2,"o":2},{"a":1,"b":9,"o":1},{"a":1,"b":7,"o":1},{"a":0,"b":9,"o":2},{"a":4,"b":5,"o":1},{"a":2,"b":4,"o":1},{"a":2,"b":6,"o":1}]},{"gw":6,"gh":6,"atoms":[{"r":2,"c":0,"v":3,"el":"N"},{"r":2,"c":2,"v":4,"el":"C"},{"r":3,"c":0,"v":4,"el":"C"},{"r":1,"c":0,"v":2,"el":"O"},{"r":2,"c":4,"v":4,"el":"C"},{"r":1,"c":1,"v":3,"el":"N"},{"r":1,"c":5,"v":2,"el":"O"},{"r":3,"c":2,"v":3,"el":"N"},{"r":5,"c":4,"v":2,"el":"O"},{"r":2,"c":5,"v":2,"el":"O"},{"r":4,"c":0,"v":1,"el":"H"}],"sol":[{"a":0,"b":2,"o":2},{"a":4,"b":9,"o":1},{"a":2,"b":7,"o":1},{"a":0,"b":1,"o":1},{"a":2,"b":10,"o":1},{"a":1,"b":4,"o":1},{"a":6,"b":9,"o":1},{"a":3,"b":5,"o":2},{"a":5,"b":6,"o":1},{"a":4,"b":8,"o":2},{"a":1,"b":7,"o":2}]}];

  const EL = { H: { c: '#e6edff', t: '#1a2440' }, O: { c: '#ff5545', t: '#fff' }, N: { c: '#4f8bff', t: '#fff' }, C: { c: '#8a93a6', t: '#0b1020' } };

  let levelIdx = 0, L, atoms = [], slots = [], crossPairs = [], sums = [], state = 'menu', flashT = 0;
  let gw = 4, gh = 4;

  function collinearSlots() {
    const out = [];
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
      const a = atoms[i], b = atoms[j];
      if (a.r === b.r && a.c !== b.c) {
        const lo = Math.min(a.c, b.c), hi = Math.max(a.c, b.c);
        if (!atoms.some((k, ki) => ki !== i && ki !== j && k.r === a.r && k.c > lo && k.c < hi))
          out.push({ a: i, b: j, o: 0, h: true, spin: 0 });
      } else if (a.c === b.c && a.r !== b.r) {
        const lo = Math.min(a.r, b.r), hi = Math.max(a.r, b.r);
        if (!atoms.some((k, ki) => ki !== i && ki !== j && k.c === a.c && k.r > lo && k.r < hi))
          out.push({ a: i, b: j, o: 0, h: false, spin: 0 });
      }
    }
    return out;
  }
  function segCross(s1, s2) {
    if (s1.h === s2.h) return false;
    const H = s1.h ? s1 : s2, V = s1.h ? s2 : s1;
    const ha = atoms[H.a], hb = atoms[H.b], va = atoms[V.a], vb = atoms[V.b];
    const y = ha.r, xlo = Math.min(ha.c, hb.c), xhi = Math.max(ha.c, hb.c);
    const x = va.c, ylo = Math.min(va.r, vb.r), yhi = Math.max(va.r, vb.r);
    return xlo < x && x < xhi && ylo < y && y < yhi;
  }

  function load(idx) {
    levelIdx = idx; L = LEVELS[idx]; gw = L.gw; gh = L.gh;
    atoms = L.atoms.map(a => ({ r: a.r, c: a.c, v: a.v, el: a.el }));
    slots = collinearSlots();
    crossPairs = [];
    for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++)
      if (segCross(slots[i], slots[j])) crossPairs.push([i, j]);
    state = 'play'; flashT = 0;
    recompute();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    fit();
  }

  function recompute() {
    sums = atoms.map(() => 0);
    for (const s of slots) { sums[s.a] += s.o; sums[s.b] += s.o; }
    let sat = 0; for (let i = 0; i < atoms.length; i++) if (sums[i] === atoms[i].v) sat++;
    document.getElementById('fillPill').textContent = '⚛ ' + sat + '/' + atoms.length;
    if (state === 'play' && sat === atoms.length && connected()) win();
  }
  function connected() {
    const par = atoms.map((_, i) => i);
    const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    for (const s of slots) if (s.o > 0) par[find(s.a)] = find(s.b);
    const root = find(0); return atoms.every((_, i) => find(i) === root);
  }
  function crossesActive(i, v) {
    if (v === 0) return false;
    for (const [x, y] of crossPairs) {
      if (x === i && slots[y].o > 0) return true;
      if (y === i && slots[x].o > 0) return true;
    }
    return false;
  }
  function feasible(i, v) {
    const s = slots[i];
    if (sums[s.a] - s.o + v > atoms[s.a].v) return false;
    if (sums[s.b] - s.o + v > atoms[s.b].v) return false;
    if (crossesActive(i, v)) return false;
    return true;
  }
  function cycle(i) {
    if (state !== 'play') return;
    const s = slots[i];
    for (let step = 1; step <= 3; step++) {
      const v = (s.o + step) % 4;
      if (v === s.o) break;
      if (feasible(i, v)) { s.o = v; s.spin = 1; if (window.SFX) SFX.tone(300 + v * 90, 0.05, { type: 'triangle', vol: 0.06, to: 420 }); recompute(); return; }
    }
    if (s.o !== 0) { s.o = 0; s.spin = 1; if (window.SFX) SFX.tone(200, 0.05, { type: 'sine', vol: 0.05 }); recompute(); }
  }
  function reset() { load(levelIdx); }

  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    for (const a of atoms) { const p = ac(a); if (window.FX) FX.burst(p.x, p.y, EL[a.el].c, 14); }
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1000);
    else setTimeout(() => showPanel(true, '🎉 Kimyogar!', "Barcha molekulani to'g'ri yig'ding — valentlik ustasi bo'lding!", '↻ Qaytadan'), 1000);
  }

  // ── layout ──
  let CELL = 60, ox = 0, oy = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 80, availH = innerHeight - top - 24, availW = innerWidth - 40;
    CELL = Math.min(availW / Math.max(1, gw - 1 + 1.4), availH / Math.max(1, gh - 1 + 1.4));
    CELL = Math.max(46, Math.min(120, CELL));
    const w = (gw - 1) * CELL, h = (gh - 1) * CELL;
    ox = (innerWidth - w) / 2; oy = top + (availH - h) / 2;
  }
  function ac(a) { return { x: ox + a.c * CELL, y: oy + a.r * CELL }; }

  function render(t) {
    const bg = ctx.createRadialGradient(innerWidth / 2, innerHeight / 2, 40, innerWidth / 2, innerHeight / 2, Math.max(innerWidth, innerHeight) * 0.7);
    bg.addColorStop(0, '#0d1226'); bg.addColorStop(1, '#080a15');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !L) return;

    // bo'sh slotlar (hint)
    for (const s of slots) if (s.o === 0) {
      const a = ac(atoms[s.a]), b = ac(atoms[s.b]);
      ctx.strokeStyle = 'rgba(150,175,235,.09)'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    }
    // aktiv bog'lar
    for (const s of slots) if (s.o > 0) drawBond(s);
    // atomlar
    for (let i = 0; i < atoms.length; i++) drawAtom(i, t);

    if (window.FX) FX.render(ctx);
    if (flashT > 0) { ctx.fillStyle = `rgba(140,220,255,${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); flashT -= 0.016; }
  }
  function drawBond(s) {
    const a = ac(atoms[s.a]), b = ac(atoms[s.b]);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len; // perpendikulyar birlik
    const gap = 5; const offs = s.o === 1 ? [0] : s.o === 2 ? [-gap, gap] : [-gap * 1.8, 0, gap * 1.8];
    ctx.save(); ctx.shadowColor = '#bcd0ff'; ctx.shadowBlur = 8; ctx.strokeStyle = '#cdddff'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    for (const o of offs) { ctx.beginPath(); ctx.moveTo(a.x + px * o, a.y + py * o); ctx.lineTo(b.x + px * o, b.y + py * o); ctx.stroke(); }
    ctx.restore();
  }
  function drawAtom(i, t) {
    const a = atoms[i], p = ac(a), r = CELL * 0.28; const info = EL[a.el];
    const sat = sums[i] === a.v, over = sums[i] > a.v;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.shadowColor = info.c; ctx.shadowBlur = 16;
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, info.c); g.addColorStop(1, info.c);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    // holat halqasi
    ctx.shadowBlur = sat ? 16 : 0;
    ctx.strokeStyle = over ? '#ff5a72' : (sat ? '#8dffb0' : 'rgba(255,255,255,.35)');
    ctx.lineWidth = sat || over ? 3 : 1.5; ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, 7); ctx.stroke();
    ctx.restore();
    // element belgisi
    ctx.fillStyle = info.t; ctx.font = `bold ${Math.floor(r * 0.95)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(a.el, p.x, p.y + 1);
    // kerakli valentlik (kichik)
    ctx.fillStyle = sat ? '#8dffb0' : '#cfe0ff'; ctx.font = `bold ${Math.floor(r * 0.5)}px system-ui`;
    ctx.fillText((a.v - sums[i] > 0 ? '+' + (a.v - sums[i]) : (over ? '!' : '✓')), p.x, p.y + r + 9);
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
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('molekula'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  function pos(e) { const rect = cv.getBoundingClientRect(); const tt = e.touches ? e.touches[0] : e; return [tt.clientX - rect.left, tt.clientY - rect.top]; }
  function distSeg(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    let tt = ((px - a.x) * dx + (py - a.y) * dy) / L2; tt = Math.max(0, Math.min(1, tt));
    const x = a.x + tt * dx, y = a.y + tt * dy; return Math.hypot(px - x, py - y);
  }
  function onDown(e) {
    e.preventDefault(); if (state !== 'play') return;
    const [x, y] = pos(e);
    let best = -1, bd = CELL * 0.32;
    for (let i = 0; i < slots.length; i++) {
      const a = ac(atoms[slots[i].a]), b = ac(atoms[slots[i].b]);
      const d = distSeg(x, y, a, b);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) cycle(best);
  }
  cv.addEventListener('mousedown', onDown); cv.addEventListener('touchstart', onDown, { passive: false });

  window.ML_TEST = { solve: () => {
    for (const s of slots) s.o = 0;
    for (const b of L.sol) { const si = slots.findIndex(s => (s.a === b.a && s.b === b.b) || (s.a === b.b && s.b === b.a)); if (si >= 0) slots[si].o = b.o; }
    recompute(); let sat = 0; for (let i = 0; i < atoms.length; i++) if (sums[i] === atoms[i].v) sat++;
    return sat + '/' + atoms.length + (connected() ? ' conn' : ' DISC');
  } };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
