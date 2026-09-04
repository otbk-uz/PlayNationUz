// Toj — mijoz mantig'i: lobby, xona, o'yin renderi, boshqaruv.
(() => {
  const $ = (id) => document.getElementById(id);
  const sections = ['lobby', 'room', 'game', 'over'];
  function show(name) {
    sections.forEach((s) => $(s).classList.toggle('hidden', s !== name));
  }
  function status(msg) { $('status').textContent = msg || ''; }

  const nickEl = $('nick');
  nickEl.value = localStorage.getItem('toj-nick') || '';

  // server eslatmasi
  $('serverNote').innerHTML =
    `Server: <b>${Net.serverUrl()}</b> · <a id="changeServer">o'zgartirish</a>`;
  $('changeServer').onclick = () => {
    const url = prompt('WebSocket server manzili (masalan wss://sizning-domen):', Net.serverUrl());
    if (url) Net.setServer(url.trim());
  };

  let myId = null;
  let isHost = false;
  let roomCode = null;
  let latest = null;      // oxirgi state
  let overShown = false;

  async function ensureConnected() {
    if (Net.isOpen()) return true;
    status('Serverga ulanmoqda...');
    try {
      await Net.connect();
      status('');
      return true;
    } catch {
      status("Serverga ulanib bo'lmadi. Server ishga tushganini tekshiring.");
      return false;
    }
  }

  // --- Lobby tugmalari ---
  $('createBtn').onclick = async () => {
    const nick = nickEl.value.trim();
    if (!nick) return status('Avval ismingizni kiriting');
    localStorage.setItem('toj-nick', nick);
    if (!(await ensureConnected())) return;
    Net.send({ t: 'join', nick, game: 'toj' });
  };

  $('joinBtn').onclick = async () => {
    const nick = nickEl.value.trim();
    const room = $('roomInput').value.trim().toUpperCase();
    if (!nick) return status('Avval ismingizni kiriting');
    if (room.length !== 4) return status("4 harfli xona kodini kiriting");
    localStorage.setItem('toj-nick', nick);
    if (!(await ensureConnected())) return;
    Net.send({ t: 'join', room, nick, game: 'toj' });
  };

  $('copyBtn').onclick = () => {
    if (roomCode && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode).then(() => status('Kod nusxalandi'));
    }
  };

  $('startBtn').onclick = () => Net.send({ t: 'start' });

  // --- Server hodisalari ---
  Net.on('close', () => status('Ulanish uzildi'));
  Net.on('reconnecting', () => status('Qayta ulanmoqda...'));
  Net.on('reconnected', () => status(''));
  Net.on('neterror', () => status("Server bilan aloqa xatosi"));
  Net.on('error', (m) => { if (m && m.msg) status(m.msg); }); // server xato xabari
  Net.on('joined', (m) => {
    myId = m.id; isHost = m.host; roomCode = m.room;
    $('roomCode').textContent = m.room;
    show('room');
    status('');
  });
  Net.on('lobby', (m) => {
    roomCode = m.room;
    $('roomCode').textContent = m.room;
    isHost = (m.host === myId);
    const list = $('playerList');
    list.innerHTML = '';
    m.players.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="dot"></span>${escapeHtml(p.nick)}` +
        (p.host ? '<span class="badge">host</span>' : '');
      list.appendChild(li);
    });
    const enough = m.players.length >= m.min;
    $('startBtn').classList.toggle('hidden', !(isHost && enough));
    $('waitNote').textContent = enough
      ? (isHost ? "Tayyor bo'lsangiz — Boshlash" : 'Host boshlashini kuting...')
      : `Yana o'yinchi kutilmoqda (kamida ${m.min})`;
    if (!overShown) show('room');
    overShown = false;
  });
  Net.on('begin', () => {
    overShown = false;
    show('game');
    status('');
    startInput();
    requestAnimationFrame(renderLoop);
  });
  Net.on('state', (m) => { latest = m; });
  Net.on('over', (m) => {
    overShown = true;
    const list = $('scoreList');
    list.innerHTML = '';
    (m.scores || []).forEach((s) => {
      const li = document.createElement('li');
      li.textContent = `${s.nick} — ${s.score}`;
      list.appendChild(li);
    });
    $('overTitle').textContent = m.winner ? `🏆 ${m.winner.nick} yutdi!` : "O'yin tugadi";
    show('over');
    stopInput();
  });

  // --- Boshqaruv (input) ---
  const keys = { up: false, down: false, left: false, right: false };
  let inputActive = false;

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  function sendInput() { Net.send({ t: 'input', input: { ...keys } }); }

  function onKey(e, down) {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (keys[k] !== down) { keys[k] = down; sendInput(); }
  }
  const kd = (e) => onKey(e, true);
  const ku = (e) => onKey(e, false);

  function startInput() {
    if (inputActive) return;
    inputActive = true;
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
  }
  function stopInput() {
    inputActive = false;
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    Object.keys(keys).forEach((k) => (keys[k] = false));
  }

  // mobil tugmalar
  document.querySelectorAll('.controls-mobile button').forEach((b) => {
    const dir = b.dataset.k;
    const set = (v) => { if (keys[dir] !== v) { keys[dir] = v; sendInput(); } };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); set(true); });
    b.addEventListener('pointerup', (e) => { e.preventDefault(); set(false); });
    b.addEventListener('pointerleave', () => set(false));
    b.addEventListener('pointercancel', () => set(false));
  });

  // --- Render ---
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  let inHillPrev = new Set(); // hill'ga kim kirganini kuzatish (faqat vizual FX uchun)

  function renderLoop() {
    if ($('game').classList.contains('hidden')) return; // o'yin ekrani yopiq
    draw();
    requestAnimationFrame(renderLoop);
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    const hasFX = !!window.FX;

    // animatsion neon yulduzli fon
    if (hasFX) FX.starfield(ctx, W, H, performance.now());
    else { ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b0f16'; ctx.fillRect(0, 0, W, H); }

    if (!latest) { if (hasFX) { FX.update(16); FX.render(ctx); } return; }

    const hill = latest.hill;
    const holder = latest.holder;

    // tepalik — nurli halqa (past alfa to'ldirish + porlagan chiziq, egallovchi rangida)
    const holderColor = holder && latest.players.find((p) => p.id === holder);
    const hillTint = holderColor ? holderColor.color : '#8ea3c7';
    ctx.save();
    ctx.beginPath();
    ctx.arc(hill.x, hill.y, hill.r, 0, Math.PI * 2);
    ctx.fillStyle = hexA(hillTint, 0.12);
    ctx.fill();
    ctx.shadowColor = hillTint;
    ctx.shadowBlur = 24;
    ctx.lineWidth = 3;
    ctx.strokeStyle = hillTint;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', hill.x, hill.y + 10);

    // scoreboard (yuqorida) — matn o'zgarmadi
    const target = latest.target || 100;
    const sorted = [...latest.players].sort((a, b) => b.score - a.score);
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px system-ui, sans-serif';
    sorted.slice(0, 4).forEach((p, i) => {
      ctx.fillStyle = p.color;
      ctx.fillText(`${p.nick}: ${p.score}/${target}`, 14, 24 + i * 20);
    });

    // o'yinchilar — porlagan doiralar; hill'ga kirganda zarracha portlashi
    const nowIn = new Set();
    for (const p of latest.players) {
      const dx = p.x - hill.x, dy = p.y - hill.y;
      if (dx * dx + dy * dy <= hill.r * hill.r) {
        nowIn.add(p.id);
        if (hasFX && !inHillPrev.has(p.id)) FX.burst(p.x, p.y, p.color, 12);
      }
      if (hasFX) FX.glowCircle(ctx, p.x, p.y, 18, p.color, 18);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); }
      if (p.id === myId) {
        ctx.save();
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff';
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#e6edf3';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.nick, p.x, p.y - 26);
    }
    inHillPrev = nowIn;

    if (hasFX) { FX.update(16); FX.render(ctx); }
  }

  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // dastlab: ulanishga urinamiz (xatolik bo'lsa faqat status ko'rsatamiz)
  ensureConnected();
})();
