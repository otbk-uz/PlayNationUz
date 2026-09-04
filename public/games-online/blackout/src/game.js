// BLACKOUT — o'yin orkestratori: faza mashinasi, round, pickuplar, HUD, boshqaruv, loop.
import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';
import { WEAPONS, ULTIMATES, SKINS, MAPS, EVENTS, CHARACTERS } from './content.js';
import { World } from './world.js';
import { FX } from './fx.js';
import { Actor, botThink } from './actors.js';

const PHASE = { DARK: 0, WARN: 1, LIGHT: 2 };
const $ = id => document.getElementById(id);
const BOT_NAMES = ['Olov', 'Zulm', 'Qora', 'Tun', 'Sado', 'Iblis', 'Ko\'lka', 'Shabada'];
const botName = i => BOT_NAMES[i % BOT_NAMES.length];

// ——— MEZBON (Host) syujeti — o'yinni boshqaruvchi sirli, o'ynoqi shafqatsiz mezbon ———
const HOST_LINES = {
  playerKill: [
    "Ha! Mana bu — mehmonim jonlandi.",
    "Yana bitta olov o'chdi... sening qo'ling bilan. Zavqlanyapman.",
    "Ajoyib zarba! Zulmat seni yaxshi ko'ra boshladi.",
    "Yebsan-yutibsan. Davom et, kechani men uchun bezab ber.",
  ],
  kill: [
    "Yana bir shamchiroq so'ndi.",
    "Bog'imda yana bir soya ko'paydi.",
    "Kim keyingi? Zulmat sabrsiz.",
  ],
  dark: [
    "Svet o'chdi — yuguring, uchqun yig'ing!",
    "Zulmat nafas oldi. Olovingizni yoqing.",
    "Qorong'uda men hammani ko'raman... siz esa yo'q.",
  ],
  light: [
    "SVET! Haykaldek qoting — qimirlagan yonadi.",
    "Yorug'lik keldi. Nafasingni ushla.",
    "Ko'zim sizda. Bitta qimir — bitta jarima.",
  ],
  low: [
    "Olovsupport so'nyapti... uchqun top, tez!",
    "Shamching zaiflashdi. Yo'qolib qolasan.",
  ],
  taunt: [
    "Bu kecha juda uzun bo'ladi...",
    "Sizni bu yerga men chaqirdim. Ketishga esa ruxsat yo'q.",
    "Raqs tushinglar, mehmonlarim.",
    "Har bir kecha — yangi o'yin. Yangi qurbon.",
  ],
};
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export class Game {
  constructor(container) {
    this.world = new World(container);
    this.fx = new FX();
    this.scene = this.world.scene;
    this.actors = []; this.player = null;
    this.weapons = [];            // [{ def, mesh, taken, holder }]
    this.ultDrops = [];           // [{ mesh, orb, def }]
    this.embers = [];             // [{ mesh, orb }] — olov uchqunlari (jon tiklaydi)
    this.coins = [];              // [{ mesh, orb }] — tanga pickuplari (do'kon grindi)
    this._roundCoins = 0;         // shu roundda yig'ilgan tanga
    this.camYaw = 0;
    this.running = false; this.ended = false;
    this.phase = PHASE.DARK; this.phaseT = 0; this.lightK = 0; this.enforce = false;
    this.progress = 0; this.suddenDeath = false; this._firstBlood = false;
    this.night = 1; this.nightMult = 1; this._heartT = 0; this._lastWin = false;
    this.stats = this._loadStats();
    this.mods = { lightMax: 1, decayMul: 1, emberMul: 1, emberMax: CONFIG.emberMaxOnField, weaponBonus: 0, tempoMul: 1 };
    this.event = null; this._eventHost = null;
    this.roundT = CONFIG.roundTime; this.ultSpawnT = CONFIG.ultInterval;
    this.emberSpawnT = CONFIG.emberInterval; this.weaponRespawnT = 0;
    this.chosenMap = CONFIG.defaultMap; this.chosenSkin = CONFIG.playerSkin; this.chosenCharacter = CONFIG.defaultCharacter;
    this.countdown = 0; this._toastT = 0;
    this._initInput();
    this._last = performance.now();
  }

  // ——— boot / round ———
  boot() {
    this.world.loadMap(this.chosenMap);
    this.world.initPhysics();   // Rapier fonda yuklanadi (KO ragdoll uchun)
    this._buildActors();
    this._buildSelectors();
    this._renderRecord();
    this.world.camera.position.set(0, 4, -8); this.world.camera.lookAt(0, 1, 2);
    $('startBtn').addEventListener('click', () => { this.fx.sound('pick'); this.startRound(false); });
    $('againBtn').addEventListener('click', () => this.startRound(this._lastWin));
    requestAnimationFrame(t => this._loop(t));
  }

  // start-panel: atmosfera + skin tanlash (registrylardan avtomatik)
  _buildSelectors() {
    const mapBox = $('pick-map');
    mapBox.innerHTML = Object.values(MAPS).map(m => `<span class="opt ${m.id === this.chosenMap ? 'sel' : ''}" data-id="${m.id}">${m.name}</span>`).join('');
    mapBox.querySelectorAll('.opt').forEach(el => el.onclick = () => {
      this.chosenMap = el.dataset.id;
      mapBox.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === el));
      this.world.loadMap(this.chosenMap); this._buildActors();
    });
    const skinBox = $('pick-skin');
    skinBox.innerHTML = Object.values(SKINS).map(s => {
      const un = this.isSkinUnlocked(s.id);
      return `<span class="dot ${s.id === this.chosenSkin ? 'sel' : ''} ${un ? '' : 'locked'}" data-id="${s.id}" data-un="${un}" title="${un ? s.name : s.name + ' — ' + CONFIG.skinPrice + ' 🪙'}" style="background:#${s.primary.toString(16).padStart(6, '0')}">${un ? '' : '🔒'}</span>`;
    }).join('');
    skinBox.querySelectorAll('.dot').forEach(el => el.onclick = () => {
      const id = el.dataset.id;
      if (el.dataset.un === 'false') { if (this._tryUnlock('skin', id, CONFIG.skinPrice)) { this.chosenSkin = id; this._buildSelectors(); this._renderRecord(); this._buildActors(); } return; }
      this.chosenSkin = id;
      skinBox.querySelectorAll('.dot').forEach(x => x.classList.toggle('sel', x === el));
      this._buildActors();
    });
    const charBox = $('pick-char');
    if (charBox) {
      charBox.innerHTML = Object.values(CHARACTERS).map(c => {
        const un = this.isCharUnlocked(c.id);
        return `<span class="opt ${c.id === this.chosenCharacter ? 'sel' : ''} ${un ? '' : 'locked'}" data-id="${c.id}" data-un="${un}">${c.name}${un ? '' : ' 🔒' + CONFIG.charPrice}</span>`;
      }).join('');
      charBox.querySelectorAll('.opt').forEach(el => el.onclick = () => {
        const id = el.dataset.id;
        if (el.dataset.un === 'false') { if (this._tryUnlock('char', id, CONFIG.charPrice)) { this.chosenCharacter = id; this._buildSelectors(); this._renderRecord(); this._buildActors(); } return; }
        this.chosenCharacter = id;
        charBox.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === el));
        this._buildActors();
      });
    }
  }

  _buildActors() {
    for (const a of this.actors) a.dispose();
    this.actors = [];
    const sp = this.world.meta.spawnPoints;
    this.player = new Actor(this.scene, { isPlayer: true, name: 'Siz', skinId: this.chosenSkin, characterId: this.chosenCharacter });
    this.player.reset(sp[0].clone()); this.actors.push(this.player);
    const botSkins = CONFIG.botSkins.filter(s => s !== this.chosenSkin);
    const charKeys = Object.keys(CHARACTERS);
    const cap = this.world.MOBILE ? 6 : CONFIG.maxBots;   // mobilda kamroq personaj (perf)
    const nb = Math.min(cap, CONFIG.botCount + Math.floor((this.night - 1) / CONFIG.botPerNights));
    for (let i = 0; i < nb; i++) {
      const b = new Actor(this.scene, { isBot: true, name: botName(i), skinId: botSkins[i % botSkins.length], characterId: charKeys[Math.floor(Math.random() * charKeys.length)] });
      b.reset(sp[(i + 1) % sp.length].clone()); this.actors.push(b);
    }
  }

  _pickEvent() {
    const list = Object.values(EVENTS);
    const total = list.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const e of list) { r -= e.weight; if (r <= 0) return e; }
    return list[0];
  }

  startRound(cont) {
    if (this._halt) return;   // onlayn rejim faol — yakka o'yin qayta boshlanmaydi
    if (!cont) { this.stats.plays++; this._saveStats(); this._renderRecord(); }  // yangi o'yin (run)
    this.night = cont ? this.night + 1 : 1;
    this.nightMult = 1 + (this.night - 1) * 0.04;   // har kecha ozgina qiyinroq (faqat bot tezligi)
    // maxsus hodisa (har round boshqacha)
    this.mods = { lightMax: 1, decayMul: 1, emberMul: 1, emberMax: CONFIG.emberMaxOnField, weaponBonus: 0, tempoMul: 1 };
    this.event = this._pickEvent(); this.event.apply(this.mods); this._eventHost = this.event.host;
    this.world.loadMap(this.chosenMap);   // tanlangan atmosfera
    this.world.clearRagdolls();
    this.world.clearLiveBodies();
    for (const a of this.actors) a.dispose();
    this._buildActors();
    // ACTIVE RAGDOLL (yakka rejim): tirik personajlar fizika tanasi bilan bir-birini itaradi
    this.physLive = !!this.world.physReady;
    if (this.physLive) for (const a of this.actors) { if (this.world.createLiveBody(a)) a.physControlled = true; }
    this._clearPickups();
    this._spawnWeapons();
    this.roundT = Math.min(CONFIG.roundTimeMax, CONFIG.roundTime + (this.night - 1) * CONFIG.roundTimePerNight);
    this.ultSpawnT = CONFIG.ultInterval;
    this.emberSpawnT = 1.5; this.weaponRespawnT = CONFIG.weaponRespawn;
    this.coinSpawnT = 2.0; this._roundCoins = 0;
    this.progress = 0; this.suddenDeath = false; this._firstBlood = false; this._heartT = 0;
    this.ended = false; this.running = true; this.camYaw = 0;
    this.spectating = false; this._specTarget = null; this.playerRank = 0; this._elimOrder = [];   // kuzatuv/o'rin reset
    this.victory = false; this.winner = null;
    const spec = $('spectate'); if (spec) spec.style.display = 'none';
    const vic = $('victory'); if (vic) vic.style.display = 'none';
    this.countdown = 3.0;                  // 3-2-1 sanoq
    this.lightK = 0; this.enforce = false; this.phase = PHASE.DARK; this.phaseT = 999;
    $('killfeed').innerHTML = '';
    $('startPanel').classList.add('hidden'); $('endPanel').classList.add('hidden');
    const intro = this.night === 1
      ? "Xush kelibsiz. Svet o'chganda — olovingizni yoqing, aks holda zulmat sizni yeydi."
      : `Kecha ${this.night}. Zulmat quyuqlashdi... hammasi tezroq bo'ladi.`;
    this.host(intro);
    this.fx.startDrone();
  }

  // ——— pickuplar ———
  _clearPickups() {
    for (const w of this.weapons) this.scene.remove(w.mesh);
    for (const u of this.ultDrops) this.scene.remove(u.mesh);
    for (const e of this.embers) this.scene.remove(e.mesh);
    for (const c of this.coins) this.scene.remove(c.mesh);
    this.weapons = []; this.ultDrops = []; this.embers = []; this.coins = [];
  }
  _randFloor(margin = 2) {
    const R = this.world.meta.bounds - margin;
    return new THREE.Vector3((Math.random() * 2 - 1) * R, 0.6, (Math.random() * 2 - 1) * R);
  }
  _spawnWeapons() {
    const n = CONFIG.weapons + (this.mods.weaponBonus || 0);
    for (let i = 0; i < n; i++) this._spawnOneWeapon(i === 0 ? this.world.meta.weaponSpawn.clone() : this._randFloor());
  }
  _spawnOneWeapon(pos) {
    const keys = Object.keys(WEAPONS);
    const def = WEAPONS[keys[Math.floor(Math.random() * keys.length)]];
    const mesh = def.buildPickup(); mesh.position.copy(pos);
    mesh.add(this.fx.glow(def.glow || 0xff5a5a, 2.1));
    this.scene.add(mesh);
    this.weapons.push({ def, mesh, taken: false, holder: null });
  }
  _spawnEmber() {
    const grp = new THREE.Group();
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1),
      new THREE.MeshStandardMaterial({ color: 0xff8a3c, emissive: 0xff6a1a, emissiveIntensity: 1.6, roughness: 0.35 }));
    grp.add(orb, this.fx.glow(0xff8a3c, 2.2));   // point light emas — emissive+glow+bloom (perf)
    grp.position.copy(this._randFloor(2.2)); grp.position.y = 0.7;
    this.scene.add(grp); this.embers.push({ mesh: grp, orb });
  }
  _spawnCoin() {
    const grp = new THREE.Group();
    const orb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 20),
      new THREE.MeshStandardMaterial({ color: 0xffd24a, emissive: 0xffb020, emissiveIntensity: 1.1, roughness: 0.25, metalness: 0.8 }));
    orb.rotation.x = Math.PI / 2;
    grp.add(orb, this.fx.glow(0xffd24a, 1.7));
    grp.position.copy(this._randFloor(2.2)); grp.position.y = 0.7;
    this.scene.add(grp); this.coins.push({ mesh: grp, orb });
  }
  _spawnUlt() {
    const keys = Object.keys(ULTIMATES);
    const def = ULTIMATES[keys[Math.floor(Math.random() * keys.length)]];
    const grp = new THREE.Group();
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1),
      new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 1.4, roughness: 0.3 }));
    grp.add(orb, this.fx.glow(def.color, 2.4));
    const R = this.world.meta.bounds - 1.8;
    grp.position.set((Math.random() * 2 - 1) * R, 0.7, (Math.random() * 2 - 1) * R);
    this.scene.add(grp);
    this.ultDrops.push({ mesh: grp, orb, def });
  }
  weaponInWorld() { return this.weapons.some(w => !w.taken); }
  nearestWeapon(pos) { let best = null, bd = 1e9; for (const w of this.weapons) { if (w.taken) continue; const d = w.mesh.position.distanceTo(pos); if (d < bd) { bd = d; best = w; } } return best ? best.mesh.position : null; }

  _updatePickups(dt) {
    // qurollar (armija bo'lmagan actor oladi)
    for (const w of this.weapons) {
      if (w.taken) continue;
      w.mesh.rotation.y += dt * 2;
      for (const a of this.actors) {
        if (a.alive && !a.weapon && a.pos.distanceTo(w.mesh.position) < CONFIG.pickupRadius) {
          w.taken = true; w.holder = a; w.mesh.visible = false; a.setWeapon(w.def);
          if (a === this.player) { this.fx.sound('pick'); this.toast('🔪 ' + w.def.name + ' oldingiz!'); }
          break;
        }
      }
    }
    // olov uchqunlari (jon tiklaydi) — magnit
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.mesh.rotation.y += dt * 2; e.orb.position.y = Math.sin(performance.now() * 0.004) * 0.12;
      let near = null, nd = CONFIG.magnetRadius;
      for (const a of this.actors) { if (!a.alive || a.hp >= CONFIG.maxHp) continue; const d = a.pos.distanceTo(e.mesh.position); if (d < nd) { nd = d; near = a; } }
      if (near) {
        const to = near.pos.clone().setY(0.7).sub(e.mesh.position);
        if (to.length() < CONFIG.pickupRadius) {
          near.hp = Math.min(CONFIG.maxHp, near.hp + CONFIG.emberHeal);
          this.fx.sparks(this.scene, e.mesh.position, 0xff8a3c, 10);
          if (near === this.player) { this.fx.sound('pick'); this.toast('🔥 +' + CONFIG.emberHeal + ' olov!'); }
          this.scene.remove(e.mesh); this.embers.splice(i, 1);
        } else e.mesh.position.addScaledVector(to.normalize(), dt * 7);
      }
    }
    // tanga pickuplari (do'kon grindi) — faqat o'yinchi yig'adi, magnitli
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.mesh.rotation.y += dt * 3; c.orb.position.y = Math.sin(performance.now() * 0.005) * 0.1;
      if (!this.player.alive) continue;
      const d = this.player.pos.distanceTo(c.mesh.position);
      if (d < CONFIG.magnetRadius) {
        const to = this.player.pos.clone().setY(0.7).sub(c.mesh.position);
        if (to.length() < CONFIG.pickupRadius) {
          this._roundCoins += CONFIG.coinValue;
          this.fx.sparks(this.scene, c.mesh.position, 0xffd24a, 8); this.fx.sound('pick');
          this.toast('🪙 +' + CONFIG.coinValue + ' tanga');
          this.scene.remove(c.mesh); this.coins.splice(i, 1);
        } else c.mesh.position.addScaledVector(to.normalize(), dt * 8);
      }
    }
    // ult droplar (magnit + olish)
    for (let i = this.ultDrops.length - 1; i >= 0; i--) {
      const u = this.ultDrops[i];
      u.mesh.rotation.y += dt * 1.5;
      u.orb.position.y = Math.sin(performance.now() * 0.003) * 0.12;
      // eng yaqin, ult ushlamagan actorni topamiz
      let near = null, nd = CONFIG.magnetRadius;
      for (const a of this.actors) { if (!a.alive || a.heldUlt) continue; const d = a.pos.distanceTo(u.mesh.position); if (d < nd) { nd = d; near = a; } }
      if (near) {
        // magnit: orbni actorga tortamiz (olish oson bo'lsin)
        const to = near.pos.clone().setY(0.7).sub(u.mesh.position);
        if (to.length() < CONFIG.pickupRadius) {
          near.heldUlt = u.def;
          if (near === this.player) { this.fx.sound('pick'); this.toast(u.def.emoji + ' ' + u.def.name + ' — E / ✨ bosib ishlat'); }
          this.fx.sparks(this.scene, u.mesh.position, u.def.color, 8);
          this.scene.remove(u.mesh); this.ultDrops.splice(i, 1);
        } else {
          u.mesh.position.addScaledVector(to.normalize(), dt * 6);
        }
      }
    }
  }

  // aktorlar bir-birining ustiga chiqmasin (ajratish)
  _separate() {
    const A = this.actors, min = 0.85;
    for (let i = 0; i < A.length; i++) {
      if (!A[i].alive) continue;
      for (let j = i + 1; j < A.length; j++) {
        if (!A[j].alive) continue;
        const a = A[i], b = A[j];
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
        if (d > 0.0001 && d < min) {
          const push = (min - d) / 2, nx = dx / d, nz = dz / d;
          a.pos.x -= nx * push; a.pos.z -= nz * push;
          b.pos.x += nx * push; b.pos.z += nz * push;
          // Party Animals uslubi: yumshoq tanalar to'qnashganda kulgili chayqalish + turtki
          const rel = Math.abs(a.vel.x * nx + a.vel.z * nz) + Math.abs(b.vel.x * nx + b.vel.z * nz);
          if (rel > 3.2 && a.bumpCd <= 0 && b.bumpCd <= 0) {
            a.bumpCd = b.bumpCd = 0.35;
            const imp = Math.min(6, rel * 0.9);
            a.knockV.x -= nx * imp; a.knockV.z -= nz * imp; a.bonk(0.5);
            b.knockV.x += nx * imp; b.knockV.z += nz * imp; b.bonk(0.5);
            if (a === this.player || b === this.player) { this.fx.sound('bump'); this.fx.kick(0.12); }
          }
        }
      }
    }
  }

  // ——— jang yordamchilari ———
  enemiesOf(actor) { return this.actors.filter(a => a.alive && a !== actor); }
  damageActor(actor, amt, from, cause) {
    if (!actor.alive) return;
    // qalqon zarbani to'sadi (bir marta)
    if (actor.flags.shield) {
      actor.flags.shield = false; actor.activeUlt = null;
      this.fx.sparks(this.scene, actor.pos, 0x34d399, 12);
      if (actor === this.player) this.toast('🛡️ Qalqon zarbani to\'sdi!');
      return;
    }
    actor.hp -= amt; actor.mark = Math.max(actor.mark, 0.8);
    if (actor.bonk) actor.bonk(cause === 'caught' ? 0.6 : 1);   // kulgili aylanish+siqilish
    if (actor === this.player) { this.fx.kick(cause === 'caught' ? 0.5 : 0.4); this.fx.vignette(); this.fx.sound(cause === 'caught' ? 'caught' : 'hit'); }
    if (actor.hp <= 0) this._eliminate(actor, from, cause);
  }

  // o'yinchini yo'q qilish (zarba / svet / olov so'nishi)
  _eliminate(actor, from, cause) {
    if (!actor.alive) return;
    actor.hp = 0; actor.alive = false; actor.dying = 1.0;   // yiqilish animatsiyasi
    (this._elimOrder = this._elimOrder || []).push(actor);   // o'rin (PUBG) uchun
    // tirik fizika tanasini olib tashlaymiz, o'rniga KO ragdoll qo'yamiz
    actor.physControlled = false; this.world.removeLiveBody(actor);
    // haqiqiy Rapier ragdoll (tayyor bo'lsa) — aks holda protsedura fallback
    if (this.world.spawnRagdoll(actor.model, actor.pos, actor.yaw, actor.knockV)) actor._physRag = true;
    this.fx.sparks(this.scene, actor.pos, 0xff5a5a, 12);
    this._addKill(actor, from, cause);
    // qurolini dunyoga tashlaydi (boshqalar olishi mumkin)
    const w = this.weapons.find(x => x.holder === actor);
    if (w) { actor.dropWeapon(); w.taken = false; w.holder = null; w.mesh.position.set(actor.pos.x, 0.5, actor.pos.z); w.mesh.visible = true; }
    if (actor === this.player) {
      // O'YINCHI O'LDI -> kuzatuv rejimi (o'yin tugamaydi, qolganlarni kuzatasan)
      this.fx.kick(0.8);
      this.playerRank = this.actors.filter(a => a.alive).length + 1;   // PUBG uslubidagi o'rin
      this.spectating = true;
      this._specTarget = null;
      const spec = $('spectate'); if (spec) { spec.style.display = 'flex'; }
      this._updateSpectate();
      this.host("Oloving o'chdi... ammo o'yin davom etadi. Kuzatib tur.");
    }
    // birinchi qon — Mezbon gapiradi
    else if (!this._firstBlood) { this._firstBlood = true; this.host('Birinchi qurbon... o\'yin endi qizidi.'); }
    else if (from === this.player) this.host(pick(HOST_LINES.playerKill));   // o'yinchi o'ldirdi -> maqtov
    else if (Math.random() < 0.5) this.host(pick(HOST_LINES.kill));
  }

  // ——— bildirishnomalar ———
  toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.add('show');
    this._toastT = 2.0;
  }
  // Mezbon (Host) — dramatik syujet gaplari
  host(msg) {
    const el = $('host'); if (!el) return;
    el.textContent = '« ' + msg + ' »'; el.classList.add('show');
    clearTimeout(this._hostTimer); this._hostTimer = setTimeout(() => el.classList.remove('show'), 4400);
  }
  _toggleMute() {
    this.fx.setMuted(!this.fx.muted);
    const b = $('mute'); if (b) b.textContent = this.fx.muted ? '🔇' : '🔊';
  }
  _confetti() {
    const c = $('confetti'); if (!c) return;
    const colors = ['#fbbf24', '#f43f5e', '#22d3ee', '#a78bfa', '#34d399', '#f472b6'];
    for (let i = 0; i < 60; i++) {
      const d = document.createElement('div'); d.className = 'conf';
      d.style.left = Math.random() * 100 + '%';
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = (Math.random() * 0.5) + 's';
      d.style.animationDuration = (1.8 + Math.random() * 1.2) + 's';
      c.appendChild(d); setTimeout(() => d.remove(), 3200);
    }
  }
  // ——— rekordlar (localStorage) ———
  _loadStats() {
    let s; try { s = JSON.parse(localStorage.getItem('blackout-stats') || '{}'); } catch (e) { s = {}; }
    s = Object.assign({ bestNight: 0, wins: 0, plays: 0, coins: 0, chars: [], skins: [] }, s);
    for (const c of CONFIG.freeCharacters) if (!s.chars.includes(c)) s.chars.push(c);
    for (const k of CONFIG.freeSkins) if (!s.skins.includes(k)) s.skins.push(k);
    return s;
  }
  _saveStats() { try { localStorage.setItem('blackout-stats', JSON.stringify(this.stats)); } catch (e) { /* ignore */ } }
  _renderRecord() {
    const el = $('record');
    if (el) el.innerHTML = `🏆 <b>Kecha ${this.stats.bestNight || 0}</b> · G'alaba: <b>${this.stats.wins}</b> · 🪙 <b>${this.stats.coins}</b> tanga`;
  }
  isCharUnlocked(id) { return this.stats.chars.includes(id); }
  isSkinUnlocked(id) { return this.stats.skins.includes(id); }
  _tryUnlock(kind, id, price) {
    if (this.stats.coins < price) { this.toast(`🪙 Tanga yetarli emas (${price} kerak)`); return false; }
    this.stats.coins -= price;
    (kind === 'char' ? this.stats.chars : this.stats.skins).push(id);
    this._saveStats(); this.fx.sound('pick'); this.toast('🔓 Ochildi!');
    return true;
  }
  _addKill(victim, killer, cause) {
    let msg;
    if (cause === 'caught') msg = `☠️ ${victim.name} — svetda qotmadi`;
    else if (cause === 'burnt') msg = `🔥 ${victim.name} — olovi so'ndi`;
    else if (killer) msg = `${killer.name} ⚔️ ${victim.name}`;
    else msg = `☠️ ${victim.name}`;
    if (killer === this.player && cause !== 'caught' && cause !== 'burnt') this.player.kills = (this.player.kills || 0) + 1;
    const el = document.createElement('div'); el.className = 'kf'; el.textContent = msg;
    const feed = $('killfeed'); feed.prepend(el);
    while (feed.children.length > 4) feed.lastChild.remove();
    setTimeout(() => el.remove(), 4500);
    if (victim === this.player) this.fx.sound('lose');
  }

  // ——— faza (vaqt o'tgani sari tezlashadi) ———
  _setPhase(p) {
    this.phase = p;
    const prog = this.progress, sd = this.suddenDeath, tempo = this.mods.tempoMul || 1;
    if (p === PHASE.DARK) {
      let dark = CONFIG.phase.dark * (1 - prog * 0.4) / tempo;
      if (sd) dark *= 0.55;
      this.phaseT = Math.max(1.6, dark + Math.random() * CONFIG.phase.darkJitter * (1 - prog * 0.4));
      this.enforce = false;
      if (!sd && Math.random() < 0.33) this.host(pick(HOST_LINES.dark));
    } else if (p === PHASE.WARN) {
      this.phaseT = sd ? 0.45 : CONFIG.phase.warn * (1 - prog * 0.15); this.enforce = false; this.fx.sound('warn');
    } else {
      this.phaseT = (sd ? 1.6 : CONFIG.phase.light * (1 - prog * 0.2)) / tempo;
      this.enforce = true; this.fx.sound('light'); this.fx.flash(); for (const a of this.actors) a.caughtCd = 0;
      if (!sd && Math.random() < 0.33) this.host(pick(HOST_LINES.light));
    }
  }

  // ——— boshqaruv ———
  _initInput() {
    this.keys = {};
    addEventListener('keydown', e => { this.keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); if (e.code === 'KeyM') this._toggleMute(); });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    // kamera qat'iy (yuqori 3/4) — aylantirish yo'q; harakat kameraga nisbatan
    this.camYaw = 0;
    // touch joystick
    this.touch = { x: 0, y: 0, active: false };
    if (matchMedia('(pointer: coarse)').matches) $('touch').style.display = 'block';
    const stick = $('stick'), knob = $('knob');
    let id = null, cx = 0, cy = 0;
    stick.addEventListener('pointerdown', e => { id = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; this.touch.active = true; stick.setPointerCapture(e.pointerId); });
    stick.addEventListener('pointermove', e => { if (e.pointerId !== id) return; let dx = e.clientX - cx, dy = e.clientY - cy; const mag = Math.hypot(dx, dy), max = 55; if (mag > max) { dx *= max / mag; dy *= max / mag; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.touch.x = dx / max; this.touch.y = dy / max; });
    const end = e => { if (e.pointerId !== id) return; id = null; this.touch.active = false; this.touch.x = this.touch.y = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    $('b-atk').addEventListener('pointerdown', e => { e.preventDefault(); this.player && this.player.attack(this); });
    $('b-ult').addEventListener('pointerdown', e => { e.preventDefault(); this.player && this.player.useUlt(this); });
    const be = $('b-emote'); if (be) be.addEventListener('pointerdown', e => { e.preventDefault(); this.player && this.player.emote(this); });
    const mute = $('mute'); if (mute) mute.addEventListener('click', () => this._toggleMute());
  }

  _playerControl(dt) {
    const p = this.player; if (!p.alive) return;
    let ix = this.touch.active ? this.touch.x : 0, iz = this.touch.active ? this.touch.y : 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) iz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) iz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
    const mv = new THREE.Vector3(ix, 0, iz); if (mv.lengthSq() > 1) mv.normalize();
    const s = Math.sin(this.camYaw), c = Math.cos(this.camYaw);
    const world = new THREE.Vector3(mv.x * c - mv.z * s, 0, mv.x * s + mv.z * c);
    if (world.lengthSq() > 0.001 && p.frozenT <= 0) p.yaw = Math.atan2(world.x, world.z);
    p.vel.copy(world).multiplyScalar(CONFIG.moveSpeed * (p.frozenT > 0 ? 0 : 1) * (p.flags.haste ? 1.6 : 1));
    if (this.keys['Space']) p.attack(this);
    if (this.keys['KeyE']) { p.useUlt(this); this.keys['KeyE'] = false; }
    if (this.keys['KeyF']) { p.emote(this); this.keys['KeyF'] = false; }
  }

  // kuzatuv rejimi: kamera kimni kuzatadi (tirik raqib), o'lgan bo'lsa
  _focusActor() {
    if (this.player.alive) return this.player;
    if (!this._specTarget || !this._specTarget.alive) this._specTarget = this.actors.find(a => a.alive) || this.player;
    return this._specTarget;
  }
  _updateSpectate() {
    const el = $('spectate'); if (!el || !this.spectating) return;
    const alive = this.actors.filter(a => a.alive).length;
    const t = this._focusActor();
    el.innerHTML = `☠️ Siz o'ldingiz — <b>#${this.playerRank}</b>-o'rin · kuzatyapsiz: <b>${t && t !== this.player ? t.name : '—'}</b> · tirik: ${alive}`;
  }

  // bosh ustidagi jon chiziqlarini yangilaydi (barcha aktorlar)
  _updateHpBars() { for (const a of this.actors) a.updateHpBar(this.lightK); }

  // ——— HUD ———
  _updateHUD() {
    const ph = $('phase'), sd = this.suddenDeath ? '🔥 ' : '';
    if (this.phase === PHASE.DARK) { ph.textContent = sd + "🌑 QORONG'I — yugur!"; ph.className = 'phase dark'; }
    else if (this.phase === PHASE.WARN) { ph.textContent = sd + '⚠️ SVET YONYAPTI...'; ph.className = 'phase light'; }
    else { ph.textContent = sd + '💡 QOT!'; ph.className = 'phase light'; }
    $('alive').textContent = `🌙 Kecha ${this.night} · ` + (this.suddenDeath ? "SUDDEN DEATH · " : '') + `Tirik: ${this.actors.filter(a => a.alive).length}/${this.actors.length}`;
    const mt = Math.max(0, this.roundT); $('timer').textContent = `${Math.floor(mt / 60)}:${String(Math.floor(mt % 60)).padStart(2, '0')}`;
    const p = this.player;
    $('hpnum').textContent = Math.ceil(p.hp);
    const f = $('hpfill'); f.style.width = p.hp + '%';
    f.style.background = p.hp > 35 ? 'linear-gradient(90deg,#34d399,#22d3ee)' : 'linear-gradient(90deg,#f43f5e,#fb7185)';
    $('i-weapon').classList.toggle('on', !!p.weapon);
    const iu = $('i-ult');
    if (p.activeUlt) { iu.classList.add('on'); $('ult-name').textContent = p.activeUlt.def.emoji + ' ' + p.activeUlt.def.name; $('ult-time').textContent = p.activeUlt.t.toFixed(0) + 's'; }
    else if (p.heldUlt) { iu.classList.add('on'); $('ult-name').textContent = p.heldUlt.emoji + ' ' + p.heldUlt.name; $('ult-time').textContent = '— E / ✨ bosib ishlat'; }
    else iu.classList.remove('on');
    if (this.spectating) this._updateSpectate();
  }

  // ——— G'ALABA SAHNASI (dopamin) — panel oldidan bayram ———
  _startVictory() {
    if (this.victory) return;
    this.victory = true; this.running = false; this.victoryT = 3.0; this._vpop = 0;
    const alive = this.actors.filter(a => a.alive);
    this.winner = alive.length ? alive.slice().sort((a, b) => b.hp - a.hp)[0] : ((this._elimOrder || []).slice(-1)[0] || this.player);
    this._specTarget = this.winner;
    const spec = $('spectate'); if (spec) spec.style.display = 'none';
    const isMe = this.winner === this.player;
    const v = $('victory');
    if (v) {
      v.style.display = 'flex';
      v.innerHTML = `<div class="vbig ${isMe ? 'me' : ''}">${isMe ? "🏆 G'OLIB!" : '🏆 ' + this.winner.name}</div>` +
        `<div class="vsub">${isMe ? "Oxirgi olov — SEN yonib turibsan!" : "oxirgacha yonib qoldi"}</div>`;
      v.classList.remove('go'); void v.offsetWidth; v.classList.add('go');   // animatsiyani qayta ishga tushiramiz
    }
    this.fx.sound('win'); this.fx.flash(); this.fx.kick(0.5); this._confetti();
    this.host(isMe ? "G'olib SEN! Zulmat bu safar yutqazdi." : `${this.winner.name} — oxirgi olov. Ajoyib kecha edi.`);
  }
  _victoryUpdate(dt, now) {
    this.victoryT -= dt;
    const w = this.winner;
    // g'olib sakrab-aylanadi + rangli uchqunlar + davriy konfetti otilishi
    this._vpop = (this._vpop || 0) - dt;
    if (this._vpop <= 0) {
      this._vpop = 0.4;
      if (w && w.alive) w.emote(this);
      if (w) this.fx.sparks(this.scene, w.pos, [0xffd24a, 0xf43f5e, 0x22d3ee, 0x34d399, 0xf472b6][Math.floor(Math.random() * 5)], 16);
      if (Math.random() < 0.7) this._confetti();
    }
    // slow-mo bayram his
    if (this.physLive) for (const a of this.actors) if (a.alive && a.body) this.world.syncLiveActor(a);
    for (const a of this.actors) { if (a.alive) a.update(this, dt * 0.5); else a.updateDead(dt); }
    this.world.stepPhysics(dt);
    this.fx.update(dt);
    // yorug'lik bayram uchun ko'tariladi
    this.lightK += (1 - this.lightK) * Math.min(1, dt * 2.5);
    this.world.updateLights(this.lightK, false);
    this.world.updateMotes(now, this.lightK);
    this.fx.droneIntensity(false);
    this._updateHpBars();
    this.world.updateCamera(w ? w.pos : this.player.pos, this.camYaw, dt, this.fx.shake);
    if (this.victoryT <= 0) { const v = $('victory'); if (v) v.style.display = 'none'; this.victory = false; this._endRound(); }
  }

  // ——— round tugashi ———
  _endRound() {
    this.running = false; this.ended = true;
    this.fx.stopDrone();
    const spec = $('spectate'); if (spec) spec.style.display = 'none';
    this.spectating = false;
    const alive = this.actors.filter(a => a.alive);
    const maxHp = Math.max(...this.actors.map(a => a.alive ? a.hp : 0));
    const win = this.player.alive && (alive.length === 1 || this.player.hp >= maxHp);
    this._lastWin = win;
    // PUBG uslubidagi o'rin: tiriklar (jon bo'yicha) -> o'lganlar (oxirgi o'lgan yuqoriroq)
    const survivors = alive.slice().sort((a, b) => b.hp - a.hp);
    const deadRanked = (this._elimOrder || []).slice().reverse().filter(a => !a.alive);
    const ranked = [...survivors, ...deadRanked];
    for (const a of this.actors) if (!ranked.includes(a)) ranked.push(a);   // xavfsizlik
    const place = ranked.indexOf(this.player) + 1;
    // rekord (localStorage)
    const newRecord = win && this.night > this.stats.bestNight;
    if (win) { this.stats.wins++; this.stats.bestNight = Math.max(this.stats.bestNight, this.night); }
    // tanga mukofoti (o'ynashga rag'bat) + shu roundda yig'ilgan tangalar
    const earned = 8 + (this.player.kills || 0) * 6 + this.night * 4 + (win ? 30 : 0) + (this._roundCoins || 0);
    this.stats.coins += earned; this._saveStats(); this._renderRecord();
    const re = $('rec-end');
    const coinNote = this._roundCoins > 0 ? ` (yig'ilgan: ${this._roundCoins} 🪙)` : '';
    if (re) re.innerHTML = (newRecord ? `<span class="new">🎉 Yangi rekord — Kecha ${this.night}!</span> ` : `🏆 Eng uzoq: <b>Kecha ${this.stats.bestNight}</b> `) + `· <span class="new">+${earned} 🪙</span>${coinNote}`;
    if (win) this._confetti();
    const rt = $('resultText'), rs = $('resultSub');
    const N = this.actors.length;
    if (win) {
      rt.textContent = `🏆 #1 — G'OLIB! (Kecha ${this.night})`; rt.className = 'result win';
      rs.textContent = (alive.length === 1 ? 'Oxirgi yongan olov sen edingiz. ' : `Oloving ${Math.ceil(this.player.hp)}% bilan tirik. `) + 'Keyingi kecha yanada qorong\'i...';
      this.fx.sound('win'); this.host('Omon qolding... lekin zulmat sabrli. Yana qaytaman.');
    } else {
      rt.textContent = `#${place} / ${N}`; rt.className = 'result lose';
      rs.textContent = `${N} tadan #${place}-o'rin. ` + (place <= Math.ceil(N / 2) ? 'Yaqin qolding — yana urin!' : 'Zulmat seni erta yutdi.');
      this.fx.sound('lose'); this.host('Sizning olovingiz o\'chdi. Mening bog\'imda yana bir soya.');
    }
    $('againBtn').textContent = win ? 'Keyingi kecha ➜' : 'Qaytadan';
    // natijalar jadvali (PUBG uslubidagi o'rin)
    $('scoreboard').innerHTML = ranked.map((a, i) =>
      `<div class="sb ${a === this.player ? 'me' : ''}"><span class="rk">#${i + 1}</span>` +
      `<span class="nm">${a === this.player ? 'Siz' : a.name}</span>` +
      `<span class="st ${a.alive ? 'alive' : 'dead'}">${a.alive ? Math.ceil(a.hp) + '% jon' : '☠️'}</span></div>`).join('');
    $('endPanel').classList.remove('hidden');
  }

  // ——— asosiy sikl ———
  // onlayn rejim ishga tushganda bir o'yinchi loopini to'xtatib, renderer'ni beradi
  halt() { this._halt = true; this.running = false; this.fx.stopDrone(); }

  _loop(now) {
    if (this._halt) return;   // onlayn rejim renderer'ni egalladi
    const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
    // toast taymeri
    if (this._toastT > 0) { this._toastT -= dt; if (this._toastT <= 0) $('toast').classList.remove('show'); }

    if (this.running && !this.ended && this.countdown > 0) {
      // ——— round oldidan 3-2-1 sanoq ———
      this.countdown -= dt;
      const cd = $('countdown'); cd.style.display = 'flex';
      cd.firstElementChild.textContent = this.countdown > 0.5 ? Math.ceil(this.countdown) : "BOSHLA!";
      for (const a of this.actors) a.update(this, dt); // faqat ko'rinish
      this.lightK += (0 - this.lightK) * Math.min(1, dt * 12);
      this.world.updateLights(this.lightK, false);
      this.world.updateMotes(now, this.lightK);
      this._updateHpBars();
      this.world.updateCamera(this.player.pos, this.camYaw, dt, 0);
      if (this.countdown <= 0) {
        cd.style.display = 'none'; this._setPhase(PHASE.DARK);
        if (this._eventHost) { this.host(this._eventHost); this._eventHost = null; }
        const ev = $('event'); if (ev) { ev.textContent = this.event.emoji + ' ' + this.event.name; ev.style.display = this.event.id === 'calm' ? 'none' : 'inline-flex'; }
      }
    } else if (this.running && !this.ended) {
      // faza
      this.phaseT -= dt;
      if (this.phaseT <= 0) {
        if (this.phase === PHASE.DARK) this._setPhase(PHASE.WARN);
        else if (this.phase === PHASE.WARN) this._setPhase(PHASE.LIGHT);
        else this._setPhase(PHASE.DARK);
      }
      // ult + ember drop (zulmatda)
      this.ultSpawnT -= dt;
      if (this.ultSpawnT <= 0 && this.phase === PHASE.DARK && this.ultDrops.length < CONFIG.ultMaxOnField) { this._spawnUlt(); this.ultSpawnT = CONFIG.ultInterval; }
      this.emberSpawnT -= dt;
      if (this.emberSpawnT <= 0 && this.phase === PHASE.DARK && this.embers.length < this.mods.emberMax) { this._spawnEmber(); this.emberSpawnT = CONFIG.emberInterval * this.mods.emberMul; }
      this.coinSpawnT -= dt;
      if (this.coinSpawnT <= 0 && this.phase === PHASE.DARK && this.coins.length < CONFIG.coinMaxOnField) { this._spawnCoin(); this.coinSpawnT = CONFIG.coinInterval; }
      // vaqt + tezlashuv (progress) + sudden death
      this.roundT -= dt;
      this.progress = Math.min(1, 1 - this.roundT / CONFIG.roundTime);
      if (this.roundT <= CONFIG.suddenDeathAt && !this.suddenDeath) { this.suddenDeath = true; this.host("So'nggi daqiqa. Zulmat och qoldi — hech kim omon qolmaydi."); }
      // olov so'nishi — qimirlamasang, o'lasan
      const decay = CONFIG.flameDecay * (this.suddenDeath ? 1.5 : 1) * this.mods.decayMul * dt;
      for (const a of this.actors) { if (!a.alive) continue; a.hp -= decay; if (a.hp <= 0) this._eliminate(a, null, 'burnt'); }
      // qurol respawn (maydonda bo'sh qurol qolmasa)
      if (!this.weaponInWorld() && this.weapons.length < CONFIG.weapons + 2) { this.weaponRespawnT -= dt; if (this.weaponRespawnT <= 0) { this._spawnOneWeapon(this._randFloor()); this.weaponRespawnT = CONFIG.weaponRespawn; } }
      else this.weaponRespawnT = CONFIG.weaponRespawn;
      // boshqaruv + AI + fizika
      this._playerControl(dt);
      for (const a of this.actors) if (a.isBot) botThink(this, a, dt);
      if (this.physLive) {
        // ACTIVE RAGDOLL: desired tezlik -> tana; step; pozitsiyani tanadan o'qish
        for (const a of this.actors) if (a.alive && a.body) { if (a.staggerT > 0) a.staggerT -= dt; else this.world.setLiveVelocity(a); }
        this.world.stepPhysics(dt);   // tirik tanalar + KO ragdollar
        for (const a of this.actors) if (a.alive && a.body) this.world.syncLiveActor(a);
        for (const a of this.actors) a.update(this, dt);
        for (const a of this.actors) a.updateDead(dt);
      } else {
        for (const a of this.actors) a.update(this, dt);
        for (const a of this.actors) a.updateDead(dt);
        this.world.stepPhysics(dt);   // faqat KO ragdollari
        this._separate();
      }
      this._updatePickups(dt);
      this.fx.update(dt);
      // kam olov -> yurak urishi + qizil pulsatsiya + Mezbon ogohlantiradi
      if (this.player.alive && this.player.hp < 30) {
        this._heartT -= dt;
        if (this._heartT <= 0) { this.fx.sound('caught'); this.fx.vignette(); this._heartT = 0.7; }
        if (!this._lowWarned) { this._lowWarned = true; this.host(pick(HOST_LINES.low)); }
      } else if (this.player.hp >= 45) this._lowWarned = false;
      // vaqti-vaqti bilan Mezbon o'ynoqi taunt (syujet tirik tursin)
      this._tauntT = (this._tauntT || 12) - dt;
      if (this._tauntT <= 0) { this._tauntT = 11 + Math.random() * 9; if (!this.suddenDeath) this.host(pick(HOST_LINES.taunt)); }
      // yorug'lik ramp
      let goal = 0;
      if (this.phase === PHASE.WARN) goal = (0.35 + Math.random() * 0.25) * this.mods.lightMax;
      else if (this.phase === PHASE.LIGHT) goal = this.mods.lightMax;
      this.lightK += (goal - this.lightK) * Math.min(1, dt * 12);
      // o'lgach — kuzatuv (spectate): tirik raqibni kuzatib turamiz (PUBG uslubi)
      const focus = this._focusActor();
      this.world.updateLights(this.lightK, focus.flags.nightVision);
      this.world.updateMotes(now, this.lightK);
      this.fx.droneIntensity(this.suddenDeath);
      this.world.updateCamera(focus.pos, this.camYaw, dt, this.fx.shake);
      this._updateHpBars();
      this._updateHUD();
      // round tugadi -> darrov panel emas, avval G'ALABA SAHNASI (dopamin)
      if (this.actors.filter(a => a.alive).length <= 1 || this.roundT <= 0) this._startVictory();
    } else if (this.victory) {
      this._victoryUpdate(dt, now);
    }
    this.world.render();
    requestAnimationFrame(t => this._loop(t));
  }
}
