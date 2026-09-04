# 🔵 Bo'linish (Split)

Original bir tugmali refleks o'yin. Uch yo'lakli (yuqori, o'rta, past) yangi mexanika: sen o'zingni **birlashtirasan** yoki **bo'lasan**.

## Mexanika (yangicha)

Bu klon emas. Asosiy g'oya — bitta tugma bilan holatni almashtirish:

- **Birlashgan (Merged)** — sen bitta blobsan va faqat **o'rta yo'lakda** turasan.
- **Bo'lingan (Split)** — sen ikkiga bo'linasan va bir vaqtda **yuqori + past yo'laklarni** egallaysan (o'rtada hech narsa qolmaydi).

To'siqlar har bir yo'lakda o'ngdan chapga qarab keladi. Sen o'z blobing turgan yo'lakda to'siq o'tayotgan bo'lsa — **o'yin tugaydi**. Shu sabab:

- To'siq **o'rtada** bo'lsa -> **BO'LIN** (yuqori + past bo'sh).
- To'siq **yuqori** yoki **pastda** bo'lsa -> **BIRLASH** (o'rtaga o't).

To'siqlar shunday joylashtirilganki, to'g'ri vaqtlash bilan har doim o'tib bo'ladi (bir vaqtning o'zida yuqori, o'rta va past uchtasi birga kelmaydi). Har o'tgan to'siq uchun **+1 ball**. Tezlik asta-sekin oshib boradi.

## Boshqaruv

- **Space** (bo'sh joy) tugmasi — birlash / bo'lin.
- **Sichqoncha bosish** yoki **ekranga tegish** — xuddi shu bir tugma.

Bir tugma hammasini boshqaradi: boshlash, holatni almashtirish, qayta o'ynash.

## Xususiyatlar

- Sof statik HTML/CSS/JS — build, framework yoki internet talab qilinmaydi.
- `<canvas>` asosidagi silliq birlash/bo'linish animatsiyasi (hujayra bo'linishi kabi).
- Rekord `localStorage` (`bolinish-best`) da saqlanadi.
- Klaviatura va sensorli ekran (mobil) ikkalasi ishlaydi.
- Qorong'i (dark) mavzu.

## Ishga tushirish

`index.html` faylini brauzerda oching. Boshqa hech narsa kerak emas.

## Mustaqil deploy

Bu o'yin mustaqil deploy qilinishi mumkin. Statik hosting sozlamalarida:

- **Root Directory = `games/bolinish`**

Barcha yo'llar (path) nisbiy (relative), shuning uchun papka o'z holicha ishlayveradi.

## Fayllar

- `index.html` — sahifa va overlaylar
- `style.css` — dark tema, `:root` o'zgaruvchilari
- `game.js` — o'yin mantiqi (canvas, holat, to'siqlar, to'qnashuv)
- `README.md` — shu fayl
