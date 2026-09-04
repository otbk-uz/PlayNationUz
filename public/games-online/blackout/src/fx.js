// BLACKOUT — effektlar: ovoz (WebAudio bliplar), zarrachalar (uchqun), ekran effektlari.
import * as THREE from '../vendor/three.module.js';

export class FX {
  constructor() {
    this.actx = null;
    this.pool = [];          // qayta ishlatiladigan uchqun sferalar
    this.shake = 0;
    this.muted = false; this._drone = null;
    this._flash = document.getElementById('flash');
    this._vignette = document.getElementById('vignette');
  }

  // ——— ambient drone (tovushli keskinlik) ———
  startDrone() {
    try {
      this.actx = this.actx || new (window.AudioContext || window.webkitAudioContext)();
      if (this._drone) return;
      const o = this.actx.createOscillator(), g = this.actx.createGain(), f = this.actx.createBiquadFilter();
      o.type = 'sine'; o.frequency.value = 48; f.type = 'lowpass'; f.frequency.value = 220;
      g.gain.value = this.muted ? 0 : 0.05;
      o.connect(f); f.connect(g); g.connect(this.actx.destination); o.start();
      this._drone = { o, g };
    } catch (e) { /* jim */ }
  }
  droneIntensity(sd) { if (this._drone) { this._drone.o.frequency.value = sd ? 62 : 48; this._drone.g.gain.value = this.muted ? 0 : (sd ? 0.09 : 0.05); } }
  stopDrone() { if (this._drone) { try { this._drone.o.stop(); } catch (e) {} this._drone = null; } }
  setMuted(m) { this.muted = m; if (this._drone) this._drone.g.gain.value = m ? 0 : 0.05; }

  sound(kind) {
    if (this.muted) return;
    try {
      this.actx = this.actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = this.actx.createOscillator(), g = this.actx.createGain();
      o.connect(g); g.connect(this.actx.destination);
      const t = this.actx.currentTime;
      const map = { light: [880, 0.06], warn: [440, 0.05], hit: [120, 0.12], pick: [660, 0.08], caught: [200, 0.2], win: [520, 0.3], lose: [140, 0.35] };
      // kulgili "boing" / emote — balandligi o'zgaruvchan (springy, yoqimtoy)
      const bend = { boing: [300, 620, 0.18], bump: [420, 260, 0.12], emote: [520, 900, 0.22] };
      if (bend[kind]) {
        const [f0, f1, d] = bend[kind];
        o.type = 'triangle'; o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + d * 0.7);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.start(t); o.stop(t + d + 0.02); return;
      }
      const [f, d] = map[kind] || [440, 0.05];
      o.frequency.value = f; o.type = kind === 'hit' ? 'sawtooth' : 'sine';
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) { /* ovoz bloklangan bo'lsa jim */ }
  }

  sparks(scene, at, color = 0xffd27a, n = 10) {
    for (let i = 0; i < n; i++) {
      let s = this.pool.find(x => !x.visible);
      if (!s) { s = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color })); scene.add(s); this.pool.push(s); }
      s.visible = true; s.material.color.setHex(color);
      s.position.copy(at); s.position.y += 1;
      s.userData.v = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4);
      s.userData.life = 0.5;
    }
  }

  update(dt) {
    for (const s of this.pool) {
      if (!s.visible) continue;
      s.userData.life -= dt;
      if (s.userData.life <= 0) { s.visible = false; continue; }
      s.userData.v.y -= 9 * dt;
      s.position.addScaledVector(s.userData.v, dt);
    }
    if (this.shake > 0) this.shake -= dt * 2;
  }

  flash() {
    if (!this._flash) return;
    this._flash.style.transition = 'none'; this._flash.style.opacity = '0.6';
    requestAnimationFrame(() => { this._flash.style.transition = 'opacity .5s'; this._flash.style.opacity = '0'; });
  }
  vignette() {
    if (!this._vignette) return;
    this._vignette.classList.add('show');
    setTimeout(() => this._vignette.classList.remove('show'), 260);
  }
  kick(amount) { this.shake = Math.max(this.shake, amount); }

  // ——— porlash (bloom-lite): additive radial-gradient sprite ———
  _glowTex() {
    if (this._gtex) return this._gtex;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    this._gtex = new THREE.CanvasTexture(c);
    return this._gtex;
  }
  glow(color, size = 2) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this._glowTex(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    s.scale.set(size, size, size);
    return s;
  }
}
