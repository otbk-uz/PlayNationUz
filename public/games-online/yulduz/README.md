# ⭐ Yulduz (FFA) — Online

Ko'p o'yinchili real vaqt poygasi. Maydonda yulduzlar paydo bo'ladi —
tez yetib borib yig'asan. Vaqt (60s) tugagach, **eng ko'p yulduz yiqqan
o'yinchi yutadi**. Har kim o'ziga qarshi (free-for-all), 2–8 o'yinchi.

Bu o'yin **multiplayer** — Oracle'dagi WebSocket serverga ulanadi
(`../../server/`).

## O'ynash
1. Server ishga tushgan bo'lsin.
2. `index.html` ni oching, server manzilini `?server=ws://localhost:8080`
   bilan bering yoki "o'zgartirish".
3. Ism → **Yangi xona ochish** yoki **KOD** bilan **Kirish**.
4. Kamida 2 o'yinchi → host **Boshlash**.
5. Boshqaruv: `← ↑ → ↓` yoki `W A S D` (mobil: ekran tugmalari).

Server-side mantiq: `../../server/games/yulduz.js`.
