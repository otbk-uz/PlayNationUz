export interface Lesson {
  id: string;
  title: string;
  author: string;
  level: string;
  img: string;
  video_url: string;
  duration?: string;
  created_at?: string;
}

export const DEFAULT_LESSONS: Lesson[] = [
  {
    id: "gamedev-lesson-1",
    title: "1-Dars: Kirish va GameDev asoslari (O'yin qanday yaratiladi?)",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    video_url: "https://www.youtube.com/watch?v=n784f18V0aI",
    duration: "15:20",
    created_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-2",
    title: "2-Dars: Skriptlar va kodlash dunyosi (C# / GDScript)",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    video_url: "https://www.youtube.com/watch?v=n784f18V0aI",
    duration: "22:45",
    created_at: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-3",
    title: "3-Dars: 2D va 3D grafika hamda animatsiyalar",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    video_url: "https://www.youtube.com/watch?v=n784f18V0aI",
    duration: "18:10",
    created_at: "2026-01-03T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-4",
    title: "4-Dars: Birinchi 3D o'yinni yaratish va fizikasi",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    video_url: "https://www.youtube.com/watch?v=n784f18V0aI",
    duration: "30:00",
    created_at: "2026-01-04T00:00:00.000Z"
  },
  {
    id: "gamedev-lesson-5",
    title: "5-Dars: O'yinni eksport qilish va Maroqli do'konida sotish",
    author: "Maroqli.uz",
    level: "GameDev 0dan o'rganish",
    img: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&q=80",
    video_url: "https://www.youtube.com/watch?v=n784f18V0aI",
    duration: "25:15",
    created_at: "2026-01-05T00:00:00.000Z"
  }
];
