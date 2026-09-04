# O'yin andozasi (_template)

Yangi o'yin qo'shish uchun:

1. Bu papkani nusxalang:
   ```bash
   cp -r games/_template games/yangi-oyin-nomi
   ```
2. `index.html`, `style.css`, `game.js` fayllarini tahrirlang.
3. Har bir o'yin **mustaqil** — faqat shu papkani deploy qilsa bo'ladi
   (Vercel/Netlify/GitHub Pages), o'z subdomeniga.

## Qoidalar
- Tashqi build kerak emas — sof HTML/CSS/JS brauzerada ishlaydi.
- Barcha yo'llar (`href`, `src`) papkaga **nisbiy** (`./`) bo'lsin.
- Katta o'yin React/Vite talab qilsa, papka ichida o'z `package.json` bilan
  mustaqil loyiha sifatida qurilsin.
