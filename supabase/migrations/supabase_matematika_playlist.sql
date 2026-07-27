-- 1. Darsliklar jadvalini tozalash (chalkashliklarni to'liq bartaraf etish va noldan tartibli yozish uchun)
DELETE FROM public.gamedev_lessons;

-- 2. Barcha darsliklarni (6 ta original va 3 ta yangi matematika) boshidan toza holatda kiritish
INSERT INTO public.gamedev_lessons (title, author, level, img, video_url) VALUES
-- Original Game Design darslari
('1-Dars: O''yin dizaynining asosiy tamoyillari', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/lesson1.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),
('2-Dars: O''yinlardagi qiyinchilik', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/lesson2.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),
('3-Dars: O''yinchini zeriktirmaslik siri - O''yin dizaynida ritm', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/lesson3.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),
('4-Dars: O''yinlarda "syujet" qurish', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/lesson4.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),
('5-Dars: Jang sahnalarini "nima" qiziqarli qiladi?', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/lesson5.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),
('6-Dars: O''yiningizni qanday chiroyli qilish mumkin?', 'Maroqli.uz', 'O''yin dizayni (boshlang''ich)', '/lesson6.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),

-- Yangi matematika darslari
('1-Dars: Vektorlar', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/math_lesson1.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),
('2-Dars: Sinus to''lqinlari', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/math_lesson2.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8'),
('3-Dars: Kuchlar', 'Maroqli.uz', 'O''yinlar matematika nazariyasi', '/math_lesson3.png', 'https://www.youtube.com/watch?v=gB1F9G0JHD8');

