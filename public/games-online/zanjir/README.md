# 🔗 Zanjir (Chain)

Original brauzer o'yini — hech bir mashhur o'yin kloni emas.

## Yangi mexanika: qattiq sterjendagi ikki to'p

Siz bitta emas, **ikkita to'pni** boshqarasiz. Ular o'zgarmas uzunlikdagi
qattiq **sterjen (zanjir)** bilan bog'langan — xuddi gantel kabi. Juftlikning
**markazi avtomatik ravishda o'ngga siljiydi** (dunyo chapga suriladi) va
tezlik asta-sekin oshib boradi.

To'plar markazdan `± (sterjen/2)` masofada, ma'lum bir **burchak** ostida
turadi. Siz butun juftni **aylantirasiz** (burchakni o'zgartirasiz), holos.
Har bir devorda teshik bor va u ikki xil bo'ladi:

- **Gorizontal teshik** (ko'k) — bitta markaziy oyna. O'tish uchun juft
  **gorizontal** bo'lishi kerak (ikkala to'p bir balandlikda).
- **Vertikal teshik** (yashil) — markazida to'siq bilan ikkita oyna.
  O'tish uchun juft **vertikal** bo'lishi kerak (to'plar tepa va pastdan o'tadi).

Ikkala to'p ham o'z oynasiga to'liq tushishi shart. Agar biror to'p devorga
tegsa — **o'yin tugaydi**. Har bir devordan o'tsangiz — **+1 to'p**. Tezlik
oshgani sari aylantirishni o'z vaqtida bajarish qiyinlashadi.

Teshiklar har doim **biror orientatsiya uchun o'tsa bo'ladigan** qilib
joylashtirilgan — o'yin adolatli.

## Boshqaruv

- **← / A** — chapga aylantirish (CCW)
- **→ / D** — o'ngga aylantirish (CW)
- **↑ / W** — o'ngga aylantirish (CW)
- **Sensorli ekran / sichqoncha** — ekranning **chap yarmi** = chapga (CCW),
  **o'ng yarmi** = o'ngga (CW). Bosib turing.
- **Bo'sh joy / Enter / tap** — boshlash yoki qayta o'ynash

Klaviatura ham, sensorli boshqaruv ham ishlaydi. Eng yaxshi natija
brauzerning `localStorage` (`zanjir-best`) da saqlanadi.

## Texnik

- Sof statik **HTML / CSS / JS** — build, framework yoki tarmoq talab qilmaydi.
- `index.html` faylni brauzerda ochsangiz — ishlaydi.
- Barcha yo'llar papkaga **nisbiy** (`./`).

## Mustaqil deploy

Bu papka mustaqil deploy qilinadi (Vercel / Netlify / GitHub Pages):

> **Root Directory = `games/zanjir`**

Boshqa hech narsa kerak emas.
