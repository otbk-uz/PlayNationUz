// BLACKOUT — KONTENT REGISTRYLARI (kelajakka tayyor, data-driven).
// Yangi personaj / skin / atmosfera / ultimate / qurol qo'shish uchun
// shu fayldagi tegishli obyektga BITTA yozuv qo'shasiz — engine kodiga tegilmaydi.
import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/jsm/geometries/RoundedBoxGeometry.js';
import { TEX, applyPBR } from './textures.js';

// ————————————————————————————————————————————————————————————————
// EVENTS — har round tasodifiy tanlanadigan maxsus hodisa (har kecha boshqacha).
// apply(mods) round modifikatorlarini o'zgartiradi. Yangi hodisa = bitta yozuv.
// mods: { lightMax, decayMul, emberMul, emberMax, weaponBonus }
// ————————————————————————————————————————————————————————————————
export const EVENTS = {
  calm:      { id: 'calm', name: 'Sokin kecha', weight: 3, emoji: '🌙', host: null, apply() {} },
  blackout:  { id: 'blackout', name: 'Qora Kecha', weight: 1, emoji: '🌑', host: 'Bu kecha nur zaif yonadi... zulmatda yashiringlar.', apply(m) { m.lightMax = 0.5; } },
  emberRain: { id: 'emberRain', name: "Olov Yomg'iri", weight: 1, emoji: '🔥', host: "Olov yog'moqda — o'zingizni yoqing.", apply(m) { m.emberMul = 0.5; m.emberMax = 5; } },
  famine:    { id: 'famine', name: 'Ochlik', weight: 1, emoji: '💀', host: 'Ochlik keldi. Olov tezroq so\'nadi.', apply(m) { m.decayMul = 1.35; m.emberMul = 1.4; } },
  feast:     { id: 'feast', name: 'Qurol Ziyofati', weight: 1, emoji: '⚔️', host: 'Qon ziyofati. Qurollar mo\'l — omon qololmaysiz.', apply(m) { m.weaponBonus = 2; } },
  frenzy:    { id: 'frenzy', name: 'Telbalik', weight: 1, emoji: '🌀', host: 'Telbalik kechasi — hammasi tezroq, qurollar ko\'p.', apply(m) { m.weaponBonus = 1; m.decayMul = 1.15; m.tempoMul = 1.25; } },
  mercy:     { id: 'mercy', name: 'Osoyishta', weight: 1, emoji: '🕊️', host: 'Osoyishta kecha. Olov sekin so\'nadi — nafas ol.', apply(m) { m.decayMul = 0.6; m.emberMul = 0.75; } },
};

// umumiy yordamchi: soya tashlaydigan YUMSHOQ (yumaloq qirrali) quti — premium ko'rinish
const _woodCol = new THREE.Color();
function isWoody(color) {   // jigarrang (mebel yog'och) — rangli buyum/metallni tekstura qilmaymiz
  _woodCol.set(color);
  return _woodCol.r > _woodCol.g * 1.06 && _woodCol.g > _woodCol.b * 1.04 && _woodCol.r > 0.1 && _woodCol.r < 0.72;
}
function box(w, h, d, color, rough = 0.85, metal = 0.0) {
  const r = Math.min(0.09, Math.min(w, h, d) * 0.28);
  const geo = r > 0.012 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }));
  m.castShadow = true; m.receiveShadow = true;
  // yog'och mebelga PBR yog'och teksturasi (jigarrang bo'lsa; metall/rangli buyum emas)
  if (metal < 0.4 && isWoody(color)) {
    const rep = Math.max(1, Math.round(Math.max(w, d) * 0.9));
    applyPBR(m, TEX.wood(), rep, rep, 0.5);
  }
  return m;
}

// ————————————————————————————————————————————————————————————————
// PARTY DEKOR — har xaritaga avtomatik qo'shiladi (world.loadMap chaqiradi).
// Chiroq gulchambari + suzuvchi sharlar + polda konfetti. Bloom bilan ajoyib porlaydi.
// Qaytadi: { group, balloons } — balloons bob animatsiyasi uchun.
// ————————————————————————————————————————————————————————————————
const PARTY_COLORS = [0xf43f5e, 0x22d3ee, 0xa78bfa, 0x34d399, 0xfbbf24, 0xf472b6, 0x60a5fa];
export function partyDecor(bounds) {
  const g = new THREE.Group();
  const R = bounds - 0.4, y = 3.35;

  // chiroq gulchambari — perimetr bo'ylab kichik porlaydigan lampochkalar
  const bulbGeo = new THREE.SphereGeometry(0.11, 10, 8);
  const N = 44;
  for (let i = 0; i < N; i++) {
    const t = i / N, a = t * Math.PI * 2;
    // kvadrat perimetr (burchaklarda to'g'rilanadi)
    let x = Math.cos(a), z = Math.sin(a);
    const s = Math.max(Math.abs(x), Math.abs(z)); x /= s; z /= s;
    const col = PARTY_COLORS[i % PARTY_COLORS.length];
    const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.6, roughness: 0.4 }));
    const sag = Math.sin(t * Math.PI * 8) * 0.12;   // ip osilishi (catenary his)
    bulb.position.set(x * R, y - 0.15 + sag, z * R);
    g.add(bulb);
  }

  // suzuvchi sharlar (balloons) — env map bilan yaltiraydi, biroz emissive
  const balloons = [];
  const bg = new THREE.SphereGeometry(0.36, 18, 14);
  for (let i = 0; i < 7; i++) {
    const col = PARTY_COLORS[(i * 3) % PARTY_COLORS.length];
    const ball = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, roughness: 0.25, metalness: 0.0 }));
    ball.scale.y = 1.18;
    const bx = (Math.random() * 2 - 1) * R, bz = (Math.random() * 2 - 1) * R;
    const by = 2.5 + Math.random() * 0.8;
    ball.position.set(bx, by, bz); ball.castShadow = true;
    // ip
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8), new THREE.MeshStandardMaterial({ color: 0x223 }));
    cord.position.set(bx, by - 0.6, bz); g.add(cord);
    ball.userData.baseY = by; ball.userData.cord = cord; ball.userData.ph = Math.random() * 6.28;
    g.add(ball); balloons.push(ball);
  }

  // polda konfetti — 60 ta bitta InstancedMesh (60 -> 1 draw call, perf)
  const confGeo = new THREE.CircleGeometry(0.11, 5);
  const conf = new THREE.InstancedMesh(confGeo, new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide }), 60);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < 60; i++) {
    dummy.position.set((Math.random() * 2 - 1) * (bounds - 0.5), 0.02, (Math.random() * 2 - 1) * (bounds - 0.5));
    dummy.rotation.set(-Math.PI / 2, 0, Math.random() * 6.28); dummy.updateMatrix();
    conf.setMatrixAt(i, dummy.matrix); conf.setColorAt(i, col.setHex(PARTY_COLORS[i % PARTY_COLORS.length]));
  }
  conf.instanceMatrix.needsUpdate = true; conf.receiveShadow = true; g.add(conf);

  return { group: g, balloons };
}

