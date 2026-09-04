// BLACKOUT — dunyo: renderer, sahna, kamera, yorug'lik va xarita (atmosfera) yuklash.
import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';
import { MAPS, partyDecor } from './content.js';
// post-processing (lokal vendored, CDN yo'q) — bloom + environment
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

export class World {
  constructor(container) {
    // MOBIL aniqlash -> yengilroq sozlamalar (telefonda ko'p personajda lag kamayadi)
    this.MOBILE = (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    const M = this.MOBILE;
    const renderer = new THREE.WebGLRenderer({ antialias: !M, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, M ? 1 : 1.5));   // mobil: 1x (retina yuki yarmiga tushadi)
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = M ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    // IMAGE-BASED LIGHTING: neytral studiya environmenti -> materiallar boy/yumshoq ko'rinadi
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.envMap;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(CONFIG.fov, innerWidth / innerHeight, 0.1, 200);
    this.camera = camera;

    // yorug'lik obyektlari (bir marta yaratamiz, xarita mavzusiga qarab sozlaymiz)
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.1); scene.add(this.hemi);
    this.moon = new THREE.DirectionalLight(0xffffff, 1); scene.add(this.moon);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.2); scene.add(this.ambient);
    this.lamp = new THREE.SpotLight(0xffffff, 0, 42, 1.4, 0.55, 2);
    this.lamp.castShadow = true;
    this.lamp.shadow.mapSize.set(M ? 1024 : 2048, M ? 1024 : 2048);   // desktop: 2048 (aniq soya), mobil: 1024
    this.lamp.shadow.bias = -0.0003; this.lamp.shadow.normalBias = 0.04;
    this.lamp.shadow.camera.near = 0.5; this.lamp.shadow.camera.far = 12;
    scene.add(this.lamp); scene.add(this.lamp.target);
    this.lampFill = new THREE.PointLight(0xffffff, 0, 26, 2); scene.add(this.lampFill);
    // o'yinchi ko'rish aurasi — zulmatda faqat o'z atrofingni ko'rasan (dushmanlar yashirin)
    this.visionLight = new THREE.PointLight(0xfff0d0, 0, 5.2, 1.5); scene.add(this.visionLight);

