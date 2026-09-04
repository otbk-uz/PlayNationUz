// 🔗 Zanjir (Chain) — ikki to'p bitta qattiq sterjenda.
// Novel mexanika: markaz avtomatik o'ngga siljiydi (dunyo chapga suriladi),
// ikki to'p markaz ± (rodLen/2) da joylashadi. O'yinchi butun juftni AYLANTIRADI
// (burchakni o'zgartiradi) va har bir devor teshigidan o'tkazadi:
//   - gorizontal teshik  -> juft GORIZONTAL bo'lishi kerak
//   - vertikal teshik    -> juft VERTIKAL bo'lishi kerak (markazda to'siq bor)
(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;   // 480
  const H = canvas.height;  // 480

  // HUD / overlay elementlari
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const startOverlay = document.getElementById('startOverlay');
  const overOverlay = document.getElementById('overOverlay');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const finalBestEl = document.getElementById('finalBest');

  // ── O'yin doimiylari ─────────────────────────────────────────────
  const BEST_KEY = 'zanjir-best';
  const centerX = 140;      // juft markazining ekrandagi X (qo'zg'almas)
  const centerY = H / 2;    // markaz Y (qo'zg'almas — adolat uchun)
  const r = 14;             // to'p radiusi
  const halfRod = 60;       // sterjen yarim uzunligi
  const rotSpeed = 0.085;   // aylanish tezligi (rad / kadr)
  const tw = 16;            // devor qalinligi (X)
  const bandHalf = tw / 2 + r; // to'p devor "tekisligi" bilan kesishish yarim eni
  const SPACING = 232;      // devorlar orasidagi masofa
  const SPEED_START = 1.6;
  const SPEED_STEP = 0.12;
  const SPEED_MAX = 4.2;

  // Teshik shakllari (markaz Y = 240 atrofida, sterjen ±60 ga mos)
  const H_OPEN = [[centerY - 25, centerY + 25]];              // gorizontal: bitta markaziy oyna
  const V_OPEN = [[centerY - halfRod - 25, centerY - halfRod + 25],
                  [centerY + halfRod - 25, centerY + halfRod + 25]]; // vertikal: ikkita oyna

  // ── Holat ────────────────────────────────────────────────────────
  let state = 'start'; // 'start' | 'play' | 'over'
  let angle = 0;       // 0 = gorizontal, PI/2 = vertikal
  let walls = [];
  let speed = SPEED_START;
  let score = 0;
  let best = 0;
  let rotDir = 0;      // -1 = CCW (chapga), +1 = CW (o'ngga), 0 = to'xta
  let rafId = null;

  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { best = 0; }
  bestEl.textContent = best;

  // ── Yordamchilar ─────────────────────────────────────────────────
  function ballPositions() {
    const dx = Math.cos(angle) * halfRod;
    const dy = Math.sin(angle) * halfRod;
    return [
      { x: centerX + dx, y: centerY + dy },
      { x: centerX - dx, y: centerY - dy },
    ];
  }

  function makeWall(x) {
    const vertical = Math.random() < 0.5;
    return {
      x,
      vertical,
      openings: vertical ? V_OPEN : H_OPEN,
      scored: false,
    };
  }

  function resetWalls() {
    walls = [];
    let x = W + 120;
    for (let i = 0; i < 4; i++) {
      walls.push(makeWall(x));
      x += SPACING;
    }
  }

  function reset() {
    angle = 0;
    speed = SPEED_START;
    score = 0;
    rotDir = 0;
    resetWalls();
    scoreEl.textContent = '0';
  }

  function startGame() {
    reset();
    if (window.FX) FX.reset();
    state = 'play';
    startOverlay.classList.add('hidden');
    overOverlay.classList.add('hidden');
  }

  function gameOver() {
    state = 'over';
    if (window.FX) FX.shake(7);
    if (score > best) {
      best = score;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    }
    bestEl.textContent = best;
    finalScoreEl.textContent = score;
    finalBestEl.textContent = best;
    overOverlay.classList.remove('hidden');
  }

  // Bitta to'p bitta devor bilan urishganmi?
  function ballHitsWall(b, wall) {
    if (Math.abs(b.x - wall.x) >= bandHalf) return false; // devor tekisligida emas
    // Devor tekisligida: to'p to'liq biror oyna ichida bo'lishi shart
    for (const [y1, y2] of wall.openings) {
      if (b.y - r >= y1 && b.y + r <= y2) return false; // xavfsiz oynada
    }
    return true; // devor moddasiga tegdi
  }

  // ── Yangilash ────────────────────────────────────────────────────
  function update() {
    // aylantirish
    if (rotDir !== 0) angle += rotDir * rotSpeed;

    // dunyo chapga suriladi
    for (const wall of walls) {
      wall.x -= speed;
      if (!wall.scored && wall.x < centerX) {
        wall.scored = true;
        score += 1;
        if (window.FX) FX.burst(centerX, centerY, '#34d399', 12);
        scoreEl.textContent = score;
        speed = Math.min(SPEED_MAX, SPEED_START + score * SPEED_STEP);
      }
    }

    // chapdan chiqqan devorlarni olib tashlab, o'ngga yangisini qo'shish
    while (walls.length && walls[0].x < -tw - r) walls.shift();
    let lastX = walls.length ? walls[walls.length - 1].x : centerX;
    while (lastX < W + SPACING) {
      lastX += SPACING;
      walls.push(makeWall(lastX));
    }

    // to'qnashuv
    const balls = ballPositions();
    for (const wall of walls) {
      for (const b of balls) {
        if (ballHitsWall(b, wall)) { gameOver(); return; }
      }
    }
  }

  // ── Chizish ──────────────────────────────────────────────────────
  function drawWall(wall) {
    const left = wall.x - tw / 2;
    // to'liq ustun — panel toni
    ctx.fillStyle = '#161e2c';
    ctx.fillRect(left, 0, tw, H);
    ctx.strokeStyle = 'rgba(120,160,255,0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, 0.5, tw - 1, H - 1);
    // oynalarni "o'yib" chiqamiz — amber yorug' chegara
    for (const [y1, y2] of wall.openings) {
      ctx.fillStyle = '#070b14';
      ctx.fillRect(left - 1, y1, tw + 2, y2 - y1);
      if (window.FX) {
        FX.glowLine(ctx, left - 1, y1, left + tw + 1, y1, '#fbbf24', 2, 10);
        FX.glowLine(ctx, left - 1, y2, left + tw + 1, y2, '#fbbf24', 2, 10);
      } else {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left - 1, y1); ctx.lineTo(left + tw + 1, y1);
        ctx.moveTo(left - 1, y2); ctx.lineTo(left + tw + 1, y2);
        ctx.stroke();
      }
    }
  }

  function draw() {
    // animatsion yulduzli fon (umumiy FX)
    if (window.FX) FX.starfield(ctx, W, H, performance.now());
    else { ctx.clearRect(0, 0, W, H); }

    if (window.FX) FX.update(16);
    const shaken = window.FX ? FX.applyShake(ctx) : false;

    // devorlar
    for (const wall of walls) drawWall(wall);

    // sterjen + to'plar (yorug')
    const balls = ballPositions();
    if (window.FX) {
      FX.glowLine(ctx, balls[0].x, balls[0].y, balls[1].x, balls[1].y, '#a78bfa', 7, 14);
    } else {
      ctx.strokeStyle = '#e6edf3';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(balls[0].x, balls[0].y);
      ctx.lineTo(balls[1].x, balls[1].y);
      ctx.stroke();
    }

    for (const b of balls) {
      if (window.FX) {
        FX.glowCircle(ctx, b.x, b.y, r, '#22d3ee', 16);
      } else {
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();
      }
      // yaltiroq nuqta
      ctx.beginPath();
      ctx.arc(b.x - r * 0.3, b.y - r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(230,237,243,0.75)';
      ctx.fill();
    }

    // markaz nuqtasi
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#8ea3c7';
    ctx.fill();

    if (window.FX) FX.render(ctx);
    if (shaken) FX.restore(ctx);
  }

  // ── Sikl ─────────────────────────────────────────────────────────
  function loop() {
    if (state === 'play') update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // ── Boshqaruv ────────────────────────────────────────────────────
  function setRot(dir) { rotDir = dir; }

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (state !== 'play') {
      if (k === ' ' || k === 'Enter') { e.preventDefault(); startGame(); }
      return;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { setRot(-1); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { setRot(1); e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { setRot(1); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' ||
        k === 'ArrowRight' || k === 'd' || k === 'D' ||
        k === 'ArrowUp' || k === 'w' || k === 'W') {
      setRot(0);
    }
  });

  // Sensorli / sichqoncha: chap yarim = CCW, o'ng yarim = CW
  function pointerDir(clientX) {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left) < rect.width / 2 ? -1 : 1;
  }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (state !== 'play') { if (state === 'start' || state === 'over') startGame(); return; }
    setRot(pointerDir(e.clientX));
  });
  canvas.addEventListener('pointermove', (e) => {
    if (state === 'play' && rotDir !== 0 && e.buttons) setRot(pointerDir(e.clientX));
  });
  window.addEventListener('pointerup', () => setRot(0));
  window.addEventListener('pointercancel', () => setRot(0));

  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);

  // ── Init: dastlabki holatni chizish ──────────────────────────────
  reset();
  draw();
  loop();
})();
