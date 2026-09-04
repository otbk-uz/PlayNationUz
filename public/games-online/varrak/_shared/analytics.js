// UzIndieGame — boy analitika mijozi (avtomatik instrumentatsiya).
// Hodisalarni window.ANALYTICS_URL (config.js) manziliga /track ga yuboradi.
// Manzil bo'sh bo'lsa — jim (hech narsa yubormaydi). O'yin fayllarini o'zgartirmaydi:
// #startBtn, #levelPill/#hud-level va g'alaba panelini DOM orqali kuzatadi.
(function () {
  // ⚙️ ANALITIKA MANZILI — analytics worker'ni deploy qilgach shu manzil ishlaydi.
  //    Standart: stats.uzindiegame.uz (worker custom domain). Boshqa bo'lsa — o'zgartiring.
  //    Bo'sh qolsa — analitika o'chiriladi (hech narsa yuborilmaydi).
  var ANALYTICS_URL = 'https://stats.uzindiegame.uz';

  var BASE = '';
  try {
    var raw = window.ANALYTICS_URL || ANALYTICS_URL || '';
    BASE = String(raw).replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/+$/, '');
  } catch (e) {}
  if (!BASE) { window.Analytics = { track: function () {} }; return; }

  function uid() {
    try { return (crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2))); }
    catch (e) { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  }
  function stored(store, key) {
    try { var v = store.getItem(key); if (!v) { v = uid(); store.setItem(key, v); } return v; }
    catch (e) { return uid(); }
  }
  var VID = stored(localStorage, 'uzig_vid');
  var SID = stored(sessionStorage, 'uzig_sid');

  function slugFromPath() { var m = location.pathname.match(/games\/([^/]+)/); return m ? m[1] : null; }
  var GAME = slugFromPath();

  function track(event, props) {
    try {
      var body = JSON.stringify(Object.assign({
        event: String(event), vid: VID, sid: SID,
        path: location.pathname, ref: document.referrer || '', game: GAME || undefined
      }, props || {}));
      var url = BASE + '/track';
      if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
      else fetch(url, { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  window.Analytics = { track: track };

  // ── avtomatik: sessiya + sahifa ──
  var newSession = false;
  try { if (!sessionStorage.getItem('uzig_started')) { sessionStorage.setItem('uzig_started', '1'); newSession = true; } } catch (e) {}
  if (newSession) track('session_start');
  track('page_view');
  if (GAME) track('game_view', { game: GAME });

  // ── faol vaqt (heartbeat) ──
  var activeMs = 0, lastTick = Date.now();
  function tickActive() { var now = Date.now(); if (document.visibilityState === 'visible') activeMs += now - lastTick; lastTick = now; }
  setInterval(function () { tickActive(); track('heartbeat', { val: activeMs }); }, 15000);
  document.addEventListener('visibilitychange', function () { tickActive(); if (document.visibilityState === 'hidden') track('heartbeat', { val: activeMs }); });
  addEventListener('pagehide', function () { tickActive(); track('heartbeat', { val: activeMs }); });

  // ── o'yin instrumentatsiyasi (faqat o'yin sahifasida) ──
  if (GAME) {
    var started = false, lastLevel = 0, won = false;
    function markStart() { if (!started) { started = true; track('game_start', { game: GAME }); } }

    // start tugmasi (turli id/matnlar)
    function bindStart() {
      var byId = document.getElementById('startBtn') || document.getElementById('btn-start') || document.getElementById('overlay-btn');
      if (byId) byId.addEventListener('click', markStart, true);
      // matn bo'yicha zaxira: "Boshlash / ▶ / o'yna"
      document.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('button,.btn,[role=button]') : null;
        if (t && /boshla|start|▶|o['’]yna/i.test((t.textContent || '').trim())) markStart();
      }, true);
    }

    // bosqich pill'i (Bosqich N / Daraja N / N/M)
    function levelEl() {
      return document.getElementById('levelPill') || document.getElementById('hud-level') || document.getElementById('hud-lvl') || document.getElementById('levelLbl');
    }
    function readLevel(el) {
      if (!el) return 0; var m = (el.textContent || '').match(/\d+/); return m ? parseInt(m[0], 10) : 0;
    }
    function watchLevel() {
      var el = levelEl(); if (!el) return;
      var check = function () {
        var lv = readLevel(el);
        if (lv > 0 && lv !== lastLevel) {
          lastLevel = lv; markStart();
          track('level', { game: GAME, level: lv });
        }
      };
      check();
      try { new MutationObserver(check).observe(el, { childList: true, characterData: true, subtree: true }); } catch (e) {}
    }

    // g'alaba: panel/karta sarlavhasida 🎉
    function watchWin() {
      var check = function () {
        if (won) return;
        var panel = document.getElementById('panel') || document.querySelector('.panel, #overlay, #win');
        var txt = panel ? (panel.textContent || '') : '';
        if (/🎉/.test(txt) && (!panel.classList || !panel.classList.contains('hidden'))) {
          won = true; track('game_win', { game: GAME, level: lastLevel || undefined });
        }
      };
      try { new MutationObserver(check).observe(document.body, { childList: true, characterData: true, subtree: true }); } catch (e) {}
    }

    function init() { bindStart(); watchLevel(); watchWin(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})();
