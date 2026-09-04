# 🎨 Rang Urushi (Team vs Team) — Online

Ko'p o'yinchili real vaqt o'yini. Ikki jamoa — **Qizil** va **Ko'k**.
Maydonda yurgan katagingiz jamoangiz rangiga bo'yaladi. Vaqt (60s) tugagach,
**ko'proq katakni bo'yagan jamoa yutadi**.

Bu o'yin **multiplayer** — Oracle'dagi WebSocket serverga ulanadi
(`../../server/`). Jamoalar o'yin boshlanishida avtomatik bo'linadi.

## O'ynash
1. Server ishga tushgan bo'lsin.
2. `index.html` ni oching, server manzilini `?server=ws://localhost:8080` bilan
   bering yoki sahifadagi "o'zgartirish".
3. Ism → **Yangi xona ochish** yoki **KOD** bilan **Kirish**.
4. Kamida 2 o'yinchi → host **Boshlash**.
5. Boshqaruv: `← ↑ → ↓` yoki `W A S D` (mobil: ekran tugmalari).

## Fayllar
- `index.html`, `style.css` — UI
- `net.js` — WebSocket ulanish
- `game.js` — mijoz mantig'i + grid render

Server-side mantiq: `../../server/games/rang.js`.
