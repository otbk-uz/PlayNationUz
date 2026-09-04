"use strict";

/* 🧲 Magnit — magnit qutb-almashtirish o'yini.
   G'oya: o'yinchi hech qachon to'g'ridan-to'g'ri "thrust" bermaydi.
   Uning yagona ta'siri — qutbini (+ / −) almashtirish. Sahnadagi magnit
   tugunlar har kadrda uni tortadi (qarama-qarshi qutb) yoki itaradi
   (bir xil qutb). Kuch ~ k / masofa^2. Shu push/pull orqali boshqaramiz. */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;   // 480
const H = canvas.height;  // 480

const COL = {
  red: "#fb7185",   // + qutb (neon pushti)
  blue: "#22d3ee",  // − qutb (neon cyan)
  good: "#34d399",  // chiqish (neon yashil)
  danger: "#fb7185",
  line: "#30363d",
  muted: "#8b949e",
  wall: "#a78bfa"   // devor (neon violet)
};

// Qutb: +1 (qizil) yoki -1 (ko'k)
const PLUS = 1;
const MINUS = -1;

/* -------------------- Bosqichlar (qo'lda yasalgan) --------------------
   Har bir magnit: {x, y, pole}. pole PLUS yoki MINUS.
   Spike (tikan): {x, y, r}. Chiqish: {x, y, r}. Start: {x, y}.
   Ba'zi bosqichlarda devor to'siqlar (walls) — o'q bilan bloklaydi. */
const LEVELS = [
  {
    name: "Salom",
    start: { x: 70, y: 240 },
    exit: { x: 410, y: 240, r: 26 },
    magnets: [
      { x: 470, y: 240, pole: PLUS }
    ],
    spikes: [],
    walls: []
  },
  {
    name: "Ikki qutb",
    start: { x: 70, y: 90 },
    exit: { x: 410, y: 390, r: 24 },
    magnets: [
      { x: 180, y: 200, pole: PLUS },
      { x: 320, y: 300, pole: MINUS }
    ],
    spikes: [
      { x: 250, y: 250, r: 18 }
    ],
    walls: []
  },
  {
    name: "Yo'lak",
    start: { x: 60, y: 60 },
    exit: { x: 420, y: 420, r: 24 },
    magnets: [
      { x: 160, y: 160, pole: MINUS },
      { x: 320, y: 160, pole: PLUS },
      { x: 320, y: 320, pole: MINUS }
    ],
    spikes: [
      { x: 240, y: 240, r: 16 },
      { x: 160, y: 320, r: 16 }
    ],
    walls: [
      { x: 220, y: 90, w: 16, h: 130 }
    ]
  },
  {
    name: "Slalom",
    start: { x: 60, y: 240 },
    exit: { x: 420, y: 240, r: 22 },
    magnets: [
      { x: 150, y: 120, pole: PLUS },
      { x: 150, y: 360, pole: MINUS },
      { x: 300, y: 120, pole: MINUS },
      { x: 300, y: 360, pole: PLUS }
    ],
    spikes: [
      { x: 225, y: 240, r: 18 },
      { x: 375, y: 150, r: 15 },
      { x: 375, y: 330, r: 15 }
    ],
    walls: [
      { x: 210, y: 300, w: 120, h: 14 },
      { x: 210, y: 166, w: 120, h: 14 }
    ]
  },
  {
    name: "Tuzoq",
    start: { x: 240, y: 60 },
    exit: { x: 240, y: 420, r: 22 },
    magnets: [
      { x: 120, y: 240, pole: PLUS },
      { x: 360, y: 240, pole: MINUS },
      { x: 240, y: 200, pole: MINUS },
      { x: 240, y: 300, pole: PLUS }
    ],
    spikes: [
      { x: 180, y: 240, r: 16 },
      { x: 300, y: 240, r: 16 },
      { x: 240, y: 350, r: 14 },
      { x: 120, y: 120, r: 14 },
      { x: 360, y: 120, r: 14 }
    ],
    walls: [
      { x: 90, y: 340, w: 300, h: 14 }
    ]
  }
];

/* -------------------- Fizika parametrlari -------------------- */
const K = 4200;        // magnit kuch koeffitsiyenti
const MIN_DIST = 26;   // portlamaslik uchun eng kichik masofa
const DAMP = 0.965;    // suyultirish (damping) — boshqariladigan bo'lsin
const MAX_SPEED = 6.2;
const BALL_R = 9;
const MAG_R = 15;

