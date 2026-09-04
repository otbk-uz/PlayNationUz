/* ===================================================================
   All Games — UMUMIY canvas FX kutubxonasi (neon juice).
   Ulash:  <script src="../_shared/fx.js"></script>
   Foydalanish:
     FX.starfield(ctx, W, H, time)      // animatsion yulduzli fon
     FX.glowCircle(ctx, x, y, r, color, blur)
     FX.glowRect(ctx, x, y, w, h, color, radius, blur)
     FX.burst(x, y, color, count)        // zarracha portlashi
     FX.trail(x, y, color)               // yengil iz
     FX.update(dt)                       // zarrachalarni yangilash
     FX.render(ctx)                      // zarrachalarni chizish
     FX.shake(power)                     // ekran silkinishi
     FX.applyShake(ctx) / FX.restore(ctx)
   =================================================================== */
window.FX = (function () {
  const parts = [];
  let shakeAmt = 0;
  let stars = null;

  // ---- glow yordamchilari ----
  function glowCircle(ctx, x, y, r, color, blur = 16) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function glowRect(ctx, x, y, w, h, color, radius = 6, blur = 14) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
    else ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.restore();
  }
  function glowLine(ctx, x1, y1, x2, y2, color, width = 3, blur = 12) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  // ---- animatsion yulduzli fon ----
  function starfield(ctx, W, H, time = 0) {
    if (!stars || stars.W !== W || stars.H !== H) {
      // deterministik joylashuv (Math.random shart emas)
      const list = [];
      let seed = 1234;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const n = Math.floor((W * H) / 7000);
      for (let i = 0; i < n; i++) list.push({ x: rnd() * W, y: rnd() * H, r: 0.5 + rnd() * 1.6, p: rnd() * Math.PI * 2, s: 0.4 + rnd() * 0.9 });
      stars = { W, H, list };
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1020'); g.addColorStop(1, '#070b14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const st of stars.list) {
      const tw = 0.55 + 0.45 * Math.sin(time * 0.002 * st.s + st.p);
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#bcd3ff';
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- zarracha tizimi ----
  function burst(x, y, color = '#22d3ee', count = 14, speed = 3.2) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const v = speed * (0.5 + Math.random());
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, r: 1.5 + Math.random() * 2.5, color });
    }
  }
  function trail(x, y, color = '#22d3ee') {
    parts.push({ x, y, vx: 0, vy: 0, life: 0.5, r: 2 + Math.random() * 2, color, fade: 0.04 });
  }
  function update(dt) {
    const k = Math.min(dt / 16.67, 2) || 1;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * k; p.y += p.vy * k;
      p.vx *= 0.94; p.vy *= 0.94;
      p.life -= (p.fade || 0.03) * k;
      if (p.life <= 0) parts.splice(i, 1);
    }
    if (shakeAmt > 0) shakeAmt = Math.max(0, shakeAmt - 0.8 * k);
  }
  function render(ctx) {
    for (const p of parts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // ---- ekran silkinishi ----
  function shake(power = 6) { shakeAmt = Math.max(shakeAmt, power); }
  function applyShake(ctx) {
    if (shakeAmt > 0) {
      const dx = (Math.random() - 0.5) * shakeAmt;
      const dy = (Math.random() - 0.5) * shakeAmt;
      ctx.save(); ctx.translate(dx, dy);
      return true;
    }
    return false;
  }
  function restore(ctx) { ctx.restore(); }

  function reset() { parts.length = 0; shakeAmt = 0; }

  return { glowCircle, glowRect, glowLine, starfield, burst, trail, update, render, shake, applyShake, restore, reset };
})();
