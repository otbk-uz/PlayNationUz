// 🕸️ Ip — bitta arqonli tebranish o'yini
// Novel mechanic: bitta arqon. Bosib turing -> eng yaqin langarga arqon otiladi
// va mayatnik fizikasi bilan tebranasiz. Qo'yib yuboring -> impuls bilan uchasiz.
(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;   // 480
  var H = canvas.height;  // 480

  // ---- Sozlamalar (tuning) ----
  var GRAVITY = 0.42;        // constant gravity
  var MAX_ROPE = 250;        // arqonning maksimal uzunligi / otish masofasi
  var RELEASE_BOOST = 1.06;  // qo'yib yuborilganda impuls bonusi
  var MAX_SPEED = 22;        // tezlik chegarasi
  var PLAYER_R = 11;         // to'p radiusi
  var PX_PER_M = 20;         // 20px = 1 metr
  var DT = 1000 / 60;        // qat'iy qadam (ms)

  // ---- Holat ----
  var state = "start"; // 'start' | 'playing' | 'over'
  var best = 0;
  try { best = parseInt(localStorage.getItem("ip-best") || "0", 10) || 0; } catch (e) { best = 0; }

  var player = { x: 0, y: 0, vx: 0, vy: 0 };
  var startX = 0;
  var score = 0;
  var camX = 0;

  var anchors = [];      // {x, y}
  var lastAnchorX = 0;
  var attached = null;   // ref to anchor
  var ropeLen = 0;
  var held = false;      // input bosilyaptimi
  var stars = [];        // parallax fon

  // ---- DOM ----
  var startOverlay = document.getElementById("startOverlay");
  var overOverlay = document.getElementById("overOverlay");
  var startBtn = document.getElementById("startBtn");
  var againBtn = document.getElementById("againBtn");
  var hudScore = document.getElementById("hudScore");
  var hudBest = document.getElementById("hudBest");
  var finalScore = document.getElementById("finalScore");
  var finalBest = document.getElementById("finalBest");

  // ---- Yordamchilar ----
  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeStars() {
    stars = [];
    for (var i = 0; i < 90; i++) {
      stars.push({
        x: rand(0, 4000),
        y: rand(0, H),
        r: rand(0.4, 1.6),
        a: rand(0.15, 0.7)
      });
    }
  }

  // Langarlarni oldinga generatsiya qilish
  function generateAhead() {
    var limit = camX + W + 500;
    while (lastAnchorX < limit) {
      var gap = rand(130, 215);
      lastAnchorX += gap;
      anchors.push({
        x: lastAnchorX,
        y: rand(55, 205)
      });
    }
    // orqadagilarni tozalash
    while (anchors.length && anchors[0].x < camX - 250) {
      anchors.shift();
    }
  }

  // Eng yaqin yetib boradigan langar (masofa < MAX_ROPE, taxminan tepada)
  function nearestReachable() {
    var bestA = null, bestD = 1e9;
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      // taxminan tepada bo'lsin (o'yinchidan biroz pastgacha ruxsat)
      if (a.y > player.y + 45) continue;
      var dx = a.x - player.x, dy = a.y - player.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= MAX_ROPE && d < bestD) { bestD = d; bestA = a; }
    }
    return bestA;
  }

  function tryAttach() {
    var a = nearestReachable();
    if (a) {
      attached = a;
      var dx = player.x - a.x, dy = player.y - a.y;
      ropeLen = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_ROPE);
      if (ropeLen < 24) ropeLen = 24;
      FX.burst(a.x - camX, a.y, "#22d3ee", 12); // langarga ilashish porlashi
    }
  }

  function detach() {
    if (attached) {
      // mahoratli vaqtni mukofotlash: kichik impuls bonusi
      player.vx *= RELEASE_BOOST;
      player.vy *= RELEASE_BOOST;
      FX.burst(player.x - camX, player.y, "#f472b6", 10); // qo'yib yuborilganda impuls izi
      attached = null;
    }
  }

  // ---- Kirish ----
  function press() {
    if (state === "start" || state === "over") { return; }
    held = true;
    if (!attached) tryAttach();
  }
  function release() {
    held = false;
    detach();
  }

  // ---- Boshlash / qayta ----
  function reset() {
    anchors = [];
    lastAnchorX = 40;
    // dastlabki langar
    anchors.push({ x: 120, y: 95 });
    lastAnchorX = 120;
    camX = 0;
    generateAhead();

    player.x = 120;
    player.y = 250;
    player.vx = 2.4;
    player.vy = 0;
    startX = player.x;
    score = 0;
    attached = null;
    held = false;
    makeStars();
    FX.reset();
  }

  function startGame() {
    reset();
    state = "playing";
    startOverlay.classList.add("hidden");
    overOverlay.classList.add("hidden");
  }

  function gameOver() {
    state = "over";
    held = false;
    attached = null;
    FX.burst(player.x - camX, player.y, "#fb7185", 20); // yiqilish portlashi
    FX.shake(6);
    if (score > best) {
      best = score;
      try { localStorage.setItem("ip-best", String(best)); } catch (e) {}
    }
    finalScore.textContent = score;
    finalBest.textContent = best;
    overOverlay.classList.remove("hidden");
  }

  // ---- Fizika ----
  function step() {
    // gravitatsiya
    player.vy += GRAVITY;

    // ushlab turilsa va biriktirilmagan bo'lsa — imkon bo'lishi bilan tut
    if (held && !attached) tryAttach();

    // integratsiya
    player.x += player.vx;
    player.y += player.vy;

    // arqon cheklovi (mayatnik)
    if (attached) {
      var dx = player.x - attached.x;
      var dy = player.y - attached.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      if (dist > ropeLen) {
        var nx = dx / dist, ny = dy / dist;
        player.x = attached.x + nx * ropeLen;
        player.y = attached.y + ny * ropeLen;
        // radial tezlikni olib tashlash -> faqat tangensial tebranish
        var radial = player.vx * nx + player.vy * ny;
        if (radial > 0) {
          player.vx -= radial * nx;
          player.vy -= radial * ny;
        }
      }
    }

    // tezlik chegarasi
    var sp = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (sp > MAX_SPEED) {
      player.vx = player.vx / sp * MAX_SPEED;
      player.vy = player.vy / sp * MAX_SPEED;
    }

    // kamera va dunyo
    var targetCam = player.x - W * 0.35;
    if (targetCam > camX) camX = targetCam; // faqat oldinga
    generateAhead();

    // ball
    var m = Math.floor((player.x - startX) / PX_PER_M);
    if (m > score) score = m;

    // pastga tushib ketish -> o'yin tugadi
    if (player.y - PLAYER_R > H) {
      gameOver();
    }
  }

  // ---- Chizish ----
  function drawBackground() {
    // umumiy neon yulduzli fon
    FX.starfield(ctx, W, H, performance.now());

    // pastdagi xavf chizig'i (neon danger)
    ctx.save();
    ctx.strokeStyle = "rgba(251,113,133,0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, H - 2);
    ctx.lineTo(W, H - 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawAnchor(a, highlight) {
    var sx = a.x - camX, sy = a.y;
    if (sx < -30 || sx > W + 30) return;
    var col = highlight ? "#22d3ee" : "#34d399"; // cyan / green
    FX.glowCircle(ctx, sx, sy, highlight ? 6.5 : 5, col, highlight ? 24 : 16);
    FX.glowCircle(ctx, sx, sy, 2.5, "#eaf2ff", 8);
  }

  function drawPlayer() {
    var sx = player.x - camX, sy = player.y;
    // kuchli porlash
    FX.glowCircle(ctx, sx, sy, PLAYER_R + 4, "#f472b6", 34);
    FX.glowCircle(ctx, sx, sy, PLAYER_R, "#22d3ee", 24);
    FX.glowCircle(ctx, sx, sy, PLAYER_R * 0.5, "#eaf2ff", 12);
  }

  function drawRope() {
    if (!attached) return;
    var sx = player.x - camX, sy = player.y;
    var ax = attached.x - camX, ay = attached.y;
    FX.glowLine(ctx, ax, ay, sx, sy, "#a78bfa", 3, 14); // violet arqon
  }

  function render() {
    FX.update(16);
    var shook = FX.applyShake(ctx);
    drawBackground();
    // faqat 'playing' holatda va biriktirilmagan bo'lsa keyingi nishonni yoritamiz
    var hi = (state === "playing" && !attached) ? nearestReachable() : null;
    for (var i = 0; i < anchors.length; i++) {
      drawAnchor(anchors[i], anchors[i] === attached ? true : anchors[i] === hi);
    }
    drawRope();
    drawPlayer();
    FX.render(ctx);
    if (shook) FX.restore(ctx);
  }

  // ---- Asosiy sikl ----
  var last = 0, acc = 0;
  function loop(t) {
    if (!last) last = t;
    var frame = t - last;
    last = t;
    if (frame > 100) frame = 100; // katta sakrashlarni cheklash
    if (state === "playing") {
      acc += frame;
      var guard = 0;
      while (acc >= DT && guard < 5) {
        step();
        acc -= DT;
        guard++;
        if (state !== "playing") { acc = 0; break; }
      }
    }
    render();
    hudScore.textContent = score;
    hudBest.textContent = best;
    requestAnimationFrame(loop);
  }

  // ---- Hodisalar ----
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      if (state === "start") { startGame(); return; }
      if (state === "over") { startGame(); return; }
      if (!e.repeat) press();
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      release();
    }
  });

  // Pointer (sichqoncha + touch)
  canvas.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (state === "playing") press();
  });
  window.addEventListener("pointerup", function () { release(); });
  window.addEventListener("pointercancel", function () { release(); });

  // Touch zaxira (eski brauzerlar uchun)
  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    if (state === "playing") press();
  }, { passive: false });
  window.addEventListener("touchend", function (e) {
    e.preventDefault();
    release();
  }, { passive: false });

  startBtn.addEventListener("click", startGame);
  againBtn.addEventListener("click", startGame);

  // ---- Init: dastlabki holatni chizish ----
  hudBest.textContent = best;
  reset();
  state = "start";
  requestAnimationFrame(loop);
})();