/* -------------------- Holat -------------------- */
let levelIndex = 0;
let ball = { x: 0, y: 0, vx: 0, vy: 0, pole: PLUS };
let tries = 0;
let running = false;
let startTime = 0;
let field = null; // fon kuch-maydon "hint" cache

const best = loadBest();

const el = {
  level: document.getElementById("hud-level"),
  pole: document.getElementById("hud-pole"),
  tries: document.getElementById("hud-tries"),
  best: document.getElementById("hud-best"),
  btnPole: document.getElementById("btn-pole"),
  btnToggle: document.getElementById("btn-toggle"),
  overlay: document.getElementById("overlay"),
  win: document.getElementById("win"),
  winText: document.getElementById("win-text")
};

/* -------------------- localStorage rekord -------------------- */
function loadBest() {
  try {
    const raw = localStorage.getItem("magnit-best");
    if (!raw) return { levels: 0, time: null };
    const p = JSON.parse(raw);
    return { levels: p.levels || 0, time: p.time || null };
  } catch (e) {
    return { levels: 0, time: null };
  }
}
function saveBest() {
  try {
    localStorage.setItem("magnit-best", JSON.stringify(best));
  } catch (e) { /* jim */ }
}
function renderBest() {
  if (best.levels <= 0) {
    el.best.textContent = "—";
  } else if (best.time != null) {
    el.best.textContent = best.levels + " bosqich / " + best.time.toFixed(1) + "s";
  } else {
    el.best.textContent = best.levels + " bosqich";
  }
}

/* -------------------- Bosqich yuklash -------------------- */
function loadLevel(i) {
  levelIndex = i;
  const lv = LEVELS[i];
  ball.x = lv.start.x;
  ball.y = lv.start.y;
  ball.vx = 0;
  ball.vy = 0;
  // qutbni saqlaymiz, lekin birinchi kirishda + bo'lsin
  buildFieldHints();
  el.level.textContent = (i + 1) + " / " + LEVELS.length;
  updatePoleUI();
  draw();
}

function restartLevel() {
  if (!running) return;
  FX.shake(7);
  tries++;
  el.tries.textContent = tries;
  const lv = LEVELS[levelIndex];
  ball.x = lv.start.x;
  ball.y = lv.start.y;
  ball.vx = 0;
  ball.vy = 0;
}

/* -------------------- Qutb -------------------- */
function togglePole() {
  if (!running) return;
  ball.pole = -ball.pole;
  updatePoleUI();
}
function updatePoleUI() {
  const sym = ball.pole === PLUS ? "+" : "−";
  el.pole.textContent = sym;
  el.btnPole.textContent = sym;
  if (ball.pole === PLUS) {
    el.btnToggle.classList.remove("blue");
  } else {
    el.btnToggle.classList.add("blue");
  }
}

/* -------------------- Fizika qadami -------------------- */
function step() {
  const lv = LEVELS[levelIndex];
  let ax = 0, ay = 0;

  for (const m of lv.magnets) {
    const dx = m.x - ball.x;
    const dy = m.y - ball.y;
    let d = Math.hypot(dx, dy);
    if (d < MIN_DIST) d = MIN_DIST;
    const inv = 1 / d;
    const nx = dx * inv;
    const ny = dy * inv;
    const f = K / (d * d);
    // qarama-qarshi qutb (ko'paytma < 0) => tortish (magnit tomon +)
    // bir xil qutb (ko'paytma > 0) => itarish (magnitdan qochish −)
    const sign = (m.pole * ball.pole) < 0 ? 1 : -1;
    ax += nx * f * sign;
    ay += ny * f * sign;
  }

  ball.vx = (ball.vx + ax) * DAMP;
  ball.vy = (ball.vy + ay) * DAMP;

  // tezlikni cheklash
  const sp = Math.hypot(ball.vx, ball.vy);
  if (sp > MAX_SPEED) {
    const s = MAX_SPEED / sp;
    ball.vx *= s;
    ball.vy *= s;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // arena devorlari — sakrash
  if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = -ball.vx * 0.5; }
  if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -ball.vx * 0.5; }
  if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = -ball.vy * 0.5; }
  if (ball.y > H - BALL_R) { ball.y = H - BALL_R; ball.vy = -ball.vy * 0.5; }

  // ichki to'siq devorlar — bloklash (AABB vs shar, oddiy)
  for (const wl of lv.walls) {
    resolveWall(wl);
  }

  // spike (tikan) — restart
  for (const s of lv.spikes) {
    if (Math.hypot(s.x - ball.x, s.y - ball.y) < s.r + BALL_R) {
      FX.burst(ball.x, ball.y, "#fb7185", 22);
      restartLevel();
      return;
    }
  }
  // magnitga to'qnashsa ham tikandek emas — biroz surib chiqaramiz
  for (const m of lv.magnets) {
    const dd = Math.hypot(m.x - ball.x, m.y - ball.y);
    const minD = MAG_R + BALL_R;
    if (dd < minD && dd > 0.001) {
      const nx = (ball.x - m.x) / dd;
      const ny = (ball.y - m.y) / dd;
      ball.x = m.x + nx * minD;
      ball.y = m.y + ny * minD;
      ball.vx *= 0.6;
      ball.vy *= 0.6;
    }
  }

  // chiqish
  const ex = lv.exit;
  if (Math.hypot(ex.x - ball.x, ex.y - ball.y) < ex.r + BALL_R) {
    nextLevel();
  }
}

