# 🌗 Ikki Dunyo (Two Worlds)

Ustma-ust joylashgan **ikki olam** haqidagi original brauzer o'yini. Butunlay
mustaqil, statik HTML/CSS/JS — hech qanday build, framework yoki tarmoq talab
qilinmaydi. `index.html` faylini brauzerda ochsangiz ishlaydi.

## Yangi (original) mexanika: olam almashtirish va o'tib ketish

Ekranda ikkita olam bir vaqtning o'zida ustma-ust turadi:

- **OLAM A** — moviy (cyan, `#22d3ee`)
- **OLAM B** — siyohrang (magenta, `#e879f9`)

Siz doim shu ikki olamdan **bittasidasiz**. To'sig'lar ham har biri o'z olamiga
(rangiga) tegishli bo'lib, o'sha rangda chiziladi.

### To'qnashuv qoidasi (asosiy g'oya)

> To'siq faqat **siz bilan bir xil olam/rangda** bo'lgandagina o'ldiradi.
> Agar siz **qarama-qarshi** olamda bo'lsangiz — to'siqdan zararsiz o'tib
> ketasiz (u siz uchun "arvoh" bo'lib qoladi).

Ya'ni har bir yaqinlashayotgan to'siqning **teskari rangiga** o'tib olishingiz
kerak. To'siqni xavfsiz o'tkazsangiz **+1 ball**. To'siq bilan bir olamda
bo'lib unga tegib ketsangiz — **o'yin tugaydi**.

Sizning joriy olamingiz bilan bir xil rangdagi to'siqlar yorqin porlaydi
(ular siz uchun qattiq — xavfli); teskari rangdagilari xira/shaffof ko'rinadi
(ulardan o'tib ketasiz).

### Bonus (ixtiyoriy)

Ba'zan rangli **orblar** paydo bo'ladi. Orbni faqat u bilan **bir xil olamda**
bo'lganingizda ushlab qolsangiz **+3 ball** qo'shiladi. Asosiy o'yin oddiy —
orblar shunchaki qo'shimcha.

Tezlik asta-sekin oshib boradi.

## Boshqaruv

- **Bo'sh tugma (Space)** — olamni almashtirish
- **Sichqoncha bosish / ekranga teginish (tap)** — olamni almashtirish
- Boshlash / Qayta o'ynash tugmalari yoki Space bilan qayta boshlanadi

Yuqoridagi HUD joriy olamingizni (A yoki B) rangi bilan ko'rsatadi, shuningdek
Ball va Rekordni. Fon ham joriy olam rangida yengil bo'yaladi.

Rekord `localStorage` da (`ikki-dunyo-best` kaliti) saqlanadi.

## Fayllar

- `index.html` — sahifa tuzilishi va overlaylar
- `style.css` — qorong'i mavzu, HUD, overlaylar
- `game.js` — o'yin mantig'i (canvas 480×480)
- `README.md` — shu fayl

## Mustaqil deploy

Bu papka o'zicha mustaqil deploy qilinadi. Deploy sozlamalarida
**Root Directory = `games/ikki-dunyo`** qilib belgilang. Build buyrug'i shart
emas — barcha yo'llar (`./style.css`, `./game.js`) nisbiy.
