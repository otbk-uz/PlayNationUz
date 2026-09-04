// BLACKOUT — ONLAYN mijoz. Server (server/games/blackout.js) authoritative.
// Bu modul: lobbi (xona), tarmoq holatini 3D chizish, kiritishni yuborish.
// Renderer/sahna/FX bir o'yinchi Game bilan bo'lishiladi (ikkinchi canvas yaratilmaydi).
import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';
import { WEAPONS, ULTIMATES, SKINS, CHARACTERS } from './content.js';
import { Actor } from './actors.js';

const $ = id => document.getElementById(id);
const PHASE_TXT = {
  dark: "🌑 QORONG'I — yugur!",
  warn: '⚠️ SVET YONYAPTI...',
  light: '💡 QOT!',
};

export class Online {
  constructor(game) {
    this.game = game;
    this.world = game.world; this.fx = game.fx; this.scene = game.scene;
    this.net = window.Net;
    this.myId = null; this.isHost = false; this.roomCode = null;
    this.nick = '';
    this.actors = new Map();     // id -> Actor
    this.embers = new Map();     // id -> mesh
    this.weaponsW = new Map();   // id -> mesh
    this.ultsW = new Map();      // id -> { mesh, def }
    this.phase = 'dark'; this.lightK = 0; this.sudden = false;
    this.time = 0;
    this.started = false; this.over = false; this.running = false;
    this.keys = {}; this.touch = { active: false, x: 0, y: 0 };
    this._last = performance.now(); this._sendT = 0;
    this._boundInput = false;
  }

