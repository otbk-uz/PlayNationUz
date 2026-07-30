"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { BackButton } from "@/components/ui/BackButton";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { COURSES, Course } from "@/lib/coursesData";
import { 
  Play, CheckCircle, Clock, BookOpen, Award, Star, MessageSquare, 
  User, ChevronRight, Lock, Sparkles, Layers, Send, Check
} from "lucide-react";
import Link from "next/link";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"Tafsilot" | "Modullar" | "Sharhlar" | "Mentor">("Tafsilot");
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const courseId = params.id as string;
  const course: Course = COURSES.find((c) => c.id === courseId) || COURSES[0];

  useEffect(() => {
    setMounted(true);
    fetchProgress();
    fetchReviews();
  }, [courseId, user]);

  const fetchProgress = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("user_course_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .eq("course_id", course.id);

      if (data) {
        const progMap: Record<string, boolean> = {};
        data.forEach(item => {
          progMap[item.lesson_id] = item.completed;
        });
        setUserProgress(progMap);
      }
    } catch (e) {
      console.warn("Progress load warning:", e);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from("course_reviews")
        .select("*, profiles:user_id(username, full_name, avatar_url)")
        .eq("course_id", course.id)
        .order("created_at", { ascending: false });

      if (data) setReviews(data);
    } catch (e) {
      console.warn("Reviews load warning:", e);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !user) return;

    setSubmittingReview(true);
    try {
      const { data, error } = await supabase
        .from("course_reviews")
        .insert({
          course_id: course.id,
          user_id: user.id,
          rating: newRating,
          comment: newReview.trim()
        })
        .select("*, profiles:user_id(username, full_name, avatar_url)")
        .single();

      if (error) throw error;
      setReviews(prev => [data, ...prev]);
      setNewReview("");
    } catch (err: any) {
      console.error("Post review error:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!mounted) return null;

  const allLessons = course.modules.flatMap(m => m.lessons);
  const completedCount = Object.values(userProgress).filter(Boolean).length;
  const isCourseFinished = completedCount >= course.total_lessons;
  const firstLessonId = allLessons[0]?.id || "gamedev-lesson-1";

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-20 max-w-7xl">
        <div className="mb-4">
          <BackButton />
        </div>

        {/* Hero Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-[#14141c] border border-white/10 p-6 md:p-10 mb-8 shadow-2xl">
          {/* Background Cover Image with Gradient Overlay */}
          <div className="absolute inset-0 -z-10">
            <img 
              src={course.cover_img} 
              alt={course.title} 
              className="w-full h-full object-cover opacity-25 filter blur-sm" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent" />
          </div>

          <div className="max-w-2xl space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-red-600/90 text-white font-mono text-[11px] font-black uppercase tracking-wider shadow">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-md bg-white/10 text-white font-mono text-[11px] font-bold uppercase tracking-wider border border-white/10">
                {course.level}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black text-white leading-tight uppercase tracking-tight">
              {course.title}
            </h1>

            <p className="text-secondary text-sm sm:text-base leading-relaxed">
              {course.subtitle}
            </p>

            <div className="flex items-center gap-6 text-xs font-mono font-bold text-white/80 pt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-amber-400">
                <BookOpen size={15} />
                <span>DARSLAR: {course.total_lessons}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Clock size={15} />
                <span>DAVOMIYLIGI: {course.total_duration}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-violet-400">
                <Award size={15} />
                <span>SERTIFIKAT: Avtomatik</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Tabs Content (2 cols) & Right Progress Sidebar (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Tabs & Tab Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs Header Navigation Bar */}
            <div className="flex border-b border-white/10 gap-2 sm:gap-8 overflow-x-auto no-scrollbar pb-1">
              {(["Tafsilot", "Modullar", "Sharhlar", "Mentor"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab 
                      ? "text-red-500 border-red-500 font-black" 
                      : "text-secondary border-transparent hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB 1: Tafsilot */}
            {activeTab === "Tafsilot" && (
              <div className="space-y-8">
                {/* Bu kurs haqida */}
                <div className="space-y-3">
                  <h3 className="font-display text-xl font-bold text-white uppercase tracking-tight">
                    Bu kurs haqida
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed font-sans">
                    {course.description}
                  </p>
                </div>

                {/* Siz nimani o'rganasiz */}
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-white uppercase tracking-tight">
                    Siz nimani o'rganasiz
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.whatYouWillLearn.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-[#14141c] border border-white/10 rounded-xl p-3.5">
                        <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-white/90 leading-normal">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificate Preview Card */}
                <div className="bg-gradient-to-r from-amber-950/30 via-[#181824] to-[#14141c] border border-amber-500/30 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Award size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider">
                        TUGATGANINGIZDA
                      </span>
                      <h4 className="font-display text-base font-bold text-white">
                        Shunday sertifikat olasiz
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-secondary leading-relaxed">
                    Ushbu kursdagi barcha darslarni ko'rib, har bir dars so'ngidagi 5 talik bilimni tekshirish testlarini 100% topshirganingizda, sizga rasmiy Maroqli Academy sertifikati taqdim etiladi.
                  </p>

                  <div className="bg-black/60 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Sparkles size={20} className="text-amber-400" />
                      <div>
                        <div className="font-bold text-xs text-white">
                          {user?.full_name || user?.username || "Foydalanuvchi Ismi"}
                        </div>
                        <div className="text-[10px] text-secondary font-mono">{course.title} Sertifikati</div>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/darslar/certificate/${course.id}`)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl uppercase transition-colors"
                    >
                      Namuna ko'rish
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Modullar */}
            {activeTab === "Modullar" && (
              <div className="space-y-6">
                {course.modules.map((mod, mIdx) => (
                  <div key={mod.id} className="bg-[#14141c] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex items-center justify-between">
                      <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                        {mod.title}
                      </h4>
                      <span className="text-xs font-mono text-secondary font-bold">
                        {mod.lessons.length} dars
                      </span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {mod.lessons.map((lesson, lIdx) => {
                        const isCompleted = userProgress[lesson.id];
                        return (
                          <div 
                            key={lesson.id}
                            onClick={() => router.push(`/darslar/${lesson.id}`)}
                            className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between gap-4 transition-colors group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                isCompleted 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                  : "bg-white/10 text-white border border-white/10 group-hover:bg-red-600 group-hover:text-white"
                              }`}>
                                {isCompleted ? <Check size={14} /> : <Play size={12} className="ml-0.5 fill-current" />}
                              </div>

                              <div className="min-w-0">
                                <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                                  {lesson.title}
                                </h5>
                                <div className="flex items-center gap-3 text-[11px] text-secondary font-mono mt-0.5">
                                  <span>{lesson.duration}</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-semibold">5 ta test mavjud</span>
                                </div>
                              </div>
                            </div>

                            <button className="px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-red-600 text-white text-xs font-bold transition-all shrink-0">
                              Ochish
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Sharhlar */}
            {activeTab === "Sharhlar" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-display text-xl font-bold text-white uppercase tracking-tight">
                    Talabalar sharhlari ({reviews.length})
                  </h3>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-base">
                    <Star size={18} className="fill-current" />
                    <span>4.9</span>
                    <span className="text-xs text-secondary font-normal">(48 baho)</span>
                  </div>
                </div>

                {/* Post Review Form */}
                {isAuthenticated && user ? (
                  <form onSubmit={handlePostReview} className="bg-[#14141c] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Bahoyingizni tanlang:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star 
                              size={18} 
                              className={star <= newRating ? "text-amber-400 fill-current" : "text-white/20"} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="Kurs haqida fikringizni yozing..."
                      rows={3}
                      required
                      className="w-full bg-[#181822] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 placeholder:text-secondary"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                      >
                        Sharh qoldirish
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4 bg-[#14141c] border border-white/10 rounded-2xl">
                    <p className="text-secondary text-xs">
                      Sharh qoldirish uchun iltimos <Link href="/login" className="text-red-400 font-bold hover:underline">tizimga kiring</Link>.
                    </p>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-center text-secondary text-xs py-8">Ushbu kursga hali sharhlar qoldirilmagan.</p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="bg-[#14141c] border border-white/10 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/10 text-xs font-bold text-white flex items-center justify-center uppercase">
                              {rev.profiles?.username?.[0] || "U"}
                            </div>
                            <span className="font-bold text-xs text-white">@{rev.profiles?.username || "talaba"}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={14} className="text-amber-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed font-sans">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Mentor */}
            {activeTab === "Mentor" && (
              <div className="bg-[#14141c] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-violet-600 p-0.5 shadow-lg shrink-0">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-white text-xl uppercase">
                      {course.mentor_name[0]}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold text-white uppercase">{course.mentor_name}</h4>
                    <p className="text-xs text-red-400 font-mono font-bold">{course.mentor_title}</p>
                    <p className="text-xs text-secondary mt-1">Maroqli Platformasi Bosh O'qituvchisi</p>
                  </div>
                </div>

                <p className="text-xs text-secondary leading-relaxed font-sans border-t border-white/10 pt-4">
                  O'yin yaratish, 3D modellashtirish va C# skripting bo'yicha ko'p yillik amaliy tajribaga ega mutaxassis. Maroqli platformasida gamedev hamjamiyatini rivojlantirishga hissa qo'shib kelmoqda.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Progress & CTA Orange Sidebar (1 col) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#14141c] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 sticky top-24">
              
              {/* Course Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-secondary font-bold">
                  <span>Sizning progressingiz</span>
                  <span className="text-amber-400 font-bold">{completedCount} / {course.total_lessons}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.round((completedCount / course.total_lessons) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Orange Main CTA Button matching reference screenshot */}
              <button
                onClick={() => router.push(`/darslar/${firstLessonId}`)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all transform hover:scale-[1.02]"
              >
                <span>{completedCount > 0 ? "Davom ettirish" : "Boshlash"}</span>
                <ChevronRight size={18} />
              </button>

              {/* Course Features Info List */}
              <div className="space-y-4 pt-2 border-t border-white/10 text-xs text-white/90">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-secondary">
                    <BookOpen size={16} className="text-orange-400" />
                    <span>Darslar</span>
                  </span>
                  <span className="font-bold font-mono">{course.total_lessons}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-secondary">
                    <Clock size={16} className="text-orange-400" />
                    <span>Davomiyligi</span>
                  </span>
                  <span className="font-bold font-mono">{course.total_duration}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-secondary">
                    <Award size={16} className="text-orange-400" />
                    <span>Sertifikat</span>
                  </span>
                  <span className="font-bold font-mono text-emerald-400">Avtomatik</span>
                </div>
              </div>

              {/* Certificate Download CTA if finished */}
              {isCourseFinished && (
                <div className="pt-2">
                  <button
                    onClick={() => router.push(`/darslar/certificate/${course.id}`)}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Award size={16} />
                    <span>Sertifikatni olish</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
