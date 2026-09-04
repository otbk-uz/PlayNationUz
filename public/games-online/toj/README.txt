Toj — UzIndieGame
========================================

Bu papka BITTA o'yinning to'liq (self-contained) nusxasi.
Barcha kerakli fayllar ichida — boshqa hech narsaga bog'liq emas.

QANDAY JOYLASH:
  1) Ushbu 'toj' papkasini saytingizga yuklang
     (masalan: https://saytingiz.uz/toj/).
  2) index.html — o'yinning bosh sahifasi.
  3) Istalgan statik hosting (Netlify, Vercel, GitHub Pages,
     Cloudflare Pages, oddiy Apache/Nginx) yetarli — server kodi shart emas.

TARKIB:
  index.html      - o'yin sahifasi
  game.js         - o'yin mantig'i
  style.css       - uslub
  _shared/        - umumiy skriptlar (audio, effekt, qo'llanma)
  assets/         - ikonka va analitika beacon
  covers/         - muqova va skrinshotlar (ro'yxat uchun, ixtiyoriy)

DIQQAT — BU ONLAYN (MULTIPLAYER) O'YIN:
  net.js + _shared/config.js orqali o'yin serveriga ulanadi.
  Statik holda sahifa ochiladi, lekin onlayn rejim ishlashi uchun
  o'yin serveri (websocket) kerak. config.js dagi server manzilini
  o'z serveringizga moslang.

(c) UzIndieGame — uzindiegame.uz