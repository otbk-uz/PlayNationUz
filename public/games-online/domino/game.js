// Domino Reaksiya — dominolarni joylab qulash zanjirini nishonlarga yetkaz.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [{"nodes":[{"x":207,"y":410,"role":"start"},{"x":327,"y":400,"role":"fixed"},{"x":437,"y":353,"role":"fixed"},{"x":664,"y":276,"role":"goal"}],"start":[207,410],"goals":[[664,276]],"N":1,"sol":[[548,307]]},{"nodes":[{"x":167,"y":331,"role":"start"},{"x":268,"y":266,"role":"fixed"},{"x":382,"y":227,"role":"fixed"},{"x":615,"y":273,"role":"goal"}],"start":[167,331],"goals":[[615,273]],"N":1,"sol":[[502,233]]},{"nodes":[{"x":223,"y":321,"role":"start"},{"x":343,"y":316,"role":"fixed"},{"x":452,"y":367,"role":"fixed"},{"x":532,"y":457,"role":"goal"},{"x":600,"y":544,"role":"fixed"},{"x":755,"y":363,"role":"goal"}],"start":[223,321],"goals":[[532,457],[755,363]],"N":1,"sol":[[686,461]]},{"nodes":[{"x":202,"y":366,"role":"start"},{"x":302,"y":300,"role":"fixed"},{"x":386,"y":215,"role":"goal"},{"x":429,"y":451,"role":"fixed"},{"x":640,"y":338,"role":"fixed"},{"x":724,"y":253,"role":"goal"}],"start":[202,366],"goals":[[386,215],[724,253]],"N":2,"sol":[[413,332],[539,403]]},{"nodes":[{"x":161,"y":325,"role":"start"},{"x":259,"y":394,"role":"fixed"},{"x":369,"y":443,"role":"fixed"},{"x":485,"y":475,"role":"fixed"},{"x":591,"y":531,"role":"goal"},{"x":829,"y":510,"role":"fixed"},{"x":854,"y":278,"role":"goal"}],"start":[161,325],"goals":[[591,531],[854,278]],"N":2,"sol":[[709,507],[850,392]]},{"nodes":[{"x":159,"y":339,"role":"start"},{"x":263,"y":398,"role":"fixed"},{"x":476,"y":501,"role":"goal"},{"x":595,"y":484,"role":"goal"}],"start":[159,339],"goals":[[595,484],[476,501]],"N":1,"sol":[[379,430]]},{"nodes":[{"x":182,"y":341,"role":"start"},{"x":282,"y":407,"role":"fixed"},{"x":504,"y":445,"role":"goal"},{"x":738,"y":445,"role":"fixed"},{"x":855,"y":471,"role":"fixed"},{"x":834,"y":353,"role":"goal"},{"x":435,"y":338,"role":"fixed"},{"x":480,"y":227,"role":"fixed"},{"x":362,"y":247,"role":"goal"}],"start":[182,341],"goals":[[504,445],[834,353],[362,247]],"N":3,"sol":[[394,451],[475,539],[621,473]]},{"nodes":[{"x":200,"y":324,"role":"start"},{"x":317,"y":351,"role":"fixed"},{"x":615,"y":547,"role":"goal"},{"x":233,"y":439,"role":"fixed"},{"x":246,"y":542,"role":"fixed"},{"x":365,"y":543,"role":"goal"},{"x":695,"y":365,"role":"fixed"},{"x":815,"y":375,"role":"goal"}],"start":[200,324],"goals":[[615,547],[365,543],[815,375]],"N":3,"sol":[[585,412],[417,417],[504,500]]}];

  const AW = 1000, AH = 700, REACH = 155, STEP = 0.14, MAXA = 1.45;
  const COL = { start: '#34d399', fixed: '#38bdf8', goal: '#fbbf24', player: '#a78bfa' };

  let levelIdx = 0, doms = [], remaining = 0, ngoal = 0, state = 'menu';
  let tRun = 0, maxTopple = 0, flashT = 0, flashCol = '52,211,153';

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    doms = L.nodes.map(n => ({ x: n.x, y: n.y, role: n.role, fallen: false, ang: 0, dir: 0.6, tTopple: Infinity, wave: 0 }));
    remaining = L.N; ngoal = doms.filter(d => d.role === 'goal').length;
    state = 'build'; tRun = 0; flashT = 0;
    updHud(); fit();
  }
  function updHud() {
    document.getElementById('levelPill').textContent = 'Bosqich ' + (levelIdx + 1);
    document.getElementById('leftPill').textContent = '🁢 ' + remaining;
    const gf = doms.filter(d => d.role === 'goal' && d.fallen).length;
    document.getElementById('goalPill').textContent = '◎ ' + gf + '/' + ngoal;
    const gb = document.getElementById('goBtn'); if (gb) gb.disabled = state !== 'build';
  }
  function reset() { load(levelIdx); }

  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

  function go() {
    if (state !== 'build') return;
    // BFS to'lqin: start(lar)dan tarqaladi
    for (const d of doms) { d.tTopple = Infinity; d.parent = null; }
    const starts = doms.filter(d => d.role === 'start');
    const q = [];
    for (const s of starts) { s.tTopple = 0; q.push(s); }
    let qi = 0;
    while (qi < q.length) {
      const u = q[qi++];
      for (const v of doms) {
        if (v.tTopple === Infinity && v !== u && dist2(u, v) <= REACH * REACH) {
          v.tTopple = u.tTopple + STEP; v.parent = u; q.push(v);
        }
      }
    }
    maxTopple = 0; for (const d of doms) if (d.tTopple < Infinity && d.tTopple > maxTopple) maxTopple = d.tTopple;
    state = 'run'; tRun = 0; updHud();
    if (window.SFX) SFX.tone(200, 0.08, { type: 'square', vol: 0.1, to: 320 });
  }

  function topple(d) {
    d.fallen = true; d.wave = 1;
    if (d.parent) d.dir = Math.atan2(d.y - d.parent.y, d.x - d.parent.x);
    const p = toScreen(d.x, d.y);
    if (window.FX) FX.burst(p.x, p.y, d.role === 'goal' ? COL.goal : (COL[d.role] || COL.player), d.role === 'goal' ? 18 : 9);
    if (window.SFX) SFX.tone(d.role === 'goal' ? 660 : 300 + Math.random() * 80, 0.05, { type: 'triangle', vol: d.role === 'goal' ? 0.11 : 0.06, to: 180 });
    updHud();
  }

  function update(dt) {
    if (flashT > 0) flashT -= dt;
    for (const d of doms) {
      if (d.fallen) { d.ang += (MAXA - d.ang) * Math.min(1, dt * 9); if (d.wave > 0) d.wave -= dt * 2; }
    }
    if (state === 'run') {
      tRun += dt;
      for (const d of doms) if (!d.fallen && tRun >= d.tTopple) topple(d);
      const gf = doms.filter(d => d.role === 'goal' && d.fallen).length;
      if (gf === ngoal) { win(); }
      else if (tRun > maxTopple + 0.9) fail();
    }
  }
  function win() {
    if (state === 'won') return;
    state = 'won'; flashT = 0.5; flashCol = '52,211,153';
    if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1150);
    else setTimeout(() => showPanel(true, "🎉 Zanjir ustasi!", "Barcha bosqichda qulash to'lqinini nishonlarga yetkazding — reaksiya ustasi!", "↻ Qaytadan"), 1150);
  }
  function fail() {
    state = 'build'; flashT = 0.35; flashCol = '251,113,133';
    for (const d of doms) { d.fallen = false; d.ang = 0; d.wave = 0; }
    if (window.SFX) SFX.hit();
    updHud();
  }

  // ── layout ──
  let s = 1, ox = 0, oy = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 78, bottom = 96, availH = innerHeight - top - bottom, availW = innerWidth - 20;
    s = Math.min(availW / AW, availH / AH);
    ox = (innerWidth - AW * s) / 2; oy = top + (availH - AH * s) / 2;
  }
  function toScreen(x, y) { return { x: ox + x * s, y: oy + y * s }; }
  function toLogical(sx, sy) { return { x: (sx - ox) / s, y: (sy - oy) / s }; }

  // ── render ──
  function render(time) {
    const bg = ctx.createRadialGradient(innerWidth / 2, oy + AH * s / 2, 60, innerWidth / 2, innerHeight / 2, Math.max(innerWidth, innerHeight) * 0.7);
    bg.addColorStop(0, '#141020'); bg.addColorStop(1, '#0a0710');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !doms.length) return;
    // arena ramka
    ctx.strokeStyle = 'rgba(160,140,255,.12)'; ctx.lineWidth = 2;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(ox - 4, oy - 4, AW * s + 8, AH * s + 8, 14); ctx.stroke(); }

    // ulanish chiziqlari (REACH ichidagi juftlar)
    for (let i = 0; i < doms.length; i++) for (let j = i + 1; j < doms.length; j++) {
      if (dist2(doms[i], doms[j]) <= REACH * REACH) {
        const a = toScreen(doms[i].x, doms[i].y), b = toScreen(doms[j].x, doms[j].y);
        const active = doms[i].fallen && doms[j].fallen;
        ctx.strokeStyle = active ? 'rgba(251,191,36,.28)' : 'rgba(150,180,255,.10)';
        ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    for (const d of doms) drawDomino(d, time);

    if (window.FX) FX.render(ctx);
    if (flashT > 0) { ctx.fillStyle = `rgba(${flashCol},${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
  }

  function drawDomino(d, time) {
    const base = toScreen(d.x, d.y);
    const w = Math.max(9, 17 * s), h = Math.max(26, 46 * s);
    const col = COL[d.role] || COL.player;
    ctx.save(); ctx.translate(base.x, base.y);
    // qulash: asos atrofida burilish (dir yo'nalishida)
    const lean = d.ang * (Math.cos(d.dir) >= 0 ? 1 : -1);
    ctx.rotate(lean);
    // soya
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    rr(-w / 2, -h, w, h, w * 0.28); ctx.fillStyle = '#0e1220'; ctx.fill(); ctx.restore();
    // tana
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, col); g.addColorStop(1, shade(col, -0.35));
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = d.wave > 0 ? 20 : (d.role === 'goal' && !d.fallen ? 14 : 8);
    rr(-w / 2, -h, w, h, w * 0.28); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    // markaz chizig'i (domino uslubi)
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-w / 2 + 2, -h / 2); ctx.lineTo(w / 2 - 2, -h / 2); ctx.stroke();
    ctx.restore();

    // belgilar (aylanmagan)
    if (d.role === 'start' && !d.fallen) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
      ctx.strokeStyle = `rgba(52,211,153,${0.4 + pulse * 0.4})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(base.x, base.y, (10 + pulse * 5), 0, 7); ctx.stroke();
    } else if (d.role === 'goal') {
      ctx.fillStyle = d.fallen ? '#fff3d0' : '#3a2a08';
      ctx.font = `bold ${Math.floor(13 * s + 6)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('◎', base.x, base.y - h * 0.5 * Math.cos(d.ang) - 2);
    }
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, r + amt * 255)); g = Math.max(0, Math.min(255, g + amt * 255)); b = Math.max(0, Math.min(255, b + amt * 255));
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; if (state !== 'menu') update(dt); render(t); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  // ── panel ──
  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); }
    else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('domino'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('goBtn').addEventListener('click', go);
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); go(); } else if (e.code === 'KeyR') reset(); });

  function pos(e) { const rect = cv.getBoundingClientRect(); const tt = e.touches ? e.touches[0] : e; return [tt.clientX - rect.left, tt.clientY - rect.top]; }
  function onDown(e) {
    e.preventDefault(); if (state !== 'build') return;
    const [sx, sy] = pos(e); const lp = toLogical(sx, sy);
    // o'z dominongni bosgan bo'lsang — olib tashla
    for (let i = doms.length - 1; i >= 0; i--) {
      if (doms[i].role === 'player' && dist2(doms[i], lp) < 30 * 30) { doms.splice(i, 1); remaining++; if (window.SFX) SFX.tone(240, 0.04, { vol: 0.05 }); updHud(); return; }
    }
    if (remaining <= 0) return;
    if (lp.x < 20 || lp.x > AW - 20 || lp.y < 20 || lp.y > AH - 20) return;
    // boshqasiga juda yaqin bo'lmasin
    for (const d of doms) if (dist2(d, lp) < 46 * 46) return;
    doms.push({ x: lp.x, y: lp.y, role: 'player', fallen: false, ang: 0, dir: 0.6, tTopple: Infinity, wave: 0 });
    remaining--; if (window.SFX) SFX.tone(420, 0.04, { type: 'square', vol: 0.06 }); updHud();
  }
  cv.addEventListener('mousedown', onDown);
  cv.addEventListener('touchstart', onDown, { passive: false });

  window.DM = {
    info: () => ({ N: LEVELS[levelIdx].N, sol: LEVELS[levelIdx].sol, goals: ngoal }),
    place: (x, y) => { if (remaining > 0) { doms.push({ x, y, role: 'player', fallen: false, ang: 0, dir: 0.6, tTopple: Infinity, wave: 0 }); remaining--; updHud(); } },
    go, state: () => ({ state, goalsFallen: doms.filter(d => d.role === 'goal' && d.fallen).length, ngoal })
  };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
