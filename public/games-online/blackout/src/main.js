// BLACKOUT — kirish nuqtasi. O'yinni yaratadi va ishga tushiradi.
import { Game } from './game.js';
import { Online } from './online.js';

const game = new Game(document.getElementById('app'));
game.boot();

// ——— onlayn rejim ulash ———
const $ = id => document.getElementById(id);
let online = null;
function ensureOnline() { if (!online) online = new Online(game); return online; }

// mobil: birinchi tegishda landscape'ga qulflashga urinamiz (best-effort, ba'zi brauzerlar qo'llamaydi)
function tryLockLandscape() {
  if (!game.world.MOBILE) return;
  try {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  } catch (e) { /* qo'llab-quvvatlanmasa — CSS overlay yon burishni so'raydi */ }
}
addEventListener('pointerdown', tryLockLandscape, { once: true });

const onlineBtn = $('onlineBtn');
if (onlineBtn) onlineBtn.addEventListener('click', () => {
  $('startPanel').classList.add('hidden');
  $('lobby').classList.remove('hidden');
  $('lobby-setup').style.display = 'block';
  $('lobby-room').style.display = 'none';
  ensureOnline();
  if ($('lobby-nick')) $('lobby-nick').value = localStorage.getItem('blackout-nick') || '';
});

const nickOf = () => (($('lobby-nick') && $('lobby-nick').value.trim()) || "O'yinchi").slice(0, 16);
if ($('lobby-create')) $('lobby-create').addEventListener('click', () => {
  const nick = nickOf(); localStorage.setItem('blackout-nick', nick);
  ensureOnline().connect(nick, null);
});
if ($('lobby-join')) $('lobby-join').addEventListener('click', () => {
  const nick = nickOf(); localStorage.setItem('blackout-nick', nick);
  const code = ($('lobby-join-code').value || '').trim().toUpperCase();
  if (code.length < 4) { $('lobby-msg').textContent = '4 harfli kodni kiriting'; return; }
  ensureOnline().connect(nick, code);
});
if ($('lobby-start')) $('lobby-start').addEventListener('click', () => { if (window.Net) window.Net.send({ t: 'start' }); });
if ($('lobby-back')) $('lobby-back').addEventListener('click', () => {
  $('lobby').classList.add('hidden'); $('startPanel').classList.remove('hidden');
});

// tashqi tekshiruv (Playwright) uchun
window.__BLACKOUT = {
  g: game,
  get online() { return online; },
  get phase() { return game.phase; },
  get players() { return game.actors; },
  get player() { return game.player; },
  startRound: () => game.startRound(),
  debug() {
    const r = game.world.renderer;
    return {
      tri: r.info.render.triangles, calls: r.info.render.calls,
      lightK: +game.lightK.toFixed(2), kids: game.scene.children.length,
      cam: game.world.camera.position.toArray().map(v => +v.toFixed(1)),
      pp: game.player.pos.toArray().map(v => +v.toFixed(1)),
      held: game.player.heldUlt ? game.player.heldUlt.id : null,
      active: game.player.activeUlt ? game.player.activeUlt.def.id : null,
      weapon: !!game.player.weapon, ults: game.ultDrops.length,
    };
  },
};
