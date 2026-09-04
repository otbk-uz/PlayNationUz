// Cloudflare Web Analytics — bepul, cookie'siz, maxfiylikka do'st tashrif analitikasi.
// ───────────────────────────────────────────────────────────────────────────
// SOZLASH (bir marta):
//   1) https://dash.cloudflare.com  →  Analytics & Logs  →  Web Analytics
//   2) "Add a site" bosing, uzindiegame.uz ni kiriting
//   3) Chiqqan "token" (JS snippet ichidagi "token": "xxxxxxxx...") ni nusxa oling
//   4) Pastdagi CF_BEACON_TOKEN ga o'sha tokenni qo'ying (tirnoqlar ichida)
//   5) Saqlang, push qiling — barcha sahifalar avtomatik hisoblana boshlaydi.
//
// Token MAXFIY EMAS (u baribir brauzerda ko'rinadi) — bemalol kodda tursa bo'ladi.
// Token qo'yilmaguncha bu skript hech narsa qilmaydi (sayt ishlashiga ta'sir yo'q).
// Dashboard: Cloudflare panelidagi Web Analytics bo'limida ko'rasiz.
(function () {
  var CF_BEACON_TOKEN = "f8cd24e10de34ec8ac5666e65307d144";

  if (!CF_BEACON_TOKEN || CF_BEACON_TOKEN.indexOf("PASTE_") === 0) return; // hali sozlanmagan
  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_BEACON_TOKEN }));
  (document.head || document.documentElement).appendChild(s);
})();
