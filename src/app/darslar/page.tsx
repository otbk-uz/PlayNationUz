"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Plus, Play, GraduationCap, Layers, ChevronRight, Search, X, CheckCircle, Eye, Clock, Sparkles, ListVideo, Film, Flame } from "lucide-react";
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

  // Group lessons into Playlists (1 Cover Card per playlist)
  const playlists = categories.map(category => {
    const categoryLessons = allLessons.filter(l => l.level === category);
    return {
      name: category,
      firstLesson: categoryLessons[0] || null,
      lessons: categoryLessons,
      totalCount: categoryLessons.length
    };
  }).filter(p => p.firstLesson !== null);

  // Filtered playlists based on chip
  const filteredPlaylists = playlists.filter(p => activePlaylist === "Barchasi" || p.name === activePlaylist);

  // Search results for specific search queries
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching 
    ? allLessons.filter(l => 
        l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.level?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white relative overflow-hidden font-sans">
      <Navbar />

      {/* Header Glow Effect */}
      <div className="absolute inset-x-0 top-0 h-[500px] -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(239,68,68,0.18),transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 h-[500px] -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(139,92,246,0.15),transparent_60%)]" />

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
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 mb-4"
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
              Video <span className="text-red-500">Pleylistlar</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-secondary text-sm sm:text-base mt-2 max-w-xl leading-relaxed"
            >
              O'yin yaratish va dizayn bo'yicha professional videodarsliklar to'plami. Pleylistni tanlang va 1-darsdan ketma-ket tomosha qiling.
            </motion.p>
          </div>

          {/* Search Bar & Add Lesson */}
          <div className="w-full lg:w-96 space-y-3">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-secondary pointer-events-none">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pleylist, Unity, Unreal Engine qidirish..."
                className="w-full bg-[#18181f] border border-white/10 rounded-full py-3 pl-11 pr-10 text-sm text-white placeholder:text-secondary/70 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all shadow-inner"
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

        {/* Filter Chips */}
        {!loadingLessons && !isSearching && (
          <div className="sticky top-20 z-30 -mx-4 px-4 py-3 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/10 mb-8">
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
                        : "bg-[#18181f] text-white/80 border-white/10 hover:border-white/30 hover:text-white hover:bg-[#252530]"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Display Area */}
        {loadingLessons ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col space-y-4">
                <div className="skeleton aspect-video w-full rounded-2xl bg-white/5" />
                <div className="flex space-x-3 px-1">
                  <div className="skeleton w-10 h-10 rounded-full shrink-0 bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-5/6 bg-white/5" />
                    <div className="skeleton h-3 w-2/3 bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isSearching ? (
          /* Search Results Grid */
          <div className="space-y-6">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Search size={18} className="text-red-500" />
              <span>Qidiruv natijalari ({searchResults.length})</span>
            </h3>

            {searchResults.length === 0 ? (
              <div className="glass-card py-20 px-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">Darsliklar topilmadi</h3>
                <p className="text-secondary text-sm max-w-md mb-6">
                  Siz qidirgan kalit so'z bo'yicha hech qanday darslik topilmadi.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Qidiruvni tozalash
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => router.push(`/darslar/${lesson.id}`)}
                    className="group cursor-pointer flex flex-col space-y-3"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#18181f] border border-white/10 shadow-lg group-hover:border-red-500/50 transition-all">
                      <img
                        src={lesson.img}
                        alt={lesson.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Play size={20} className="ml-1 fill-current" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 rounded bg-black/85 backdrop-blur-md px-2 py-0.5 text-[11px] font-mono font-bold text-white border border-white/10">
                        {lesson.duration || "15:00"}
                      </span>
                    </div>
                    <div className="flex space-x-3 px-0.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-violet-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-md uppercase select-none">
                        {lesson.author?.[0]?.toUpperCase() || "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans text-sm font-bold text-white leading-snug group-hover:text-red-400 transition-colors line-clamp-2">
                          {lesson.title}
                        </h3>
                        <p className="text-xs text-secondary/80 mt-1">{lesson.author || "Maroqli.uz"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Single Playlist Cover Cards View (Only 1 Cover Card per Playlist!) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlaylists.map((playlist, idx) => {
              const firstLesson = playlist.firstLesson;
              if (!firstLesson) return null;

              return (
                <motion.div
                  key={playlist.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * idx }}
                  onClick={() => router.push(`/darslar/${firstLesson.id}`)}
                  className="group cursor-pointer flex flex-col space-y-4"
                >
                  {/* Playlist Card Container with YouTube-style Stacked Cards Visual */}
                  <div className="relative aspect-video w-full rounded-2xl bg-[#18181f] border border-white/10 shadow-2xl group-hover:border-red-500/60 transition-all duration-300">
                    
                    {/* Stacked Cards Background Layers Effect */}
                    <div className="absolute -top-2 inset-x-3 h-full bg-[#22222d] border border-white/10 rounded-2xl -z-10 group-hover:-top-3 transition-all duration-300" />
                    <div className="absolute -top-4 inset-x-6 h-full bg-[#2a2a38] border border-white/10 rounded-2xl -z-20 group-hover:-top-5 transition-all duration-300" />

                    {/* Main Thumbnail Image */}
                    <img
                      src={firstLesson.img}
                      alt={playlist.name}
                      className="h-full w-full object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
                    />

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent rounded-2xl" />

                    {/* Right-Side Playlist Badge Bar (YouTube-Style Overlay) */}
                    <div className="absolute inset-y-0 right-0 w-2/5 bg-black/75 backdrop-blur-md border-l border-white/10 rounded-r-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 group-hover:bg-red-950/80 transition-colors">
                      <ListVideo size={28} className="text-red-400 group-hover:scale-110 transition-transform" />
                      <div className="font-mono text-sm font-black text-white uppercase tracking-wider">
                        {playlist.totalCount} TA DARS
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-300 uppercase">
                        <Play size={10} className="fill-current" />
                        <span>KURS</span>
                      </div>
                    </div>

                    {/* Hover Play Glow Center Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] rounded-2xl">
                      <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 transform scale-90 group-hover:scale-100 transition-transform">
                        <Play size={24} className="ml-1 fill-current" />
                      </div>
                    </div>

                    {/* Left Bottom Pill: 1-Dars Indicator */}
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>1-Darsdan boshlash</span>
                    </div>
                  </div>

                  {/* Playlist Card Details */}
                  <div className="flex space-x-3 px-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-violet-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-lg border border-white/10 uppercase select-none">
                      {firstLesson.author?.[0]?.toUpperCase() || "M"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-black uppercase text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded">
                          To'liq Pleylist
                        </span>
                        <span className="text-xs text-secondary font-mono">
                          {playlist.totalCount} ta darslik
                        </span>
                      </div>

                      <h3 className="font-display text-base font-black text-white leading-snug group-hover:text-red-400 transition-colors uppercase tracking-tight">
                        {playlist.name}
                      </h3>

                      <p className="text-xs text-secondary/80 mt-1 line-clamp-1">
                        {firstLesson.title}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 text-xs text-white/70">
                        <span className="font-semibold">{firstLesson.author || "Maroqli.uz"}</span>
                        <CheckCircle size={13} className="text-red-500 fill-red-500/20 shrink-0" />
                      </div>
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
