"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Plus, Crown, BookOpen, Play, GraduationCap, Clock, Layers, Sparkles, ChevronRight, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useTranslation } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { BackButton } from "@/components/ui/BackButton";
import { DEFAULT_LESSONS } from "@/lib/lessonsData";

export default function DarslarPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [activePlaylist, setActivePlaylist] = useState<string>("Barchasi");
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

  // Group lessons by playlist level for Youtube-style Playlist Shelves
  const playlistShelves = categories.map(category => ({
    name: category,
    lessons: allLessons.filter(l => l.level === category)
  }));

  const filteredLessons = activePlaylist === "Barchasi" 
    ? allLessons 
    : allLessons.filter(l => l.level === activePlaylist);

  return (
    <main className="min-h-screen bg-background text-white relative overflow-hidden">
      <Navbar />

      {/* Aurora background glow effects */}
      <div className="absolute inset-x-0 top-0 h-[600px] -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,51,85,0.18),transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 h-[600px] -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.15),transparent_60%)]" />

      <div className="container-app pt-28 pb-24 relative z-10">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="chip mb-4 border-violet/30 bg-violet/10 text-violet"
            >
              <GraduationCap size={14} />
              <span className="font-display uppercase tracking-[0.2em] text-[11px]">
                {t("knowledge_center_badge", "O'QUV VA VIDEO PLEYLISTLAR")}
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05] uppercase"
            >
              Video<span className="text-gradient">pleylistlar</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-secondary text-base md:text-lg mt-3 leading-relaxed"
            >
              {t("darslar_subtitle", "YouTube uslubidagi tartiblangan o'quv pleylistlari va maxsus video darsliklar (Barcha uchun bepul).")}
            </motion.p>
          </div>

          {user?.role === "ADMIN" && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => router.push("/admin")}
              className="btn-primary py-3 px-6 text-sm gap-2 shrink-0 shadow-glow"
            >
              <Plus size={16} /> {t("add_new_lesson_btn", "Yangi dars qo'shish")}
            </motion.button>
          )}
        </div>

        {/* YouTube-Style Horizontal Category Filter Chips */}
        {!loadingLessons && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="sticky top-20 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-xl border-b border-white/5 mb-8"
          >
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {filterChips.map(chip => {
                const isActive = activePlaylist === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => setActivePlaylist(chip)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0 ${
                      isActive
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-[1.02]"
                        : "bg-white/5 text-secondary border-white/10 hover:border-white/30 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Lessons Content Display */}
        {loadingLessons ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div key={n} className="flex flex-col space-y-3">
                <div className="skeleton aspect-video w-full rounded-2xl" />
                <div className="flex space-x-3 px-1">
                  <div className="skeleton w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-5/6" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activePlaylist === "Barchasi" ? (
          /* YouTube Playlist Shelves View (Grouped by Category) */
          <div className="space-y-12">
            {playlistShelves.map((shelf, shelfIdx) => {
              if (shelf.lessons.length === 0) return null;
              const firstLesson = shelf.lessons[0];

              return (
                <motion.div
                  key={shelf.name}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * shelfIdx }}
                  className="space-y-5"
                >
                  {/* Playlist Shelf Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-violet/20 border border-primary/30 flex items-center justify-center text-primary shadow-glow">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h2 className="font-display text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                          <span>{shelf.name}</span>
                          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full lowercase font-mono">
                            {shelf.lessons.length} darslik
                          </span>
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/darslar/${firstLesson.id}`)}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors group"
                    >
                      <Play size={14} className="fill-current text-primary" />
                      <span>Barchasini ko'rish</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  {/* Playlist Video Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {shelf.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        onClick={() => router.push(`/darslar/${lesson.id}`)}
                        className="group cursor-pointer flex flex-col space-y-3 transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Thumbnail Container */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-xl group-hover:border-primary/40 group-hover:shadow-[0_0_25px_rgba(255,51,85,0.25)] transition-all">
                          <img
                            src={lesson.img}
                            alt={lesson.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          
                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-glow transform scale-90 group-hover:scale-100 transition-transform duration-300">
                              <Play size={22} className="ml-1 fill-current" />
                            </div>
                          </div>

                          {/* Index Badge */}
                          <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white uppercase">
                            #{idx + 1} DARSLIK
                          </div>

                          {/* Duration Badge */}
                          {lesson.duration && (
                            <span className="absolute bottom-2.5 right-2.5 rounded bg-black/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-white tracking-wider border border-white/10">
                              {lesson.duration}
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex space-x-3 px-1">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-violet text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-md border border-white/10 uppercase select-none">
                            {lesson.author?.[0]?.toUpperCase() || "M"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-sm font-bold text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                              {lesson.title}
                            </h3>
                            <p className="text-[11px] text-secondary mt-1 font-medium truncate">
                              {lesson.author || "Maroqli.uz"}
                            </p>
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
          /* Filtered Playlist Category Grid View */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredLessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                onClick={() => router.push(`/darslar/${lesson.id}`)}
                className="group cursor-pointer flex flex-col space-y-3 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-xl group-hover:border-primary/40 group-hover:shadow-[0_0_25px_rgba(255,51,85,0.25)] transition-all">
                  <img
                    src={lesson.img}
                    alt={lesson.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-glow transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play size={22} className="ml-1 fill-current" />
                    </div>
                  </div>

                  {/* Level Badge */}
                  <span className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-violet uppercase tracking-wider">
                    {lesson.level}
                  </span>

                  {/* Duration Badge */}
                  {lesson.duration && (
                    <span className="absolute bottom-2.5 right-2.5 rounded bg-black/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-white tracking-wider border border-white/10">
                      {lesson.duration}
                    </span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex space-x-3 px-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-violet text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-md border border-white/10 uppercase select-none">
                    {lesson.author?.[0]?.toUpperCase() || "M"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-bold text-white leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {lesson.title}
                    </h3>
                    <p className="text-[11px] text-secondary mt-1 font-medium truncate">
                      {lesson.author || "Maroqli.uz"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </div>
    </main>
  );
}