// ————————————————————————————————————————————————————————————————
// SKINS — rang palitralari. Personajga qo'llanadi. (kelajakda: dokondan/skin menyudan)
// { id, name, primary (asosiy tana), dark (oyoq/qo'l), accent (ko'z/detal) }
// ————————————————————————————————————————————————————————————————
export const SKINS = {
  cyan:   { id: 'cyan',   name: 'Moviy',    primary: 0x22d3ee, dark: 0x0e3b46, accent: 0xffffff },
  ruby:   { id: 'ruby',   name: 'Yoqut',    primary: 0xf43f5e, dark: 0x4a1220, accent: 0xffe1e7 },
  violet: { id: 'violet', name: 'Binafsha', primary: 0xa78bfa, dark: 0x2e2350, accent: 0xf0eaff },
  lime:   { id: 'lime',   name: 'Yashil',   primary: 0x34d399, dark: 0x123a2c, accent: 0xe6fff5 },
  amber:  { id: 'amber',  name: 'Amber',    primary: 0xfbbf24, dark: 0x4a3410, accent: 0xfff3d6 },
  rose:   { id: 'rose',   name: 'Pushti',   primary: 0xf472b6, dark: 0x4a1636, accent: 0xffe3f2 },
  sky:    { id: 'sky',    name: "Ko'k",     primary: 0x60a5fa, dark: 0x16294a, accent: 0xe3efff },
  // kelajak uchun namuna (masalan premium skin):
  // gold: { id:'gold', name:'Oltin', primary:0xffd700, dark:0x5a4500, accent:0xfffbe6 },
};

