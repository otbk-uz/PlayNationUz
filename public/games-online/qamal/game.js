// Qamal — grid Qix/Volfied. Chiziq tortib maydonni egallaysan; dushmanlardan qoch.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const COLS = 30, ROWS = 20;
  const EMPTY = 0, CLAIM = 1, TRAIL = 2;

  let grid, player, enemies, dir, nextDir, stepT, trail, lives, claimedPct, target;
  let levelIdx = 0, state = 'menu', flashT = 0, shakeT = 0, deadT = 0;
  const STEP = 0.045;                 // katak/qadam vaqti

  function newGrid() {
    grid = []; for (let r = 0; r < ROWS; r++) { const row = new Array(COLS).fill(EMPTY); grid.push(row); }
    for (let c = 0; c < COLS; c++) { grid[0][c] = CLAIM; grid[1][c] = CLAIM; grid[ROWS-1][c] = CLAIM; grid[ROWS-2][c] = CLAIM; }
    for (let r = 0; r < ROWS; r++) { grid[r][0] = CLAIM; grid[r][1] = CLAIM; grid[r][COLS-1] = CLAIM; grid[r][COLS-2] = CLAIM; }
  }
  function baseClaim() { let n = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === CLAIM) n++; return n; }
  let BASE = 0, TOTAL = COLS * ROWS;

  function load(idx) {
    levelIdx = idx; newGrid(); BASE = baseClaim();
    player = { r: 0, c: (COLS / 2) | 0, pr: 0, pc: (COLS / 2) | 0 };
    dir = null; nextDir = null; stepT = 0; trail = [];
    const ne = Math.min(4, 1 + Math.floor(idx / 2)); enemies = [];
    for (let i = 0; i < ne; i++) {
      let er, ec; do { er = 3 + Math.random() * (ROWS - 6); ec = 3 + Math.random() * (COLS - 6); } while (grid[er | 0][ec | 0] !== EMPTY);
      const sp = 7 + idx * 0.6, a = Math.random() * 7;
      enemies.push({ r: er, c: ec, vr: Math.cos(a) * sp * 0.14 + (Math.random() < .5 ? .06 : -.06), vc: Math.sin(a) * sp * 0.14 + (Math.random() < .5 ? .06 : -.06) });
    }
    lives = 3; target = 75; state = 'play';
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updHud(); fit();
  }
  function updHud() {
    claimedPct = Math.round((baseClaim() - BASE) / (TOTAL - BASE) * 100);
    document.getElementById('pctPill').textContent = claimedPct + '%';
    document.getElementById('lifePill').textContent = '♥'.repeat(Math.max(0, lives)) || '—';
  }

  function setDir(d) { if (state !== 'play') return; nextDir = d; if (!dir) dir = d; }
  const DV = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };

  function tryStep() {
    // yo'nalishni yangilash (teskariga emas, agar chiziq chizayotgan bo'lsak)
    if (nextDir) {
      const opp = { U: 'D', D: 'U', L: 'R', R: 'L' };
      if (!(trail.length && nextDir === opp[dir])) dir = nextDir;
    }
    if (!dir) return;
    const [dr, dc] = DV[dir]; const nr = player.r + dr, nc = player.c + dc;
    if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) return;         // devor
    if (grid[nr][nc] === TRAIL) return;                                // o'z chizig'iga kirmaydi
    const wasClaim = grid[player.r][player.c] === CLAIM;
    player.pr = player.r; player.pc = player.c;
    player.r = nr; player.c = nc; stepT = 0;
    if (grid[nr][nc] === EMPTY) { grid[nr][nc] = TRAIL; trail.push([nr, nc]); if (window.SFX && trail.length % 3 === 0) SFX.step(); }
    else if (grid[nr][nc] === CLAIM && trail.length) { closeTrail(); }
  }

  function closeTrail() {
    for (const [r, c] of trail) grid[r][c] = CLAIM;
    // bo'sh hududlarni belgilash: dushmanli bo'lganini qoldirib, qolganini egallash
    const enemyCells = new Set(enemies.map(e => (e.r | 0) + ',' + (e.c | 0)));
    const seen = []; for (let r = 0; r < ROWS; r++) seen.push(new Array(COLS).fill(false));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (grid[r][c] !== EMPTY || seen[r][c]) continue;
      const region = []; let hasEnemy = false; const st = [[r, c]]; seen[r][c] = true;
      while (st.length) { const [cr, cc] = st.pop(); region.push([cr, cc]);
        if (enemyCells.has(cr + ',' + cc)) hasEnemy = true;
        [[cr-1,cc],[cr+1,cc],[cr,cc-1],[cr,cc+1]].forEach(([ar, ac]) => {
          if (ar>=0&&ac>=0&&ar<ROWS&&ac<COLS&&grid[ar][ac]===EMPTY&&!seen[ar][ac]) { seen[ar][ac]=true; st.push([ar,ac]); } }); }
      if (!hasEnemy) for (const [rr2, cc2] of region) grid[rr2][cc2] = CLAIM;
    }
    trail = []; dir = null; nextDir = null; flashT = 0.25; if (window.SFX) SFX.coin();
    updHud();
    if (claimedPct >= target) win();
  }

  function die() {
    if (state !== 'play') return;
    lives--; for (const [r, c] of trail) grid[r][c] = EMPTY; trail = []; dir = null; nextDir = null;
    shakeT = 0.4; flashT = 0.2; if (window.SFX) SFX.death();
    player.r = 0; player.c = (COLS / 2) | 0; player.pr = player.r; player.pc = player.c;
    updHud();
    if (lives <= 0) { state = 'dead'; setTimeout(() => showPanel(true, "💀 Mag'lubiyat!", "Bosqich <b>" + (levelIdx + 1) + "</b> — " + claimedPct + "% egalladingiz. Yana urinib ko'ring!", "↻ Yana"), 500); }
  }
  function win() { state = 'won'; flashT = 0.4;
    if (levelIdx + 1 < 8) { if (window.SFX) SFX.levelup(); state = 'between'; setTimeout(() => load(levelIdx + 1), 700); }
    else { state = 'win'; if (window.SFX) SFX.win(); showPanel(true, "🏆 G'alaba!", "Barcha qal'ani egallading — hukmdor bo'lding!", "↻ Qaytadan"); }
  }

  function update(dt) {
    if (flashT > 0) flashT -= dt; if (shakeT > 0) shakeT -= dt;
    if (state !== 'play') return;
    // o'yinchi qadami
    stepT += dt;
    const held = keyDir();
    if (held) nextDir = held;
    if (stepT >= STEP) { if (held || trail.length) { stepT = 0; if (held) { dir = dir || held; } tryStep(); } else stepT = STEP; }
    // vizual interpolatsiya
    const f = Math.min(1, stepT / STEP);
    player.vr = player.pr + (player.r - player.pr) * f; player.vc = player.pc + (player.c - player.pc) * f;
    // dushmanlar
    for (const e of enemies) {
      let nr = e.r + e.vr; if (grid[Math.max(0,Math.min(ROWS-1,nr|0))][e.c|0] === CLAIM) { e.vr = -e.vr; nr = e.r + e.vr; }
      let nc = e.c + e.vc; if (grid[e.r|0][Math.max(0,Math.min(COLS-1,nc|0))] === CLAIM) { e.vc = -e.vc; nc = e.c + e.vc; }
      e.r = Math.max(1, Math.min(ROWS - 2, nr)); e.c = Math.max(1, Math.min(COLS - 2, nc));
      if (grid[e.r|0][e.c|0] === TRAIL || ((e.r|0)===player.r && (e.c|0)===player.c && trail.length)) { return die(); }
    }
  }
  function keyDir() { if (keys.U) return 'U'; if (keys.D) return 'D'; if (keys.L) return 'L'; if (keys.R) return 'R'; return null; }

  // ── render ──
  let CELL = 20, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CELL = Math.min((innerWidth - 24) / COLS, (innerHeight - 150) / ROWS);
    OX = (innerWidth - COLS * CELL) / 2; OY = (innerHeight - ROWS * CELL) / 2 + 6;
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w/2, h/2); ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#0b0a12'); bgg.addColorStop(1, '#12101c');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!grid) { ctx.restore(); return; }
    let sx = 0, sy = 0; if (shakeT > 0) { sx = (Math.random()-.5)*8*shakeT/.4; sy = (Math.random()-.5)*8*shakeT/.4; }
    ctx.translate(sx, sy);
    // maydon foni
    ctx.fillStyle = '#0a1020'; rr(OX - 4, OY - 4, COLS*CELL + 8, ROWS*CELL + 8, 10); ctx.fill();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = OX + c*CELL, y = OY + r*CELL, v = grid[r][c];
      if (v === CLAIM) { const g = ctx.createLinearGradient(0,y,0,y+CELL); g.addColorStop(0,'#3b2f66'); g.addColorStop(1,'#241d44');
        ctx.fillStyle = g; ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = 'rgba(167,139,250,0.12)'; ctx.fillRect(x, y, CELL, 2); }
      else if (v === TRAIL) { ctx.fillStyle = '#fbbf24'; ctx.fillRect(x + CELL*0.2, y + CELL*0.2, CELL*0.6, CELL*0.6);
        ctx.fillStyle = 'rgba(251,191,36,0.25)'; ctx.fillRect(x, y, CELL, CELL); }
    }
    // grid setka (bo'sh)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(OX+c*CELL, OY); ctx.lineTo(OX+c*CELL, OY+ROWS*CELL); ctx.stroke(); }
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(OX, OY+r*CELL); ctx.lineTo(OX+COLS*CELL, OY+r*CELL); ctx.stroke(); }

    if (!player || !enemies) { ctx.restore(); return; }
    // dushmanlar
    for (const e of enemies) { const cx = OX + (e.c+.5)*CELL, cy = OY + (e.r+.5)*CELL, rad = CELL*0.5;
      ctx.save(); ctx.shadowColor = 'rgba(251,113,133,0.8)'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#2a0a12'; ctx.beginPath(); ctx.arc(cx-rad*.3, cy-rad*.1, rad*.18, 0, 7); ctx.arc(cx+rad*.3, cy-rad*.1, rad*.18, 0, 7); ctx.fill(); }

    // o'yinchi
    const pcx = OX + ((player.vc!=null?player.vc:player.c)+.5)*CELL, pcy = OY + ((player.vr!=null?player.vr:player.r)+.5)*CELL, pr = CELL*0.5;
    ctx.save(); ctx.shadowColor = 'rgba(52,211,153,0.9)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#34d399'; rr(pcx-pr, pcy-pr, pr*2, pr*2, pr*0.4); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#08221a'; ctx.beginPath(); ctx.arc(pcx-pr*.3, pcy-pr*.1, pr*.2, 0, 7); ctx.arc(pcx+pr*.3, pcy-pr*.1, pr*.2, 0, 7); ctx.fill();

    ctx.restore();
    // progress bar
    if (state === 'play' || state === 'between' || state === 'won') {
      const bw = Math.min(260, innerWidth-40), bx = (innerWidth-bw)/2, by = innerHeight - 40;
      ctx.fillStyle = 'rgba(20,16,30,.7)'; rr(bx, by, bw, 10, 5); ctx.fill();
      ctx.fillStyle = '#34d399'; rr(bx, by, bw*Math.min(1, claimedPct/target), 10, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(claimedPct + '% / ' + target + '%', innerWidth/2, by - 6);
    }
    if (flashT > 0) { ctx.fillStyle = `rgba(52,211,153,${Math.min(.35, flashT)})`; ctx.fillRect(0,0,innerWidth,innerHeight); }
    ctx.restore();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last)/1000 || 0); last = t; if (state !== 'menu') update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('qamal'); }
    showPanel(false); if (state === 'win' || state === 'menu' || state === 'dead') load(state === 'dead' ? levelIdx : 0); });

  const keys = { U: false, D: false, L: false, R: false };
  const kmap = { ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' };
  addEventListener('keydown', e => { if (kmap[e.code]) { keys[kmap[e.code]] = true; setDir(kmap[e.code]); e.preventDefault(); } });
  addEventListener('keyup', e => { if (kmap[e.code]) keys[kmap[e.code]] = false; });
  function hold(id, d) { const el = document.getElementById(id); if (!el) return;
    const on = e => { e.preventDefault(); keys[d] = true; setDir(d); }, off = e => { e.preventDefault(); keys[d] = false; };
    el.addEventListener('touchstart', on, { passive: false }); el.addEventListener('mousedown', on);
    el.addEventListener('touchend', off, { passive: false }); el.addEventListener('touchcancel', off); el.addEventListener('mouseup', off); el.addEventListener('mouseleave', off); }
  hold('btnUp', 'U'); hold('btnDown', 'D'); hold('btnLeft', 'L'); hold('btnRight', 'R');
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('touch').style.display = 'block';

  newGrid(); BASE = baseClaim(); fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
