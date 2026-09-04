// Mina Maydoni — klassik minesweeper. Birinchi bosish xavfsiz; bayroqcha rejimi mobil uchun.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const NUMCOL = ['', '#60a5fa', '#34d399', '#fb7185', '#a78bfa', '#fbbf24', '#22d3ee', '#f472b6', '#e5e7eb'];

  // {cols, rows, mines}
  const LEVELS = [
    { cols: 8, rows: 8, mines: 10 },
    { cols: 10, rows: 10, mines: 18 },
    { cols: 12, rows: 12, mines: 30 },
    { cols: 13, rows: 14, mines: 40 },
    { cols: 14, rows: 16, mines: 55 },
  ];

  let levelIdx = 0, cols = 8, rows = 8, mines = 10;
  let grid;                    // each: {mine, adj, rev, flag}
  let placed = false, state = 'menu', flagMode = false, flashT = 0, shakeT = 0, revealed = 0, boomAt = null;
  const pop = [];

  function build(idx) {
    const cfg = LEVELS[idx]; cols = cfg.cols; rows = cfg.rows; mines = cfg.mines;
    grid = []; for (let r = 0; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) row.push({ mine: false, adj: 0, rev: false, flag: false }); grid.push(row); }
    placed = false; revealed = 0; boomAt = null; state = 'play';
  }
  function load(idx) { levelIdx = idx; build(idx); document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1); updHud(); fit(); }
  function reset() { if (state === 'menu') return; load(levelIdx); }

  function neigh(r, c) { const a = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const nr = r + dr, nc = c + dc; if (nr >= 0 && nc >= 0 && nr < rows && nc < cols) a.push([nr, nc]); } return a; }

  function placeMines(sr, sc) {
    const safe = new Set([sr + ',' + sc]); neigh(sr, sc).forEach(([r, c]) => safe.add(r + ',' + c));
    let placedN = 0;
    while (placedN < mines) {
      const r = (Math.random() * rows) | 0, c = (Math.random() * cols) | 0;
      if (grid[r][c].mine || safe.has(r + ',' + c)) continue;
      grid[r][c].mine = true; placedN++;
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!grid[r][c].mine) grid[r][c].adj = neigh(r, c).filter(([nr, nc]) => grid[nr][nc].mine).length;
    placed = true;
  }

  function updHud() { const flags = grid ? grid.flat().filter(x => x.flag).length : 0;
    document.getElementById('minePill').textContent = '💣 ' + Math.max(0, mines - flags); }

  function reveal(r, c) {
    const cell = grid[r][c]; if (cell.rev || cell.flag) return;
    const st = [[r, c]];
    while (st.length) {
      const [cr, cc] = st.pop(); const cell2 = grid[cr][cc];
      if (cell2.rev || cell2.flag) continue;
      cell2.rev = true; revealed++;
      if (cell2.adj === 0 && !cell2.mine) neigh(cr, cc).forEach(([nr, nc]) => { if (!grid[nr][nc].rev && !grid[nr][nc].flag) st.push([nr, nc]); });
    }
  }

  function tapCell(r, c) {
    if (state !== 'play') return;
    const cell = grid[r][c];
    if (flagMode) { toggleFlag(r, c); return; }
    if (cell.flag) return;
    if (!placed) placeMines(r, c);
    if (cell.mine) { boom(r, c); return; }
    if (cell.rev) { chord(r, c); return; }        // ochilgan raqamni bossa — chord
    reveal(r, c); if (window.SFX) SFX.blip(1);
    checkWin();
  }
  function chord(r, c) {
    const cell = grid[r][c]; if (cell.adj === 0) return;
    const ns = neigh(r, c); const flags = ns.filter(([nr, nc]) => grid[nr][nc].flag).length;
    if (flags !== cell.adj) return;
    for (const [nr, nc] of ns) { const cc = grid[nr][nc]; if (!cc.flag && !cc.rev) { if (cc.mine) { boom(nr, nc); return; } reveal(nr, nc); } }
    checkWin();
  }
  function toggleFlag(r, c) {
    const cell = grid[r][c]; if (cell.rev) return; cell.flag = !cell.flag;
    if (window.SFX) SFX.tone(cell.flag ? 620 : 320, 0.07, { type: 'square', vol: 0.09 });
    updHud();
  }

  function boom(r, c) {
    grid[r][c].rev = true; boomAt = [r, c]; state = 'lost'; shakeT = 0.5; flashT = 0.3; if (window.SFX) SFX.hit();
    for (let rr2 = 0; rr2 < rows; rr2++) for (let cc2 = 0; cc2 < cols; cc2++) if (grid[rr2][cc2].mine) grid[rr2][cc2].rev = true;
    setTimeout(() => showPanel(true, "💥 Portladi!", "Bosqich <b>" + (levelIdx + 1) + "</b> — minaga tegdingiz. Yana urinib ko'ring!", "↻ Yana"), 650);
  }
  function checkWin() {
    updHud();
    if (revealed >= rows * cols - mines) {
      state = 'won'; flashT = 0.4;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c].mine) grid[r][c].flag = true;
      updHud();
      if (levelIdx + 1 < LEVELS.length) { if (window.SFX) SFX.levelup(); state = 'between'; setTimeout(() => load(levelIdx + 1), 900); }
      else { state = 'win'; if (window.SFX) SFX.win(); showPanel(true, "🏆 G'alaba!", "Barcha maydonni tozalading — mina ustasi bo'lding!", "↻ Qaytadan"); }
    }
  }

  // ── render ──
  let CELL = 30, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CELL = Math.min((innerWidth - 24) / cols, (innerHeight - 150) / rows); CELL = Math.max(16, Math.min(54, CELL));
    OX = (innerWidth - cols * CELL) / 2; OY = (innerHeight - rows * CELL) / 2 + 6;
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w/2, h/2); ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#0a0d16'); bgg.addColorStop(1, '#0f1320');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!grid) { ctx.restore(); return; }
    let sx = 0, sy = 0; if (shakeT > 0) { sx = (Math.random()-.5)*7*shakeT/.5; sy = (Math.random()-.5)*7*shakeT/.5; }
    ctx.translate(sx, sy);
    ctx.font = 'bold ' + (CELL * 0.5) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cell = grid[r][c], x = OX + c * CELL, y = OY + r * CELL, m = 1.5;
      if (!cell.rev) {
        const g = ctx.createLinearGradient(0, y, 0, y + CELL); g.addColorStop(0, '#2c3854'); g.addColorStop(1, '#1c2740');
        ctx.fillStyle = g; rr(x + m, y + m, CELL - 2*m, CELL - 2*m, CELL*0.16); ctx.fill();
        ctx.fillStyle = 'rgba(180,205,240,0.14)'; rr(x + m + 2, y + m + 2, CELL - 2*m - 4, (CELL-2*m)*0.32, 3); ctx.fill();
        if (cell.flag) { ctx.fillText('🚩', x + CELL/2, y + CELL/2 + 1); }
      } else {
        ctx.fillStyle = (boomAt && boomAt[0]===r && boomAt[1]===c) ? 'rgba(251,113,133,0.35)' : 'rgba(255,255,255,0.04)';
        rr(x + m, y + m, CELL - 2*m, CELL - 2*m, CELL*0.14); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; rr(x + m, y + m, CELL - 2*m, CELL - 2*m, CELL*0.14); ctx.stroke();
        if (cell.mine) { ctx.fillText('💣', x + CELL/2, y + CELL/2 + 1); }
        else if (cell.adj > 0) { ctx.fillStyle = NUMCOL[cell.adj]; ctx.fillText(String(cell.adj), x + CELL/2, y + CELL/2 + 1); }
      }
    }
    ctx.restore();
    if (flashT > 0) { const col = state === 'lost' ? '251,113,133' : '52,211,153'; ctx.fillStyle = `rgba(${col},${Math.min(.35, flashT)})`; ctx.fillRect(0,0,innerWidth,innerHeight); }
    ctx.restore();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last)/1000 || 0); last = t;
    if (flashT > 0) flashT -= dt; if (shakeT > 0) shakeT -= dt; render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('mina'); }
    showPanel(false); if (state === 'win' || state === 'menu' || state === 'lost') load(state === 'lost' ? levelIdx : 0); });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const flagBtn = document.getElementById('flagBtn');
  flagBtn.addEventListener('click', () => { flagMode = !flagMode; flagBtn.classList.toggle('on', flagMode); if (window.SFX) SFX.click(); });
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); if (e.code === 'KeyF') { flagMode = !flagMode; flagBtn.classList.toggle('on', flagMode); } });

  function cellAt(mx, my) { const c = Math.floor((mx - OX) / CELL), r = Math.floor((my - OY) / CELL); if (r < 0 || c < 0 || r >= rows || c >= cols) return null; return [r, c]; }
  function pos(e) { const rect = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - rect.left, t.clientY - rect.top]; }
  let pressT = 0, pressCell = null, longFired = false, moved = false, startXY = null;
  cv.addEventListener('mousedown', e => { if (e.button === 2) return; const p = pos(e); pressCell = cellAt(p[0], p[1]); });
  cv.addEventListener('mouseup', e => { if (e.button === 2 || !pressCell) return; const p = pos(e); const cell = cellAt(p[0], p[1]); if (cell && cell[0]===pressCell[0] && cell[1]===pressCell[1]) tapCell(cell[0], cell[1]); pressCell = null; });
  cv.addEventListener('contextmenu', e => { e.preventDefault(); const p = pos(e); const cell = cellAt(p[0], p[1]); if (cell && state === 'play') { toggleFlag(cell[0], cell[1]); } });
  cv.addEventListener('touchstart', e => { e.preventDefault(); const p = pos(e); pressCell = cellAt(p[0], p[1]); startXY = p; longFired = false; moved = false;
    pressT = setTimeout(() => { if (pressCell && !moved && state === 'play') { longFired = true; toggleFlag(pressCell[0], pressCell[1]); } }, 340); }, { passive: false });
  cv.addEventListener('touchmove', e => { const p = pos(e); if (startXY && (Math.abs(p[0]-startXY[0]) > 12 || Math.abs(p[1]-startXY[1]) > 12)) moved = true; }, { passive: false });
  cv.addEventListener('touchend', e => { e.preventDefault(); clearTimeout(pressT); if (longFired || moved) { pressCell = null; return; } if (pressCell) tapCell(pressCell[0], pressCell[1]); pressCell = null; }, { passive: false });

  build(0); fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