// ————————————————————————————————————————————————————————————————
// CHARACTERS — yoqimtoy, yumshoq HAYVON personajlar (Party Animals uslubi).
// Har turi P (parametrlar) beradi: tana + bosh + quloq + tumshuq + dum.
// build(skin) => { group, parts:{body,head,legL,legR,armL,armR,eyeL,eyeR,ears,tail}, ... }
// Yangi hayvon = pastga bitta P obyekti qo'shasiz (kelajakka tayyor).
// ————————————————————————————————————————————————————————————————
function buildCreature(P, skin) {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';
  const primary = new THREE.MeshStandardMaterial({ color: skin.primary, roughness: 0.55, metalness: 0.02 });
  const dark = new THREE.MeshStandardMaterial({ color: skin.dark, roughness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x0b0f16 });
  const black = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.5 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfff2e0, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(P.bodyR, P.bodyLen, 5, 10), primary);
  body.position.y = P.bodyY; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(P.headR, 16, 12), primary);
  head.position.y = P.headY; head.castShadow = true; g.add(head);

  // qorin (belly) — yoqimtoy
  const belly = new THREE.Mesh(new THREE.SphereGeometry(P.bodyR * 0.62, 10, 8), bellyMat);
  belly.position.set(0, P.bodyY, P.bodyR * 0.5); belly.scale.z = 0.5; g.add(belly);

  // tumshuq (snout) + burun
  if (P.snout) {
    const snMat = P.snoutColor ? new THREE.MeshStandardMaterial({ color: P.snoutColor, roughness: 0.6 }) : primary;
    const sn = new THREE.Mesh(new THREE.SphereGeometry(P.snout, 10, 8), snMat);
    sn.position.set(0, P.headY - P.headR * 0.18, P.headR * 0.86); sn.scale.z = 0.7; g.add(sn);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(P.snout * 0.42, 8, 6), black);
    nose.position.set(0, P.headY - P.headR * 0.12, P.headR * 0.86 + P.snout * 0.55); g.add(nose);
  }

  // googly ko'zlar
  function eye(x) {
    const e = new THREE.Group();
    e.add(new THREE.Mesh(new THREE.SphereGeometry(P.eyeR, 10, 8), white));
    const pu = new THREE.Mesh(new THREE.SphereGeometry(P.eyeR * 0.5, 8, 6), pupil); pu.position.z = P.eyeR * 0.72; e.add(pu);
    e.position.set(x, P.headY + (P.eyeUp || 0), P.headR * 0.8); g.add(e); return e;
  }
  const eyeL = eye(P.eyeX), eyeR = eye(-P.eyeX);

  // quloqlar (pivot bilan -> floppy)
  const ears = [];
  if (P.ear && P.ear !== 'none') {
    for (const side of [1, -1]) {
      const piv = new THREE.Object3D();
      let m, y = P.headY + P.headR * 0.7;
      if (P.ear === 'long') { m = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.34, 4, 8), primary); m.position.y = 0.22; piv.position.set(side * 0.16, y, -0.02); }
      else if (P.ear === 'pointy') { m = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 8), primary); m.position.y = 0.14; piv.position.set(side * 0.2, y, 0); }
      else if (P.ear === 'floppy') { m = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), primary); m.scale.set(1, 1, 0.5); m.position.y = -0.16; piv.position.set(side * (P.headR * 0.85), P.headY + P.headR * 0.45, 0); }
      else { m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), primary); m.position.y = 0.06; piv.position.set(side * 0.24, y, 0); } // round
      piv.add(m); g.add(piv); ears.push(piv);
    }
  }

  // dum (tail) — pivot bilan silkinadi
  let tail = null;
  if (P.tail && P.tail !== 'none') {
    tail = new THREE.Object3D();
    const tm = P.tail === 'puff'
      ? new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), white)
      : new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.22, 4, 6), primary);
    tm.position.y = P.tail === 'puff' ? 0 : 0.14; tail.add(tm);
    tail.position.set(0, P.bodyY + 0.05, -(P.bodyR + 0.04)); g.add(tail);
  }

  // osiladigan floppy oyoq-qo'l
  function limb(px, py, len, rad, mat) {
    const piv = new THREE.Object3D(); piv.position.set(px, py, 0);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(rad, len, 5, 8), mat);
    m.position.y = -(len / 2 + rad * 0.6); piv.add(m);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.1, 8, 8), mat);
    paw.position.y = -(len + rad * 0.6); piv.add(paw);
    g.add(piv); return piv;
  }
  const armL = limb(P.armX, P.armY, P.armLen, P.armRad, primary);
  const armR = limb(-P.armX, P.armY, P.armLen, P.armRad, primary);
  const legL = limb(P.legX, P.legY, P.legLen, P.legRad, dark);
  const legR = limb(-P.legX, P.legY, P.legLen, P.legRad, dark);

  const handAnchor = new THREE.Object3D();
  handAnchor.position.set(0, -(P.armLen + P.armRad), 0.12); armR.add(handAnchor);

  return { group: g, parts: { body, head, legL, legR, armL, armR, eyeL, eyeR, ears, tail }, materials: [primary], handAnchor };
}

const CREATURE_TYPES = {
  kuchuk: { id:'kuchuk', name:'Kuchuk', bodyR:0.44, bodyLen:0.4, bodyY:0.84, headR:0.4, headY:1.5, eyeR:0.09, eyeX:0.16, eyeUp:0.05, armX:0.5, armY:1.12, armLen:0.3, armRad:0.14, legX:0.2, legY:0.55, legLen:0.3, legRad:0.17, ear:'floppy', snout:0.15, tail:'thin' },
  mushuk: { id:'mushuk', name:'Mushuk', bodyR:0.4, bodyLen:0.42, bodyY:0.84, headR:0.37, headY:1.5, eyeR:0.09, eyeX:0.15, eyeUp:0.05, armX:0.48, armY:1.12, armLen:0.32, armRad:0.12, legX:0.19, legY:0.56, legLen:0.32, legRad:0.15, ear:'pointy', snout:0.1, tail:'thin' },
  quyon:  { id:'quyon',  name:'Quyon',  bodyR:0.42, bodyLen:0.36, bodyY:0.82, headR:0.36, headY:1.46, eyeR:0.1, eyeX:0.15, eyeUp:0.05, armX:0.48, armY:1.08, armLen:0.28, armRad:0.12, legX:0.2, legY:0.52, legLen:0.28, legRad:0.16, ear:'long', snout:0.08, tail:'puff' },
  chochqa:{ id:'chochqa',name:'Cho\'chqa', bodyR:0.5, bodyLen:0.32, bodyY:0.78, headR:0.4, headY:1.42, eyeR:0.09, eyeX:0.16, eyeUp:0.04, armX:0.56, armY:1.0, armLen:0.24, armRad:0.15, legX:0.24, legY:0.48, legLen:0.24, legRad:0.18, ear:'pointy', snout:0.2, snoutColor:0xffb4c4, tail:'thin' },
  ayiq:   { id:'ayiq',   name:'Ayiq',   bodyR:0.5, bodyLen:0.4, bodyY:0.86, headR:0.42, headY:1.54, eyeR:0.09, eyeX:0.17, eyeUp:0.05, armX:0.56, armY:1.16, armLen:0.3, armRad:0.16, legX:0.24, legY:0.58, legLen:0.3, legRad:0.2, ear:'round', snout:0.16, tail:'none' },
  tulki:  { id:'tulki',  name:'Tulki',  bodyR:0.4, bodyLen:0.44, bodyY:0.84, headR:0.37, headY:1.5, eyeR:0.09, eyeX:0.15, eyeUp:0.05, armX:0.48, armY:1.12, armLen:0.32, armRad:0.12, legX:0.19, legY:0.56, legLen:0.32, legRad:0.15, ear:'pointy', snout:0.13, tail:'puff' },
  panda:  { id:'panda',  name:'Panda',  bodyR:0.5, bodyLen:0.38, bodyY:0.84, headR:0.42, headY:1.5, eyeR:0.1, eyeX:0.18, eyeUp:0.04, armX:0.56, armY:1.14, armLen:0.3, armRad:0.16, legX:0.24, legY:0.56, legLen:0.3, legRad:0.19, ear:'round', snout:0.13, tail:'none' },
  ordak:  { id:'ordak',  name:'O\'rdak', bodyR:0.44, bodyLen:0.36, bodyY:0.82, headR:0.37, headY:1.46, eyeR:0.09, eyeX:0.14, eyeUp:0.05, armX:0.5, armY:1.06, armLen:0.26, armRad:0.13, legX:0.2, legY:0.5, legLen:0.26, legRad:0.16, ear:'none', snout:0.17, snoutColor:0xffb020, tail:'puff' },
};

