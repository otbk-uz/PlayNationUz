// Aks-sado — "Oyna Ilon" (umumiy neon tizim: ../_shared/neon.css + FX)
// Chap ilonni boshqarasiz. O'ng ilon uning ko'zgu aksi. Har ikkalasi tirik qolsin.
// MANTIQ o'zgarmagan — faqat chizish (render) FX kutubxonasiga ko'chirildi.
(() => {
  const CELL = 20, COLS = 15, ROWS = 15;
  const SIDE = COLS * CELL;      // 300
  const GAP = 16;
  const LW = SIDE * 2 + GAP;     // 616 (mantiqiy en)
  const LH = ROWS * CELL;        // 300 (mantiqiy bo'y)

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = LW * DPR;
  canvas.height = LH * DPR;
  ctx.scale(DPR, DPR);

  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const levelEl = document.getElementById('level');
  const overlay = document.getElementById('overlay');
  const ovTitle = document.getElementById('ov-title');
  const ovText = document.getElementById('ov-text');
  const startBtn = document.getElementById('startBtn');

  const BEST_KEY = 'aks-sado-best';

  // neon ranglar (chap = cyan, o'ng = pushti; bosh yorqinroq)
  const LEFT = { head: '#8befff', body: '#22d3ee', glow: '#22d3ee' };
  const RIGHT = { head: '#ffb0ea', body: '#f472b6', glow: '#f472b6' };
  const FOOD = '#34d399';

  let left, right, dir, nextDir, leftFood, rightFood;
  let score, level, stepMs, acc, lastTs;
  let running = false, paused = false, gameOver = false;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = best;

  const mirror = (d) => ({ x: -d.x, y: d.y });
  const eq = (a, b) => a.x === b.x && a.y === b.y;

  function randEmpty(snake) {
    const taken = new Set(snake.map((s) => s.x + ',' + s.y));
    const free = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++)
      if (!taken.has(x + ',' + y)) free.push({ x, y });
    return free[Math.floor(Math.random() * free.length)];
  }

  function initGame() {
    const cx = Math.floor(COLS / 2), cy = Math.floor(ROWS / 2);
    left = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    right = left.map((s) => ({ x: COLS - 1 - s.x, y: s.y }));
    dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
    leftFood = randEmpty(left); rightFood = randEmpty(right);
    score = 0; level = 1; stepMs = 140; acc = 0; gameOver = false; paused = false;
    FX.reset();
    updateHud();
  }

  function updateHud() { scoreEl.textContent = score; levelEl.textContent = level; bestEl.textContent = best; }

  const hitsWall = (h) => h.x < 0 || h.x >= COLS || h.y < 0 || h.y >= ROWS;
  function hitsSelf(h, snake) {
    for (let i = 0; i < snake.length - 1; i++) if (snake[i].x === h.x && snake[i].y === h.y) return true;
    return false;
  }

  function step() {
    dir = nextDir;
    const rdir = mirror(dir);
    const lh = { x: left[0].x + dir.x, y: left[0].y + dir.y };
    const rh = { x: right[0].x + rdir.x, y: right[0].y + rdir.y };
    if (hitsWall(lh) || hitsSelf(lh, left)) return endGame('left');
    if (hitsWall(rh) || hitsSelf(rh, right)) return endGame('right');

    left.unshift(lh);
    if (eq(lh, leftFood)) {
      score++; FX.shake(3);
      FX.burst(leftFood.x * CELL + CELL / 2, leftFood.y * CELL + CELL / 2, FOOD);
      leftFood = randEmpty(left);
    } else left.pop();

    right.unshift(rh);
    if (eq(rh, rightFood)) {
      score++; FX.shake(3);
      FX.burst((SIDE + GAP) + rightFood.x * CELL + CELL / 2, rightFood.y * CELL + CELL / 2, FOOD);
      rightFood = randEmpty(right);
    } else right.pop();

    const newLevel = 1 + Math.floor(score / 6);
    if (newLevel > level) { level = newLevel; stepMs = Math.max(70, 140 - (level - 1) * 10); }
    updateHud();
  }

  function endGame(which) {
    gameOver = true; running = false;
    if (score > best) { best = score; localStorage.setItem(BEST_KEY, String(best)); }
    updateHud();
    const head = which === 'left' ? left[0] : right[0];
    const ox = which === 'left' ? 0 : SIDE + GAP;
    FX.burst(ox + head.x * CELL + CELL / 2, head.y * CELL + CELL / 2,
      which === 'left' ? LEFT.glow : RIGHT.glow, 26);
    FX.shake(7);
    const who = which === 'left' ? 'Chap ilon' : "O'ng (aks) ilon";
    ovTitle.textContent = 'O\'yin tugadi';
    ovText.innerHTML = `${who} urildi. Ball: <b>${score}</b> · Rekord: <b>${best}</b>`;
    startBtn.textContent = 'Qayta o\'ynash';
    overlay.classList.remove('hidden');
  }

  // ---- Chizish (FX neon) ----
  function drawGrid(originX, color) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= COLS; x++) { ctx.moveTo(originX + x * CELL, 0); ctx.lineTo(originX + x * CELL, LH); }
    for (let y = 0; y <= ROWS; y++) { ctx.moveTo(originX, y * CELL); ctx.lineTo(originX + SIDE, y * CELL); }
    ctx.stroke();
    ctx.strokeStyle = color; ctx.globalAlpha = 0.25; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.strokeRect(originX + 0.5, 0.5, SIDE - 1, LH - 1);
    ctx.restore();
  }

  function drawDivider(t) {
    ctx.save();
    const g = ctx.createLinearGradient(SIDE, 0, SIDE + GAP, 0);
    const p = 0.5 + 0.5 * Math.sin(t / 400);
    g.addColorStop(0, 'rgba(34,211,238,0.05)');
    g.addColorStop(Math.max(0.01, Math.min(0.99, p)), 'rgba(244,114,182,0.4)');
    g.addColorStop(1, 'rgba(34,211,238,0.05)');
    ctx.fillStyle = g; ctx.fillRect(SIDE, 0, GAP, LH);
    ctx.restore();
    FX.glowLine(ctx, SIDE + GAP / 2, 0, SIDE + GAP / 2, LH, '#f472b6', 2, 12);
  }

  function drawSnake(snake, originX, pal) {
    for (let i = snake.length - 1; i >= 0; i--) {
      const s = snake[i];
      const px = originX + s.x * CELL + 1.5, py = s.y * CELL + 1.5;
      const isHead = i === 0;
      FX.glowRect(ctx, px, py, CELL - 3, CELL - 3, isHead ? pal.head : pal.body,
        isHead ? 6 : 5, isHead ? 22 : 12);
    }
  }

  function drawFood(food, originX, t) {
    const cx = originX + food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;
    const pulse = 1 + 0.18 * Math.sin(t / 160);
    FX.glowCircle(ctx, cx, cy, (CELL / 2 - 3) * pulse, FOOD, 18);
  }

  function draw(t) {
    FX.starfield(ctx, LW, LH, t);
    const shaken = FX.applyShake(ctx);

    drawGrid(0, LEFT.glow);
    drawGrid(SIDE + GAP, RIGHT.glow);
    drawDivider(t);

    drawFood(leftFood, 0, t);
    drawFood(rightFood, SIDE + GAP, t);

    drawSnake(left, 0, LEFT);
    drawSnake(right, SIDE + GAP, RIGHT);

    FX.render(ctx);
    if (shaken) FX.restore(ctx);

    if (paused) {
      ctx.save();
      ctx.fillStyle = 'rgba(8,12,20,0.65)'; ctx.fillRect(0, 0, LW, LH);
      ctx.fillStyle = '#e6edf3'; ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 16;
      ctx.fillText('Pauza', LW / 2, LH / 2);
      ctx.restore();
    }
  }

  // ---- Sikl ----
  function frame(ts) {
    if (lastTs == null) lastTs = ts;
    const dtMs = ts - lastTs; lastTs = ts;
    if (running && !paused) {
      acc += dtMs;
      while (acc >= stepMs) { acc -= stepMs; step(); if (!running) break; }
    }
    FX.update(16);
    draw(ts);
    requestAnimationFrame(frame);
  }

  function start() {
    initGame();
    overlay.classList.add('hidden');
    running = true; paused = false;
  }

  // ---- Boshqaruv ----
  function setDir(nx, ny) {
    if (left.length > 1 && nx === -dir.x && ny === -dir.y) return;
    nextDir = { x: nx, y: ny };
  }
  const KEYMAP = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
    ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); if (running && !gameOver) paused = !paused; return; }
    const m = KEYMAP[e.code];
    if (m && running && !paused) { e.preventDefault(); setDir(m[0], m[1]); }
  });
  document.querySelectorAll('.controls-mobile button').forEach((b) => {
    b.addEventListener('click', () => {
      if (!running || paused) return;
      const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const m = map[b.dataset.dir]; if (m) setDir(m[0], m[1]);
    });
  });
  startBtn.addEventListener('click', start);

  // boshlash: fon animatsiyasi darrov yuradi
  initGame();
  requestAnimationFrame(frame);
})();
