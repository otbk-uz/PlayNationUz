// BLACKOUT — Actor (o'yinchi va botlar uchun bir xil) + bot AI.
import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';
import { CHARACTERS, SKINS } from './content.js';

// bosh ustidagi jon (HP) chizig'i uchun umumiy teksturalar (bir marta)
let _hpTex = null;
function hpTextures() {
  if (_hpTex) return _hpTex;
  const mk = (fill) => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 16; const x = c.getContext('2d');
    const r = 7; x.fillStyle = fill; x.beginPath();
    x.moveTo(r, 0); x.arcTo(64, 0, 64, 16, r); x.arcTo(64, 16, 0, 16, r); x.arcTo(0, 16, 0, 0, r); x.arcTo(0, 0, 64, 0, r); x.closePath(); x.fill();
    return new THREE.CanvasTexture(c);
  };
  _hpTex = { back: mk('rgba(6,10,20,0.82)'), fill: mk('#ffffff') };
  return _hpTex;
}

export class Actor {
  constructor(scene, opts) {
    this.scene = scene;
    this.name = opts.name || '?';
    this.isBot = !!opts.isBot;
    this.isPlayer = !!opts.isPlayer;
    this.skinId = opts.skinId || 'cyan';
    this.characterId = opts.characterId || 'human';

    const char = CHARACTERS[this.characterId] || CHARACTERS.human;
    const skin = SKINS[this.skinId] || SKINS.cyan;
    const built = char.build(skin);
    this.model = built.group;
    this.parts = built.parts;
    this.materials = built.materials;
    this.handAnchor = built.handAnchor;
    scene.add(this.model);

    // player belgisi (kim ekaningni bilish uchun halqa)
    if (this.isPlayer) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 28),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; this.model.add(ring); this.ring = ring;
    }
    this._buildHpBar();
    this.reset(new THREE.Vector3());
  }

  // bosh ustida suzuvchi jon chizig'i (billboard) — modeldan alohida (squash/aylanish ta'sir qilmaydi)
  _buildHpBar() {
    const tex = hpTextures();
    const grp = new THREE.Group();
    const backMat = new THREE.SpriteMaterial({ map: tex.back, transparent: true, depthTest: false, depthWrite: false, opacity: 0.8, fog: false });
    const back = new THREE.Sprite(backMat); back.scale.set(0.92, 0.17, 1);
    const fillMat = new THREE.SpriteMaterial({ map: tex.fill, transparent: true, depthTest: false, depthWrite: false, opacity: 1, fog: false, color: 0x34d399 });
    const fill = new THREE.Sprite(fillMat); fill.center.set(0, 0.5); fill.scale.set(0.84, 0.11, 1); fill.position.set(-0.42, 0, 0.001);
    grp.add(back); grp.add(fill); grp.renderOrder = 20; grp.visible = false;
    this.scene.add(grp);
    this.hpBar = { grp, back, fill, fullW: 0.84 };
  }

  // jon chizig'ini yangilaydi. lightK: yorug'lik (0..1) — zulmatda dushman chizig'i ko'rinmaydi (blind hunt)
  updateHpBar(lightK) {
    const b = this.hpBar; if (!b) return;
    if (!this.alive) { b.grp.visible = false; return; }
    const frac = Math.max(0, Math.min(1, this.hp / CONFIG.maxHp));
    // dushman chizig'i faqat svetda YO urilgan/fosh bo'lganda ko'rinadi; o'z chiziging doim
    let op = this.isPlayer ? 1 : Math.max(lightK, this.mark > 0 ? 1 : 0, this.revealT > 0 ? 0.85 : 0);
    op = Math.max(0, Math.min(1, op));
    if (op < 0.06) { b.grp.visible = false; return; }
    b.grp.visible = true;
    b.grp.position.set(this.pos.x, 1.85, this.pos.z);
    b.fill.scale.x = Math.max(0.006, b.fullW * frac);
    b.fill.material.color.setHex(frac > 0.5 ? 0x34d399 : frac > 0.25 ? 0xfbbf24 : 0xf43f5e);
    b.fill.material.opacity = op; b.back.material.opacity = 0.72 * op;
  }

  reset(pos) {
    this.pos = pos.clone(); this.vel = new THREE.Vector3();
    this.yaw = Math.PI; this.hp = CONFIG.maxHp; this.alive = true;
    this.weapon = null; this.heldUlt = null; this.activeUlt = null; this.kills = 0;
    this.flags = { nightVision: false, shield: false, haste: false };
    this.frozenT = 0; this.caughtCd = 0; this.atkCd = 0; this.swing = 0; this.mark = 0; this.bumpCd = 0; this.emoteT = 0;
    this.invulnT = 0; this.dashT = 0; this.dashVel = new THREE.Vector3();
    this.walk = 0; this.botTimer = Math.random() * 2; this.wander = null;
    this.reckless = this.isBot && Math.random() < 0.25;
    this.revealT = 0; this.knockV = new THREE.Vector3(); this.dying = 0;
    this._lean = 0; this._bank = 0; this._prevYaw = this.yaw;
    this._yawVis = this.yaw; this._spin = 0; this._spinV = 0;  // kulgili bonk aylanishi
    this.jelly = { q: 0, vq: 0 }; this._prevSpeed = 0; this._lastFp = 0;  // jele tana chayqalishi
    // oyoq-qo'l osilish (jiggle) prujinalari
    this.springs = { armL: { x: 0, vx: 0, z: 0, vz: 0 }, armR: { x: 0, vx: 0, z: 0, vz: 0 }, legL: { x: 0, vx: 0, z: 0, vz: 0 }, legR: { x: 0, vx: 0, z: 0, vz: 0 } };
    for (const k of ['armL', 'armR', 'legL', 'legR']) if (this.parts[k]) this.parts[k].rotation.set(0, 0, 0);
    if (this.shieldMesh) { this.model.remove(this.shieldMesh); this.shieldMesh = null; }
    if (this.heldMesh) { this.model.remove(this.heldMesh); this.heldMesh = null; }
    this.model.visible = true;
    this.model.rotation.set(0, this.yaw, 0);
    this.model.scale.set(1, 1, 1);
    this.model.position.set(this.pos.x, 0, this.pos.z);
    this._rag = null; this._physRag = false; this.physControlled = false; this.body = null; this.staggerT = 0;   // fizika holatini tozalaymiz
    this._applyMark(0);
  }

  // o'lim animatsiyasi (yiqilib, cho'kib g'oyib bo'ladi)
  updateDead(dt) {
    if (this.hpBar) this.hpBar.grp.visible = false;   // o'lganda jon chizig'i yo'q
    if (this.alive || !this.model.visible) return;
    if (this._physRag) return;   // Rapier rigid-body modelni boshqaradi (World.stepPhysics)
    const m = this.model;
    // RAGDOLL: zarba yo'nalishida uchadi, aylanadi, yerga sakraydi va yotadi (Party Animals KO)
    if (!this._rag) {
      const kv = this.knockV;
      this._rag = {
        vx: kv.x * 0.5 + (Math.random() - 0.5) * 2.5,
        vy: 3.6 + Math.random() * 2.2,                     // yuqoriga otiladi
        vz: kv.z * 0.5 + (Math.random() - 0.5) * 2.5,
        avx: (Math.random() - 0.5) * 15, avy: (Math.random() - 0.5) * 10, avz: (Math.random() - 0.5) * 15,
        rx: 0, ry: this._yawVis, rz: 0, y: 0.1,
      };
      this.dying = 3.6;                                    // uzoqroq yotadi (party chaos)
      this.jelly.vq -= 4;                                  // dastlabki siqilish
    }
    const r = this._rag;
    r.vy -= 17 * dt; r.y += r.vy * dt;
    this.pos.x += r.vx * dt; this.pos.z += r.vz * dt;
    if (r.y <= 0.05) {                                     // yerga tegdi -> sakrash + ishqalanish
      r.y = 0.05;
      if (r.vy < -1.2) { r.vy = -r.vy * 0.34; r.avx *= 0.55; r.avz *= 0.55; }  // sakraydi
      else r.vy = 0;
      r.vx *= 0.72; r.vz *= 0.72; r.avx *= 0.6; r.avy *= 0.82; r.avz *= 0.6;   // ishqalanish
    }
    r.rx += r.avx * dt; r.ry += r.avy * dt; r.rz += r.avz * dt;
    m.position.set(this.pos.x, r.y, this.pos.z);
    m.rotation.set(r.rx, r.ry, r.rz);
    // jele: uchishda chayqaladi, tinchlanganda yotadi
    this.jelly.vq += (-this.jelly.q * 90 - this.jelly.vq * 6) * dt; this.jelly.q += this.jelly.vq * dt;
    const q = Math.max(-0.3, Math.min(0.4, this.jelly.q));
    const sy = 1 + q;
    m.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    // limblar bo'shashib osiladi (o'lik floppy)
    const p = this.parts, fl = Math.sin(performance.now() * 0.008);
    if (p.armL) { p.armL.rotation.z = 0.4 + fl * 0.2; p.armR.rotation.z = -0.4 - fl * 0.2; p.legL.rotation.x = fl * 0.3; p.legR.rotation.x = -fl * 0.3; }
    this.dying -= dt;
    if (this.dying <= 0.7) { const f = Math.max(0, this.dying / 0.7); m.scale.multiplyScalar(Math.max(0.25, f)); }  // oxirida so'nadi
    if (this.dying <= 0) this.model.visible = false;
  }

  setWeapon(def) {
    this.weapon = def;
    if (def && !this.heldMesh && this.handAnchor) {
      this.heldMesh = def.buildHeld();
      this.handAnchor.add(this.heldMesh);
    }
  }
  dropWeapon() {
    const def = this.weapon; this.weapon = null;
    if (this.heldMesh) { this.model.remove(this.heldMesh); this.handAnchor.remove(this.heldMesh); this.heldMesh = null; }
    return def;
  }

  // kulgili zarba reaksiyasi (aylanadi + siqiladi)
  bonk(power = 1) {
    this._spinV += (Math.random() < 0.5 ? -1 : 1) * 9 * power;   // kuchliroq "chayqalish"
    this.jelly.vq -= 3.6 * power;
    this._bank += (Math.random() < 0.5 ? -1 : 1) * 0.25 * power;  // biroz yon egilish (stagger)
  }

  // kulgili emote — sakrab, aylanib quvonch (gameplayga ta'sir qilmaydi)
  emote(game) {
    if (!this.alive || this.emoteT > 0) return;
    this.emoteT = 0.6;
    this._spinV += (Math.random() < 0.5 ? -1 : 1) * 10;
    this.jelly.vq += 5.0;                 // yuqoriga cho'ziladi (sakrash hissi)
    if (game) { game.fx.sound('emote'); game.fx.sparks(game.scene, this.pos, 0xfde047, 8); }
  }

  // ultimatni ishlatish (heldUlt bo'lsa)
  useUlt(game) {
    if (!this.alive || !this.heldUlt) return;
    const def = this.heldUlt; this.heldUlt = null;
    if (def.mode === 'instant') { def.activate(game, this); }
    else { this.activeUlt = { def, t: def.duration }; def.onStart(game, this); if (this.isPlayer) game.fx.sound('pick'); }
  }

  attack(game) {
    if (!this.alive || !this.weapon || game.enforce || this.frozenT > 0 || this.atkCd > 0) return;
    this.atkCd = this.weapon.cooldown; this.swing = 0.25; game.fx.sound('hit');
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    for (const e of game.enemiesOf(this)) {
      const to = e.pos.clone().sub(this.pos); const d = to.length();
      if (d < this.weapon.range && fwd.dot(to.clone().normalize()) > this.weapon.arc) {
        game.damageActor(e, this.weapon.damage, this);
        game.fx.sparks(this.scene, e.pos, 0xffd27a, 10);
        if (this.weapon.knockback) {
          const n = to.setY(0).normalize();
          if (!game.world.applyKnock(e, n.x, n.z, this.weapon.knockback * 1.7)) e.knockV.copy(n).multiplyScalar(this.weapon.knockback);
        }
      }
    }
  }

  update(game, dt) {
    if (!this.alive) return;
    // timerlar
    if (this.frozenT > 0) this.frozenT -= dt;
    if (this.atkCd > 0) this.atkCd -= dt;
    if (this.swing > 0) this.swing -= dt;
    if (this.mark > 0) this.mark -= dt;
    if (this.caughtCd > 0) this.caughtCd -= dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.revealT > 0) this.revealT -= dt;
    if (this.bumpCd > 0) this.bumpCd -= dt;
    if (this.emoteT > 0) this.emoteT -= dt;

    // aktiv ultimate
    if (this.activeUlt) {
      this.activeUlt.t -= dt; this.activeUlt.def.onUpdate(game, this, dt);
      if (this.activeUlt.t <= 0) { this.activeUlt.def.onEnd(game, this); this.activeUlt = null; }
    }

    // harakat: FIZIKA (active ragdoll) yoki kinematik
    if (this.physControlled) {
      // pozitsiya/tezlik World.syncLiveActor tomonidan tanadan o'qiladi — bu yerda integratsiya yo'q
    } else {
      if (this.knockV.lengthSq() > 0.01) { this.pos.addScaledVector(this.knockV, dt); this.knockV.multiplyScalar(1 - Math.min(1, dt * 9)); }
      if (this.dashT > 0) { this.dashT -= dt; this.pos.addScaledVector(this.dashVel, dt); }
      else if (this.frozenT <= 0) this.pos.addScaledVector(this.vel, dt);
      this._collide(game.world.meta);
    }
    if (this.physControlled && this.dashT > 0) this.dashT -= dt;   // taymer (dash impulse tanaga berilgan)

    const speed = this.vel.length() + (!this.physControlled && this.dashT > 0 ? 12 : 0);

    // svetda qotmaslik jarimasi
    if (game.enforce && this.caughtCd <= 0 && this.invulnT <= 0 && speed > CONFIG.moveEps) {
      game.damageActor(this, CONFIG.catchDamage * (game.suddenDeath ? 2 : 1), null, 'caught');
      this.caughtCd = CONFIG.catchCooldown; this.mark = 1.0;
    }

    // model joylashuvi + burilish (+ kulgili bonk aylanishi)
    this.model.position.set(this.pos.x, 0, this.pos.z);
    let dy = this.yaw - this._yawVis;
    while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    this._yawVis += dy * Math.min(1, dt * CONFIG.turnLerp);
    this._spinV += (-this._spin * 26 - this._spinV * 5) * dt; this._spin += this._spinV * dt;  // prujina -> chayqalib qaytadi
    this.model.rotation.y = this._yawVis + this._spin;
    this._animate(dt, speed);

    // belgilash: urilgan -> qizil, sonar bilan fosh -> pushti
    if (this.mark > 0) this._applyMark(0.9 * this.mark, 0xff2a2a);
    else if (this.revealT > 0) this._applyMark(0.7, 0xf472b6);
    else this._applyMark(0, 0);
    if (this.ring) this.ring.material.opacity = 0.4 + Math.sin(performance.now() * 0.005) * 0.3;

    // qalqon pufagi
    if (this.flags.shield && !this.shieldMesh) {
      this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 14),
        new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
      this.shieldMesh.position.y = 0.95; this.model.add(this.shieldMesh);
    } else if (!this.flags.shield && this.shieldMesh) { this.model.remove(this.shieldMesh); this.shieldMesh = null; }
  }

  // ——— ONLAYN: server holatidan chizish (simulyatsiyasiz, faqat vizual) ———
  // Tarmoq targetiga interpolatsiya + o'sha jele animatsiyasi (bir xil his).
  renderNet(dt) {
    if (!this.alive) return;
    const ox = this.pos.x, oz = this.pos.z;
    const k = Math.min(1, dt * 12);
    this.pos.x += (this.netX - ox) * k;
    this.pos.z += (this.netZ - oz) * k;
    const idt = Math.max(dt, 0.001);
    const speed = Math.hypot(this.pos.x - ox, this.pos.z - oz) / idt;
    this.vel.set((this.pos.x - ox) / idt, 0, (this.pos.z - oz) / idt);
    if (this.netYaw != null) this.yaw = this.netYaw;
    if (this.swing > 0) this.swing -= dt;
    if (this.mark > 0) this.mark -= dt;
    if (this.emoteT > 0) this.emoteT -= dt;

    this.model.position.set(this.pos.x, 0, this.pos.z);
    let dyaw = this.yaw - this._yawVis;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    this._yawVis += dyaw * Math.min(1, dt * CONFIG.turnLerp);
    this._spinV += (-this._spin * 26 - this._spinV * 5) * dt; this._spin += this._spinV * dt;
    this.model.rotation.y = this._yawVis + this._spin;
    this._animate(dt, speed);

    if (this.mark > 0) this._applyMark(0.9 * this.mark, 0xff2a2a);
    else if (this.revealT > 0) this._applyMark(0.7, 0xf472b6);
    else this._applyMark(0, 0);

    if (this.flags.shield && !this.shieldMesh) {
      this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 14),
        new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
      this.shieldMesh.position.y = 0.95; this.model.add(this.shieldMesh);
    } else if (!this.flags.shield && this.shieldMesh) { this.model.remove(this.shieldMesh); this.shieldMesh = null; }
  }

  // YUMSHOQ personaj: oyoq-qo'llar prujinali osilib chayqaladi (Human Fall Flat / Party Animals)
  _animate(dt, speed) {
    const p = this.parts, m = this.model, now = performance.now();
    const moving = speed > 0.4 && this.frozenT <= 0;
    this.walk += dt * (moving ? 11 : 3);
    const sw = moving ? Math.sin(this.walk) * 0.6 : 0;
    let turn = this.yaw - this._prevYaw; while (turn > Math.PI) turn -= Math.PI * 2; while (turn < -Math.PI) turn += Math.PI * 2;
    this._prevYaw = this.yaw;
    const side = Math.max(-0.5, Math.min(0.5, turn * 5));  // burilishda oyoq-qo'l chetga uchadi
    // bo'g'im targetlari — x: old/orqa, z: yon (qo'llar tanadan sal chetda osiladi)
    const tgt = {
      legL: { x: sw, z: 0.05 + side * 0.4 },
      legR: { x: -sw, z: -0.05 + side * 0.4 },
      armL: { x: -sw * 0.7, z: 0.20 + side * 0.7 },
      armR: { x: sw * 0.7 + (this.swing > 0 ? -2.2 : 0), z: -0.20 + side * 0.7 },
    };
    const K = 120, D = 11;   // prujina (underdamped) -> floppy jiggle
    for (const k of ['legL', 'legR', 'armL', 'armR']) {
      const s = this.springs[k], t = tgt[k];
      s.vx += ((t.x - s.x) * K - s.vx * D) * dt; s.x += s.vx * dt;
      s.vz += ((t.z - s.z) * K - s.vz * D) * dt; s.z += s.vz * dt;
      p[k].rotation.x = s.x; p[k].rotation.z = s.z;
    }
    // tana: chayqalish (bob)
    const bob = moving ? Math.abs(Math.sin(this.walk)) * 0.12 : Math.sin(now * 0.0022) * 0.02 + 0.02;
    m.position.y = bob;
    // JELE: prujina-jiggle butun tanani gelatin kabi chayqatadi
    const accel = (speed - this._prevSpeed) / Math.max(dt, 0.001); this._prevSpeed = speed;
    this.jelly.vq += -Math.max(-5, Math.min(5, accel)) * 0.02;          // tezlanish/tormoz -> squash
    if (moving) { const fp = Math.sin(this.walk); if (this._lastFp < 0 && fp >= 0) this.jelly.vq -= 1.1; this._lastFp = fp; } else this._lastFp = 0; // qadam zarbasi
    this.jelly.vq += (-this.jelly.q * 95 - this.jelly.vq * 6.5) * dt;   // underdamped -> wobble
    this.jelly.q += this.jelly.vq * dt;
    const q = Math.max(-0.35, Math.min(0.42, this.jelly.q));
    const idle = moving ? 0 : Math.sin(now * 0.003) * 0.02;
    const sy = 1 + q + idle;
    m.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    // googly ko'zlar squashda pop bo'ladi (kulgili)
    if (p.eyeL) { const es = 1 + Math.max(0, q) * 0.6; p.eyeL.scale.setScalar(es); p.eyeR.scale.setScalar(es); }
    // quloqlar floppy (yugurganda silkinadi) + jele bilan
    if (p.ears && p.ears.length) {
      for (let i = 0; i < p.ears.length; i++) {
        const e = p.ears[i], dir = i === 0 ? 1 : -1;
        e.rotation.x = Math.sin(this.walk + i) * 0.28 * (moving ? 1 : 0.25) - q * 0.5;
        e.rotation.z = dir * (0.08 + side * 0.6) + this._bank * 0.5;
      }
    }
    // dum silkinadi (wag)
    if (p.tail) { p.tail.rotation.y = Math.sin(now * 0.012) * (moving ? 0.55 : 0.2); p.tail.rotation.x = 0.35 + q * 0.4; }
    // egilish + bank
    const leanT = moving ? -Math.min(1, speed / CONFIG.moveSpeed) * 0.22 : 0;
    this._lean += (leanT - this._lean) * Math.min(1, dt * 8); m.rotation.x = this._lean;
    const bankT = Math.max(-0.32, Math.min(0.32, -turn * 5));
    this._bank += (bankT - this._bank) * Math.min(1, dt * 8); m.rotation.z = this._bank;
  }

  _applyMark(intensity, color) {
    for (const m of this.materials) {
      if (!m.emissive) continue;
      m.emissive.setHex(intensity > 0 ? color : 0x000000);
      m.emissiveIntensity = intensity;
    }
  }

  _collide(meta) {
    const lim = meta.bounds, r = 0.45;
    this.pos.x = Math.max(-lim, Math.min(lim, this.pos.x));
    this.pos.z = Math.max(-lim, Math.min(lim, this.pos.z));
    for (const f of meta.furniture) {
      if (this.pos.x > f.minX - r && this.pos.x < f.maxX + r && this.pos.z > f.minZ - r && this.pos.z < f.maxZ + r) {
        const dl = Math.abs(this.pos.x - (f.minX - r)), dr = Math.abs((f.maxX + r) - this.pos.x);
        const dt2 = Math.abs(this.pos.z - (f.minZ - r)), db = Math.abs((f.maxZ + r) - this.pos.z);
        const mn = Math.min(dl, dr, dt2, db);
        if (mn === dl) this.pos.x = f.minX - r; else if (mn === dr) this.pos.x = f.maxX + r;
        else if (mn === dt2) this.pos.z = f.minZ - r; else this.pos.z = f.maxZ + r;
      }
    }
  }

  dispose() { this.scene.remove(this.model); if (this.hpBar) this.scene.remove(this.hpBar.grp); }
}