export const CHARACTERS = {};
for (const [k, P] of Object.entries(CREATURE_TYPES)) {
  CHARACTERS[k] = { id: P.id, name: P.name, build: (skin) => buildCreature(P, skin) };
}

// ————————————————————————————————————————————————————————————————
// WEAPONS — qurollar. build() dunyodagi pickup, buildHeld() qo'ldagi ko'rinish.
// ————————————————————————————————————————————————————————————————
export const WEAPONS = {
  knife: {
    id: 'knife', name: 'Pichoq', damage: 26, range: 2.2, arc: Math.cos(Math.PI / 3), cooldown: 0.6, knockback: 0, glow: 0xff5a5a,
    buildPickup() {
      const grp = new THREE.Group();
      const blade = box(0.08, 0.06, 0.7, 0xd1d5db, 0.25, 0.9); blade.position.z = 0.25;
      const hilt = box(0.09, 0.09, 0.3, 0x7c2d12, 0.6); hilt.position.z = -0.18;
      grp.add(blade, hilt);
      return grp;
    },
    buildHeld() { return box(0.06, 0.06, 0.5, 0xd1d5db, 0.2, 0.9); },
  },
  bat: {
    id: 'bat', name: 'Tayoq', damage: 18, range: 2.6, arc: Math.cos(Math.PI / 2.4), cooldown: 0.8, knockback: 7, glow: 0xfbbf24,
    buildPickup() {
      const grp = new THREE.Group();
      const stick = box(0.12, 0.12, 1.0, 0x8a5a2b, 0.7); stick.position.z = 0.2;
      grp.add(stick);
      return grp;
    },
    buildHeld() { const w = box(0.1, 0.1, 0.75, 0x8a5a2b, 0.7); w.position.z = 0.15; return w; },
  },
  bolgha: {
    id: 'bolgha', name: "Bolg'a", damage: 34, range: 2.4, arc: Math.cos(Math.PI / 2.2), cooldown: 1.05, knockback: 13, glow: 0xf97316,
    buildPickup() {
      const grp = new THREE.Group();
      const handle = box(0.1, 0.1, 0.9, 0x6b4423, 0.7); handle.position.z = 0.05;
      const headB = box(0.34, 0.3, 0.34, 0x9ca3af, 0.4, 0.6); headB.position.z = 0.5;
      grp.add(handle, headB);
      return grp;
    },
    buildHeld() { const grp = new THREE.Group(); const h = box(0.08, 0.08, 0.6, 0x6b4423, 0.7); const hd = box(0.26, 0.22, 0.26, 0x9ca3af, 0.4, 0.6); hd.position.z = 0.34; grp.add(h, hd); return grp; },
  },
  qilich: {
    id: 'qilich', name: 'Qilich', damage: 22, range: 3.0, arc: Math.cos(Math.PI / 2.0), cooldown: 0.62, knockback: 4, glow: 0x38bdf8,
    buildPickup() {
      const grp = new THREE.Group();
      const blade = box(0.06, 0.14, 1.0, 0xe5e7eb, 0.2, 0.95); blade.position.z = 0.4;
      const guard = box(0.28, 0.06, 0.08, 0xca8a04, 0.5, 0.7); guard.position.z = -0.14;
      const hilt = box(0.08, 0.08, 0.24, 0x3f2a12, 0.6); hilt.position.z = -0.28;
      grp.add(blade, guard, hilt);
      return grp;
    },
    buildHeld() { const grp = new THREE.Group(); const b = box(0.05, 0.1, 0.7, 0xe5e7eb, 0.2, 0.95); b.position.z = 0.3; const g = box(0.2, 0.05, 0.06, 0xca8a04, 0.5, 0.7); g.position.z = -0.05; grp.add(b, g); return grp; },
  },
};

