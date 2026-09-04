// Har bir o'yin sahifasida shu o'yinning kategoriya teglarini ko'rsatadi.
// catalog.js dan keyin ulanadi. Slug'ni URL'dan topadi va header ostiga chip qo'yadi.
(function () {
  if (!window.UZIG) return;
  const m = location.pathname.match(/\/(?:games|)\/?([^/]+)\/?$/) || location.pathname.match(/([^/]+)\/?$/);
  // slug: .../games/<slug>/ yoki .../<slug>/
  const parts = location.pathname.split('/').filter(Boolean);
  let slug = parts[parts.length - 1];
  if (slug === 'index.html') slug = parts[parts.length - 2];
  const g = window.UZIG.bySlug(slug);
  if (!g) return;
  const CATS = window.UZIG.CATS;

  function build() {
    const host = document.querySelector('header') || document.body;
    const box = document.createElement('div');
    box.className = 'uzig-cats';
    box.style.cssText = 'display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin:12px 0 4px';
    const mode = document.createElement('span');
    mode.textContent = (g.mode === 'solo' ? '🕹️ Solo' : '🌐 Online');
    mode.style.cssText = chipCss(g.mode === 'solo' ? '#22d3ee' : '#f472b6');
    box.appendChild(mode);
    g.cats.forEach(c => {
      const s = document.createElement('span');
      s.textContent = `${CATS[c][0]} ${CATS[c][1]}`;
      s.style.cssText = chipCss('#8ea3c7');
      box.appendChild(s);
    });
    host.appendChild(box);
  }
  function chipCss(color) {
    return `font:700 12px system-ui,sans-serif;color:${color};padding:4px 11px;border-radius:999px;` +
      `background:rgba(120,160,255,0.08);border:1px solid rgba(120,160,255,0.22);white-space:nowrap`;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
