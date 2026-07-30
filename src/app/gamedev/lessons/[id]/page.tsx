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
  ListVideo, SkipForward, SkipBack, Eye, Radio, Flame, Check, HelpCircle, Award, X, AlertCircle, Lock
} from "lucide-react";
import Link from "next/link";
import { getCachedData, setCachedData } from "@/lib/cache";
import { DEFAULT_LESSONS } from "@/lib/lessonsData";
import { COURSES } from "@/lib/coursesData";

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

  // Quiz & Certificate states
  const [videoWatched, setVideoWatched] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const [showCertSuccessModal, setShowCertSuccessModal] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // Comments states
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  const lessonId = params.id as string;

  // Find course and lesson quizzes
  const parentCourse = COURSES.find(c => c.modules.some(m => m.lessons.some(l => l.id === lessonId))) || COURSES[0];
  const matchingLessonData = parentCourse.modules.flatMap(m => m.lessons).find(l => l.id === lessonId);
  const quizzes = matchingLessonData?.quizzes || [];

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

    // Reset quiz modal state when lesson changes
    setShowQuizModal(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizPassed(false);
    setVideoWatched(false);

    // Check if user already completed this lesson previously
    if (user) {
      supabase
        .from("user_course_progress")
        .select("completed")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.completed) {
            setVideoWatched(true);
          }
        });
    }

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
          try {
            await supabase
              .from("gamedev_lessons")
              .update({ views_count: newViews })
              .eq("id", lessonId);
          } catch (e) {
            console.warn("View count update warning:", e);
          }

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

  const toggleLike = async () => {
    if (!isAuthenticated || !user) {
      alert("Darslikka layk bosish uchun iltimos tizimga kiring.");
      router.push("/login");
      return;
    }

    if (liked) {
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

  // Submit 5-Question Quiz Logic
  const handleQuizSubmit = async () => {
    let score = 0;
    quizzes.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    setQuizScore(score);
    const passed = score >= 3; // Pass threshold: 3/5 correct
    setQuizPassed(passed);
    setQuizSubmitted(true);

    if (passed && user) {
      setSavingProgress(true);
      try {
        // Save progress to Supabase
        await supabase
          .from("user_course_progress")
          .upsert({
            user_id: user.id,
            course_id: parentCourse.id,
            lesson_id: lessonId,
            quiz_score: score,
            quiz_passed: true,
            completed: true
          });

        // Check overall course completion
        const { data: progList } = await supabase
          .from("user_course_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("course_id", parentCourse.id)
          .eq("completed", true);

        const totalCourseLessons = parentCourse.total_lessons;
        const completedCount = (progList?.length || 0) + 1; // Including current

        if (completedCount >= totalCourseLessons) {
          setTimeout(() => {
            setShowQuizModal(false);
            setShowCertSuccessModal(true);
          }, 1500);
        }
      } catch (e) {
        console.warn("Save progress warning:", e);
      } finally {
        setSavingProgress(false);
      }
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0c] text-white">
        <RefreshCw className="animate-spin text-red-500 mb-4" size={36} />
        <p className="text-secondary text-xs uppercase tracking-widest">{t("lesson_loading", "Darslik yuklanmoqda...")}</p>
      </div>
    );
  }

  if (!lesson) return null;

  const currentIndex = playlistLessons.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? playlistLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < playlistLessons.length - 1 ? playlistLessons[currentIndex + 1] : null;

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-20 max-w-7xl">
        <div className="mb-4">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Player, Video Info, Description, Quiz Bar, Comments */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* WhiteLabel Video Player Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
              <WhiteLabelPlayer 
                url={lesson.video_url} 
                userIdentifier={user?.email || user?.username} 
                onEnded={() => setVideoWatched(true)}
              />
            </div>

            {/* Navigation & 5-Question Quiz Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141419] border border-white/10 rounded-2xl p-3.5 shadow-lg">
              <button
                onClick={() => prevLesson && router.push(`/darslar/${prevLesson.id}`)}
                disabled={!prevLesson}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <SkipBack size={14} />
                <span>Oldingi dars</span>
              </button>

              {/* 5-Question Quiz Trigger Button (Unlocked only after video is watched) */}
              {quizzes.length > 0 && (
                videoWatched ? (
                  <button
                    onClick={() => setShowQuizModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-violet-600 hover:from-red-700 hover:to-violet-700 text-white shadow-lg shadow-red-600/30 transition-all animate-pulse"
                  >
                    <HelpCircle size={16} />
                    <span>5 TALIK TESTNI YECHISH</span>
                  </button>
                ) : (
                  <button
                    onClick={() => alert("🔒 Testni yechish uchun iltimos videodarslikni oxirigacha ko'rib chiqing.")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-secondary hover:text-white transition-all cursor-not-allowed"
                    title="Video darslik tugagach test ochiladi"
                  >
                    <Lock size={15} className="text-amber-400" />
                    <span>5 TALIK TESTNI YECHISH (Video tugagach ochiladi)</span>
                  </button>
                )
              )}

              <button
                onClick={() => nextLesson && router.push(`/darslar/${nextLesson.id}`)}
                disabled={!nextLesson}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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

              <div className="flex items-center gap-2">
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

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 py-2 px-4 bg-[#1f1f25] hover:bg-[#2b2b35] border border-white/10 rounded-full text-xs font-bold text-white transition-colors"
                >
                  <Share2 size={15} />
                  <span>{copiedLink ? "Nusxalandi!" : "Ulashish"}</span>
                </button>
              </div>
            </div>

            {/* Expandable Description Box */}
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
              </div>

              <div className={`text-xs text-secondary leading-relaxed space-y-2 font-sans ${descExpanded ? "" : "line-clamp-2"}`}>
                <p>Ushbu video darslik orqali o'yin yaratish sohasidagi ko'nikmalarni bosqichma-bosqich o'rganishingiz va Maroqli.uz platformasi do'koniga loyihalaringizni joylashtirib daromad olishni boshlashingiz mumkin.</p>
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
                          type="submit"
                          disabled={submittingComment}
                          className="py-1.5 px-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                        >
                          <span>Izoh qoldirish</span>
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
              <div className="space-y-4 pt-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs">
                      {comment.profiles?.username?.[0]?.toUpperCase() || <User size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">@{comment.profiles?.username || "foydalanuvchi"}</span>
                      </div>
                      <p className="text-xs text-white/90 mt-1 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Jam Playlist Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#141419] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
              <div className="bg-gradient-to-r from-red-950/40 via-violet-950/40 to-[#181820] border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-[10px] font-black uppercase tracking-wider">
                    <Radio size={12} className="animate-pulse" />
                    <span>DARSLIKLAR JAM-LIST</span>
                  </div>
                </div>

                <h3 className="font-display font-black text-base text-white uppercase line-clamp-1">
                  {lesson.level}
                </h3>
              </div>

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

                      <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black border border-white/10 relative shrink-0">
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 text-[9px] font-mono font-bold text-white">
                          {item.duration || "15:20"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className={`font-sans text-xs font-bold leading-snug line-clamp-2 ${isActive ? "text-red-400" : "text-white"}`}>
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Question Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#14141f] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowQuizModal(false)}
              className="absolute top-5 right-5 text-secondary hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <HelpCircle size={24} className="text-amber-400" />
              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  5 talik Bilimni Tekshirish Testi
                </h3>
                <p className="text-xs text-secondary font-mono">Dars: {lesson.title}</p>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <p className="text-secondary text-sm">Ushbu dars uchun test savollari tez orada qo'shiladi.</p>
            ) : (
              <div className="space-y-6">
                {quizzes.map((q, qIdx) => (
                  <div key={q.id} className="bg-[#181824] border border-white/10 rounded-2xl p-4 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-start gap-2">
                      <span className="text-amber-400 font-mono">{qIdx + 1}.</span>
                      <span>{q.question}</span>
                    </h4>

                    <div className="space-y-2 pl-4">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[q.id] === optIdx;
                        const isCorrect = q.correctAnswer === optIdx;

                        let style = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10";
                        if (quizSubmitted) {
                          if (isCorrect) style = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold";
                          else if (isSelected && !isCorrect) style = "bg-red-500/20 border-red-500/50 text-red-400";
                        } else if (isSelected) {
                          style = "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold";
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && <Check size={16} className="text-emerald-400" />}
                          </div>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <p className="text-[11px] text-secondary font-mono italic pl-4 border-l-2 border-amber-400/50 pt-1">
                        Tushuntirish: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}

                <div className="pt-2 flex items-center justify-between">
                  {quizSubmitted ? (
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold font-mono ${quizPassed ? "text-emerald-400" : "text-red-400"}`}>
                        Natija: {quizScore} / {quizzes.length} ({quizPassed ? "O'TDI!" : "O'TMADI"})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-secondary font-mono">Kamida 3 ta to'g'ri javob topshirilishi kerak.</span>
                  )}

                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < quizzes.length}
                      className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-40"
                    >
                      Testni topshirish
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowQuizModal(false)}
                      className="py-2.5 px-6 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl"
                    >
                      Yopish
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Completion Celebration & Certificate Modal */}
      {showCertSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-[#141420] border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center text-black shadow-lg animate-bounce">
              <Award size={44} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest">
                TABRIKLAYMIZ! 🎉
              </span>
              <h3 className="font-display text-2xl font-black text-white uppercase">
                Kursni Muvaffaqiyatli Tugatdingiz!
              </h3>
              <p className="text-xs text-secondary leading-relaxed font-sans">
                Siz "{parentCourse.title}" kursidagi barcha darslar va testlarni 100% topshirdingiz hamda rasmiy sertifikatga ega bo'ldingiz!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/darslar/certificate/${parentCourse.id}`)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/30 transition-transform transform hover:scale-105"
              >
                Sertifikatni olish & Yuklab olish
              </button>

              <button
                onClick={() => setShowCertSuccessModal(false)}
                className="w-full py-2.5 text-xs font-bold text-secondary hover:text-white"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