function resolveWall(wl) {
  const cx = Math.max(wl.x, Math.min(ball.x, wl.x + wl.w));
  const cy = Math.max(wl.y, Math.min(ball.y, wl.y + wl.h));
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const d = Math.hypot(dx, dy);
  if (d < BALL_R) {
    if (d > 0.001) {
      const nx = dx / d;
      const ny = dy / d;
      ball.x = cx + nx * BALL_R;
      ball.y = cy + ny * BALL_R;
      // normal bo'yicha tezlikni so'ndirish
      const vn = ball.vx * nx + ball.vy * ny;
      ball.vx -= vn * nx * 1.5;
      ball.vy -= vn * ny * 1.5;
    } else {
      ball.x = wl.x - BALL_R;
    }
  }
}

/* -------------------- Bosqich o'tish / g'alaba -------------------- */
function nextLevel() {
  FX.burst(ball.x, ball.y, "#34d399", 26);
  FX.burst(ball.x, ball.y, "#22d3ee", 14);
  const cleared = levelIndex + 1;
  // rekord: ko'proq bosqich, yoki teng bosqichda kamroq vaqt
  if (cleared > best.levels) {
    best.levels = cleared;
    best.time = (performance.now() - startTime) / 1000;
    saveBest();
  }
  renderBest();

  if (levelIndex + 1 >= LEVELS.length) {
    winGame();
  } else {
    loadLevel(levelIndex + 1);
  }
}

function winGame() {
  running = false;
  const total = (performance.now() - startTime) / 1000;
  // to'liq o'yin yakuni: agar barcha bosqich va vaqt yaxshiroq bo'lsa yozamiz
  best.levels = LEVELS.length;
  if (best.time == null || total < best.time) best.time = total;
  saveBest();
  renderBest();
  el.winText.textContent =
    "Barcha " + LEVELS.length + " bosqich tugadi! Vaqt: " +
    total.toFixed(1) + "s · Urinishlar: " + tries + ".";
  el.win.classList.remove("hidden");
}

/* -------------------- Chizish -------------------- */
function buildFieldHints() {
  // Kuch-maydon uchun oddiy grid nuqtalari (statik hint)
  field = [];
  const gap = 40;
  const lv = LEVELS[levelIndex];
  for (let gx = gap / 2; gx < W; gx += gap) {
    for (let gy = gap / 2; gy < H; gy += gap) {
      let fx = 0, fy = 0;
      for (const m of lv.magnets) {
        const dx = m.x - gx, dy = m.y - gy;
        let d = Math.hypot(dx, dy);
        if (d < MIN_DIST) d = MIN_DIST;
        const f = K / (d * d);
        // "+" qutb nuqtai nazaridan (referens) yo'nalish
        const s = m.pole === PLUS ? -1 : 1;
        fx += (dx / d) * f * s;
        fy += (dy / d) * f * s;
      }
      const mag = Math.hypot(fx, fy);
      field.push({ x: gx, y: gy, fx, fy, mag });
    }
  }
}

