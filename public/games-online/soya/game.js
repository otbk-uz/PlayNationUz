// Soya — mijoz: lobby, rollar, prop render, qidiruvchi bosib-tekshirishi.
(() => {
  const $ = (id) => document.getElementById(id);
  const sections = ['lobby', 'room', 'game', 'over'];
  const show = (name) => sections.forEach((s) => $(s).classList.toggle('hidden', s !== name));
  const status = (m) => { $('status').textContent = m || ''; };

  const PROPS = ['📦', '🪑', '🌵', '🛢️', '🗿', '🎁']; // 6 tur

  const nickEl = $('nick');
  nickEl.value = localStorage.getItem('soya-nick') || '';
  $('serverNote').innerHTML = `Server: <b>${Net.serverUrl()}</b> · <a id="changeServer">o'zgartirish</a>`;
  $('changeServer').onclick = () => { const u = prompt('WebSocket server manzili:', Net.serverUrl()); if (u) Net.setServer(u.trim()); };

  let myId = null, isHost = false, roomCode = null, latest = null, overShown = false;
  let myRole = null;
  let decoys = []; // statik predmetlar — har tickda kelmaydi (optimizatsiya)
  const bursted = new Set(); // ushlangan predmetlar — portlash bir marta

  async function ensureConnected() {
    if (Net.isOpen()) return true;
    status('Serverga ulanmoqda...');
    try { await Net.connect(); status(''); return true; }
    catch { status("Serverga ulanib bo'lmadi."); return false; }
  }

  $('createBtn').onclick = async () => {
    const nick = nickEl.value.trim(); if (!nick) return status('Avval ismingizni kiriting');
    localStorage.setItem('soya-nick', nick);
    if (!(await ensureConnected())) return; Net.send({ t: 'join', nick, game: 'soya' });
  };
  $('joinBtn').onclick = async () => {
    const nick = nickEl.value.trim(); const room = $('roomInput').value.trim().toUpperCase();
    if (!nick) return status('Avval ismingizni kiriting');
    if (room.length !== 4) return status('4 harfli kod kiriting');
    localStorage.setItem('soya-nick', nick);
    if (!(await ensureConnected())) return; Net.send({ t: 'join', room, nick, game: 'soya' });
  };
  $('copyBtn').onclick = () => { if (roomCode && navigator.clipboard) navigator.clipboard.writeText(roomCode).then(() => status('Kod nusxalandi')); };
  $('startBtn').onclick = () => Net.send({ t: 'start' });

  Net.on('close', () => status('Ulanish uzildi'));
  Net.on('reconnecting', () => status('Qayta ulanmoqda...'));
  Net.on('reconnected', () => status(''));
  Net.on('neterror', () => status('Server bilan aloqa xatosi'));
  Net.on('error', (m) => { if (m && m.msg) status(m.msg); });
  Net.on('joined', (m) => { myId = m.id; isHost = m.host; roomCode = m.room; $('roomCode').textContent = m.room; show('room'); status(''); });
  Net.on('lobby', (m) => {
    roomCode = m.room; $('roomCode').textContent = m.room; isHost = (m.host === myId);
    const list = $('playerList'); list.innerHTML = '';
    m.players.forEach((p) => { const li = document.createElement('li'); li.innerHTML = `<span class="dot"></span>${escapeHtml(p.nick)}` + (p.host ? '<span class="badge">host</span>' : ''); list.appendChild(li); });
    const enough = m.players.length >= m.min;
    $('startBtn').classList.toggle('hidden', !(isHost && enough));
    $('waitNote').textContent = enough ? (isHost ? "Tayyor bo'lsangiz — Boshlash" : 'Host boshlashini kuting...') : `Yana o'yinchi kutilmoqda (kamida ${m.min})`;
    if (!overShown) show('room'); overShown = false;
  });
  Net.on('role', (m) => {
    myRole = m.role;
    const rt = $('roleTag');
    if (myRole === 'seeker') { rt.textContent = '🔦 Qidiruvchi'; rt.className = 'role-tag role-seeker'; }
    else { rt.textContent = '🎭 Yashiringan'; rt.className = 'role-tag role-hider'; }
  });
  Net.on('begin', () => {
    overShown = false; decoys = []; show('game'); status('');
    $('canvas').classList.toggle('seeker-mode', myRole === 'seeker');
    startInput(); requestAnimationFrame(renderLoop);
  });
  Net.on('state', (m) => { latest = m; if (m.decoys) decoys = m.decoys; });
  Net.on('over', (m) => {
    overShown = true;
    const list = $('scoreList'); list.innerHTML = '';
    (m.scores || []).forEach((s) => { const li = document.createElement('li'); li.textContent = `${s.nick}: ${s.score}`; list.appendChild(li); });
    $('overTitle').textContent = m.winner ? `🏆 ${m.winner.nick} yutdi!` : "O'yin tugadi";
    show('over'); stopInput();
  });

  // input (harakat)
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

  // qidiruvchi: bosib-tekshirish (bust)
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');
  canvas.addEventListener('pointerdown', (e) => {
    if (myRole !== 'seeker' || !latest || latest.phase !== 'seek') return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    Net.send({ t: 'bust', x: Math.round(x), y: Math.round(y) });
  });

  function renderLoop() { if ($('game').classList.contains('hidden')) return; draw(); requestAnimationFrame(renderLoop); }

  function draw() {
    const W = canvas.width, H = canvas.height;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // neon yulduzli fon
    FX.starfield(ctx, W, H, now);

    if (!latest) { FX.update(16); FX.render(ctx); return; }

    // yengil to'r
    ctx.strokeStyle = 'rgba(120,160,255,0.05)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // predmetlar (dekoy + yashiringan bir xil ko'rinadi)
    const props = decoys.concat(latest.hiders || []);
    for (const p of props) {
      // predmet ostida past-alfa neon fon
      ctx.save(); ctx.globalAlpha = 0.1;
      FX.glowCircle(ctx, p.x, p.y, 18, '#a78bfa', 16);
      ctx.restore();

      // ushlangan predmet — bir marta danger portlash
      if (p.caught && p.id != null && !bursted.has(p.id)) {
        bursted.add(p.id);
        FX.burst(p.x, p.y, '#fb7185', 16);
        FX.shake(5);
      }

      // o'zim (yashiringan) — faqat menga ko'rinadigan yashil neon halqa
      if (p.id === myId && myRole === 'hider' && !p.caught) {
        ctx.save();
        ctx.shadowColor = '#34d399'; ctx.shadowBlur = 16;
        ctx.strokeStyle = '#34d399'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = p.caught ? 0.35 : 1;
      ctx.font = '26px system-ui, sans-serif';
      ctx.fillText(PROPS[p.type] || '📦', p.x, p.y);
      ctx.globalAlpha = 1;
      if (p.caught) { // ushlangan yashiringan — ochiladi (danger)
        ctx.save();
        ctx.shadowColor = '#fb7185'; ctx.shadowBlur = 10;
        ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p.x - 14, p.y - 14); ctx.lineTo(p.x + 14, p.y + 14);
        ctx.moveTo(p.x + 14, p.y - 14); ctx.lineTo(p.x - 14, p.y + 14); ctx.stroke();
        ctx.restore();
      }
    }

    // qidiruvchi — porlaydigan neon doira
    const sk = latest.seeker;
    if (sk) {
      FX.glowCircle(ctx, sk.x, sk.y, 18, sk.frozen ? '#22d3ee' : '#fb7185', 22);
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sk.frozen ? '❄️' : '🔦', sk.x, sk.y);
      if (sk.id === myId) {
        ctx.save();
        ctx.shadowColor = '#eaf2ff'; ctx.shadowBlur = 12;
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.arc(sk.x, sk.y, 18, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }

    // zarrachalar (portlashlar) — eng ustki qatlam
    FX.update(16);
    FX.render(ctx);

    // info bar
    const phaseTxt = latest.phase === 'hide' ? '🙈 Yashirinish' : '🔎 Qidiruv';
    $('phaseTag').textContent = phaseTxt + (latest.counts ? ` · ${latest.counts.caught}/${latest.counts.total} ushlandi` : '');
    if (typeof latest.time === 'number') $('timer').textContent = latest.time + 's';
    // maslahat
    if (latest.phase === 'hide') {
      $('hint').textContent = myRole === 'seeker' ? "Ko'zingizni yuming — yashiringanlar joylashmoqda..." : 'Predmetlar orasiga yashirin (harakatlan)';
    } else {
      $('hint').textContent = myRole === 'seeker' ? 'Predmetni bosib tekshiring (xato bo\'lsa muzlaysiz)' : 'Qimirlama yoki ehtiyot bo\'lib joy almashtir';
    }
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  ensureConnected();
})();
