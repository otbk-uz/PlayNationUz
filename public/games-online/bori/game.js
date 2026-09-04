// Kim Bo'ri? — mijoz: lobby, rollar, vazifa/sabotaj, ovoz berish.
(() => {
  const $ = (id) => document.getElementById(id);
  const sections = ['lobby', 'room', 'game', 'over'];
  const show = (name) => sections.forEach((s) => $(s).classList.toggle('hidden', s !== name));
  const status = (m) => { $('status').textContent = m || ''; };

  const nickEl = $('nick');
  nickEl.value = localStorage.getItem('bori-nick') || '';
  $('serverNote').innerHTML = `Server: <b>${Net.serverUrl()}</b> · <a id="changeServer">o'zgartirish</a>`;
  $('changeServer').onclick = () => { const u = prompt('WebSocket server manzili:', Net.serverUrl()); if (u) Net.setServer(u.trim()); };

  let myId = null, isHost = false, roomCode = null, myRole = null, myVote = null, curPhase = null;

  async function ensureConnected() {
    if (Net.isOpen()) return true;
    status('Serverga ulanmoqda...');
    try { await Net.connect(); status(''); return true; } catch { status("Serverga ulanib bo'lmadi."); return false; }
  }

  $('createBtn').onclick = async () => { const n = nickEl.value.trim(); if (!n) return status('Ismingizni kiriting'); localStorage.setItem('bori-nick', n); if (!(await ensureConnected())) return; Net.send({ t: 'join', nick: n, game: 'bori' }); };
  $('joinBtn').onclick = async () => { const n = nickEl.value.trim(); const r = $('roomInput').value.trim().toUpperCase(); if (!n) return status('Ismingizni kiriting'); if (r.length !== 4) return status('4 harfli kod'); localStorage.setItem('bori-nick', n); if (!(await ensureConnected())) return; Net.send({ t: 'join', room: r, nick: n, game: 'bori' }); };
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
    show('room');
  });
  Net.on('role', (m) => {
    myRole = m.role;
    const rt = $('roleTag');
    if (myRole === 'wolf') {
      rt.textContent = '🐺 Bo\'ri'; rt.className = 'role-tag role-wolf';
      $('sabBtn').classList.remove('hidden');
      $('taskBtn').textContent = '🔧 Vazifa (soxta)';
      if (m.teammates && m.teammates.length > 1) status('Bo\'rilar: ' + m.teammates.join(', '));
    } else {
      rt.textContent = '👤 Qishloqchi'; rt.className = 'role-tag role-villager';
    }
  });
  Net.on('begin', () => { show('game'); status(''); });
  Net.on('state', (m) => render(m));
  Net.on('over', (m) => {
    const list = $('scoreList'); list.innerHTML = '';
    (m.scores || []).forEach((s) => { const li = document.createElement('li'); li.textContent = `${s.nick}`; list.appendChild(li); });
    $('overTitle').textContent = m.winner ? `🏆 ${m.winner.nick} yutdi!` : "O'yin tugadi";
    $('overReason').textContent = m.winner && m.winner.reason ? m.winner.reason : '';
    show('over');
  });

  // vazifa / sabotaj
  $('taskBtn').onclick = () => { if (curPhase === 'task') Net.send({ t: 'task' }); };
  $('sabBtn').onclick = () => { if (curPhase === 'task') Net.send({ t: 'sabotage' }); };

  function render(m) {
    curPhase = m.phase;
    const phaseTxt = m.phase === 'task' ? '🔧 Vazifa fazasi' : '🗳️ Ovoz berish';
    $('phaseTag').textContent = `${phaseTxt} · Raund ${m.round}`;
    $('timer').textContent = m.time + 's';

    $('taskArea').classList.toggle('hidden', m.phase !== 'task');
    $('voteArea').classList.toggle('hidden', m.phase !== 'vote');

    if (m.phase === 'task') {
      $('progressBar').style.width = m.progress + '%';
      $('progressText').textContent = m.progress + '%';
      myVote = null;
    } else if (m.phase === 'vote') {
      const list = $('voteList');
      list.innerHTML = '';
      m.players.forEach((p) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="dot"></span>${escapeHtml(p.nick)}` + (p.alive ? '' : '<span class="badge">chetlatilgan</span>');
        if (!p.alive) li.classList.add('dead');
        else if (p.id !== myId) {
          if (myVote === p.id) li.classList.add('voted');
          li.onclick = () => { myVote = p.id; Net.send({ t: 'vote', target: p.id }); render(m); };
        }
        list.appendChild(li);
      });
      $('voteInfo').textContent = `${m.votedCount}/${m.aliveCount} ovoz berdi` + (myVote ? ' · siz ovoz berdingiz' : '');
    }

    if (m.lastElim) {
      $('revealMsg').textContent = m.lastElim.nick
        ? `${m.lastElim.nick} chetlatildi — u ${m.lastElim.role === 'wolf' ? '🐺 Bo\'ri' : '👤 Qishloqchi'} edi`
        : 'Hech kim chetlatilmadi (durang)';
    } else $('revealMsg').textContent = '';
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  ensureConnected();
})();
