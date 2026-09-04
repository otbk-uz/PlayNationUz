// Zanjir Portlash — sandpile kaskad. Har katak 4 chip sig'diradi; to'lganda 4 tomonga portlaydi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  const LEVELS = [
    {"w":4,"h":4,"budget":1,"target":2,"board":[[3,1,2,1],[1,3,3,2],[1,2,3,0],[3,0,1,0]]},
    {"w":4,"h":4,"budget":1,"target":4,"board":[[3,1,2,1],[2,3,0,3],[3,3,0,2],[2,3,1,0]]},
    {"w":5,"h":4,"budget":1,"target":5,"board":[[3,1,3,3,3],[2,2,2,3,3],[3,2,0,3,1],[2,2,3,2,0]]},
    {"w":5,"h":5,"budget":2,"target":7,"board":[[3,1,3,1,0],[3,2,3,2,0],[2,1,3,3,1],[0,1,2,2,0],[2,1,2,0,3]]},
    {"w":5,"h":5,"budget":2,"target":9,"board":[[3,3,3,3,3],[1,3,3,2,3],[1,0,1,3,2],[2,3,1,1,2],[0,2,3,2,1]]},
    {"w":6,"h":5,"budget":2,"target":9,"board":[[1,3,1,3,2,2],[3,3,0,3,0,3],[3,2,2,2,3,3],[1,3,3,0,1,2],[3,0,1,2,1,0]]},
    {"w":6,"h":5,"budget":2,"target":17,"board":[[3,3,3,3,2,2],[2,3,1,3,3,0],[3,2,1,3,3,3],[3,3,0,1,3,0],[0,3,0,0,1,0]]},
    {"w":6,"h":6,"budget":3,"target":14,"board":[[0,3,2,3,1,0],[1,2,3,3,3,3],[2,3,3,1,1,2],[0,0,1,3,2,0],[2,2,2,2,3,0],[1,3,0,1,3,3]]},
    {"w":6,"h":6,"budget":3,"target":18,"board":[[2,3,0,0,1,3],[2,2,3,3,3,3],[2,3,1,1,3,3],[1,3,3,3,2,1],[3,3,3,1,0,3],[0,0,2,0,1,3]]},
    {"w":7,"h":6,"budget":3,"target":21,"board":[[3,3,3,2,3,2,1],[0,1,2,3,2,0,1],[1,3,3,1,1,1,2],[3,3,1,3,2,0,3],[0,3,3,2,3,1,3],[1,0,3,3,3,0,1]]},
  ];
  const PIP = ['#1c2740', '#38bdf8', '#34d399', '#fbbf24'];   // 0..3 rang

  let levelIdx = 0, W = 4, H = 4, budget = 1, target = 2;
  let orbs, chips, explosions, state = 'menu';
  let reactT = 0, flashT = 0, flashCol = '251,146,20';
  const bursts = [];

  function load(idx) {
    const L = LEVELS[idx]; W = L.w; H = L.h; budget = L.budget; target = L.target;
    orbs = L.board.map(r => r.slice());
    chips = budget; explosions = 0; state = 'play'; bursts.length = 0; levelIdx = idx;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updHud(); fit();
  }
  function updHud() { document.getElementById('chipPill').textContent = '⚡ ' + chips; }
  function reset() { if (state === 'reacting') return; load(levelIdx); }

  function addChip(r, c) {
    if (state !== 'play' || chips <= 0) return;
    orbs[r][c]++; chips--; updHud();
    if (window.SFX) SFX.tone(360, 0.06, { type: 'square', vol: 0.09 });
    state = 'reacting'; reactT = 0;
  }

  function reactRound() {
    const fire = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (orbs[r][c] >= 4) fire.push([r, c]);
    if (!fire.length) return false;
    for (const [r, c] of fire) {
      orbs[r][c] -= 4; explosions++;
      bursts.push({ r, c, t: 0 });
      if (r > 0) orbs[r-1][c]++; if (r < H-1) orbs[r+1][c]++;
      if (c > 0) orbs[r][c-1]++; if (c < W-1) orbs[r][c+1]++;
    }
    if (window.SFX) SFX.tone(180 + Math.min(600, explosions * 20), 0.08, { type: 'sawtooth', vol: 0.12, to: 90 });
    return true;
  }
  function afterReact() {
    if (explosions >= target) win();
    else if (chips <= 0) lose();
    else { state = 'play'; updHud(); }
  }
  function win() { state = 'won'; flashT = 0.4; flashCol = '52,211,153'; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) setTimeout(() => load(levelIdx + 1), 900);
    else setTimeout(() => showPanel(true, "🎉 Zo'r!", "Barcha bosqichda kerakli zanjirni portlatding — kaskad ustasi!", "↻ Qaytadan"), 900);
  }
  function lose() { state = 'lost'; flashT = 0.3; flashCol = '251,113,133'; if (window.SFX) SFX.hit();
    setTimeout(() => showPanel(true, "💥 Yetmadi!", "Bosqich <b>" + (levelIdx + 1) + "</b> — " + explosions + "/" + target + " portlash. Chipni boshqa joyga qo'yib ko'r!", "↻ Yana"), 500); }

  function update(dt) {
    if (flashT > 0) flashT -= dt;
    for (let i = bursts.length - 1; i >= 0; i--) { bursts[i].t += dt * 3; if (bursts[i].t >= 1) bursts.splice(i, 1); }
    if (state === 'reacting') { reactT += dt; if (reactT >= 0.13) { reactT = 0; if (!reactRound()) afterReact(); } }
  }

  // ── render ──
  let CELL = 40, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CELL = Math.min((innerWidth - 32) / W, (innerHeight - 190) / H); CELL = Math.max(30, Math.min(80, CELL));
    OX = (innerWidth - W * CELL) / 2; OY = (innerHeight - H * CELL) / 2;
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w/2, h/2); ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function pips(cx, cy, n, col, rad) {
    const off = rad * 0.5; const P = { 1: [[0,0]], 2: [[-off,-off],[off,off]], 3: [[-off,-off],[off,-off],[0,off]], 4: [[-off,-off],[off,-off],[-off,off],[off,off]] };
    const arr = P[Math.min(4,n)] || []; ctx.fillStyle = col;
    for (const [dx, dy] of arr) { ctx.beginPath(); ctx.arc(cx+dx, cy+dy, rad*0.24, 0, 7); ctx.fill(); }
  }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#0d0712'); bgg.addColorStop(1, '#150a14');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!orbs) { ctx.restore(); return; }
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const x = OX + c*CELL, y = OY + r*CELL, n = orbs[r][c];
      const near = n === 3;
      ctx.fillStyle = near ? 'rgba(251,191,36,0.10)' : 'rgba(255,255,255,0.03)';
      rr(x+2, y+2, CELL-4, CELL-4, CELL*0.16); ctx.fill();
      ctx.strokeStyle = near ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.06)'; ctx.lineWidth = near ? 2 : 1;
      rr(x+2, y+2, CELL-4, CELL-4, CELL*0.16); ctx.stroke();
      if (n > 0) pips(x+CELL/2, y+CELL/2, n, n>=4?'#fb7185':PIP[n], CELL);
    }
    // portlash burstlari
    for (const b of bursts) { const cx = OX + b.c*CELL + CELL/2, cy = OY + b.r*CELL + CELL/2, a = 1 - b.t;
      ctx.strokeStyle = `rgba(251,146,20,${a})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, CELL*0.3 + CELL*0.5*b.t, 0, 7); ctx.stroke();
      ctx.fillStyle = `rgba(251,220,120,${a*0.5})`; ctx.beginPath(); ctx.arc(cx, cy, CELL*0.25*(1-b.t), 0, 7); ctx.fill(); }
    ctx.restore();
    // progress
    const bw = Math.min(280, innerWidth-40), bx = (innerWidth-bw)/2, by = OY + H*CELL + 24;
    ctx.fillStyle = 'rgba(20,14,24,.7)'; rr(bx, by, bw, 12, 6); ctx.fill();
    ctx.fillStyle = '#fb922c'; rr(bx, by, bw*Math.min(1, explosions/target), 12, 6); ctx.fill();
    ctx.fillStyle = '#e7c6a0'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('💥 ' + explosions + ' / ' + target + ' portlash', innerWidth/2, by - 7);
    if (flashT > 0) { ctx.fillStyle = `rgba(${flashCol},${Math.min(.35, flashT)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last)/1000 || 0); last = t; if (state !== 'menu') update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('zanjir-portlash'); }
    showPanel(false); if (state === 'win' || state === 'menu' || state === 'lost') load(state === 'lost' ? levelIdx : 0); });
  document.getElementById('resetBtn').addEventListener('click', reset);
  addEventListener('keydown', e => { if (e.code === 'KeyR') reset(); });

  function cellAt(mx, my) { const c = Math.floor((mx - OX) / CELL), r = Math.floor((my - OY) / CELL); if (r < 0 || c < 0 || r >= H || c >= W) return null; return [r, c]; }
  function pos(e) { const rect = cv.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [t.clientX - rect.left, t.clientY - rect.top]; }
  function onDown(e) { e.preventDefault(); const p = pos(e); const cell = cellAt(p[0], p[1]); if (cell) addChip(cell[0], cell[1]); }
  cv.addEventListener('mousedown', onDown); cv.addEventListener('touchstart', onDown, { passive: false });

  load(0); state = 'menu'; fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
