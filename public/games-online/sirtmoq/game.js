// Sirtmoq — orbital sling. Yulduz ustunga bog'langan holda aylanadi; to'g'ri
// paytda QO'YIB YUBOR — tangens bo'ylab uchib keyingi ustunga ilinadi. Zanjirlab
// oxirgi (bayroqli) ustunga yet. Pseudo-3D: perspektiv yer, aylanish ellips soyasi.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');

  // bosqich parametrlari
  const LEVELS = [
    { n: 4, omega: 1.5, cap: 0.36, orbR: 0.34, dz: 1.15, xamp: 0.35, name: 'Mashq' },
    { n: 5, omega: 1.9, cap: 0.31, orbR: 0.34, dz: 1.18, xamp: 0.55, name: 'Ko\'cha' },
    { n: 5, omega: 2.3, cap: 0.28, orbR: 0.32, dz: 1.20, xamp: 0.70, name: 'Bog\'' },
    { n: 6, omega: 2.7, cap: 0.25, orbR: 0.31, dz: 1.22, xamp: 0.85, name: 'Tuman' },
    { n: 6, omega: 3.2, cap: 0.23, orbR: 0.30, dz: 1.25, xamp: 0.98, name: 'Usta' },
  ];
  const FLY = 2.7;            // uchish tezligi (maydon birligi/sek)
  const LIVES0 = 3;

  let W = 0, H = 0, levelIdx = 0, state = 'menu';
  let posts = [], cur = 0, ang = 0, dir = 1, omega = 0, orbR = 0, cap = 0;
  let phase = 'orbit';        // 'orbit' | 'fly'
  let orb = { x: 0, z: 0 }, vel = { x: 0, z: 0 };
  let lives = 0, flashT = 0, flashCol = '', msg = '', msgT = 0, tm = 0, trail = [];

  // ── projeksiya ──
  const HY = () => H * 0.26;
  function depth(z) { return 1 / (1 + z * 0.42); }
  function proj(x, z) {
    const d = depth(z), hy = HY();
    return { x: W / 2 + x * (W * 0.42) * d, y: hy + (H * 0.965 - hy) * d, s: d };
  }

  function genPosts(L) {
    const arr = [];
    for (let i = 0; i < L.n; i++) {
      const z = 0.25 + i * L.dz;
      const x = i === 0 ? 0 : L.xamp * Math.sin(i * 1.7);
      arr.push({ x, z, goal: i === L.n - 1 });
    }
    return arr;
  }

  function load(idx) {
    levelIdx = idx; const L = LEVELS[idx];
    posts = genPosts(L); cur = 0; omega = L.omega; orbR = L.orbR; cap = L.cap;
    dir = 1; ang = -Math.PI / 2; phase = 'orbit'; lives = LIVES0;
    flashT = 0; msg = ''; msgT = 0; trail = [];
    setOrbFromAngle();
    state = 'play';
    document.getElementById('levelPill').textContent = 'Bosqich ' + (idx + 1) + ' · ' + L.name;
    updateHud();
  }
  function reset() { load(levelIdx); }
  function updateHud() {
    document.getElementById('progPill').textContent = '🔗 ' + cur + '/' + (posts.length - 1);
    document.getElementById('statePill').textContent = '❤ ' + lives;
  }

  function setOrbFromAngle() {
    const p = posts[cur];
    orb.x = p.x + orbR * Math.cos(ang);
    orb.z = p.z + orbR * Math.sin(ang);
  }
  // tangens yo'nalishi (aylanish bo'yicha tezlik yo'nalishi)
  function tangent() {
    return { x: -Math.sin(ang) * dir, z: Math.cos(ang) * dir };
  }
  function nextPost() { return posts[cur + 1] || null; }

  // release paytida ushbu tangens keyingi ustunga qanchalik to'g'ri qaragani (radian xato)
  function aimError() {
    const np = nextPost(); if (!np) return Math.PI;
    const t = tangent();
    const dx = np.x - orb.x, dz = np.z - orb.z;
    const at = Math.atan2(t.z, t.x), ad = Math.atan2(dz, dx);
    let e = at - ad; while (e > Math.PI) e -= 2 * Math.PI; while (e < -Math.PI) e += 2 * Math.PI;
    return e;
  }

  function release() {
    if (state !== 'play' || phase !== 'orbit') return;
    const np = nextPost(); if (!np) return;
    const t = tangent();
    vel.x = t.x * FLY; vel.z = t.z * FLY;
    phase = 'fly'; trail = [];
    if (window.SFX) SFX.tone(300, 0.09, { type: 'sawtooth', vol: 0.13, to: 520 });
  }

  function capture(np, idx) {
    cur = idx;
    // yangi orbitaga kirish burchagi (ustundan yulduzga)
    ang = Math.atan2(orb.z - np.z, orb.x - np.x);
    dir = -dir; // yo'nalishni almashtir — zanjir tabiiy egri chiqadi
    phase = 'orbit'; setOrbFromAngle();
    flashT = 0.3; flashCol = '141,255,180';
    if (window.SFX) SFX.tone(520, 0.08, { type: 'triangle', vol: 0.12, to: 720 });
    if (window.FX) { const pj = proj(np.x, np.z); FX.burst(pj.x, pj.y, '#8dffb0', 16); }
    if (np.goal) return win();
    updateHud();
  }

  function miss() {
    lives--; flashT = 0.4; flashCol = '255,90,90';
    if (window.SFX) SFX.hit(); if (window.FX) FX.shake(8);
    if (lives <= 0) { showMsg('Uzilib ketding!'); if (window.SFX) SFX.death();
      state = 'lost'; setTimeout(() => { if (state === 'lost') load(levelIdx); }, 1200); return; }
    showMsg('Yana urin!');
    // joriy ustunga qaytish
    ang = -Math.PI / 2; phase = 'orbit'; setOrbFromAngle(); updateHud();
  }

  function win() {
    state = 'won'; flashT = 0.5; flashCol = '141,255,180'; if (window.SFX) SFX.win();
    if (levelIdx + 1 < LEVELS.length) { showMsg('Bosqich o\'tdi! 🔗'); setTimeout(() => load(levelIdx + 1), 1200); }
    else setTimeout(() => showPanel('🎉 Sirtmoq ustasi!', 'Barcha bosqichda yulduzni ustundan ustunga uzmasdan olib o\'tding — sirtmoq ustasi!', '↻ Qaytadan'), 1200);
  }
  function showMsg(t) { msg = t; msgT = 1.1; }

  function update(dt) {
    tm += dt; if (flashT > 0) flashT -= dt; if (msgT > 0) { msgT -= dt; if (msgT <= 0) msg = ''; }
    if (state !== 'play') return;
    if (phase === 'orbit') {
      ang += omega * dir * dt; setOrbFromAngle();
    } else if (phase === 'fly') {
      orb.x += vel.x * dt; orb.z += vel.z * dt;
      trail.push({ x: orb.x, z: orb.z }); if (trail.length > 14) trail.shift();
      const np = nextPost();
      if (np) {
        const dx = orb.x - np.x, dz = orb.z - np.z;
        if (Math.hypot(dx, dz) < cap) return capture(np, cur + 1);
        // o'tib ketdi yoki chetga chiqdi -> miss
        if (orb.z > np.z + 0.55 || Math.abs(orb.x) > 2.2 || orb.z < -0.5) return miss();
      } else return miss();
    }
  }

  // ── render ──
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render() {
    // osmon + yer
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1230'); sky.addColorStop(0.5, '#14224e'); sky.addColorStop(0.52, '#1b3a2e');
    sky.addColorStop(1, '#0e241c'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    if (state === 'menu') { drawStars(); return; }
    drawStars();
    drawGround();
    drawPosts();
    if (phase === 'orbit' && state === 'play') drawTether();
    drawTrail();
    drawOrb();
    if (window.FX) FX.render(ctx);
    if (phase === 'orbit' && state === 'play') drawPreview();
    if (msg) { ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '800 ' + Math.round(Math.min(30, W / 16)) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H * 0.2); }
    if (flashT > 0) { ctx.fillStyle = 'rgba(' + flashCol + ',' + Math.min(.28, flashT) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  let starCache = null;
  function drawStars() {
    if (!starCache) { starCache = []; for (let i = 0; i < 40; i++) starCache.push({ x: Math.random(), y: Math.random() * 0.24, r: Math.random() * 1.4 + 0.4 }); }
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (const s of starCache) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(tm * 0.8 + s.x * 10)); ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  function drawGround() {
    const hy = HY();
    // perspektiv panjara
    ctx.strokeStyle = 'rgba(120,200,160,.12)'; ctx.lineWidth = 1;
    for (let gx = -3; gx <= 3; gx++) {
      const a = proj(gx, 0.0), b = proj(gx, 7.5);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (let z = 0; z <= 8; z++) {
      const a = proj(-3, z), b = proj(3, z);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, hy - 2, W, 3);
  }

  function drawPosts() {
    // orqadan oldinga (painter)
    for (let i = posts.length - 1; i >= 0; i--) {
      const p = posts[i], pj = proj(p.x, p.z), s = pj.s;
      const active = i === cur, done = i < cur;
      // soya
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(pj.x, pj.y, 26 * s, 9 * s, 0, 0, 7); ctx.fill();
      // ustun (pillar)
      const h = 60 * s;
      const g = ctx.createLinearGradient(pj.x - 8 * s, pj.y - h, pj.x + 8 * s, pj.y);
      g.addColorStop(0, done ? '#3a5a48' : '#c9a05a'); g.addColorStop(1, done ? '#22382c' : '#7a5a30');
      ctx.fillStyle = g; rr(pj.x - 7 * s, pj.y - h, 14 * s, h, 4 * s); ctx.fill();
      // cap radius halqa (faqat keyingi nishon ustun)
      if (i === cur + 1) {
        ctx.strokeStyle = 'rgba(141,255,180,.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(pj.x, pj.y - h, cap * (W * 0.42) * s, cap * (W * 0.42) * s * 0.42, 0, 0, 7); ctx.stroke();
      }
      // tepa (goal = bayroq, aks holda tugma)
      if (p.goal) {
        ctx.fillStyle = '#ff5a72'; ctx.beginPath(); ctx.moveTo(pj.x, pj.y - h - 22 * s); ctx.lineTo(pj.x + 20 * s, pj.y - h - 14 * s); ctx.lineTo(pj.x, pj.y - h - 6 * s); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#eaf2ff'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(pj.x, pj.y - h - 24 * s); ctx.lineTo(pj.x, pj.y - h); ctx.stroke();
      } else {
        ctx.fillStyle = active ? '#ffd24a' : (done ? '#5aa06e' : '#e0b878');
        ctx.beginPath(); ctx.arc(pj.x, pj.y - h, 7 * s, 0, 7); ctx.fill();
      }
    }
  }

  function drawTether() {
    const p = posts[cur], pj = proj(p.x, p.z), oj = proj(orb.x, orb.z), s = pj.s;
    const topY = pj.y - 60 * s;
    ctx.strokeStyle = 'rgba(180,220,255,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pj.x, topY); ctx.lineTo(oj.x, oj.y); ctx.stroke();
    // orbita ellipsi (yerdagi doira)
    ctx.strokeStyle = 'rgba(120,200,255,.18)'; ctx.setLineDash([4, 5]);
    ctx.beginPath();
    for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2; const q = proj(p.x + orbR * Math.cos(a), p.z + orbR * Math.sin(a)); if (k === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }
    ctx.stroke(); ctx.setLineDash([]);
  }

  function drawPreview() {
    // release qilinsa yulduz qayerga uchishini ko'rsat
    const t = tangent(); let x = orb.x, z = orb.z; const np = nextPost();
    let ok = false;
    ctx.save();
    for (let k = 0; k < 40; k++) {
      x += t.x * 0.1; z += t.z * 0.1;
      if (np) { if (Math.hypot(x - np.x, z - np.z) < cap) { ok = true; break; } if (z > np.z + 0.55 || Math.abs(x) > 2.2) break; }
      if (k % 2 === 0) { const q = proj(x, z); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(q.x, q.y, 2 * q.s, 0, 7); ctx.fill(); }
    }
    ctx.restore();
    // aim indikatori halqasi orb atrofida
    const oj = proj(orb.x, orb.z);
    ctx.strokeStyle = ok ? 'rgba(141,255,180,.9)' : 'rgba(255,210,74,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(oj.x, oj.y - 10 * oj.s, 12 * oj.s, 0, 7); ctx.stroke();
  }

  function drawTrail() {
    for (let i = 0; i < trail.length; i++) {
      const q = proj(trail[i].x, trail[i].z), a = i / trail.length;
      ctx.fillStyle = 'rgba(120,220,255,' + (a * 0.5) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y - 10 * q.s, 5 * q.s * a, 0, 7); ctx.fill();
    }
  }

  function drawOrb() {
    const oj = proj(orb.x, orb.z), s = oj.s, oy = oj.y - 10 * s;
    // soya
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(oj.x, oj.y, 8 * s, 3 * s, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(oj.x - 3 * s, oy - 3 * s, 1, oj.x, oy, 11 * s);
    g.addColorStop(0, '#eaffff'); g.addColorStop(0.5, '#38d0ff'); g.addColorStop(1, '#1a6ad0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(oj.x, oy, 9 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(180,240,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(oj.x, oy, 9 * s, 0, 7); ctx.stroke();
  }

  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')'; }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  let last = 0;
  function frame(t) { const dt = Math.min(0.033, (t - last) / 1000 || 0); last = t; update(dt); render(); if (window.FX) FX.update(16); requestAnimationFrame(frame); }

  const panel = document.getElementById('panel');
  function showPanel(title, sub, btn) {
    if (title) panel.querySelector('h1').textContent = title; if (sub) document.getElementById('cardSub').innerHTML = sub;
    if (btn) document.getElementById('startBtn').textContent = btn; panel.classList.remove('hidden');
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    if (window.SFX) { SFX.resume(); SFX.click(); SFX.music('sirtmoq'); }
    panel.classList.add('hidden'); load(state === 'won' || state === 'menu' ? 0 : levelIdx);
  });
  document.getElementById('resetBtn').addEventListener('click', reset);
  const doAct = e => { if (e) e.preventDefault(); release(); };
  cv.addEventListener('mousedown', doAct); cv.addEventListener('touchstart', doAct, { passive: false });
  const actBtn = document.getElementById('actBtn'); if (actBtn) { actBtn.addEventListener('mousedown', doAct); actBtn.addEventListener('touchstart', doAct, { passive: false }); }
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') doAct(e); else if (e.code === 'KeyR') reset(); });

  window.SL_TEST = {
    info: () => ({ level: levelIdx + 1, cur, total: posts.length - 1, lives, phase, ang: +ang.toFixed(3), aimError: +aimError().toFixed(3) }),
    state: () => state, release: () => release()
  };

  fit(); load(0); state = 'menu'; addEventListener('resize', fit); requestAnimationFrame(frame);
})();
