/* 💡 Yorug'lik — nur va ko'zgu jumbog'i
 * Novel mexanika: manba (💡) qat'iy yo'nalishda nur chiqaradi.
 * Ko'zgu (/ va \) kataklarni BOSIB burasan; nur ko'zgudan aks etadi,
 * devor (▨) uni to'xtatadi. Nurni barcha nishonlarga (🎯) yetkazsang — g'alaba.
 * Ko'zgu holatlari (bosishda aylanadi):  "/"  →  "\"  →  o'chiq  →  "/"
 */
(function () {
  "use strict";

  var DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };

  // Nur aks etishi:
  //  "/": right<->up, left<->down       "\": right<->down, left<->up
  function reflect(dir, m) {
    if (m === "/") return [-dir[1], -dir[0]];
    if (m === "\\") return [dir[1], dir[0]];
    return dir;
  }

  // --- Bosqichlar (data-defined). Har biri kvadrat panjara. ---
  // Belgilar: S=manba  T=nishon  #=devor  /=ko'zgu(/)  \=ko'zgu(\)  o=bo'sh ko'zgu uyasi  .=bo'sh
  var LEVELS = [
    { name: "Ilk nur", dir: "right", grid: [
      "......",
      "......",
      "S...o.",
      "......",
      "....T.",
      "......"
    ]},
    { name: "Ikki burilish", dir: "right", grid: [
      ".......",
      "T....o.",
      ".......",
      "S....o.",
      ".......",
      ".......",
      "......."
    ]},
    { name: "Devor ortida", dir: "right", grid: [
      "S....o.",
      ".......",
      "..#....",
      ".o...o.",
      ".......",
      "...#...",
      ".o...oT"
    ]},
    { name: "Ikki nishon", dir: "right", grid: [
      "S....T.o",
      "........",
      "..#.....",
      ".o......",
      "........",
      ".......T",
      "....o...",
      "........"
    ]},
    { name: "Labirint", dir: "down", grid: [
      "S.......",
      "..#.....",
      "........",
      "....o...",
      "o......o",
      "...#....",
      "..o.....",
      ".......T"
    ]},
    { name: "Yakuniy nur", dir: "right", grid: [
      "S..T..o..",
      ".........",
      "....#....",
      ".o...o..o",
      ".........",
      ".......#.",
      "..T...o..",
      ".........",
      ".o.....o."
    ]}
  ];

  // --- DOM ---
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  var hudLevel = document.getElementById("hud-level");
  var hudMoves = document.getElementById("hud-moves");
  var resetBtn = document.getElementById("reset-btn");
  var overlay = document.getElementById("overlay");
  var ovTitle = document.getElementById("ov-title");
  var ovText = document.getElementById("ov-text");
  var ovBest = document.getElementById("ov-best");
  var ovBtn = document.getElementById("ov-btn");

  // --- Holat ---
  var BEST_KEY = "yoruglik-best";
  var state = {
    idx: 0,
    cells: [],
    N: 0,
    cell: 0,
    source: null,
    dir: "right",
    targets: [],
    moves: 0,
    totalMoves: 0,
    solved: false,
    overlayMode: "start" // start | level | win
  };
  var t = 0; // animatsiya sanog'i

  function loadBest() {
    try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveBest(b) {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) {}
  }

  function buildLevel(i) {
    var lv = LEVELS[i];
    var g = lv.grid;
    var N = g.length;
    state.N = N;
    state.cell = W / N;
    state.dir = lv.dir;
    state.cells = [];
    state.targets = [];
    state.source = null;
    for (var r = 0; r < N; r++) {
      var row = [];
      for (var c = 0; c < N; c++) {
        var ch = g[r][c];
        var cell;
        if (ch === "#") cell = { type: "wall" };
        else if (ch === "S") { cell = { type: "source" }; state.source = [c, r]; }
        else if (ch === "T") { cell = { type: "target" }; state.targets.push(c + "," + r); }
        else if (ch === "/" || ch === "\\") cell = { type: "slot", mirror: ch };
        else if (ch === "o") cell = { type: "slot", mirror: "" };
        else cell = { type: "empty" };
        row.push(cell);
      }
      state.cells.push(row);
    }
    state.moves = 0;
    state.solved = false;
    state.prevLit = {}; // vizual: yoqilgan nishonlarni kuzatish (portlash uchun)
    FX.reset();
  }

  // Nurni manbadan iz bo'ylab kuzatish
  function traceBeam() {
    var pts = [];
    var lit = {};
    var dir = DIRS[state.dir].slice();
    var cx = state.source[0], cy = state.source[1];
    pts.push([cx, cy]);
    var steps = 0;
    while (steps++ < 2000) {
      var nx = cx + dir[0], ny = cy + dir[1];
      if (nx < 0 || ny < 0 || nx >= state.N || ny >= state.N) break;
      var cell = state.cells[ny][nx];
      if (cell.type === "wall") break;
      pts.push([nx, ny]);
      if (cell.type === "target") lit[nx + "," + ny] = true;
      if (cell.type === "slot" && cell.mirror) dir = reflect(dir, cell.mirror);
      cx = nx; cy = ny;
    }
    var allLit = state.targets.length > 0;
    for (var i = 0; i < state.targets.length; i++) {
      if (!lit[state.targets[i]]) allLit = false;
    }
    return { pts: pts, lit: lit, allLit: allLit };
  }

  // --- Chizish ---
  function cc(v) { return v * state.cell + state.cell / 2; } // katak markazi (piksel)

  function draw() {
    var cs = state.cell, N = state.N;
    // umumiy neon yulduzli fon
    FX.starfield(ctx, W, H, performance.now());

    // fon panjarasi
    ctx.strokeStyle = "#1b2230";
    ctx.lineWidth = 1;
    for (var i = 0; i <= N; i++) {
      ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cs); ctx.lineTo(W, i * cs); ctx.stroke();
    }

    var beam = traceBeam();

    // kataklar
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var cell = state.cells[r][c];
        var x = c * cs, y = r * cs;
        if (cell.type === "wall") {
          ctx.fillStyle = "#222b38";
          roundRect(x + 4, y + 4, cs - 8, cs - 8, 6); ctx.fill();
          ctx.strokeStyle = "#39424f"; ctx.lineWidth = 1.5;
          for (var k = -1; k < 3; k++) {
            ctx.beginPath();
            ctx.moveTo(x + 6 + k * (cs / 3), y + cs - 6);
            ctx.lineTo(x + 6 + k * (cs / 3) + cs, y - 6);
            ctx.stroke();
          }
        } else if (cell.type === "slot") {
          // uya doirasi
          ctx.fillStyle = "rgba(88,166,255,0.05)";
          roundRect(x + 5, y + 5, cs - 10, cs - 10, 8); ctx.fill();
          ctx.strokeStyle = cell.mirror ? "#5f6b7a" : "#2b3442";
          ctx.setLineDash(cell.mirror ? [] : [4, 4]);
          ctx.lineWidth = 1.5;
          roundRect(x + 5, y + 5, cs - 10, cs - 10, 8); ctx.stroke();
          ctx.setLineDash([]);
          // ko'zgu chizig'i (neon cyan porlash)
          if (cell.mirror) {
            var m = cs * 0.28;
            var mx1, my1, mx2, my2;
            if (cell.mirror === "/") {
              mx1 = x + cs / 2 + m; my1 = y + cs / 2 - m;
              mx2 = x + cs / 2 - m; my2 = y + cs / 2 + m;
            } else {
              mx1 = x + cs / 2 - m; my1 = y + cs / 2 - m;
              mx2 = x + cs / 2 + m; my2 = y + cs / 2 + m;
            }
            FX.glowLine(ctx, mx1, my1, mx2, my2, "#22d3ee", 5, 14);
          }
        }
      }
    }

    // nur (yorqin porlovchi chiziq — amber yadro)
    if (beam.pts.length > 1) {
      for (var bi = 1; bi < beam.pts.length; bi++) {
        var p0 = beam.pts[bi - 1], p1 = beam.pts[bi];
        FX.glowLine(ctx, cc(p0[0]), cc(p0[1]), cc(p1[0]), cc(p1[1]), "#fbbf24", 7, 18);
        FX.glowLine(ctx, cc(p0[0]), cc(p0[1]), cc(p1[0]), cc(p1[1]), "#fff4b8", 2.5, 10);
      }
      // nur boshi (harakatlanuvchi uchqun)
      var head = beam.pts[beam.pts.length - 1];
      var spark = 3 + Math.sin(t * 0.15) * 1.2;
      FX.glowCircle(ctx, cc(head[0]), cc(head[1]), spark + 2, "#fff4b8", 16);
    }

    // vizual: yangi yoqilgan nishonda portlash
    for (var lk in beam.lit) {
      if (!state.prevLit[lk]) {
        var lp = lk.split(",");
        FX.burst(cc(+lp[0]), cc(+lp[1]), "#34d399", 12);
      }
    }
    state.prevLit = beam.lit;

    // nishonlar
    for (var ti = 0; ti < N; ti++) {
      for (var tj = 0; tj < N; tj++) {
        var tc = state.cells[ti][tj];
        if (tc.type === "target") {
          var lit = !!beam.lit[tj + "," + ti];
          drawTarget(tj * cs, ti * cs, cs, lit);
        }
      }
    }

    // manba (lampa)
    drawSource(state.source[0] * cs, state.source[1] * cs, cs);

    // zarrachalar (portlashlar)
    FX.render(ctx);

    // g'alaba tekshiruvi
    if (!state.solved && beam.allLit) {
      state.solved = true;
      setTimeout(onSolved, 420);
    }
  }

  function strokeBeam(pts) {
    ctx.beginPath();
    ctx.moveTo(cc(pts[0][0]), cc(pts[0][1]));
    for (var i = 1; i < pts.length; i++) ctx.lineTo(cc(pts[i][0]), cc(pts[i][1]));
    ctx.stroke();
  }

  function drawSource(x, y, cs) {
    var cx = x + cs / 2, cy = y + cs / 2;
    // porlovchi lampa (neon amber)
    var glow = 22 + Math.sin(t * 0.12) * 8;
    FX.glowCircle(ctx, cx, cy, cs * 0.24, "#fbbf24", glow);
    FX.glowCircle(ctx, cx, cy, cs * 0.13, "#fff8d6", 14);
    // yo'nalish belgisi
    var d = DIRS[state.dir];
    ctx.save();
    ctx.strokeStyle = "#04101f"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + d[0] * cs * 0.28, cy + d[1] * cs * 0.28);
    ctx.stroke();
    ctx.restore();
  }

  function drawTarget(x, y, cs, lit) {
    var cx = x + cs / 2, cy = y + cs / 2;
    var col = lit ? "#34d399" : "#8b949e";
    if (lit) {
      // yashil neon halo
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(t * 0.2) * 0.2;
      FX.glowCircle(ctx, cx, cy, cs * 0.16, "#34d399", 22);
      ctx.restore();
    }
    ctx.save();
    if (lit) { ctx.shadowColor = "#34d399"; ctx.shadowBlur = 14; }
    ctx.strokeStyle = col; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, cs * 0.26, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, cs * 0.13, 0, Math.PI * 2); ctx.stroke();
    if (lit) {
      ctx.fillStyle = "#34d399";
      ctx.beginPath(); ctx.arc(cx, cy, cs * 0.06, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
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

  // --- O'zaro ta'sir ---
  function handlePoint(clientX, clientY) {
    if (!overlay.classList.contains("hidden")) return;
    if (state.solved) return;
    var rect = canvas.getBoundingClientRect();
    var sx = W / rect.width, sy = H / rect.height;
    var px = (clientX - rect.left) * sx;
    var py = (clientY - rect.top) * sy;
    var c = Math.floor(px / state.cell);
    var r = Math.floor(py / state.cell);
    if (c < 0 || r < 0 || c >= state.N || r >= state.N) return;
    var cell = state.cells[r][c];
    if (cell.type !== "slot") return;
    // aylanish:  /  ->  \  ->  o'chiq  ->  /
    if (cell.mirror === "/") cell.mirror = "\\";
    else if (cell.mirror === "\\") cell.mirror = "";
    else cell.mirror = "/";
    state.moves++;
    updateHud();
    draw();
  }

  canvas.addEventListener("click", function (e) {
    handlePoint(e.clientX, e.clientY);
  });
  canvas.addEventListener("touchstart", function (e) {
    if (!e.touches.length) return;
    e.preventDefault();
    var tch = e.touches[0];
    handlePoint(tch.clientX, tch.clientY);
  }, { passive: false });

  resetBtn.addEventListener("click", function () {
    buildLevel(state.idx);
    updateHud();
    draw();
  });

  function updateHud() {
    hudLevel.textContent = "Bosqich " + (state.idx + 1) + "/" + LEVELS.length;
    hudMoves.textContent = "Yurishlar: " + state.moves;
  }

  // --- Overlaylar ---
  function showOverlay(mode) {
    state.overlayMode = mode;
    var best = loadBest();
    if (mode === "start") {
      ovTitle.textContent = "💡 Yorug'lik";
      ovText.textContent = "Ko'zgularni bosib burab, nurni nishonga yo'naltir. Ko'zgu holatlari: / → \\ → o'chiq.";
      ovBest.textContent = best.cleared ? ("Eng yaxshi natija: " + best.cleared + " bosqich, " + (best.bestMoves != null ? best.bestMoves + " yurish" : "")) : "";
      ovBtn.textContent = "Boshlash";
    } else if (mode === "level") {
      ovTitle.textContent = "✅ Bosqich yakunlandi!";
      ovText.textContent = LEVELS[state.idx].name + " — " + state.moves + " yurishda hal qilindi.";
      ovBest.textContent = "";
      ovBtn.textContent = "Keyingi bosqich →";
    } else if (mode === "win") {
      ovTitle.textContent = "🏆 Barcha nurlar yoqildi!";
      ovText.textContent = "Barcha " + LEVELS.length + " bosqich hal qilindi. Jami " + state.totalMoves + " yurish.";
      ovBest.textContent = best.bestMoves != null ? ("Rekord: " + best.bestMoves + " yurish") : "";
      ovBtn.textContent = "Qaytadan o'ynash";
    }
    overlay.classList.remove("hidden");
  }
  function hideOverlay() { overlay.classList.add("hidden"); }

  function onSolved() {
    FX.burst(W / 2, H / 2, "#34d399", 22); // bosqich hal qilindi
    state.totalMoves += state.moves;
    if (state.idx >= LEVELS.length - 1) {
      // yakuniy g'alaba — rekordni saqlash
      var best = loadBest();
      best.cleared = LEVELS.length;
      if (best.bestMoves == null || state.totalMoves < best.bestMoves) best.bestMoves = state.totalMoves;
      saveBest(best);
      showOverlay("win");
    } else {
      showOverlay("level");
    }
  }

  function advance() {
    var mode = state.overlayMode;
    hideOverlay();
    if (mode === "start") {
      state.idx = 0; state.totalMoves = 0;
      buildLevel(0);
    } else if (mode === "level") {
      state.idx++;
      buildLevel(state.idx);
    } else if (mode === "win") {
      state.idx = 0; state.totalMoves = 0;
      buildLevel(0);
    }
    updateHud();
    draw();
  }

  ovBtn.addEventListener("click", advance);
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space") {
      e.preventDefault();
      if (!overlay.classList.contains("hidden")) advance();
    }
  });

  // --- Animatsiya sikli ---
  function loop() {
    t++;
    FX.update(16);
    if (overlay.classList.contains("hidden") || state.overlayMode === "start") draw();
    requestAnimationFrame(loop);
  }

  // Init: birinchi bosqichni yuklab, chizamiz; start overlay ustida turadi.
  buildLevel(0);
  updateHud();
  draw();
  showOverlay("start");
  loop();
})();
