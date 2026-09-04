// BLACKOUT — markaziy sozlamalar (tuning). Faqat raqamlar; mantiq boshqa modullarda.
export const CONFIG = {
  // faza (zulmat / ogohlantirish / nur) davomiyliklari — sekund
  // light uzunroq -> yorug'lik yaxshi bilinadi; dark uzunroq -> yig'ishga vaqt
  phase: { dark: 4.2, darkJitter: 1.4, warn: 0.7, light: 3.4 },

  // harakat
  moveSpeed: 4.6,
  botSpeed: 3.9,
  turnLerp: 14,          // model burilishi silliqligi
  moveEps: 0.9,          // svetda "harakat qildi" deb hisoblanadigan tezlik chegarasi

  // jang / jon (olov) — tezroq o'lmaslik uchun yumshoq balans
  maxHp: 100,
  catchDamage: 7,        // svetda qotmaslik jarimasi (kamaytirildi)
  catchCooldown: 0.75,
  flameDecay: 0.28,      // olov har sekundda shuncha so'nadi (sekinroq — o'z-o'zidan tez o'lmaydi)
  suddenDeathAt: 15,     // oxirgi shuncha sekund -> SUDDEN DEATH

  // round (kecha o'tgani sari uzayadi va botlar ko'payadi -> uzoqroq sessiya)
  roundTime: 135,
  roundTimePerNight: 12,   // har kecha +shuncha sek
  roundTimeMax: 230,
  botCount: 4,
  botPerNights: 2,         // har shuncha kechada +1 bot
  maxBots: 8,

  // do'kon (unlock) — uzoq o'ynash uchun
  freeCharacters: ['kuchuk', 'mushuk'],
  freeSkins: ['cyan', 'ruby'],
  charPrice: 120,
  skinPrice: 50,

  // pickuplar
  pickupRadius: 1.25,    // qurol/ult olish radiusi
  magnetRadius: 2.4,     // orb o'yinchiga tortiladigan masofa
  ultInterval: 10,       // har necha sekundda ult drop (zulmatda)
  ultMaxOnField: 2,
  emberInterval: 3.0,    // olov uchquni (jon tiklovchi) har necha sekundda (zulmatda)
  emberMaxOnField: 5,
  emberHeal: 34,         // olov uchquni tiklaydigan jon
  weapons: 2,            // maydonda bir vaqtda nechta qurol
  weaponRespawn: 9,      // maydonda qurol bo'lmasa, shuncha sekunddan keyin yangisi

  // tanga pickuplari (zulmatda paydo bo'ladi) — do'kon uchun grind + qo'shimcha maqsad
  coinInterval: 4.0,
  coinMaxOnField: 4,
  coinValue: 5,

  // kamera — yuqori 3/4, xona ekranni eni bo'yicha to'ldiradi (yaqinroq)
  camDist: 7, camHeight: 8.5, camLerp: 0.002, fov: 62, camFollow: 0.45,

  // standart tanlovlar (kelajakda menyudan o'zgaradi)
  defaultMap: 'cozy',
  defaultCharacter: 'kuchuk',
  // bot skinlari (player skinidan farqli) — content.SKINS kalitlari
  botSkins: ['ruby', 'violet', 'lime', 'amber', 'rose', 'sky'],
  playerSkin: 'cyan',
};
