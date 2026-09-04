# 🐺 Kim Bo'ri? (Mafiya + Vazifalar) — Online

Ko'p o'yinchili social deduction o'yini. Rollar tasodifiy: **1-2 Bo'ri**,
qolganlar **Qishloqchi**.

**Fazalar (takrorlanadi):**
1. 🔧 **Vazifa** — Qishloqchilar tugmani bosib umumiy progressni to'ldiradi.
   Bo'rilar esa yashirincha **sabotaj** qiladi (progressni kamaytiradi).
2. 🗳️ **Ovoz** — hamma bittasini chetlatishga ovoz beradi. Eng ko'p ovoz
   olgan chetlatiladi, roli ochiladi.

**G'olib:**
- Qishloqchilar: vazifa 100% bo'lsa YOKI barcha bo'ri chetlatilsa
- Bo'rilar: soni qishloqchilarga teng/ko'p bo'lsa

Bu o'yin **multiplayer** — Oracle'dagi WebSocket serverga ulanadi
(`../../server/`). Kamida 3 o'yinchi.

## O'ynash
1. Server ishga tushgan bo'lsin.
2. `index.html` ni oching, server manzilini `?server=ws://localhost:8080`
   bilan bering yoki "o'zgartirish".
3. Ism → **Yangi xona ochish** yoki **KOD** bilan **Kirish**.
4. 3+ o'yinchi → host **Boshlash**.

Server-side mantiq: `../../server/games/bori.js`.

> Muhokama uchun ovoz/chat keyingi bosqichda (hozircha ovoz berish tugmalari).
> Ko'ruvchi (Seer) roli va boshqa qo'shimchalar rejada.
