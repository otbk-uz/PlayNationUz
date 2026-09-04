// ⏪ Orqaga (Rewind) — original self-rewind arcade game.
// Novel twist: the world (hazards) always runs FORWARD in time; only YOU can
// rewind — your own position is pulled backward along a recorded trail buffer.
(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;   // 480
  const H = canvas.height;  // 480
  const M = 8;              // wall margin

  // ---- HUD / overlay refs ----
  const hudLevel = document.getElementById('hudLevel');
  const hudOrbs = document.getElementById('hudOrbs');
  const meterFill = document.getElementById('meterFill');
  const startOverlay = document.getElementById('startOverlay');
  const overOverlay = document.getElementById('overOverlay');
  const winOverlay = document.getElementById('winOverlay');
  const overText = document.getElementById('overText');
  const winText = document.getElementById('winText');

  // ---- best (localStorage) ----
  const BEST_KEY = 'orqaga-best';
  let best = { levels: 0, orbs: 0 };
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      best.levels = p.levels | 0;
      best.orbs = p.orbs | 0;
    }
  } catch (e) { /* ignore */ }
  function saveBest() {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch (e) {}
  }

  // ==================== HAZARD FACTORIES ====================
  // Every hazard exposes update() and rects() -> [{cx,cy,hw,hh,angle}].
  // Hazards ALWAYS advance forward; they are never rewound.

  function block(x, y, w, h, vx, vy) {
    return {
      cx: x, cy: y, hw: w / 2, hh: h / 2, vx, vy, angle: 0,
      update() {
        this.cx += this.vx; this.cy += this.vy;
        if (this.cx - this.hw < M) { this.cx = M + this.hw; this.vx = Math.abs(this.vx); }
        if (this.cx + this.hw > W - M) { this.cx = W - M - this.hw; this.vx = -Math.abs(this.vx); }
        if (this.cy - this.hh < M) { this.cy = M + this.hh; this.vy = Math.abs(this.vy); }
        if (this.cy + this.hh > H - M) { this.cy = H - M - this.hh; this.vy = -Math.abs(this.vy); }
      },
      rects() { return [{ cx: this.cx, cy: this.cy, hw: this.hw, hh: this.hh, angle: 0 }]; }
    };
  }

  // A sweeping bar is just a long/thin bouncing block (own factory for clarity).
  function bar(x, y, w, h, vx, vy) { return block(x, y, w, h, vx, vy); }

  function spinner(x, y, len, thick, speed, arms) {
    arms = arms || 2;
    return {
      cx: x, cy: y, len, thick, angle: Math.random() * Math.PI, speed, arms,
      update() { this.angle += this.speed; },
      rects() {
        const out = [];
        for (let i = 0; i < this.arms; i++) {
          out.push({
            cx: this.cx, cy: this.cy,
            hw: this.len / 2, hh: this.thick / 2,
            angle: this.angle + (i * Math.PI) / this.arms
          });
        }
        return out;
      }
    };
  }

  // ==================== LEVELS ====================
  // Increasing hazard density.
  function makeLevels() {
    return [
      { // 1 — gentle intro
        start: { x: 60, y: 420 },
        exit: { x: 420, y: 60 },
        orbs: [{ x: 240, y: 240 }, { x: 400, y: 300 }],
        hazards: [
          block(200, 140, 46, 46, 2.1, 1.6),
          bar(240, 340, 150, 18, 1.7, 0)
        ]
      },
      { // 2 — a spinner appears
        start: { x: 60, y: 60 },
        exit: { x: 60, y: 420 },
        orbs: [{ x: 240, y: 90 }, { x: 400, y: 240 }, { x: 240, y: 400 }],
        hazards: [
          block(160, 200, 44, 44, 2.4, 2.0),
          bar(240, 240, 20, 160, 0, 2.0),
          spinner(360, 360, 150, 16, 0.03, 2)
        ]
      },
      { // 3 — busier arena
        start: { x: 240, y: 440 },
        exit: { x: 240, y: 40 },
        orbs: [{ x: 90, y: 240 }, { x: 390, y: 240 }, { x: 240, y: 240 }],
        hazards: [
          block(120, 120, 42, 42, 2.6, 2.2),
          block(360, 140, 42, 42, -2.3, 2.5),
          bar(240, 180, 170, 18, 2.2, 0),
          spinner(240, 300, 170, 16, -0.034, 3)
        ]
      },
      { // 4 — final crush
        start: { x: 50, y: 430 },
        exit: { x: 430, y: 50 },
        orbs: [{ x: 130, y: 130 }, { x: 350, y: 350 }, { x: 380, y: 120 }, { x: 120, y: 360 }],
        hazards: [
          block(240, 90, 40, 40, 3.0, 2.4),
          block(240, 390, 40, 40, -2.8, -2.6),
          bar(90, 240, 18, 200, 2.6, 0),
          bar(390, 240, 18, 200, -2.6, 0),
          spinner(240, 240, 180, 16, 0.04, 3)
        ]
      }
    ];
  }

  // ==================== STATE ====================
  const TRAIL_MAX = 240;      // ~4 s of history at 60fps
  const PLAYER_R = 9;
  const ORB_R = 7;
  const EXIT_SIZE = 34;

  let levels, levelIndex, hazards, orbs, exit, orbsLeft;
  let player, trail, meter;
  let orbsThisRun;
  let state = 'start'; // start | play | over | win

  const input = { up: false, down: false, left: false, right: false, rewind: false };

  function loadLevel(i) {
    const L = levels[i];
    hazards = L.hazards;
    orbs = L.orbs.map(o => ({ x: o.x, y: o.y, got: false }));
    orbsLeft = orbs.length;
    exit = { x: L.exit.x, y: L.exit.y };
    player = { x: L.start.x, y: L.start.y, vx: 0, vy: 0 };
    trail = [{ x: player.x, y: player.y }];
    meter = 1;
    if (window.FX) FX.reset();
    updateHud();
  }

  function startGame() {
    levels = makeLevels();
    levelIndex = 0;
    orbsThisRun = 0;
    loadLevel(0);
    state = 'play';
    startOverlay.classList.add('hidden');
    overOverlay.classList.add('hidden');
    winOverlay.classList.add('hidden');
  }

  function gameOver(msg) {
    state = 'over';
    // record best
    const clearedLevels = levelIndex; // fully cleared levels
    if (clearedLevels > best.levels) best.levels = clearedLevels;
    if (orbsThisRun > best.orbs) best.orbs = orbsThisRun;
    saveBest();
    overText.textContent = (msg || 'Xavfga tegding!') +
      ' Rekord: ' + best.levels + ' bosqich, ' + best.orbs + ' orb.';
    overOverlay.classList.remove('hidden');
  }

  function winGame() {
    state = 'win';
    if (levels.length > best.levels) best.levels = levels.length;
    if (orbsThisRun > best.orbs) best.orbs = orbsThisRun;
    saveBest();
    winText.textContent = 'Barcha bosqichlar tugadi! ' + orbsThisRun +
      ' orb yig\'ildi. Rekord: ' + best.levels + ' bosqich.';
    winOverlay.classList.remove('hidden');
  }

  function nextLevel() {
    levelIndex++;
    if (levelIndex >= levels.length) {
      winGame();
    } else {
      loadLevel(levelIndex);
    }
  }

  function updateHud() {
    hudLevel.textContent = String((levelIndex | 0) + 1);
    hudOrbs.textContent = String(orbsLeft);
    const pct = Math.max(0, Math.min(1, meter)) * 100;
    meterFill.style.width = pct.toFixed(0) + '%';
    if (meter < 0.25) meterFill.classList.add('low');
    else meterFill.classList.remove('low');
  }

  // ==================== PHYSICS ====================
  const ACCEL = 0.62;
  const MAXV = 3.3;
  const FRICTION = 0.85;
  const REWIND_POP = 2;          // history points consumed per frame
  const METER_DRAIN = 1 / 120;   // ~2 s of hold empties full meter
  const METER_RECHARGE = 1 / 240;// ~4 s to refill

  let isRewinding = false;

  function step() {
    if (state !== 'play') return;

    const wantRewind = input.rewind && meter > 0.02 && trail.length > 1;
    isRewinding = wantRewind;

    if (wantRewind) {
      // Pull player backward along recorded trail; hazards keep moving forward.
      for (let k = 0; k < REWIND_POP && trail.length > 1; k++) trail.pop();
      const p = trail[trail.length - 1];
      player.x = p.x; player.y = p.y;
      player.vx = 0; player.vy = 0;
      meter = Math.max(0, meter - METER_DRAIN);
    } else {
      // Normal control with smooth velocity.
      let ax = 0, ay = 0;
      if (input.left) ax -= 1;
      if (input.right) ax += 1;
      if (input.up) ay -= 1;
      if (input.down) ay += 1;
      if (ax || ay) {
        const inv = 1 / Math.hypot(ax, ay);
        player.vx += ax * inv * ACCEL;
        player.vy += ay * inv * ACCEL;
      } else {
        player.vx *= FRICTION;
        player.vy *= FRICTION;
      }
      const sp = Math.hypot(player.vx, player.vy);
      if (sp > MAXV) { player.vx = player.vx / sp * MAXV; player.vy = player.vy / sp * MAXV; }
      player.x += player.vx;
      player.y += player.vy;
      // walls
      if (player.x < M + PLAYER_R) { player.x = M + PLAYER_R; player.vx = 0; }
      if (player.x > W - M - PLAYER_R) { player.x = W - M - PLAYER_R; player.vx = 0; }
      if (player.y < M + PLAYER_R) { player.y = M + PLAYER_R; player.vy = 0; }
      if (player.y > H - M - PLAYER_R) { player.y = H - M - PLAYER_R; player.vy = 0; }
      // record history
      trail.push({ x: player.x, y: player.y });
      if (trail.length > TRAIL_MAX) trail.shift();
      // recharge meter when not rewinding
      meter = Math.min(1, meter + METER_RECHARGE);
    }

    // Hazards ALWAYS advance forward, even during rewind.
    for (let i = 0; i < hazards.length; i++) hazards[i].update();

    // Collisions with hazards.
    for (let i = 0; i < hazards.length; i++) {
      const rs = hazards[i].rects();
      for (let j = 0; j < rs.length; j++) {
        if (circleRect(player.x, player.y, PLAYER_R, rs[j])) {
          if (window.FX) { FX.burst(player.x, player.y, '#fb7185', 20); FX.shake(7); }
          gameOver('Xavfga tegding!');
          return;
        }
      }
    }

    // Orb collection.
    for (let i = 0; i < orbs.length; i++) {
      const o = orbs[i];
      if (!o.got && dist2(player.x, player.y, o.x, o.y) <= (PLAYER_R + ORB_R) * (PLAYER_R + ORB_R)) {
        o.got = true;
        orbsLeft--;
        orbsThisRun++;
        if (window.FX) FX.burst(o.x, o.y, '#fbbf24');
      }
    }

    // Exit when all orbs collected.
    if (orbsLeft <= 0) {
      const er = { cx: exit.x, cy: exit.y, hw: EXIT_SIZE / 2, hh: EXIT_SIZE / 2, angle: 0 };
      if (circleRect(player.x, player.y, PLAYER_R, er)) {
        if (window.FX) FX.burst(exit.x, exit.y, '#34d399', 22, 4);
        nextLevel();
        return;
      }
    }

    updateHud();
  }

  // ==================== COLLISION HELPERS ====================
  function circleRect(cx, cy, r, rect) {
    const dx = cx - rect.cx, dy = cy - rect.cy;
    const cos = Math.cos(-rect.angle), sin = Math.sin(-rect.angle);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const clx = Math.max(-rect.hw, Math.min(rect.hw, lx));
    const cly = Math.max(-rect.hh, Math.min(rect.hh, ly));
    const ddx = lx - clx, ddy = ly - cly;
    return ddx * ddx + ddy * ddy <= r * r;
  }
  function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

  // ==================== RENDER ====================
  function drawRotRect(rect, fill, blur) {
    ctx.save();
    ctx.shadowColor = fill;
    ctx.shadowBlur = blur || 12;
    ctx.translate(rect.cx, rect.cy);
    ctx.rotate(rect.angle);
    ctx.fillStyle = fill;
    ctx.fillRect(-rect.hw, -rect.hh, rect.hw * 2, rect.hh * 2);
    ctx.restore();
  }

  function render() {
    // animatsion neon fon
    if (window.FX) FX.starfield(ctx, W, H, performance.now());
    else { ctx.fillStyle = '#070b14'; ctx.fillRect(0, 0, W, H); }

    const shaken = window.FX ? FX.applyShake(ctx) : false;

    // maydon chegarasi
    ctx.save();
    ctx.strokeStyle = 'rgba(120,160,255,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(M, M, W - 2 * M, H - 2 * M);
    ctx.restore();

    // exit — kuchli porlash
    if (exit) {
      const unlocked = orbsLeft <= 0;
      const s = EXIT_SIZE;
      if (window.FX) {
        FX.glowRect(ctx, exit.x - s / 2, exit.y - s / 2, s, s,
          unlocked ? '#34d399' : 'rgba(52,211,153,0.28)', 7, unlocked ? 26 : 8);
      }
    }

    // orbs — amber porlash
    for (let i = 0; i < orbs.length; i++) {
      const o = orbs[i];
      if (o.got) continue;
      if (window.FX) FX.glowCircle(ctx, o.x, o.y, ORB_R, '#fbbf24', 14);
    }

    // hazards — danger porlash
    for (let i = 0; i < hazards.length; i++) {
      const rs = hazards[i].rects();
      for (let j = 0; j < rs.length; j++) {
        drawRotRect(rs[j], '#fb7185', 14);
      }
    }

    // trail — iz (rewindda binafsha, aks holda moviy)
    if (trail && trail.length > 1) {
      const base = isRewinding ? '167,139,250' : '34,211,238';
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const a = i / trail.length;
        ctx.fillStyle = 'rgba(' + base + ',' +
          (isRewinding ? (0.08 + a * 0.5) : (0.03 + a * 0.18)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2 + a * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // player — kuchli porlash
    if (player) {
      if (window.FX) {
        FX.glowCircle(ctx, player.x, player.y, PLAYER_R,
          isRewinding ? '#a78bfa' : '#22d3ee', isRewinding ? 28 : 20);
      }
      ctx.save();
      ctx.fillStyle = '#eaf2ff';
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_R * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // zarrachalar
    if (window.FX) { FX.update(16); FX.render(ctx); }

    if (shaken) FX.restore(ctx);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ==================== LOOP ====================
  function frame() {
    step();
    render();
    requestAnimationFrame(frame);
  }

  // ==================== INPUT ====================
  const keyMap = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyR: 'rewind'
  };
  window.addEventListener('keydown', e => {
    const k = keyMap[e.code];
    if (k) { input[k] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', e => {
    const k = keyMap[e.code];
    if (k) { input[k] = false; e.preventDefault(); }
  });

  // touch d-pad
  document.querySelectorAll('.pad').forEach(btn => {
    const dir = btn.getAttribute('data-dir');
    const on = e => { input[dir] = true; e.preventDefault(); };
    const off = e => { input[dir] = false; e.preventDefault(); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  });

  // rewind button (held)
  const rewindBtn = document.getElementById('rewindBtn');
  const rewindOn = e => { input.rewind = true; rewindBtn.classList.add('active'); e.preventDefault(); };
  const rewindOff = e => { input.rewind = false; rewindBtn.classList.remove('active'); e.preventDefault(); };
  rewindBtn.addEventListener('pointerdown', rewindOn);
  rewindBtn.addEventListener('pointerup', rewindOff);
  rewindBtn.addEventListener('pointerleave', rewindOff);
  rewindBtn.addEventListener('pointercancel', rewindOff);

  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);
  document.getElementById('againBtn').addEventListener('click', startGame);

  // ==================== INIT ====================
  levels = makeLevels();
  levelIndex = 0;
  orbsThisRun = 0;
  loadLevel(0);       // draw first level behind the start overlay
  state = 'start';
  requestAnimationFrame(frame);
})();