// ————————————————————————————————————————————————————————————————
// ULTIMATES — o'yin davomida DROP bo'ladi, kim olsa ishlatadi.
// mode:'instant' => activate(game, actor). mode:'timed' => onStart/onUpdate/onEnd + duration.
// Yangi ultimate = shu yerga bitta obyekt. (kelajakda ko'proq bo'ladi)
// ————————————————————————————————————————————————————————————————
export const ULTIMATES = {
  koz: {
    id: 'koz', name: "Tungi Ko'z", emoji: '🦉', color: 0x93c5fd, mode: 'timed', duration: 6.5,
    onStart(game, a) { a.flags.nightVision = true; },
    onUpdate() {},
    onEnd(game, a) { a.flags.nightVision = false; },
  },
  dash: {
    id: 'dash', name: 'Soya Sakrash', emoji: '💨', color: 0xa78bfa, mode: 'instant',
    activate(game, a) {
      const sx = Math.sin(a.yaw), sz = Math.cos(a.yaw);
      a.invulnT = 0.6; game.fx.sound('pick'); game.fx.sparks(game.scene, a.pos, 0xa78bfa, 8);
      if (!game.world.applyKnock(a, sx, sz, 18)) { a.dashVel = new THREE.Vector3(sx, 0, sz).multiplyScalar(12); a.dashT = 0.42; }
    },
  },
  muz: {
    id: 'muz', name: 'Muzlat', emoji: '❄️', color: 0x67e8f9, mode: 'instant',
    activate(game, a) {
      const fwd = new THREE.Vector3(Math.sin(a.yaw), 0, Math.cos(a.yaw));
      let best = null, bd = 9;
      for (const e of game.enemiesOf(a)) {
        const to = e.pos.clone().sub(a.pos); const d = to.length();
        if (d < bd && fwd.dot(to.normalize()) > 0.2) { best = e; bd = d; }
      }
      if (best) { best.frozenT = Math.max(best.frozenT, 3.0); game.fx.sound('pick'); game.fx.sparks(game.scene, best.pos, 0x67e8f9, 10); }
    },
  },
  qalqon: {
    id: 'qalqon', name: 'Qalqon', emoji: '🛡️', color: 0x34d399, mode: 'timed', duration: 7,
    onStart(game, a) { a.flags.shield = true; },
    onUpdate() {},
    onEnd(game, a) { a.flags.shield = false; },
  },
  sonar: {
    id: 'sonar', name: 'Sado', emoji: '📡', color: 0xf472b6, mode: 'instant',
    activate(game, a) {
      for (const e of game.enemiesOf(a)) e.revealT = Math.max(e.revealT || 0, 3.5);
      game.fx.sound('pick'); game.fx.sparks(game.scene, a.pos, 0xf472b6, 14);
      if (a.isPlayer) game.toast('📡 Sado — dushmanlar fosh bo\'ldi!');
    },
  },
  bomba: {
    id: 'bomba', name: 'Portlash', emoji: '💣', color: 0xf97316, mode: 'instant',
    activate(game, a) {
      const R = 4.5;
      game.fx.sparks(game.scene, a.pos, 0xf97316, 22); game.fx.sound('hit');
      if (a.isPlayer) game.fx.kick(0.5);
      for (const e of game.enemiesOf(a)) {
        const to = e.pos.clone().sub(a.pos); const d = to.length();
        if (d < R) {
          game.damageActor(e, 40 * (1 - d / R) + 12, a, 'bomba');
          if (e.alive) { const n = to.setY(0).normalize(), pw = 10 * (1 - d / R) + 3; if (!game.world.applyKnock(e, n.x, n.z, pw * 1.7)) e.knockV.copy(n).multiplyScalar(pw); }
        }
      }
      if (a.isPlayer) game.toast('💣 Portlash!');
    },
  },
  tezlik: {
    id: 'tezlik', name: 'Shamol', emoji: '⚡', color: 0xfde047, mode: 'timed', duration: 6,
    onStart(game, a) { a.flags.haste = true; if (a.isPlayer) game.toast('⚡ Shamol tezligi!'); },
    onUpdate(game, a) { if (a.activeUlt && Math.floor(a.activeUlt.t * 8) % 3 === 0) game.fx.sparks(game.scene, a.pos, 0xfde047, 1); },
    onEnd(game, a) { a.flags.haste = false; },
  },
};

