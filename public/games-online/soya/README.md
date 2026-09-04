# 🎭 Soya (Berkinmachoq + Prop Hunt) — Online

Ko'p o'yinchili real vaqt o'yini. Bir **Qidiruvchi**, qolganlar
**Yashiringan**. Yashiringanlar maydondagi predmetlar (📦 🪑 🌵 🛢️ 🗿 🎁)
orasida bir xil ko'rinib yashirinadi. Qidiruvchi predmetni bosib tekshiradi:
to'g'ri topsa — ushlaydi; oddiy predmet bo'lsa — jarima (muzlash).

**Fazalar:** Yashirinish (15s) → Qidiruv (80s).
**G'olib:** Qidiruvchi hammani ushlasa — Qidiruvchi yutadi; vaqt tugaguncha
kamida bittasi qochib qolsa — Yashiringanlar yutadi.

Bu o'yin **multiplayer** — Oracle'dagi WebSocket serverga ulanadi
(`../../server/`).

## O'ynash
1. Server ishga tushgan bo'lsin.
2. `index.html` ni oching, server manzilini `?server=ws://localhost:8080`
   bilan bering yoki "o'zgartirish".
3. Ism → **Yangi xona ochish** yoki **KOD** bilan **Kirish**.
4. Kamida 2 o'yinchi → host **Boshlash**. Rol tasodifiy beriladi.
5. Harakat: `← ↑ → ↓` / `W A S D`. Qidiruvchi: predmetni **bosib** tekshiradi.

Server-side mantiq: `../../server/games/soya.js`.

> Eslatma: bu MVP. "Arvoh" (ushlanganni tiriltirish), tuman rejimi va
> boshqa fantaziya burilishlari keyingi bosqichda qo'shiladi.
