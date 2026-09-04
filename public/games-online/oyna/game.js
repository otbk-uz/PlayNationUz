// Oyna Zarba — grid mirror puzzle. Ko'k qahramon bosilgan tomonga, pushti oyna aksi bo'yicha yuradi.
// Devorga tiralgan qahramon joyida qoladi — shundan desync qilib ikkalasini nishoniga yetkaz.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // '#'=devor  ' '=pol  A=ko'k start  B=pushti start  a=ko'k nishon  b=pushti nishon
  const LEVELS = [
    ["#########","#A     B#","#       #","#       #","#a     b#","#########"],
    ["#########","#A     B#","#  # #  #","#       #","#  # #  #","#a     b#","#########"],
    ["##########","#A      B#","#   ##   #","#        #","#  a  b  #","##########"],
    ["##########","#A      B#","#        #","# ###### #","#        #","#b      a#","##########"],
    ["##########","#A#    #B#","# #    # #","#        #","#   ##   #","#a      b#","##########"],
    ["###########","#A       B#","### ### ###","#         #","### ### ###","#a       b#","###########"],
    ["##########","#A      B#","#  ##    #","#    ##  #","#  ##    #","#a      b#","##########"],
    ["###########","#A       B#","## #   # ##","#         #","## #   # ##","#         #","#a       b#","###########"],
    ["##########","#A      B#","#  ##    #","#        #","#  ##    #","#ab      #","##########"],
    ["###########","#A       B#","### ##    #","#         #","#    ## ###","#  ab     #","###########"],
    ["############","#A        B#","#  ###     #","#      ##  #","#   ab     #","#  ###     #","#          #","############"],
    ["#############","#A         B#","# ###   ### #","#           #","#   ##  #   #","#      ab   #","# ###   ### #","#############"],
    ["############","#A        B#","# #### ##  #","#     #    #","#  ##   ## #","#   a  b   #","############"],
    ["#############","#A    #    B#","#     #     #","## ###  ### #","#           #","#  a    b   #","#############"],
    ["#############","#A         B#","# ##     ## #","#    ###     ","# ##     ## #","#    ab      ","# ###   ### #","#############"],
    ["#############","#A         B#","## # # # # ##","#           #","# # # # # # #","#  a     b  #","#############"],
    ["##############","#A          B#","# ###### ### #","#            #","# ### ###### #","#ab          #","##############"],
    ["##############","#A          B#","# ## #### ## #","#            #","#  ##    ##  #","#    #ab#    #","# ## #### ## #","##############"],
  ];

  const DIRS = { U:[-1,0], D:[1,0], L:[0,-1], R:[0,1] };
  const MIR = { U:'U', D:'D', L:'R', R:'L' };

  let levelIdx = 0, moves = 0;
  let world = null, state = 'menu';
  let anim = 0, winT = 0, flashT = 0, shakeT = 0;
  const motes = [];

  function build(idx) {
    const g = LEVELS[idx];
    const rows = g.length, cols = Math.max(...g.map(r => r.length));
    const gg = g.map(r => r.padEnd(cols, ' '));
    const walls = [];
    for (let r = 0; r < rows; r++) walls.push(new Array(cols).fill(false));
    let A, B, a, b;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ch = gg[r][c];
      if (ch === '#') walls[r][c] = true;
      else if (ch === 'A') A = { r, c };
      else if (ch === 'B') B = { r, c };
      else if (ch === 'a') a = { r, c };
      else if (ch === 'b') b = { r, c };
    }
    return { rows, cols, walls, a, b,
      blue: { r: A.r, c: A.c, pr: A.r, pc: A.c }, pink: { r: B.r, c: B.c, pr: B.r, pc: B.c } };
  }

  function loadLevel(idx) {
    levelIdx = idx; world = build(idx); moves = 0; state = 'play'; anim = 1;
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    document.getElementById('movePill').textContent = 'Yurish 0';
    fit();
  }
  function reset() { if (state === 'win' || state === 'menu') return; loadLevel(levelIdx); }

  function canGo(av, d) {
    const [dr, dc] = DIRS[d], nr = av.r + dr, nc = av.c + dc;
    if (nr < 0 || nc < 0 || nr >= world.rows || nc >= world.cols) return false;
    if (world.walls[nr][nc]) return false;
    return true;
  }
  function tryMove(d) {
    if (state !== 'play' || anim < 1) return;
    const bl = world.blue, pk = world.pink;
    let moved = false;
    bl.pr = bl.r; bl.pc = bl.c; pk.pr = pk.r; pk.pc = pk.c;
    if (canGo(bl, d)) { bl.r += DIRS[d][0]; bl.c += DIRS[d][1]; moved = true; }
    const pd = MIR[d];
    if (canGo(pk, pd)) { pk.r += DIRS[pd][0]; pk.c += DIRS[pd][1]; moved = true; }
    if (!moved) { shakeT = 0.18; if (window.SFX) SFX.blocked(); return; }
    moves++; anim = 0; if (window.SFX) SFX.move();
    document.getElementById('movePill').textContent = 'Yurish ' + moves;
    if (window.Analytics) try { Analytics.track('move', { game: 'oyna', level: levelIdx + 1 }); } catch (e) {}
  }

  function checkWin() {
    const bl = world.blue, pk = world.pink;
    if (bl.r === world.a.r && bl.c === world.a.c && pk.r === world.b.r && pk.c === world.b.c) {
      flashT = 0.3;
      if (levelIdx + 1 < LEVELS.length) { if (window.SFX) SFX.levelup(); setTimeout(() => loadLevel(levelIdx + 1), 260); state = 'between'; }
      else { state = 'win'; winT = 0; if (window.SFX) SFX.win();
        showPanel(true, "🎉 Ajoyib!", "Barcha bosqichda ikki qahramonni nishoniga yetkazding — oyna sirini yechding!", "↻ Qaytadan");
        if (window.Analytics) try { Analytics.track('win', { game: 'oyna', moves }); } catch (e) {} }
    }
  }

  function update(dt) {
    if (shakeT > 0) shakeT -= dt; if (flashT > 0) flashT -= dt;
    if (anim < 1) { anim = Math.min(1, anim + dt * 9); if (anim >= 1 && state === 'play') checkWin(); }
  }

  // ── render ──
  let CELL = 40, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (world) {
      const padX = 40, padY = 150;
      CELL = Math.min((innerWidth - padX) / world.cols, (innerHeight - padY) / world.rows);
      CELL = Math.max(18, Math.min(70, CELL));
      OX = (innerWidth - world.cols * CELL) / 2;
      OY = (innerHeight - world.rows * CELL) / 2;
    }
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  const ease = t => 1 - Math.pow(1 - t, 3);

  function drawGoal(g, col) {
    const x = OX + g.c * CELL, y = OY + g.r * CELL, cx = x + CELL / 2, cy = y + CELL / 2;
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 350);
    ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.9; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.28, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.35 * pulse; ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.38, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.08, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawAvatar(av, col, colDk, glow, face) {
    const t = ease(anim);
    const r = av.pr + (av.r - av.pr) * t, c = av.pc + (av.c - av.pc) * t;
    const x = OX + c * CELL, y = OY + r * CELL, cx = x + CELL / 2, cy = y + CELL / 2;
    // harakat squash&stretch
    const moving = anim < 1 && (av.pr !== av.r || av.pc !== av.c);
    const stretch = moving ? Math.sin(anim * Math.PI) * 0.12 : 0;
    const sx2 = 1 + (av.pc !== av.c ? stretch : -stretch), sy2 = 1 + (av.pr !== av.r ? stretch : -stretch);
    const s = CELL * 0.66, hs = s / 2;
    // aura
    const gr = ctx.createRadialGradient(cx, cy, 3, cx, cy, CELL);
    gr.addColorStop(0, glow); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, CELL, 0, 7); ctx.fill();
    // soya
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(cx, y + CELL - 6, hs * 0.9, hs * 0.32, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sx2, sy2);
    // tana — gradient
    const bg = ctx.createLinearGradient(0, -hs, 0, hs); bg.addColorStop(0, col); bg.addColorStop(1, colDk);
    ctx.fillStyle = bg; rr(-hs, -hs, s, s, s * 0.3); ctx.fill();
    // yaltiroq
    ctx.fillStyle = 'rgba(255,255,255,0.32)'; rr(-hs + s * 0.14, -hs + s * 0.12, s * 0.72, s * 0.22, s * 0.16); ctx.fill();
    // ko'zlar
    ctx.fillStyle = '#0b1020'; const ex = face * s * 0.12;
    ctx.beginPath(); ctx.arc(-s * 0.16 + ex, -s * 0.02, s * 0.1, 0, 7); ctx.arc(s * 0.16 + ex, -s * 0.02, s * 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-s * 0.16 + ex + 1.5, -s * 0.05, s * 0.035, 0, 7); ctx.arc(s * 0.16 + ex + 1.5, -s * 0.05, s * 0.035, 0, 7); ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.save();
    const bgg = ctx.createLinearGradient(0, 0, 0, innerHeight); bgg.addColorStop(0, '#070811'); bgg.addColorStop(1, '#0c0d1c');
    ctx.fillStyle = bgg; ctx.fillRect(0, 0, innerWidth, innerHeight);
    for (const m of motes) { ctx.globalAlpha = m.a; ctx.fillStyle = m.x < innerWidth / 2 ? '#7dd3fc' : '#f9a8d4';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;
    if (!world) { ctx.restore(); return; }
    let sx = 0, sy = 0; if (shakeT > 0) { sx = (Math.random() - 0.5) * 8 * shakeT / 0.18; sy = (Math.random() - 0.5) * 8 * shakeT / 0.18; }
    ctx.translate(sx, sy);
    const W = world.cols * CELL, H = world.rows * CELL;

    // taxta foni + soya
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    const tg = ctx.createLinearGradient(0, OY - 8, 0, OY + H + 8); tg.addColorStop(0, '#0e1428'); tg.addColorStop(1, '#090c18');
    ctx.fillStyle = tg; rr(OX - 8, OY - 8, W + 16, H + 16, 16); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(120,150,220,0.14)'; ctx.lineWidth = 1.5; rr(OX - 8, OY - 8, W + 16, H + 16, 16); ctx.stroke();
    // kataklar
    for (let r = 0; r < world.rows; r++) for (let c = 0; c < world.cols; c++) {
      const x = OX + c * CELL, y = OY + r * CELL;
      if (world.walls[r][c]) {
        const wg = ctx.createLinearGradient(0, y, 0, y + CELL); wg.addColorStop(0, '#28345a'); wg.addColorStop(1, '#161d36');
        ctx.fillStyle = wg; rr(x + 2, y + 2, CELL - 4, CELL - 4, 8); ctx.fill();
        ctx.fillStyle = 'rgba(150,180,235,0.18)'; rr(x + 4, y + 4, CELL - 8, 5, 2.5); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; rr(x + 2, y + 2, CELL - 4, CELL - 4, 8); ctx.stroke();
      } else {
        ctx.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.035)';
        rr(x + 1, y + 1, CELL - 2, CELL - 2, 5); ctx.fill();
      }
    }
    // oyna o'qi — jonli porlash
    const mx = OX + W / 2, sh = 0.5 + 0.5 * Math.sin(performance.now() / 500);
    ctx.save(); ctx.shadowColor = 'rgba(167,139,250,0.8)'; ctx.shadowBlur = 10 + 8 * sh;
    ctx.strokeStyle = `rgba(167,139,250,${0.3 + 0.25 * sh})`; ctx.lineWidth = 1.5; ctx.setLineDash([6, 7]);
    ctx.lineDashOffset = -performance.now() / 60;
    ctx.beginPath(); ctx.moveTo(mx, OY - 6); ctx.lineTo(mx, OY + H + 6); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    drawGoal(world.a, '#38bdf8');
    drawGoal(world.b, '#f472b6');
    drawAvatar(world.blue, '#8fdcff', '#2f9fd8', 'rgba(56,189,248,0.45)', 1);
    drawAvatar(world.pink, '#fbb6d6', '#e0619f', 'rgba(244,114,182,0.45)', -1);

    ctx.restore();
    if (flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.45, flashT * 1.6)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
    ctx.restore();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t;
    for (const m of motes) { m.y -= m.v * dt; if (m.y < -8) { m.y = innerHeight + 8; m.x = Math.random() * innerWidth; } }
    update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => { if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('oyna'); } showPanel(false); if (state === 'win' || state === 'menu') loadLevel(0); });
  document.getElementById('resetBtn').addEventListener('click', reset);

  const kmap = { ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' };
  addEventListener('keydown', e => {
    if (kmap[e.code]) { tryMove(kmap[e.code]); e.preventDefault(); }
    if (e.code === 'KeyR') { reset(); e.preventDefault(); }
  });
  function tap(id, d) { const el = document.getElementById(id); if (!el) return;
    const f = e => { e.preventDefault(); tryMove(d); };
    el.addEventListener('touchstart', f, { passive: false }); el.addEventListener('mousedown', f); }
  tap('btnUp', 'U'); tap('btnDown', 'D'); tap('btnLeft', 'L'); tap('btnRight', 'R');
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('touch').style.display = 'block';

  for (let i = 0; i < 26; i++) motes.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: 5 + Math.random() * 13, r: 0.7 + Math.random() * 1.4, a: 0.08 + Math.random() * 0.16 });
  world = build(0); fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
