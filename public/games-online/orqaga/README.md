# ⏪ Orqaga (Rewind)

Yuqoridan ko'rinadigan arena o'yini. **Yangi mexanika:** dunyodagi barcha
xavflar (sakrab yuruvchi bloklar, supuruvchi panjaralar, aylanuvchi tikanlar)
**doim oldinga** — vaqt bo'yicha to'xtovsiz oldinga — harakat qiladi.
Faqat **sen o'zingni orqaga qaytara olasan**: sening so'nggi bir necha soniyalik
izing yozib boriladi va **R** tugmasini bosib turganda, o'zing shu iz bo'ylab
orqaga tortilasan. Xavflar esa bu paytda ham oldinga yuraveradi — mana shu
o'ynashning asosiy hiylasi. Rewind cheklangan energiya (meter) sarflaydi va
qaytarilmaganda asta-sekin to'ladi.

## Maqsad
- Har bosqichdagi barcha **orb**larni (sariq nuqtalar) yig'.
- Keyin **yashil chiqishga** (exit) yet — u faqat barcha orblar yig'ilganda
  yonadi.
- Xavfga tegsang — **o'yin tugaydi**. Xatoni tez sezib, o'zingni orqaga
  qaytarib qutulishing mumkin.
- Bosqichlar tobora zichlashib boradi; hammasini o'tsang — **g'alaba**.

## Boshqaruv
- **Harakat:** o'q tugmalari yoki **WASD** (silliq tezlanish bilan).
- **Rewind (orqaga):** **R** ni bosib tur (yoki ekrandagi **⏪ Orqaga**
  tugmasini bosib tur). Qo'yib yuborsang — oddiy boshqaruv qaytadi.
- **Mobil:** **▲ ◀ ▼ ▶** tugmalari + bosib turiladigan **⏪ Orqaga** tugmasi.

## HUD
- **Bosqich** — hozirgi level.
- **Orblar** — qolgan orblar soni.
- **Rewind** — energiya chizig'i (kam qolsa qizaradi).

Eng yaxshi natija (o'tilgan bosqichlar / yig'ilgan orblar) brauzerning
`localStorage` xotirasida `orqaga-best` kalitida saqlanadi.

## Texnik
- Sof statik **HTML/CSS/JS** — build, framework yoki internet kerak emas.
- `index.html` ni brauzerda ochsang ishlaydi. Barcha yo'llar nisbiy (`./`).

## Mustaqil deploy
Bu o'yin mustaqil deploy qilinadi. Vercel/Netlify da:
**Root Directory = `games/orqaga`** qilib belgilang (build buyrug'i shart emas,
statik fayllar to'g'ridan-to'g'ri uzatiladi).
