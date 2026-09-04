# 👑 Toj (King of the Hill) — Online PvP

Ko'p o'yinchili real vaqt o'yini. Markazdagi **tepalik** zonasini **yakka**
egallab tursang, ball yig'asan. Zonada 2+ o'yinchi bo'lsa — hech kim ball
olmaydi (bahsli). Birinchi bo'lib **100 ballga** yetgan yutadi.

Bu o'yin **multiplayer** — Oracle'dagi WebSocket serverga ulanadi
(qarang: `../../server/`). Bir o'zi (solo) o'ynalmaydi.

## O'ynash
1. Server ishga tushgan bo'lsin (`server/` — lokal yoki Oracle).
2. `index.html` ni oching. Server manzilini `?server=ws://localhost:8080`
   bilan bering yoki sahifadagi **"o'zgartirish"** orqali kiriting.
3. Ism kiriting → **Yangi xona ochish** (host bo'lasiz) yoki do'stingiz
   bergan **KOD** bilan **Kirish**.
4. Kamida 2 o'yinchi yig'ilgach, host **Boshlash** bosadi.
5. Boshqaruv: `← ↑ → ↓` yoki `W A S D` (mobil: ekran tugmalari).

## Server manzili
Standart: `ws://localhost:8080` (lokal test). Oracle uchun `net.js` dagi
`DEFAULT_SERVER` ni `wss://sizning-domen` ga o'zgartiring.

## Fayllar
- `index.html` — lobby, xona, o'yin, natija ekranlari
- `net.js` — WebSocket ulanish
- `game.js` — mijoz mantig'i + Canvas render
- `style.css` — dizayn

## Deploy
Frontend statik — bu papkani alohida deploy qiling. Server esa Oracle VM'da
alohida ishlaydi (`server/README.md`).
