(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;   // 480
  var H = canvas.height;  // 480

  var scoreEl = document.getElementById("score");
  var roundEl = document.getElementById("round");
  var timeEl = document.getElementById("time");

  var startOverlay = document.getElementById("startOverlay");
  var pauseOverlay = document.getElementById("pauseOverlay");
  var overOverlay = document.getElementById("overOverlay");
  var overStats = document.getElementById("overStats");

  var startBtn = document.getElementById("startBtn");
  var resumeBtn = document.getElementById("resumeBtn");
  var retryBtn = document.getElementById("retryBtn");

  var BEST_KEY = "vaqt-arvohi-best";

  // Tunables
  var WALL = 6;            // arena border thickness
  var PLAYER_SIZE = 14;    // side length of player square
  var GHOST_SIZE = 14;
  var RING_R = 8;          // ring radius
  var SPEED = 2.5;         // px per frame @60fps
  var START_TIME = 12;     // seconds
  var MIN_TIME = 8;
  var TIME_STEP = 0.5;     // decrease per round
  var RINGS_PER_ROUND = 5;
  var HIT_PAD = 2;         // collision leniency

  // State machine: "menu" | "playing" | "paused" | "over"
  var mode = "menu";

  var player, rings, ghosts, currentPath;
  var round, score, roundTime, timeLeft;
  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { best = 0; }

  var keys = {};   // held keys/dirs
  var lastTs = 0;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function newPlayer() {
    return { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  }

  function spawnRings() {
    var arr = [];
    var margin = WALL + RING_R + 8;
    for (var i = 0; i < RINGS_PER_ROUND; i++) {
      arr.push({
        x: rand(margin, W - margin),
        y: rand(margin, H - margin),
        got: false,
        // small phase for pulsing animation
        ph: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }

  function resetGame() {
    if (window.FX) FX.reset();
    round = 1;
    score = 0;
    ghosts = [];
    roundTime = START_TIME;
    startRound();
  }

  function startRound() {
    player = newPlayer();
    rings = spawnRings();
    currentPath = [];
    // reset ghost playback heads
    for (var i = 0; i < ghosts.length; i++) ghosts[i].idx = 0;
    timeLeft = roundTime;
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    roundEl.textContent = String(round);
    timeEl.textContent = timeLeft.toFixed(1);
  }

  // ---- Input ----
  var KEYMAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right"
  };

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      togglePause();
      return;
    }
    var dir = KEYMAP[e.code];
    if (dir) {
      keys[dir] = true;
      e.preventDefault();
    }
  });
  document.addEventListener("keyup", function (e) {
    var dir = KEYMAP[e.code];
    if (dir) { keys[dir] = false; e.preventDefault(); }
  });

  // Touch / on-screen pad
  var padButtons = document.querySelectorAll(".padbtn");
  padButtons.forEach(function (btn) {
    var dir = btn.getAttribute("data-dir");
    var press = function (e) { e.preventDefault(); keys[dir] = true; };
    var release = function (e) { e.preventDefault(); keys[dir] = false; };
    btn.addEventListener("touchstart", press, { passive: false });
    btn.addEventListener("touchend", release, { passive: false });
    btn.addEventListener("touchcancel", release, { passive: false });
    btn.addEventListener("mousedown", press);
    btn.addEventListener("mouseup", release);
    btn.addEventListener("mouseleave", release);
  });

  function clearKeys() {
    keys = {};
  }

  // ---- Update ----
  function update(dt) {
    // dt in seconds
    // player velocity from held directions
    var ax = 0, ay = 0;
    if (keys.left) ax -= 1;
    if (keys.right) ax += 1;
    if (keys.up) ay -= 1;
    if (keys.down) ay += 1;
    // normalize diagonal
    if (ax !== 0 && ay !== 0) {
      var inv = 1 / Math.sqrt(2);
      ax *= inv; ay *= inv;
    }
    // SPEED is px/frame @60fps -> px per second = SPEED*60
    var pps = SPEED * 60;
    player.x += ax * pps * dt;
    player.y += ay * pps * dt;

    // keep inside arena
    var half = PLAYER_SIZE / 2;
    var minC = WALL + half;
    var maxX = W - WALL - half;
    var maxY = H - WALL - half;
    if (player.x < minC) player.x = minC;
    if (player.x > maxX) player.x = maxX;
    if (player.y < minC) player.y = minC;
    if (player.y > maxY) player.y = maxY;

    // record path
    currentPath.push({ x: player.x, y: player.y });

    // advance ghosts (one path-sample per frame, looping)
    for (var i = 0; i < ghosts.length; i++) {
      var g = ghosts[i];
      if (g.path.length === 0) continue;
      g.idx = (g.idx + 1) % g.path.length;
    }

    // ghost collision
    for (var j = 0; j < ghosts.length; j++) {
      var gh = ghosts[j];
      if (gh.path.length === 0) continue;
      var gp = gh.path[gh.idx % gh.path.length];
      if (Math.abs(gp.x - player.x) < (PLAYER_SIZE + GHOST_SIZE) / 2 - HIT_PAD &&
          Math.abs(gp.y - player.y) < (PLAYER_SIZE + GHOST_SIZE) / 2 - HIT_PAD) {
        gameOver();
        return;
      }
    }

    // ring collection
    var remaining = 0;
    for (var k = 0; k < rings.length; k++) {
      var r = rings[k];
      if (r.got) continue;
      remaining++;
      var dx = r.x - player.x;
      var dy = r.y - player.y;
      if (dx * dx + dy * dy < (RING_R + half) * (RING_R + half)) {
        r.got = true;
        remaining--;
        score += 1;
        if (window.FX) FX.burst(r.x, r.y, "#34d399", 16);
        updateHud();
      }
    }

    if (remaining === 0) {
      advanceRound();
      return;
    }

    // timer
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateHud();
      gameOver();
      return;
    }
    updateHud();
  }

  function advanceRound() {
    // freeze the just-recorded path into a ghost
    ghosts.push({ path: currentPath, idx: 0 });
    round += 1;
    // score += 5 total for the round: we already added 1 per ring (5),
    // matching "score += 5". Keep it consistent.
    // difficulty ramp
    roundTime = Math.max(MIN_TIME, START_TIME - (round - 1) * TIME_STEP);
    startRound();
  }

  function gameOver() {
    mode = "over";
    if (window.FX && player) { FX.burst(player.x, player.y, "#fb7185", 22); FX.shake(7); }
    clearKeys();
    var roundsSurvived = round - 1;
    if (score > best) {
      best = score;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    }
    overStats.innerHTML =
      "Yashagan raundlar: <b>" + roundsSurvived + "</b><br>" +
      "Umumiy ball: <b>" + score + "</b><br>" +
      "Rekord: <b>" + best + "</b>";
    overOverlay.classList.remove("hidden");
  }

  function togglePause() {
    if (mode === "playing") {
      mode = "paused";
      clearKeys();
      pauseOverlay.classList.remove("hidden");
    } else if (mode === "paused") {
      resume();
    }
  }

  function resume() {
    if (mode !== "paused") return;
    mode = "playing";
    pauseOverlay.classList.add("hidden");
    lastTs = 0;
  }

  // ---- Render (neon) ----
  function drawArena(t) {
    // animatsion yulduzli fon
    FX.starfield(ctx, W, H, t);

    // neon devor ramkasi
    ctx.save();
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "rgba(34,211,238,0.35)";
    ctx.lineWidth = WALL;
    ctx.strokeRect(WALL / 2, WALL / 2, W - WALL, H - WALL);
    ctx.restore();
  }

  function drawRings(t) {
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      if (r.got) continue;
      var pulse = 0.5 + 0.5 * Math.sin(t * 0.006 + r.ph); // 0..1
      // tashqi yashil halo (pulslaydi)
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.35 * pulse;
      FX.glowCircle(ctx, r.x, r.y, RING_R * (1.05 + 0.35 * pulse), "#34d399", 20);
      ctx.restore();
      // ichki amber yadro
      FX.glowCircle(ctx, r.x, r.y, RING_R * 0.5, "#fbbf24", 12);
    }
  }

  function drawGhosts() {
    for (var i = 0; i < ghosts.length; i++) {
      var g = ghosts[i];
      if (g.path.length === 0) continue;
      var p = g.path[g.idx % g.path.length];
      // xira iz
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 2;
      ctx.beginPath();
      var trail = 20;
      for (var t = 0; t <= trail; t++) {
        var ti = (g.idx - t + g.path.length) % g.path.length;
        var tp = g.path[ti];
        if (t === 0) ctx.moveTo(tp.x, tp.y); else ctx.lineTo(tp.x, tp.y);
      }
      ctx.stroke();
      ctx.restore();

      // arvoh tanasi — yaltiroq danger kvadrat
      ctx.save();
      ctx.globalAlpha = 0.6;
      FX.glowRect(ctx, p.x - GHOST_SIZE / 2, p.y - GHOST_SIZE / 2, GHOST_SIZE, GHOST_SIZE, "#fb7185", 4, 14);
      ctx.restore();
    }
  }

  function drawPlayer(t, x, y) {
    var pr = PLAYER_SIZE * 0.7;
    FX.glowCircle(ctx, x, y, pr, "#22d3ee", 20 + 4 * Math.sin(t * 0.006));
    FX.glowCircle(ctx, x, y, pr * 0.45, "#eaffff", 9);
  }

  function render(t) {
    // fon (silkinishdan tashqarida — chetlarda bo'shliq bo'lmasligi uchun)
    drawArena(t);

    var shaken = FX.applyShake(ctx);
    if (mode !== "menu") {
      drawRings(t);
      drawGhosts();
      if (player) drawPlayer(t, player.x, player.y);
    } else {
      // idle ko'rinish: markazda o'yinchi
      drawPlayer(t, W / 2, H / 2);
    }
    // zarrachalar
    FX.update(16);
    FX.render(ctx);
    if (shaken) FX.restore(ctx);
  }

  // ---- Main loop ----
  function loop(ts) {
    if (mode === "playing") {
      if (!lastTs) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;
      // clamp dt to avoid huge jumps (tab switch)
      if (dt > 0.05) dt = 0.05;
      update(dt);
    }
    render(ts);
    requestAnimationFrame(loop);
  }

  // ---- Buttons ----
  startBtn.addEventListener("click", function () {
    startOverlay.classList.add("hidden");
    mode = "playing";
    lastTs = 0;
    clearKeys();
    resetGame();
  });
  resumeBtn.addEventListener("click", resume);
  retryBtn.addEventListener("click", function () {
    overOverlay.classList.add("hidden");
    mode = "playing";
    lastTs = 0;
    clearKeys();
    resetGame();
  });

  // ---- Init ----
  // draw initial state before Boshlash
  render(0);
  requestAnimationFrame(loop);
})();