// ————————————————————————————————————————————————————————————————
// BOT AQLI — fazaga qarab qaror: zulmatda maqsad sari yur, svetda qot.
// ————————————————————————————————————————————————————————————————
export function botThink(game, b, dt) {
  b.botTimer -= dt;
  const move = new THREE.Vector3();

  // yaqindagi qurolli tahdidni topamiz (qochish + ult qarori uchun)
  let threat = null, td = 5.0;
  if (!b.weapon) for (const e of game.enemiesOf(b)) { if (!e.weapon) continue; const d = e.pos.distanceTo(b.pos); if (d < td) { td = d; threat = e; } }

  if (game.enforce) {
    // svet: qot (reckless botlar biroz suriladi -> ushlanadi)
    if (b.reckless && Math.random() < 0.02) move.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  } else if (b.frozenT <= 0) {
    let goal = null;
    if (threat) { move.copy(b.pos).sub(threat.pos).setY(0); }        // qoch
    else if (b.weapon) {                                             // qurolli -> eng zaif dushmanni ovla
      let best = null, score = -1e9;
      for (const e of game.enemiesOf(b)) { const d = e.pos.distanceTo(b.pos); const s = -d - e.hp * 0.03 + (e === game.player ? 1 : 0); if (s > score) { score = s; best = e; } }
      if (best) { goal = best.pos; if (best.pos.distanceTo(b.pos) < b.weapon.range) b.attack(game); }
    } else if (b.hp < 50 && game.embers.length) {                    // jon kam -> olovga
      let bd = 99; for (const e of game.embers) { const d = e.mesh.position.distanceTo(b.pos); if (d < bd) { bd = d; goal = e.mesh.position; } }
    } else if (game.weaponInWorld()) {
      goal = game.nearestWeapon(b.pos);
    } else if (game.ultDrops.length && !b.heldUlt) {
      let bd = 99; for (const u of game.ultDrops) { const d = u.mesh.position.distanceTo(b.pos); if (d < bd) { bd = d; goal = u.mesh.position; } }
    } else {
      if (b.botTimer <= 0) { b.wander = new THREE.Vector3(Math.random() * 2 - 1, 0, Math.random() * 2 - 1); b.botTimer = 1.5 + Math.random() * 2; }
      goal = Math.random() < 0.5 ? game.player.pos : null;
      if (!goal && b.wander) move.copy(b.wander);
    }
    if (goal && move.lengthSq() === 0) move.copy(goal).sub(b.pos);

    // ——— ultimatni TAKTIK ishlatish ———
    if (b.heldUlt) {
      const id = b.heldUlt.id; let use = false;
      if (id === 'qalqon') use = b.hp < 45;
      else if (id === 'dash') use = !!threat;                        // qochishni tezlashtir
      else if (id === 'muz') {                                       // oldindagi qurolli dushmanni muzlat
        const fwd = new THREE.Vector3(Math.sin(b.yaw), 0, Math.cos(b.yaw));
        for (const e of game.enemiesOf(b)) { if (!e.weapon) continue; const to = e.pos.clone().sub(b.pos); if (to.length() < 6 && fwd.dot(to.normalize()) > 0.2) { use = true; break; } }
      }
      else if (id === 'sonar') use = Math.random() < 0.02;
      else if (id === 'koz') use = b.weapon && Math.random() < 0.03; // qurolli bo'lsa ov uchun
      else if (id === 'bomba') {                                     // yaqin dushman bo'lsa portlat
        for (const e of game.enemiesOf(b)) { if (e.pos.clone().sub(b.pos).length() < 3.8) { use = true; break; } }
      }
      else if (id === 'tezlik') use = !!threat || (b.weapon && Math.random() < 0.03); // qochish yoki ov uchun
      if (use) b.useUlt(game);
    }
  }

  if (move.lengthSq() > 0.001) { move.y = 0; move.normalize(); b.yaw = Math.atan2(move.x, move.z); }
  b.vel.copy(move).multiplyScalar(CONFIG.botSpeed * (game.nightMult || 1) * (b.frozenT > 0 ? 0 : 1) * (b.flags.haste ? 1.6 : 1));
}
