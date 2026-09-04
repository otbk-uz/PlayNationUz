/* Aks-Ovoz (Echo) — echolocation maze.
   The screen is dark. Emit pings to briefly light up nearby walls,
   then navigate to the exit from memory. Pure static JS, no deps. */

(function () {
  "use strict";

  // ---- Canvas ----
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var SIZE = canvas.width; // 480

  // ---- Level configuration (grid cols/rows per level) ----
  var LEVELS = [9, 11, 13, 15];
  var BEST_KEY = "aks-ovoz-best";

  // ---- Timing constants (seconds) ----
  var PING_EXPAND = 0.8; // ring reaches full reach
  var PING_FADE = 1.0; // cell fades back to dark after being reached

  // ---- HUD elements ----
  var hudLevel = document.getElementById("hudLevel");
  var hudPings = document.getElementById("hudPings");
  var hudTime = document.getElementById("hudTime");
  var hudBest = document.getElementById("hudBest");

  // ---- Overlay elements ----
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlayTitle");
  var overlayText = document.getElementById("overlayText");
  var overlaySub = document.getElementById("overlaySub");
  var overlayBtn = document.getElementById("overlayBtn");

  // ---- Game state ----
  var state = "intro"; // intro | playing | won
  var levelIndex = 0;
  var cols = 9,
    rows = 9;
  var cell = SIZE / cols;
  var grid = []; // array of cells with wall booleans
  var player = { x: 0, y: 0 };
  var exitCell = { x: 0, y: 0 };
  var pings = []; // active ping rings {t0, ox, oy, reach}
  var totalPings = 0; // pings this run
  var levelPings = 0; // pings this level
  var levelStartTime = 0;
  var elapsed = 0;
  var best = loadBest();

  // ---------- Best score (localStorage) ----------
  function loadBest() {
    try {
      var v = localStorage.getItem(BEST_KEY);
      if (v === null) return null;
      var n = parseInt(v, 10);
      return isNaN(n) ? null : n;
    } catch (e) {
      return null;
    }
  }

  function saveBest(v) {
    try {
      localStorage.setItem(BEST_KEY, String(v));
    } catch (e) {
      /* ignore */
    }
  }

  function renderBest() {
    hudBest.textContent = best === null ? "—" : best + " ping";
  }

  // ---------- Maze generation (recursive backtracker) ----------
  function idx(x, y) {
    return y * cols + x;
  }

  function buildMaze(c, r) {
    cols = c;
    rows = r;
    cell = SIZE / cols;
    grid = new Array(cols * rows);
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        grid[idx(x, y)] = {
          x: x,
          y: y,
          N: true,
          E: true,
          S: true,
          W: true,
          visited: false,
        };
      }
    }

    var stack = [];
    var current = grid[idx(0, 0)];
    current.visited = true;
    var visitedCount = 1;
    var total = cols * rows;

    while (visitedCount < total) {
      var neighbors = unvisitedNeighbors(current);
      if (neighbors.length > 0) {
        var next = neighbors[(Math.random() * neighbors.length) | 0];
        removeWall(current, next);
        stack.push(current);
        current = next;
        current.visited = true;
        visitedCount++;
      } else if (stack.length > 0) {
        current = stack.pop();
      } else {
        break;
      }
    }
  }

  function unvisitedNeighbors(c) {
    var list = [];
    var x = c.x,
      y = c.y;
    if (y > 0 && !grid[idx(x, y - 1)].visited) list.push(grid[idx(x, y - 1)]);
    if (x < cols - 1 && !grid[idx(x + 1, y)].visited)
      list.push(grid[idx(x + 1, y)]);
    if (y < rows - 1 && !grid[idx(x, y + 1)].visited)
      list.push(grid[idx(x, y + 1)]);
    if (x > 0 && !grid[idx(x - 1, y)].visited) list.push(grid[idx(x - 1, y)]);
    return list;
  }

  function removeWall(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    if (dx === 1) {
      a.E = false;
      b.W = false;
    } else if (dx === -1) {
      a.W = false;
      b.E = false;
    } else if (dy === 1) {
      a.S = false;
      b.N = false;
    } else if (dy === -1) {
      a.N = false;
      b.S = false;
    }
  }

  // ---------- Level lifecycle ----------
  function startLevel(i) {
    if (window.FX) FX.reset();
    levelIndex = i;
    var n = LEVELS[i];
    buildMaze(n, n);
    player.x = 0;
    player.y = 0;
    exitCell.x = cols - 1;
    exitCell.y = rows - 1;
    pings = [];
    levelPings = 0;
    levelStartTime = now();
    elapsed = 0;
    state = "playing";
    updateHud();
    // one free ping at the start so the player isn't fully blind
    emitPing();
  }

  function completeLevel() {
    if (window.FX) FX.burst((exitCell.x + 0.5) * cell, (exitCell.y + 0.5) * cell, "#34d399", 26);
    // record: fewest pings to clear level 1
    if (levelIndex === 0) {
      if (best === null || levelPings < best) {
        best = levelPings;
        saveBest(best);
        renderBest();
      }
    }
    if (levelIndex + 1 < LEVELS.length) {
      showOverlay(
        "Bosqich " + (levelIndex + 1) + " tamom! ✅",
        "Zo'r! Bu bosqichda " +
          levelPings +
          " ping ishlatildi. Keyingi labirint kattaroq.",
        "Davom etish uchun tugmani bos yoki Space.",
        "Keyingi bosqich"
      );
      state = "intro";
      pendingAction = function () {
        startLevel(levelIndex + 1);
      };
    } else {
      state = "won";
      showOverlay(
        "G'alaba! 🎉",
        "Barcha bosqichlarni tugatding! Jami " +
          totalPings +
          " ping ishlatildi.",
        "Qaytadan o'ynash uchun tugmani bos.",
        "Qaytadan"
      );
      pendingAction = function () {
        totalPings = 0;
        startLevel(0);
      };
    }
  }

  // ---------- Ping ----------
  function emitPing() {
    var reach = Math.min(SIZE, cell * 6);
    pings.push({
      t0: now(),
      ox: (player.x + 0.5) * cell,
      oy: (player.y + 0.5) * cell,
      reach: reach,
    });
    totalPings++;
    levelPings++;
    updateHud();
    // prune fully-faded pings
    var cutoff = now() - (PING_EXPAND + PING_FADE + 0.2);
    pings = pings.filter(function (p) {
      return p.t0 >= cutoff;
    });
  }

  // ---------- Movement ----------
  function tryMove(dx, dy) {
    if (state !== "playing") return;
    var c = grid[idx(player.x, player.y)];
    if (dx === 1 && c.E) return;
    if (dx === -1 && c.W) return;
    if (dy === 1 && c.S) return;
    if (dy === -1 && c.N) return;
    var nx = player.x + dx;
    var ny = player.y + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;
    player.x = nx;
    player.y = ny;
    if (player.x === exitCell.x && player.y === exitCell.y) {
      completeLevel();
    }
  }

  // ---------- HUD ----------
  function updateHud() {
    hudLevel.textContent = String(levelIndex + 1);
    hudPings.textContent = String(totalPings);
    hudTime.textContent = Math.floor(elapsed) + "s";
    renderBest();
  }

  // ---------- Rendering ----------
  function cellBrightness(cx, cy, t) {
    // brightness contribution from all active pings for a cell center
    var centerX = (cx + 0.5) * cell;
    var centerY = (cy + 0.5) * cell;
    var bMax = 0;
    for (var i = 0; i < pings.length; i++) {
      var p = pings[i];
      var d = Math.hypot(centerX - p.ox, centerY - p.oy);
      if (d > p.reach) continue;
      var reachTime = p.t0 + (d / p.reach) * PING_EXPAND;
      if (t < reachTime) continue; // ring hasn't arrived yet
      var age = t - reachTime;
      if (age > PING_FADE) continue;
      var fade = 1 - age / PING_FADE;
      var atten = 1 - d / p.reach; // farther = dimmer
      var b = fade * (0.35 + 0.65 * atten);
      if (b > bMax) bMax = b;
    }
    return bMax;
  }

  function draw() {
    var t = now();
    if (state === "playing") {
      elapsed = t - levelStartTime;
      hudTime.textContent = Math.floor(elapsed) + "s";
    }

    // near-black background (sonar — no flood light)
    ctx.fillStyle = "#04070e";
    ctx.fillRect(0, 0, SIZE, SIZE);

    if (grid.length === 0) return;

    var px = (player.x + 0.5) * cell;
    var py = (player.y + 0.5) * cell;

    // draw cells (floor + walls) modulated by ping brightness (sonar reveal)
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var b = cellBrightness(x, y, t);

        // faint auto-glow around the player so never fully lost
        var dCell = Math.hypot(x - player.x, y - player.y);
        if (dCell <= 1.5) {
          var glow = (1 - dCell / 1.6) * 0.18;
          if (glow > b) b = glow;
        }

        if (b <= 0.01) continue;

        var cx = x * cell;
        var cy = y * cell;
        var isExit = x === exitCell.x && y === exitCell.y;

        // floor
        if (isExit) {
          // yashil chiqish nuri
          ctx.fillStyle = "rgba(52,211,153," + (b * 0.55).toFixed(3) + ")";
          ctx.fillRect(cx + 1, cy + 1, cell - 2, cell - 2);
          ctx.save();
          ctx.globalAlpha = Math.min(1, b);
          FX.glowCircle(ctx, cx + cell / 2, cy + cell / 2, cell * 0.28, "#34d399", 18);
          ctx.restore();
        } else {
          // neon (cyan) tint pol
          ctx.fillStyle = "rgba(34,211,238," + (b * 0.16).toFixed(3) + ")";
          ctx.fillRect(cx, cy, cell, cell);
        }

        // walls — neon tinted, bright cells get a soft glow
        var c = grid[idx(x, y)];
        ctx.save();
        if (b > 0.3) { ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 6 * b; }
        ctx.strokeStyle = isExit
          ? "rgba(110,245,190," + b.toFixed(3) + ")"
          : "rgba(125,235,255," + b.toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (c.N) {
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + cell, cy);
        }
        if (c.S) {
          ctx.moveTo(cx, cy + cell);
          ctx.lineTo(cx + cell, cy + cell);
        }
        if (c.W) {
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + cell);
        }
        if (c.E) {
          ctx.moveTo(cx + cell, cy);
          ctx.lineTo(cx + cell, cy + cell);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // draw expanding ping rings — bright cyan glow
    for (var i = 0; i < pings.length; i++) {
      var p = pings[i];
      var age = t - p.t0;
      if (age < 0 || age > PING_EXPAND) continue;
      var r = (age / PING_EXPAND) * p.reach;
      var ringAlpha = (1 - age / PING_EXPAND) * 0.9;
      ctx.save();
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "rgba(34,211,238," + ringAlpha.toFixed(3) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.ox, p.oy, r, 0, Math.PI * 2);
      ctx.stroke();
      // inner soft ring
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "rgba(150,240,255," + (ringAlpha * 0.5).toFixed(3) + ")";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.ox, p.oy, r * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // player — glowing cyan dot
    FX.glowCircle(ctx, px, py, Math.max(3, cell * 0.24), "#22d3ee", 22);
    FX.glowCircle(ctx, px, py, Math.max(1.5, cell * 0.1), "#eaffff", 8);

    // particles
    FX.update(16);
    FX.render(ctx);
  }

  // ---------- Main loop ----------
  function now() {
    return performance.now() / 1000;
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- Overlay ----------
  var pendingAction = null;

  function showOverlay(title, text, sub, btnLabel) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlaySub.textContent = sub;
    overlayBtn.textContent = btnLabel;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function onOverlayBtn() {
    hideOverlay();
    if (pendingAction) {
      var a = pendingAction;
      pendingAction = null;
      a();
    } else {
      totalPings = 0;
      startLevel(0);
    }
  }

  // ---------- Input ----------
  window.addEventListener("keydown", function (e) {
    var k = e.key;
    if (state === "intro" || state === "won") {
      if (k === " " || k === "Enter") {
        e.preventDefault();
        onOverlayBtn();
      }
      return;
    }
    if (k === "ArrowUp" || k === "w" || k === "W") {
      e.preventDefault();
      tryMove(0, -1);
    } else if (k === "ArrowDown" || k === "s" || k === "S") {
      e.preventDefault();
      tryMove(0, 1);
    } else if (k === "ArrowLeft" || k === "a" || k === "A") {
      e.preventDefault();
      tryMove(-1, 0);
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      e.preventDefault();
      tryMove(1, 0);
    } else if (k === " ") {
      e.preventDefault();
      emitPing();
    }
  });

  overlayBtn.addEventListener("click", onOverlayBtn);

  document.getElementById("pingBtn").addEventListener("click", function () {
    if (state === "playing") emitPing();
  });

  var dirMap = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  };
  var dirBtns = document.querySelectorAll(".btn-dir");
  for (var b = 0; b < dirBtns.length; b++) {
    (function (btn) {
      var handler = function (ev) {
        ev.preventDefault();
        var d = dirMap[btn.getAttribute("data-dir")];
        if (d) tryMove(d[0], d[1]);
      };
      btn.addEventListener("click", handler);
    })(dirBtns[b]);
  }

  // ---------- Init ----------
  renderBest();
  updateHud();
  // draw an initial dark grid state (build a maze so the canvas isn't empty)
  buildMaze(LEVELS[0], LEVELS[0]);
  player.x = 0;
  player.y = 0;
  exitCell.x = cols - 1;
  exitCell.y = rows - 1;
  loop();
})();
