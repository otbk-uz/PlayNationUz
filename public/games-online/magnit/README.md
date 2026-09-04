# 🧲 Magnit

**Qutbingni almashtir — magnitlar seni tortsin yoki itarsin.**

Magnit — top-down brauzer o'yini. Sen kichik magnit shar bo'lasan va o'zing
to'g'ridan-to'g'ri harakatlanmaysan. Yagona ta'siring — **qutbingni almashtirish**.
Sahnadagi qo'zg'almas magnit tugunlar har kadrda senga kuch beradi.

## Yangi mexanika: qutb magnetizmi

- Sening qutbing **+** (qizil) yoki **−** (ko'k) bo'ladi.
- Har bir magnit tugunning ham o'z qutbi bor.
- **Qarama-qarshi** qutb — magnit seni **tortadi** (o'ziga yaqinlashtiradi).
- **Bir xil** qutb — magnit seni **itaradi** (o'zidan uzoqlashtiradi).
- Kuch masofaga bog'liq: `F ≈ k / masofa²` — qancha yaqin bo'lsang, shuncha
  kuchli. Portlab ketmaslik uchun eng kichik masofa cheklangan.
- Kuchlar tezlanish sifatida qo'llanadi, yengil suyultirish (damping) bilan —
  shu tufayli shar boshqariladigan bo'ladi. Devorlarga urilganda sakraydi.

Ya'ni sen "gaz" bermaysan — faqat kerakli paytda qutbni almashtirib, magnit
kuchlarning tortish/itarishidan foydalanib yo'l topasan. Bu magnit marmar
sharni boshqarishdek his qilinadi.

## Maqsad

Yashil **chiqish** (♦) zonasiga yet. Qizil **tikan**larga tegsang — bosqich
qaytadan boshlanadi. Har bosqichda magnitlar, tikanlar va devorlar joylashuvi
qo'lda yasalgan. 5 ta bosqich bor; oxirgisini o'tsang — g'alaba.

## Boshqaruv

- **Space** — qutbni almashtirish (+ ↔ −).
- Ekrandagi **"Qutb"** tugmasi yoki kanvasga **teginish/bosish** — xuddi shu.
- **"Bosqichni qayta"** tugmasi yoki **R** — bosqichni qaytadan boshlash.

## Rekord

Natija `localStorage`da `magnit-best` kalitida saqlanadi: o'tilgan bosqichlar
soni va (teng bo'lsa) eng kam vaqt. HUD'da bosqich, joriy qutb, urinishlar soni
va rekord ko'rsatiladi.

## Ishga tushirish

Hech qanday build, framework yoki tarmoq talab qilinmaydi. `index.html`ni
brauzerda ochsangiz — o'yin ishlaydi.

## Mustaqil deploy

Bu papka o'zi mustaqil deploy qilinadi. Deploy sozlamasida:

- **Root Directory = `games/magnit`**

Barcha yo'llar nisbiy (`./style.css`, `./game.js`), tashqi bog'liqliklar yo'q.

---

Fayllar: `index.html`, `style.css`, `game.js`, `README.md` — barchasi shu papkada.
