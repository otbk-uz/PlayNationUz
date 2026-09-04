// Berkinmachoq — 2.5D izometrik yashirin o'yin. Izlovchi ko'rish konusidan bekinib churga yet.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    { grid: [
      "#########",
      "#S..B..C#",
      "#.##.##.#",
      "#.B...B.#",
      "#.##.##.#",
      "#...B...#",
      "#########"], seekers: [{ path: [[3, 1], [3, 7]] }] },
    { grid: [
      "##########",
      "#S...B...#",
      "#.####.#.#",
      "#.B..#.B.#",
      "#.##.#.#.#",
      "#..B.#...#",
      "#.####.#.#",
      "#......C.#",
      "##########"], seekers: [{ path: [[1, 4], [5, 4]] }, { path: [[7, 1], [7, 6]] }] },
    { grid: [
      "###########",
      "#S..B...B.#",
      "#.#####.#.#",
      "#.B...#.#.#",
      "#.#.#.#.#.#",
      "#.#.B.#.B.#",
      "#.#.#.#.#.#",
      "#...#...#C#",
      "###########"], seekers: [{ path: [[1, 5], [7, 5]] }, { path: [[3, 1], [3, 8]] }] },
    { grid: [
      "###########",
      "#S....B...#",
      "#.###.###.#",
      "#.#.....#.#",
      "#.#.B#B.#.#",
      "#...#.#...#",
      "#.#.B#B.#.#",
      "#.#.....#.#",
      "#.###.###C#",
      "###########"], seekers: [{ path: [[5, 1], [5, 9]] }, { path: [[1, 6], [8, 6]] }, { path: [[3, 3], [7, 3]] }] },
    { grid: [
      "############",
      "#S...B....B#",
      "#.########.#",
      "#.B......#.#",
      "#.#.####.#.#",
      "#.#.#B.#.#.#",
      "#.#.#.##.#.#",
      "#.#....B.#.#",
      "#.######.#.#",
      "#........#C#",
      "############"], seekers: [{ path: [[1, 5], [9, 5]] }, { path: [[3, 1], [3, 9]] }, { path: [[7, 7], [7, 1]] }] },
  ];

  const TW = 62, TH = 31, WALLH = 30;
  const SPEED = 3.2, SEEK_SPEED = 2.0, RANGE = 4.6, HALF = Math.PI / 5, SPOT_RATE = 1.35;

  let levelIdx = 0, G = [], R = 0, C = 0, player = null, chur = null, seekers = [];
  let spot = 0, state = 'menu', flashT = 0, moveDir = null, keyDir = {}, t0 = 0;
  let ox = 0, oy = 0, scale = 1, bob = 0;

  function tileAt(r, c) { if (r < 0 || c < 0 || r >= R || c >= C) return '#'; return G[r][c]; }
  const isWall = (r, c) => tileAt(Math.round(r), Math.round(c)) === '#';
  const isBush = (r, c) => tileAt(Math.round(r), Math.round(c)) === 'B';

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; G = L.grid.map(s => s.split('')); R = G.length; C = G[0].length;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (G[r][c] === 'S') { player = { r, c }; G[r][c] = '.'; }
      else if (G[r][c] === 'C') { chur = { r, c }; }
    }
    seekers = L.seekers.map(s => ({ path: s.path.map(p => p.slice()), wi: 0, dir_: 1, r: s.path[0][0], c: s.path[0][1], fr: 0, fc: 1 }));
    spot = 0; state = 'play'; flashT = 0; moveDir = null; keyDir = {};
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    fit();
  }
  function reset() { load(levelIdx); }

  // ── update ──
  function tryMove(ent, dr, dc, dt, spd) {
    const len = Math.hypot(dr, dc) || 1; dr /= len; dc /= len;
    let nr = ent.r + dr * spd * dt, nc = ent.c + dc * spd * dt;
    if (!isWall(ent.r, nc)) ent.c = nc; // x-axis
    if (!isWall(nr, ent.c)) ent.r = nr; // y-axis
  }
  function update(dt) {
    bob += dt * 6;
    if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    // o'yinchi
    let d = moveDir; if (!d) { let dr = 0, dc = 0; if (keyDir.up) { dr -= 1; dc -= 1; } if (keyDir.down) { dr += 1; dc += 1; } if (keyDir.left) { dr += 1; dc -= 1; } if (keyDir.right) { dr -= 1; dc += 1; } if (dr || dc) d = [dr, dc]; }
    if (d) tryMove(player, d[0], d[1], dt, SPEED);
    // izlovchilar
    for (const s of seekers) {
      const wp = s.path[s.wi]; const dr = wp[0] - s.r, dc = wp[1] - s.c; const dist = Math.hypot(dr, dc);
      if (dist < 0.08) { s.wi += s.dir_; if (s.wi >= s.path.length) { s.wi = s.path.length - 2; s.dir_ = -1; } if (s.wi < 0) { s.wi = 1; s.dir_ = 1; } }
      else { const nr = dr / dist, nc = dc / dist; s.fr += (nr - s.fr) * Math.min(1, dt * 6); s.fc += (nc - s.fc) * Math.min(1, dt * 6);
        tryMove(s, dr, dc, dt, SEEK_SPEED); }
    }
    // ko'rinish
    const hidden = isBush(player.r, player.c);
    let seen = false;
    if (!hidden) for (const s of seekers) if (sees(s, player)) { seen = true; break; }
    if (seen) spot = Math.min(1, spot + dt * SPOT_RATE); else spot = Math.max(0, spot - dt * 0.8);
    const sp = document.getElementById('statePill');
    if (hidden) sp.textContent = '🌳 Yashirin';
    else if (seen) sp.textContent = '⚠ Ko\'rindi ' + Math.round(spot * 100) + '%';
    else sp.textContent = '🙈 Bekin';
    if (spot >= 1) return caught();
    // churga yetdimi
    if (Math.hypot(player.r - chur.r, player.c - chur.c) < 0.5) win();
  }
  function sees(s, p) {
    const dr = p.r - s.r, dc = p.c - s.c; const dist = Math.hypot(dr, dc);
    if (dist > RANGE || dist < 0.01) return dist < 0.5;
    const fl = Math.hypot(s.fr, s.fc) || 1; const dot = (dr * s.fr + dc * s.fc) / (dist * fl);
    if (Math.acos(Math.max(-1, Math.min(1, dot))) > HALF) return false;
    return los(s.r, s.c, p.r, p.c);
  }
  function los(r0, c0, r1, c1) {
    const steps = Math.ceil(Math.hypot(r1 - r0, c1 - c0) * 3);
    for (let i = 1; i < steps; i++) { const r = r0 + (r1 - r0) * i / steps, c = c0 + (c1 - c0) * i / steps; if (tileAt(Math.round(r), Math.round(c)) === '#') return false; }
    return true;
  }
  function caught() { state = 'caught'; flashT = 0.6; if (window.SFX) SFX.hit();
    if (window.FX) FX.shake(8); setTimeout(() => { if (state === 'caught') { load(levelIdx); state = 'play'; } }, 700); }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    const p = iso(player.r, player.c); if (window.FX) FX.burst(p.x, p.y, '#8dffb0', 24);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1000);
    else setTimeout(() => showPanel(true, '🎉 Usta bekinuvchi!', "Barcha bosqichda izlovchini aldab churga yetding — berkinmachoq ustasi!", '↻ Qaytadan'), 1000);
  }

  // ── iso ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mapW = (R + C) * TW / 2, mapH = (R + C) * TH / 2 + WALLH;
    scale = Math.min(1.15, (innerWidth - 30) / mapW, (innerHeight - 250) / mapH); scale = Math.max(0.5, scale);
    ox = innerWidth / 2; oy = (innerHeight - 150) / 2 - (R + C) * TH / 4 * scale + 40;
  }
  function iso(r, c) { return { x: ox + (c - r) * TW / 2 * scale, y: oy + (c + r) * TH / 2 * scale }; }

  function render() {
    const bg = ctx.createLinearGradient(0, 0, 0, innerHeight); bg.addColorStop(0, '#0a1428'); bg.addColorStop(1, '#060a16');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !G.length) return;
    const sh = flashT > 0 && state === 'caught' ? (Math.sin(flashT * 50) * 4) : 0;
    ctx.save(); ctx.translate(sh, 0);
    // pol
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { if (G[r][c] === '#') continue; drawGround(r, c); }
    // chur
    drawChur();
    // konuslar (pol ustida)
    for (const s of seekers) drawCone(s);
    // painter: devor + entity + buta, (r+c) bo'yicha
    const items = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { if (G[r][c] === '#') items.push({ d: r + c, kind: 'wall', r, c }); else if (G[r][c] === 'B') items.push({ d: r + c + 0.4, kind: 'bush', r, c }); }
    items.push({ d: player.r + player.c + 0.5, kind: 'player' });
    for (const s of seekers) items.push({ d: s.r + s.c + 0.5, kind: 'seeker', s });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.kind === 'wall') drawWall(it.r, it.c);
      else if (it.kind === 'bush') drawBush(it.r, it.c);
      else if (it.kind === 'player') drawChar(player.r, player.c, isBush(player.r, player.c));
      else drawSeeker(it.s);
    }
    ctx.restore();
    if (window.FX) FX.render(ctx);
    // spot bar
    if (spot > 0.02 && state === 'play') { const bw = 160, bx = (innerWidth - bw) / 2, by = 66;
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = spot > 0.7 ? '#ff5a72' : '#fbbf24'; ctx.fillRect(bx, by, bw * spot, 6); }
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : '255,80,90'; ctx.fillStyle = `rgba(${col},${Math.min(.35, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
  }
  function diamond(p, w, h) { ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x - w, p.y); ctx.closePath(); }
  function drawGround(r, c) {
    const p = iso(r, c), w = TW / 2 * scale, h = TH / 2 * scale;
    diamond(p, w, h); const shade = ((r + c) % 2) ? '#16233f' : '#182740';
    ctx.fillStyle = shade; ctx.fill(); ctx.strokeStyle = 'rgba(90,120,180,.18)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function drawWall(r, c) {
    const p = iso(r, c), w = TW / 2 * scale, h = TH / 2 * scale, H = WALLH * scale;
    // yon yuzlar
    ctx.fillStyle = '#26324e'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x, p.y + h - H); ctx.lineTo(p.x - w, p.y - H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c2740'; ctx.beginPath(); ctx.moveTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x, p.y + h - H); ctx.lineTo(p.x + w, p.y - H); ctx.closePath(); ctx.fill();
    // usti
    const top = { x: p.x, y: p.y - H }; diamond(top, w, h); ctx.fillStyle = '#3a4a6e'; ctx.fill(); ctx.strokeStyle = 'rgba(150,180,240,.25)'; ctx.stroke();
  }
  function drawBush(r, c) {
    const p = iso(r, c); const s = 12 * scale;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, s * 1.1, s * 0.5, 0, 0, 7); ctx.fill();
    for (const o of [[-8, -4], [8, -3], [0, -10], [-4, 2], [5, 3]]) { ctx.fillStyle = ['#2f7d4f', '#3a9160', '#276b43'][(o[0] + 8) % 3];
      ctx.beginPath(); ctx.arc(p.x + o[0] * scale, p.y + o[1] * scale, s * 0.7, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function drawChur() {
    const p = iso(chur.r, chur.c), w = TW / 2 * scale, h = TH / 2 * scale;
    const pulse = 0.5 + 0.5 * Math.sin(bob);
    ctx.save(); ctx.shadowColor = '#8dffb0'; ctx.shadowBlur = 20 * pulse + 8;
    diamond(p, w * 0.9, h * 0.9); ctx.fillStyle = 'rgba(52,211,153,.28)'; ctx.fill();
    ctx.strokeStyle = '#8dffb0'; ctx.lineWidth = 2; diamond(p, w * 0.9, h * 0.9); ctx.stroke(); ctx.restore();
    ctx.font = `${Math.floor(18 * scale)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏁', p.x, p.y - 8 * scale);
  }
  function drawCone(s) {
    const rays = 22; const p0 = iso(s.r, s.c); const baseAng = Math.atan2(s.fr, s.fc);
    ctx.save();
    const inTarget = spot > 0.02 && !isBush(player.r, player.c) && sees(s, player);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
    for (let i = 0; i <= rays; i++) {
      const a = baseAng - HALF + (2 * HALF) * i / rays; const dr = Math.sin(a), dc = Math.cos(a);
      let dist = RANGE; for (let d = 0.2; d <= RANGE; d += 0.2) { if (tileAt(Math.round(s.r + dr * d), Math.round(s.c + dc * d)) === '#') { dist = d - 0.2; break; } }
      const e = iso(s.r + dr * dist, s.c + dc * dist); ctx.lineTo(e.x, e.y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(p0.x, p0.y, 4, p0.x, p0.y, RANGE * TW / 2 * scale);
    if (inTarget) { g.addColorStop(0, 'rgba(255,90,90,.5)'); g.addColorStop(1, 'rgba(255,90,90,0)'); }
    else { g.addColorStop(0, 'rgba(255,215,90,.36)'); g.addColorStop(1, 'rgba(255,215,90,.02)'); }
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = inTarget ? 'rgba(255,120,120,.5)' : 'rgba(255,220,120,.28)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  function drawChar(r, c, hidden) {
    const p = iso(r, c); const s = scale; const b = Math.sin(bob) * 1.5;
    ctx.save(); ctx.globalAlpha = hidden ? 0.55 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 11 * s, 5 * s, 0, 0, 7); ctx.fill();
    const bodyY = p.y - 16 * s + b;
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = hidden ? 4 : 10;
    const g = ctx.createLinearGradient(p.x, bodyY - 6 * s, p.x, p.y); g.addColorStop(0, '#5fe0ff'); g.addColorStop(1, '#1f8fd0');
    ctx.fillStyle = g; rr(p.x - 7 * s, bodyY, 14 * s, 20 * s, 6 * s); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(p.x, bodyY - 4 * s, 6 * s, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawSeeker(s) {
    const p = iso(s.r, s.c); const sc = scale; const b = Math.sin(bob * 1.2 + s.c) * 1.5;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 11 * sc, 5 * sc, 0, 0, 7); ctx.fill();
    const bodyY = p.y - 16 * sc + b;
    ctx.shadowColor = '#ff5a5a'; ctx.shadowBlur = 10;
    const g = ctx.createLinearGradient(p.x, bodyY - 6 * sc, p.x, p.y); g.addColorStop(0, '#ff8a5a'); g.addColorStop(1, '#d0342b');
    ctx.fillStyle = g; rr(p.x - 7 * sc, bodyY, 14 * sc, 20 * sc, 6 * sc); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(p.x, bodyY - 4 * sc, 6 * sc, 0, 7); ctx.fill();
    // ko'z (yo'nalish)
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(p.x + s.fc * 3 * sc, bodyY - 4 * sc + s.fr * 2 * sc, 1.6 * sc, 0, 7); ctx.fill();
    ctx.restore();
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  let last = 0;
  function frame(tm) { const dt = Math.min(0.033, (tm - last) / 1000 || 0); last = tm; if (state !== 'menu') update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('berkinmachoq'); }
    showPanel(false); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.querySelectorAll('.dpad .tbtn').forEach(bn => {
    const dir = bn.getAttribute('data-dir');
    const map = { up: [-1, -1], down: [1, 1], left: [1, -1], right: [-1, 1], mid: null };
    const set = e => { e.preventDefault(); moveDir = map[dir]; };
    const clr = e => { e.preventDefault(); if (moveDir === map[dir]) moveDir = null; };
    bn.addEventListener('touchstart', set, { passive: false }); bn.addEventListener('touchend', clr);
    bn.addEventListener('mousedown', set); bn.addEventListener('mouseup', clr); bn.addEventListener('mouseleave', clr);
  });
  addEventListener('keydown', e => { const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; if (m[e.code]) { keyDir[m[e.code]] = 1; e.preventDefault(); } else if (e.code === 'KeyR') reset(); });
  addEventListener('keyup', e => { const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' }; if (m[e.code]) keyDir[m[e.code]] = 0; });

  window.BK_TEST = { info: () => ({ R, C, player: { ...player }, chur: { ...chur } }), tp: (r, c) => { player.r = r; player.c = c; }, state: () => state };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
