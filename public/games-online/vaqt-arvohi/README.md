# 🕳️ Vaqt Arvohi (Time Ghost)

**Vaqt Arvohi** — o'z o'tmishingga qarshi o'ynaydigan top-down arkada o'yin.

## Yangi mexanika

O'yindagi asosiy g'oya — **o'zingning o'tmishing dushmaning bo'ladi**.

- Har raundda sening har bir kadrdagi (frame) joylashuving yozib boriladi.
- Raund tugagach, o'sha yozilgan yo'l **arvoh** (qizil kvadrat) bo'lib qoladi.
- Keyingi har bir raundda barcha oldingi arvohlar bir vaqtda o'z yo'llarini takrorlaydi (loop).
- Raundlar o'tgan sari arvohlar ko'payadi va arena tobora xavfli bo'ladi.
- Har qanday arvohga tegsang — **o'yin tugaydi**.

Ya'ni sen faqat o'zingdan qochasan: qancha uzoq yashasang, shuncha ko'p "kechagi o'zing" seni ovlaydi.

## Qanday o'ynaladi

1. **Boshlash** tugmasini bos.
2. Har raundda **5 ta yashil halqani** vaqt tugamasdan yig'ib ol.
3. Vaqt boshida **12 soniya**, har raundda biroz kamayadi (eng kami 8 soniya).
4. Barcha halqalarni yig'sang — keyingi raundga o'tasan (raund va ball oshadi).
5. Vaqt tugasa **yoki** arvohga tegsang — o'yin tugaydi.

### Boshqaruv

- **Harakat:** strelka tugmalari yoki `W` `A` `S` `D`
- **To'xtatish / davom:** `Space` (bo'sh joy)
- **Mobil:** ekrandagi ▲ ◀ ▼ ▶ tugmalarini bosib turib boshqar

Eng yaxshi natijang brauzerda (`localStorage`) saqlanadi.

## Texnik

- Sof statik HTML/CSS/JS — hech qanday framework, build yoki tarmoq so'rovi yo'q.
- `index.html` faylni ochish kifoya.
- Mustaqil statik sayt sifatida deploy qilinadi: **Root Directory = `games/vaqt-arvohi`**.

## Fayllar

- `index.html` — sahifa tuzilishi
- `style.css` — qorong'i mavzu (dark theme)
- `game.js` — o'yin mantiqi va canvas render
