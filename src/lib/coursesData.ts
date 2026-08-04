export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
}

export interface LessonItem {
  id: string;
  title: string;
  duration: string;
  video_url: string;
  img: string;
  quizzes: QuizQuestion[];
}

export interface ModuleItem {
  id: string;
  title: string;
  lessons: LessonItem[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  level: "Boshlang'ich" | "O'rta" | "Pro";
  cover_img: string;
  description: string;
  whatYouWillLearn: string[];
  total_lessons: number;
  total_duration: string;
  mentor_name: string;
  mentor_title: string;
  mentor_avatar: string;
  modules: ModuleItem[];
}

export const COURSES: Course[] = [
  {
    id: "gamedev-0dan-organish",
    title: "GameDev \"0\" dan o'rganish",
    subtitle: "Noldan professional o'yin yaratish asoslari va C# kodlash",
    category: "GAMEDEV",
    level: "Boshlang'ich",
    cover_img: "/gamedev_lesson1.png",
    description: "Startap va o'yin ishlab chiqarish sirlarini 0dan o'rganing! Mijoz topish, o'yin fizikasi va optimallashtirish bo'yicha amaliy darslar va testlar aynan yosh dasturchilar uchun.",
    whatYouWillLearn: [
      "O'yin dvigateli (Game Engine) arxitekturasi va ishlash printsipi",
      "C# va GDScript yordamida obyektlar va mantiqiy skriptlar yozish",
      "2D va 3D grafika, yoritish va animatsiya tizimlari bilan ishlash",
      "Birinchi 3D o'yin fizikasi va personaj boshqaruvini sozlash",
      "O'yinni tayyor mahsulot sifatida eksport qilish va sotish"
    ],
    total_lessons: 5,
    total_duration: "1 soat 50 daqiqa",
    mentor_name: "Uz1games",
    mentor_title: "Senior Game Developer & Architect",
    mentor_avatar: "/images/lessons/gamedev.png",
    modules: [
      {
        id: "mod-1",
        title: "1-Modul: Asosiy tushunchalar va o'yin dvigatellari",
        lessons: [
          {
            id: "gamedev-lesson-1",
            title: "1-Dars: Kirish va GameDev asoslari (O'yin qanday yaratiladi?)",
            duration: "15:20",
            video_url: "cloudflare://5ea6794871f988c845f520056f938266",
            img: "/gamedev_lesson1.png",
            quizzes: [
              {
                id: 1,
                question: "Game Engine (O'yin dvigateli) asosiy vazifasi nima?",
                options: [
                  "Faqat matn tahrirlash",
                  "Grafika, fizika va audio resurslarini birlashtirib o'yinni ishga tushirish",
                  "Faqat rasmlarni siqish",
                  "Internet tezligini oshirish"
                ],
                correctAnswer: 1,
                explanation: "Game Engine o'yindagi vizual render, fizika, kiruvchi signallar va ovozlarni birlashtirib boshqaruvchi asosiy platformadir."
              },
              {
                id: 2,
                question: "GameDev loyihasida 'Asset' so'zi nimani bildiradi?",
                options: [
                  "Dasturdagi xatoliklar",
                  "O'yin uchun ishlatiladigan rasmlar, 3D modellar, ovozlar va prefabs",
                  "Faqat kompyuter klaviaturasi",
                  "Server xotirasi"
                ],
                correctAnswer: 1,
                explanation: "Asset — o'yin yaratishda ishlatiladigan har qanday media resurs (tekstura, model, audio va skriptlar)."
              },
              {
                id: 3,
                question: "Game Loop (O mezonli tsikl) qanday ishlaydi?",
                options: [
                  "1 marta ishlab to'xtaydi",
                  "Har bir kadrda (Frame) Update, Render va Input signallarini takrorlaydi",
                  "Faqat o'yin o'chganda ishlaydi",
                  "Operatsion tizimni o'chiradi"
                ],
                correctAnswer: 1,
                explanation: "Game Loop kadriga (FPS) mos ravishda foydalanuvchi kiritishini qabul qiladi, fizikani hisoblaydi va ekranga chizadi."
              },
              {
                id: 4,
                question: "FPS nimaning qisqartmasi va nimani anglatadi?",
                options: [
                  "First Person Shooter — birinchi shaxs otishmasi",
                  "Frames Per Second — bir soniyadagi kadrlar soni",
                  "Fast Processing System — tezkor protsessor",
                  "File Protection Service — fayl xavfsizligi"
                ],
                correctAnswer: 1,
                explanation: "FPS (Frames Per Second) soniyasiga nechta kadr namoyish etilishini bildiradi (30, 60, 120 FPS)."
              },
              {
                id: 5,
                question: "Dunyo bo'ylab eng mashhur bepul 2D/3D o'yin dvigatellaridan biri qaysi?",
                options: [
                  "MS Paint",
                  "Godot Engine & Unity",
                  "Adobe Photoshop",
                  "Notepad++"
                ],
                correctAnswer: 1,
                explanation: "Godot va Unity zamonaviy krossplatformali o'yin dvigatellaridir."
              }
            ]
          },
          {
            id: "gamedev-lesson-2",
            title: "2-Dars: Skriptlar va kodlash dunyosi (C# / GDScript)",
            duration: "22:45",
            video_url: "cloudflare://7f07f450e5017c13cd36cb830d27ae4b",
            img: "/gamedev_lesson2.png",
            quizzes: [
              {
                id: 1,
                question: "O'yinda ob'ektning joylashuvini o'zgartirish uchun qaysi strukturadan foydalaniladi?",
                options: ["String", "Vector3 / Vector2", "Boolean", "Char"],
                correctAnswer: 1,
                explanation: "Vector3 yoki Vector2 ob'ektning 3D yoki 2D fazodagi koordinatalarini (X, Y, Z) belgilaydi."
              },
              {
                id: 2,
                question: "Unity va Godot dvigatellarida har bir kadrda chaqiriladigan metod qaysi?",
                options: ["Start() / _ready()", "Update() / _process()", "OnDestroy()", "Quit()"],
                correctAnswer: 1,
                explanation: "Update() va _process() har bir kadr yangilanganda doimiy ravishda bajariladi."
              },
              {
                id: 3,
                question: "DeltaTime (Time.deltaTime) nima uchun ishlatiladi?",
                options: [
                  "O'yinni sekinlashtirish uchun",
                  "Harakatni kompyuter FPS tezligidan mustaqil va tekis qilish uchun",
                  "Vaqtni to'xtatish uchun",
                  "Ekran o'lchamini o'zgartirish uchun"
                ],
                correctAnswer: 1,
                explanation: "DeltaTime harakatni soniyalar bo'yicha normallashtiradi, shunda har xil kompyuterda bir xil tezlikda harakatlanadi."
              },
              {
                id: 4,
                question: "C# dasturlash tilida o'zgaruvchi e'lon qilish to'g'ri ko'rinishi qaysi?",
                options: [
                  "float speed = 10.5f;",
                  "variable speed : 10.5;",
                  "make speed equal 10.5",
                  "speed := 10.5f"
                ],
                correctAnswer: 0,
                explanation: "C# tilida float toifasidagi o'zgaruvchi qiymati oxiriga 'f' qo'shib e'lon qilinadi."
              },
              {
                id: 5,
                question: "O'yinchining klaviatura tugmasini bosganini aniqlash uchun qaysi sinf ishlatiladi?",
                options: ["Output", "Input (Input.GetKey / Input.is_action_pressed)", "Printer", "File"],
                correctAnswer: 1,
                explanation: "Input sinfi foydalanuvchi klaviatura, mishka yoki geympad signallarini ushlaydi."
              }
            ]
          }
        ]
      },
      {
        id: "mod-2",
        title: "2-Modul: Grafika va Amaliy 3D O'yin",
        lessons: [
          {
            id: "gamedev-lesson-3",
            title: "3-Dars: 2D va 3D grafika hamda animatsiyalar",
            duration: "18:10",
            video_url: "cloudflare://6da1158fa1ce7e93a7020757db0cd46d",
            img: "/gamedev_lesson3.png",
            quizzes: [
              {
                id: 1,
                question: "3D ob'ekt yuzasiga rang va tasvir berish uchun nima ishlatiladi?",
                options: ["Material va Tekstura", "Faqat audio clip", "Klaviatura", "CPU kabeli"],
                correctAnswer: 0,
                explanation: "Material va Tekstura ob'ekt yuzasiga tekstura, yaltiroqlik va rang bag'ishlaydi."
              },
              {
                id: 2,
                question: "RigidBody (RigidBody3D) komponenti ob'ektga qanday xususiyat beradi?",
                options: ["Ovoz beradi", "Fizik qonunlar (tortishish kuchi, to'qnashuv)", "Matn yozadi", "O'yinni saqlaydi"],
                correctAnswer: 1,
                explanation: "RigidBody ob'ektga massa, tortishish kuchi va to'qnashuv fizikalarini taqdim etadi."
              },
              {
                id: 3,
                question: "Collider nima?",
                options: ["Ovoz balandligi", "Ob'ektning to'qnashuv chegarasini belgilovchi shakl", "Rasm formati", "Bosh sahifa"],
                correctAnswer: 1,
                explanation: "Collider ob'ektlar bir-biriga urilganda to'qnashuvni aniqlaydigan ko'rinmas fizika chegarasidir."
              },
              {
                id: 4,
                question: "2D o'yinlarda kadrlar ketma-ketligidan iborat animatsiya nima deyiladi?",
                options: ["Sprite Sheet Animation", "Vector Font", "Database Query", "HTTP Post"],
                correctAnswer: 0,
                explanation: "Sprite Sheet kadrlaridan foydalanib 2D animatsiyalar yaratiladi."
              },
              {
                id: 5,
                question: "Shading (Soyalash) texnologiyasi nimani ta'minlaydi?",
                options: [
                  "O'yin tezligini kamaytirish",
                  "Yorug'lik va soyalarni o'yinda realizm bilan aks ettirish",
                  "Faqat kodni yashirish",
                  "Muzikani balandlatish"
                ],
                correctAnswer: 1,
                explanation: "Shading yorug'lik va materiallar o'rtasidagi nurlanishni aks ettiradi."
              }
            ]
          },
          {
            id: "gamedev-lesson-4",
            title: "4-Dars: Birinchi 3D o'yinni yaratish va fizikasi",
            duration: "30:00",
            video_url: "cloudflare://99a9b0bb5fcdcb48c6fd7bc64cca410b",
            img: "/gamedev_lesson4.png",
            quizzes: [
              {
                id: 1,
                question: "O'yinchining to'siqqa urilganda jon yoqotishi uchun qaysi hodisa (Event) ushlanadi?",
                options: ["OnCollisionEnter / _on_body_entered", "OnMouseExit", "OnApplicationQuit", "OnAwake"],
                correctAnswer: 0,
                explanation: "OnCollisionEnter ikkita fizika ob'ekti to'qnashganda ishlaydi."
              },
              {
                id: 2,
                question: "UI (User Interface) tarkibiga o'yinda nimalar kiradi?",
                options: ["Jon bari, ochkolar hisobi, menyu tugmalari", "Faqat 3D modellar", "Bosh protsessor", "Video karta driveri"],
                correctAnswer: 0,
                explanation: "UI foydalanuvchiga ko'rinib turuvchi barcha ekran menyulari hamda statistikani o'z ichiga oladi."
              },
              {
                id: 3,
                question: "Prefab (yoki PackedScene) nimaga kerak?",
                options: [
                  "O'yinni o'chirish uchun",
                  "Tayyor ob'ektni shablon sifatida saqlab, uni o'yinda istalgancha ko'paytirish uchun",
                  "Faqat fayl nomini o'zgartirish uchun",
                  "Parolni saqlash uchun"
                ],
                correctAnswer: 1,
                explanation: "Prefab qayta ishlatiluvchi tayyor ob'ekt shablonidir (masalan: dushmanlar, tangalar)."
              },
              {
                id: 4,
                question: "O'yinda score (ochko) oshishini ta'minlash uchun nima qilinadi?",
                options: [
                  "Tangaga urilganda score o'zgaruvchisiga +1 qo'shiladi va UI yangilanadi",
                  "O'yin qayta boshlanadi",
                  "Audio o'chiriladi",
                  "Kompyuter o'chiriladi"
                ],
                correctAnswer: 0,
                explanation: "Tangaga to'qnashganda o'zgaruvchi oshiriladi va UI matni yangilanadi."
              },
              {
                id: 5,
                question: "O'yin kamerasini personaj ketidan ergashishi uchun qaysi texnika qo'llaniladi?",
                options: [
                  "Camera Follow Script yoki Smooth Damp / Lerp",
                  "Kamerani o'chirib tashlash",
                  "Faqat o'yinni to'xtatish",
                  "Kamerani tezroq aylantirish"
                ],
                correctAnswer: 0,
                explanation: "Smooth Damp va Lerp yordamida kamera personaj ketidan silliq ergashadi."
              }
            ]
          },
          {
            id: "gamedev-lesson-5",
            title: "5-Dars: O'yinni eksport qilish va Maroqli do'konida sotish",
            duration: "25:15",
            video_url: "cloudflare://e8fa266bbb7834f2214bec7952013876",
            img: "/gamedev_lesson5.png",
            quizzes: [
              {
                id: 1,
                question: "Windows uchun o'yin binosini (Build) eksport qilganda qaysi kengaytmali fayl hosil bo'ladi?",
                options: [".exe", ".mp3", ".jpg", ".txt"],
                correctAnswer: 0,
                explanation: "Windows operatsion tizimida ishlaydigan dasturlar .exe fayl ko'rinishida chiqariladi."
              },
              {
                id: 2,
                question: "O'yin hajmi juda katta bo'lsa (masalan 1GB+), Maroqli platformasiga qanday yuklanadi?",
                options: [
                  "Tashqi bulut havolasi (Google Drive, Telegram, Cloudflare R2)",
                  "Faqat SMS orqali",
                  "Diskka yozib pochta orqali",
                  "Yuklab bo'lmaydi"
                ],
                correctAnswer: 0,
                explanation: "Tashqi bulut havolasi orqali har qanday katta hajmdagi o'yin 1 soniyada Maroqli do'koniga joylanadi."
              },
              {
                id: 3,
                question: "O'yinni eksport qilishdan oldin eng muhim jarayon qaysi?",
                options: ["Optimallashtirish va xatolarni (Bugs) test qilish", "Kompuyterni format qilish", "Rasmlarni o'chirish", "Muzikani o'chirish"],
                correctAnswer: 0,
                explanation: "Optimallashtirish va bug-testing o'yin silliq ishlashini ta'minlaydi."
              },
              {
                id: 4,
                question: "Maroqli do'konida o'yin muallifi sifatida daromad olish uchun nima kerak?",
                options: ["Gamedev bo'limidan o'yin fayli va ma'lumotlarini yuklab e'lon qilish", "Hech narsa kerak emas", "Faqat kompyuter yoqish", "Kanal ochish"],
                correctAnswer: 0,
                explanation: "GameDev bo'limidan o'yin qo'shilgach, geymerlar uni sotib olib o'ynaydi."
              },
              {
                id: 5,
                question: "Tabriklaymiz! Ushbu kursni tamomlaganingizda nimaga ega bo'lasiz?",
                options: [
                  "Rasmiy Maroqli Academy Sertifikati va O'yin Yaratish ko'nikmasi",
                  "Hech narsaga",
                  "Faqat sertifikat rasmi",
                  "O'yin o'chib ketadi"
                ],
                correctAnswer: 0,
                explanation: "Kursni 100% tamomlagach, maxsus sertifikat beriladi."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "gamedesign-boshlangich",
    title: "O'yin dizayni (boshlang'ich)",
    subtitle: "O'yinchilarni mahtun etuvchi o'yin mexanikalari, daraja dizayni va balans",
    category: "GAME DESIGN",
    level: "Boshlang'ich",
    cover_img: "/lesson1.png",
    description: "O'yin dizaynining eng muvaffaqiyatli sirlarini o'rganing. O'yinchilarni o'yinga jalb qilish, ritm berish va zeriktirmaslik mexanikalari.",
    whatYouWillLearn: [
      "O'yin konsepsiyasi va o'yin mexanikasining (Core Loop) o'rni",
      "O'yinlarda qiyinchilik balansi va bosqichlar iyerarxiyasi",
      "O'yin ritmi va dinamikasi orqali psixologik jalb qilish",
      "Level Design — darajalarni xaritada to'g'ri joylashtirish"
    ],
    total_lessons: 3,
    total_duration: "1 soat 05 daqiqa",
    mentor_name: "Uz1games",
    mentor_title: "Game Designer & Producer",
    mentor_avatar: "/images/lessons/gamedesign.png",
    modules: [
      {
        id: "gamedesign-mod-1",
        title: "1-Modul: O'yin dizayni poydevori",
        lessons: [
          {
            id: "gamedesign-lesson-1",
            title: "1-Dars: O'yin dizaynining asosiy tamoyillari",
            duration: "20:00",
            video_url: "cloudflare://aa830256ddb49a8d8df4a3800f5aa8e6",
            img: "/lesson1.png",
            quizzes: [
              {
                id: 1,
                question: "O'yin dizaynida 'Core Loop' (Asosiy tsikl) nima?",
                options: [
                  "O'yinchining doimiy ravishda takrorlaydigan asosiy harakati (masalan: Otish -> Ochko olish -> Qurolni kuchaytirish)",
                  "O'yinni o'chirish tugmasi",
                  "Kompyuter xotirasi",
                  "Rasmlar to'plami"
                ],
                correctAnswer: 0,
                explanation: "Core Loop — o'yinchini jalb qilib turuvchi asosiy o'yin zanjiridir."
              },
              {
                id: 2,
                question: "Game Mechanics va Game Aesthetics o'rtasidagi farq nima?",
                options: [
                  "Mechanics — o'yin qoidalari va mantiq, Aesthetics — vizual va his-tuyg'ular",
                  "Farqi yo'q",
                  "Mechanics — faqat audio, Aesthetics — matn",
                  "Ikkalasi ham kompyuter turi"
                ],
                correctAnswer: 0,
                explanation: "Mexanika — harakat va qoidalar, Estetika — vizual va atmosferadir."
              },
              {
                id: 3,
                question: "O'yin dizayneri kim?",
                options: [
                  "O'yin qoidalari, mexanikasi va tajribasini loyihalashtiruvchi muallif",
                  "Faqat monitor tozalovchi",
                  "Internet o'tkazuvchi",
                  "Faqat rasmlarni o'chiruvchi"
                ],
                correctAnswer: 0,
                explanation: "Game Designer o'yin konsepsiyasi va o'ynaluvchanligini (Gameplay) yaratadi."
              },
              {
                id: 4,
                question: "Player Retention nima?",
                options: [
                  "O'yinchining o'yinga qayta-qayta qarib o'ynash ko'rsatkichi",
                  "Klaviatura tugmasi",
                  "O'yinchining ismini o'chirish",
                  "Internet uzilishi"
                ],
                correctAnswer: 0,
                explanation: "Retention o'yinchilar loyihada qancha vaqt qolishini anglatadi."
              },
              {
                id: 5,
                question: "Geympley (Gameplay) nimani bildiradi?",
                options: [
                  "O'yinchi bilan o'yin o'rtasidagi interaktiv o'zaro ta'sir va tajriba",
                  "Faqat video pleyer",
                  "Monitor ravshanligi",
                  "Fayl hajmi"
                ],
                correctAnswer: 0,
                explanation: "Gameplay — o'yin jarayoni va undan olinadigan tajriba."
              }
            ]
          },
          {
            id: "gamedesign-lesson-2",
            title: "2-Dars: O'yinlardagi qiyinchilik va balans",
            duration: "19:30",
            video_url: "cloudflare://ab69aedc0e3f7adf434e9d8bd760c8b6",
            img: "/lesson2.png",
            quizzes: [
              {
                id: 1,
                question: "Flow State (Oqim holati) nima?",
                options: [
                  "O'yinchining qiyinchilik va mahorat o'rtasidagi mukammal muvozanatda o'yinga to'liq shumg'ishi",
                  "O'yindan chiqib ketish",
                  "Kompyuter qizib ketishi",
                  "Grafika buzilishi"
                ],
                correctAnswer: 0,
                explanation: "Flow State — o'yin juda qiyin ham, juda oson ham bo'lmagan optimal ruxiy holatdir."
              },
              {
                id: 2,
                question: "O'yin juda oson bo'lib qolsa nima sodir bo'ladi?",
                options: ["O'yinchi zerikib o'yindan chiqadi", "O'yinchi xursand bo meyorini yo'qotadi", "O'yin tezlashadi", "Internet o'chadi"],
                correctAnswer: 0,
                explanation: "Chaqiriq bo'lmasa o mezon zerikarli bo'lib qoladi."
              },
              {
                id: 3,
                question: "Difficulty Curve (Qiyinchilik egri chizig'i) nimani ko'rsatadi?",
                options: ["Bosqichma-bosqich qiyinchilikning oshib borishi", "Faqat narxlar jadvali", "O'yinchilar soni", "Server yuklamasi"],
                correctAnswer: 0,
                explanation: "Qiyinchilik egri chizig'i bosqichlar oshgani sari topshiriqlarni murakkablashtiradi."
              },
              {
                id: 4,
                question: "PVP o'yinlarda Game Balance nima uchun zarur?",
                options: ["Hamma ishtirokchilar teng va adolatli imkoniyatga ega bo'lishi uchun", "Faqat bitta personaj yutishi uchun", "O'yinni o'chirish uchun", "Pullarni yashirish uchun"],
                correctAnswer: 0,
                explanation: "Balans o'yin adolatliligini ta'minlaydi."
              },
              {
                id: 5,
                question: "Feedback Loop (Qaytargich aloqasi) nimani beradi?",
                options: ["O'yinchining harakatiga o'yindagi vizual va ovozli javob reaksiyasi", "Klaviatura ovozi", "Monitor nuri", "Kabel uzunligi"],
                correctAnswer: 0,
                explanation: "Feedback o'yinchiga bajargan amali haqida (zarba, yutuq) darhol signal beradi."
              }
            ]
          },
          {
            id: "gamedesign-lesson-3",
            title: "3-Dars: O'yinchini zeriktirmaslik siri - O'yin dizaynida ritm",
            duration: "21:15",
            video_url: "cloudflare://1ec8924aa82dbdba2a5b62e9b3a4e0a9",
            img: "/lesson3.png",
            quizzes: [
              {
                id: 1,
                question: "O'yin ritmi (Pacing) nima?",
                options: ["Shiiddatli harakatlar va dam olish (tinchlanish) daqiqalarining ketma-ket almashinuvi", "Faqat fon musiqasi", "Ekran miltillashi", "Pleyer o'chishi"],
                correctAnswer: 0,
                explanation: "Yaxshi ritm o'yinchiga janglardan so'ng dam olish va tayyorlanish imkonini beradi."
              },
              {
                id: 2,
                question: "Boss Fight (Asosiy dushman bilan jang) qaysi bosqichda qo'yiladi?",
                options: ["Kultminatsiya (Katta sinov) nuqtasida", "Har bir 1 soniyada", "Faqat menyuda", "Hech qachon"],
                correctAnswer: 0,
                explanation: "Boss fight modul oxiridagi sinov nuqtasidir."
              },
              {
                id: 3,
                question: "Reward System (Mukofotlash) nimani oshiradi?",
                options: ["Dopamin va o'ynash motivatsiyasini", "Kompyuter haroratini", "Kabel qarshiligini", "Xotira xatosini"],
                correctAnswer: 0,
                explanation: "Yaxshi mukofot tizimi o'yinchini ruhlantiradi."
              },
              {
                id: 4,
                question: "Level Design da 'Signposting' (Yo'l ko'rsatkichlar) nima uchun ishlatiladi?",
                options: ["O'yinchiga qayerga borish kerakligini yorug'lik va me'morchilik orqali sezdirish uchun", "Kodni berkitish uchun", "O'yinni sekinlashtirish uchun", "Faqat xarita o'chirish uchun"],
                correctAnswer: 0,
                explanation: "Signposting o'yinchini adashib qolishidan saqlaydi."
              },
              {
                id: 5,
                question: "Tabriklaymiz! O'yin dizayni kursi bo'yicha bilimlaringiz to'liq sinovdan o'tdi!",
                options: ["Sertifikat olishga tayyorman", "Qayta urinish", "Chiqib ketish", "Bekor qilish"],
                correctAnswer: 0,
                explanation: "Barakalla! Kursni tugatganingiz uchun sertifikatga ega bo'lasiz."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "gamedev-matematika",
    title: "O'yinlar matematika nazariyasi",
    subtitle: "3D fizika, Vektorlar va Burilishlar uchun zarur bo'lgan amaliy matematika",
    category: "MATEMATIKA",
    level: "O'rta",
    cover_img: "/math_lesson1.png",
    description: "3D o'yin fizikasi va harakatlarini hisoblash uchun zarur bo'lgan vektorlar, matritsalar, sinus to'lqinlari va kvaternionlar nazariyasi.",
    whatYouWillLearn: [
      "Vektorlar: Qo'shish, ayirish va Dot/Cross Product (Skalyar va Vektor ko'paytma)",
      "Sinus to'lqinlari yordamida tebranish va suzish harakatlarini yaratish",
      "Fizik kuchlar, tezlanish va ishqalanish formulalari",
      "Matritsalar va Kvaternionlar bilan 3D ob'ektlarni burish hamda transformatsiya qilish"
    ],
    total_lessons: 5,
    total_duration: "1 soat 40 daqiqa",
    mentor_name: "Uz1games",
    mentor_title: "Math & Physics Engine Developer",
    mentor_avatar: "/images/lessons/gamemath.png",
    modules: [
      {
        id: "math-mod-1",
        title: "1-Modul: Vektorlar va Fizika",
        lessons: [
          {
            id: "math-lesson-1",
            title: "1-Dars: Vektorlar",
            duration: "16:40",
            video_url: "cloudflare://0227f4416dad7974318007a77d7c85db",
            img: "/math_lesson1.png",
            quizzes: [
              {
                id: 1,
                question: "Vektor nima?",
                options: ["Yo'nalish va kattalikka (Uzunlikka) ega bo'lgan miqdor", "Faqat bitta son", "O'yin nomi", "Rang kodi"],
                correctAnswer: 0,
                explanation: "Vektor yo'nalish hamda uzunlikka ega."
              },
              {
                id: 2,
                question: "Vector3(0, 1, 0) nimani anglatadi?",
                options: ["Yuqoriga qaragan birlik vektor", "Pastga qaragan vektor", "O'ngga qaragan vektor", "Orqaga qaragan vektor"],
                correctAnswer: 0,
                explanation: "Y o'qi bo'yicha +1 bu yuqoriga yo'nalgan vektordir."
              },
              {
                id: 3,
                question: "Skalyar ko'paytma (Dot Product) qiymati 0 bo'lsa, ikki vektor o'rtasidagi burchak necha daraja?",
                options: ["90 daraja (Perpendikulyar)", "0 daraja", "180 daraja", "45 daraja"],
                correctAnswer: 0,
                explanation: "Dot product 0 bo'lsa, vektorlar o'zaro perpendikulyardir."
              },
              {
                id: 4,
                question: "Vektorni Normallashtirish (Normalize) nimani bildiradi?",
                options: ["Vektor yo'nalishini saqlab, uzunligini 1 ga keltirish", "Vektorni o'chirish", "Vektorni 10 ga ko'paytirish", "Vektorni qarama-qarshi qilish"],
                correctAnswer: 0,
                explanation: "Normalized Vector — uzunligi 1 bo'lgan birlik vektordir."
              },
              {
                id: 5,
                question: "Vektorlar ayirmasi (B - A) nimani beradi?",
                options: ["A nuqtadan B nuqtaga yo'nalgan vektorni", "Nuqtalar yig'indisini", "Faqat nolni", "Burchak kvadratini"],
                correctAnswer: 0,
                explanation: "B - A bu A dan B ga intiluvchi vektordir."
              }
            ]
          },
          {
            id: "math-lesson-2",
            title: "2-Dars: Sinus to'lqinlari",
            duration: "14:50",
            video_url: "cloudflare://33972dbb7e690eb5e9bcf31f6e3f408a",
            img: "/math_lesson2.png",
            quizzes: [
              {
                id: 1,
                question: "Math.sin(time) funksiyasi qiymatlari qaysi oraliqda tebranadi?",
                options: ["-1 va +1 oraliqida", "0 va 100 oraliqida", "-10 va +10", "Faqat musbat sonlar"],
                correctAnswer: 0,
                explanation: "Sinus to'lqin qiymatlari -1 va +1 orasida silliq harakat qiladi."
              },
              {
                id: 2,
                question: "O'yinda suzuvchi tilla tanga tebranishi (Floating Coin) uchun qaysi funksiya qo'llaniladi?",
                options: ["Sinus to'lqini (Sin Wave)", "Faqat tasodifiy son", "Logarifm", "Kvadrat tenglama"],
                correctAnswer: 0,
                explanation: "Sinus to'lqini yuqori-pastga silliq tebranish beradi."
              },
              {
                id: 3,
                question: "Sinus to'lqinining Amplitudasi nimani belgilaydi?",
                options: ["Tebranish balandligini (ko'lamini)", "Tebranish tezligini", "Rangini", "Fayl hajmini"],
                correctAnswer: 0,
                explanation: "Amplituda tebranishning eng yuqori nuqtasini belgilaydi."
              },
              {
                id: 4,
                question: "Chastota (Frequency) ko'paytirilsa tebranish qanday o'zgaradi?",
                options: ["Tebranish tezlashadi", "Tebranish to'xtaydi", "Balandlik kamayadi", "Ob'ekt yo'qoladi"],
                correctAnswer: 0,
                explanation: "Chastota soniyadagi tebranishlar sonini oshiradi."
              },
              {
                id: 5,
                question: "Lerp (Linear Interpolation) nimaga xizmat qiladi?",
                options: ["Ikki qiymat o'rtasida silliq o'tishni ta'minlash", "O'yinni yopish", "Rasm chizish", "Kodni o'chirish"],
                correctAnswer: 0,
                explanation: "Lerp ikki nuqta o'rtasida silliq oraliq qiymat beradi."
              }
            ]
          },
          {
            id: "math-lesson-3",
            title: "3-Dars: Kuchlar",
            duration: "18:20",
            video_url: "cloudflare://8bbc33cdd5bee21c5ff6f3952cd5dd1c",
            img: "/math_lesson3.png",
            quizzes: [
              {
                id: 1,
                question: "Nyutonning 2-qonuni (F = m * a) o'yin fizikasida nimani bildiradi?",
                options: ["Kuch = Massa * Tezlanish", "Tezlik = Vaqt / Masofa", "Massa = Kuch * Vaqt", "Energiya = 0"],
                correctAnswer: 0,
                explanation: "F = m * a ob'ektga berilgan kuch uning massasi va tezlanishiga bog'liqligini ko'rsatadi."
              },
              {
                id: 2,
                question: "Gravitatsiya (Tortishish kuchi) tezlanishi Yerra nanchaga teng?",
                options: ["~9.81 m/s² (vektor boyicha -9.81 Y)", "0 m/s²", "100 m/s²", "1 m/s²"],
                correctAnswer: 0,
                explanation: "Er gravitatsiyasi taxminan 9.81 m/s² pastga tortadi."
              },
              {
                id: 3,
                question: "Friction (Ishqalanish kuchi) ob'ekt harakatiga qanday ta'sir qiladi?",
                options: ["Harakatga qarama-qarshi yo'nalib, sekinlashtiradi", "Harakatni tezlashtiradi", "Ob'ektni uchirib yuboradi", "Ta'sir qilmaydi"],
                correctAnswer: 0,
                explanation: "Ishqalanish harakatni sekinlashtiruvchi kuchdir."
              },
              {
                id: 4,
                question: "Impulse (Impuls kuchi) o'yinda qachon qo'llaniladi?",
                options: ["Sakrash yoki portlash kabi oniy va kuchli harakatlarda", "Doimiy shamolda", "O'yin to'xtaganda", "Faqat sozlamalarda"],
                correctAnswer: 0,
                explanation: "Impuls qisqa vaqt ichida kuchli turtki beradi."
              },
              {
                id: 5,
                question: "Drag (Havo qarshiligi) oshirilsa nima bo'ladi?",
                options: ["Ob'ekt havodagi harakati sekinlashadi", "Ob'ekt yo'qoladi", "Massa oshadi", "Gravitatsiya yo'qoladi"],
                correctAnswer: 0,
                explanation: "Drag muhit qarshiligidir."
              }
            ]
          },
          {
            id: "math-lesson-4",
            title: "4-Dars: Matritsalar va Transformatsiyalar",
            duration: "23:10",
            video_url: "cloudflare://1169039cd2c13e50abd86b6fd073bbe6",
            img: "/lesson4.png",
            quizzes: [
              {
                id: 1,
                question: "3D grafikada 4x4 Matritsa nimani o'zida saqlaydi?",
                options: ["Position (Joylashuv), Rotation (Burilish) va Scale (O'lcham)", "Faqat rang kodi", "Ovoz fayli", "Faqat matn"],
                correctAnswer: 0,
                explanation: "4x4 Matrix barcha 3D transformatsiyalarni o'z ichiga oladi."
              },
              {
                id: 2,
                question: "Identity Matrix (Birlik matritsa) nima?",
                options: ["Ob'ektni o'zgartirmasdan saqlovchi neytral matritsa", "Nol matritsa", "Teskari matritsa", "Buzilgan matritsa"],
                correctAnswer: 0,
                explanation: "Birlik matritsaga ko'paytirilganda ob'ekt o'zgarmaydi."
              },
              {
                id: 3,
                question: "Ob'ektni kattalashtirish yoki kichraytirish nima deyiladi?",
                options: ["Scaling", "Translation", "Rotation", "Shearing"],
                correctAnswer: 0,
                explanation: "Scale — o'lchamni o'zgartirishdir."
              },
              {
                id: 4,
                question: "Translation transformatsiyasi nimani o'zgartiradi?",
                options: ["Ob'ektning fazodagi o'rnini (Position)", "Rangini", "Formasini", "Ovozini"],
                correctAnswer: 0,
                explanation: "Translation — surilish va ko'chishdir."
              },
              {
                id: 5,
                question: "Matrix Multiplication (Matritsalarni ko'paytirish) tartibi muhimmi?",
                options: ["Ha, A * B har doim ham B * A ga teng emas", "Yo'q, tartib mutlaqo muhim emas", "Faqat 2D da muhim", "Hech qachon ko'paytirib bo'lmaydi"],
                correctAnswer: 0,
                explanation: "Matritsalarni ko'paytirish kommutativ emas."
              }
            ]
          },
          {
            id: "math-lesson-5",
            title: "5-Dars: Kvaternionlar va Burilishlar",
            duration: "27:00",
            video_url: "cloudflare://e0109c50de2878ec123c4779264d13aa",
            img: "/lesson5.png",
            quizzes: [
              {
                id: 1,
                question: "Gimbal Lock (O'qlar qulflanishi) muammosini hal qilish uchun 3D o'yinlarda nima ishlatiladi?",
                options: ["Quaternion (Kvaternion)", "Euler Angles", "String", "Int"],
                correctAnswer: 0,
                explanation: "Kvaternionlar 4 ta komponent (X, Y, Z, W) bilan Gimbal Lock siz burilish beradi."
              },
              {
                id: 2,
                question: "Quaternion.Slerp nimani ta'minlaydi?",
                options: ["Ikki burilish o'rtasida sferik silliq burilishni", "O'yinni to'xtatishni", "Faqat rang o'zgarishini", "Grafikani o'chirishni"],
                correctAnswer: 0,
                explanation: "Slerp (Spherical Linear Interpolation) silliq burilish ta'minlaydi."
              },
              {
                id: 3,
                question: "Euler burchaklari (Euler Angles) necha o'q bo'yicha burilishni o'lchaydi?",
                options: ["3 ta o'q (X, Y, Z - Pitch, Yaw, Roll)", "1 ta o'q", "10 ta o'q", "5 ta o'q"],
                correctAnswer: 0,
                explanation: "Euler burchaklari X, Y, Z o'qlari boyicha burilishdir."
              },
              {
                id: 4,
                question: "Quaternion.Identity nimani anglatadi?",
                options: ["Hech qanday burilishsiz holat (0 daraja)", "180 daraja teskari", "360 daraja to'liq burilish", "Noma'lum burilish"],
                correctAnswer: 0,
                explanation: "Quaternion Identity bu boshlang'ich burilmagan holatdir."
              },
              {
                id: 5,
                question: "Tabriklaymiz! Matematika nazariyasi kursi boyicha barcha testlarni a'lo topshirdingiz!",
                options: ["Sertifikatni yuklab olish", "Qayta urinish", "Bosh sahifa", "Yopish"],
                correctAnswer: 0,
                explanation: "Barakalla! Sertifikatingiz tayyor."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "blender-3d-boshlangich",
    title: "Blender 3D boshlang'ich darslari",
    subtitle: "Low-poly va High-poly 3D modellashtirish, tekstura hamda renderlash",
    category: "BLENDER 3D",
    level: "Boshlang'ich",
    cover_img: "/lesson6.png",
    description: "O'yinlar uchun 3D ob'ektlar, atributlar va personajlar modelini Blender dasturida noldan modellashtirish va Unity/Unreal Engine ga eksport qilish.",
    whatYouWillLearn: [
      "Blender 3D interfeysi va asosiy navigation (Boshqaruv) sirlari",
      "Extrude, Inset, Bevel va Loop Cut yordamida 3D modellashtirish",
      "UV Unwrapping (UV yoyish) va Tekstura chizish",
      "Lighting, Materials va Cycles/EEVEE renderlash hamda FBX eksport"
    ],
    total_lessons: 4,
    total_duration: "1 soat 35 daqiqa",
    mentor_name: "Uz1games",
    mentor_title: "3D Artist & Modeler",
    mentor_avatar: "/images/lessons/blender3d.png",
    modules: [
      {
        id: "blender-mod-1",
        title: "1-Modul: Modellashtirish va Renderlash",
        lessons: [
          {
            id: "blender-lesson-1",
            title: "1-Dars: Ishni boshlash",
            duration: "18:00",
            video_url: "cloudflare://5b0c2021a67c417f07426e7e11ede44c",
            img: "/lesson1.png",
            quizzes: [
              {
                id: 1,
                question: "Blender dasturida Edit Mode (Tahrirlash rejimi) ga o'tish uchun qaysi tugma bosiladi?",
                options: ["Tab", "Space", "Shift + A", "F12"],
                correctAnswer: 0,
                explanation: "Tab tugmasi Object Mode va Edit Mode o'rtasida o'tkazadi."
              },
              {
                id: 2,
                question: "Yangi 3D mesh (Model) qo'shish uchun hotkey qaysi?",
                options: ["Shift + A", "Ctrl + Z", "Alt + P", "Ctrl + S"],
                correctAnswer: 0,
                explanation: "Shift + A menyusi orqali kub, sfera va boshqa shakllar qo'shiladi."
              },
              {
                id: 3,
                question: "3D fazoda ko'rinishni aylantirish uchun mishkaning qaysi tugmasi ishlatiladi?",
                options: ["Middle Mouse Button (G'ildirakcha bosib)", "Chap tugma", "O'ng tugma", "Scroll faqat"],
                correctAnswer: 0,
                explanation: "G'ildirakchani bosib ushlab harakatlantirish ko'rinishni aylantiradi."
              },
              {
                id: 4,
                question: "G tugmasi Blenderda qaysi amalni bajaradi?",
                options: ["Grab / Move (Joyini ko'chirish)", "Rotate", "Scale", "Delete"],
                correctAnswer: 0,
                explanation: "G - Grab (Ko'chirish), R - Rotate (Burish), S - Scale (Kattalashtirish)."
              },
              {
                id: 5,
                question: "Vertex, Edge va Face nimani bildiradi?",
                options: ["Nuqta, Qirra (Liniya) va Yutza (Poligon)", "Ranglar", "Ovozlar", "Teksturalar"],
                correctAnswer: 0,
                explanation: "3D model 3 elementdan: Nuqtalar (Vertex), Qirralar (Edge) va Yuzalardan (Face) tashkil topadi."
              }
            ]
          },
          {
            id: "blender-lesson-2",
            title: "2-Dars: Modellashtirish",
            duration: "25:30",
            video_url: "cloudflare://76f2a4f0cc7fb9a948afc70a0878b634",
            img: "/lesson2.png",
            quizzes: [
              {
                id: 1,
                question: "Extrude (E tugmasi) amali nimani bajaradi?",
                options: ["Yuzani yoki nuqtani tortib yangi shakl chiqarish", "O'chirish", "Rang berish", "Saqlash"],
                correctAnswer: 0,
                explanation: "Extrude yuzalarni cho'zib yangi hajm hosil qiladi."
              },
              {
                id: 2,
                question: "Loop Cut (Ctrl + R) nima uchun kerak?",
                options: ["Model yuzasini kesib, yangi qirralar qatori qo'shish uchun", "Modelni yo'qotish uchun", "Kamerani aylantirish uchun", "Render qilish uchun"],
                correctAnswer: 0,
                explanation: "Loop Cut geometriyani bo'lish uchun ishlatiladi."
              },
              {
                id: 3,
                question: "Bevel (Ctrl + B) nimaga xizmat qiladi?",
                options: ["Otkir qirralarni yumaloqlash va burchaklarni tekislash", "Modelni o'chirish", "Ovoz berish", "Skript yozish"],
                correctAnswer: 0,
                explanation: "Bevel o'tkir qirralarga qiya burchaklar qo'shadi."
              },
              {
                id: 4,
                question: "Subdivision Surface Modifier nimani ta'minlaydi?",
                options: ["Model poligonlarini ko'paytirib, silliq va yumshoq shaklga keltirish", "Modelni kichraytirish", "Faqat rangini o'zgartirish", "Fayl hajmini kamaytirish"],
                correctAnswer: 0,
                explanation: "Subdivision Surface modelni silliqlashtiradi."
              },
              {
                id: 5,
                question: "Low-Poly model va High-Poly model farqi nima?",
                options: ["Low-Poly — kam poligonli (o'yinlar uchun), High-Poly — ko'p poligonli batafsil model", "Farqi yo'q", "Low-poly bu faqat rasmlar", "High-poly bu matnlar"],
                correctAnswer: 0,
                explanation: "Low-Poly o'yinlarda tez ishlash uchun optimallashgan modeldir."
              }
            ]
          },
          {
            id: "blender-lesson-3",
            title: "3-Dars: Teksturalash",
            duration: "22:10",
            video_url: "cloudflare://8c56cac167674a20bfa02ff8193f82c6",
            img: "/lesson3.png",
            quizzes: [
              {
                id: 1,
                question: "UV Unwrapping (UV Yoyish) nima?",
                options: ["3D model yuzasini 2D tekislikka yoyib rasm teksturasi joylashtirish", "Modelni sindirish", "Render qilish", "Eksport qilish"],
                correctAnswer: 0,
                explanation: "UV Unwrapping 3D yuzaga 2D rasm o'rnatish imkonini beradi."
              },
              {
                id: 2,
                question: "Principled BSDF materiali nimani o'z ichiga oladi?",
                options: ["Color, Roughness, Metallic, Normal Map kabi barcha asosiy xossalarni", "Faqat ovoz", "Faqat matn", "Hech narsani"],
                correctAnswer: 0,
                explanation: "Principled BSDF zamonaviy PBR material shaklidir."
              },
              {
                id: 3,
                question: "Normal Map nimani ta'minlaydi?",
                options: ["Kam poligonli modelda sun'iy chuqurlik va qabariqlik tasvirini yaratish", "Rangni o'chirish", "Kamerani burish", "Faylni siqish"],
                correctAnswer: 0,
                explanation: "Normal map yorug'lik qaytishini o'zgartirib botiqlik va qabariqlik beradi."
              },
              {
                id: 4,
                question: "Texture Paint rejimida nima qilinadi?",
                options: ["Model yuzasiga mo'yqalam bilan bevosita rasm chiziladi", "Model o'chiriladi", "Kod yoziladi", "Internetga joylanadi"],
                correctAnswer: 0,
                explanation: "Texture Paint 3D modelga to'g'ridan-to'g'ri bo'yoq berishdir."
              },
              {
                id: 5,
                question: "Roughness qiymati 0 bo'lsa material qanday ko'rinadi?",
                options: ["Oyna kabi yaltiroq va aks ettiruvchi", "G'adir-budur va xira", "Qop-qora", "Shaffof"],
                correctAnswer: 0,
                explanation: "Roughness 0 bo'lsa sirt to'liq ko'zgudek yaltiraydi."
              }
            ]
          },
          {
            id: "blender-lesson-4",
            title: "4-Dars: Renderlash va eksport qilish",
            duration: "29:45",
            video_url: "cloudflare://a6e6fc85cde93d340b7558156f1d7a41",
            img: "/lesson6.png",
            quizzes: [
              {
                id: 1,
                question: "O'yin dvigatellariga (Unity/Unreal) 3D modelni o'tkazish uchun eng mashhur tayyor format qaysi?",
                options: [".FBX yoki .OBJ", ".txt", ".mp3", ".doc"],
                correctAnswer: 0,
                explanation: "FBX va OBJ formatlari 3D mesh va teksturalarni o'zida saqlaydi."
              },
              {
                id: 2,
                question: "Blenderdagi Real-Time (Real vaqtdagi) render dvigateli qaysi?",
                options: ["EEVEE", "Cycles", "Raytracer", "Photoshop"],
                correctAnswer: 0,
                explanation: "EEVEE juda tezkor real-time render motoridir."
              },
              {
                id: 3,
                question: "F12 tugmasi Blenderda qaysi amalni bajaradi?",
                options: ["Render Image (Kadrni rasmgacha render qilish)", "Dasturdan chiqish", "Modelni o'chirish", "Saqlash"],
                correctAnswer: 0,
                explanation: "F12 joriy kamera ko'rinishidan render tayyorlaydi."
              },
              {
                id: 4,
                question: "Eksport qilishdan oldin 'Apply Transformations' (Ctrl + A) nima uchun qilinadi?",
                options: ["Modelning Scale (1,1,1) va Rotation qiymatlarini normallashtirish uchun", "Faylni o'chirish uchun", "Ranglarni o'chirish uchun", "Internetni yoqish uchun"],
                correctAnswer: 0,
                explanation: "Transformatsiyalarni qo'llash o'yin dvigatellarida model o'lchamini buzilishidan saqlaydi."
              },
              {
                id: 5,
                question: "Tabriklaymiz! Blender 3D kursi bo'yicha barcha modullarni muvaffaqiyatli yakunladingiz!",
                options: ["Sertifikatni olish", "Qayta urinish", "Bosh sahifa", "Yopish"],
                correctAnswer: 0,
                explanation: "Barakalla! Sertifikat sizga taqdim etildi."
              }
            ]
          }
        ]
      }
    ]
  }
];
