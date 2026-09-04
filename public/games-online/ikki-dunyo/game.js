(function () {
  "use strict";

  // ---- Constants ----
  var W = 480, H = 480;
  var CYAN = "#22d3ee";     // WORLD A
  var MAGENTA = "#f472b6";  // WORLD B (neon pushti)
  var GROUND = H - 56;      // baseline the player rests on
  var PLAYER_X = 96;        // fixed x of the player
  var PLAYER_R = 16;        // player radius

  var BEST_KEY = "ikki-dunyo-best";

  // ---- Canvas ----
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");

  // ---- DOM ----
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var worldNameEl = document.getElementById("worldName");
  var worldIndicator = document.querySelector(".world-indicator");
  var startOverlay = document.getElementById("startOverlay");
  var overOverlay = document.getElementById("overOverlay");
  var finalScoreEl = document.getElementById("finalScore");
  var finalBestEl = document.getElementById("finalBest");
  var startBtn = document.getElementById("startBtn");
  var retryBtn = document.getElementById("retryBtn");

  // ---- State ----
  // world: 0 = A (cyan), 1 = B (magenta)
  var state = "start"; // "start" | "playing" | "over"
  var world = 0;
  var obstacles = [];
  var orbs = [];
  var score = 0;
  var best = 0;
  var speed = 2.4;
  var baseSpeed = 2.4;
  var spawnTimer = 0;
  var spawnGap = 96;       // frames between spawns (shrinks with speed)
  var lastTime = 0;
  var bobPhase = 0;
  var flash = 0;           // brief switch flash

  // ---- Helpers ----
  function loadBest() {
    var v = 0;
    try {
      var raw = localStorage.getItem(BEST_KEY);
      if (raw !== null) v = parseInt(raw, 10) || 0;
    } catch (e) { v = 0; }
    best = v;
  }
  function saveBest() {
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
  }
  function worldColor(w) { return w === 0 ? CYAN : MAGENTA; }

  function updateHud() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
    worldNameEl.textContent = world === 0 ? "A" : "B";
    worldIndicator.classList.toggle("world-a", world === 0);
    worldIndicator.classList.toggle("world-b", world === 1);
  }

  // ---- Game control ----
  function resetGame() {
    world = 0;
    obstacles = [];
    orbs = [];
    score = 0;
    speed = baseSpeed;
    spawnTimer = 0;
    spawnGap = 96;
    bobPhase = 0;
    flash = 0;
    updateHud();
  }

  function startGame() {
    resetGame();
    if (window.FX) FX.reset();
    state = "playing";
    startOverlay.classList.add("hidden");
    overOverlay.classList.add("hidden");
    lastTime = 0;
  }

  function gameOver() {
    state = "over";
    if (window.FX) FX.shake(7);
    if (score > best) { best = score; saveBest(); }
    finalScoreEl.textContent = String(score);
    finalBestEl.textContent = String(best);
    updateHud();
    overOverlay.classList.remove("hidden");
  }

  function toggleWorld() {
    world = world === 0 ? 1 : 0;
    flash = 1;
    updateHud();
  }

  // ---- Spawning ----
  function spawnObstacle() {
    // Obstacle is a vertical bar tagged with a world color.
    var w = world; // reference not used; keep varied
    var col = Math.random() < 0.5 ? 0 : 1;
    var barH = 70 + Math.floor(Math.random() * 90); // 70..160
    obstacles.push({
      x: W + 24,
      w: 26,
      h: barH,
      world: col,
      passed: false
    });

    // Occasionally spawn a collectible orb (bonus). Keep core simple.
    if (Math.random() < 0.28) {
      var oc = Math.random() < 0.5 ? 0 : 1;
      orbs.push({
        x: W + 24 + 120,
        y: GROUND - 40 - Math.floor(Math.random() * 120),
        r: 9,
        world: oc,
        got: false
      });
    }
  }

  // ---- Update ----
  function update() {
    // difficulty ramp
    speed += 0.0016;
    var dynGap = Math.max(52, spawnGap - (speed - baseSpeed) * 6);

    spawnTimer++;
    if (spawnTimer >= dynGap) {
      spawnTimer = 0;
      spawnObstacle();
    }

    bobPhase += 0.12;
    if (flash > 0) flash -= 0.08;

    var py = GROUND - PLAYER_R - Math.sin(bobPhase) * 4;

    // Move obstacles
    for (var i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.x -= speed;

      // collision when horizontally overlapping player
      var overlapX = (o.x < PLAYER_X + PLAYER_R) && (o.x + o.w > PLAYER_X - PLAYER_R);
      if (overlapX) {
        // bar sits on the ground, height barH
        var barTop = GROUND - o.h;
        var overlapY = (py + PLAYER_R > barTop) && (py - PLAYER_R < GROUND);
        // DEADLY only if same world/color as the player
        if (overlapY && o.world === world) {
          gameOver();
          return;
        }
      }

      // scored once fully past the player
      if (!o.passed && o.x + o.w < PLAYER_X - PLAYER_R) {
        o.passed = true;
        score += 1;
        if (window.FX) FX.burst(PLAYER_X, py, worldColor(world), 10);
        updateHud();
      }

      if (o.x + o.w < -10) obstacles.splice(i, 1);
    }

    // Move orbs (bonus): collect only when in matching world
    for (var j = orbs.length - 1; j >= 0; j--) {
      var orb = orbs[j];
      orb.x -= speed;
      if (!orb.got) {
        var dx = orb.x - PLAYER_X;
        var dy = orb.y - py;
        if (dx * dx + dy * dy < (orb.r + PLAYER_R) * (orb.r + PLAYER_R) && orb.world === world) {
          orb.got = true;
          score += 3;
          if (window.FX) FX.burst(orb.x, orb.y, worldColor(orb.world), 16);
          updateHud();
        }
      }
      if (orb.x + orb.r < -10) orbs.splice(j, 1);
    }
  }

  // ---- Draw ----
  function drawBackground() {
    // animatsion yulduzli fon (umumiy FX)
    if (window.FX) FX.starfield(ctx, W, H, performance.now());
    else { ctx.fillStyle = "#0a0e14"; ctx.fillRect(0, 0, W, H); }

    // faint tint of the ACTIVE world so it's obvious which one you're in
    var tint = world === 0
      ? "rgba(34, 211, 238, 0.07)"
      : "rgba(232, 121, 249, 0.07)";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, W, H);

    // switch flash
    if (flash > 0) {
      ctx.fillStyle = world === 0
        ? "rgba(34,211,238," + (0.12 * flash) + ")"
        : "rgba(232,121,249," + (0.12 * flash) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    // ground line
    ctx.strokeStyle = "#1c2530";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + PLAYER_R + 2);
    ctx.lineTo(W, GROUND + PLAYER_R + 2);
    ctx.stroke();

    // world label watermark
    ctx.font = "bold 46px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = world === 0
      ? "rgba(34,211,238,0.10)"
      : "rgba(232,121,249,0.10)";
    ctx.fillText(world === 0 ? "OLAM A" : "OLAM B", W - 14, 12);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function drawObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      var col = worldColor(o.world);
      var top = GROUND - o.h;
      var samAsPlayer = o.world === world;

      // solid-to-you obstacles glow; phase-through ones look ghostly
      if (samAsPlayer && window.FX) {
        FX.glowRect(ctx, o.x, top, o.w, o.h, col, 6, 16);
      } else {
        ctx.save();
        ctx.globalAlpha = samAsPlayer ? 1 : 0.32;
        if (samAsPlayer) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
        ctx.fillStyle = col;
        roundRect(o.x, top, o.w, o.h, 6);
        ctx.fill();
        ctx.restore();
      }

      // outline for the phase-through ones so they stay readable
      if (!samAsPlayer) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        roundRect(o.x, top, o.w, o.h, 6);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawOrbs() {
    for (var i = 0; i < orbs.length; i++) {
      var orb = orbs[i];
      if (orb.got) continue;
      var col = worldColor(orb.world);
      var active = orb.world === world;
      if (active && window.FX) {
        FX.glowCircle(ctx, orb.x, orb.y, orb.r, col, 14);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // inner star tick
      ctx.save();
      ctx.globalAlpha = active ? 0.9 : 0.4;
      ctx.fillStyle = "#0a0e14";
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer() {
    var py = GROUND - PLAYER_R - Math.sin(bobPhase) * 4;
    var col = worldColor(world);
    if (window.FX) {
      FX.glowCircle(ctx, PLAYER_X, py, PLAYER_R, col, 20);
    } else {
      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = 18;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(PLAYER_X, py, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // core
    ctx.fillStyle = "#0a0e14";
    ctx.beginPath();
    ctx.arc(PLAYER_X, py, PLAYER_R * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // ring
    ctx.strokeStyle = "#e6edf3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(PLAYER_X, py, PLAYER_R + 3, 0, Math.PI * 2);
    ctx.stroke();
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

  function render() {
    if (window.FX) FX.update(16);
    var shaken = window.FX ? FX.applyShake(ctx) : false;
    drawBackground();
    drawObstacles();
    drawOrbs();
    drawPlayer();
    if (window.FX) FX.render(ctx);
    if (shaken) FX.restore(ctx);
  }

  // ---- Loop ----
  function loop() {
    if (state === "playing") {
      update();
      if (state === "playing") render();
    }
    requestAnimationFrame(loop);
  }

  // ---- Input ----
  function onToggleInput(e) {
    if (state === "playing") {
      if (e) e.preventDefault();
      toggleWorld();
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (state === "start") { startGame(); return; }
      if (state === "over") { startGame(); return; }
      toggleWorld();
    }
  });

  // Pointer / touch on the canvas toggles the world
  canvas.addEventListener("pointerdown", onToggleInput);
  canvas.addEventListener("touchstart", function (e) {
    // pointerdown covers most; guard for older browsers
    if (window.PointerEvent) return;
    onToggleInput(e);
  }, { passive: false });

  startBtn.addEventListener("click", startGame);
  retryBtn.addEventListener("click", startGame);

  // ---- Init ----
  loadBest();
  updateHud();
  render(); // draw initial state on load
  requestAnimationFrame(loop);
})();
