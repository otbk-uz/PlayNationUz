// Soya Sakrash — yorug'lik/soya stealth platformer.
// Soyada ko'rinmaysan; mash'al yoqsang yo'lni ko'rasan, lekin posbonlar (👁) seni sezadi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const TILE = 44;

  // Belgilar: #=platforma ^=nayza S=start D=eshik
  //   G=posbon (o'ngga qaraydi)  g=posbon (chapga qaraydi)
  const LEVELS = [
    // 1 — tanishuv: bitta posbon
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                    ",
      "           g        ",
      "                 D  ",
      "########  ##########",
      "                    ",
    ],
    // 2 — o'chirib o't
    [
      "                    ",
      "                    ",
      "                    ",
      "       G            ",
      "                    ",
      "  S                 ",
      "                    ",
      "                    ",
      "                    ",
      "          ^      D  ",
      "#######  ###########",
      "                    ",
    ],
    // 3 — ikki ko'z
    [
      "                    ",
      "                    ",
      "     G        g     ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                    ",
      "                    ",
      "        ^       D   ",
      "####  ####  ##  ####",
      "                    ",
    ],
    // 4 — koridor
    [
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "#####               ",
      "     g              ",
      "     #########       ",
      "            G        ",
      "     ########## D    ",
      "              ####   ",
      "                    ",
      "                    ",
    ],
    // 5 — ko'tarilish
    [
      "               D    ",
      "             ####   ",
      "        g           ",
      "       ####         ",
      "                    ",
      "    G####           ",
      "                    ",
      " S###               ",
      "     ^     ^        ",
      "###     ###    #####",
      "                    ",
      "                    ",
    ],
    // 6 — zig-zag posbonlar
    [
      "                    ",
      "                    ",
      "   G          g     ",
      "                    ",
      "  S       ^      D  ",
      "#####   #####  #####",
      "                    ",
      "        g           ",
      "     ^        ^     ",
      "###########  #######",
      "                    ",
      "                    ",
    ],
    // 7 — tor o'tish
    [
      "                    ",
      "        g   G       ",
      "                    ",
      "  S                 ",
      "###   ^   ^   ^  ###",
      "   ###  ###  ###    ",
      "                D   ",
      "             ####   ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
    ],
    // 8 — qorong'i minora
    [
      "          D         ",
      "        #####       ",
      "     g              ",
      "     ####           ",
      "            G       ",
      "         #####      ",
      "   G                ",
      "   ####             ",
      " S                  ",
      "###      ^^^^     ###",
      "                    ",
      "                    ",
    ],
    // 9 — nayza + ko'zlar
    [
      "                    ",
      "    G       g    G  ",
      "                    ",
      "  S                 ",
      "###  ^  ###  ^  ####",
      "   ##  ##   ##  ##   ",
      "                    ",
      "              D     ",
      "           #######  ",
      "                    ",
      "                    ",
      "                    ",
    ],
    // 10 — qamal
    [
      "                    ",
      "   G     g     G    ",
      "                    ",
      " S                  ",
      "####  ####  ####  ##",
      "                    ",
      "     g        g     ",
      "  ^     ^  ^     ^  ",
      "####  ####  ####  ##",
      "               D    ",
      "            #####   ",
      "                    ",
    ],
    // 11 — labirint
    [
      "  S                 ",
      "####          g     ",
      "    #        ####    ",
      "    #   G            ",
      "    #  ####          ",
      "    #        G       ",
      "    ######  ####     ",
      "         g        D  ",
      "     ^   ####  ####  ",
      "###########         ",
      "                    ",
      "                    ",
    ],
    // 12 — final: posbonlar dengizi
    [
      "     G     g     G  ",
      "                    ",
      "  S                 ",
      "####   ^^   ^^   ###",
      "    ###   ###   ##   ",
      "   g            g    ",
      "                    ",
      "  ^^   ^^   ^^   ^^  ",
      "####  ####  ####  ###",
      "          G         ",
      "              D     ",
      "           #######  ",
    ],
    // 13 — uch posbon yo'lagi
    [
      "                    ",
      "   G     g     G    ",
      "                    ",
      "  S               D ",
      "####  ####  ##  ####",
      "                    ",
      "      ^       ^     ",
      "   ####    #####    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
    ],
    // 14 — ko'tarilish (posbonli)
    [
      "       D            ",
      "     #####          ",
      "            g       ",
      "        #####       ",
      "   G                ",
      "     ####           ",
      "          g         ",
      "  ####      ###     ",
      " S              ^^  ",
      "###   ^^^   ###  ###",
      "                    ",
      "                    ",
    ],
    // 15 — ko'z to'ri
    [
      "                    ",
      "  G    g    G    g  ",
      "                    ",
      " S                D ",
      "###  ^  ##  ^  ## ##",
      "   ##  ##  ##  ##    ",
      "                    ",
      "     g        G     ",
      "   ^^   ^^  ^^   ^^  ",
      "####  ####  ####  ##",
      "                    ",
      "                    ",
    ],
    // 16 — tor minora
    [
      "         D          ",
      "       #####        ",
      "    g               ",
      "    ####            ",
      "           G        ",
      "        #####       ",
      "  G                 ",
      "  ####       g      ",
      "         ####       ",
      " S    ^^^^      ^^  ",
      "###          #######",
      "                    ",
    ],
    // 17 — nayza + posbon aralash
    [
      "                    ",
      "    G     g    G    ",
      "                    ",
      "  S                 ",
      "###  ##  ^  ##  ####",
      "   ^^  ##  ##  ^^    ",
      "          g         ",
      "               D    ",
      "    G      ######## ",
      "  ##########        ",
      "                    ",
      "                    ",
    ],
    // 18 — final+: posbonlar qal'asi
    [
      "   G    g    G    g ",
      "                    ",
      "  S                 ",
      "###   ^^   ^^   ^^ #",
      "   ###   ###   ###  ",
      "  g              g  ",
      "                    ",
      " ^^   ^^   ^^   ^^  ",
      "###  ####  ####  ###",
      "        G     g     ",
      "             D      ",
      "          #######   ",
    ],
  ];

  const GUARD_R = TILE * 3.3;   // ko'rish radiusi
  const CATCH = 0.55;           // to'liq tutilish vaqti (s)

  let levelIdx = 0, deaths = 0;
  let world = null, player = null;
  let state = 'menu';
  let deadT = 0, flashT = 0, shakeT = 0, seen = 0, torch = false, torchAnim = 0, prevWatched = false;
  const motes = [];
  const keys = { left: false, right: false, jump: false, jumpHeld: false };

  function buildLevel(idx) {
    const rows = LEVELS[idx];
    const cols = Math.max(...rows.map(r => r.length));
    const H = rows.length * TILE, W = cols * TILE;
    const tiles = [], guards = []; let start = null, door = null;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = rows[r][c] || ' ';
        const x = c * TILE, y = r * TILE;
        if (ch === '#') tiles.push({ x, y, w: TILE, h: TILE, type: 'solid', solid: true });
        else if (ch === '^') tiles.push({ x, y, w: TILE, h: TILE, type: 'spike', solid: false });
        else if (ch === 'S') start = { x: x + TILE / 2, y: y + TILE };
        else if (ch === 'D') door = { x, y, w: TILE, h: TILE };
        else if (ch === 'G' || ch === 'g') guards.push({ x: x + TILE / 2, y: y + TILE / 2, dir: ch === 'G' ? 1 : -1, blink: Math.random() * 3 });
      }
    }
    if (!start) start = { x: TILE * 1.5, y: TILE * 2 };
    if (!door) door = { x: W - TILE * 2, y: TILE * 2, w: TILE, h: TILE };
    // eshik ostida qattiq plitka kafolati
    const dcol = Math.round(door.x / TILE), drow = Math.round(door.y / TILE) + 1;
    if (drow < rows.length && !tiles.some(t => t.solid && Math.abs(t.x - dcol * TILE) < 2 && Math.abs(t.y - drow * TILE) < 2))
      tiles.push({ x: dcol * TILE, y: drow * TILE, w: TILE, h: TILE, type: 'solid', solid: true });
    return { cols, rows: rows.length, W, H, tiles, guards, start, door };
  }

  function spawn() {
    player = { x: world.start.x - 15, y: world.start.y - 38, w: 30, h: 38, vx: 0, vy: 0,
      grounded: false, coyote: 0, buffer: 0, face: 1, grace: 0.3 };
    let g = null;
    for (const t of world.tiles) {
      if (!t.solid) continue;
      if (world.start.x >= t.x && world.start.x <= t.x + t.w && t.y >= world.start.y - 6)
        if (!g || t.y < g.y) g = t;
    }
    if (g) { player.y = g.y - player.h; player.vy = 0; }
    seen = 0; torch = false; syncTorch();
  }

  function loadLevel(idx) {
    levelIdx = idx; world = buildLevel(idx); spawn();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    state = 'play'; fit();
  }
  function retry() { world = buildLevel(levelIdx); spawn(); state = 'play'; }

  function die() {
    if (state !== 'play') return;
    deaths++; document.getElementById('deathPill').textContent = '☠ ' + deaths;
    state = 'dead'; deadT = 0; shakeT = 0.4; flashT = 0.18; if (window.SFX) SFX.death();
    if (window.Analytics) try { Analytics.track('death', { game: 'soya-sakrash', level: levelIdx + 1 }); } catch (e) {}
  }

  const GRAV = 2400, MOVE = 300, ACC = 3200, JUMP = -760, MAXFALL = 1400;
  function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function update(dt) {
    torchAnim += (torch ? 1 : -1) * dt * 6; torchAnim = Math.max(0, Math.min(1, torchAnim));
    for (const m of motes) { m.y -= m.v * dt; m.x += Math.sin(m.y / 40 + m.p) * 6 * dt; if (m.y < -10) { m.y = world.H + 10; m.x = Math.random() * world.W; } }
    if (flashT > 0) flashT -= dt; if (shakeT > 0) shakeT -= dt;
    for (const g of world.guards) g.blink -= dt;

    if (state === 'dead') { deadT += dt; if (deadT > 0.5) retry(); return; }
    if (state !== 'play') return;

    const p = player;
    const wasG = p.grounded;
    if (p.grace > 0) p.grace -= dt;
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) p.face = dir;
    p.vx += Math.max(-ACC * dt, Math.min(ACC * dt, dir * MOVE - p.vx));
    if (!dir) p.vx *= Math.pow(0.001, dt);
    p.coyote = p.grounded ? 0.09 : Math.max(0, p.coyote - dt);
    if (keys.jump) { p.buffer = 0.1; keys.jump = false; } else p.buffer = Math.max(0, p.buffer - dt);
    if (p.buffer > 0 && p.coyote > 0) { p.vy = JUMP; p.grounded = false; p.coyote = 0; p.buffer = 0; if (window.SFX) SFX.jump(); }
    if (!keys.jumpHeld && p.vy < 0) p.vy *= Math.pow(0.02, dt);
    p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);

    p.x += p.vx * dt;
    for (const t of world.tiles) { if (!t.solid) continue; if (aabb(p, t)) { if (p.vx > 0) p.x = t.x - p.w; else if (p.vx < 0) p.x = t.x + t.w; p.vx = 0; } }
    p.grounded = false;
    p.y += p.vy * dt;
    for (const t of world.tiles) { if (!t.solid) continue; if (aabb(p, t)) { if (p.vy > 0) { p.y = t.y - p.h; p.grounded = true; } else if (p.vy < 0) p.y = t.y + t.h; p.vy = 0; } }
    if (p.grounded && !wasG && window.SFX) SFX.land();

    // nayzalar
    for (const t of world.tiles) {
      if (t.type !== 'spike') continue;
      const s = { x: t.x + 6, y: t.y + 6, w: t.w - 12, h: t.h - 12 };
      if (aabb(p, s) && p.grace <= 0) return die();
    }
    if (p.y > world.H + 60 || p.x < -60 || p.x > world.W + 60) return die();

    // posbon ko'rishi — faqat mash'al yonganda
    const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
    let watched = false;
    if (torch) {
      for (const g of world.guards) {
        const dx = pcx - g.x, dy = pcy - g.y, d = Math.hypot(dx, dy);
        if (d < GUARD_R && dx * g.dir > -TILE * 0.8) { watched = true; break; }
      }
    }
    if (watched && !prevWatched && window.SFX) SFX.alarm();
    prevWatched = watched;
    seen += (watched ? dt : -dt * 1.6);
    seen = Math.max(0, Math.min(CATCH, seen));
    if (seen >= CATCH) return die();

    if (aabb(p, world.door)) return levelDone();
  }

  function levelDone() {
    if (levelIdx + 1 < LEVELS.length) { if (window.SFX) SFX.levelup(); flashT = 0.25; loadLevel(levelIdx + 1); }
    else {
      state = 'win'; if (window.SFX) SFX.win();
      showPanel(true, "🎉 Qochib chiqding!", "Barcha bosqichlarda soyaga singib posbonlarni chalg'itding — " + deaths + " o'lim bilan.", "↻ Qaytadan");
      if (window.Analytics) try { Analytics.track('win', { game: 'soya-sakrash', deaths }); } catch (e) {}
    }
  }

  // ── render ──
  let SCALE = 1, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (world) { const pad = 46; SCALE = Math.min((innerWidth - pad) / world.W, (innerHeight - pad) / world.H);
      OX = (innerWidth - world.W * SCALE) / 2; OY = (innerHeight - world.H * SCALE) / 2; }
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function render() {
    ctx.save();
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!world) { ctx.restore(); return; }
    let sx = 0, sy = 0; if (shakeT > 0) { sx = (Math.random() - 0.5) * 10 * shakeT; sy = (Math.random() - 0.5) * 10 * shakeT; }
    ctx.translate(OX + sx, OY + sy); ctx.scale(SCALE, SCALE);

    const lit = torchAnim;                 // 0=qorong'i .. 1=yorug'
    const fg = ctx.createLinearGradient(0, 0, 0, world.H); fg.addColorStop(0, '#0a0d1a'); fg.addColorStop(1, '#060811');
    ctx.fillStyle = fg; ctx.fillRect(0, 0, world.W, world.H);
    const vg = ctx.createRadialGradient(world.W / 2, world.H / 2, 40, world.W / 2, world.H / 2, Math.max(world.W, world.H) * 0.6);
    vg.addColorStop(0, `rgba(90,120,190,${0.06 + 0.06 * lit})`); vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, world.W, world.H);
    ctx.strokeStyle = 'rgba(120,150,220,0.16)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, world.W - 2, world.H - 2);

    // changlar
    for (const m of motes) { ctx.globalAlpha = m.a * (0.4 + 0.6 * lit); ctx.fillStyle = '#ffe9b0';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;

    // platformalar — gradient + yuqori yorug'lik
    for (const t of world.tiles) {
      if (t.type === 'spike') continue;
      const a = 0.3 + 0.6 * lit;
      const pgd = ctx.createLinearGradient(0, t.y, 0, t.y + t.h);
      pgd.addColorStop(0, `rgba(122,150,205,${a})`); pgd.addColorStop(1, `rgba(56,74,116,${a})`);
      ctx.fillStyle = pgd; rr(t.x + 1, t.y + 1, t.w - 2, t.h - 2, 7); ctx.fill();
      ctx.fillStyle = `rgba(175,200,245,${0.32 + 0.5 * lit})`; rr(t.x + 3, t.y + 3, t.w - 6, 4, 2); ctx.fill();
      ctx.strokeStyle = `rgba(16,24,44,${0.35})`; ctx.lineWidth = 1; rr(t.x + 1, t.y + 1, t.w - 2, t.h - 2, 7); ctx.stroke();
    }
    // nayzalar — gradient tishlar
    for (const t of world.tiles) {
      if (t.type !== 'spike') continue;
      const sg = ctx.createLinearGradient(0, t.y, 0, t.y + TILE);
      sg.addColorStop(0, `rgba(253,164,180,${0.7 + 0.3 * lit})`); sg.addColorStop(1, `rgba(225,45,80,${0.6 + 0.4 * lit})`);
      ctx.fillStyle = sg;
      for (let i = 0; i < 3; i++) { const bx = t.x + 6 + i * ((TILE - 12) / 3);
        ctx.beginPath(); ctx.moveTo(bx, t.y + TILE - 6); ctx.lineTo(bx + (TILE - 12) / 6, t.y + 8);
        ctx.lineTo(bx + (TILE - 12) / 3, t.y + TILE - 6); ctx.fill(); }
    }

    // eshik (qorong'ida ham porlaydi)
    const d = world.door, dcx = d.x + d.w / 2, pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    ctx.save(); ctx.shadowColor = 'rgba(52,211,153,0.9)'; ctx.shadowBlur = 22 * pulse;
    ctx.fillStyle = 'rgba(52,211,153,0.16)'; rr(d.x + 5, d.y + 2, d.w - 10, d.h - 2, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(52,211,153,0.95)'; ctx.lineWidth = 3; rr(d.x + 5, d.y + 2, d.w - 10, d.h - 2, 9); ctx.stroke();
    ctx.restore(); ctx.font = '22px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🚪', dcx, d.y + d.h - 12);

    // posbonlar
    for (const g of world.guards) {
      const open = g.blink > 0 ? 1 : (g.blink < -0.12 ? (g.blink = 0.6 + Math.random() * 2.5, 1) : 0);
      // ko'rish doirasi — faqat mash'al yonganda
      if (lit > 0.05) {
        ctx.save(); ctx.beginPath();
        const a0 = g.dir > 0 ? -Math.PI / 2 : Math.PI / 2, a1 = g.dir > 0 ? Math.PI / 2 : Math.PI * 1.5;
        ctx.moveTo(g.x, g.y); ctx.arc(g.x, g.y, GUARD_R, a0, a1); ctx.closePath();
        const gr = ctx.createRadialGradient(g.x, g.y, 8, g.x, g.y, GUARD_R);
        gr.addColorStop(0, `rgba(251,113,133,${0.28 * lit})`); gr.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = gr; ctx.fill(); ctx.restore();
      }
      // ko'z
      ctx.fillStyle = lit > 0.1 ? '#fecdd3' : '#3a4258';
      ctx.beginPath(); ctx.ellipse(g.x, g.y, 13, open ? 9 : 2, 0, 0, 7); ctx.fill();
      if (open) { ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.arc(g.x + g.dir * 4, g.y, 4.5, 0, 7); ctx.fill(); }
    }

    // o'yinchi
    if (player && state !== 'win') {
      const p = player, dead = state === 'dead', cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      const gg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
      gg.addColorStop(0, dead ? 'rgba(251,113,133,0.5)' : (torch ? 'rgba(251,191,36,0.5)' : 'rgba(120,150,220,0.28)'));
      gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, 7); ctx.fill();
      // tana — gradient
      const bgd = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      if (dead) { bgd.addColorStop(0, '#fda4b4'); bgd.addColorStop(1, '#e11d48'); }
      else { bgd.addColorStop(0, '#1a2440'); bgd.addColorStop(1, '#0b1120'); }
      ctx.fillStyle = bgd; rr(p.x, p.y, p.w, p.h, 10); ctx.fill();
      ctx.strokeStyle = dead ? 'rgba(251,113,133,0.9)' : (torch ? 'rgba(251,191,36,0.95)' : 'rgba(150,180,235,0.75)'); ctx.lineWidth = 2; rr(p.x, p.y, p.w, p.h, 10); ctx.stroke();
      // yaltiroq
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; rr(p.x + 4, p.y + 4, p.w - 8, p.h * 0.28, 5); ctx.fill();
      // ko'zlar + catchlight
      const ex = p.face > 0 ? 4 : -4;
      ctx.fillStyle = '#eaf2ff'; ctx.beginPath(); ctx.arc(cx - 6 + ex, p.y + 15, 3.4, 0, 7); ctx.arc(cx + 6 + ex, p.y + 15, 3.4, 0, 7); ctx.fill();
      ctx.fillStyle = torch ? '#fbbf24' : '#7aa0e0'; ctx.beginPath(); ctx.arc(cx - 6 + ex + p.face, p.y + 15.5, 1.4, 0, 7); ctx.arc(cx + 6 + ex + p.face, p.y + 15.5, 1.4, 0, 7); ctx.fill();
      // mash'al alangasi — ko'p qatlamli miltillash
      if (torchAnim > 0.05) {
        const fx = cx + p.face * 13, fy = p.y + 4, fl = 0.85 + 0.3 * Math.sin(performance.now() / 60);
        ctx.save(); ctx.shadowColor = 'rgba(251,191,36,0.9)'; ctx.shadowBlur = 18 * torchAnim;
        ctx.fillStyle = `rgba(251,146,20,${0.85 * torchAnim})`; ctx.beginPath(); ctx.ellipse(fx, fy, 5 * fl, 8 * fl, 0, 0, 7); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = `rgba(254,240,138,${0.95 * torchAnim})`; ctx.beginPath(); ctx.ellipse(fx, fy + 1, 2.6 * fl, 4.5 * fl, 0, 0, 7); ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();

    // qorong'ilik pardasi (mash'al o'chganda) — o'yinchi atrofida teshik
    if (torchAnim < 0.98 && player) {
      const p = player, cx = OX + sx + (p.x + p.w / 2) * SCALE, cy = OY + sy + (p.y + p.h / 2) * SCALE;
      const rad = (2.6 * TILE + 40) * SCALE;
      const gr = ctx.createRadialGradient(cx, cy, rad * 0.35, cx, cy, rad);
      const dk = 0.9 * (1 - torchAnim);
      gr.addColorStop(0, 'rgba(4,5,10,0)'); gr.addColorStop(1, `rgba(4,5,10,${dk})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.fillStyle = `rgba(4,5,10,${0.55 * (1 - torchAnim)})`; ctx.fillRect(0, 0, innerWidth, innerHeight);
    }

    // "sezilyapti" ogohlantirish
    if (seen > 0.02 && state === 'play') {
      const f = seen / CATCH;
      ctx.fillStyle = `rgba(251,113,133,${0.16 * f})`; ctx.fillRect(0, 0, innerWidth, innerHeight);
      const bw = 200, bx = (innerWidth - bw) / 2;
      ctx.fillStyle = 'rgba(20,10,14,.7)'; rr(bx, 54, bw, 12, 6); ctx.fill();
      ctx.fillStyle = '#fb7185'; rr(bx, 54, bw * f, 12, 6); ctx.fill();
      if (f > 0.35) { ctx.fillStyle = '#ffd0d8'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('👁 SEZILYAPSAN — o‘chir!', innerWidth / 2, 82); }
    }
    if (flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.5, flashT * 2)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
    ctx.restore();
  }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t;
    if (state === 'play' || state === 'dead' || state === 'win') update(dt); render(); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) { if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden'); } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('soya'); }
    showPanel(false);
    if (state === 'win' || state === 'menu') { deaths = 0; document.getElementById('deathPill').textContent = '☠ 0'; loadLevel(0); }
  });

  function syncTorch() { const b = document.getElementById('btnTorch'); if (b) b.classList.toggle('on', torch); }
  function toggleTorch() { torch = !torch; syncTorch(); if (window.SFX) SFX.torch(torch); }

  const kmap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  const jkeys = ['Space', 'ArrowUp', 'KeyW'];
  addEventListener('keydown', e => {
    if (kmap[e.code]) { keys[kmap[e.code]] = true; e.preventDefault(); }
    if (jkeys.includes(e.code)) { keys.jump = true; keys.jumpHeld = true; e.preventDefault(); }
    if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { if (!e.repeat) toggleTorch(); e.preventDefault(); }
  });
  addEventListener('keyup', e => { if (kmap[e.code]) keys[kmap[e.code]] = false; if (jkeys.includes(e.code)) keys.jumpHeld = false; });
  function hold(id, on, off) { const el = document.getElementById(id); if (!el) return;
    const s = e => { e.preventDefault(); on(); }, en = e => { e.preventDefault(); off && off(); };
    el.addEventListener('touchstart', s, { passive: false }); el.addEventListener('mousedown', s);
    el.addEventListener('touchend', en, { passive: false }); el.addEventListener('touchcancel', en); el.addEventListener('mouseup', en); el.addEventListener('mouseleave', en); }
  hold('btnLeft', () => keys.left = true, () => keys.left = false);
  hold('btnRight', () => keys.right = true, () => keys.right = false);
  hold('btnJump', () => { keys.jump = true; keys.jumpHeld = true; }, () => keys.jumpHeld = false);
  hold('btnTorch', () => toggleTorch(), null);
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('touch').style.display = 'block';

  world = buildLevel(0);
  for (let i = 0; i < 26; i++) motes.push({ x: Math.random() * world.W, y: Math.random() * world.H, v: 6 + Math.random() * 14, r: 0.8 + Math.random() * 1.6, a: 0.15 + Math.random() * 0.25, p: Math.random() * 7 });
  fit(); addEventListener('resize', fit); requestAnimationFrame(frame);
})();
