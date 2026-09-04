// BLACKOUT — procedural PBR teksturalar (canvas). Muhitni realistik qiladi:
// har sirtga albedo (rang) + normal-map (sirt relyefi) beriladi. CDN/asset yo'q.
import * as THREE from '../vendor/three.module.js';

const cache = {};
function cv(s) { const c = document.createElement('canvas'); c.width = c.height = s; return c; }

// balandlik (grayscale) canvas -> normal-map (Sobel)
function normalFromHeight(hCanvas, strength) {
  const s = hCanvas.width;
  const src = hCanvas.getContext('2d').getImageData(0, 0, s, s).data;
  const out = cv(s), ox = out.getContext('2d'), img = ox.createImageData(s, s), d = img.data;
  const H = (x, y) => src[(((y + s) % s) * s + ((x + s) % s)) * 4] / 255;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (H(x - 1, y) - H(x + 1, y)) * strength;
    const dy = (H(x, y - 1) - H(x, y + 1)) * strength;
    const len = Math.hypot(dx, dy, 1), i = (y * s + x) * 4;
    d[i] = (dx / len * 0.5 + 0.5) * 255; d[i + 1] = (dy / len * 0.5 + 0.5) * 255; d[i + 2] = (1 / len * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ox.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(out);
}

// qiymatli shovqin (mottling) — yumshoq dog'lar
function mottle(ctx, s, cells, colors, alpha) {
  for (let i = 0; i < cells; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = s * (0.03 + Math.random() * 0.08);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colors[i % colors.length]); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function make(key, size, paint, normStrength) {
  if (cache[key]) return cache[key];
  const alb = cv(size), a = alb.getContext('2d'), h = cv(size), hh = h.getContext('2d');
  hh.fillStyle = '#808080'; hh.fillRect(0, 0, size, size);
  paint(a, hh, size);
  const map = new THREE.CanvasTexture(alb); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const normalMap = normalFromHeight(h, normStrength); normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  cache[key] = { map, normalMap }; return cache[key];
}

export const TEX = {
  wood(dark) {
    return make(dark ? 'woodD' : 'wood', 512, (a, h, s) => {
      const base = dark ? [60, 42, 28] : [120, 84, 50];
      a.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`; a.fillRect(0, 0, s, s);
      const planks = 6, ph = s / planks;
      for (let p = 0; p < planks; p++) {
        const sh = 0.82 + Math.random() * 0.3;
        a.fillStyle = `rgb(${base[0] * sh | 0},${base[1] * sh | 0},${base[2] * sh | 0})`;
        a.fillRect(0, p * ph, s, ph - 2);
        for (let g = 0; g < 46; g++) {   // yog'och tolalari
          a.strokeStyle = `rgba(40,26,14,${0.04 + Math.random() * 0.09})`; a.lineWidth = 1;
          const y = p * ph + Math.random() * ph; a.beginPath(); a.moveTo(0, y);
          a.bezierCurveTo(s / 3, y + (Math.random() * 6 - 3), 2 * s / 3, y + (Math.random() * 6 - 3), s, y + (Math.random() * 4 - 2)); a.stroke();
        }
        h.fillStyle = '#3a3a3a'; h.fillRect(0, p * ph + ph - 3, s, 3);   // taxta orasidagi ariq
        h.strokeStyle = 'rgba(90,90,90,0.5)'; for (let g = 0; g < 30; g++) { const y = p * ph + Math.random() * ph; h.beginPath(); h.moveTo(0, y); h.lineTo(s, y + Math.random() * 4 - 2); h.stroke(); }
      }
    }, 1.4);
  },
  plaster(rgb) {
    const key = 'plaster' + (rgb ? rgb.join('') : '');
    return make(key, 512, (a, h, s) => {
      const c = rgb || [58, 52, 66];
      a.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; a.fillRect(0, 0, s, s);
      mottle(a, s, 60, ['rgba(255,255,255,.5)', 'rgba(0,0,0,.5)'], 0.06);
      mottle(h, s, 90, ['rgba(255,255,255,.6)', 'rgba(0,0,0,.6)'], 0.08);
    }, 0.6);
  },
  fabric(rgb) {
    const key = 'fabric' + (rgb ? rgb.join('') : '');
    return make(key, 256, (a, h, s) => {
      const c = rgb || [109, 40, 58];
      a.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; a.fillRect(0, 0, s, s);
      const step = 6;
      for (let x = 0; x < s; x += step) { a.fillStyle = 'rgba(255,255,255,.05)'; a.fillRect(x, 0, step / 2, s); h.fillStyle = 'rgba(255,255,255,.5)'; h.fillRect(x, 0, step / 2, s); }
      for (let y = 0; y < s; y += step) { a.fillStyle = 'rgba(0,0,0,.06)'; a.fillRect(0, y, s, step / 2); h.fillStyle = 'rgba(0,0,0,.5)'; h.fillRect(0, y, s, step / 2); }
    }, 1.0);
  },
  marble() {
    return make('marble', 512, (a, h, s) => {
      a.fillStyle = '#3a3f52'; a.fillRect(0, 0, s, s);
      mottle(a, s, 26, ['rgba(200,210,230,.4)', 'rgba(20,24,40,.5)'], 0.07);
      for (let v = 0; v < 8; v++) {   // tomirlar (kamroq, nozikroq)
        a.strokeStyle = `rgba(${180 + Math.random() * 50 | 0},${190},${210},${0.1 + Math.random() * 0.12})`; a.lineWidth = 0.8 + Math.random() * 1.2;
        let x = Math.random() * s, y = Math.random() * s; a.beginPath(); a.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += (Math.random() * 2 - 1) * s * 0.25; y += (Math.random() * 2 - 1) * s * 0.25; a.lineTo(x, y); }
        a.stroke();
      }
    }, 0.5);
  },
  grass() {
    return make('grass', 512, (a, h, s) => {
      a.fillStyle = '#274a26'; a.fillRect(0, 0, s, s);
      for (let i = 0; i < 4000; i++) {   // o't tolalari
        const x = Math.random() * s, y = Math.random() * s, g = 40 + Math.random() * 90 | 0;
        a.fillStyle = `rgb(${20 + Math.random() * 30 | 0},${g},${20 + Math.random() * 25 | 0})`; a.fillRect(x, y, 1.5, 3 + Math.random() * 3);
        h.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`; h.fillRect(x, y, 2, 2);
      }
    }, 1.1);
  },
};

// mesh materialiga PBR tekstura beradi (tile takrorlanishi bilan)
export function applyPBR(mesh, tex, rx, ry, normScale) {
  const m = mesh.material;
  const mp = tex.map.clone(); mp.wrapS = mp.wrapT = THREE.RepeatWrapping; mp.repeat.set(rx, ry); mp.needsUpdate = true;
  const nm = tex.normalMap.clone(); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(rx, ry); nm.needsUpdate = true;
  m.map = mp; m.normalMap = nm; m.normalScale = new THREE.Vector2(normScale || 0.6, normScale || 0.6);
  m.color.setScalar(1); m.needsUpdate = true;
}
