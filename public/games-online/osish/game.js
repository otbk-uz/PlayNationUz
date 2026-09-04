// 🌱 O'sish — original "growing walls" maze race.
// Har qadamingizda devorlar ham o'sadi. Chiqishga yeting, qamalib qolmang.
(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const elLevel = document.getElementById('level');
  const elSteps = document.getElementById('steps');
  const elBest = document.getElementById('best');
  const overlay = document.getElementById('overlay');
  const ovTitle = document.getElementById('ov-title');
  const ovText = document.getElementById('ov-text');
  const ovBtn = document.getElementById('ov-btn');

  const BEST_KEY = 'osish-best';
  const LEVEL_SIZES = [15, 17, 19, 21]; // hujayralar soni (bosqichlar)
  const MAX_LEVEL = LEVEL_SIZES.length;

  // Holatlar: 'start' | 'playing' | 'over' | 'next' | 'win'
  let phase = 'start';

  // O'yin holati
  let size = 15;
  let cs = W / size;
  let wall = [];      // wall[y][x] -> boolean
  let age = [];       // wall[y][x] -> qaysi qadamda paydo bo'lgan (rang uchun)
  let player = { x: 1, y: 1 };
  let exit = { x: 13, y: 13 };
  let level = 1;
  let turn = 0;       // shu bosqichdagi qadamlar
  let steps = 0;      // yugurishdagi umumiy qadamlar
  let best = 0;

  best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;

  // ---------- yordamchi ----------
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < size && y < size; }
  function isWall(x, y) { return !inBounds(x, y) || wall[y][x]; }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function emptyNeighbors(x, y) {
    let n = 0;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (inBounds(nx, ny) && !wall[ny][nx]) n++;
    }
    return n;
  }

  function isAdjacent(x, y, cell) {
    return (Math.abs(x - cell.x) + Math.abs(y - cell.y)) === 1;
  }

  // BFS: playerdan exitga yo'l bormi?
  function reachable() {
    const seen = new Uint8Array(size * size);
    const q = [[player.x, player.y]];
    seen[player.y * size + player.x] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      if (x === exit.x && y === exit.y) return true;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (!inBounds(nx, ny)) continue;
        if (wall[ny][nx]) continue;
        const idx = ny * size + nx;
        if (seen[idx]) continue;
        seen[idx] = 1;
        q.push([nx, ny]);
      }
    }
    return false;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- labirint yaratish ----------
  function buildLevel(lv) {
    if (window.FX) FX.reset();
    level = lv;
    size = LEVEL_SIZES[lv - 1];
    cs = W / size;
    turn = 0;
    player = { x: 1, y: 1 };
    exit = { x: size - 2, y: size - 2 };

    const density = 0.11; // ichki devorlar zichligi
    let ok = false, tries = 0;

    while (!ok && tries < 300) {
      tries++;
      wall = [];
      age = [];
      for (let y = 0; y < size; y++) {
        wall.push(new Array(size).fill(false));
        age.push(new Array(size).fill(0));
      }
      // chegara devorlari (eng eski)
      for (let i = 0; i < size; i++) {
        wall[0][i] = wall[size - 1][i] = true;
        wall[i][0] = wall[i][size - 1] = true;
        age[0][i] = age[size - 1][i] = -8;
        age[i][0] = age[i][size - 1] = -8;
      }
      // tasodifiy ichki to'siqlar (o'sish urug'lari)
      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          if (Math.random() < density) { wall[y][x] = true; age[y][x] = 0; }
        }
      }
      // start/exit va ularning atrofini bo'sh qilamiz
      for (const c of [player, exit]) {
        wall[c.y][c.x] = false;
        for (const [dx, dy] of DIRS) {
          const nx = c.x + dx, ny = c.y + dy;
          if (inBounds(nx, ny) && nx > 0 && ny > 0 && nx < size - 1 && ny < size - 1) {
            wall[ny][nx] = false;
          }
        }
      }
      ok = reachable();
    }

    if (!ok) {
      // zaxira: ichki devorlarsiz (albatta yechiladi)
      for (let y = 1; y < size - 1; y++)
        for (let x = 1; x < size - 1; x++) wall[y][x] = false;
    }
  }

  // ---------- o'sish qadami ----------
  function growthBudget() { return 1 + Math.floor(level / 2); }

  function grow() {
    // frontier: devorga tegib turgan bo'sh hujayralar
    const cand = [];
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        if (wall[y][x]) continue;
        if (x === player.x && y === player.y) continue;
        if (x === exit.x && y === exit.y) continue;
        let touch = false;
        for (const [dx, dy] of DIRS) {
          if (isWall(x + dx, y + dy)) { touch = true; break; }
        }
        if (touch) cand.push({ x, y });
      }
    }
    shuffle(cand);

    const budget = growthBudget();
    let placed = 0, adjPlayer = 0, adjExit = 0;

    for (const c of cand) {
      if (placed >= budget) break;
      const nearP = isAdjacent(c.x, c.y, player);
      const nearE = isAdjacent(c.x, c.y, exit);
      // Halollik: bir qadamda o'yinchining yonida ko'pi bilan 1 ta,
      // chiqish yonida ham ko'pi bilan 1 ta yangi devor o'ssin.
      if (nearP && adjPlayer >= 1) continue;
      if (nearE && adjExit >= 1) continue;
      wall[c.y][c.x] = true;
      age[c.y][c.x] = turn;
      placed++;
      if (nearP) adjPlayer++;
      if (nearE) adjExit++;
    }
  }

  // ---------- harakat ----------
  function move(dx, dy) {
    if (phase !== 'playing') return;
    const nx = player.x + dx, ny = player.y + dy;
    if (!inBounds(nx, ny) || wall[ny][nx]) return; // devorga kirib bo'lmaydi

    player.x = nx; player.y = ny;
    steps++;

    // Chiqishga yetdikmi?
    if (nx === exit.x && ny === exit.y) {
      updateHud();
      levelCleared();
      return;
    }

    // O'sish
    turn++;
    grow();
    updateHud();
    draw();

    // Mag'lubiyat sharti
    if (emptyNeighbors(player.x, player.y) === 0) {
      gameOver('Devorlar sizni har tomondan qamab oldi!');
      return;
    }
    if (!reachable()) {
      gameOver('Chiqish yo\'li butunlay to\'silib qoldi!');
      return;
    }
  }

  function levelCleared() {
    if (window.FX) FX.burst(exit.x * cs + cs / 2, exit.y * cs + cs / 2, '#34d399', 24, 4);
    saveBest();
    if (level >= MAX_LEVEL) {
      phase = 'win';
      showOverlay('🏆 G\'alaba!',
        `Barcha ${MAX_LEVEL} bosqichni yakunladingiz! Jami ${steps} qadam.`,
        'Qaytadan');
      return;
    }
    phase = 'next';
    showOverlay('✅ Bosqich o\'tildi!',
      `${level}-bosqich tugadi. Endi labirint kattaroq va devorlar tezroq o'sadi.`,
      'Keyingi bosqich');
  }

  function gameOver(msg) {
    phase = 'over';
    if (window.FX) { FX.burst(player.x * cs + cs / 2, player.y * cs + cs / 2, '#fb7185', 22); FX.shake(7); }
    saveBest();
    showOverlay('💀 O\'yin tugadi',
      `${msg} Siz ${steps} qadam bosib, ${level}-bosqichgacha yetdingiz.`,
      'Qaytadan');
  }

  function saveBest() {
    if (steps > best) {
      best = steps;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) { /* jim */ }
    }
    updateHud();
  }

  // ---------- HUD & overlay ----------
  function updateHud() {
    elLevel.textContent = String(level);
    elSteps.textContent = String(steps);
    elBest.textContent = String(best);
  }

  function showOverlay(title, text, btn) {
    ovTitle.textContent = title;
    ovText.textContent = text;
    ovBtn.textContent = btn;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  // ---------- chizish ----------
  function wallColor(a) {
    // a = paydo bo'lgan qadam. delta katta -> eski (to'q), kichik -> yangi (yorqin/xavf)
    const delta = turn - a;
    const t = Math.max(0, Math.min(1, delta / 8));
    // yangi: qizil-to'q sariq (xavf), eski: to'q yashil
    const hue = 6 + (150 - 6) * t;
    const sat = 85 - (85 - 30) * t;
    const lig = 56 - (56 - 20) * t;
    return `hsl(${hue}, ${sat}%, ${lig}%)`;
  }

  function draw() {
    // animatsion neon fon
    if (window.FX) FX.starfield(ctx, W, H, performance.now());
    else { ctx.fillStyle = '#070b14'; ctx.fillRect(0, 0, W, H); }

    const shaken = window.FX ? FX.applyShake(ctx) : false;

    // hujayra to'ri
    ctx.strokeStyle = 'rgba(120,160,255,0.14)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      const p = Math.round(i * cs) + 0.5;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
    }

    // devorlar — eng yangi front danger, eski devorlar so'nuq
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!wall[y][x]) continue;
        const px = x * cs, py = y * cs;
        const newest = (turn - age[y][x] <= 1 && age[y][x] >= 0);
        const col = newest ? '#fb7185' : wallColor(age[y][x]);
        if (window.FX) FX.glowRect(ctx, px + 1.5, py + 1.5, cs - 3, cs - 3, col, 4, newest ? 14 : 3);
        else { ctx.fillStyle = col; roundRect(px + 1.5, py + 1.5, cs - 3, cs - 3, 4); ctx.fill(); }
      }
    }

    // chiqish (yashil porlash)
    drawGlowCell(exit.x, exit.y, '#34d399', 22);

    // o'yinchi — kuchli moviy porlash
    const cx = player.x * cs + cs / 2, cy = player.y * cs + cs / 2;
    if (window.FX) FX.glowCircle(ctx, cx, cy, cs * 0.34, '#22d3ee', 20);
    ctx.save();
    ctx.fillStyle = '#eaf2ff';
    ctx.beginPath();
    ctx.arc(cx, cy, cs * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // zarrachalar
    if (window.FX) { FX.update(16); FX.render(ctx); }

    if (shaken) FX.restore(ctx);
  }

  function drawGlowCell(x, y, color, blur) {
    const px = x * cs, py = y * cs;
    if (window.FX) FX.glowRect(ctx, px + cs * 0.2, py + cs * 0.2, cs * 0.6, cs * 0.6, color, 5, blur);
    else {
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.fillStyle = color;
      roundRect(px + cs * 0.2, py + cs * 0.2, cs * 0.6, cs * 0.6, 5);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(px + cs * 0.34, py + cs * 0.34, cs * 0.32, cs * 0.32, 3);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    if (w < 0 || h < 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- oqim ----------
  function startRun() {
    steps = 0;
    buildLevel(1);
    phase = 'playing';
    hideOverlay();
    updateHud();
    draw();
  }

  function nextLevel() {
    buildLevel(level + 1);
    phase = 'playing';
    hideOverlay();
    updateHud();
    draw();
  }

  function onOvBtn() {
    if (phase === 'next') nextLevel();
    else startRun(); // start | over | win
  }

  // ---------- boshqaruv ----------
  const KEYMAP = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
  };

  window.addEventListener('keydown', (e) => {
    const m = KEYMAP[e.key];
    if (m) { e.preventDefault(); move(m[0], m[1]); return; }
    if ((e.key === 'Enter' || e.key === ' ') && phase !== 'playing') {
      e.preventDefault(); onOvBtn();
    }
  });

  ovBtn.addEventListener('click', onOvBtn);

  const DIRVEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  document.querySelectorAll('.pad').forEach((b) => {
    const v = DIRVEC[b.dataset.dir];
    b.addEventListener('click', (e) => { e.preventDefault(); move(v[0], v[1]); });
  });

  // ---------- render loop: fon animatsiyasi va zarrachalar uchun ----------
  // O'yin mantig'i o'zgarmaydi — bu faqat chizishni har kadrda yangilaydi.
  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  // ---------- init: birinchi bosqichni chizib qo'yamiz ----------
  buildLevel(1);
  updateHud();
  draw();
  requestAnimationFrame(loop);
  showOverlay('🌱 O\'sish',
    'Har qadamingizda devorlar ham o\'sib, bo\'sh kataklarni bosib boradi. ' +
    'Devorlar sizni qamab olmasidan yashil chiqishga yeting.',
    'Boshlash');
})();