function draw() {
  const lv = LEVELS[levelIndex];

  FX.update(16);

  // animatsion neon yulduzli fon
  FX.starfield(ctx, W, H, performance.now());

  const shook = FX.applyShake(ctx);

  // kuch-maydon hint (faol qutbga qarab yo'nalish)
  if (field) {
    for (const p of field) {
      const scale = ball.pole === PLUS ? 1 : -1;
      const mag = p.mag;
      if (mag < 0.02) continue;
      const len = Math.min(14, 3 + mag * 260);
      const ux = (p.fx / mag) * scale;
      const uy = (p.fy / mag) * scale;
      const alpha = Math.min(0.5, 0.08 + mag * 4.5);
      ctx.strokeStyle = "rgba(34,211,238," + alpha.toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + ux * len, p.y + uy * len);
      ctx.stroke();
    }
  }

  // devorlar (violet neon)
  for (const wl of lv.walls) {
    FX.glowRect(ctx, wl.x, wl.y, wl.w, wl.h, COL.wall, 4, 10);
  }

  // chiqish (kuchli yashil neon)
  const ex = lv.exit;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(52,211,153,0.18)";
  ctx.fill();
  ctx.restore();
  FX.glowCircle(ctx, ex.x, ex.y, ex.r, COL.good, 24);
  ctx.save();
  ctx.fillStyle = "rgba(7,11,20,0.85)";
  ctx.font = "bold 16px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("♦", ex.x, ex.y);
  ctx.restore();

  // tikanlar
  for (const s of lv.spikes) {
    drawSpike(s);
  }

  // magnitlar
  for (const m of lv.magnets) {
    drawMagnet(m);
  }

  // o'yinchi shar (yengil iz bilan)
  if (running) FX.trail(ball.x, ball.y, ball.pole === PLUS ? COL.red : COL.blue);
  drawBall();

  if (shook) FX.restore(ctx);

  // zarrachalar hammasi ustidan
  FX.render(ctx);
}

function drawMagnet(m) {
  const c = m.pole === PLUS ? COL.red : COL.blue;
  ctx.save();
  // hosila halqa
  const g = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, MAG_R + 10);
  g.addColorStop(0, hexA(c, 0.55));
  g.addColorStop(1, hexA(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(m.x, m.y, MAG_R + 10, 0, Math.PI * 2);
  ctx.fill();

  FX.glowCircle(ctx, m.x, m.y, MAG_R, c, 16);
  ctx.beginPath();
  ctx.arc(m.x, m.y, MAG_R, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(m.pole === PLUS ? "+" : "−", m.x, m.y + 1);
  ctx.restore();
}

function drawSpike(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.shadowColor = COL.danger;
  ctx.shadowBlur = 14;
  ctx.fillStyle = COL.danger;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  const spikes = 8;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (Math.PI * i) / spikes;
    const rr = i % 2 === 0 ? s.r : s.r * 0.5;
    const px = Math.cos(ang) * rr;
    const py = Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBall() {
  const c = ball.pole === PLUS ? COL.red : COL.blue;
  ctx.save();
  // yorug'lik halosi
  const g = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, BALL_R + 8);
  g.addColorStop(0, hexA(c, 0.6));
  g.addColorStop(1, hexA(c, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R + 8, 0, Math.PI * 2);
  ctx.fill();

  FX.glowCircle(ctx, ball.x, ball.y, BALL_R, c, 22);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ball.pole === PLUS ? "+" : "−", ball.x, ball.y + 1);
  ctx.restore();
}

/* -------------------- Yordamchi chizish -------------------- */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

/* -------------------- Asosiy tsikl -------------------- */
function loop() {
  if (running) {
    step();
    draw();
  }
  requestAnimationFrame(loop);
}

/* -------------------- Boshqaruv -------------------- */
function startGame() {
  FX.reset();
  el.overlay.classList.add("hidden");
  el.win.classList.add("hidden");
  tries = 0;
  el.tries.textContent = 0;
  ball.pole = PLUS;
  levelIndex = 0;
  loadLevel(0);
  startTime = performance.now();
  running = true;
}

document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-again").addEventListener("click", startGame);
el.btnToggle.addEventListener("click", togglePole);
document.getElementById("btn-restart").addEventListener("click", restartLevel);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === " ") {
    e.preventDefault();
    if (!running && !el.overlay.classList.contains("hidden")) {
      startGame();
    } else {
      togglePole();
    }
  } else if (e.key === "r" || e.key === "R") {
    restartLevel();
  }
});

// kanvasga bosish/teginish ham qutbni almashtiradi (mobil qulaylik)
canvas.addEventListener("pointerdown", (e) => {
  if (running) {
    e.preventDefault();
    togglePole();
  }
});

/* -------------------- Init -------------------- */
renderBest();
loadLevel(0);   // birinchi bosqichni yuklab, chizib qo'yamiz (overlay ustida)
updatePoleUI();
requestAnimationFrame(loop);
