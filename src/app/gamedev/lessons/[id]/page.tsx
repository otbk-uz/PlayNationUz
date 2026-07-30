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
  Share2, Bookmark, CheckCircle, Bell, ChevronDown, ChevronUp, Sparkles,
  ListVideo, SkipForward, SkipBack, Eye, Radio, Flame, Check
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
  likes_count?: number;
  views_count?: number;
  created_at?: string;
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

  // Lesson interaction states
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(142);
  const [viewCount, setViewCount] = useState<number>(1520);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

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

      if (cachedLesson) {
        setLesson(cachedLesson);
        setLikeCount(cachedLesson.likes_count ?? 142);
        setViewCount(cachedLesson.views_count ?? 1520);
      }
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

        if (activeLesson) {
          setLesson(activeLesson);

          // Real view count increment logic
          const baseViews = activeLesson.views_count ?? 1520;
          const newViews = baseViews + 1;
          setViewCount(newViews);
          setLikeCount(activeLesson.likes_count ?? 142);

          // Increment view count in Supabase asynchronously
          supabase
            .from("gamedev_lessons")
            .update({ views_count: newViews })
            .eq("id", lessonId)
            .then(() => {})
            .catch((e) => console.warn("View count update warning:", e));

          // Check if current user has liked this lesson
          if (user) {
            const { data: likeData } = await supabase
              .from("gamedev_lesson_likes")
              .select("id")
              .eq("lesson_id", lessonId)
              .eq("user_id", user.id)
              .maybeSingle();

            if (likeData) {
              setLiked(true);
            } else {
              setLiked(false);
            }
          }
        }

        const currentLevel = activeLesson?.level || "GameDev 0dan o'rganish";
        const { data: listData } = await supabase
          .from("gamedev_lessons")
          .select("*")
          .eq("level", currentLevel)
          .order("created_at", { ascending: true });

        let dbLessons = (listData && listData.length > 0) ? listData : DEFAULT_LESSONS.filter(l => l.level === currentLevel);
        if (!dbLessons || dbLessons.length === 0) dbLessons = DEFAULT_LESSONS;
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

  // Real Database Persistence Like Toggle
  const toggleLike = async () => {
    if (!isAuthenticated || !user) {
      alert("Darslikka layk bosish uchun iltimos tizimga kiring.");
      router.push("/login");
      return;
    }

    if (liked) {
      // Unlike logic
      setLiked(false);
      const newLikes = Math.max(likeCount - 1, 0);
      setLikeCount(newLikes);

      try {
        await supabase
          .from("gamedev_lesson_likes")
          .delete()
          .eq("lesson_id", lessonId)
          .eq("user_id", user.id);

        await supabase
          .from("gamedev_lessons")
          .update({ likes_count: newLikes })
          .eq("id", lessonId);
      } catch (err) {
        console.error("Unlike error:", err);
      }
    } else {
      // Like logic
      setLiked(true);
      const newLikes = likeCount + 1;
      setLikeCount(newLikes);
      if (disliked) setDisliked(false);

      try {
        await supabase
          .from("gamedev_lesson_likes")
          .insert({
            lesson_id: lessonId,
            user_id: user.id
          });

        await supabase
          .from("gamedev_lessons")
          .update({ likes_count: newLikes })
          .eq("id", lessonId);
      } catch (err) {
        console.error("Like error:", err);
      }
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

  const currentIndex = playlistLessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? playlistLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < playlistLessons.length - 1 ? playlistLessons[currentIndex + 1] : null;
  const completionPercent = Math.round(((currentIndex + 1) / Math.max(playlistLessons.length, 1)) * 100);

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-20 max-w-7xl">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player, Video Info, Description, Comments (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* WhiteLabel Video Player Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
              <WhiteLabelPlayer 
                url={lesson.video_url} 
                userIdentifier={user?.email || user?.username} 
              />
            </div>

            {/* Quick Next / Previous Navigation Bar under Player */}
            <div className="flex items-center justify-between bg-[#141419] border border-white/10 rounded-2xl p-3.5 shadow-lg">
              <button
                onClick={() => prevLesson && router.push(`/darslar/${prevLesson.id}`)}
                disabled={!prevLesson}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <SkipBack size={14} />
                <span>Oldingi dars</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-secondary font-mono">
                <span className="text-red-400 font-bold">{currentIndex + 1}</span> / {playlistLessons.length}-dars
              </div>

              <button
                onClick={() => nextLesson && router.push(`/darslar/${nextLesson.id}`)}
                disabled={!nextLesson}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Keyingi dars</span>
                <SkipForward size={14} />
              </button>
            </div>

            {/* Video Title */}
            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
              {lesson.title}
            </h1>

            {/* Maroqli Author & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              {/* Author / Channel Info */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-violet-600 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-white uppercase text-sm">
                    {lesson.author?.[0]?.toUpperCase() || "M"}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white text-base">
                    <span>{lesson.author || "Maroqli.uz"}</span>
                    <CheckCircle size={15} className="text-red-500 fill-red-500/20" />
                  </div>
                  <p className="text-xs text-secondary/80 font-mono">Maroqli Rasmiy Muallifi</p>
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
                      <span>Kuzatilyapti</span>
                    </>
                  ) : (
                    <span>Kuzatish</span>
                  )}
                </button>
              </div>

              {/* Action Buttons (Real Like, Dislike, Share, Save) */}
              <div className="flex items-center gap-2">
                {/* Real Like / Dislike Group */}
                <div className="flex items-center bg-[#1f1f25] border border-white/10 rounded-full overflow-hidden shadow-inner">
                  <button
                    onClick={toggleLike}
                    className={`flex items-center gap-2 py-2 px-4 text-xs font-bold transition-all ${
                      liked ? "text-red-500 bg-red-500/15" : "text-white hover:bg-white/10"
                    }`}
                  >
                    <ThumbsUp size={16} className={liked ? "fill-current" : ""} />
                    <span className="tabular-nums">{likeCount.toLocaleString()}</span>
                  </button>
                  <div className="h-4 w-px bg-white/10" />
                  <button
                    onClick={() => {
                      setDisliked(!disliked);
                      if (liked) {
                        setLiked(false);
                        setLikeCount(prev => Math.max(prev - 1, 0));
                      }
                    }}
                    className={`py-2 px-3 text-xs transition-colors ${
                      disliked ? "text-red-500 bg-red-500/15" : "text-white hover:bg-white/10"
                    }`}
                  >
                    <ThumbsDown size={16} className={disliked ? "fill-current" : ""} />
                  </button>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 py-2 px-4 bg-[#1f1f25] hover:bg-[#2b2b35] border border-white/10 rounded-full text-xs font-bold text-white transition-colors"
                >
                  <Share2 size={15} />
                  <span>{copiedLink ? "Nusxalandi!" : "Ulashish"}</span>
                </button>

                {/* Save Button */}
                <button
                  onClick={() => setSaved(!saved)}
                  className={`p-2.5 bg-[#1f1f25] hover:bg-[#2b2b35] border border-white/10 rounded-full text-white transition-colors ${
                    saved ? "text-red-500 bg-red-500/15" : ""
                  }`}
                  title="Saqlash"
                >
                  <Bookmark size={15} className={saved ? "fill-current" : ""} />
                </button>
              </div>
            </div>

            {/* Expandable Lesson Description Box */}
            <div 
              onClick={() => setDescExpanded(!descExpanded)}
              className="bg-[#141419] hover:bg-[#1a1a21] border border-white/10 rounded-2xl p-4 cursor-pointer transition-all space-y-3 shadow-lg"
            >
              <div className="flex items-center gap-3 text-xs font-bold text-white font-mono flex-wrap">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Eye size={14} />
                  <span className="tabular-nums">{viewCount.toLocaleString()}</span> ko'rishlar
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <ThumbsUp size={14} />
                  <span className="tabular-nums">{likeCount.toLocaleString()}</span> layklar
                </span>
                <span>•</span>
                <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-sans font-black uppercase">
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

            {/* Comments Section */}
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
                <div className="text-center py-4 bg-[#141419] border border-white/10 rounded-2xl">
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

          {/* Right Column: Modern YouTube-Style "Jam / Mix" Playlist Sidebar (1 col) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#141419] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-red-950/40 via-violet-950/40 to-[#181820] border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-[10px] font-black uppercase tracking-wider">
                    <Radio size={12} className="animate-pulse" />
                    <span>DARSLIKLAR JAM-LIST</span>
                  </div>

                  {/* Auto Play Toggle */}
                  <button
                    onClick={() => setAutoPlayNext(!autoPlayNext)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                      autoPlayNext ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-secondary border border-white/10"
                    }`}
                    title="Keyingi darsga avtomatik o'tish"
                  >
                    <span>Avto-ijro</span>
                    {autoPlayNext && <Check size={12} />}
                  </button>
                </div>

                <h3 className="font-display font-black text-base text-white uppercase line-clamp-1">
                  {lesson.level}
                </h3>
                
                {/* Course Completion Progress */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-secondary font-semibold">
                    <span>Jarayon: {currentIndex + 1} / {playlistLessons.length}-dars</span>
                    <span className="text-red-400 font-bold">{completionPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-violet-500 rounded-full transition-all duration-500" 
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Playlist Items (Jam List) */}
              <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {playlistLessons.map((item, index) => {
                  const isActive = item.id === lesson.id;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(`/darslar/${item.id}`)}
                      className={`group cursor-pointer flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? "bg-gradient-to-r from-red-500/20 via-violet-500/10 to-transparent border border-red-500/40 text-white shadow-lg" 
                          : "hover:bg-white/5 border border-transparent text-secondary hover:text-white"
                      }`}
                    >
                      {/* Index / Active Equalizer Visualizer */}
                      <div className="w-6 shrink-0 text-center font-mono text-xs font-bold my-auto flex items-center justify-center">
                        {isActive ? (
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-red-500 h-full animate-bounce rounded-full" />
                            <span className="w-1 bg-red-400 h-2/3 animate-bounce [animation-delay:0.2s] rounded-full" />
                            <span className="w-1 bg-violet-400 h-4/5 animate-bounce [animation-delay:0.4s] rounded-full" />
                          </div>
                        ) : (
                          <span className="text-secondary/70">#{index + 1}</span>
                        )}
                      </div>

                      {/* 16:9 Thumbnail with Duration Overlay */}
                      <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black border border-white/10 relative shrink-0">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 text-[9px] font-mono font-bold text-white">
                          {item.duration || "15:20"}
                        </span>
                        {isActive && (
                          <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black uppercase px-1 py-0.2 rounded shadow">
                            IJRO
                          </span>
                        )}
                      </div>

                      {/* Lesson Title & Stats */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`font-sans text-xs font-bold leading-snug line-clamp-2 transition-colors ${
                          isActive ? "text-red-400" : "text-white group-hover:text-red-400"
                        }`}>
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-secondary">
                          <span className="truncate">{item.author || "Maroqli.uz"}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400 font-semibold">{item.views_count ? `${item.views_count} ko'rish` : "1.5K ko'rish"}</span>
                        </div>
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
