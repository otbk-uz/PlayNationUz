"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { BackButton } from "@/components/ui/BackButton";
import { useAuthStore, useTranslation } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { WhiteLabelPlayer } from "@/components/WhiteLabelPlayer";
import { 
  RefreshCw, Play, Send, Trash2, User, MessageSquare, ThumbsUp, ThumbsDown, 
  Share2, Bookmark, CheckCircle, Bell, ChevronDown, ChevronUp, Youtube, Sparkles
} from "lucide-react";
import Link from "next/link";
import { getCachedData, setCachedData } from "@/lib/cache";
import { DEFAULT_LESSONS } from "@/lib/lessonsData";

interface Lesson {
  id: string;
  title: string;
  author: string;
  level: string;
  img: string;
  video_url: string;
  duration?: string;
}

interface Comment {
  id: string;
  lesson_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function LessonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { t, locale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [playlistLessons, setPlaylistLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // YouTube interaction states
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1420);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Comments states
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  const lessonId = params.id as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from("gamedev_lesson_comments")
        .select(`
          *,
          profiles:user_id(username, full_name, avatar_url)
        `)
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Comments fetch error:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    const loadCachedLesson = () => {
      const cachedLesson = getCachedData<Lesson>(`lesson_${lessonId}`);
      const cachedPlaylist = getCachedData<Lesson[]>(`lesson_playlist_${lessonId}`);

      if (cachedLesson) setLesson(cachedLesson);
      if (cachedPlaylist) setPlaylistLessons(cachedPlaylist);

      if (cachedLesson && cachedPlaylist) {
        setLoading(false);
      }
    };

    loadCachedLesson();

    const fetchLessonData = async () => {
      try {
        const { data: lessonData, error } = await supabase
          .from("gamedev_lessons")
          .select("*")
          .eq("id", lessonId)
          .single();

        let activeLesson: Lesson | null = null;

        if (error || !lessonData) {
          const cached = getCachedData<Lesson>(`lesson_${lessonId}`);
          const defaultMatch = DEFAULT_LESSONS.find(l => l.id === lessonId);
          if (cached) {
            activeLesson = cached;
          } else if (defaultMatch) {
            activeLesson = defaultMatch;
          } else if (DEFAULT_LESSONS.length > 0) {
            activeLesson = DEFAULT_LESSONS[0];
          }
        } else {
          activeLesson = lessonData;
          setCachedData(`lesson_${lessonId}`, lessonData);
        }

        setLesson(activeLesson);

        const currentLevel = activeLesson?.level || "GameDev 0dan o'rganish";
        const { data: listData } = await supabase
          .from("gamedev_lessons")
          .select("*")
          .eq("level", currentLevel)
          .order("created_at", { ascending: true });

        let dbLessons = (listData && listData.length > 0) ? listData : DEFAULT_LESSONS;
        setPlaylistLessons(dbLessons as Lesson[]);
        setCachedData(`lesson_playlist_${lessonId}`, dbLessons as Lesson[]);
      } catch (err) {
        console.error(t("dars_load_error", "Dars ma'lumotlarini yuklashda xatolik:"), err);
        const defaultMatch = DEFAULT_LESSONS.find(l => l.id === lessonId) || DEFAULT_LESSONS[0];
        setLesson(defaultMatch);
        setPlaylistLessons(DEFAULT_LESSONS);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
    fetchComments();
  }, [lessonId, isAuthenticated, user, mounted]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from("gamedev_lesson_comments")
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles:user_id(username, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      setComments(prev => [data, ...prev]);
      setNewComment("");
    } catch (err: any) {
      console.error("Post comment error:", err);
      alert(err.message || t("comment_post_error", "Izoh qoldirishda xatolik yuz berdi"));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t("confirm_delete_comment", "Haqiqatan ham ushbu izohni o'chirmoqchimisiz?"))) return;
    try {
      const { error } = await supabase
        .from("gamedev_lesson_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      console.error("Delete comment error:", err);
      alert(err.message || t("comment_delete_error", "Izohni o'chirishda xatolik yuz berdi"));
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const toggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      if (disliked) setDisliked(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white">
        <RefreshCw className="animate-spin text-red-500 mb-4" size={36} />
        <p className="text-secondary text-xs uppercase tracking-widest">{t("lesson_loading", "Darslik yuklanmoqda...")}</p>
      </div>
    );
  }

  if (!lesson) return null;

  const currentLessonIndex = playlistLessons.findIndex(l => l.id === lesson.id);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white font-sans">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-20 max-w-7xl">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player, Video Info, Description, Comments (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* WhiteLabel YouTube Player Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
              <WhiteLabelPlayer 
                url={lesson.video_url} 
                userIdentifier={user?.email || user?.username} 
              />
            </div>

            {/* Video Title */}
            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
              {lesson.title}
            </h1>

            {/* YouTube Channel & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              {/* Channel Info */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-violet-600 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-white uppercase text-sm">
                    {lesson.author?.[0]?.toUpperCase() || "M"}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white text-base">
                    <span>{lesson.author || "Maroqli Dev"}</span>
                    <CheckCircle size={15} className="text-red-500 fill-red-500/20" />
                  </div>
                  <p className="text-xs text-secondary/80 font-mono">14.8K obunachilar</p>
                </div>

                <button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`ml-3 py-2 px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                    isSubscribed 
                      ? "bg-[#272727] text-white border border-white/10 hover:bg-[#383838]" 
                      : "bg-white text-black hover:bg-white/90 shadow-md"
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <Bell size={14} className="text-red-500 fill-current" />
                      <span>Obuna bo'lingan</span>
                    </>
                  ) : (
                    <span>Obuna bo'lish</span>
                  )}
                </button>
              </div>

              {/* Action Buttons (Like, Dislike, Share, Save) */}
              <div className="flex items-center gap-2">
                {/* Like / Dislike Group */}
                <div className="flex items-center bg-[#272727] border border-white/10 rounded-full overflow-hidden">
                  <button
                    onClick={toggleLike}
                    className={`flex items-center gap-2 py-2 px-4 text-xs font-bold transition-colors ${
                      liked ? "text-red-500 bg-red-500/10" : "text-white hover:bg-white/10"
                    }`}
                  >
                    <ThumbsUp size={16} className={liked ? "fill-current" : ""} />
                    <span>{likeCount.toLocaleString()}</span>
                  </button>
                  <div className="h-4 w-px bg-white/10" />
                  <button
                    onClick={() => {
                      setDisliked(!disliked);
                      if (liked) {
                        setLiked(false);
                        setLikeCount(prev => prev - 1);
                      }
                    }}
                    className={`py-2 px-3 text-xs transition-colors ${
                      disliked ? "text-red-500 bg-red-500/10" : "text-white hover:bg-white/10"
                    }`}
                  >
                    <ThumbsDown size={16} className={disliked ? "fill-current" : ""} />
                  </button>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 py-2 px-4 bg-[#272727] hover:bg-[#383838] border border-white/10 rounded-full text-xs font-bold text-white transition-colors"
                >
                  <Share2 size={15} />
                  <span>{copiedLink ? "Nusxalandi!" : "Ulashish"}</span>
                </button>

                {/* Save Button */}
                <button
                  onClick={() => setSaved(!saved)}
                  className={`p-2.5 bg-[#272727] hover:bg-[#383838] border border-white/10 rounded-full text-white transition-colors ${
                    saved ? "text-red-500 bg-red-500/10" : ""
                  }`}
                  title="Saqlash"
                >
                  <Bookmark size={15} className={saved ? "fill-current" : ""} />
                </button>
              </div>
            </div>

            {/* YouTube Expandable Description Box */}
            <div 
              onClick={() => setDescExpanded(!descExpanded)}
              className="bg-[#272727]/90 hover:bg-[#272727] border border-white/10 rounded-2xl p-4 cursor-pointer transition-colors space-y-3"
            >
              <div className="flex items-center gap-3 text-xs font-bold text-white font-mono">
                <span>3,820 ko'rishlar</span>
                <span>•</span>
                <span>2026-yil 15-iyul</span>
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-sans font-black uppercase">
                  {lesson.level}
                </span>
              </div>

              <div className={`text-xs text-secondary leading-relaxed space-y-2 font-sans ${descExpanded ? "" : "line-clamp-2"}`}>
                <p>Ushbu video darslik orqali o'yin yaratish sohasidagi ko'nikmalarni bosqichma-bosqich o'rganishingiz va Maroqli.uz platformasi do'koniga loyihalaringizni joylashtirib daromad olishni boshlashingiz mumkin.</p>
                <p className="text-red-400 font-medium">#gamedev #maroqli #unrealengine #unity #darslik #uzbekistan</p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-white uppercase tracking-wider pt-1">
                <span>{descExpanded ? "Qisqartirish" : "Batafsil ko'rish"}</span>
                {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {/* YouTube Comments Section */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <MessageSquare size={20} className="text-red-500" />
                <h3 className="font-bold text-lg text-white">
                  {comments.length} ta Izohlar
                </h3>
              </div>

              {/* Add Comment Input Bar */}
              {isAuthenticated && user ? (
                <form onSubmit={handlePostComment} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-violet-600 text-xs font-bold text-white flex items-center justify-center shrink-0 shadow-md uppercase select-none">
                    {user.username?.[0]?.toUpperCase() || <User size={14} />}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      placeholder={t("post_comment_placeholder", "Izoh qoldiring...")}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                      className="w-full bg-transparent border-b border-white/20 focus:border-red-500 py-2 text-sm text-white focus:outline-none transition-colors placeholder:text-secondary/70"
                    />
                    {newComment.trim() && (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setNewComment("")}
                          className="py-1.5 px-4 rounded-full text-xs font-bold text-secondary hover:text-white transition-colors"
                        >
                          Bekor qilish
                        </button>
                        <button
                          type="submit"
                          disabled={submittingComment}
                          className="py-1.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50"
                        >
                          {submittingComment ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send size={12} />
                              <span>Izoh qoldirish</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 bg-[#272727] border border-white/10 rounded-2xl">
                  <p className="text-secondary text-xs">
                    Izoh qoldirish uchun iltimos <Link href="/login" className="text-red-400 font-bold hover:underline">tizimga kiring</Link>.
                  </p>
                </div>
              )}

              {/* Comments Feed */}
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="animate-spin text-red-500" size={24} />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-secondary text-xs py-8">Birinchi bo'lib izoh qoldiring!</p>
              ) : (
                <div className="space-y-6 pt-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs select-none">
                        {comment.profiles?.avatar_url ? (
                          <img src={comment.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          comment.profiles?.username?.[0]?.toUpperCase() || <User size={12} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">
                            @{comment.profiles?.username || "foydalanuvchi"}
                          </span>
                          <span className="text-[10px] text-secondary font-mono">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-white/90 mt-1 leading-relaxed break-words font-sans">{comment.content}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-secondary text-xs">
                          <button className="flex items-center gap-1 hover:text-white transition-colors">
                            <ThumbsUp size={13} />
                          </button>
                          <button className="flex items-center gap-1 hover:text-white transition-colors">
                            <ThumbsDown size={13} />
                          </button>
                          {user && user.id === comment.user_id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-secondary hover:text-red-500 transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: YouTube Playlist Sidebar (1 col) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#272727] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div>
                  <span className="text-[10px] text-red-500 font-black font-mono uppercase tracking-widest block">KURS PLEYLISTI</span>
                  <h3 className="font-display font-black text-sm text-white uppercase line-clamp-1 mt-0.5">
                    {lesson.level}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  {currentLessonIndex !== -1 ? currentLessonIndex + 1 : 1}/{playlistLessons.length}
                </span>
              </div>

              {/* Playlist Items */}
              <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
                {playlistLessons.map((item, index) => {
                  const isActive = item.id === lesson.id;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(`/darslar/${item.id}`)}
                      className={`group cursor-pointer flex gap-3 p-2 rounded-xl transition-all ${
                        isActive 
                          ? "bg-red-500/15 border border-red-500/30 text-white" 
                          : "hover:bg-white/5 text-secondary hover:text-white"
                      }`}
                    >
                      {/* Index / Play Indicator */}
                      <span className="w-4 shrink-0 text-center font-mono text-xs font-bold my-auto">
                        {isActive ? (
                          <span className="text-red-500 flex justify-center animate-pulse">▶</span>
                        ) : (
                          index + 1
                        )}
                      </span>

                      {/* 16:9 Thumbnail */}
                      <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black border border-white/10 relative shrink-0">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 text-[9px] font-mono font-bold text-white">
                          {item.duration || "12:30"}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`font-sans text-xs font-bold leading-snug line-clamp-2 transition-colors ${
                          isActive ? "text-red-400" : "text-white group-hover:text-red-400"
                        }`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-secondary mt-1 truncate">{item.author || "Maroqli Dev"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
