(function () {
  "use strict";

  // Bir Nafas — bir tugmali "shish/kichray" o'yini.
  // Umumiy neon tizim: ../_shared/neon.css + FX (../_shared/fx.js).
  // MANTIQ o'zgarmagan — faqat chizish (render) FX'ga ko'chirildi.

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;
  var H = canvas.height;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * DPR; canvas.height = H * DPR; ctx.scale(DPR, DPR);

  var animT = 0;

  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var finalScoreEl = document.getElementById("finalScore");
  var finalBestEl = document.getElementById("finalBest");
  var startOverlay = document.getElementById("startOverlay");
  var overOverlay = document.getElementById("overOverlay");
  var startBtn = document.getElementById("startBtn");
  var againBtn = document.getElementById("againBtn");

  var BEST_KEY = "bir-nafas-best";

  // ---- Tuning constants -------------------------------------------------
  var MIN_R = 12;          // smallest radius (released)
  var MAX_R = 34;          // largest radius (held)
  var GROW_RATE = 55;      // radius units per second while held
  var SHRINK_RATE = 45;    // radius units per second while released
  var LIFT = 340;          // upward acceleration while held (px/s^2)
  var GRAVITY = 300;       // downward acceleration while released (px/s^2)
  var MAX_VY = 200;        // clamp vertical speed
  var PLAYER_X = 96;       // fixed horizontal position of player

  var BASE_SPEED = 105;    // scroll speed px/s
  var SPEED_GAIN = 4;      // speed added per second alive
  var MAX_SPEED = 320;
  var SPAWN_GAP_PX = 220;  // horizontal distance between barriers
  var BAR_W = 42;          // barrier width

  // ---- State ------------------------------------------------------------
  var STATE = { START: 0, PLAY: 1, OVER: 2 };
  var state = STATE.START;

  var player, bars, speed, distSinceSpawn, score, best, held, lastTs;

  best = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
  if (isNaN(best)) best = 0;
  bestEl.textContent = best;

  function reset() {
    player = { x: PLAYER_X, y: H / 2, r: MIN_R, vy: 0 };
    bars = [];
    speed = BASE_SPEED;
    distSinceSpawn = SPAWN_GAP_PX; // spawn one immediately
    score = 0;
    held = false;
    lastTs = 0;
    FX.reset();
    scoreEl.textContent = "0";
  }

  function spawnBar() {
    // gap height varies: some narrow (force shrink), some wide.
    var minGap = MAX_R * 2 + 18;          // ~86 — mid-size ball always fits
    var maxGap = MAX_R * 2 + 64;          // ~132
    var gapH = minGap + Math.random() * (maxGap - minGap);
    var margin = 24;
    var gapY = margin + Math.random() * (H - gapH - margin * 2);
    bars.push({ x: W + BAR_W, gapY: gapY, gapH: gapH, w: BAR_W, passed: false });
  }

  function update(dt) {
    // Grow/shrink
    if (held) {
      player.r += GROW_RATE * dt;
      if (player.r > MAX_R) player.r = MAX_R;
      player.vy -= LIFT * dt;
    } else {
      player.r -= SHRINK_RATE * dt;
      if (player.r < MIN_R) player.r = MIN_R;
      player.vy += GRAVITY * dt;
    }
    if (player.vy > MAX_VY) player.vy = MAX_VY;
    if (player.vy < -MAX_VY) player.vy = -MAX_VY;
    player.y += player.vy * dt;

    // Top/bottom edge = game over
    if (player.y - player.r <= 0 || player.y + player.r >= H) {
      return gameOver();
    }

    // Speed ramp
    speed += SPEED_GAIN * dt;
    if (speed > MAX_SPEED) speed = MAX_SPEED;

    // Spawn barriers by distance
    distSinceSpawn += speed * dt;
    if (distSinceSpawn >= SPAWN_GAP_PX) {
      distSinceSpawn -= SPAWN_GAP_PX;
      spawnBar();
    }

    // Move barriers, scoring & collision
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      b.x -= speed * dt;

      if (!b.passed && b.x + b.w < player.x - player.r) {
        b.passed = true;
        score += 1;
        scoreEl.textContent = score;
        FX.burst(player.x + player.r, player.y, "#34d399", 12);
      }

      if (hitBar(player, b)) {
        return gameOver();
      }
    }

    // Remove off-screen barriers
    while (bars.length && bars[0].x + bars[0].w < -10) {
      bars.shift();
    }
  }

  // Circle vs the two solid rectangles of a barrier (above and below gap).
  function hitBar(p, b) {
    var left = b.x;
    var right = b.x + b.w;
    // Only relevant when overlapping horizontally-ish; circle test handles rest.
    if (p.x + p.r < left || p.x - p.r > right) return false;
    // Top block: from y=0 to gapY
    if (circleRect(p.x, p.y, p.r, left, 0, b.w, b.gapY)) return true;
    // Bottom block: from gapY+gapH to H
    var bottomY = b.gapY + b.gapH;
    if (circleRect(p.x, p.y, p.r, left, bottomY, b.w, H - bottomY)) return true;
    return false;
  }

  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    var nx = Math.max(rx, Math.min(cx, rx + rw));
    var ny = Math.max(ry, Math.min(cy, ry + rh));
    var dx = cx - nx;
    var dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  // ---- Rendering (FX neon) ---------------------------------------------
  function draw() {
    FX.starfield(ctx, W, H, animT);
    var shaken = FX.applyShake(ctx);

    for (var i = 0; i < bars.length; i++) drawBar(bars[i]);
    drawPlayer();
    FX.render(ctx);

    if (shaken) FX.restore(ctx);
  }

  function drawBar(b) {
    var bottomY = b.gapY + b.gapH;
    // to'siqlar — binafsha neon; teshik (gap) ochiq qoladi.
    FX.glowRect(ctx, b.x, -6, b.w, b.gapY + 6, "#a78bfa", 8, 14);
    FX.glowRect(ctx, b.x, bottomY, b.w, H - bottomY + 6, "#a78bfa", 8, 14);
  }

  function drawPlayer() {
    var p = player;
    // yumshoq porlovchi cyan doira
    FX.glowCircle(ctx, p.x, p.y, p.r, "#22d3ee", 24);
    // yorug'lik nuqtasi
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(p.x - p.r * 0.32, p.y - p.r * 0.32, Math.max(2, p.r * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---- Loop -------------------------------------------------------------
  function frame(ts) {
    if (state !== STATE.PLAY) return;
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05; // clamp big jumps

    animT = ts;
    update(dt);
    FX.update(16);
    if (state === STATE.PLAY) {
      draw();
      requestAnimationFrame(frame);
    }
  }

  function startGame() {
    reset();
    state = STATE.PLAY;
    startOverlay.classList.add("hidden");
    overOverlay.classList.add("hidden");
    lastTs = 0;
    requestAnimationFrame(frame);
  }

  function gameOver() {
    state = STATE.OVER;
    FX.burst(player.x, player.y, "#f472b6", 26);
    FX.shake(7);
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    bestEl.textContent = best;
    finalScoreEl.textContent = score;
    finalBestEl.textContent = best;
    FX.update(16);
    draw();
    overOverlay.classList.remove("hidden");
  }

  // ---- Input ------------------------------------------------------------
  function press() {
    if (state === STATE.PLAY) held = true;
  }
  function release() {
    held = false;
  }

  // Keyboard
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      if (state === STATE.START) { startGame(); return; }
      if (state === STATE.OVER) { startGame(); return; }
      press();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      release();
    }
  });

  // Pointer / touch on the canvas
  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    press();
  });
  window.addEventListener("pointerup", function () {
    release();
  });
  window.addEventListener("pointercancel", function () {
    release();
  });
  // Fallback for touch (older browsers without Pointer Events)
  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    press();
  }, { passive: false });
  canvas.addEventListener("touchend", function (e) {
    e.preventDefault();
    release();
  }, { passive: false });

  startBtn.addEventListener("click", startGame);
  againBtn.addEventListener("click", startGame);

  // ---- Init draw --------------------------------------------------------
  reset();
  draw();
})();
