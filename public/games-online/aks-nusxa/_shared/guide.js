// UzIndieGame — o'yin ichidagi "Qanday o'ynash" qo'llanmasi (universal widget).
// Har bir o'yin sahifasiga bitta qator bilan ulanadi:
//   <script src="../_shared/guide.js"></script>   (catalog.js dan keyin)
// Ma'lumot manbai: catalog.js dagi UZIG.GUIDES (yagona manba).
(function () {
  if (window.__uzgGuideLoaded) return;
  window.__uzgGuideLoaded = true;

  function slugFromPath() {
    if (window.__UZG_SLUG) return window.__UZG_SLUG;
    var p = location.pathname;
    var m = p.match(/\/games\/([^\/]+)/);
    if (m) return m[1];
    if (/\/ember(\/|$)/.test(p)) return 'ember';
    return null;
  }

  function start() {
    var UZIG = window.UZIG;
    if (!UZIG || !UZIG.guide) return;               // katalog yuklanmagan bo'lsa — jim
    var slug = slugFromPath();
    if (!slug) return;
    var gd = UZIG.guide(slug);
    var g = UZIG.bySlug ? UZIG.bySlug(slug) : null;
    if (!gd) return;

    var name = (g && g.name) || 'O‘yin';
    var emoji = (g && g.emoji) || '🎮';

    // — uslublar (bir marta) —
    var css = document.createElement('style');
    css.textContent =
      '.uzg-btn{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;'
      +'font:600 13px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f7efe4;cursor:pointer;'
      +'padding:9px 13px;border-radius:999px;background:rgba(20,14,9,.72);border:1px solid rgba(255,190,130,.32);'
      +'box-shadow:0 6px 20px rgba(0,0,0,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);'
      +'user-select:none;-webkit-user-select:none;opacity:.9;transition:opacity .15s,transform .15s,background .15s;}'
      +'.uzg-btn:hover{opacity:1;transform:translateY(-1px);background:rgba(30,20,12,.85);}'
      +'.uzg-modal{position:fixed;inset:0;z-index:2147483001;display:none;align-items:center;justify-content:center;padding:18px;'
      +'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}'
      +'.uzg-modal.on{display:flex;}'
      +'.uzg-bd{position:absolute;inset:0;background:rgba(5,4,2,.74);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}'
      +'.uzg-card{position:relative;z-index:1;width:min(460px,100%);max-height:86vh;overflow-y:auto;color:#f7efe4;'
      +'background:linear-gradient(180deg,#211a13,#171009);border:1px solid rgba(255,190,130,.34);border-radius:22px;'
      +'padding:24px 22px 22px;box-shadow:0 24px 70px rgba(0,0,0,.6);animation:uzgpop .26s cubic-bezier(.22,.61,.36,1);}'
      +'@keyframes uzgpop{from{opacity:0;transform:translateY(22px) scale(.96);}}'
      +'.uzg-x{position:absolute;top:13px;right:13px;width:34px;height:34px;border-radius:10px;cursor:pointer;'
      +'background:rgba(255,255,255,.06);border:1px solid rgba(255,190,130,.2);color:#b6a894;font-size:14px;'
      +'display:grid;place-items:center;}'
      +'.uzg-head{display:flex;align-items:center;gap:13px;margin-bottom:18px;padding-right:30px;}'
      +'.uzg-emoji{font-size:38px;filter:drop-shadow(0 4px 14px rgba(251,191,36,.4));}'
      +'.uzg-kick{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#fbbf24;}'
      +'.uzg-name{font-size:22px;font-weight:800;letter-spacing:-.4px;margin-top:3px;}'
      +'.uzg-rows{display:flex;flex-direction:column;gap:12px;margin-bottom:20px;}'
      +'.uzg-row{display:flex;gap:12px;align-items:flex-start;padding:13px;border-radius:14px;'
      +'background:rgba(255,255,255,.03);border:1px solid rgba(255,190,130,.16);}'
      +'.uzg-ic{font-size:19px;flex-shrink:0;margin-top:1px;}'
      +'.uzg-row b{display:block;font-size:12.5px;font-weight:700;color:#eadfce;margin-bottom:3px;}'
      +'.uzg-row p{margin:0;color:#b6a894;font-size:13.5px;line-height:1.55;}'
      +'.uzg-play{display:block;width:100%;text-align:center;text-decoration:none;font-weight:700;font-size:14.5px;'
      +'color:#1b1206;background:linear-gradient(135deg,#fbbf24,#fb923c);padding:12px;border-radius:13px;}';
    document.head.appendChild(css);

    // — tugma —
    var btn = document.createElement('button');
    btn.className = 'uzg-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Qanday o‘ynash');
    btn.innerHTML = '📖 Qoida';

    // — modal —
    function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    var modal = document.createElement('div');
    modal.className = 'uzg-modal';
    modal.innerHTML =
      '<div class="uzg-bd" data-uzg-close></div>'
      +'<div class="uzg-card" role="dialog" aria-modal="true">'
      +'<button class="uzg-x" data-uzg-close aria-label="Yopish">✕</button>'
      +'<div class="uzg-head"><span class="uzg-emoji">'+esc(emoji)+'</span>'
      +'<div><div class="uzg-kick">Qanday o‘ynash</div><div class="uzg-name">'+esc(name)+'</div></div></div>'
      +'<div class="uzg-rows">'
      +'<div class="uzg-row"><span class="uzg-ic">🎯</span><div><b>Maqsad</b><p>'+esc(gd.goal)+'</p></div></div>'
      +'<div class="uzg-row"><span class="uzg-ic">🎮</span><div><b>Boshqaruv</b><p>'+esc(gd.controls)+'</p></div></div>'
      +'<div class="uzg-row"><span class="uzg-ic">💡</span><div><b>Maslahat</b><p>'+esc(gd.tip)+'</p></div></div>'
      +'</div>'
      +'<a class="uzg-play" href="../../" data-uzg-close>▶ Boshlash</a>'
      +'</div>';

    function open(e){ if (e){ e.preventDefault(); e.stopPropagation(); } modal.classList.add('on');
      if (window.Analytics) try{Analytics.track('guide_open',{game:slug,from:'in-game'});}catch(err){} }
    function close(){ modal.classList.remove('on'); }
    // click + pointerup/touchend — ba'zi o'yinlar document darajasida pointer hodisalarini ushlaydi
    btn.addEventListener('click', open);
    btn.addEventListener('pointerup', open);
    btn.addEventListener('touchend', open);
    modal.addEventListener('click', function(e){ if (e.target.closest('[data-uzg-close]')) close(); });
    modal.addEventListener('pointerup', function(e){ if (e.target.closest('[data-uzg-close]')) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

    // "Boshlash" tugmasi shunchaki oynani yopadi (o'yin sahifasida qolamiz)
    var playLink = modal.querySelector('.uzg-play');
    playLink.setAttribute('href', 'javascript:void 0');

    function mount(){ document.body.appendChild(btn); document.body.appendChild(modal); }
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
