// Multiplayer WebSocket mijoz — AVTO-QAYTA ULANISH bilan (barqarorlik uchun).
// Server manzili: ?server=wss://... , yoki localStorage, yoki _shared/config.js.
window.Net = (function () {
  const params = new URLSearchParams(location.search);
  const DEFAULT_SERVER = (typeof window !== 'undefined' && window.ALLGAMES_SERVER) || 'ws://localhost:8080';
  const SERVER_URL = params.get('server') || localStorage.getItem('allgames-server') || DEFAULT_SERVER;

  let ws = null;
  const handlers = {};
  let lastJoin = null;     // qayta ulanganda o'sha xonaga qayta kirish uchun
  let manualClose = false;
  let retry = 0;
  let reconnectTimer = null;

  function on(type, fn) { handlers[type] = fn; }
  function emit(type, msg) { if (handlers[type]) handlers[type](msg); }

  function open() {
    return new Promise((resolve, reject) => {
      let settled = false;
      try { ws = new WebSocket(SERVER_URL); }
      catch (e) { reject(e); return; }

      ws.onopen = () => {
        retry = 0;
        emit('open');
        if (lastJoin) { try { ws.send(JSON.stringify(lastJoin)); } catch { /* ignore */ } }
        if (!settled) { settled = true; resolve(); }
      };
      ws.onclose = () => {
        emit('close');
        if (!manualClose) scheduleReconnect();
      };
      ws.onerror = (e) => {
        emit('neterror', e);
        if (!settled) { settled = true; reject(e); }
      };
      ws.onmessage = (ev) => {
        let m;
        try { m = JSON.parse(ev.data); } catch { return; }
        // 'joined' kelганda — kelajakdagi qayta ulanish shu xonaga bo'lsin
        if (m.t === 'joined' && lastJoin) {
          lastJoin = { t: 'join', room: m.room, nick: lastJoin.nick, game: lastJoin.game };
        }
        emit(m.t, m);
      };
    });
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    retry++;
    const delay = Math.min(1200 * Math.pow(1.6, retry - 1), 8000);
    emit('reconnecting', { attempt: retry, delay });
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      open().then(() => emit('reconnected')).catch(() => { /* onclose qayta rejalashtiradi */ });
    }, delay);
  }

  function connect() { manualClose = false; return open(); }

  function send(obj) {
    if (obj && obj.t === 'join') lastJoin = obj;   // eslab qolamiz
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }

  function isOpen() { return ws && ws.readyState === 1; }
  function serverUrl() { return SERVER_URL; }
  function setServer(url) { localStorage.setItem('allgames-server', url); location.reload(); }

  return { connect, send, on, serverUrl, setServer, isOpen };
})();
