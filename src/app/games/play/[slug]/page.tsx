"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Maximize2, RotateCcw, Volume2, VolumeX, Gamepad2, Star, Sparkles, Monitor, Share2, PlayCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useTranslation, useAuthStore } from "@/lib/store";
import { Lock, LogIn, UserPlus } from "lucide-react";

interface GameDetail {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  platform: string;
  rating: number;
  cover: string | null;
  demo_url?: string | null;
}

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [game, setGame] = useState<GameDetail | null>(null);
  const [otherGames, setOtherGames] = useState<GameDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!slug) return;

    const fetchGame = async () => {
      try {
        setLoading(true);
        // Fetch current game by slug
        const { data, error } = await supabase
          .from('developed_games')
          .select('*')
          .eq('slug', slug)
          .single();

        if (data) {
          setGame({
            id: data.id,
            title: data.title,
            slug: data.slug,
            description: data.description,
            platform: data.platform || 'WEB',
            rating: data.rating || 5.0,
            cover: data.cover || null,
            demo_url: data.demo_url || `/games-online/${data.slug}/index.html`
          });
        } else {
          // Fallback if DB doesn't have it yet, construct default from slug
          const formattedTitle = slug
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          
          setGame({
            id: slug,
            title: formattedTitle,
            slug: slug,
            description: `${formattedTitle} — onlayn brauzer o'yini. Platformamizda bepul o'ynang!`,
            platform: 'WEB',
            rating: 5.0,
            cover: `/games-online/${slug}/covers/${slug}.png`,
            demo_url: `/games-online/${slug}/index.html`
          });
        }

        // Fetch other web games for recommendation
        const { data: listData } = await supabase
          .from('developed_games')
          .select('*')
          .eq('platform', 'WEB')
          .neq('slug', slug)
          .limit(6);

        if (listData && listData.length > 0) {
          setOtherGames(listData.map((g: any) => ({
            id: g.id,
            title: g.title,
            slug: g.slug,
            description: g.description,
            platform: g.platform,
            rating: g.rating || 5.0,
            cover: g.cover,
            demo_url: g.demo_url || `/games-online/${g.slug}/index.html`
          })));
        }
      } catch (err) {
        console.error("Game play page fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [slug]);

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if ((iframeRef.current as any).webkitRequestFullscreen) {
        (iframeRef.current as any).webkitRequestFullscreen();
      } else if ((iframeRef.current as any).msRequestFullscreen) {
        (iframeRef.current as any).msRequestFullscreen();
      }
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const gameUrl = game?.demo_url || `/games-online/${slug}/index.html`;

  if (mounted && !isAuthenticated) {
    return (
      <main className="min-h-screen bg-background relative flex flex-col justify-center items-center p-4">
        <Navbar />
        <div className="max-w-md w-full glass-card p-8 text-center space-y-6 border-rose-500/30 bg-gradient-to-b from-rose-500/10 via-background to-background relative overflow-hidden shadow-2xl mt-16">
          <div className="w-20 h-20 bg-rose-500/20 border border-rose-500/40 rounded-3xl flex items-center justify-center mx-auto text-rose-500 shadow-glow-rose">
            <Lock size={38} />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              Ro'yxatdan O'tish Majburiy!
            </h2>
            <p className="text-secondary text-xs leading-relaxed">
              Ushbu onlayn brauzer o'yinini o'ynash uchun Maroqli.uz platformasiga kirishingiz yoki ro'yxatdan o'tishingiz shart.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href={`/login?redirect=/games/play/${slug}`}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow"
            >
              <LogIn size={16} />
              <span>Tizimga Kirish</span>
            </Link>
            <Link
              href={`/register?redirect=/games/play/${slug}`}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              <span>Ro'yxatdan O'tish</span>
            </Link>
          </div>

          <button
            onClick={() => router.push("/games")}
            className="text-xs text-secondary hover:text-white transition-colors underline pt-2 block mx-auto"
          >
            O'yinlar do'koniga qaytish
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />

      <div className="container-app pt-24 pb-16 relative z-10 flex-1 flex flex-col max-w-6xl mx-auto">
        {/* Header navigation bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="group text-secondary hover:text-white flex items-center space-x-2 text-xs font-bold transition-colors bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-full border border-white/10"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t("back", "Orqaga")}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>ONLAYN BROWSER GAME</span>
            </span>
            {game && (
              <div className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-white">
                <Star size={13} className="text-warning fill-warning" />
                <span className="font-bold">{Number(game.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Title Bar */}
        <div className="glass-card p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-violet/30 bg-gradient-to-r from-violet/10 via-white/[0.02] to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet/20 border border-violet/30 flex items-center justify-center text-violet shrink-0 shadow-glow-violet">
              <Gamepad2 size={26} />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                {game?.title || slug}
              </h1>
              <p className="text-xs text-secondary mt-0.5 flex items-center gap-2">
                <span>Maroqli.uz Platformasining Rasmiy O'yini</span>
                <span>•</span>
                <span className="text-success font-semibold flex items-center gap-1">
                  <ShieldCheck size={12} /> Bepul o'ynash
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReload}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5"
              title="Qayta yuklash"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Qayta yuklash</span>
            </button>
            <button
              onClick={handleFullscreen}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-glow"
              title="To'liq ekran"
            >
              <Maximize2 size={14} />
              <span>To'liq Ekran</span>
            </button>
          </div>
        </div>

        {/* Game Iframe Canvas Container */}
        <div className="relative w-full aspect-[16/10] min-h-[500px] md:min-h-[620px] rounded-3xl overflow-hidden bg-black/90 border border-white/15 shadow-2xl flex flex-col justify-center items-center group">
          {loading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-3 border-violet border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-white/80 font-bold uppercase tracking-widest animate-pulse">
                O'yin yuklanmoqda...
              </p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={gameUrl}
            title={game?.title || "Online Game"}
            className="w-full h-full border-0 rounded-3xl"
            allow="autoplay; fullscreen; keyboard; gamepad; microphone"
            allowFullScreen
          />
        </div>

        {/* Description & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 glass-card p-6 md:p-8 space-y-4">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <PlayCircle size={18} className="text-violet" />
              <span>O'yin haqida va Boshqaruv</span>
            </h3>
            <p className="text-secondary text-sm leading-relaxed whitespace-pre-line">
              {game?.description || "Ushbu HTML5 o'yini kompyuter va smartfon brauzerida osongina o'ynaladi. Sichqoncha yoki sensorli ekran orqali boshqarishingiz mumkin."}
            </p>

            <div className="border-t border-white/10 pt-4 mt-4 flex flex-wrap gap-4 text-xs text-secondary">
              <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                <Monitor size={14} className="text-primary" />
                <span>Qurilma: Brauzer (PC & Mobile)</span>
              </div>
              <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                <Gamepad2 size={14} className="text-violet" />
                <span>Boshqaruv: Sichqoncha / Klaviatura / Sensor</span>
              </div>
            </div>
          </div>

          {/* Related Games Sidebar */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>Boshqa Onlayn O'yinlar</span>
            </h3>

            <div className="space-y-3">
              {otherGames.slice(0, 4).map((og) => (
                <Link
                  key={og.slug}
                  href={`/games/play/${og.slug}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet/40 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet/20 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {og.cover ? (
                      <img src={og.cover} alt={og.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <Gamepad2 size={20} className="text-violet" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-violet transition-colors truncate">
                      {og.title}
                    </h4>
                    <p className="text-[10px] text-secondary flex items-center gap-1 mt-0.5">
                      <Star size={10} className="text-warning fill-warning" />
                      <span>{Number(og.rating).toFixed(1)}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">Bepul</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
