(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");

  var W = canvas.width;   // 480
  var H = canvas.height;  // 480
  var LANE_H = H / 3;     // 160

  // Lane vertical centers: 0 = top, 1 = middle, 2 = bottom
  var LANE_Y = [LANE_H * 0.5, LANE_H * 1.5, LANE_H * 2.5]; // 80, 240, 400

  var PLAYER_X = 96;
  var BLOB_R = 20;

  var OBST_W = 36;
  var OBST_H = 110;

  // Colors pulled from CSS variables (with fallbacks)
  var css = getComputedStyle(document.documentElement);
  function v(name, fallback) {
    var c = css.getPropertyValue(name);
    return (c && c.trim()) || fallback;
  }
  var COL = {
    line: v("--line", "#30363d"),
    text: v("--text", "#e6edf3"),
    muted: v("--muted", "#8b949e"),
    accent: v("--accent", "#58a6ff"),
    danger: v("--danger", "#f85149"),
    good: v("--good", "#3fb950"),
    panel: v("--panel", "#161b22")
  };

  var BEST_KEY = "bolinish-best";

  // ---- Game state ----
  var STATE = { START: 0, PLAYING: 1, OVER: 2 };
  var state = STATE.START;

  // split progress: 0 = merged (middle), 1 = split (top + bottom)
  var splitProg = 0;
  var splitTarget = 0;      // 0 or 1
  var SPLIT_SPEED = 8;      // units per second (transition ~0.13s)

  var obstacles = [];
  var score = 0;
  var best = 0;
  var speed = 150;          // px per second
  var distSinceSpawn = 0;
  var nextGap = 210;        // px between waves
  var lastTime = 0;

  // ---- DOM ----
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var finalScoreEl = document.getElementById("finalScore");
  var finalBestEl = document.getElementById("finalBest");
  var startOverlay = document.getElementById("startOverlay");
  var overOverlay = document.getElementById("overOverlay");
  var startBtn = document.getElementById("startBtn");
  var retryBtn = document.getElementById("retryBtn");

  function loadBest() {
    var b = 0;
    try {
      b = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
    } catch (e) { b = 0; }
    return b;
  }
  function saveBest(val) {
    try { localStorage.setItem(BEST_KEY, String(val)); } catch (e) {}
  }

  best = loadBest();
  bestEl.textContent = best;

  // ---- Wave spawning (always survivable) ----
  // Types:
  //   "middle"      -> obstacle in middle only  => player must SPLIT
  //   "top"         -> obstacle top only        => player must MERGE
  //   "bottom"      -> obstacle bottom only      => player must MERGE
  //   "topbottom"   -> obstacles top + bottom    => player must MERGE
  // Never mix middle with top/bottom in the same wave (that would be impossible).
  function spawnWave() {
    var roll = Math.random();
    var lanes;
    if (roll < 0.45) {
      lanes = [1];           // middle -> split
    } else if (roll < 0.65) {
      lanes = [0];           // top -> merge
    } else if (roll < 0.85) {
      lanes = [2];           // bottom -> merge
    } else {
      lanes = [0, 2];        // top + bottom -> merge
    }
    for (var i = 0; i < lanes.length; i++) {
      obstacles.push({
        lane: lanes[i],
        x: W + OBST_W,
        passed: false
      });
    }
  }

  // ---- Blob positions given current split progress ----
  // Returns array of circles {y, r}. When merged the two halves overlap
  // in the middle and read as one blob.
  function blobYs() {
    var p = splitProg;
    // ease for nicer motion
    var e = p * p * (3 - 2 * p); // smoothstep
    var topY = LANE_Y[1] + (LANE_Y[0] - LANE_Y[1]) * e;
    var botY = LANE_Y[1] + (LANE_Y[2] - LANE_Y[1]) * e;
    return [topY, botY];
  }

  // ---- Collision: circle (blob) vs rect (obstacle) ----
  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    var nearestX = Math.max(rx, Math.min(cx, rx + rw));
    var nearestY = Math.max(ry, Math.min(cy, ry + rh));
    var dx = cx - nearestX;
    var dy = cy - nearestY;
    return dx * dx + dy * dy <= r * r;
  }

  function checkCollision() {
    var ys = blobYs();
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      var rx = o.x - OBST_W / 2;
      var ry = LANE_Y[o.lane] - OBST_H / 2;
      // quick horizontal reject
      if (rx > PLAYER_X + BLOB_R || rx + OBST_W < PLAYER_X - BLOB_R) continue;
      for (var b = 0; b < ys.length; b++) {
        if (circleRect(PLAYER_X, ys[b], BLOB_R, rx, ry, OBST_W, OBST_H)) {
          return true;
        }
      }
    }
    return false;
  }

  // ---- Input ----
  function toggle() {
    splitTarget = splitTarget === 0 ? 1 : 0;
  }

  function primaryAction() {
    if (state === STATE.START) {
      startGame();
    } else if (state === STATE.PLAYING) {
      toggle();
    } else if (state === STATE.OVER) {
      startGame();
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.key === " " || e.keyCode === 32) {
      e.preventDefault();
      primaryAction();
    }
  });

  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    primaryAction();
  });

  startBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    startGame();
  });
  retryBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    startGame();
  });

  // ---- Game flow ----
  function startGame() {
    obstacles = [];
    score = 0;
    speed = 150;
    distSinceSpawn = 0;
    nextGap = 210;
    splitProg = 0;
    splitTarget = 0;
    if (window.FX) FX.reset();
    scoreEl.textContent = "0";
    startOverlay.classList.add("hidden");
    overOverlay.classList.add("hidden");
    state = STATE.PLAYING;
    lastTime = performance.now();
    // seed first wave a bit ahead
    spawnWave();
    distSinceSpawn = -60; // small delay before it can spawn the next
  }

  function gameOver() {
    state = STATE.OVER;
    if (window.FX) {
      FX.shake(7);
      var gys = blobYs();
      for (var g = 0; g < gys.length; g++) FX.burst(PLAYER_X, gys[g], "#fb7185", 16);
    }
    if (score > best) {
      best = score;
      saveBest(best);
      bestEl.textContent = best;
    }
    finalScoreEl.textContent = score;
    finalBestEl.textContent = best;
    overOverlay.classList.remove("hidden");
  }

  // ---- Update ----
  function update(dt) {
    // ramp speed with score
    speed = Math.min(150 + score * 5, 420);
    nextGap = Math.max(210 - score * 1.4, 155);

    // animate split transition
    if (splitProg < splitTarget) {
      splitProg = Math.min(splitTarget, splitProg + SPLIT_SPEED * dt);
    } else if (splitProg > splitTarget) {
      splitProg = Math.max(splitTarget, splitProg - SPLIT_SPEED * dt);
    }

    // move obstacles
    var move = speed * dt;
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      o.x -= move;
      if (!o.passed && o.x + OBST_W / 2 < PLAYER_X - BLOB_R) {
        o.passed = true;
        score += 1;
        scoreEl.textContent = score;
        if (window.FX) FX.burst(PLAYER_X, LANE_Y[o.lane], "#34d399", 12);
      }
    }
    // cull off-screen
    obstacles = obstacles.filter(function (o) { return o.x + OBST_W / 2 > -10; });

    // spawn new waves by distance
    distSinceSpawn += move;
    if (distSinceSpawn >= nextGap) {
      distSinceSpawn = 0;
      spawnWave();
    }

    if (checkCollision()) {
      gameOver();
    }
  }

  // ---- Render ----
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawLanes() {
    // lane separators — subtle cyan glow
    if (window.FX) {
      FX.glowLine(ctx, 0, LANE_H, W, LANE_H, "rgba(34,211,238,0.28)", 1.5, 8);
      FX.glowLine(ctx, 0, LANE_H * 2, W, LANE_H * 2, "rgba(34,211,238,0.28)", 1.5, 8);
    }

    // player track marker (vertical guide)
    ctx.save();
    ctx.strokeStyle = "rgba(139, 148, 158, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PLAYER_X, 0);
    ctx.lineTo(PLAYER_X, H);
    ctx.stroke();
    ctx.restore();
  }

  function drawObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      var rx = o.x - OBST_W / 2;
      var ry = LANE_Y[o.lane] - OBST_H / 2;
      if (window.FX) {
        FX.glowRect(ctx, rx, ry, OBST_W, OBST_H, "#fb7185", 8, 16);
      } else {
        ctx.fillStyle = COL.danger;
        roundRect(rx, ry, OBST_W, OBST_H, 8);
        ctx.fill();
      }
    }
  }

  function drawBlobs() {
    var ys = blobYs();
    var merged = splitProg < 0.02;
    var CY = "#22d3ee";

    if (merged) {
      FX.glowCircle(ctx, PLAYER_X, ys[0], BLOB_R, CY, 20);
    } else {
      FX.glowCircle(ctx, PLAYER_X, ys[0], BLOB_R, CY, 20);
      FX.glowCircle(ctx, PLAYER_X, ys[1], BLOB_R, CY, 20);
      // connecting strand while splitting for a "cell division" feel
      if (splitProg < 0.6) {
        ctx.save();
        var alpha = (0.6 - splitProg) / 0.6;
        ctx.globalAlpha = alpha * 0.7;
        ctx.shadowColor = CY;
        ctx.shadowBlur = 12;
        ctx.fillStyle = CY;
        var strandW = BLOB_R * (1 - splitProg);
        ctx.fillRect(PLAYER_X - strandW, ys[0], strandW * 2, ys[1] - ys[0]);
        ctx.restore();
      }
    }

    // inner highlight
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    var pts = merged ? [ys[0]] : ys;
    for (var k = 0; k < pts.length; k++) {
      ctx.beginPath();
      ctx.arc(PLAYER_X - 6, pts[k] - 6, BLOB_R * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function render() {
    // animated neon starfield background
    if (window.FX) FX.starfield(ctx, W, H, performance.now());
    else { ctx.fillStyle = COL.panel; ctx.fillRect(0, 0, W, H); }

    var shaken = window.FX && FX.applyShake(ctx);
    drawLanes();
    drawObstacles();
    drawBlobs();
    if (window.FX) FX.render(ctx);
    if (shaken) FX.restore(ctx);
  }

  // ---- Main loop ----
  function loop(now) {
    var dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.05) dt = 0.05; // clamp big gaps (tab switches)

    if (state === STATE.PLAYING) {
      update(dt);
    }
    if (window.FX) FX.update(16);
    render();
    requestAnimationFrame(loop);
  }

  // Draw the initial (merged) state on load, then start the loop.
  render();
  lastTime = performance.now();
  requestAnimationFrame(loop);
})();
