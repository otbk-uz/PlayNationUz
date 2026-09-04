# 💡 Yorug'lik (Light)

Nur va ko'zgu jumbog'i — sof HTML/CSS/JS brauzer o'yini. Build, framework yoki
internet kerak emas: `index.html` faylini ochsangiz ishlaydi.

## Original mexanika

Panjarada bitta **manba (💡)** turadi va u qat'iy yo'nalishda **nur** chiqaradi.
Nur to'g'ri chiziq bo'ylab yuradi, lekin panjaradagi **ko'zgu** kataklardan
**aks etadi**:

- `/` ko'zgu:  o'ng ↔ yuqori,  chap ↔ past
- `\` ko'zgu:  o'ng ↔ past,   chap ↔ yuqori

**Devor (▨)** nurni to'xtatadi (yutadi), panjaradan chiqib ketsa ham nur to'xtaydi.
Vazifa — ko'zgularni burab, nurni barcha **nishonlarga (🎯)** yetkazish. Nur nishon
katagidan **o'tib ketadi** (to'xtamaydi), shuning uchun bir necha nishonni bitta
nur bilan yoritish mumkin. Har bir kadr nur qaytadan chiziladi, shuning uchun
ko'zguni burishingiz bilan yo'l darhol o'zgaradi.

## Boshqaruv

- **Bosish / teginish** (sichqoncha yoki barmoq) ko'zgu uyasini buradi:
  `/` → `\` → **o'chiq** → `/` → ...
- **↺ qayta** tugmasi — joriy bosqichni boshidan tiklaydi.
- **Space** — start/g'alaba oynalarini o'tkazadi.

Manba, nishon va devor kataklarini o'zgartirib bo'lmaydi — faqat ko'zgu uyalari
buriladi.

## Bosqichlar

6 ta o'rnatilgan (data-defined) bosqich, tobora murakkablashib boradi: ko'proq
ko'zgu, devorlar va bir nechta nishon. Oxirgi bosqich hal qilinsa — **g'alaba
oynasi** chiqadi. Yurishlar sanaladi; eng yaxshi natija (hal qilingan bosqichlar
va eng kam jami yurish) `localStorage` da `yoruglik-best` kaliti ostida saqlanadi.

## Mustaqil deploy

Bu papka **mustaqil** — faqat shu papkani deploy qilsa bo'ladi (Vercel / Netlify /
GitHub Pages) o'z subdomeniga. Barcha yo'llar nisbiy (`./`).

- **Root Directory** = `games/yoruglik`
- Build buyrug'i yo'q, chiqish papkasi — shu papkaning o'zi.
