-- ==========================================================
-- MAROQLI.uz — Barcha 4 ta Pleylist, Cloudflare Stream Videolari va Yangi Banneringiz
-- ==========================================================

-- 1. Eski darsliklarni tozalash
DELETE FROM public.gamedev_lessons;

-- 2. Barcha 4 ta pleylist darslarini Cloudflare Stream Video ID lari hamda Yangi Rasmlar bilan kiritish
INSERT INTO public.gamedev_lessons (title, author, level, img, video_url, created_at) VALUES

-- Playlist 1: GameDev "0" dan o'rganish
('1-Dars: Kirish va GameDev asoslari (O''yin qanday yaratiladi?)', 'Maroqli.uz', 'GameDev "0" dan o''rganish', '/images/lessons/gamedev.png', 'cloudflare://5ea6794871f988c845f520056f938266', '2026-01-01 00:00:00+00'),
('2-Dars: Skriptlar va kodlash dunyosi (C# / GDScript)', 'Maroqli.uz', 'GameDev "0" dan o''rganish', '/images/lessons/gamedev.png', 'cloudflare://7f07f450e5017c13cd36cb830d27ae4b', '2026-01-02 00:00:00+00'),
('3-Dars: 2D va 3D grafika hamda animatsiyalar', 'Maroqli.uz', 'GameDev "0" dan o''rganish', '/images/lessons/gamedev.png', 'cloudflare://6da1158fa1ce7e93a7020757db0cd46d', '2026-01-03 00:00:00+00'),
('4-Dars: Birinchi 3D o''yinni yaratish va fizikasi', 'Maroqli.uz', 'GameDev "0" dan o''rganish', '/images/lessons/gamedev.png', 'cloudflare://99a9b0bb5fcdcb48c6fd7bc64cca410b', '2026-01-04 00:00:00+00'),
('5-Dars: O''yinni eksport qilish va Maroqli do''konida sotish', 'Maroqli.uz', 'GameDev "0" dan o''rganish', '/images/lessons/gamedev.png', 'cloudflare://e8fa266bbb7834f2214bec7952013876', '2026-01-05 00:00:00+00'),

-- Playlist 2: O'yin dizayni (boshlang'ich)
('1-Dars: O''yin dizaynining asosiy tamoyillari', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/images/lessons/gamedesign.png', 'cloudflare://aa830256ddb49a8d8df4a3800f5aa8e6', '2026-01-06 00:00:00+00'),
('2-Dars: O''yinlardagi qiyinchilik', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/images/lessons/gamedesign.png', 'cloudflare://ab69aedc0e3f7adf434e9d8bd760c8b6', '2026-01-07 00:00:00+00'),
('3-Dars: O''yinchini zeriktirmaslik siri - O''yin dizaynida ritm', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/images/lessons/gamedesign.png', 'cloudflare://1ec8924aa82dbdba2a5b62e9b3a4e0a9', '2026-01-08 00:00:00+00'),

-- Playlist 3: O'yinlar matematika nazariyasi
('1-Dars: Vektorlar', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/images/lessons/gamemath.png', 'cloudflare://0227f4416dad7974318007a77d7c85db', '2026-01-09 00:00:00+00'),
('2-Dars: Sinus to''lqinlari', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/images/lessons/gamemath.png', 'cloudflare://33972dbb7e690eb5e9bcf31f6e3f408a', '2026-01-10 00:00:00+00'),
('3-Dars: Kuchlar', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/images/lessons/gamemath.png', 'cloudflare://8bbc33cdd5bee21c5ff6f3952cd5dd1c', '2026-01-11 00:00:00+00'),
('4-Dars: Matritsalar va Transformatsiyalar', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/images/lessons/gamemath.png', 'cloudflare://1169039cd2c13e50abd86b6fd073bbe6', '2026-01-12 00:00:00+00'),
('5-Dars: Kvaternionlar va Burilishlar', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/images/lessons/gamemath.png', 'cloudflare://e0109c50de2878ec123c4779264d13aa', '2026-01-13 00:00:00+00'),

-- Playlist 4: Blender 3D boshlang'ich darslari
('1-Dars: Ishni boshlash', 'Maroqli.uz', 'Blender 3D boshlang''ich darslari', '/images/lessons/blender3d.png', 'cloudflare://5b0c2021a67c417f07426e7e11ede44c', '2026-01-14 00:00:00+00'),
('2-Dars: Modellashtirish', 'Maroqli.uz', 'Blender 3D boshlang''ich darslari', '/images/lessons/blender3d.png', 'cloudflare://76f2a4f0cc7fb9a948afc70a0878b634', '2026-01-15 00:00:00+00'),
('3-Dars: Teksturalash', 'Maroqli.uz', 'Blender 3D boshlang''ich darslari', '/images/lessons/blender3d.png', 'cloudflare://8c56cac167674a20bfa02ff8193f82c6', '2026-01-16 00:00:00+00'),
('4-Dars: Renderlash va eksport qilish', 'Maroqli.uz', 'Blender 3D boshlang''ich darslari', '/images/lessons/blender3d.png', 'cloudflare://a6e6fc85cde93d340b7558156f1d7a41', '2026-01-17 00:00:00+00');
