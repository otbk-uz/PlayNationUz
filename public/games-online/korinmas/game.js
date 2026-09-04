// Ko'rinmas Yo'l — troll platformer. Yo'l ko'rinmas; qadam bossang bir lahza yonadi.
// Soxta platformalar qulaydi, ko'rinmas devorlar to'sadi, nayzalar o'ldiradi. Eshikka yet.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const TILE = 44;

  // ── Levellar (ASCII). Belgilar:
  //  #=ko'rinmas platforma  F=soxta (qulaydi)  ^=nayza  W=ko'rinmas devor
  //  S=start  D=eshik  bo'sh=havo
  const LEVELS = [
    // 1 — tanishuv
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "       S            ",
      "                    ",
      "                 D  ",
      "                    ",
      "                    ",
      "########  ##########",
      "                    ",
    ],
    // 2 — teshiklar
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                 D  ",
      "                    ",
      "          ^         ",
      "######  ####  ######",
      "                    ",
    ],
    // 3 — soxta plitka
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                 D  ",
      "                    ",
      "             ^      ",
      "########  #F########",
      "                    ",
    ],
    // 4 — devor + nayza
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                  D ",
      "                    ",
      "      W    ^^       ",
      "#####  ###  ##  ####",
      "                    ",
    ],
    // 5 — sakrash
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                  D ",
      "                    ",
      "       ^      ^     ",
      "####  ###  ###  ####",
      "                    ",
    ],
    // 6 — ko'tarilish
    [
      "                    ",
      "          D         ",
      "                    ",
      "         ###        ",
      "                    ",
      "       ###          ",
      "                    ",
      "     ###            ",
      "   S                ",
      "  ####              ",
      "## ^^^ FFF   ^^^  ##",
      "                    ",
    ],
    // 7 — tuzoq yo'lagi
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                  D ",
      "                    ",
      "     ^  F  ^  F  ^  ",
      "#### ## ## ## ## ###",
      "                    ",
    ],
    // 8 — tor sakrash
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                  D ",
      "                    ",
      "      ^    ^     ^  ",
      "###  ###  ###  #####",
      "                    ",
    ],
    // 9 — jarlik ko'prigi
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                  D ",
      "     ##   ##   ##   ",
      "         ^^^^       ",
      "####            ####",
      "                    ",
    ],
    // 10 — aldov platformalar
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S                 ",
      "                    ",
      "                  D ",
      "    FF    FF    FF  ",
      "       ^      ^     ",
      "###   ###   ###  ###",
      "                    ",
    ],
    // 11 — nayza dengizi
    [
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "                    ",
      "  S              D  ",
      "  ###   ###   ### ##",
      " ^^^  ^^^  ^^^  ^^^ ",
      "                    ",
      "                    ",
    ],
    // 12 — final
    [
      "                    ",
      "                    ",
      "      FF      FF    ",
      "                    ",
      "    ###   W   ###   ",
      "  S                 ",
      "          ###       ",
      "                  D ",
      "     ###       ###  ",
      "      ^   ^    ^    ",
      "###  ##  ###  ##  ##",
      "                    ",
    ],
  ];

  // ── holat ──
  let levelIdx = 0, deaths = 0;
  let world = null;        // { cols, rows, W, H, tiles[], start, door, known }
  let player = null;
  let state = 'menu';      // menu | play | dead | done | win
  let deadT = 0, winT = 0, flashT = 0, shakeT = 0;
  const fog = [];

  const keys = { left: false, right: false, jump: false, jumpHeld: false };

  // ── level parse ──
  function buildLevel(idx, keepKnown) {
    const rows = LEVELS[idx];
    const cols = Math.max(...rows.map(r => r.length));
    const H = rows.length * TILE, W = cols * TILE;
    const tiles = []; let start = null, door = null;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = rows[r][c] || ' ';
        const x = c * TILE, y = r * TILE;
        if (ch === '#' || ch === 'F' || ch === '^' || ch === 'W') {
          tiles.push({ c, r, x, y, w: TILE, h: TILE,
            type: ch === '#' ? 'solid' : ch === 'F' ? 'fake' : ch === '^' ? 'spike' : 'wall',
            solid: ch !== '^', intact: true, reveal: 0, crumble: -1 });
        } else if (ch === 'S') start = { x: x + TILE / 2, y: y + TILE };
        else if (ch === 'D') door = { x, y, w: TILE, h: TILE };
      }
    }
    // fallback: agar S yoki D yo'q bo'lsa
    if (!start) start = { x: TILE * 1.5, y: TILE * 2 };
    if (!door) door = { x: W - TILE * 2, y: TILE * 2, w: TILE, h: TILE };
    // eshik ostida qattiq plitka kafolati (o'yinchi turib tegishi uchun)
    const dcol = Math.round(door.x / TILE), drow = Math.round(door.y / TILE) + 1;
    if (drow < rows.length && !tiles.some(t => t.c === dcol && t.r === drow && t.solid)) {
      tiles.push({ c: dcol, r: drow, x: dcol * TILE, y: drow * TILE, w: TILE, h: TILE,
        type: 'solid', solid: true, intact: true, reveal: 0, crumble: -1 });
    }
    const known = keepKnown && world && world.knownByIdx === idx ? world.known : {};
    return { cols, rows: rows.length, W, H, tiles, start, door, known, knownByIdx: idx };
  }

  function keyOf(t) { return t.c + ',' + t.r; }

  function spawn() {
    player = { x: world.start.x - 15, y: world.start.y - 38, w: 30, h: 38, vx: 0, vy: 0,
      grounded: false, coyote: 0, buffer: 0, face: 1, blink: 0, grace: 0.25 };
    // o'yinchini spawn ustunidagi eng yaqin qattiq plitkaga tushiramiz va uni ma'lum qilamiz
    let g = null;
    for (const t of world.tiles) {
      if (t.type === 'spike' || !t.solid) continue;
      if (world.start.x >= t.x && world.start.x <= t.x + t.w && t.y >= world.start.y - 6) {
        if (!g || t.y < g.y) g = t;
      }
    }
    if (g) { player.y = g.y - player.h; player.vy = 0; g.reveal = 1; world.known[keyOf(g)] = 'solid'; }
  }

  function loadLevel(idx) {
    levelIdx = idx;
    world = buildLevel(idx, false);
    world.known = {};
    spawn();
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1);
    state = 'play';
  }
  function retry() {
    const keep = world.known;
    world = buildLevel(levelIdx, false);
    world.known = keep; world.knownByIdx = levelIdx;
    spawn();
    state = 'play';
  }

  function die() {
    if (state !== 'play') return;
    deaths++; document.getElementById('deathPill').textContent = '☠ ' + deaths;
    state = 'dead'; deadT = 0; shakeT = 0.4; flashT = 0.18;
    if (window.Analytics) try { Analytics.track('death', { game: 'korinmas', level: levelIdx + 1 }); } catch (e) {}
  }
  function reveal(t, learnType) {
    t.reveal = 1;
    world.known[keyOf(t)] = learnType || (t.type === 'fake' ? 'fake' : t.type);
  }

  // ── fizika ──
  const GRAV = 2400, MOVE = 300, ACC = 3200, JUMP = -760, MAXFALL = 1400;

  function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function update(dt) {
    for (const f of fog) { f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < -40) f.x = world.W + 40; if (f.x > world.W + 40) f.x = -40;
      if (f.y < -40) f.y = world.H + 40; if (f.y > world.H + 40) f.y = -40; }
    if (flashT > 0) flashT -= dt; if (shakeT > 0) shakeT -= dt;

    if (state === 'dead') { deadT += dt; if (deadT > 0.55) retry(); return; }
    if (state === 'win') { winT += dt; return; }
    if (state !== 'play') return;

    const p = player;
    if (p.grace > 0) p.grace -= dt;
    // gorizontal
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) p.face = dir;
    const target = dir * MOVE;
    p.vx += Math.max(-ACC * dt, Math.min(ACC * dt, target - p.vx));
    if (!dir) p.vx *= Math.pow(0.001, dt); // ishqalanish
    // sakrash (buffer + coyote)
    p.coyote = p.grounded ? 0.09 : Math.max(0, p.coyote - dt);
    if (keys.jump) { p.buffer = 0.1; keys.jump = false; } else p.buffer = Math.max(0, p.buffer - dt);
    if (p.buffer > 0 && p.coyote > 0) { p.vy = JUMP; p.grounded = false; p.coyote = 0; p.buffer = 0; }
    if (!keys.jumpHeld && p.vy < 0) p.vy *= Math.pow(0.02, dt); // past sakrash
    p.vy = Math.min(MAXFALL, p.vy + GRAV * dt);

    // gorizontal harakat + kolliziya
    p.x += p.vx * dt;
    for (const t of world.tiles) {
      if (!t.solid || !t.intact) continue;
      if (aabb(p, t)) {
        reveal(t);
        if (p.vx > 0) p.x = t.x - p.w; else if (p.vx < 0) p.x = t.x + t.w;
        p.vx = 0;
      }
    }
    // vertikal harakat + kolliziya
    p.grounded = false;
    p.y += p.vy * dt;
    for (const t of world.tiles) {
      if (!t.solid || !t.intact) continue;
      if (aabb(p, t)) {
        reveal(t);
        if (p.vy > 0) { p.y = t.y - p.h; p.grounded = true;
          if (t.type === 'fake' && t.crumble < 0) t.crumble = 0.28; // qulay boshlaydi
        } else if (p.vy < 0) { p.y = t.y + t.h; }
        p.vy = 0;
      }
    }
    // soxta plitkalar qulashi
    for (const t of world.tiles) {
      if (t.type === 'fake' && t.crumble >= 0 && t.intact) {
        t.crumble -= dt; if (t.crumble <= 0) t.intact = false;
      }
      if (t.reveal > 0) t.reveal = Math.max(0, t.reveal - dt / 0.7);
    }
    // nayzalar — o'lim
    for (const t of world.tiles) {
      if (t.type === 'spike') {
        const s = { x: t.x + 6, y: t.y + 6, w: t.w - 12, h: t.h - 12 };
        if (aabb(p, s)) { reveal(t); if (p.grace > 0) continue; return die(); }
      }
    }
    // pastga qulash — o'lim
    if (p.y > world.H + 60) return die();
    if (p.x < -60 || p.x > world.W + 60) return die();
    // eshik — g'alaba
    if (aabb(p, world.door)) return levelDone();
  }

  function levelDone() {
    if (levelIdx + 1 < LEVELS.length) {
      flashT = 0.25; loadLevel(levelIdx + 1);
    } else {
      state = 'win'; winT = 0;
      showPanel(true, "🎉 Tabriklaymiz!", "Barcha bosqichlarni yakunlading — " + deaths + " o'lim bilan. Ko'rinmasni eslab qolding!", "↻ Qaytadan");
      if (window.Analytics) try { Analytics.track('win', { game: 'korinmas', deaths }); } catch (e) {}
    }
  }

  // ── render ──
  let SCALE = 1, OX = 0, OY = 0;
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (world) {
      const pad = 46;
      SCALE = Math.min((innerWidth - pad) / world.W, (innerHeight - pad) / world.H);
      OX = (innerWidth - world.W * SCALE) / 2;
      OY = (innerHeight - world.H * SCALE) / 2;
    }
  }

  function render() {
    ctx.save();
    ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (!world) { ctx.restore(); return; }
    let sx = 0, sy = 0;
    if (shakeT > 0) { sx = (Math.random() - 0.5) * 10 * shakeT; sy = (Math.random() - 0.5) * 10 * shakeT; }
    ctx.translate(OX + sx, OY + sy); ctx.scale(SCALE, SCALE);

    // maydon foni + ramka
    ctx.fillStyle = '#080b16'; ctx.fillRect(0, 0, world.W, world.H);
    // nozik nuqta-panjara (masofani chamalash uchun; qaysi katak qattiq ekanini bermaydi)
    ctx.fillStyle = 'rgba(120,160,255,0.07)';
    for (let x = 0; x <= world.W; x += TILE) for (let y = 0; y <= world.H; y += TILE) {
      ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill();
    }
    // tuman
    for (const f of fog) { ctx.globalAlpha = f.a; ctx.fillStyle = '#9fb4e6';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // ramka
    ctx.strokeStyle = 'rgba(120,160,255,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, world.W - 2, world.H - 2);

    // ma'lum (breadcrumb) belgilar — xotira xaritasi
    for (const t of world.tiles) {
      const k = world.known[keyOf(t)];
      if (!k || t.reveal > 0.02) continue;
      const cx = t.x + TILE / 2, cy = t.y + TILE / 2;
      const col = k === 'fake' ? 'rgba(244,114,182,0.5)' : k === 'spike' ? 'rgba(251,113,133,0.55)'
        : k === 'wall' ? 'rgba(167,139,250,0.5)' : 'rgba(34,211,238,0.42)';
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.strokeRect(t.x + 6, t.y + 6, TILE - 12, TILE - 12);
      ctx.fillStyle = col;
      if (k === 'spike') { ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('✕', cx, cy + 5); }
      else if (k === 'fake') { ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('~', cx, cy + 5); }
    }

    // yonayotgan (yaqinda tegilgan) plitkalar
    for (const t of world.tiles) {
      if (t.reveal <= 0.02) continue;
      const a = t.reveal;
      if (t.type === 'spike') {
        ctx.fillStyle = `rgba(251,113,133,${0.9 * a})`;
        for (let i = 0; i < 3; i++) { const bx = t.x + 6 + i * ((TILE - 12) / 3);
          ctx.beginPath(); ctx.moveTo(bx, t.y + TILE - 6); ctx.lineTo(bx + (TILE - 12) / 6, t.y + 8);
          ctx.lineTo(bx + (TILE - 12) / 3, t.y + TILE - 6); ctx.fill(); }
      } else {
        const solid = t.intact;
        const base = t.type === 'fake' ? [244, 114, 182] : t.type === 'wall' ? [167, 139, 250] : [34, 211, 238];
        ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${(t.type === 'fake' ? 0.28 : 0.34) * a * (solid ? 1 : 0.3)})`;
        rr(t.x + 2, t.y + 2, TILE - 4, TILE - 4, 7); ctx.fill();
        ctx.strokeStyle = `rgba(${base[0]},${base[1]},${base[2]},${0.9 * a})`; ctx.lineWidth = 2;
        rr(t.x + 2, t.y + 2, TILE - 4, TILE - 4, 7); ctx.stroke();
        ctx.shadowColor = `rgba(${base[0]},${base[1]},${base[2]},${a})`; ctx.shadowBlur = 16 * a;
        ctx.stroke(); ctx.shadowBlur = 0;
      }
    }

    // eshik (ko'rinadi)
    const d = world.door, dcx = d.x + d.w / 2, pulse = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    ctx.save();
    ctx.shadowColor = 'rgba(52,211,153,0.9)'; ctx.shadowBlur = 22 * pulse;
    ctx.fillStyle = 'rgba(52,211,153,0.16)'; rr(d.x + 5, d.y + 2, d.w - 10, d.h - 2, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(52,211,153,0.95)'; ctx.lineWidth = 3; rr(d.x + 5, d.y + 2, d.w - 10, d.h - 2, 9); ctx.stroke();
    ctx.restore();
    ctx.font = '22px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🚪', dcx, d.y + d.h - 12);

    // o'yinchi — nurli sharcha
    if (player && state !== 'win') {
      const p = player;
      const dead = state === 'dead';
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      // yumshoq nur (plitkalarni ochmaydi — faqat bezak)
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 70);
      g.addColorStop(0, dead ? 'rgba(251,113,133,0.5)' : 'rgba(34,211,238,0.42)');
      g.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, 7); ctx.fill();
      // tana
      ctx.fillStyle = dead ? '#fb7185' : '#eaf7ff';
      rr(p.x, p.y, p.w, p.h, 9); ctx.fill();
      ctx.strokeStyle = dead ? 'rgba(251,113,133,0.9)' : 'rgba(34,211,238,0.9)'; ctx.lineWidth = 2;
      rr(p.x, p.y, p.w, p.h, 9); ctx.stroke();
      // ko'zlar
      ctx.fillStyle = '#0a1420';
      const ex = p.face > 0 ? 4 : -4;
      ctx.beginPath(); ctx.arc(cx - 6 + ex, p.y + 15, 3, 0, 7); ctx.arc(cx + 6 + ex, p.y + 15, 3, 0, 7); ctx.fill();
    }

    ctx.restore();
    // flash
    if (flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.5, flashT * 2)})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
    ctx.restore();
  }

  function rr(x, y, w, h, r) { ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ── loop ──
  let last = 0;
  function frame(t) {
    const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t;
    if (state === 'play' || state === 'dead' || state === 'win') update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ── panel ──
  const panel = document.getElementById('panel');
  function showPanel(show, title, sub, btn) {
    if (show) {
      if (title) panel.querySelector('h1').textContent = title;
      if (sub) document.getElementById('cardSub').innerHTML = sub;
      if (btn) document.getElementById('startBtn').textContent = btn;
      panel.classList.remove('hidden');
    } else panel.classList.add('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    showPanel(false);
    if (state === 'win' || state === 'menu') { deaths = 0; document.getElementById('deathPill').textContent = '☠ 0'; loadLevel(0); }
  });

  // ── input ──
  const kmap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  const jkeys = ['Space', 'ArrowUp', 'KeyW'];
  addEventListener('keydown', e => {
    if (kmap[e.code]) { keys[kmap[e.code]] = true; e.preventDefault(); }
    if (jkeys.includes(e.code)) { keys.jump = true; keys.jumpHeld = true; e.preventDefault(); }
  });
  addEventListener('keyup', e => {
    if (kmap[e.code]) keys[kmap[e.code]] = false;
    if (jkeys.includes(e.code)) keys.jumpHeld = false;
  });
  // touch
  function hold(id, on, off) {
    const el = document.getElementById(id);
    const s = e => { e.preventDefault(); on(); };
    const en = e => { e.preventDefault(); off(); };
    el.addEventListener('touchstart', s, { passive: false }); el.addEventListener('mousedown', s);
    el.addEventListener('touchend', en, { passive: false }); el.addEventListener('touchcancel', en); el.addEventListener('mouseup', en); el.addEventListener('mouseleave', en);
  }
  hold('btnLeft', () => keys.left = true, () => keys.left = false);
  hold('btnRight', () => keys.right = true, () => keys.right = false);
  hold('btnJump', () => { keys.jump = true; keys.jumpHeld = true; }, () => keys.jumpHeld = false);
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.getElementById('touch').style.display = 'block';

  // ── init ──
  for (let i = 0; i < 40; i++) fog.push({ x: Math.random() * 900, y: Math.random() * 520,
    vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 8, r: 20 + Math.random() * 60, a: 0.015 + Math.random() * 0.03 });
  world = buildLevel(0, false); // fit uchun
  fit(); addEventListener('resize', fit);
  requestAnimationFrame(frame);
})();
