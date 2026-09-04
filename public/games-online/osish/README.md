# 🌱 O'sish (Growth)

Har qadamingizda devorlar ham o'sadi — bu asosiy, o'ziga xos mexanika.
Bu klon emas: labirint statik emas, u siz bilan birga tiriladi.

## Yangi mexanika: "devorlar har harakatda o'sadi"
- Siz har bir tugma bosganingizda bitta katakka siljiysiz.
- **Har bir yurishingizdan keyin devorlar ham o'sadi** — mavjud "tirik"
  devorlar tasodifiy qo'shni bo'sh kataklarni egallab, oldinga suriladi.
- Shunday qilib harakatlanish ham zarur, ham xavfli: siljiganingiz sari
  xavf ham tarqaladi. Bu — o'z harakatingizga qarshi poyga.
- Devorlar rangi o'sish frontini ko'rsatadi: **eski devorlar to'q yashil**,
  **eng yangi (xavfli) front esa yorqin qizil-sariq** bo'lib porlaydi.

## Maqsad
- Yashil **chiqish** katagiga yeting.
- Agar devorlar sizni to'liq qamab olsa (yuradigan joy qolmasa) yoki
  chiqish yo'li butunlay to'silsa — **o'yin tugaydi**.
- Chiqishga yetsangiz — keyingi bosqich: labirint kattaroq, o'sish tezroq.
- Barcha bosqichlarni yakunlasangiz — **g'alaba**.

## Halollik / yechilishi
- Boshlang'ich labirint har doim yechiladigan qilib tekshiriladi (BFS).
- O'sish mo''tadil va tasodifiy: bir yurishda o'yinchining yonida ham,
  chiqish yonida ham ko'pi bilan bitta yangi devor o'sadi — shuning uchun
  hech qachon bir zumda adolatsiz tarzda qamalib qolmaysiz. Front ko'rinib
  turadi, chaqqon o'yinchi doimo yetib bora oladi.

## Boshqaruv
- **Klaviatura:** strelka tugmalari yoki **WASD**.
- **Mobil:** ekrandagi ▲ ◀ ▼ ▶ tugmalari.
- **Enter / Probel:** overlaydagi tugmani bosadi (boshlash / qaytadan).

## Ballar
- Natija — bosib o'tilgan qadamlar soni. Eng yaxshi natija brauzeringizda
  `localStorage` (`osish-best`) kalitida saqlanadi.

## Mustaqil deploy
Bu papka mustaqil, sof statik loyiha — build yoki tarmoq talab qilmaydi.
`index.html` ni brauzerda ochsangiz bas.

Vercel/Netlify/GitHub Pages'ga chiqarishda **Root Directory = `games/osish`**
qilib belgilang. Barcha yo'llar nisbiy (`./`).

Fayllar:
- `index.html` — sahifa va HUD
- `style.css` — qorong'i mavzu (dark theme)
- `game.js` — o'yin mantig'i (labirint, o'sish, chizish)
