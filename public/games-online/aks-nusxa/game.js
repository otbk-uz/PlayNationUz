// Aks-Nusxa — o'tmish nusxalari bilan hamkorlik (vaqt-ko'p o'yin, navbatli).
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    ["#######",
     "#S....#",
     "#.....#",
     "#.A.#a#",
     "#...#E#",
     "#######"],
    ["########",
     "#S.....#",
     "#.####.#",
     "#....#.#",
     "#.A..#a#",
     "#....#E#",
     "########"],
    ["########",
     "#S..AB.#",
     "#......#",
     "#....#a#",
     "#....#b#",
     "#....#E#",
     "########"],
    ["#########",
     "#S....A.#",
     "#....B..#",
     "#.....#a#",
     "#.....#b#",
     "#.....#E#",
     "#########"],
    ["#########",
     "#S..ABC.#",
     "#.......#",
     "#.....#a#",
     "#.....#b#",
     "#.....#c#",
     "#.....#E#",
     "#########"],
    ["#########",
     "#S......#",
     "#.A.B.C.#",
     "#.....#a#",
     "#.....#b#",
     "#.....#c#",
     "#.....#E#",
     "#########"],
  ];

  const GHOST_HUES = ['#a78bfa', '#f472b6', '#38bdf8', '#fbbf24', '#34d399'];
  const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

  let levelIdx = 0, grid = [], R = 0, C = 0, start = null, exit = null;
  let plates = {}, maxClones = 1;
  let passes = [], liveRec = [], live = null, t = 0, state = 'menu';
  let disp = [], flashT = 0;

  function parse(idx) {
    const map = LEVELS[idx]; grid = map.map(r => r.split(''));
    R = grid.length; C = grid[0].length; plates = {}; maxClones = 0;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const ch = grid[r][c];
      if (ch === 'S') start = [r, c];
      else if (ch === 'E') exit = [r, c];
      else if (ch >= 'A' && ch <= 'Z' && ch !== 'S' && ch !== 'E') { plates[ch] = [r, c]; maxClones++; }
    }
  }
  const isWall = (r, c) => r < 0 || c < 0 || r >= R || c >= C || grid[r][c] === '#';
  const isDoor = ch => ch >= 'a' && ch <= 'z';

  function load(idx) {
    levelIdx = idx; parse(idx);
    passes = []; liveRec = [start.slice()]; live = start.slice(); t = 0; state = 'play'; flashT = 0;
    disp = [];
    updHud(); fit();
  }
  function updHud() {
    document.getElementById('levelPill').textContent = 'Bosqich ' + (levelIdx + 1);
    document.getElementById('clonePill').textContent = '⏱ ' + passes.length + '/' + maxClones;
    document.getElementById('tickPill').textContent = '◷ ' + t;
    const cb = document.getElementById('btnClone'); if (cb) cb.disabled = passes.length >= maxClones;
  }

  // tick t da barcha entity pozitsiyalari
  function ghostPos(g, tick) { return g[Math.min(tick, g.length - 1)]; }
  function pressedAt(tick, livePos) {
    const set = new Set();
    const check = (r, c) => { const ch = grid[r][c]; if (ch >= 'A' && ch <= 'Z' && ch !== 'S' && ch !== 'E') set.add(ch); };
    for (const g of passes) { const p = ghostPos(g, tick); check(p[0], p[1]); }
    if (livePos) check(livePos[0], livePos[1]);
    return set;
  }
  function doorOpen(ch, pressed) { return pressed.has(ch.toUpperCase()); }

  function act(dir) {
    if (state !== 'play') return;
    const pressed = pressedAt(t, live);
    let nr = live[0], nc = live[1];
    if (dir !== 'wait' && DIRS[dir]) {
      const tr = live[0] + DIRS[dir][0], tc = live[1] + DIRS[dir][1];
      let ok = !isWall(tr, tc);
      if (ok && isDoor(grid[tr][tc]) && !doorOpen(grid[tr][tc], pressed)) ok = false;
      if (ok) { nr = tr; nc = tc; }
    }
    t++; live = [nr, nc]; liveRec.push([nr, nc]);
    if (window.SFX && (nr !== liveRec[liveRec.length - 2][0] || nc !== liveRec[liveRec.length - 2][1])) SFX.tone(240, 0.03, { type: 'sine', vol: 0.05 });
    updHud();
    if (grid[nr][nc] === 'E') win();
  }
  function addClone() {
    if (state !== 'play' || passes.length >= maxClones) return;
    passes.push(liveRec.slice());
    live = start.slice(); liveRec = [start.slice()]; t = 0;
    if (window.SFX) { SFX.tone(520, 0.12, { type: 'triangle', vol: 0.1, to: 320 }); }
    updHud();
  }
  function reset() { load(levelIdx); }

  function win() {
    state = 'won'; flashT = 0.5;
    if (window.SFX) SFX.win();
    const p = cellC(exit[0], exit[1]); if (window.FX) FX.burst(p.x, p.y, '#8dffb0', 26);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1050);
    else setTimeout(() => showPanel(true, "🎉 Vaqt ustasi!", "Barcha bosqichda o'tmish nusxalaringni uyg'unlashtirding — vaqt senga bo'ysundi!", "↻ Qaytadan"), 1050);
  }

  // ── layout ──
  let GC = 44, gx = 0, gy = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const top = 92, bottom = 160, availH = innerHeight - top - bottom, availW = innerWidth - 28;
    GC = Math.min(availW / C, availH / R); GC = Math.max(26, Math.min(72, GC));
    gx = (innerWidth - C * GC) / 2; gy = top + (availH - R * GC) / 2;
  }
  function cellC(r, c) { return { x: gx + c * GC + GC / 2, y: gy + r * GC + GC / 2 }; }
  function rr(x, y, w, h, rad) { rad = Math.min(rad, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad); ctx.closePath(); }

  // display easing store: key -> {x,y}
  function ease(key, tx, ty) {
    let d = disp[key]; if (!d) { d = disp[key] = { x: tx, y: ty }; }
    d.x += (tx - d.x) * 0.35; d.y += (ty - d.y) * 0.35; return d;
  }

  function render(time) {
    const bg = ctx.createLinearGradient(0, 0, 0, innerHeight);
    bg.addColorStop(0, '#0b1024'); bg.addColorStop(1, '#080a16');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !grid.length) return;
    const pressed = pressedAt(t, live);

    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const ch = grid[r][c], x = gx + c * GC, y = gy + r * GC;
      if (ch === '#') {
        ctx.fillStyle = 'rgba(90,120,190,.13)'; rr(x + 1, y + 1, GC - 2, GC - 2, 5); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.028)'; rr(x + 2, y + 2, GC - 4, GC - 4, 6); ctx.fill();
      }
      if (ch >= 'A' && ch <= 'Z' && ch !== 'S' && ch !== 'E') {
        const on = pressed.has(ch); drawPlate(x, y, on, time);
      } else if (isDoor(ch)) {
        drawDoor(x, y, doorOpen(ch, pressed), time);
      } else if (ch === 'E') {
        drawExit(x, y, time);
      } else if (ch === 'S') {
        ctx.strokeStyle = 'rgba(120,160,255,.3)'; ctx.lineWidth = 1.5;
        rr(x + 6, y + 6, GC - 12, GC - 12, 6); ctx.stroke();
      }
    }

    // arvohlar (o'tmish nusxalari)
    for (let i = 0; i < passes.length; i++) {
      const pos = ghostPos(passes[i], t), hue = GHOST_HUES[i % GHOST_HUES.length];
      const cc = cellC(pos[0], pos[1]); const d = ease('g' + i, cc.x, cc.y);
      const frozen = t >= passes[i].length - 1;
      drawActor(d.x, d.y, hue, frozen ? 0.85 : 0.55, true, i + 1);
    }
    // jonli o'yinchi
    const lc = cellC(live[0], live[1]); const dl = ease('live', lc.x, lc.y);
    drawActor(dl.x, dl.y, '#22e0e0', 1, false, null);

    if (window.FX) FX.render(ctx);
    if (flashT > 0) { ctx.fillStyle = `rgba(140,230,180,${Math.min(.3, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); flashT -= 0.016; }
  }

  function drawPlate(x, y, on, time) {
    const cx = x + GC / 2, cy = y + GC / 2, rad = GC * 0.3;
    ctx.save(); ctx.translate(cx, cy);
    if (on) { ctx.shadowColor = '#8dffb0'; ctx.shadowBlur = 18; }
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, hx = Math.cos(a) * rad, hy = Math.sin(a) * rad; i ? ctx.lineTo(hx, hy) : ctx.moveTo(hx, hy); }
    ctx.closePath();
    ctx.fillStyle = on ? 'rgba(141,255,176,.28)' : 'rgba(120,160,255,.08)'; ctx.fill();
    ctx.strokeStyle = on ? '#8dffb0' : 'rgba(150,180,240,.4)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  function drawDoor(x, y, open, time) {
    ctx.save();
    if (open) {
      ctx.globalAlpha = 0.35; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -time * 0.02;
      ctx.strokeStyle = '#8dffb0'; ctx.lineWidth = 2; rr(x + 4, y + 3, GC - 8, GC - 6, 5); ctx.stroke();
    } else {
      ctx.shadowColor = '#ff5a72'; ctx.shadowBlur = 10; ctx.fillStyle = 'rgba(255,90,114,.5)';
      rr(x + 4, y + 3, GC - 8, GC - 6, 5); ctx.fill();
      ctx.strokeStyle = '#ff86a0'; ctx.lineWidth = 1.5; ctx.stroke();
      for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 6, y + GC / 3 * i); ctx.lineTo(x + GC - 6, y + GC / 3 * i); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke(); }
    }
    ctx.restore();
  }
  function drawExit(x, y, time) {
    const cx = x + GC / 2, cy = y + GC / 2;
    ctx.save(); ctx.translate(cx, cy);
    const pulse = 0.6 + 0.4 * Math.sin(time * 0.004);
    ctx.shadowColor = '#8dffb0'; ctx.shadowBlur = 20 * pulse;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, GC * (0.16 + k * 0.07), 0, 7);
      ctx.strokeStyle = `rgba(141,255,176,${0.6 - k * 0.16})`; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = '#eafff2'; ctx.font = `bold ${Math.floor(GC * 0.3)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 1); ctx.restore();
  }
  function drawActor(x, y, color, alpha, ghost, num) {
    const rad = GC * 0.28;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.shadowColor = color; ctx.shadowBlur = ghost ? 10 : 18;
    const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.2, x, y, rad);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, color); g.addColorStop(1, color);
    ctx.fillStyle = ghost ? color : g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    if (ghost) { ctx.globalAlpha = alpha * 0.9; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `bold ${Math.floor(GC * 0.24)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(num), x, y + 1); }
    ctx.restore();
  }

  function frame(time) { render(time); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  // ── panel ──
  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); }
    else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('aks-nusxa'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('btnClone').addEventListener('click', addClone);
  document.querySelectorAll('.dpad .tbtn').forEach(b => {
    b.addEventListener('click', e => { e.preventDefault(); act(b.getAttribute('data-dir')); });
  });
  addEventListener('keydown', e => {
    const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };
    if (m[e.code]) { e.preventDefault(); act(m[e.code]); }
    else if (e.code === 'Space') { e.preventDefault(); act('wait'); }
    else if (e.code === 'KeyN') { e.preventDefault(); addClone(); }
    else if (e.code === 'KeyR') reset();
  });

  // test/hint hook
  window.AN = {
    info: () => ({ grid: grid.map(r => r.join('')), R, C, start, exit, plates: JSON.parse(JSON.stringify(plates)), maxClones }),
    act, wait: () => act('wait'), clone: addClone, reset,
    state: () => ({ r: live[0], c: live[1], t, clones: passes.length, won: state === 'won' })
  };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
