# 🔊 Aks-Ovoz (Echo)

Qorong'i labirintda eholokatsiya (sonar) yordamida yo'l topadigan original brauzer o'yini. Bu klon emas — asosiy g'oya butunlay yangi.

## Yangi mexanika: Aks-Ovoz (eholokatsiya)

Ekran deyarli qop-qorong'i. Siz labirint devorlarini ko'ra olmaysiz. **Ping** bosganingizda o'yinchidan sonarga o'xshab kengayuvchi tovush halqasi tarqaladi. Halqa yetib borgan katakchalar bir lahzaga yorishadi (devorlar yorug', pol biroz xira), so'ng ~1 soniyada yana qorong'ilikka qaytadi. Shu qisqa "surat" asosida devorlarni **yodda saqlab**, chiqishga yo'l topishingiz kerak.

O'yinchi doim juda xira yaltiraydi, shuning uchun butunlay adashib qolmaysiz — ammo haqiqiy yo'l topish faqat pinglar orqali bo'ladi.

## Qanday o'ynash

- **Harakat:** strelka tugmalari yoki `W A S D` — katakma-katak yuriladi, devordan o'tib bo'lmaydi.
- **Ping:** `Space` (bo'sh joy) yoki ekrandagi "🔊 Ping" tugmasi.
- **Maqsad:** yashil rangdagi chiqish katagiga yetib borish.
- Har bosqich tugagach kattaroq va murakkabroq labirint yuklanadi. Bir necha bosqichdan so'ng g'alaba ekrani chiqadi.
- **Mobil:** ekrandagi `▲ ◀ ▼ ▶` tugmalari va "Ping" tugmasi.

## Natija

- HUD'da bosqich, ishlatilgan ping soni va vaqt ko'rsatiladi.
- Kamroq ping va kamroq vaqt — yaxshiroq natija.
- Eng yaxshi natija (1-bosqichni eng kam ping bilan yakunlash) brauzeringizning `localStorage` xotirasida `aks-ovoz-best` kaliti ostida saqlanadi.

## Texnik

- Toza statik HTML/CSS/JS — hech qanday build, framework yoki tarmoq so'rovi yo'q.
- `index.html` faylini brauzerda ochish kifoya.
- Labirint har safar tasodifiy (recursive backtracker / DFS algoritmi) generatsiya qilinadi va yechimi doim mavjud.

## Deploy

Bu o'yin mustaqil deploy qilinadi. Root Directory = `games/aks-ovoz`.

## Fayllar

- `index.html` — sahifa tuzilishi
- `style.css` — qorong'i mavzu (dark theme)
- `game.js` — o'yin mantiqi (labirint, ping, render)
- `README.md` — shu fayl
