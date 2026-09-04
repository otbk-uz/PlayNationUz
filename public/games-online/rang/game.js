// Rang Bosqini — Flood-It. Burchakdan boshlab butun taxtani bitta rangga bo'ya (cheklangan yurish).
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const COLORS = ['#ef4444', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa', '#f472b6'];

  let levelIdx = 0, N = 6, K = 4;
  let board = null, saved = null, budget = 0, used = 0, cur = 0;
  let state = 'menu', flashT = 0, ripT = 0, ripColor = '#fff';
  const anim = [];               // {r,c,from,to,t,delay}

  function levelCfg(i) { return { N: Math.min(14, 6 + i), K: Math.min(6, 4 + Math.floor(i / 3)) }; }

  function randBoard(N, K) {
    const g = []; for (let r = 0; r < N; r++) { const row = []; for (let c = 0; c < N; c++) row.push((Math.random() * K) | 0); g.push(row); }
    return g;
  }
  function copy(g) { return g.map(r => r.slice()); }
  function uniform(g) { const v = g[0][0]; for (const row of g) for (const x of row) if (x !== v) return false; return true; }
  function floodTo(g, col) {
    const N = g.length, from = g[0][0]; if (from === col) return;
    const st = [[0, 0]], seen = new Set(['0,0']);
    while (st.length) { const [r, c] = st.pop(); if (g[r][c] !== from) continue; g[r][c] = col;
      [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc]) => { if (nr>=0&&nc>=0&&nr<N&&nc<N&&g[nr][nc]===from&&!seen.has(nr+','+nc)){seen.add(nr+','+nc);st.push([nr,nc]);} });
    }
  }
  function regionSize(g) { const N = g.length, v = g[0][0], st = [[0,0]], seen = new Set(['0,0']); let n = 0;
    while (st.length) { const [r,c]=st.pop(); if (g[r][c]!==v) continue; n++;
      [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc])=>{ if(nr>=0&&nc>=0&&nr<N&&nc<N&&g[nr][nc]===v&&!seen.has(nr+','+nc)){seen.add(nr+','+nc);st.push([nr,nc]);} }); }
    return n; }
  function greedyMoves(g0, K) { let g = copy(g0), m = 0;
    while (!uniform(g) && m < 400) { let best = -1, bc = g[0][0];
      for (let col = 0; col < K; col++) { if (col === g[0][0]) continue; const t = copy(g); floodTo(t, col); const s = regionSize(t); if (s > best) { best = s; bc = col; } }
      floodTo(g, bc); m++; }
    return m; }

  function load(i) {
    levelIdx = i; const cfg = levelCfg(i); N = cfg.N; K = cfg.K;
    board = randBoard(N, K);
    // burchak bir xil bo'lsa qiziqroq — o'z holicha qoldiramiz
    budget = greedyMoves(board, K) + 1; used = 0; cur = board[0][0];
    saved = copy(board); anim.length = 0; state = 'play';
    document.getElementById('levelPill').textContent = 'Bosqich ' + (i + 1);
    updMoves(); buildBar(); fit();
  }
  function updMoves() { document.getElementById('movePill').textContent = used + '/' + budget; }
  function reset() { if (state === 'menu' || !saved) return; board = copy(saved); used = 0; cur = board[0][0]; anim.length = 0; state = 'play'; updMoves(); buildBar(); }

  function pick(col) {
    if (state !== 'play' || col === board[0][0] || col >= K) return;
    // animatsiya uchun oldingi region kataklarini belgilaymiz
    const from = board[0][0], N2 = board.length, st = [[0,0]], seen = new Set(['0,0']), cells = [];
    while (st.length) { const [r,c]=st.pop(); if (board[r][c]!==from) continue; cells.push([r,c]);
      [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc])=>{ if(nr>=0&&nc>=0&&nr<N2&&nc<N2&&board[nr][nc]===from&&!seen.has(nr+','+nc)){seen.add(nr+','+nc);st.push([nr,nc]);} }); }
    for (const [r, c] of cells) anim.push({ r, c, to: col, t: 0, delay: (Math.abs(r) + Math.abs(c)) * 0.018 });
    floodTo(board, col); used++; cur = col;
    ripT = 0.35; ripColor = COLORS[col];
    if (window.SFX) SFX.tone(300 + col * 40, 0.09, { type: 'triangle', vol: 0.11 });
    updMoves(); buildBar();
    if (uniform(board)) win();
    else if (used >= budget) lose();
  }
  function win() {
    flashT = 0.3; state = 'won';
    if (levelIdx + 1 < 14) { if (window.SFX) SFX.levelup(); setTimeout(() => load(levelIdx + 1), 420); }
    else { state = 'win'; if (window.SFX) SFX.win(); showPanel(true, "🎉 Ajoyib!", "Barcha bosqichni bo'yab chiqding — rang ustasi bo'lding!", "↻ Qaytadan"); }
  }
  function lose() { state = 'lost'; if (window.SFX) SFX.hit();
    setTimeout(() => showPanel(true, "💥 Yurish tugadi!", "Bosqich <b>" + (levelIdx + 1) + "</b> — biroz kam qoldi. Boshqacha tartibda urinib ko'r!", "↻ Qaytadan"), 350); }

  // ── rang tugmalari ──
  function buildBar() {
    const bar = document.getElementById('colorbar'); bar.innerHTML = '';
    for (let i = 0; i < K; i++) { const btn = document.createElement('button');
      btn.className = 'cbtn' + (i === board[0][0] ? ' cur' : ''); btn.style.background = COLORS[i];
      btn.addEventListener('click', () => pick(i)); btn.addEventListener('touchstart', e => { e.preventDefault(); pick(i); }, { passive: false });
      bar.appendChild(btn); }
  }

  function update(dt) {
    if (flashT > 0) flashT -= dt; if (ripT > 0) ripT -= dt;
    for (let i = anim.length - 1; i >= 0; i--) { const a = anim[i]; if (a.delay > 0) { a.delay -= dt; continue; } a.t += dt * 6; if (a.t >= 1) anim.splice(i, 1); }
  }

  // ── render ──
  let CELL = 30, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (board) { const side = Math.min(innerWidth - 32, innerHeight - 190); CELL = side / N;
      OX = (innerWidth - N * CELL) / 2; OY = (innerHeight - N * CELL) / 2 - 20; }
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#0b0812'); bgg.addColorStop(1, '#12101f');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!board) { ctx.restore(); return; }
    const animMap = {}; for (const a of anim) if (a.delay <= 0) animMap[a.r + ',' + a.c] = a;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = OX + c * CELL, y = OY + r * CELL; let col = board[r][c];
      const a = animMap[r + ',' + c]; const scale = a ? (0.6 + 0.4 * Math.min(1, a.t)) : 1;
      const g = CELL, pad = g * 0.05;
      ctx.fillStyle = COLORS[col];
      const cw = (g - pad * 2) * scale, off = (g - pad * 2 - cw) / 2;
      rr(x + pad + off, y + pad + off, cw, cw, g * 0.22); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; rr(x + pad + off + cw * 0.12, y + pad + off + cw * 0.1, cw * 0.76, cw * 0.22, cw * 0.12); ctx.fill();
    }
    // burchak belgisi (sening humding)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    rr(OX + 2, OY + 2, CELL - 4, CELL - 4, CELL * 0.22); ctx.stroke();

    ctx.restore();
    if (ripT > 0) { ctx.globalAlpha = ripT * 0.5; ctx.fillStyle = ripColor; ctx.fillRect(0, 0, innerWidth, innerHeight); ctx.globalAlpha = 1; }
    if (flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.4, flashT * 1.4)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; if (state !== 'menu') update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); document.getElementById('colorbar').style.display = 'none'; }
    else { panel.classList.add('hidden'); document.getElementById('colorbar').style.display = 'flex'; }
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('rang'); }
    showPanel(false); if (state === 'win' || state === 'menu' || state === 'lost') load(state === 'lost' ? levelIdx : 0); });
  document.getElementById('resetBtn').addEventListener('click', reset);
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); const n = parseInt(e.key, 10); if (n >= 1 && n <= 6) pick(n - 1); });

  board = randBoard(6, 4); fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