    // qo'shimcha shift lampalari — SVET yonganda butun xona kunduzgidek yorishadi (2 ta — perf)
    this.extraLamps = [];
    for (let i = 0; i < 2; i++) {
      const pl = new THREE.PointLight(0xffe6b8, 0, 40, 2);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xfff2d6, emissive: 0xffe0b0, emissiveIntensity: 0, roughness: 0.4 }));
      scene.add(pl); scene.add(bulb);
      this.extraLamps.push({ pl, bulb });
    }

    // ATMOSFERA: havoda suzuvchi "olov chirog'i" zarralari (zulmatda porlaydi)
    this.motes = this._makeMotes();
    scene.add(this.motes);
    // UCHAR YULDUZLAR: osmonda goh-goh o'tadigan meteor chiziqlari (party jozibasi)
    this.meteors = this._makeMeteors();
    for (const m of this.meteors) scene.add(m.sp);
    this._nextMeteor = 4000;

    this.mapGroup = null; this.meta = null; this.theme = null;

    // POST-PROCESSING. Desktop: MSAA (silliq qirralar) + Bloom. SSAO ixtiyoriy (?ssao=1).
    const dpr = Math.min(devicePixelRatio, M ? 1 : 1.5);
    // Desktop'da MSAA multisample target -> qirralar tishsiz (premium ko'rinish)
    const rt = new THREE.WebGLRenderTarget(Math.floor(innerWidth * dpr), Math.floor(innerHeight * dpr),
      { type: THREE.HalfFloatType, samples: M ? 0 : 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(innerWidth, innerHeight);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.5, 0.92);
    // strength, radius, threshold — faqat yorqin joylar porlaydi (personaj tanalari emas)
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this._sizeBloom();   // bloom past rezolyutsiyada (yumshoq — sifat o'zgarmaydi, GPU yengil)

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      this.composer.setSize(innerWidth, innerHeight);
      this._sizeBloom();
    });
  }

  // Atmosferani yuklash (kelajakda menyudan almashtiriladi)
  loadMap(mapId) {
    if (this.mapGroup) { this.scene.remove(this.mapGroup); this._dispose(this.mapGroup); }
    const def = MAPS[mapId] || MAPS[CONFIG.defaultMap];
    const group = new THREE.Group();
    const meta = def.build(group);
    // PARTY DEKOR — chiroq gulchambari + sharlar + konfetti (har xaritaga)
    const decor = partyDecor(meta.bounds);
    group.add(decor.group); this._balloons = decor.balloons;
    this.scene.add(group);
    this.mapGroup = group; this.meta = meta; this.theme = def.theme;
    if (this.physReady) this._buildPhysColliders(meta);

    const t = def.theme;
    // OSMON: yulduzli gradient skydome (ochiq shiftdan ko'rinadi) + yumshoq oy
    this._buildSky(t);
    // TUMAN: uzoq devor/mebel ufq rangiga singadi -> chuqurlik hissi (atmosfera)
    const horizon = (t.sky && t.sky.horizon != null) ? t.sky.horizon : t.background;
    this._fogHorizon = new THREE.Color(horizon);
    this.scene.background = new THREE.Color(horizon);
    this.scene.fog = new THREE.FogExp2(horizon, t.fogDensity);
    this.hemi.color.setHex(t.hemi.sky); this.hemi.groundColor.setHex(t.hemi.ground);
    this.moon.color.setHex(t.moon.color); this.moon.intensity = t.moon.intensity;
    this.moon.position.set(...t.moon.pos);
    this.ambient.color.setHex(t.ambient.color); this.ambient.intensity = t.ambient.intensity;
    this.lamp.color.setHex(t.lamp.color); this.lamp.angle = t.lamp.angle; this.lamp.penumbra = t.lamp.penumbra;
    this.lamp.position.copy(meta.lampPos); this.lamp.target.position.set(meta.lampPos.x, 0, meta.lampPos.z);
    this.lampFill.color.setHex(t.lamp.color); this.lampFill.position.copy(meta.lampPos);
    // qo'shimcha lampalarni xona burchaklariga (shift balandligida) joylaymiz
    const b = (meta.bounds || 8) * 0.6, y = Math.max(3.2, meta.lampPos.y);
    const spots = [[-b, y, -b], [b, y, b]];   // 2 diagonal burchak
    this.extraLamps.forEach((L, i) => { L.pl.color.setHex(t.lamp.color); L.pl.position.set(...spots[i]); L.bulb.position.set(...spots[i]); });
    this._ambientBase = t.ambient.intensity;
    // YORUG'LIK NURI: shift lampasidan tuman/chang orasidan tushadigan volumetrik ustun
    this._buildLightShaft(meta, t);
    return meta;
  }

  // Soxta volumetrik nur ustuni (additive konus) — svet yonganda tuman ichida ko'rinadi.
  // Apeksi lampada, tagi polda; tepasi yorqin, pasti so'nadi (vertex-color gradient).
  _buildLightShaft(meta, t) {
    if (this.lightShaft) { this.scene.remove(this.lightShaft); this.lightShaft.geometry.dispose(); this.lightShaft.material.dispose(); }
    const top = Math.max(2.6, meta.lampPos.y), rad = Math.min(3.4, (meta.bounds || 8) * 0.34);
    const geo = new THREE.ConeGeometry(rad, top, 24, 1, true);
    const pos = geo.attributes.position, N = pos.count, col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const b = Math.pow((pos.getY(i) + top / 2) / top, 1.4);   // tepa=1 (yorqin), tag=0 (so'ngan)
      col[i * 3] = b; col[i * 3 + 1] = b; col[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.MeshBasicMaterial({ color: t.lamp.color, vertexColors: true, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const shaft = new THREE.Mesh(geo, mat);
    shaft.position.set(meta.lampPos.x, top / 2, meta.lampPos.z); shaft.renderOrder = 3;
    this.scene.add(shaft); this.lightShaft = shaft;
  }

  // lightK: 0..1 (yorug'lik darajasi). nightVision: player tungi ko'z ishlatyaptimi.
  updateLights(lightK, nightVision) {
    const t = this.theme, l = t.lamp;
    this.lamp.intensity = lightK * l.keyMax;
    this.lampFill.intensity = lightK * l.fillMax;
    if (this.meta.shadeMesh) this.meta.shadeMesh.material.emissiveIntensity = lightK * 2.6;
    const nv = nightVision ? 1.0 : 0;
    // SVET yonganda kunduzgidek yorqin; ZULMATDA deyarli QOP-QORONG'I —
    // faqat o'yinchi aurasi + porlaydigan pickuplar ko'rinadi (bir-birini izlash).
    this.hemi.intensity = t.hemi.darkI * 0.15 + lightK * (t.hemi.lightAddI + 1.0) + nv * 0.5;
    this.ambient.intensity = (this._ambientBase || 0.2) * 0.08 + lightK * 1.0 + nv * 0.25;
    this.moon.intensity = t.moon.intensity * (0.04 + lightK * 0.96);
    // IBL environment faqat yorug'da (zulmatda o'chadi -> haqiqiy qorong'i)
    const envOn = lightK > 0.12 || nightVision;
    if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 0.04 + lightK * 0.96;
    else this.scene.environment = envOn ? this.envMap : null;
    // qo'shimcha shift lampalari yonadi (literal "ko'proq lampa")
    for (const L of this.extraLamps) { L.pl.intensity = lightK * 26; L.bulb.material.emissiveIntensity = lightK * 2.4; }
    this.renderer.toneMappingExposure = 1.0 + lightK * 0.5 + (nightVision ? 0.4 : 0);
    // o'yinchi ko'rish aurasi — zulmatda atrofni ozgina yoritadi (tungi ko'z bilan kengroq)
    if (this.visionLight) { this.visionLight.intensity = (1 - lightK) * (nightVision ? 6 : 3.0); this.visionLight.distance = nightVision ? 9 : 5.2; }
    // ZULMATDA osmon ham qorayadi (yulduzlar juda xira qoladi) -> haqiqiy zulmat, blind hunt buzilmaydi
    if (this.sky) this.sky.material.color.setScalar(0.13 + lightK * 0.87);
    // TUMAN rangi ham zulmatda qoraga tortadi (uzoq sirtlar navigatsiya bermasin)
    if (this.scene.fog && this._fogHorizon) this.scene.fog.color.copy(this._fogHorizon).multiplyScalar(0.16 + lightK * 0.84);
    // NUR USTUNI faqat svet yonganda ko'rinadi (zulmatda yo'q — blind hunt saqlanadi)
    if (this.lightShaft) this.lightShaft.material.opacity = Math.max(0, lightK - 0.15) * 0.2;
    // ZULMATDA soya ko'rinmaydi (lampa o'chiq) -> butun soya render pass'ini o'tkazib yuboramiz (perf, sifat o'zgarmaydi)
    this.renderer.shadowMap.autoUpdate = lightK > 0.08;
  }

  updateCamera(targetPos, yaw, dt, shake) {
    // yuqori 3/4 ko'rinish: fokus = xona markazi va o'yinchi o'rtasi (hamma ko'rinib tursin)
    const f = CONFIG.camFollow;
    const fx = targetPos.x * f, fz = targetPos.z * f;
    const desired = new THREE.Vector3(fx, CONFIG.camHeight, fz + CONFIG.camDist);
    this.camera.position.lerp(desired, 1 - Math.pow(CONFIG.camLerp, dt));
    if (shake > 0) { this.camera.position.x += (Math.random() - 0.5) * shake; this.camera.position.y += (Math.random() - 0.5) * shake; }
    if (this.visionLight) this.visionLight.position.set(targetPos.x, 2.4, targetPos.z);   // aura o'yinchi bilan yuradi
    this.camera.lookAt(fx, 0.8, fz);
  }

  // ——— RAPIER FIZIKA (KO ragdoll) ———
  // Haqiqiy rigid-body: o'lgan tanalar yerga/bir-biriga urilib ag'anaydi (Party Animals).
  async initPhysics() {
    if (this.physReady || this._physLoading) return;
    this._physLoading = true;
    try {
      const RAPIER = (await import('../vendor/rapier.es.js')).default;
      await RAPIER.init();
      this.RAPIER = RAPIER;
      this.phys = new RAPIER.World({ x: 0, y: -18, z: 0 });   // biroz kuchliroq gravitatsiya (tez o'tiradi)
      this.ragdolls = [];
      this._statics = [];
      this.physReady = true;
      this.liveBodies = [];
      if (this.meta) this._buildPhysColliders(this.meta);
    } catch (e) { this._physLoading = false; /* fizika bo'lmasa protsedura fallback */ }
  }

  _buildPhysColliders(meta) {
    const R = this.RAPIER, w = this.phys, bounds = meta.bounds;
    if (this._statics) for (const c of this._statics) { try { w.removeCollider(c, false); } catch (e) {} }
    this._statics = [];
    const add = (desc) => { this._statics.push(w.createCollider(desc)); };
    add(R.ColliderDesc.cuboid(bounds + 2, 0.5, bounds + 2).setTranslation(0, -0.5, 0));   // pol
    // devorlar — ichki yuzi ko'rinadigan devorga to'g'ri keladi (ko'rinmas margin yo'q)
    const h = 3, t = 0.5, wallOff = bounds + 0.5 + t;
    add(R.ColliderDesc.cuboid(bounds + 2, h, t).setTranslation(0, h, -wallOff));
    add(R.ColliderDesc.cuboid(bounds + 2, h, t).setTranslation(0, h, wallOff));
    add(R.ColliderDesc.cuboid(t, h, bounds + 2).setTranslation(-wallOff, h, 0));
    add(R.ColliderDesc.cuboid(t, h, bounds + 2).setTranslation(wallOff, h, 0));
    // mebel to'siqlari (tanalar stol/javondan o'tmaydi)
    for (const f of (meta.furniture || [])) {
      const hx = (f.maxX - f.minX) / 2, hz = (f.maxZ - f.minZ) / 2;
      if (hx < 0.05 || hz < 0.05) continue;
      add(R.ColliderDesc.cuboid(hx, 0.6, hz).setTranslation((f.minX + f.maxX) / 2, 0.6, (f.minZ + f.maxZ) / 2));
    }
  }

  // ——— ACTIVE RAGDOLL (tirik personajlar fizikasi — yakka rejim) ———
  // Tirik aktor = tik turgan dinamik kapsula: bir-birini itaradi, turtki oladi, ag'anaydi.
  createLiveBody(actor) {
    if (!this.physReady) return false;
    const R = this.RAPIER, w = this.phys;
    const body = w.createRigidBody(
      R.RigidBodyDesc.dynamic().setTranslation(actor.pos.x, 0.6, actor.pos.z)
        .setLinearDamping(2.2).setAngularDamping(4.0).enabledRotations(false, false, false));  // tik turadi
    // past friction (0.25) — aks holda yuqori damping bilan turtki ishlamaydi
    w.createCollider(R.ColliderDesc.capsule(0.5, 0.42).setTranslation(0, 0.4, 0).setDensity(1.0).setFriction(0.25).setRestitution(0.0), body);
    actor.body = body; this.liveBodies.push({ body, actor });
    return true;
  }
  clearLiveBodies() {
    if (!this.physReady || !this.liveBodies) return;
    for (const L of this.liveBodies) { try { this.phys.removeRigidBody(L.body); } catch (e) {} if (L.actor) L.actor.body = null; }
    this.liveBodies = [];
  }
  removeLiveBody(actor) {
    if (!actor.body) return;
    const i = this.liveBodies.findIndex(L => L.actor === actor);
    if (i >= 0) this.liveBodies.splice(i, 1);
    try { this.phys.removeRigidBody(actor.body); } catch (e) {}
    actor.body = null;
  }
  // desired horizontal tezlikni tanaga beradi (input/AI dan)
  setLiveVelocity(actor) {
    if (!actor.body) return;
    const v = actor.body.linvel();
    actor.body.setLinvel({ x: actor.vel.x, y: v.y, z: actor.vel.z }, true);
  }
  // step'dan keyin: aktor pozitsiyasi/tezligini tanadan o'qiydi
  syncLiveActor(actor) {
    if (!actor.body) return;
    const p = actor.body.translation(), v = actor.body.linvel();
    actor.pos.x = p.x; actor.pos.z = p.z;
    actor.vel.set(v.x, 0, v.z);
  }
  applyKnock(actor, dirx, dirz, power) {
    if (!actor.body) return false;
    // tezlik asosida (massadan mustaqil) — kuchli, ko'rinadigan turtki + kichik sakrash
    actor.body.setLinvel({ x: dirx * power, y: 2.4, z: dirz * power }, true);
    actor.staggerT = 0.5;   // turtki paytida boshqaruv o'chadi (tana uchadi)
    return true;
  }

  // o'lган aktor modelini haqiqiy rigid-body sifatida uchiradi
  spawnRagdoll(model, pos, yaw, knock) {
    if (!this.physReady) return false;
    const R = this.RAPIER, w = this.phys;
    const body = w.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(pos.x, 0.1, pos.z).setLinearDamping(0.35).setAngularDamping(0.5));
    // collider tana markazida (+0.8) — Rapier COM atrofida ag'anaydi
    w.createCollider(R.ColliderDesc.roundCuboid(0.34, 0.55, 0.34, 0.14).setTranslation(0, 0.75, 0).setDensity(1.1).setRestitution(0.35).setFriction(0.8), body);
    const kx = (knock ? knock.x : 0), kz = (knock ? knock.z : 0);
    body.setLinvel({ x: kx * 0.55 + (Math.random() - 0.5) * 3, y: 4.2 + Math.random() * 2.2, z: kz * 0.55 + (Math.random() - 0.5) * 3 }, true);
    body.setAngvel({ x: (Math.random() - 0.5) * 16, y: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 16 }, true);
    this.ragdolls.push({ body, model, t: 4.2 });
    return true;
  }

  stepPhysics(dt) {
    if (!this.physReady) return;
    this.phys.step();
    for (let i = this.ragdolls.length - 1; i >= 0; i--) {
      const r = this.ragdolls[i]; const p = r.body.translation(), q = r.body.rotation();
      r.model.position.set(p.x, p.y, p.z);
      r.model.quaternion.set(q.x, q.y, q.z, q.w);
      r.t -= dt;
      if (r.t <= 0.7) { const f = Math.max(0.25, r.t / 0.7); r.model.scale.setScalar(f); }
      if (r.t <= 0) { r.model.visible = false; try { this.phys.removeRigidBody(r.body); } catch (e) {} this.ragdolls.splice(i, 1); }
    }
  }

  clearRagdolls() {
    if (!this.physReady || !this.ragdolls) return;
    for (const r of this.ragdolls) { try { this.phys.removeRigidBody(r.body); } catch (e) {} }
    this.ragdolls = [];
  }

  // bloom'ni ekran rezolyutsiyasidan past qilib qo'yamiz (composer.setSize'dan keyin chaqiriladi).
  // Bloom yumshoq/loyqa — past rezolyutsiyada ko'rinishi deyarli o'zgarmaydi, GPU ~2x yengillashadi.
  _sizeBloom() {
    if (!this.bloom) return;
    const s = this.MOBILE ? 0.4 : 0.6;   // mobilda bloom yanada past rezolyutsiya
    this.bloom.setSize(Math.max(140, Math.floor(innerWidth * s)), Math.max(100, Math.floor(innerHeight * s)));
  }

  render() { this.composer.render(); }

  // OSMON: gradient (ufq->zenit) + yulduzlar + yumshoq oy shu'lasi bo'lgan skydome.
  // Ochiq shiftli xonalardan tepada ko'rinadi; zulmatda updateLights uni xiralashtiradi.
  _buildSky(t) {
    if (this.sky) {
      this.scene.remove(this.sky); this.sky.geometry.dispose();
      if (this.sky.material.map) this.sky.material.map.dispose(); this.sky.material.dispose();
    }
    const sk = t.sky || {};
    const top = new THREE.Color(sk.top != null ? sk.top : t.background);
    const hor = new THREE.Color(sk.horizon != null ? sk.horizon : t.background);
    const size = 512, c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, '#' + top.getHexString());
    g.addColorStop(0.5, '#' + hor.clone().lerp(top, 0.4).getHexString());
    g.addColorStop(1, '#' + hor.getHexString());
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    // yulduzlar — faqat yuqori (zenit) qismida, turli yorqinlikda
    if (sk.stars !== false) {
      for (let i = 0; i < 240; i++) {
        const sx = Math.random() * size, sy = Math.random() * size * 0.6;
        const big = Math.random() < 0.14;
        const r = big ? 0.9 + Math.random() * 1.3 : 0.3 + Math.random() * 0.7;
        x.globalAlpha = 0.3 + Math.random() * 0.65; x.fillStyle = '#fff';
        x.beginPath(); x.arc(sx, sy, r, 0, 7); x.fill();
      }
      x.globalAlpha = 1;
    }
    // yumshoq oy shu'lasi
    if (sk.moon !== false) {
      const mx = size * (sk.moonX != null ? sk.moonX : 0.72), my = size * (sk.moonY != null ? sk.moonY : 0.22), mr = size * 0.16;
      const mc = new THREE.Color(sk.moonColor != null ? sk.moonColor : ((t.moon && t.moon.color) || 0xbfd0ff));
      const rgb = (mc.r * 255 | 0) + ',' + (mc.g * 255 | 0) + ',' + (mc.b * 255 | 0);
      const mg = x.createRadialGradient(mx, my, 0, mx, my, mr);
      mg.addColorStop(0, 'rgba(' + rgb + ',0.95)'); mg.addColorStop(0.3, 'rgba(' + rgb + ',0.4)'); mg.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = mg; x.beginPath(); x.arc(mx, my, mr, 0, 7); x.fill();
      x.globalAlpha = 0.92; x.fillStyle = '#eef2ff'; x.beginPath(); x.arc(mx, my, mr * 0.3, 0, 7); x.fill(); x.globalAlpha = 1;
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.SphereGeometry(120, 24, 16);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
    this.sky = new THREE.Mesh(geo, mat); this.sky.renderOrder = -1;
    this.scene.add(this.sky);
  }

  // suzuvchi zarralar (fireflies / chang) — arzon Points buluti
  _makeMotes() {
    const N = 150, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() * 2 - 1) * 9; pos[i * 3 + 1] = 0.4 + Math.random() * 3.4; pos[i * 3 + 2] = (Math.random() * 2 - 1) * 9; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.4, 'rgba(255,200,120,0.6)'); g.addColorStop(1, 'rgba(255,180,80,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    const mat = new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat); pts.renderOrder = 2; return pts;
  }
  // uchar yulduz sprite'lari (billboard streak) — arzon, osmonda ko'rinadi
  _makeMeteors() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 128, 0);   // chapda yorqin bosh -> o'ngga so'ngan dum
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.72, 'rgba(210,225,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,1)');
    x.fillStyle = g; x.fillRect(0, 13, 128, 6);
    const hg = x.createRadialGradient(120, 16, 0, 120, 16, 12);   // yorqin bosh
    hg.addColorStop(0, 'rgba(255,255,255,1)'); hg.addColorStop(1, 'rgba(200,220,255,0)');
    x.fillStyle = hg; x.beginPath(); x.arc(120, 16, 12, 0, 7); x.fill();
    const tex = new THREE.CanvasTexture(c);
    const arr = [];
    for (let i = 0; i < 2; i++) {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false });
      const sp = new THREE.Sprite(mat); sp.scale.set(11, 1.4, 1); sp.visible = false; sp.renderOrder = 2;
      arr.push({ sp, active: false, t: 0, life: 1, vx: 0, vy: 0, vz: 0 });
    }
    return arr;
  }
  _updateMeteors(now, dt, lightK) {
    if (!this.meteors) return;
    if (now > this._nextMeteor) {
      this._nextMeteor = now + 5000 + Math.random() * 10000;
      const m = this.meteors.find(x => !x.active);
      if (m) {
        const side = Math.random() < 0.5 ? -1 : 1;
        m.sp.position.set(side * (18 + Math.random() * 22), 24 + Math.random() * 16, -28 - Math.random() * 34);
        m.vx = -side * (22 + Math.random() * 16); m.vy = -(9 + Math.random() * 8); m.vz = 5 + Math.random() * 8;
        m.sp.material.rotation = Math.atan2(m.vy, m.vx);   // chiziqni harakat yo'nalishiga burish
        m.life = 1.0 + Math.random() * 0.7; m.t = m.life; m.active = true; m.sp.visible = true;
      }
    }
    for (const m of this.meteors) {
      if (!m.active) continue;
      m.sp.position.x += m.vx * dt; m.sp.position.y += m.vy * dt; m.sp.position.z += m.vz * dt;
      m.t -= dt;
      const prog = 1 - Math.max(0, m.t) / m.life;   // 0->1: kirib-chiqib so'nadi
      m.sp.material.opacity = Math.sin(prog * Math.PI) * (0.55 + lightK * 0.35);
      if (m.t <= 0) { m.active = false; m.sp.visible = false; }
    }
  }
  updateMotes(now, lightK) {
    const dt = this._lastMoteNow ? Math.min(0.05, (now - this._lastMoteNow) / 1000) : 0.016;
    this._lastMoteNow = now;
    this._updateMeteors(now, dt, lightK);
    if (this.motes) {
      this.motes.rotation.y = now * 0.00004;
      this.motes.position.y = Math.sin(now * 0.0006) * 0.18;
      this.motes.material.opacity = 0.22 + (1 - lightK) * 0.55;   // zulmatda yorqinroq porlaydi
    }
    // sharlar yumshoq suzadi (bob + sway)
    if (this._balloons) {
      for (const b of this._balloons) {
        const p = b.userData;
        const bob = Math.sin(now * 0.0011 + p.ph) * 0.12;
        b.position.y = p.baseY + bob;
        b.rotation.z = Math.sin(now * 0.0009 + p.ph) * 0.12;
        if (p.cord) p.cord.position.y = b.position.y - 0.6;
      }
    }
  }

  _dispose(obj) {
    obj.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { const m = Array.isArray(o.material) ? o.material : [o.material]; m.forEach(x => x.dispose && x.dispose()); }
    });
  }
}
