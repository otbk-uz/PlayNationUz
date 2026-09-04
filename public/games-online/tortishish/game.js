(function () {
  "use strict";

  // ---- Tile constants ----------------------------------------------------
  var WALL = "#";
  var EMPTY = ".";
  var SPIKE = "^";
  var GOAL = "G";
  var START = "S";

  // ---- Levels (ASCII maps) ----------------------------------------------
  // # wall, . empty, ^ spike, G goal, S ball start
  var LEVELS = [
    [
      "#########",
      "#S..    #",
      "#.###.^.#",
      "#.....#.#",
      "#.^##...#",
      "#......G#",
      "#########"
    ],
    [
      "##########",
      "#S.......#",
      "#.####.#.#",
      "#....#.#.#",
      "#.##.#.#.#",
      "#.#..^.#.#",
      "#.#.####.#",
      "#........G",
      "##########"
    ],
    [
      "##########",
      "#S.^...^.#",
      "#.#.##.#.#",
      "#.#....#.#",
      "#.#.##.#.#",
      "#...#..#.#",
      "###.#.##.#",
      "#.....^..#",
      "#.####.#.#",
      "#G.......#",
      "##########"
    ],
    [
      "###########",
      "#S...#....#",
      "#.##.#.##.#",
      "#..#...#^.#",
      "##.#.###.##",
      "#..^.#....#",
      "#.##.#.##.#",
      "#.#....#..#",
      "#.#.##.#.##",
      "#...#....G#",
      "###########"
    ],
    [
      "############",
      "#S.^.....^.#",
      "#.########.#",
      "#.#......#.#",
      "#.#.####.#.#",
      "#.#.#G.#.#.#",
      "#.#.#.##.#.#",
      "#.#.#....#.#",
      "#.#.######.#",
      "#.#....^...#",
      "#.########.#",
      "#..........#",
      "############"
    ]
  ];

  // ---- DOM ---------------------------------------------------------------
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var hudLevel = document.getElementById("hud-level");
  var hudMoves = document.getElementById("hud-moves");
  var hudBest = document.getElementById("hud-best");
  var overlay = document.getElementById("overlay");
  var overlayTitle = document.getElementById("overlay-title");
  var overlayText = document.getElementById("overlay-text");
  var overlayBtn = document.getElementById("overlay-btn");

  // ---- Colors (mirror CSS variables) ------------------------------------
  var COL = {
    bg: "#0d1117",
    panel: "#161b22",
    line: "#30363d",
    text: "#e6edf3",
    muted: "#8b949e",
    accent: "#58a6ff",
    danger: "#f85149",
    good: "#3fb950"
  };

  var BEST_KEY = "tortishish-best";

  // ---- Game state --------------------------------------------------------
  var state = {
    levelIndex: 0,
    grid: [],
    rows: 0,
    cols: 0,
    goal: { x: 0, y: 0 },
    // Ball uses pixel position that eases toward its target cell.
    ball: { cx: 0, cy: 0, px: 0, py: 0 }, // cx/cy target cell, px/py current pixel
    gravity: "down",
    moves: 0,
    totalMoves: 0,
    moving: false,
    playing: false,
    flash: 0, // >0 danger flash timer
    goalGlow: 0
  };

  var tile = 40; // pixel size of a cell (computed each level)
  var offX = 0;
  var offY = 0;

  var DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  // ---- Level loading -----------------------------------------------------
  function loadLevel(idx) {
    FX.reset();
    var map = LEVELS[idx];
    state.rows = map.length;
    state.cols = 0;
    var i, j;
    for (i = 0; i < map.length; i++) {
      if (map[i].length > state.cols) state.cols = map[i].length;
    }

    state.grid = [];
    var startX = 1, startY = 1;
    for (i = 0; i < state.rows; i++) {
      var row = [];
      for (j = 0; j < state.cols; j++) {
        var ch = j < map[i].length ? map[i][j] : WALL;
        if (ch === START) {
          startX = j;
          startY = i;
          ch = EMPTY;
        } else if (ch === GOAL) {
          state.goal = { x: j, y: i };
        } else if (ch === " ") {
          ch = EMPTY;
        }
        row.push(ch);
      }
      state.grid.push(row);
    }

    // Fit tile size to canvas (keep it square, integer-ish).
    tile = Math.floor(Math.min(canvas.width / state.cols, canvas.height / state.rows));
    offX = Math.floor((canvas.width - tile * state.cols) / 2);
    offY = Math.floor((canvas.height - tile * state.rows) / 2);

    state.ball.cx = startX;
    state.ball.cy = startY;
    state.ball.px = cellCenterX(startX);
    state.ball.py = cellCenterY(startY);
    state.gravity = "down";
    state.moves = 0;
    state.moving = false;
    state.flash = 0;
    state.goalGlow = 0;

    updateHud();
  }

  function cellCenterX(cx) {
    return offX + cx * tile + tile / 2;
  }
  function cellCenterY(cy) {
    return offY + cy * tile + tile / 2;
  }

  function tileAt(x, y) {
    if (y < 0 || y >= state.rows || x < 0 || x >= state.cols) return WALL;
    return state.grid[y][x];
  }

  // ---- Gravity resolution ------------------------------------------------
  // Compute the destination cell if gravity pulls in `dir` from current cell.
  function destinationCell(dir) {
    var d = DIRS[dir];
    var x = state.ball.cx;
    var y = state.ball.cy;
    while (true) {
      var nx = x + d.x;
      var ny = y + d.y;
      var t = tileAt(nx, ny);
      if (t === WALL) break; // blocked
      x = nx;
      y = ny;
      if (t === SPIKE) break; // stop on spike (will trigger death)
      if (t === GOAL) break; // stop on goal (will trigger win)
    }
    return { x: x, y: y };
  }

  function setGravity(dir) {
    if (!state.playing || state.moving) return;
    if (!DIRS[dir]) return;
    var dest = destinationCell(dir);
    state.gravity = dir;
    // Count a move only if the ball will actually travel.
    if (dest.x === state.ball.cx && dest.y === state.ball.cy) {
      // No movement possible in this direction; still register the gravity
      // change visually but do not count it as a move.
      return;
    }
    state.moves++;
    updateHud();
    state.ball.cx = dest.x;
    state.ball.cy = dest.y;
    state.moving = true;
  }

  // ---- Update / animation loop ------------------------------------------
  var lastTime = 0;
  function frame(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    FX.update(16);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 3);
    state.goalGlow += dt * 3;

    if (!state.playing) return;

    if (state.moving) FX.trail(state.ball.px, state.ball.py, "#22d3ee");

    // Ease ball pixel position toward its target cell center.
    var tx = cellCenterX(state.ball.cx);
    var ty = cellCenterY(state.ball.cy);
    var speed = tile * 12; // px per second
    var dx = tx - state.ball.px;
    var dy = ty - state.ball.py;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.5) {
      var step = speed * dt;
      if (step >= dist) {
        state.ball.px = tx;
        state.ball.py = ty;
      } else {
        state.ball.px += (dx / dist) * step;
        state.ball.py += (dy / dist) * step;
      }
    } else if (state.moving) {
      // Arrived at destination cell.
      state.ball.px = tx;
      state.ball.py = ty;
      state.moving = false;
      resolveArrival();
    }
  }

  function resolveArrival() {
    var t = tileAt(state.ball.cx, state.ball.cy);
    if (t === SPIKE) {
      onDeath();
    } else if (t === GOAL) {
      onGoal();
    }
  }

  function onDeath() {
    FX.burst(state.ball.px, state.ball.py, "#fb7185", 22);
    FX.shake(7);
    state.flash = 1;
    state.playing = false;
    // Restart same level after a short flash.
    window.setTimeout(function () {
      loadLevel(state.levelIndex);
      state.playing = true;
    }, 450);
  }

  function onGoal() {
    FX.burst(state.ball.px, state.ball.py, "#34d399", 26);
    FX.burst(state.ball.px, state.ball.py, "#22d3ee", 16);
    state.totalMoves += state.moves;
    state.playing = false;
    if (state.levelIndex >= LEVELS.length - 1) {
      showWin();
    } else {
      showLevelComplete();
    }
  }

  // ---- Overlays ----------------------------------------------------------
  function showOverlay(title, text, btnLabel, onClick) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayBtn.textContent = btnLabel;
    overlay.classList.remove("hidden");
    overlayBtn.onclick = onClick;
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function showLevelComplete() {
    showOverlay(
      "Daraja tugadi",
      "Ajoyib! " + state.moves + " ta yurish bilan yakunladingiz. Keyingi darajaga o'tamiz.",
      "Davom etish",
      function () {
        state.levelIndex++;
        loadLevel(state.levelIndex);
        hideOverlay();
        state.playing = true;
      }
    );
  }

  function showWin() {
    var best = readBest();
    var isRecord = best === null || state.totalMoves < best;
    if (isRecord) {
      writeBest(state.totalMoves);
    }
    updateHud();
    var msg =
      "Barcha darajalar tugadi! Jami yurishlar: " +
      state.totalMoves +
      (isRecord ? " — yangi rekord!" : "") +
      ".";
    showOverlay("Barcha darajalar tugadi!", msg, "Qaytadan", function () {
      state.levelIndex = 0;
      state.totalMoves = 0;
      loadLevel(0);
      hideOverlay();
      state.playing = true;
    });
  }

  function showStart() {
    showOverlay(
      "🌍 Tortishish",
      "Yo'nalish tugmalari tortishishni o'zgartiradi. Siz sharni to'g'ridan-to'g'ri harakatlantirmaysiz — faqat tortishish yo'nalishini burasiz, shar esa o'sha tomonga dumalab tushadi. Sharni yashil chiqishga (G) olib boring, qizil tikonlardan (^) saqlaning.",
      "Boshlash",
      function () {
        state.levelIndex = 0;
        state.totalMoves = 0;
        loadLevel(0);
        hideOverlay();
        state.playing = true;
      }
    );
  }

  // ---- localStorage best -------------------------------------------------
  function readBest() {
    try {
      var v = window.localStorage.getItem(BEST_KEY);
      if (v === null) return null;
      var n = parseInt(v, 10);
      return isNaN(n) ? null : n;
    } catch (e) {
      return null;
    }
  }

  function writeBest(v) {
    try {
      window.localStorage.setItem(BEST_KEY, String(v));
    } catch (e) {
      /* ignore */
    }
  }

  // ---- HUD ---------------------------------------------------------------
  function updateHud() {
    hudLevel.textContent = String(state.levelIndex + 1) + "/" + LEVELS.length;
    hudMoves.textContent = String(state.moves);
    var best = readBest();
    hudBest.textContent = best === null ? "—" : String(best);
  }

  // ---- Rendering ---------------------------------------------------------
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function render() {
    // Animatsion neon yulduzli fon (tekis fill o'rniga).
    FX.starfield(ctx, canvas.width, canvas.height, performance.now());

    var shook = FX.applyShake(ctx);

    var x, y;
    // Subtle grid background for empty cells.
    for (y = 0; y < state.rows; y++) {
      for (x = 0; x < state.cols; x++) {
        var t = state.grid[y][x];
        var px = offX + x * tile;
        var py = offY + y * tile;
        if (t === WALL) {
          drawWall(px, py);
        } else if (t === SPIKE) {
          drawSpike(px, py);
        } else if (t === GOAL) {
          drawGoal(px, py);
        } else {
          drawEmpty(px, py);
        }
      }
    }

    drawBall();
    drawGravityArrow();

    if (shook) FX.restore(ctx);

    if (state.flash > 0) {
      ctx.fillStyle = "rgba(251, 113, 133," + (state.flash * 0.5) + ")";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Zarrachalar hammasi ustidan.
    FX.render(ctx);
  }

  function drawEmpty(px, py) {
    // Juda yengil plita — yulduzli fon ko'rinib tursin.
    ctx.fillStyle = "rgba(120,160,255,0.05)";
    roundRect(ctx, px + 1, py + 1, tile - 2, tile - 2, 4);
    ctx.fill();
  }

  function drawWall(px, py) {
    // Violet neon devor (ko'p plita — blur past).
    FX.glowRect(ctx, px + 1, py + 1, tile - 2, tile - 2, "#a78bfa", 6, 6);
  }

  function drawSpike(px, py) {
    drawEmpty(px, py);
    var m = tile * 0.18;
    ctx.save();
    ctx.shadowColor = "#fb7185";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.moveTo(px + m, py + tile - m);
    ctx.lineTo(px + tile / 2, py + m);
    ctx.lineTo(px + tile - m, py + tile - m);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGoal(px, py) {
    var glow = 0.5 + 0.5 * Math.sin(state.goalGlow);
    // Kuchli yashil neon nishon.
    FX.glowRect(ctx, px + 4, py + 4, tile - 8, tile - 8, "#34d399", 6, 18 + glow * 16);
    ctx.fillStyle = "rgba(7,11,20,0.55)";
    ctx.font = "bold " + Math.floor(tile * 0.5) + "px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", px + tile / 2, py + tile / 2 + 1);
  }

  function drawBall() {
    var r = tile * 0.32;
    var cx = state.ball.px;
    var cy = state.ball.py;
    // Kuchli cyan neon nur bilan o'yinchi shar.
    FX.glowCircle(ctx, cx, cy, r, "#22d3ee", 22);
    // Yorug'lik dog'i.
    var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
    grad.addColorStop(0, "#cffafe");
    grad.addColorStop(1, "#22d3ee");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGravityArrow() {
    var d = DIRS[state.gravity];
    var cx = canvas.width - 26;
    var cy = 26;
    var len = 12;
    ctx.save();
    ctx.strokeStyle = COL.muted;
    ctx.fillStyle = COL.accent;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    // circle badge
    ctx.fillStyle = "rgba(34,211,238,0.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    // arrow (neon cyan)
    var ex = cx + d.x * len;
    var ey = cy + d.y * len;
    var sx = cx - d.x * len;
    var sy = cy - d.y * len;
    FX.glowLine(ctx, sx, sy, ex, ey, "#22d3ee", 3, 10);
    // arrowhead
    var ah = 6;
    ctx.save();
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - d.x * ah - d.y * ah, ey - d.y * ah - d.x * ah);
    ctx.lineTo(ex - d.x * ah + d.y * ah, ey - d.y * ah + d.x * ah);
    ctx.closePath();
    ctx.fillStyle = "#22d3ee";
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // ---- Input -------------------------------------------------------------
  function handleDir(dir) {
    setGravity(dir);
  }

  document.addEventListener("keydown", function (e) {
    var dir = null;
    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        dir = "up";
        break;
      case "ArrowDown":
      case "s":
      case "S":
        dir = "down";
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        dir = "left";
        break;
      case "ArrowRight":
      case "d":
      case "D":
        dir = "right";
        break;
      case "r":
      case "R":
        if (state.playing) {
          loadLevel(state.levelIndex);
          FX.shake(7);
        }
        e.preventDefault();
        return;
      default:
        return;
    }
    if (dir) {
      e.preventDefault();
      handleDir(dir);
    }
  });

  var padButtons = document.querySelectorAll(".pad-btn");
  padButtons.forEach(function (btn) {
    var dir = btn.getAttribute("data-dir");
    btn.addEventListener("click", function () {
      handleDir(dir);
    });
  });

  // ---- Init --------------------------------------------------------------
  function init() {
    loadLevel(0); // draw first level immediately on load
    updateHud();
    showStart();
    requestAnimationFrame(function (t) {
      lastTime = t;
      requestAnimationFrame(frame);
    });
  }

  init();
})();
