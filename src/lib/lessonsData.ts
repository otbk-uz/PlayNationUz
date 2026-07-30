export interface Lesson {
  id: string;
  title: string;
  author: string;
  level: string;
  img: string;
  video_url: string;
  duration?: string;
  likes_count?: number;
  views_count?: number;
  created_at?: string;
}

export const DEFAULT_LESSONS: Lesson[] = [
  // --- Playlist 1: GameDev 0dan o'rganish ---
  {
    id: "gamedev-lesson-1",
    title: "1-Dars: Kirish va GameDev asoslari (O'yin qanday yaratiladi?)",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "/gamedev_lesson1.png",
    video_url: "cloudflare://aa830256ddb49a8d8df4a3800f5aa8e6",
    duration: "15:20",
    likes_count: 142,
    views_count: 2100,
    created_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-2",
    title: "2-Dars: Skriptlar va kodlash dunyosi (C# / GDScript)",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "/gamedev_lesson2.png",
    video_url: "cloudflare://ab69aedc0e3f7adf434e9d8bd760c8b6",
    duration: "22:45",
    likes_count: 185,
    views_count: 2350,
    created_at: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-3",
    title: "3-Dars: 2D va 3D grafika hamda animatsiyalar",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "/gamedev_lesson3.png",
    video_url: "cloudflare://1ec8924aa82dbdba2a5b62e9b3a4e0a9",
    duration: "18:10",
    likes_count: 156,
    views_count: 1980,
    created_at: "2026-01-03T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-4",
    title: "4-Dars: Birinchi 3D o'yinni yaratish va fizikasi",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "/gamedev_lesson4.png",
    video_url: "cloudflare://1169039cd2c13e50abd86b6fd073bbe6",
    duration: "30:00",
    likes_count: 210,
    views_count: 2890,
    created_at: "2026-01-04T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-5",
    title: "5-Dars: O'yinni eksport qilish va Maroqli do'konida sotish",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "/gamedev_lesson5.png",
    video_url: "cloudflare://e0109c50de2878ec123c4779264d13aa",
    duration: "25:15",
    likes_count: 198,
    views_count: 2420,
    created_at: "2026-01-05T00:00:00.000Z"
  },

  // --- Playlist 2: O'yin dizayni (boshlang'ich) ---
  {
    id: "gamedesign-lesson-1",
    title: "1-Dars: O'yin dizaynining asosiy tamoyillari",
    author: "Maroqli.uz",
    level: "O'yin dizayni (boshlang'ich)",
    img: "/lesson1.png",
    video_url: "cloudflare://0227f4416dad7974318007a77d7c85db",
    duration: "20:00",
    likes_count: 130,
    views_count: 1750,
    created_at: "2026-01-06T00:00:00.000Z"
  },
  {
    id: "gamedesign-lesson-2",
    title: "2-Dars: O'yinlardagi qiyinchilik",
    author: "Maroqli.uz",
    level: "O'yin dizayni (boshlang'ich)",
    img: "/lesson2.png",
    video_url: "cloudflare://33972dbb7e690eb5e9bcf31f6e3f408a",
    duration: "19:30",
    likes_count: 115,
    views_count: 1620,
    created_at: "2026-01-07T00:00:00.000Z"
  },
  {
    id: "gamedesign-lesson-3",
    title: "3-Dars: O'yinchini zeriktirmaslik siri - O'yin dizaynida ritm",
    author: "Maroqli.uz",
    level: "O'yin dizayni (boshlang'ich)",
    img: "/lesson3.png",
    video_url: "cloudflare://8bbc33cdd5bee21c5ff6f3952cd5dd1c",
    duration: "21:15",
    likes_count: 145,
    views_count: 1890,
    created_at: "2026-01-08T00:00:00.000Z"
  },

  // --- Playlist 3: O'yinlar matematika nazariyasi ---
  {
    id: "math-lesson-1",
    title: "1-Dars: Vektorlar",
    author: "Maroqli.uz",
    level: "O'yinlar matematika nazariyasi",
    img: "/math_lesson1.png",
    video_url: "cloudflare://5ea6794871f988c845f520056f938266",
    duration: "16:40",
    likes_count: 168,
    views_count: 2120,
    created_at: "2026-01-09T00:00:00.000Z"
  },
  {
    id: "math-lesson-2",
    title: "2-Dars: Sinus to'lqinlari",
    author: "Maroqli.uz",
    level: "O'yinlar matematika nazariyasi",
    img: "/math_lesson2.png",
    video_url: "cloudflare://7f07f450e5017c13cd36cb830d27ae4b",
    duration: "14:50",
    likes_count: 152,
    views_count: 1980,
    created_at: "2026-01-10T00:00:00.000Z"
  },
  {
    id: "math-lesson-3",
    title: "3-Dars: Kuchlar",
    author: "Maroqli.uz",
    level: "O'yinlar matematika nazariyasi",
    img: "/math_lesson3.png",
    video_url: "cloudflare://6da1158fa1ce7e93a7020757db0cd46d",
    duration: "18:20",
    likes_count: 174,
    views_count: 2240,
    created_at: "2026-01-11T00:00:00.000Z"
  },
  {
    id: "math-lesson-4",
    title: "4-Dars: Matritsalar va Transformatsiyalar",
    author: "Maroqli.uz",
    level: "O'yinlar matematika nazariyasi",
    img: "/lesson4.png",
    video_url: "cloudflare://99a9b0bb5fcdcb48c6fd7bc64cca410b",
    duration: "23:10",
    likes_count: 189,
    views_count: 2450,
    created_at: "2026-01-12T00:00:00.000Z"
  },
  {
    id: "math-lesson-5",
    title: "5-Dars: Kvaternionlar va Burilishlar",
    author: "Maroqli.uz",
    level: "O'yinlar matematika nazariyasi",
    img: "/lesson5.png",
    video_url: "cloudflare://e8fa266bbb7834f2214bec7952013876",
    duration: "27:00",
    likes_count: 205,
    views_count: 2680,
    created_at: "2026-01-13T00:00:00.000Z"
  },

  // --- Playlist 4: Blender 3D boshlang'ich darslari ---
  {
    id: "blender-lesson-1",
    title: "1-Dars: Ishni boshlash",
    author: "Maroqli.uz",
    level: "Blender 3D boshlang'ich darslari",
    img: "/lesson1.png",
    video_url: "cloudflare://5b0c2021a67c417f07426e7e11ede44c",
    duration: "18:00",
    likes_count: 160,
    views_count: 2050,
    created_at: "2026-01-14T00:00:00.000Z"
  },
  {
    id: "blender-lesson-2",
    title: "2-Dars: Modellashtirish",
    author: "Maroqli.uz",
    level: "Blender 3D boshlang'ich darslari",
    img: "/lesson2.png",
    video_url: "cloudflare://76f2a4f0cc7fb9a948afc70a0878b634",
    duration: "25:30",
    likes_count: 182,
    views_count: 2310,
    created_at: "2026-01-15T00:00:00.000Z"
  },
  {
    id: "blender-lesson-3",
    title: "3-Dars: Teksturalash",
    author: "Maroqli.uz",
    level: "Blender 3D boshlang'ich darslari",
    img: "/lesson3.png",
    video_url: "cloudflare://8c56cac167674a20bfa02ff8193f82c6",
    duration: "22:10",
    likes_count: 175,
    views_count: 2190,
    created_at: "2026-01-16T00:00:00.000Z"
  },
  {
    id: "blender-lesson-4",
    title: "4-Dars: Renderlash va eksport qilish",
    author: "Maroqli.uz",
    level: "Blender 3D boshlang'ich darslari",
    img: "/lesson6.png",
    video_url: "cloudflare://a6e6fc85cde93d340b7558156f1d7a41",
    duration: "29:45",
    likes_count: 215,
    views_count: 2750,
    created_at: "2026-01-17T00:00:00.000Z"
  }
];