  // id -> barqaror ko'rinish (barcha mijozlarda bir xil personaj/skin)
  _appear(id) {
    let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(id.length - 1 - i)) >>> 0;
    const chars = Object.keys(CHARACTERS), skins = Object.keys(SKINS);
    return { characterId: chars[h % chars.length], skinId: skins[(h >> 3) % skins.length] };
  }

  // ——— ulanish + lobbi ———
  connect(nick, roomCode) {
    this.nick = nick;
    const N = this.net;
    N.on('joined', m => { this.myId = m.id; this.isHost = m.host; this.roomCode = m.room; });
    N.on('lobby', m => this._renderLobby(m));
    N.on('begin', () => this._begin());
    N.on('state', m => this._onState(m));
    N.on('over', m => this._onOver(m));
    N.on('error', m => this._lobbyMsg(m && m.msg ? m.msg : 'Xatolik'));
    N.on('reconnecting', () => this._lobbyMsg('Qayta ulanmoqda...'));
    N.on('close', () => { if (!this.over) this._lobbyMsg('Aloqa uzildi'); });
    this._lobbyMsg('Ulanmoqda...');
    N.connect()
      .then(() => N.send({ t: 'join', game: 'blackout', nick, room: roomCode || undefined }))
      .catch(() => this._lobbyMsg("Serverga ulanib bo'lmadi. Server manzilini tekshiring."));
  }

  _lobbyMsg(t) { const el = $('lobby-msg'); if (el) el.textContent = t; }

  _renderLobby(m) {
    if (!this.started) {   // match tugagach yoki hali boshlanmaganda lobbini ko'rsatamiz
      $('lobby').classList.remove('hidden');
      $('endPanel').classList.add('hidden');
      $('startPanel').classList.add('hidden');
    }
    $('lobby-setup').style.display = 'none';
    $('lobby-room').style.display = 'block';
    $('lobby-code').textContent = m.room;
    const you = m.players.find(p => p.id === this.myId);
    this.isHost = !!(you && you.host);
    $('lobby-players').innerHTML = m.players.map(p =>
      `<div class="lp">${p.host ? '👑 ' : ''}${p.nick}${p.id === this.myId ? ' <b>(siz)</b>' : ''}</div>`).join('');
    const startBtn = $('lobby-start');
    startBtn.style.display = this.isHost ? 'block' : 'none';
    const enough = m.players.length >= m.min;
    startBtn.disabled = !enough;
    startBtn.textContent = enough ? "▶ Boshlash" : `Kamida ${m.min} o'yinchi kerak`;
    this._lobbyMsg(this.isHost ? 'Do\'stlaringizni koddan qo\'shing.' : 'Host boshlashini kuting...');
  }

  // ——— o'yin boshlandi ———
  _begin() {
    this.started = true; this.over = false; this._specT = null; this.victory = false; this._winnerId = null;
    { const spec = $('spectate'); if (spec) spec.style.display = 'none'; const v = $('victory'); if (v) v.style.display = 'none'; }
    this.game.halt();                       // bir o'yinchi loopini to'xtatamiz
    for (const a of this.game.actors) a.dispose();
    this.game.actors = []; this.game.player = null;
    this.world.loadMap(this.game.chosenMap || CONFIG.defaultMap);
    this._clearWorld();
    $('lobby').classList.add('hidden');
    $('startPanel').classList.add('hidden');
    $('endPanel').classList.add('hidden');
    $('killfeed').innerHTML = '';
    this.fx.startDrone();
    this._bindInput();
    if (!this.running) { this.running = true; this._loop(performance.now()); }
  }

  _clearWorld() {
    if (this.world.clearRagdolls) this.world.clearRagdolls();
    for (const a of this.actors.values()) a.dispose(); this.actors.clear();
    for (const m of this.embers.values()) this.scene.remove(m); this.embers.clear();
    for (const m of this.weaponsW.values()) this.scene.remove(m); this.weaponsW.clear();
    for (const u of this.ultsW.values()) this.scene.remove(u.mesh); this.ultsW.clear();
  }

  // ——— tarmoq holati -> vizual ———
  _onState(m) {
    if (!this.started) return;
    this.phase = m.phase; this.sudden = m.sudden; this.time = m.time;
    const seen = new Set();
    for (const ps of m.players) {
      seen.add(ps.id);
      let a = this.actors.get(ps.id);
      if (!a) {
        const ap = this._appear(ps.id);
        a = new Actor(this.scene, { isPlayer: ps.id === this.myId, name: ps.nick, skinId: ap.skinId, characterId: ap.characterId });
        a.reset(new THREE.Vector3(ps.x, 0, ps.z));
        a.netX = ps.x; a.netZ = ps.z; a.netYaw = ps.yaw;
        this.actors.set(ps.id, a);
      }
      a.netX = ps.x; a.netZ = ps.z; a.netYaw = ps.yaw;
      a.hp = ps.hp; a.frozenT = ps.fz ? 0.2 : 0;
      a._netUlt = ps.ult; a._netAct = ps.act;
      // o'lim — haqiqiy Rapier ragdoll (tayyor bo'lsa)
      if (!ps.alive && a.alive) { a.alive = false; a.dying = 1.0; if (this.world.spawnRagdoll(a.model, a.pos, a.yaw, a.knockV)) a._physRag = true; }
      // qurol vizuali
      if (ps.wp && (!a.weapon || a.weapon.id !== ps.wp)) { if (a.weapon) a.dropWeapon(); a.setWeapon(WEAPONS[ps.wp]); }
      else if (!ps.wp && a.weapon) a.dropWeapon();
      // ult flags (nightVision/shield vizual)
      a.flags.nightVision = ps.act === 'koz';
      a.flags.shield = ps.act === 'qalqon';
      a.flags.haste = ps.act === 'tezlik';
      // hit flash + reveal
      if (ps.mk > a.mark) a.mark = ps.mk;
      if (m.reveal && ps.id !== this.myId) a.revealT = Math.max(a.revealT, 0.6);
      // swing / emote
      if (ps.sw) { a.swing = 0.25; if (a.attack) { /* faqat vizual */ } a._spinV += 0; }
      if (ps.em) a.emote(null);
    }
    // ketganlarni olib tashlaymiz
    for (const [id, a] of this.actors) if (!seen.has(id)) { a.dispose(); this.actors.delete(id); }

    this._syncPickups(m);
    this._renderFeed(m.feed);
  }

  _syncPickups(m) {
    // olov uchqunlari
    const eSeen = new Set();
    for (const e of m.embers) {
      eSeen.add(e.id);
      let mesh = this.embers.get(e.id);
      if (!mesh) {
        mesh = new THREE.Group();
        const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1),
          new THREE.MeshStandardMaterial({ color: 0xff8a3c, emissive: 0xff6a1a, emissiveIntensity: 1.6, roughness: 0.35 }));
        mesh.add(orb, this.fx.glow(0xff8a3c, 2.2));
        mesh.userData.orb = orb; this.scene.add(mesh); this.embers.set(e.id, mesh);
      }
      mesh.position.set(e.x, 0.7, e.z);
    }
    for (const [id, mesh] of this.embers) if (!eSeen.has(id)) { this.scene.remove(mesh); this.embers.delete(id); }

    // qurollar (maydonda)
    const wSeen = new Set();
    for (const w of m.weapons) {
      wSeen.add(w.id);
      let mesh = this.weaponsW.get(w.id);
      if (!mesh) {
        const def = WEAPONS[w.wp] || WEAPONS.knife;
        mesh = def.buildPickup(); mesh.add(this.fx.glow(def.glow || 0xff5a5a, 2.1));
        this.scene.add(mesh); this.weaponsW.set(w.id, mesh);
      }
      mesh.position.set(w.x, 0.5, w.z);
    }
    for (const [id, mesh] of this.weaponsW) if (!wSeen.has(id)) { this.scene.remove(mesh); this.weaponsW.delete(id); }

    // ult droplar
    const uSeen = new Set();
    for (const u of m.ults) {
      uSeen.add(u.id);
      let rec = this.ultsW.get(u.id);
      if (!rec) {
        const def = ULTIMATES[u.ult] || ULTIMATES.dash;
        const grp = new THREE.Group();
        const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1),
          new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 1.4, roughness: 0.3 }));
        grp.add(orb, this.fx.glow(def.color, 2.4));
        grp.userData.orb = orb; this.scene.add(grp); rec = { mesh: grp, def }; this.ultsW.set(u.id, rec);
      }
      rec.mesh.position.set(u.x, 0.7, u.z);
    }
    for (const [id, rec] of this.ultsW) if (!uSeen.has(id)) { this.scene.remove(rec.mesh); this.ultsW.delete(id); }
  }

  _renderFeed(feed) {
    if (!feed) return;
    $('killfeed').innerHTML = feed.slice(-4).map(m => `<div class="kf">${m}</div>`).join('');
  }

  _onOver(m) {
    this.over = true; this._specT = null;
    const spec = $('spectate'); if (spec) spec.style.display = 'none';
    // avval G'ALABA SAHNASI (dopamin), keyin panel — render loop davom etadi
    const isMe = m.winner && m.winner.id === this.myId;
    this._winnerId = m.winner ? m.winner.id : null;
    this.victory = true; this._vpop = 0;
    const v = $('victory');
    if (v) {
      v.style.display = 'flex';
      v.innerHTML = `<div class="vbig ${isMe ? 'me' : ''}">${isMe ? "🏆 G'OLIB!" : '🏆 ' + (m.winner ? m.winner.nick : '—')}</div>` +
        `<div class="vsub">${isMe ? "Oxirgi olov — SEN!" : "oxirgacha yonib qoldi"}</div>`;
      v.classList.remove('go'); void v.offsetWidth; v.classList.add('go');
    }
    this.fx.sound('win'); this.fx.flash(); this.game._confetti && this.game._confetti();
    // 2.8s bayramdan keyin natija paneli
    setTimeout(() => {
      this.victory = false; this.started = false; this.fx.stopDrone();
      if (v) v.style.display = 'none';
      const rt = $('resultText'), rs = $('resultSub');
      if (isMe) { rt.textContent = "🏆 #1 — G'OLIB!"; rt.className = 'result win'; }
      else { rt.textContent = m.winner ? `🏆 ${m.winner.nick} g'olib` : 'Durrang'; rt.className = 'result'; }
      rs.textContent = 'Onlayn o\'yin tugadi.';
      $('scoreboard').innerHTML = (m.scores || []).map((s, i) =>
        `<div class="srow"><span>#${i + 1} ${s.nick}</span><span>${s.score} ⚔️</span></div>`).join('');
      const re = $('rec-end'); if (re) re.textContent = '';
      $('endPanel').classList.remove('hidden');
      const again = $('againBtn');
      if (again) { again.textContent = 'Lobbiga qaytish'; again.onclick = () => { $('endPanel').classList.add('hidden'); $('lobby').classList.remove('hidden'); this._lobbyMsg('Yangi o\'yin tayyorlanmoqda...'); }; }
    }, 2800);
  }

  // ——— kiritish ———
  _bindInput() {
    if (this._boundInput) return; this._boundInput = true;
    addEventListener('keydown', e => {
      if (!this.started) return;
      this.keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
      if (e.code === 'KeyE') this.net.send({ t: 'act', a: 'ult' });
      if (e.code === 'KeyF') this.net.send({ t: 'act', a: 'emote' });
      if (e.code === 'KeyM') this.game._toggleMute && this.game._toggleMute();
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    const be = $('b-emote'); if (be) be.addEventListener('pointerdown', e => { e.preventDefault(); if (this.started) this.net.send({ t: 'act', a: 'emote' }); });
    const bu = $('b-ult'); if (bu) bu.addEventListener('pointerdown', e => { e.preventDefault(); if (this.started) this.net.send({ t: 'act', a: 'ult' }); });
    // hujum: tugmani bosib turish -> input.atk (loop ichida yuboriladi)
    const ba = $('b-atk'); if (ba) {
      const dn = e => { e.preventDefault(); this._atkHeld = true; };
      const up = () => { this._atkHeld = false; };
      ba.addEventListener('pointerdown', dn); ba.addEventListener('pointerup', up); ba.addEventListener('pointercancel', up); ba.addEventListener('pointerleave', up);
    }
  }

  _sendInput() {
    const k = this.keys, tc = (this.game.touch && this.game.touch.active) ? this.game.touch : { x: 0, y: 0 };
    const input = {
      up: !!(k['KeyW'] || k['ArrowUp'] || tc.y < -0.3),
      down: !!(k['KeyS'] || k['ArrowDown'] || tc.y > 0.3),
      left: !!(k['KeyA'] || k['ArrowLeft'] || tc.x < -0.3),
      right: !!(k['KeyD'] || k['ArrowRight'] || tc.x > 0.3),
      atk: !!(k['Space'] || this._atkHeld),
    };
    this.net.send({ t: 'input', input });
  }

  // ——— render loop ———
  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
    if (this.started) {
      // kiritishni ~15Hz yuboramiz
      this._sendT -= dt;
      if (this._sendT <= 0) { this._sendInput(); this._sendT = 1 / 15; }
      // aktorlarni chizamiz (interpolatsiya + jele)
      let me = null;
      for (const a of this.actors.values()) {
        if (a.alive) a.renderNet(dt); else a.updateDead(dt);
        if (a.isPlayer) me = a;
      }
      this.world.stepPhysics(dt);   // Rapier KO ragdollari
      // pickup aylantirish
      const t = now * 0.001;
      for (const mesh of this.embers.values()) { mesh.rotation.y += dt * 2; if (mesh.userData.orb) mesh.userData.orb.position.y = Math.sin(t * 4) * 0.12; }
      for (const mesh of this.weaponsW.values()) mesh.rotation.y += dt * 2;
      for (const rec of this.ultsW.values()) { rec.mesh.rotation.y += dt * 1.5; if (rec.mesh.userData.orb) rec.mesh.userData.orb.position.y = Math.sin(t * 3) * 0.12; }
      this.fx.update(dt);
      // yorug'lik
      let goal = this.phase === 'light' ? 1 : this.phase === 'warn' ? 0.5 : 0;
      if (this.victory) goal = 1;   // bayram uchun yorug'
      this.lightK += (goal - this.lightK) * Math.min(1, dt * (this.victory ? 2.5 : 12));
      // G'ALABA SAHNASI: g'olib sakrab-aylanadi + uchqun + konfetti
      if (this.victory) {
        const w = this._winnerId ? this.actors.get(this._winnerId) : null;
        this._vpop = (this._vpop || 0) - dt;
        if (this._vpop <= 0) { this._vpop = 0.4; if (w && w.alive) w.emote(null); if (w) this.fx.sparks(this.scene, w.pos, [0xffd24a, 0xf43f5e, 0x22d3ee, 0x34d399][Math.floor(Math.random() * 4)], 16); if (Math.random() < 0.6) this.game._confetti && this.game._confetti(); }
      }
      // o'lgach — tirik raqibni kuzatamiz (PUBG uslubi); onlayn o'yin server tomonidan davom etadi
      let focus = me;
      if (this.victory && this._winnerId && this.actors.get(this._winnerId)) focus = this.actors.get(this._winnerId);
      else if (!focus || !focus.alive) { if (!this._specT || !this._specT.alive) this._specT = [...this.actors.values()].find(a => a.alive); focus = this._specT || me; }
      const spec = $('spectate');
      if (spec) {
        if (me && !me.alive && !this.over) { const al = [...this.actors.values()].filter(a => a.alive).length; spec.style.display = 'flex'; spec.innerHTML = `☠️ Siz o'ldingiz — kuzatyapsiz: <b>${focus && focus !== me ? focus.name : '—'}</b> · tirik: ${al}`; }
        else spec.style.display = 'none';
      }
      this.world.updateLights(this.lightK, focus ? focus.flags.nightVision : false);
      this.world.updateMotes(now, this.lightK);
      this.fx.droneIntensity(this.sudden);
      for (const a of this.actors.values()) a.updateHpBar(this.lightK);
      if (focus) this.world.updateCamera(focus.pos, 0, dt, this.fx.shake);
      this._updateHUD(me);
      this.world.render();
    }
    requestAnimationFrame(t2 => this._loop(t2));
  }

  _updateHUD(me) {
    const ph = $('phase'), sd = this.sudden ? '🔥 ' : '';
    ph.textContent = sd + (PHASE_TXT[this.phase] || '');
    ph.className = 'phase ' + (this.phase === 'dark' ? 'dark' : 'light');
    const aliveN = [...this.actors.values()].filter(a => a.alive).length;
    $('alive').textContent = `🌐 Onlayn · ` + (this.sudden ? 'SUDDEN DEATH · ' : '') + `Tirik: ${aliveN}/${this.actors.size}`;
    const mt = Math.max(0, this.time); $('timer').textContent = `${Math.floor(mt / 60)}:${String(Math.floor(mt % 60)).padStart(2, '0')}`;
    if (me) {
      $('hpnum').textContent = Math.ceil(me.hp);
      const f = $('hpfill'); f.style.width = me.hp + '%';
      f.style.background = me.hp > 35 ? 'linear-gradient(90deg,#34d399,#22d3ee)' : 'linear-gradient(90deg,#f43f5e,#fb7185)';
      $('i-weapon').classList.toggle('on', !!me.weapon);
      // held ult: server holatidan (state ichida ps.ult) — oxirgi ko'ringan qiymatni saqlaymiz
      const iu = $('i-ult');
      if (me._netUlt) { iu.classList.add('on'); const d = ULTIMATES[me._netUlt]; $('ult-name').textContent = (d ? d.emoji + ' ' + d.name : me._netUlt); $('ult-time').textContent = '— E / ✨'; }
      else if (me._netAct) { iu.classList.add('on'); const d = ULTIMATES[me._netAct]; $('ult-name').textContent = (d ? d.emoji + ' ' + d.name : me._netAct); $('ult-time').textContent = 'aktiv'; }
      else iu.classList.remove('on');
    }
  }
}
