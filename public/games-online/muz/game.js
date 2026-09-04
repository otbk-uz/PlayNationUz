// Sirg'anoq Muz — ice slide puzzle. Devor/eshikka urilguncha sirg'alasan.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // '#'=devor  ' '=muz  S=start  D=eshik(to'xtatadi+maqsad)  *=yulduz
  const LEVELS = [
    ["#######","# # D #","#     #","# ##  #","#S    #","##*   #","#######"],
    ["########","#   #* #","#     S#","#   D  #","# *   ##","#   ## #","########"],
    ["########","# *  # #","# #    #","#D  #  #","## *   #","#    S #","########"],
    ["########","#    # #","#*     #","# ##  ##","#     D#","# # S# #","#  #  *#","########"],
    ["#########","#   ##  #","# #     #","# #    *#","#* #   S#","# # D## #","###  *# #","#########"],
    ["#########","## *# # #","# #  # ##","#    # ##","#D##S   #","#*    #*#","#      ##","#########"],
    ["#########","#**  ## #","# ##    #","#     # #","# #     #","#  D*#  #","#     ###","# S#    #","#########"],
    ["##########","#  # *   #","#  #*D # #","##*    # #","# ##  #  #","#  S#   ##","#   #    #","#        #","##########"],
    ["##########","#  # #  ##","#S *   ###","#  #     #","# *    ###","#  *#    #","# # #   ##","##  # *D #","##########"],
    ["##########","# #  * # #","#      S##","#        #","###   ## #","# *#     #","#  *# # ##","## #   ###","## D * ###","##########"],
    ["###########","#  #  ##  #","##    D * #","#  #  S   #","## ## # * #","#    *   ##","#      #  #","#*        #","##  # #   #","###########"],
    ["###########","# *### #  #","#     # # #","#  # #    #","#   # * D##","#     **# #","# #    S  #","#   # *#  #","#   #     #","###########"],
    ["###########","# #  ######","# #   #   #","##    *# ##","#        ##","#      #S #","##  #    ##","#   D   #*#","##   *   *#","#  #    * #","###########"],
    ["############","##  *#     #","#  ##  ### #","#      *   #","###      # #","# *        #","#     #   ##","##         #","#* #D #  # #","#  *###  #S#","############"],
  ];

  const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
  let levelIdx = 0, moves = 0;
  let W = null, state = 'menu';           // W: world
  let slide = null;                        // {path,idx,t,collectAt}
  let winT = 0, flashT = 0, shakeT = 0;
  const motes = [];

  function build(idx) {
    const g = LEVELS[idx], rows = g.length, cols = Math.max(...g.map(r => r.length));
    const gg = g.map(r => r.padEnd(cols, ' '));
    const walls = []; for (let r = 0; r < rows; r++) walls.push(new Array(cols).fill(false));
    let S, D; const stars = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ch = gg[r][c];
      if (ch === '#') walls[r][c] = true;
      else if (ch === 'S') S = { r, c };
      else if (ch === 'D') D = { r, c };
      else if (ch === '*') stars.push({ r, c, got: false });
    }
    return { rows, cols, walls, D, stars, total: stars.length, pos: { r: S.r, c: S.c }, vis: { r: S.r, c: S.c } };
  }

  function load(idx) {
    levelIdx = idx; W = build(idx); moves = 0; slide = null; state = 'play';
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    updateStars(); fit();
  }
  function updateStars() { const g = W ? W.stars.filter(s => s.got).length : 0, t = W ? W.total : 0;
    document.getElementById('starPill').textContent = '★ ' + g + '/' + t; }
  function reset() { if (state === 'menu' || !W) return; load(levelIdx); }

  function starAt(r, c) { return W.stars.find(s => s.r === r && s.c === c && !s.got); }

  function move(d) {
    if (state !== 'play' || slide) return;
    const [dr, dc] = DIRS[d]; let r = W.pos.r, c = W.pos.c;
    const path = [{ r, c }]; const collectAt = [];
    while (true) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= W.rows || nc >= W.cols || W.walls[nr][nc]) break;
      r = nr; c = nc; path.push({ r, c });
      const st = starAt(r, c); if (st) collectAt.push({ idx: path.length - 1, star: st });
      if (r === W.D.r && c === W.D.c) break;
    }
    if (path.length < 2) { shakeT = 0.16; if (window.SFX) SFX.blocked(); return; }
    moves++; W.pos = { r, c };
    slide = { path, idx: 0, t: 0, collectAt: collectAt.slice() };
    if (window.SFX) SFX.tone(500, 0.18, { type: 'sine', vol: 0.08, to: 760 });
  }

  function finishSlide() {
    slide = null; updateStars();
    if (W.pos.r === W.D.r && W.pos.c === W.D.c && W.stars.every(s => s.got)) {
      flashT = 0.3;
      if (levelIdx + 1 < LEVELS.length) { if (window.SFX) SFX.levelup(); state = 'between'; setTimeout(() => load(levelIdx + 1), 300); }
      else { state = 'win'; if (window.SFX) SFX.win();
        showPanel(true, "🎉 Zo'r!", "Barcha muz bosqichini yakunlading — sirg'alish ustasi bo'lding!", "↻ Qaytadan"); }
    }
  }

  function update(dt) {
    if (shakeT > 0) shakeT -= dt; if (flashT > 0) flashT -= dt;
    for (const m of motes) { m.y -= m.v * dt; if (m.y < -8) { m.y = innerHeight + 8; m.x = Math.random() * innerWidth; } }
    if (slide) {
      slide.t += dt * 22;              // katak/sek
      const i = Math.min(slide.path.length - 1, Math.floor(slide.t));
      // yulduz yig'ish
      for (const ca of slide.collectAt) if (i >= ca.idx && !ca.star.got) { ca.star.got = true; ca.star.pop = 0; if (window.SFX) SFX.coin(); }
      const f = slide.t - i, a = slide.path[i], b = slide.path[Math.min(slide.path.length - 1, i + 1)];
      W.vis = { r: a.r + (b.r - a.r) * Math.min(1, f), c: a.c + (b.c - a.c) * Math.min(1, f) };
      if (slide.t >= slide.path.length - 1) { W.vis = { r: W.pos.r, c: W.pos.c }; finishSlide(); }
    }
    for (const s of W ? W.stars : []) if (s.pop != null && s.pop < 1) s.pop += dt * 3;
  }

  // ── render ──
  let CELL = 40, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (W) { CELL = Math.min((innerWidth - 40) / W.cols, (innerHeight - 150) / W.rows);
      CELL = Math.max(20, Math.min(64, CELL)); OX = (innerWidth - W.cols * CELL) / 2; OY = (innerHeight - W.rows * CELL) / 2 + 8; }
  }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function star(cx, cy, rad, rot) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, rr2 = i % 2 ? rad * 0.45 : rad;
    ctx.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } ctx.closePath(); }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#071019'); bgg.addColorStop(1, '#0a1522');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    for (const m of motes) { ctx.globalAlpha = m.a; ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    if (!W) { ctx.restore(); return; }
    let sx = 0, sy = 0; if (shakeT > 0) { sx = (Math.random() - 0.5) * 7 * shakeT / 0.16; sy = (Math.random() - 0.5) * 7 * shakeT / 0.16; }
    ctx.translate(sx, sy);
    const Wd = W.cols * CELL, Hd = W.rows * CELL;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#0b1626'; rr(OX - 6, OY - 6, Wd + 12, Hd + 12, 14); ctx.fill(); ctx.restore();

    for (let r = 0; r < W.rows; r++) for (let c = 0; c < W.cols; c++) {
      const x = OX + c * CELL, y = OY + r * CELL;
      if (W.walls[r][c]) {
        const wg = ctx.createLinearGradient(0, y, 0, y + CELL); wg.addColorStop(0, '#243a52'); wg.addColorStop(1, '#152437');
        ctx.fillStyle = wg; rr(x + 1, y + 1, CELL - 2, CELL - 2, 6); ctx.fill();
        ctx.fillStyle = 'rgba(180,210,240,0.15)'; rr(x + 3, y + 3, CELL - 6, 4, 2); ctx.fill();
      } else {
        const ig = ctx.createLinearGradient(0, y, 0, y + CELL); ig.addColorStop(0, 'rgba(150,200,240,0.16)'); ig.addColorStop(1, 'rgba(90,140,190,0.09)');
        ctx.fillStyle = ig; rr(x + 1.5, y + 1.5, CELL - 3, CELL - 3, 5); ctx.fill();
        ctx.strokeStyle = 'rgba(200,230,255,0.08)'; ctx.lineWidth = 1; rr(x + 1.5, y + 1.5, CELL - 3, CELL - 3, 5); ctx.stroke();
      }
    }
    // eshik
    const d = W.D, dx = OX + d.c * CELL, dy = OY + d.r * CELL, active = W.stars.every(s => s.got);
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    ctx.save(); ctx.shadowColor = active ? 'rgba(52,211,153,0.95)' : 'rgba(120,150,200,0.6)'; ctx.shadowBlur = (active ? 22 : 10) * pulse;
    ctx.fillStyle = active ? 'rgba(52,211,153,0.2)' : 'rgba(120,150,200,0.12)'; rr(dx + 4, dy + 4, CELL - 8, CELL - 8, 7); ctx.fill();
    ctx.strokeStyle = active ? 'rgba(52,211,153,0.95)' : 'rgba(120,150,200,0.7)'; ctx.lineWidth = 3; rr(dx + 4, dy + 4, CELL - 8, CELL - 8, 7); ctx.stroke();
    ctx.restore(); ctx.font = (CELL * 0.5) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚪', dx + CELL / 2, dy + CELL / 2 + 1);

    // yulduzlar
    for (const s of W.stars) {
      const cx = OX + s.c * CELL + CELL / 2, cy = OY + s.r * CELL + CELL / 2;
      if (s.got) { if (s.pop != null && s.pop < 1) { ctx.globalAlpha = 1 - s.pop; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2;
        star(cx, cy, CELL * 0.3 * (1 + s.pop), performance.now() / 400); ctx.stroke(); ctx.globalAlpha = 1; } continue; }
      ctx.save(); ctx.shadowColor = 'rgba(251,191,36,0.8)'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24'; star(cx, cy, CELL * 0.26, performance.now() / 900); ctx.fill();
      ctx.fillStyle = '#fff7d6'; star(cx, cy, CELL * 0.13, performance.now() / 900); ctx.fill(); ctx.restore();
    }

    // o'yinchi (muz sharcha) + iz
    const pcx = OX + W.vis.c * CELL + CELL / 2, pcy = OY + W.vis.r * CELL + CELL / 2, pr = CELL * 0.33;
    if (slide) { ctx.strokeStyle = 'rgba(120,200,255,0.4)'; ctx.lineWidth = pr * 0.8; ctx.lineCap = 'round';
      const a = slide.path[0]; ctx.beginPath(); ctx.moveTo(OX + a.c * CELL + CELL / 2, OY + a.r * CELL + CELL / 2); ctx.lineTo(pcx, pcy); ctx.stroke(); }
    const gr = ctx.createRadialGradient(pcx, pcy, 2, pcx, pcy, CELL); gr.addColorStop(0, 'rgba(56,189,248,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(pcx, pcy, CELL * 0.9, 0, 7); ctx.fill();
    const bg = ctx.createRadialGradient(pcx - pr * 0.3, pcy - pr * 0.3, pr * 0.2, pcx, pcy, pr);
    bg.addColorStop(0, '#eaf7ff'); bg.addColorStop(1, '#67c7f0');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(pcx, pcy, pr, 0, 7); ctx.fill();
    ctx.fillStyle = '#0b2233'; ctx.beginPath(); ctx.arc(pcx - pr * 0.32, pcy - pr * 0.1, pr * 0.16, 0, 7); ctx.arc(pcx + pr * 0.32, pcy - pr * 0.1, pr * 0.16, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pcx - pr * 0.27, pcy - pr * 0.16, pr * 0.06, 0, 7); ctx.arc(pcx + pr * 0.37, pcy - pr * 0.16, pr * 0.06, 0, 7); ctx.fill();

    ctx.restore();
    if (flashT > 0) { ctx.fillStyle = `rgba(120,220,255,${Math.min(0.4, flashT * 1.4)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
    ctx.restore();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; if (state !== 'menu') update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('muz'); } showPanel(false); if (state === 'win' || state === 'menu') load(0); });
  document.getElementById('resetBtn').addEventListener('click', reset);

  const kmap = { ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' };
  addEventListener('keydown', e => { if (kmap[e.code]) { move(kmap[e.code]); e.preventDefault(); } if (e.code === 'KeyR') { reset(); e.preventDefault(); } });
  function tap(id, d) { const el = document.getElementById(id); if (!el) return; const f = e => { e.preventDefault(); move(d); };
    el.addEventListener('touchstart', f, { passive: false }); el.addEventListener('mousedown', f); }
  tap('btnUp', 'U'); tap('btnDown', 'D'); tap('btnLeft', 'L'); tap('btnRight', 'R');
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('touch').style.display = 'block';

  for (let i = 0; i < 26; i++) motes.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: 6 + Math.random() * 14, r: 0.7 + Math.random() * 1.5, a: 0.08 + Math.random() * 0.16 });
  W = build(0); fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
