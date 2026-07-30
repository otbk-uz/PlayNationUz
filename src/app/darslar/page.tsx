"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Plus, Play, GraduationCap, Layers, ChevronRight, Search, X, CheckCircle, Eye, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore, useTranslation } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { BackButton } from "@/components/ui/BackButton";
import { DEFAULT_LESSONS } from "@/lib/lessonsData";

export default function DarslarPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [activePlaylist, setActivePlaylist] = useState<string>("Barchasi");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoadingLessons(true);
      const { data, error } = await supabase
        .from("gamedev_lessons")
        .select("*")
        .order("created_at", { ascending: true });

      if (error || !data || data.length === 0) {
        setLessons(DEFAULT_LESSONS);
      } else {
        const combined = [...data];
        DEFAULT_LESSONS.forEach(def => {
          if (!combined.some(d => d.id === def.id || d.title === def.title)) {
            combined.push(def);
          }
        });
        setLessons(combined);
      }
    } catch (err) {
      console.error("Darslarni yuklashda xatolik:", err);
      setLessons(DEFAULT_LESSONS);
    } finally {
      setLoadingLessons(false);
    }
  };

  const allLessons = lessons;
  const categories = Array.from(new Set(allLessons.map(l => l.level).filter(Boolean)));
  const filterChips = ["Barchasi", ...categories];

  // Filter lessons based on active tag & search query
  const filteredLessons = allLessons.filter(l => {
    const matchesCategory = activePlaylist === "Barchasi" || l.level === activePlaylist;
    const matchesSearch = !searchQuery.trim() || 
      l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.level?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group lessons by playlist level for Playlist Shelves (when no search query)
  const playlistShelves = categories.map(category => ({
    name: category,
    lessons: filteredLessons.filter(l => l.level === category)
  }));

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white relative overflow-hidden font-sans">
      <Navbar />

      {/* Header Glow Effect */}
      <div className="absolute inset-x-0 top-0 h-[500px] -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,0,0,0.15),transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 h-[500px] -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.12),transparent_60%)]" />

      <div className="container-app pt-28 pb-24 relative z-10">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Studio Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-8">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 mb-4"
            >
              <Sparkles size={16} className="fill-current" />
              <span className="font-display font-black uppercase tracking-[0.2em] text-[11px]">
                MAROQLI ACADEMY • GameDev Hub
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] uppercase"
            >
              Video <span className="text-red-500">Darsliklar</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-secondary text-sm sm:text-base mt-2 max-w-xl leading-relaxed"
            >
              O'yin yaratish bo'yicha Maroqli.uz platformasining 1ga1 formatidagi professional video darslari, pleylistlar va amaliy loyihalar (Bepul).
            </motion.p>
          </div>

          {/* YouTube Search Bar */}
          <div className="w-full lg:w-96 space-y-3">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-secondary pointer-events-none">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Darsliklar, Unity, Unreal Engine qidirish..."
                className="w-full bg-[#1f1f1f] border border-white/10 rounded-full py-3 left-10 pl-11 pr-10 text-sm text-white placeholder:text-secondary/70 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-secondary hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {user?.role === "ADMIN" && (
              <button
                onClick={() => router.push("/admin")}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all"
              >
                <Plus size={16} /> {t("add_new_lesson_btn", "Yangi dars qo'shish")}
              </button>
            )}
          </div>
        </div>

        {/* YouTube-Style Horizontal Filter Chips */}
        {!loadingLessons && (
          <div className="sticky top-20 z-30 -mx-4 px-4 py-3 bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-white/10 mb-8">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {filterChips.map(chip => {
                const isActive = activePlaylist === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => setActivePlaylist(chip)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
                      isActive
                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-[1.02]"
                        : "bg-[#272727] text-white/80 border-white/10 hover:border-white/30 hover:text-white hover:bg-[#383838]"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lessons Display Grid */}
        {loadingLessons ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className="flex flex-col space-y-3">
                <div className="skeleton aspect-video w-full rounded-2xl bg-white/5" />
                <div className="flex space-x-3 px-1">
                  <div className="skeleton w-9 h-9 rounded-full shrink-0 bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-5/6 bg-white/5" />
                    <div className="skeleton h-3 w-2/3 bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="glass-card py-20 px-6 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
              <Youtube size={32} />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Darsliklar topilmadi</h3>
            <p className="text-secondary text-sm max-w-md mb-6">
              Siz qidirgan yoki tanlagan toifada video darsliklar mavjud emas. Qidiruv so'rovini o'zgartirib ko'ring.
            </p>
            <button
              onClick={() => {
                setActivePlaylist("Barchasi");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            >
              Barcha darsliklarni ko'rsatish
            </button>
          </div>
        ) : activePlaylist === "Barchasi" && !searchQuery.trim() ? (
          /* YouTube Shelves View */
          <div className="space-y-12">
            {playlistShelves.map((shelf, shelfIdx) => {
              if (shelf.lessons.length === 0) return null;
              const firstLesson = shelf.lessons[0];

              return (
                <motion.div
                  key={shelf.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * shelfIdx }}
                  className="space-y-4"
                >
                  {/* Playlist Shelf Title */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                        <Layers size={18} />
                      </div>
                      <h2 className="font-display text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <span>{shelf.name}</span>
                        <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full lowercase">
                          {shelf.lessons.length} dars
                        </span>
                      </h2>
                    </div>

                    <button
                      onClick={() => router.push(`/darslar/${firstLesson.id}`)}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-red-500 transition-colors group"
                    >
                      <Play size={12} className="fill-current text-red-500" />
                      <span>Ijro etish</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* YouTube 1-to-1 Video Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                    {shelf.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        onClick={() => router.push(`/darslar/${lesson.id}`)}
                        className="group cursor-pointer flex flex-col space-y-3"
                      >
                        {/* 16:9 Thumbnail Box */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#272727] border border-white/10 shadow-lg group-hover:border-red-500/50 transition-all">
                          <img
                            src={lesson.img}
                            alt={lesson.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Hover Play Overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                              <Play size={20} className="ml-1 fill-current" />
                            </div>
                          </div>

                          {/* Duration Badge */}
                          <span className="absolute bottom-2 right-2 rounded bg-black/85 backdrop-blur-md px-2 py-0.5 text-[11px] font-mono font-bold text-white tracking-wider border border-white/10">
                            {lesson.duration || "12:40"}
                          </span>
                        </div>

                        {/* Video Info Channel Bar */}
                        <div className="flex space-x-3 px-0.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-violet-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-md border border-white/10 uppercase select-none">
                            {lesson.author?.[0]?.toUpperCase() || "M"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-sans text-sm font-bold text-white leading-snug group-hover:text-red-400 transition-colors line-clamp-2">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-xs text-secondary/80">
                              <span className="font-medium truncate">{lesson.author || "Maroqli.uz"}</span>
                              <CheckCircle size={12} className="text-red-500 fill-red-500/20 shrink-0" />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-secondary/60 mt-0.5 font-mono">
                              <span>1.4k ko'rishlar</span>
                              <span>•</span>
                              <span>3 kun oldin</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Filtered/Search Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => router.push(`/darslar/${lesson.id}`)}
                className="group cursor-pointer flex flex-col space-y-3"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#272727] border border-white/10 shadow-lg group-hover:border-red-500/50 transition-all">
                  <img
                    src={lesson.img}
                    alt={lesson.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play size={20} className="ml-1 fill-current" />
                    </div>
                  </div>

                  {/* Level Tag Badge */}
                  <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    {lesson.level}
                  </span>

                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 rounded bg-black/85 backdrop-blur-md px-2 py-0.5 text-[11px] font-mono font-bold text-white tracking-wider border border-white/10">
                    {lesson.duration || "15:00"}
                  </span>
                </div>

                {/* Video Metadata */}
                <div className="flex space-x-3 px-0.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-violet-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-md border border-white/10 uppercase select-none">
                    {lesson.author?.[0]?.toUpperCase() || "M"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans text-sm font-bold text-white leading-snug group-hover:text-red-400 transition-colors line-clamp-2">
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-secondary/80">
                      <span className="font-medium truncate">{lesson.author || "Maroqli.uz"}</span>
                      <CheckCircle size={12} className="text-red-500 fill-red-500/20 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-secondary/60 mt-0.5 font-mono">
                      <span>2.1k ko'rishlar</span>
                      <span>•</span>
                      <span>Darslik</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
