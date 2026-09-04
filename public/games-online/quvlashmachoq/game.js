// Quvlashmachoq (Muzlash) — 2.5D izometrik muzlatib quvlashmachoq.
// Quvlovchidan qoch, muzlab qolgan do'stlaringga tegib ularni ozod qil, vaqt tugaguncha hammasini qutqar.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // # devor, . pol, S o'yinchi, F muzlagan do'st, X quvlovchi
  const LEVELS = [
    { time: 46, cspd: 1.7, grid: [
      "#############",
      "#S..........#",
      "#..F..#..F..#",
      "#.....#.....#",
      "#..#.....#..#",
      "#.....X.....#",
      "#..#.....#..#",
      "#.....#.....#",
      "#..F..#.....#",
      "#...........#",
      "#############"] },
    { time: 48, cspd: 1.8, grid: [
      "##############",
      "#S...F.....F.#",
      "#.##.###.##..#",
      "#....#....F..#",
      "#.##.#.####.##",
      "#..X.........#",
      "#.##.####.#..#",
      "#....#....#..#",
      "#.F..........#",
      "##############"] },
    { time: 50, cspd: 1.9, grid: [
      "##############",
      "#S..F...#..F.#",
      "#.###.#.#.##.#",
      "#...X.#....F.#",
      "#.#.#####.##.#",
      "#.#....F....X#",
      "#.####.###.#.#",
      "#............#",
      "#.##.#.####..#",
      "#....#.......#",
      "##############"] },
    { time: 54, cspd: 2.0, grid: [
      "###############",
      "#S....F....F..#",
      "#.##.......##.#",
      "#..F...X....F.#",
      "#....#####....#",
      "#.F......X....#",
      "#.###.....##..#",
      "#....#.##.....#",
      "#.##.#..#..##.#",
      "#............F#",
      "###############"] },
    { time: 52, cspd: 2.15, grid: [
      "###############",
      "#S..F.....F...#",
      "#.##.#.#.#.##.#",
      "#..X.........F#",
      "#.#.###.###.#.#",
      "#.F.....X.....#",
      "#.###.#.#.###.#",
      "#....#.F.#....#",
      "#.##.#.#.#.##.#",
      "#F............#",
      "###############"] },
  ];

  const TW = 60, TH = 30, WALLH = 28;
  const SPEED = 3.4, THAW = 1.7, TAG = 0.55, FREE_DIST = 0.6;

  let levelIdx = 0, G = [], R = 0, C = 0, player = null, friends = [], chasers = [];
  let rescued = 0, total = 0, timeLeft = 0, state = 'menu', flashT = 0, moveDir = null, keyDir = {};
  let frozenT = 0, bob = 0, ox = 0, oy = 0, scale = 1;

  function tileAt(r, c) { if (r < 0 || c < 0 || r >= R || c >= C) return '#'; return G[r][c]; }
  const isWall = (r, c) => tileAt(Math.round(r), Math.round(c)) === '#';

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx]; G = L.grid.map(s => s.split('')); R = G.length; C = G[0].length;
    friends = []; chasers = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const ch = G[r][c];
      if (ch === 'S') { player = { r, c }; G[r][c] = '.'; }
      else if (ch === 'F') { friends.push({ r, c, freed: false }); G[r][c] = '.'; }
      else if (ch === 'X') { chasers.push({ r, c, fr: 0, fc: 1, cd: 0 }); G[r][c] = '.'; }
    }
    total = friends.length; rescued = 0; timeLeft = L.time; frozenT = 0;
    state = 'play'; flashT = 0; moveDir = null; keyDir = {};
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updateHud(); fit();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('statePill').textContent = '🧊 ' + rescued + '/' + total;
    document.getElementById('timePill').textContent = '⏱ ' + Math.ceil(timeLeft);
  }

  function tryMove(ent, dr, dc, dt, spd) {
    const len = Math.hypot(dr, dc) || 1; dr /= len; dc /= len;
    let nr = ent.r + dr * spd * dt, nc = ent.c + dc * spd * dt;
    if (!isWall(ent.r, nc)) ent.c = nc;
    if (!isWall(nr, ent.c)) ent.r = nr;
  }
  function update(dt) {
    bob += dt * 6; if (flashT > 0) flashT -= dt;
    if (state !== 'play') return;
    timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; return lose(); }
    // o'yinchi
    if (frozenT > 0) { frozenT -= dt; }
    else {
      let d = moveDir; if (!d) { let dr = 0, dc = 0; if (keyDir.up) { dr -= 1; dc -= 1; } if (keyDir.down) { dr += 1; dc += 1; } if (keyDir.left) { dr += 1; dc -= 1; } if (keyDir.right) { dr -= 1; dc += 1; } if (dr || dc) d = [dr, dc]; }
      if (d) tryMove(player, d[0], d[1], dt, SPEED);
    }
    // do'stlarni ozod qilish
    for (const f of friends) if (!f.freed && Math.hypot(player.r - f.r, player.c - f.c) < FREE_DIST) {
      f.freed = true; rescued++; if (window.SFX) SFX.coin();
      const p = iso(f.r, f.c); if (window.FX) FX.burst(p.x, p.y - 14, '#7fe9ff', 18);
      updateHud();
      if (rescued >= total) return win();
    }
    // quvlovchilar
    for (const s of chasers) {
      if (s.cd > 0) { s.cd -= dt; // chekinish
        s.fr += (-(player.r - s.r) - s.fr) * Math.min(1, dt * 4);
        tryMove(s, -(player.r - s.r), -(player.c - s.c), dt, LEVELS[levelIdx].cspd * 0.6); continue; }
      const dr = player.r - s.r, dc = player.c - s.c, dist = Math.hypot(dr, dc) || 1;
      s.fr += (dr / dist - s.fr) * Math.min(1, dt * 5); s.fc += (dc / dist - s.fc) * Math.min(1, dt * 5);
      tryMove(s, dr, dc, dt, LEVELS[levelIdx].cspd);
      if (frozenT <= 0 && dist < TAG) { // tutildi -> muzla
        frozenT = THAW; s.cd = 1.4; flashT = 0.4; if (window.SFX) SFX.hit(); if (window.FX) FX.shake(7);
      }
    }
    updateHud();
  }
  function win() {
    state = 'won'; flashT = 0.5; if (window.SFX) SFX.win();
    const p = iso(player.r, player.c); if (window.FX) FX.burst(p.x, p.y - 14, '#8dffb0', 26);
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
    else setTimeout(() => showPanel('🎉 Quvlashmachoq qahramoni!', "Barcha bosqichda do'stlaringni muzdan qutqarding — chaqqon va tez!", '↻ Qaytadan'), 1100);
  }
  function lose() {
    state = 'lost'; flashT = 0.5; if (window.SFX) SFX.death(); if (window.FX) FX.shake(9);
    setTimeout(() => { load(levelIdx); }, 900);
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
    const bg = ctx.createLinearGradient(0, 0, 0, innerHeight); bg.addColorStop(0, '#0b1a2c'); bg.addColorStop(1, '#06101c');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (state === 'menu' || !G.length) return;
    const sh = flashT > 0 && (state === 'caught' || state === 'lost') ? (Math.sin(flashT * 50) * 4) : 0;
    ctx.save(); ctx.translate(sh, 0);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { if (G[r][c] === '#') continue; drawGround(r, c); }
    const items = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (G[r][c] === '#') items.push({ d: r + c, kind: 'wall', r, c });
    for (const f of friends) if (!f.freed) items.push({ d: f.r + f.c + 0.5, kind: 'friend', f });
    items.push({ d: player.r + player.c + 0.5, kind: 'player' });
    for (const s of chasers) items.push({ d: s.r + s.c + 0.5, kind: 'chaser', s });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) {
      if (it.kind === 'wall') drawWall(it.r, it.c);
      else if (it.kind === 'friend') drawFrozen(it.f);
      else if (it.kind === 'player') drawChar(player.r, player.c, frozenT > 0);
      else drawChaser(it.s);
    }
    ctx.restore();
    if (window.FX) FX.render(ctx);
    if (flashT > 0) { const col = state === 'won' ? '141,255,180' : state === 'lost' ? '255,80,90' : '120,200,255'; ctx.fillStyle = `rgba(${col},${Math.min(.32, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
  }
  function diamond(p, w, h) { ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x - w, p.y); ctx.closePath(); }
  function drawGround(r, c) {
    const p = iso(r, c), w = TW / 2 * scale, h = TH / 2 * scale;
    diamond(p, w, h); ctx.fillStyle = ((r + c) % 2) ? '#132741' : '#152c48';
    ctx.fill(); ctx.strokeStyle = 'rgba(90,140,200,.16)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function drawWall(r, c) {
    const p = iso(r, c), w = TW / 2 * scale, h = TH / 2 * scale, H = WALLH * scale;
    ctx.fillStyle = '#243350'; ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x, p.y + h - H); ctx.lineTo(p.x - w, p.y - H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a2740'; ctx.beginPath(); ctx.moveTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x, p.y + h - H); ctx.lineTo(p.x + w, p.y - H); ctx.closePath(); ctx.fill();
    const top = { x: p.x, y: p.y - H }; diamond(top, w, h); ctx.fillStyle = '#37507a'; ctx.fill(); ctx.strokeStyle = 'rgba(150,190,250,.22)'; ctx.stroke();
  }
  function shadowEll(p, s) { ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 11 * s, 5 * s, 0, 0, 7); ctx.fill(); }
  function body(p, s, b, c0, c1, glow) {
    const bodyY = p.y - 16 * s + b;
    ctx.shadowColor = glow; ctx.shadowBlur = 10;
    const g = ctx.createLinearGradient(p.x, bodyY - 6 * s, p.x, p.y); g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; rr(p.x - 7 * s, bodyY, 14 * s, 20 * s, 6 * s); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffe0c0'; ctx.beginPath(); ctx.arc(p.x, bodyY - 4 * s, 6 * s, 0, 7); ctx.fill();
    return bodyY;
  }
  function drawChar(r, c, frozen) {
    const p = iso(r, c), s = scale, b = frozen ? 0 : Math.sin(bob) * 1.5;
    ctx.save(); shadowEll(p, s);
    if (frozen) { const by = body(p, s, 0, '#bfe9ff', '#5aa6d6', '#bfe9ff');
      ctx.fillStyle = 'rgba(190,235,255,.4)'; ctx.beginPath(); ctx.arc(p.x, by + 6 * s, 12 * s, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(220,245,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x - 6 * s, by); ctx.lineTo(p.x + 6 * s, by + 14 * s); ctx.moveTo(p.x + 6 * s, by + 2 * s); ctx.lineTo(p.x - 5 * s, by + 15 * s); ctx.stroke();
    } else body(p, s, b, '#5fe0ff', '#1f8fd0', '#22d3ee');
    ctx.restore();
  }
  function drawFrozen(f) {
    const p = iso(f.r, f.c), s = scale; const pulse = 0.5 + 0.5 * Math.sin(bob + f.c);
    ctx.save(); shadowEll(p, s);
    const by = body(p, s, 0, '#cdeeff', '#6ab0dd', '#bfe9ff');
    ctx.shadowColor = '#bfe9ff'; ctx.shadowBlur = 8 + 6 * pulse;
    ctx.strokeStyle = 'rgba(225,248,255,.85)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p.x, by - 4 * s); ctx.lineTo(p.x, by + 16 * s); ctx.moveTo(p.x - 7 * s, by + 6 * s); ctx.lineTo(p.x + 7 * s, by + 6 * s); ctx.stroke();
    ctx.restore();
  }
  function drawChaser(s) {
    const p = iso(s.r, s.c), sc = scale, b = Math.sin(bob * 1.3 + s.c) * 1.6;
    ctx.save(); shadowEll(p, sc);
    const by = body(p, sc, b, '#ff8a5a', '#d0342b', '#ff5a5a');
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(p.x + s.fc * 3 * sc, by - 4 * sc + s.fr * 2 * sc, 1.8 * sc, 0, 7); ctx.fill();
    ctx.restore();
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  let last = 0;
  function frame(tm) { const dt = Math.min(0.033, (tm - last) / 1000 || 0); last = tm; if (state !== 'menu') update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('quvlashmachoq'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx); state = 'play';
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

  window.QV_TEST = { info: () => ({ R, C, total, rescued, timeLeft, player: { ...player } }), tp: (r, c) => { player.r = r; player.c = c; }, state: () => state, friends: () => friends.map(f => ({ ...f })) };

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
