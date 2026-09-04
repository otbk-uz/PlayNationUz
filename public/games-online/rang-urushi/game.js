// Rang Urushi — mijoz: lobby, xona, grid render, boshqaruv.
(() => {
  const $ = (id) => document.getElementById(id);
  const sections = ['lobby', 'room', 'game', 'over'];
  const show = (name) => sections.forEach((s) => $(s).classList.toggle('hidden', s !== name));
  const status = (m) => { $('status').textContent = m || ''; };

  const TEAM_COLORS = ['#f85149', '#58a6ff'];

  const nickEl = $('nick');
  nickEl.value = localStorage.getItem('rang-nick') || '';

  $('serverNote').innerHTML = `Server: <b>${Net.serverUrl()}</b> · <a id="changeServer">o'zgartirish</a>`;
  $('changeServer').onclick = () => {
    const url = prompt('WebSocket server manzili (masalan wss://sizning-domen):', Net.serverUrl());
    if (url) Net.setServer(url.trim());
  };

  let myId = null, isHost = false, roomCode = null, latest = null, overShown = false;
  let gridStr = null; // oxirgi kelgan grid (har tickda kelmaydi — optimizatsiya)

  async function ensureConnected() {
    if (Net.isOpen()) return true;
    status('Serverga ulanmoqda...');
    try { await Net.connect(); status(''); return true; }
    catch { status("Serverga ulanib bo'lmadi. Server ishga tushganini tekshiring."); return false; }
  }

  $('createBtn').onclick = async () => {
    const nick = nickEl.value.trim();
    if (!nick) return status('Avval ismingizni kiriting');
    localStorage.setItem('rang-nick', nick);
    if (!(await ensureConnected())) return;
    Net.send({ t: 'join', nick, game: 'rang' });
  };
  $('joinBtn').onclick = async () => {
    const nick = nickEl.value.trim();
    const room = $('roomInput').value.trim().toUpperCase();
    if (!nick) return status('Avval ismingizni kiriting');
    if (room.length !== 4) return status('4 harfli xona kodini kiriting');
    localStorage.setItem('rang-nick', nick);
    if (!(await ensureConnected())) return;
    Net.send({ t: 'join', room, nick, game: 'rang' });
  };
  $('copyBtn').onclick = () => {
    if (roomCode && navigator.clipboard) navigator.clipboard.writeText(roomCode).then(() => status('Kod nusxalandi'));
  };
  $('startBtn').onclick = () => Net.send({ t: 'start' });

  Net.on('close', () => status('Ulanish uzildi'));
  Net.on('reconnecting', () => status('Qayta ulanmoqda...'));
  Net.on('reconnected', () => status(''));
  Net.on('neterror', () => status('Server bilan aloqa xatosi'));
  Net.on('error', (m) => { if (m && m.msg) status(m.msg); });
  Net.on('joined', (m) => {
    myId = m.id; isHost = m.host; roomCode = m.room;
    $('roomCode').textContent = m.room; show('room'); status('');
  });
  Net.on('lobby', (m) => {
    roomCode = m.room; $('roomCode').textContent = m.room; isHost = (m.host === myId);
    const list = $('playerList'); list.innerHTML = '';
    m.players.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="dot"></span>${escapeHtml(p.nick)}` + (p.host ? '<span class="badge">host</span>' : '');
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
  Net.on('begin', () => { overShown = false; gridStr = null; show('game'); status(''); startInput(); requestAnimationFrame(renderLoop); });
  Net.on('state', (m) => { latest = m; if (m.grid != null) gridStr = m.grid; });
  Net.on('over', (m) => {
    overShown = true;
    const list = $('scoreList'); list.innerHTML = '';
    (m.scores || []).forEach((s) => { const li = document.createElement('li'); li.textContent = `${s.nick} — ${s.score} katak`; list.appendChild(li); });
    $('overTitle').textContent = m.winner && m.winner.team >= 0 ? `🏆 ${m.winner.nick} yutdi!` : 'Durrang!';
    show('over'); stopInput();
  });

  // --- input ---
  const keys = { up: false, down: false, left: false, right: false };
  let inputActive = false;
  const KEYMAP = { ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right' };
  const sendInput = () => Net.send({ t: 'input', input: { ...keys } });
  function onKey(e, down) { const k = KEYMAP[e.code]; if (!k) return; e.preventDefault(); if (keys[k] !== down) { keys[k] = down; sendInput(); } }
  const kd = (e) => onKey(e, true), ku = (e) => onKey(e, false);
  function startInput() { if (inputActive) return; inputActive = true; window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); }
  function stopInput() { inputActive = false; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); Object.keys(keys).forEach((k) => keys[k] = false); }
  document.querySelectorAll('.controls-mobile button').forEach((b) => {
    const dir = b.dataset.k; const set = (v) => { if (keys[dir] !== v) { keys[dir] = v; sendInput(); } };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); set(true); });
    b.addEventListener('pointerup', (e) => { e.preventDefault(); set(false); });
    b.addEventListener('pointerleave', () => set(false));
    b.addEventListener('pointercancel', () => set(false));
  });

  // --- render ---
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  function renderLoop() { if ($('game').classList.contains('hidden')) return; draw(); requestAnimationFrame(renderLoop); }

  // jamoa rangini neon palitraga moslash: qizil -> #fb7185, ko'k -> #22d3ee
  const neonTeam = (hex) => {
    const m = /#?([0-9a-f]{6})/i.exec(hex || '');
    if (!m) return '#22d3ee';
    const n = parseInt(m[1], 16);
    return ((n >> 16) & 255) > (n & 255) ? '#fb7185' : '#22d3ee';
  };

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    FX.starfield(ctx, W, H, performance.now());
    if (!latest) { FX.update(16); FX.render(ctx); return; }
    const { cols, rows, cell } = latest;
    const grid = gridStr;

    // bo'yalgan kataklar — yorqin neon fill (og'ir shadowBlur yo'q, tez)
    if (grid && cols && rows) {
      for (let i = 0; i < grid.length; i++) {
        const v = grid.charCodeAt(i) - 48; // '0'|'1'|'2'
        if (v === 0) continue;
        const gx = i % cols, gy = Math.floor(i / cols);
        ctx.fillStyle = v === 1 ? '#fb7185' : '#22d3ee';
        ctx.fillRect(gx * cell, gy * cell, cell, cell);
      }
    }
    // to'r chiziqlari (yengil)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, rows * cell); ctx.stroke(); }
    for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * cell); ctx.lineTo(cols * cell, y * cell); ctx.stroke(); }

    // o'yinchilar — jamoa rangida yaltiroq nuqta, o'zingiz oq halqa
    for (const p of latest.players) {
      const nc = neonTeam(p.color);
      FX.glowCircle(ctx, p.x, p.y, 14, nc, 18);
      if (p.id === myId) {
        ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = '#eaf2ff'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.nick, p.x, p.y - 20);
    }

    FX.update(16); FX.render(ctx);

    // scorebar yangilash
    if (latest.counts) {
      $('teamA').textContent = `Qizil: ${latest.counts[0]}`;
      $('teamB').textContent = `Ko'k: ${latest.counts[1]}`;
    }
    if (typeof latest.time === 'number') $('timer').textContent = latest.time + 's';
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  ensureConnected();
})();