// ————————————————————————————————————————————————————————————————
// MAPS — atmosferalar. build(group) geometriyani `group`ga qo'shadi va meta qaytaradi.
// theme => world.js yorug'likni shunga qarab sozlaydi.
// Kelajakda: 'ballroom', 'garden', 'theater' — shu yerga qo'shiladi.
// ————————————————————————————————————————————————————————————————
export const MAPS = {
  cozy: {
    id: 'cozy', name: 'Shinam Xona',
    theme: {
      background: 0x05060a, fogDensity: 0.03,
      sky: { top: 0x05060e, horizon: 0x151e3a, moonColor: 0x9fb4ff, moonX: 0.74, moonY: 0.22 },
      moon: { color: 0x8ba6ff, intensity: 1.15, pos: [-14, 10, -6] },
      hemi: { sky: 0x9fb4ff, ground: 0x20140a, darkI: 0.14, lightAddI: 0.55 },
      ambient: { color: 0x101830, intensity: 0.25 },
      lamp: { color: 0xffd9a0, keyMax: 66, fillMax: 20, angle: 1.45, penumbra: 0.6 },
    },
    build(group) {
      const R = 20, H = 4.2, half = R / 2;
      const add = (m) => { group.add(m); return m; };
      const furniture = [];
      const F = (m, hx, hz) => { furniture.push({ get minX() { return m.position.x - hx; }, get maxX() { return m.position.x + hx; }, get minZ() { return m.position.z - hz; }, get maxZ() { return m.position.z + hz; } }); return m; };

      // pol — realistik yog'och parket (PBR)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(R, R), new THREE.MeshStandardMaterial({ roughness: 0.75 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; applyPBR(floor, TEX.wood(), 5, 5, 0.7); add(floor);
      // gilam — mato (PBR)
      const rug = new THREE.Mesh(new THREE.CircleGeometry(4.6, 40), new THREE.MeshStandardMaterial({ color: 0x8a3450, roughness: 1 }));
      rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01; rug.receiveShadow = true; applyPBR(rug, TEX.fabric([120, 44, 64]), 5, 5, 0.5); add(rug);
      // devorlar — gips (PBR)
      const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
      applyPBR({ material: wallMat }, TEX.plaster([48, 42, 56]), 3, 2, 0.5);
      const wall = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat); m.position.set(x, H / 2, z); m.receiveShadow = true; add(m); };
      wall(R, 0.4, 0, -half); wall(R, 0.4, 0, half); wall(0.4, R, -half, 0); wall(0.4, R, half, 0);
      // deraza (oy nuri)
      const win = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.6), new THREE.MeshStandardMaterial({ color: 0x24406b, emissive: 0x24406b, emissiveIntensity: 0.6, roughness: 1 }));
      win.position.set(-half + 0.25, 2.4, -3.5); win.rotation.y = Math.PI / 2; add(win);
      // osma lampa (shar + shnur)
      const lampPos = new THREE.Vector3(0, H - 0.6, 0);
      const shade = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), new THREE.MeshStandardMaterial({ color: 0xffe6b8, emissive: 0xffcaa0, emissiveIntensity: 0, roughness: 0.5 }));
      shade.position.copy(lampPos); add(shade);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H - lampPos.y), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      cord.position.set(0, (H + lampPos.y) / 2, 0); add(cord);
      // mebel
      add(F(box(5, 0.7, 1.6, 0x394a6d), 2.5, 0.8)).position.set(0, 0.35, 7.2);
      add(box(5, 0.9, 0.35, 0x30405f)).position.set(0, 0.8, 7.9);
      const table = F(box(2.2, 0.55, 1.2, 0x4a3524, 0.6), 1.15, 0.65); add(table); table.position.set(0, 0.28, 3.4);
      const shelf = F(box(1.0, 3.2, 4.5, 0x3a2a1e), 0.6, 2.3); add(shelf); shelf.position.set(half - 0.9, 1.6, 2);
      for (let i = 0; i < 10; i++) { const bk = box(0.7, 0.5, 0.28, [0x22d3ee, 0xf43f5e, 0xa78bfa, 0x34d399, 0xfbbf24][i % 5], 1); add(bk); bk.position.set(half - 0.9, 0.7 + (i % 5) * 0.6, -0.1 + Math.floor(i / 5) * 0.9 + 1.2); }
      const cab = F(box(2.6, 1.0, 0.8, 0x2f241a), 1.3, 0.5); add(cab); cab.position.set(-half + 1.2, 0.5, 6);
      add(box(0.4, 1.0, 0.4, 0x8b5cf6, 0.4)).position.set(-half + 1.2, 1.5, 6);
      const dtable = F(box(2.0, 0.6, 2.0, 0x50361f, 0.7), 1.1, 1.1); add(dtable); dtable.position.set(-6, 0.7, -6);
      const pot = F(box(0.9, 0.7, 0.9, 0x6b4423), 0.5, 0.5); add(pot); pot.position.set(6.5, 0.35, -6.5);
      const plant = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 1 }));
      plant.position.set(6.5, 1.9, -6.5); plant.castShadow = true; add(plant);
      for (const [x, z, ry] of [[0, half - 0.3, Math.PI], [-half + 0.3, 5, Math.PI / 2]]) {
        const fr = box(1.6, 1.1, 0.08, 0x836140, 0.5); add(fr); fr.position.set(x, 2.6, z); fr.rotation.y = ry;
      }

      // spawn nuqtalari (markazdan halqa)
      const spawnPoints = [];
      const N = 6;
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; spawnPoints.push(new THREE.Vector3(Math.sin(a) * 5.2, 0, Math.cos(a) * 5.2)); }

      return {
        bounds: half - 0.7, shadeMesh: shade, lampPos,
        furniture, spawnPoints,
        weaponSpawn: new THREE.Vector3(0, 0.62, 3.4), // stol ustida
      };
    },
  },

  ballroom: {
    id: 'ballroom', name: 'Bal Zali',
    theme: {
      background: 0x080a12, fogDensity: 0.026,
      sky: { top: 0x06081a, horizon: 0x18204a, moonColor: 0xbfd0ff, moonX: 0.28, moonY: 0.2 },
      moon: { color: 0x9fb0ff, intensity: 1.25, pos: [12, 11, -8] },
      hemi: { sky: 0xbfd0ff, ground: 0x1a1a24, darkI: 0.16, lightAddI: 0.6 },
      ambient: { color: 0x14182a, intensity: 0.28 },
      lamp: { color: 0xfff0d0, keyMax: 62, fillMax: 24, angle: 1.5, penumbra: 0.6 },
    },
    build(group) {
      const R = 20, H = 5.0, half = R / 2;
      const add = (m) => { group.add(m); return m; };
      const furniture = [];
      const F = (m, hx, hz) => { furniture.push({ get minX() { return m.position.x - hx; }, get maxX() { return m.position.x + hx; }, get minZ() { return m.position.z - hz; }, get maxZ() { return m.position.z + hz; } }); return m; };

      // realistik marmar pol (PBR)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(R, R), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; applyPBR(floor, TEX.marble(), 3, 3, 0.4); add(floor);
      const medallion = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.15 }));
      medallion.rotation.x = -Math.PI / 2; medallion.position.y = 0.01; medallion.receiveShadow = true; applyPBR(medallion, TEX.marble(), 2, 2, 0.4); add(medallion);
      // devorlar (marmar-gips)
      const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.05 });
      applyPBR({ material: wallMat }, TEX.plaster([40, 42, 62]), 3, 2, 0.5);
      const wall = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat); m.position.set(x, H / 2, z); m.receiveShadow = true; add(m); };
      wall(R, 0.4, 0, -half); wall(R, 0.4, 0, half); wall(0.4, R, -half, 0); wall(0.4, R, half, 0);
      // baland derazalar (oy nuri)
      const winMat = new THREE.MeshStandardMaterial({ color: 0x2e4a7a, emissive: 0x2e4a7a, emissiveIntensity: 0.7, roughness: 1 });
      for (const z of [-5, 0, 5]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.6), winMat); w.position.set(-half + 0.25, 2.6, z); w.rotation.y = Math.PI / 2; add(w); }
      // ustunlar (oltin)
      const colMat = new THREE.MeshStandardMaterial({ color: 0x8a763e, roughness: 0.35, metalness: 0.55 });
      for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, H, 16), colMat);
        col.position.set(x, H / 2, z); col.castShadow = true; col.receiveShadow = true; add(col);
        furniture.push({ minX: x - 0.7, maxX: x + 0.7, minZ: z - 0.7, maxZ: z + 0.7 });
      }
      // qandil (markazda) — key light shu yerdan
      const lampPos = new THREE.Vector3(0, H - 0.7, 0);
      const chand = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe6b0, emissiveIntensity: 0, roughness: 0.4 }));
      chand.add(core);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe6b0, emissiveIntensity: 0, roughness: 0.4 })); b.position.set(Math.cos(a) * 0.7, -0.15, Math.sin(a) * 0.7); b.userData.follow = core.material; chand.add(b); }
      chand.position.copy(lampPos); add(chand);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, H - lampPos.y), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
      cord.position.set(0, (H + lampPos.y) / 2, 0); add(cord);
      // uzun stol (qurol shu yerda)
      const table = F(box(4.4, 0.55, 1.1, 0x5a3a22, 0.5), 2.2, 0.6); add(table); table.position.set(0, 0.5, 3.6);
      // royal (burchakda)
      const piano = F(box(2.6, 1.0, 1.6, 0x0d0d12, 0.3, 0.3), 1.3, 0.8); add(piano); piano.position.set(6, 0.5, 5.5);
      // gul vazalar (ustunlar yonida)
      for (const [x, z] of [[-6, -4], [6, -4]]) { const v = box(0.4, 1.2, 0.4, 0xb08d57, 0.4, 0.5); add(v); v.position.set(x, 0.6, z); }

      const spawnPoints = [];
      const N = 6; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; spawnPoints.push(new THREE.Vector3(Math.sin(a) * 5.5, 0, Math.cos(a) * 5.5)); }

      return { bounds: half - 0.7, shadeMesh: core, lampPos, furniture, spawnPoints, weaponSpawn: new THREE.Vector3(0, 0.82, 3.6) };
    },
  },

  garden: {
    id: 'garden', name: 'Tungi Bog\'',
    theme: {
      background: 0x060a0c, fogDensity: 0.032,
      sky: { top: 0x061020, horizon: 0x1c3a4a, moonColor: 0x9fd0ff, moonX: 0.7, moonY: 0.26 },
      moon: { color: 0x8fb4ff, intensity: 1.35, pos: [8, 12, -10] },
      hemi: { sky: 0x557799, ground: 0x0e1a12, darkI: 0.18, lightAddI: 0.5 },
      ambient: { color: 0x0e1a20, intensity: 0.3 },
      lamp: { color: 0xaee6ff, keyMax: 56, fillMax: 16, angle: 1.5, penumbra: 0.65 },
    },
    build(group) {
      const R = 20, H = 4.6, half = R / 2;
      const add = (m) => { group.add(m); return m; };
      const furniture = [];
      const F = (m, hx, hz) => { furniture.push({ get minX() { return m.position.x - hx; }, get maxX() { return m.position.x + hx; }, get minZ() { return m.position.z - hz; }, get maxZ() { return m.position.z + hz; } }); return m; };

      // realistik o't (grass) pol (PBR)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(R, R), new THREE.MeshStandardMaterial({ roughness: 1 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; applyPBR(floor, TEX.grass(), 7, 7, 0.8); add(floor);
      const path = new THREE.Mesh(new THREE.CircleGeometry(4.4, 40), new THREE.MeshStandardMaterial({ color: 0x9a9488, roughness: 1 }));
      path.rotation.x = -Math.PI / 2; path.position.y = 0.01; path.receiveShadow = true; applyPBR(path, TEX.plaster([120, 116, 104]), 4, 4, 0.6); add(path);
      // devor o'rniga baland butalar (hedge) — o't teksturasi
      const hedge = new THREE.MeshStandardMaterial({ roughness: 1 });
      applyPBR({ material: hedge }, TEX.grass(), 4, 3, 0.7); hedge.color.setRGB(0.5, 0.75, 0.45);
      const hw = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2.4, d), hedge); m.position.set(x, 1.2, z); m.castShadow = m.receiveShadow = true; add(m); };
      hw(R, 0.8, 0, -half + 0.4); hw(R, 0.8, 0, half - 0.4); hw(0.8, R, -half + 0.4, 0); hw(0.8, R, half - 0.4, 0);
      // gazebo ustunlari + markazdagi fonar (key light)
      const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.6, metalness: 0.4 });
      for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, H - 0.6, 8), postMat); p.position.set(x, (H - 0.6) / 2, z); p.castShadow = true; add(p); }
      const lampPos = new THREE.Vector3(0, H - 0.8, 0);
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), new THREE.MeshStandardMaterial({ color: 0xdff3ff, emissive: 0xbfe8ff, emissiveIntensity: 0, roughness: 0.4 }));
      lantern.position.copy(lampPos); add(lantern);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      cord.position.set(0, H - 0.35, 0); add(cord);
      // daraxtlar (burchaklar)
      for (const [x, z] of [[-6.5, -6.5], [6.5, -6.5], [-6.5, 6.5], [6.5, 6.5]]) {
        const trunk = F(box(0.5, 2.0, 0.5, 0x3a2a1a), 0.4, 0.4); add(trunk); trunk.position.set(x, 1.0, z);
        const crown = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.0, 9), new THREE.MeshStandardMaterial({ color: 0x224d2c, roughness: 1 })); crown.position.set(x, 3.2, z); crown.castShadow = true; add(crown);
      }
      // fontan (chetroqda) + skameykalar
      const fount = F(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.6, 20), new THREE.MeshStandardMaterial({ color: 0x33484f, roughness: 0.7 })), 1.2, 1.2); add(fount); fount.position.set(-6, 0.3, 3);
      for (const [x, z, r] of [[0, 6, 0], [6, 0, Math.PI / 2]]) { const bench = F(box(2.2, 0.5, 0.6, 0x4a3524), r ? 0.3 : 1.1, r ? 1.1 : 0.3); add(bench); bench.position.set(x, 0.25, z); bench.rotation.y = r; }

      const spawnPoints = [];
      const N = 6; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; spawnPoints.push(new THREE.Vector3(Math.sin(a) * 5.2, 0, Math.cos(a) * 5.2)); }
      return { bounds: half - 1.1, shadeMesh: lantern, lampPos, furniture, spawnPoints, weaponSpawn: new THREE.Vector3(0, 0.6, 2.6) };
    },
  },

  theater: {
    id: 'theater', name: 'Teatr',
    theme: {
      background: 0x0a0608, fogDensity: 0.034,
      sky: { top: 0x0a0614, horizon: 0x281634, moonColor: 0x9a86ff, moonX: 0.32, moonY: 0.18 },
      moon: { color: 0x6a6a9a, intensity: 0.5, pos: [0, 12, 12] },
      hemi: { sky: 0x3a2e3a, ground: 0x140a0a, darkI: 0.13, lightAddI: 0.5 },
      ambient: { color: 0x1a0e12, intensity: 0.3 },
      lamp: { color: 0xffdca8, keyMax: 76, fillMax: 28, angle: 1.45, penumbra: 0.55 },
    },
    build(group) {
      const R = 20, H = 5.2, half = R / 2;
      const add = (m) => { group.add(m); return m; };
      const furniture = [];
      const F = (m, hx, hz) => { furniture.push({ get minX() { return m.position.x - hx; }, get maxX() { return m.position.x + hx; }, get minZ() { return m.position.z - hz; }, get maxZ() { return m.position.z + hz; } }); return m; };

      // realistik to'q yog'och sahna pol (PBR)
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(R, R), new THREE.MeshStandardMaterial({ roughness: 0.8 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; applyPBR(floor, TEX.wood(true), 5, 5, 0.7); add(floor);
      const stageWood = new THREE.Mesh(new THREE.CircleGeometry(5, 40), new THREE.MeshStandardMaterial({ roughness: 0.55 }));
      stageWood.rotation.x = -Math.PI / 2; stageWood.position.y = 0.02; stageWood.receiveShadow = true; applyPBR(stageWood, TEX.wood(), 4, 4, 0.6); add(stageWood);
      const wallMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
      applyPBR({ material: wallMat }, TEX.plaster([34, 24, 40]), 3, 2, 0.5);
      const wall = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat); m.position.set(x, H / 2, z); m.receiveShadow = true; add(m); };
      wall(R, 0.4, 0, -half); wall(R, 0.4, 0, half); wall(0.4, R, -half, 0); wall(0.4, R, half, 0);
      // qizil parda (orqa devor)
      const curtainMat = new THREE.MeshStandardMaterial({ color: 0x5a0f1a, emissive: 0x2a060c, emissiveIntensity: 0.5, roughness: 1 });
      for (const x of [-3.2, 3.2]) { const c = new THREE.Mesh(new THREE.BoxGeometry(2.6, H - 0.4, 0.3), curtainMat); c.position.set(x, (H - 0.4) / 2, -half + 0.7); add(c); }
      // sahna platformasi (orqada)
      const stage = F(box(9, 0.6, 3.5, 0x2a1c22, 0.7), 4.5, 1.75); add(stage); stage.position.set(0, 0.3, -6);
      // o'rindiqlar (old qatorlar)
      for (let r = 0; r < 2; r++) for (let s = -2; s <= 2; s++) { const seat = box(1.0, 0.7, 0.8, 0x3a2030, 0.8); add(seat); seat.position.set(s * 1.6, 0.35, 6 + r * 1.4); if (r === 0) furniture.push({ minX: s * 1.6 - 0.5, maxX: s * 1.6 + 0.5, minZ: 6 - 0.4, maxZ: 6 + 0.4 }); }
      // yon ustunlar (oltin)
      const colMat = new THREE.MeshStandardMaterial({ color: 0x6e5a2e, roughness: 0.4, metalness: 0.5 });
      for (const [x, z] of [[-7, -2], [7, -2], [-7, 4], [7, 4]]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, H, 14), colMat); col.position.set(x, H / 2, z); col.castShadow = true; add(col); furniture.push({ minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.6, maxZ: z + 0.6 }); }
      // sahna prожektori (key light) — markazda, o'yinchilarni yaxshi yoritadi
      const lampPos = new THREE.Vector3(0, H - 0.5, 0);
      const rig = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffe0a0, emissiveIntensity: 0, roughness: 0.4 }));
      rig.position.copy(lampPos); add(rig);

      const spawnPoints = [];
      const N = 6; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; spawnPoints.push(new THREE.Vector3(Math.sin(a) * 4.6, 0, Math.cos(a) * 4.6 + 1)); }
      return { bounds: half - 0.7, shadeMesh: rig, lampPos, furniture, spawnPoints, weaponSpawn: new THREE.Vector3(0, 0.8, -5) };
    },
  },
};
