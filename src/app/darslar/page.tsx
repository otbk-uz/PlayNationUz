"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Search, X, BookOpen, Clock, Award, Filter, ChevronDown, UserCheck, Play, CheckCircle, GraduationCap, Bookmark, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { BackButton } from "@/components/ui/BackButton";
import { COURSES, Course } from "@/lib/coursesData";

export default function DarslarCatalogPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeCatalogTab, setActiveCatalogTab] = useState<"Davom etayotgan" | "Yakunlangan" | "Saqlanganlar" | "Katalog">("Katalog");
  const [selectedLevel, setSelectedLevel] = useState<string>("Barcha darajalar");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [savedCourseIds, setSavedCourseIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchUserProgress();
    loadSavedCourses();
  }, [user]);

  const loadSavedCourses = () => {
    if (typeof window !== "undefined") {
      try {
        const localSaved = localStorage.getItem("maroqli_saved_courses");
        if (localSaved) {
          setSavedCourseIds(JSON.parse(localSaved));
        }
      } catch (e) {
        console.warn("Failed to load saved courses from localStorage", e);
      }
    }
  };

  const toggleSaveCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    let updated: string[];
    if (savedCourseIds.includes(courseId)) {
      updated = savedCourseIds.filter(id => id !== courseId);
    } else {
      updated = [...savedCourseIds, courseId];
    }
    setSavedCourseIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("maroqli_saved_courses", JSON.stringify(updated));
    }
  };

  const fetchUserProgress = async () => {
    // 1. Load from localStorage first
    let localCounts: Record<string, number> = {};
    if (typeof window !== "undefined") {
      try {
        const localProg = localStorage.getItem("maroqli_course_progress");
        if (localProg) {
          localCounts = JSON.parse(localProg);
        }
      } catch (e) {}
    }

    if (!user) {
      setUserProgress(localCounts);
      return;
    }

    // 2. Load from Supabase if logged in
    try {
      const { data } = await supabase
        .from("user_course_progress")
        .select("course_id, lesson_id, completed")
        .eq("user_id", user.id)
        .eq("completed", true);

      if (data) {
        const counts: Record<string, number> = { ...localCounts };
        data.forEach(item => {
          counts[item.course_id] = Math.max(counts[item.course_id] || 0, (counts[item.course_id] || 0) + 1);
        });
        setUserProgress(counts);
      } else {
        setUserProgress(localCounts);
      }
    } catch (e) {
      console.warn("Progress load warning:", e);
      setUserProgress(localCounts);
    }
  };

  if (!mounted) return null;

  // Calculate user course stats
  const ongoingCourses = COURSES.filter(c => (userProgress[c.id] || 0) > 0 && (userProgress[c.id] || 0) < c.total_lessons);
  const completedCourses = COURSES.filter(c => (userProgress[c.id] || 0) >= c.total_lessons);
  const savedCourses = COURSES.filter(c => savedCourseIds.includes(c.id));

  // Filter courses by Level and Search Query
  const filteredCourses = COURSES.filter(course => {
    const matchesLevel = selectedLevel === "Barcha darajalar" || course.level === selectedLevel;
    const matchesSearch = !searchQuery.trim() || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getDisplayedCourses = () => {
    if (activeCatalogTab === "Davom etayotgan") return ongoingCourses;
    if (activeCatalogTab === "Yakunlangan") return completedCourses;
    if (activeCatalogTab === "Saqlanganlar") return savedCourses;
    return filteredCourses;
  };

  const displayedList = getDisplayedCourses();

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white relative overflow-hidden font-sans">
      <Navbar />

      {/* Official Maroqli Header Glow Effect (Red & Violet) */}
      <div className="absolute inset-x-0 top-0 h-[450px] -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(239,68,68,0.2),transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 h-[450px] -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.18),transparent_60%)]" />

      <div className="container-app pt-28 pb-24 relative z-10">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Top Header Section */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 mb-4"
          >
            <GraduationCap size={16} />
            <span className="font-display font-black uppercase tracking-[0.2em] text-[11px]">
              MAROQLI ACADEMY • TA'LIM KATALOGI
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.05] uppercase"
          >
            Barcha <span className="text-red-500">Kurslar</span>
          </motion.h1>
        </div>

        {/* Top Navigation Tabs matching official Maroqli theme */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar gap-8">
          {[
            { id: "Davom etayotgan", label: `Davom etayotgan`, count: ongoingCourses.length },
            { id: "Yakunlangan", label: `Yakunlangan`, count: completedCourses.length },
            { id: "Saqlanganlar", label: `Saqlanganlar`, count: savedCourses.length },
            { id: "Katalog", label: `Katalog`, count: COURSES.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCatalogTab(tab.id as any)}
              className={`py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeCatalogTab === tab.id
                  ? "text-red-500 border-red-500 font-black"
                  : "text-secondary border-transparent hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-xs font-mono font-normal opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search & Level Filter Bar */}
        {activeCatalogTab === "Katalog" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 w-full max-w-md">
              <div className="absolute left-4 text-secondary pointer-events-none">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kurs nomi bo'yicha qidirish..."
                className="w-full bg-[#14141c] border border-white/10 rounded-2xl py-3 pl-11 pr-10 text-xs sm:text-sm text-white placeholder:text-secondary/70 focus:outline-none focus:border-red-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-4 text-secondary hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter size={16} className="text-secondary shrink-0 hidden sm:block" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-[#14141c] border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-red-500 cursor-pointer w-full sm:w-auto shadow-inner"
              >
                <option value="Barcha darajalar">Barcha darajalar</option>
                <option value="Boshlang'ich">Boshlang'ich</option>
                <option value="O'rta">O'rta</option>
                <option value="Pro">Pro</option>
              </select>
            </div>
          </div>
        )}

        {/* Course Cards Grid */}
        {displayedList.length === 0 ? (
          <div className="glass-card py-16 px-6 text-center flex flex-col items-center border border-white/10 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <BookOpen size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-white">Kurslar topilmadi</h3>
              <p className="text-secondary text-sm max-w-md">
                {activeCatalogTab === "Davom etayotgan" && "Hozircha davom etayotgan kurslaringiz mavjud emas. Katalogdan istalgan kursni boshlashingiz mumkin."}
                {activeCatalogTab === "Yakunlangan" && "Hali hech bir kursni to'liq yakunlamagansiz. Darslarni ko'rib testlarni topshiring va sertifikatga ega bo'ling!"}
                {activeCatalogTab === "Saqlanganlar" && "Hozircha saqlangan kurslar mavjud emas. Kurs kartasidagi saqlash tugmasini bosib saqlashingiz mumkin."}
                {activeCatalogTab === "Katalog" && "Qidiruv natijalariga mos kurslar topilmadi."}
              </p>
            </div>

            {activeCatalogTab !== "Katalog" && (
              <button
                onClick={() => setActiveCatalogTab("Katalog")}
                className="mt-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-violet-600 hover:from-red-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
              >
                <span>Katalogga o'tish</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedList.map((course, idx) => {
              const completedLessons = userProgress[course.id] || 0;
              const isStarted = completedLessons > 0;
              const isSaved = savedCourseIds.includes(course.id);

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * idx }}
                  onClick={() => router.push(`/darslar/course/${course.id}`)}
                  className="group cursor-pointer bg-[#14141c] hover:bg-[#1a1a25] border border-white/10 hover:border-red-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col relative"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[#181820]">
                    <img
                      src={course.cover_img}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-transparent to-transparent" />
                    
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-md bg-red-600/90 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow">
                      {course.category}
                    </span>

                    {/* Save / Bookmark Button */}
                    <button
                      onClick={(e) => toggleSaveCourse(e, course.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full border transition-all ${
                        isSaved 
                          ? "bg-red-600 text-white border-red-500 shadow-lg scale-110" 
                          : "bg-black/60 text-white/70 border-white/10 hover:bg-black/90 hover:text-white"
                      }`}
                      title={isSaved ? "Saqlanganlardan chiqarish" : "Saqlab qo'yish"}
                    >
                      <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-display text-lg font-bold text-white leading-snug group-hover:text-red-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-secondary/80 line-clamp-2 leading-relaxed">
                        {course.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-secondary font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-white/90 font-semibold">{course.level}</span>
                        <span>•</span>
                        <span>{course.total_lessons} dars</span>
                        <span>•</span>
                        <span>{course.total_duration}</span>
                      </div>

                      {isStarted && (
                        <span className="text-emerald-400 font-bold">
                          {completedLessons}/{course.total_lessons}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
