// Tirik Naqsh — Conway "Game of Life" teskari boshqotirmasi.
// Urug'ni joyla; N avloddan keyin natija aynan nishonga mos kelsin.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    {"w":6,"h":6,"gens":1,"budget":3,"target":[[3,1],[3,2],[4,1],[4,2]]},
    {"w":6,"h":6,"gens":1,"budget":4,"target":[[2,2],[2,3],[2,4],[3,2],[3,3]]},
    {"w":7,"h":7,"gens":1,"budget":4,"target":[[1,3],[2,2],[2,3],[3,2],[3,3]]},
    {"w":7,"h":7,"gens":1,"budget":5,"target":[[4,3],[5,3],[5,4]]},
    {"w":8,"h":8,"gens":1,"budget":4,"target":[[3,1],[3,2],[3,3],[4,1],[4,2],[4,3]]},
    {"w":8,"h":8,"gens":1,"budget":5,"target":[[3,4],[3,5],[3,6],[4,4],[4,5],[4,6]]},
    {"w":8,"h":8,"gens":2,"budget":4,"target":[[4,1],[4,2],[5,1],[5,2]]},
    {"w":8,"h":8,"gens":2,"budget":5,"target":[[3,3],[3,4],[4,3],[4,4]]},
    {"w":9,"h":9,"gens":2,"budget":5,"target":[[4,4],[4,5],[5,3],[5,4]]},
    {"w":9,"h":9,"gens":2,"budget":6,"target":[[2,5],[2,7],[3,5],[4,5],[4,6],[4,7]]},
    {"w":10,"h":10,"gens":2,"budget":6,"target":[[5,5],[5,6],[6,5],[6,6]]},
    {"w":10,"h":10,"gens":2,"budget":6,"target":[[2,4],[3,4],[3,6],[4,4],[4,5],[4,6]]},
  ];

  let levelIdx = 0, W = 6, H = 6, gens = 1, budget = 3;
  let seed, target, sim, state = 'menu';   // seed:Set player cells; sim:Set current display
  let genIdx = 0, stepT = 0, flashT = 0, flashCol = '52,211,153', resultOk = false, resultT = 0;

  const key = (r, c) => r + ',' + c;
  function load(idx) {
    const L = LEVELS[idx]; W = L.w; H = L.h; gens = L.gens; budget = L.budget;
    target = new Set(L.target.map(([r, c]) => key(r, c)));
    seed = new Set(); sim = null; state = 'edit'; genIdx = 0; levelIdx = idx;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    document.getElementById('genPill').textContent = gens + ' avlod';
    updSeed(); setRun(); fit();
  }
  function updSeed() { document.getElementById('seedPill').textContent = "Urug' " + seed.size + '/' + budget; }
  function setRun() { const b = document.getElementById('runBtn'); b.classList.toggle('disabled', state !== 'edit' || seed.size === 0); }
  function reset() { if (state === 'running') return; seed = new Set(); sim = null; state = 'edit'; genIdx = 0; updSeed(); setRun(); }

  function toggle(r, c) {
    if (state !== 'edit') return;
    const k = key(r, c);
    if (seed.has(k)) { seed.delete(k); if (window.SFX) SFX.tone(240, 0.05, { type: 'sine', vol: 0.07 }); }
    else { if (seed.size >= budget) { flashT = 0.2; flashCol = '251,191,36'; if (window.SFX) SFX.blocked(); return; } seed.add(k); if (window.SFX) SFX.tone(520, 0.05, { type: 'sine', vol: 0.08 }); }
    updSeed(); setRun();
  }

  function step(cells) {
    const nb = {};
    for (const s of cells) { const [r, c] = s.split(',').map(Number);
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc; if (nr < 0 || nc < 0 || nr >= H || nc >= W) continue; const k = key(nr, nc); nb[k] = (nb[k] || 0) + 1; } }
    const next = new Set();
    for (const k in nb) { const n = nb[k]; if (cells.has(k)) { if (n === 2 || n === 3) next.add(k); } else if (n === 3) next.add(k); }
    return next;
  }

  function run() {
    if (state !== 'edit' || seed.size === 0) return;
    state = 'running'; sim = new Set(seed); genIdx = 0; stepT = 0; setRun();
    if (window.SFX) SFX.tone(400, 0.12, { type: 'triangle', vol: 0.1, to: 700 });
  }
  function finishRun() {
    resultOk = sim.size === target.size && [...sim].every(k => target.has(k));
    state = 'result'; resultT = 0;
    if (resultOk) { flashT = 0.4; flashCol = '52,211,153'; if (window.SFX) SFX.win();
      if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 1100);
      else setTimeout(() => showPanel(true, "🎉 Zo'r!", "Barcha naqshni jonlantirding — Hayot ustasi bo'lding!", "↻ Qaytadan"), 1100);
    } else { flashT = 0.3; flashCol = '251,113,133'; if (window.SFX) SFX.hit();
      setTimeout(() => { state = 'edit'; sim = null; setRun(); }, 1200); }
  }

  function update(dt) {
    if (flashT > 0) flashT -= dt;
    if (state === 'running') { stepT += dt; if (stepT >= 0.5) { stepT = 0; sim = step(sim); genIdx++; if (window.SFX) SFX.tone(300 + genIdx * 60, 0.06, { type: 'sine', vol: 0.07 }); if (genIdx >= gens) finishRun(); } }
    if (state === 'result') resultT += dt;
  }

  // ── render ──
  let CELL = 40, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CELL = Math.min((innerWidth - 32) / W, (innerHeight - 200) / H); CELL = Math.max(20, Math.min(66, CELL));
    OX = (innerWidth - W * CELL) / 2; OY = (innerHeight - H * CELL) / 2 - 10;
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w/2, h/2); ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#07110c'); bgg.addColorStop(1, '#0a1512');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!target) { ctx.restore(); return; }
    ctx.fillStyle = '#0a1a14'; rr(OX - 6, OY - 6, W*CELL + 12, H*CELL + 12, 12); ctx.fill();
    const show = sim || seed;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const x = OX + c*CELL, y = OY + r*CELL, k = key(r, c);
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; rr(x+1, y+1, CELL-2, CELL-2, CELL*0.14); ctx.fill();
      // nishon konturi
      if (target.has(k)) { ctx.strokeStyle = 'rgba(52,211,153,0.55)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        rr(x+3, y+3, CELL-6, CELL-6, CELL*0.14); ctx.stroke(); ctx.setLineDash([]); }
      // tirik katak
      if (show.has(k)) {
        const onTarget = target.has(k);
        const g = ctx.createRadialGradient(x+CELL*0.4, y+CELL*0.4, CELL*0.1, x+CELL/2, y+CELL/2, CELL*0.6);
        g.addColorStop(0, onTarget ? '#a7f3d0' : '#86efac'); g.addColorStop(1, onTarget ? '#10b981' : '#22c55e');
        ctx.fillStyle = g; ctx.save(); ctx.shadowColor = 'rgba(52,211,153,0.6)'; ctx.shadowBlur = 8;
        rr(x+3, y+3, CELL-6, CELL-6, CELL*0.2); ctx.fill(); ctx.restore();
      }
    }
    ctx.restore();
    // holat matni
    ctx.textAlign = 'center';
    if (state === 'running') { ctx.fillStyle = '#8ea3c7'; ctx.font = 'bold 15px system-ui'; ctx.fillText('Avlod ' + genIdx + '/' + gens + '…', innerWidth/2, OY - 18); }
    else if (state === 'result') { ctx.fillStyle = resultOk ? '#34d399' : '#fb7185'; ctx.font = 'bold 18px system-ui';
      ctx.fillText(resultOk ? '✓ Mos keldi!' : '✕ Mos kelmadi — qayta urin', innerWidth/2, OY - 16); }
    else { ctx.fillStyle = '#8ea3c7'; ctx.font = '13px system-ui'; ctx.fillText('Nishon (yashil kontur)ni ' + gens + ' avlodda hosil qil', innerWidth/2, OY - 16); }
    if (flashT > 0) { ctx.fillStyle = `rgba(${flashCol},${Math.min(.35, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last)/1000 || 0); last = t; if (state !== 'menu') update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); document.querySelector('.runbar').style.display = 'none'; }
    else { panel.classList.add('hidden'); document.querySelector('.runbar').style.display = 'flex'; }
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('hayot'); } showPanel(false); if (state === 'win' || state === 'menu') load(0); });
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('runBtn').addEventListener('click', run);
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); if (e.code === 'Space' || e.code === 'Enter') { run(); e.preventDefault(); } });

  function cellAt(mx, my) { const c = Math.floor((mx - OX) / CELL), r = Math.floor((my - OY) / CELL); if (r < 0 || c < 0 || r >= H || c >= W) return null; return [r, c]; }
  function pos(e) { const rect = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - rect.left, t.clientY - rect.top]; }
  function onDown(e) { e.preventDefault(); const p = pos(e); const cell = cellAt(p[0], p[1]); if (cell) toggle(cell[0], cell[1]); }
  cv.addEventListener('mousedown', onDown); cv.addEventListener('touchstart', onDown, { passive: false });

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
