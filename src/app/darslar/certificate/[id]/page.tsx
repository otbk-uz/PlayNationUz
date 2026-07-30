"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { BackButton } from "@/components/ui/BackButton";
import { useAuthStore } from "@/lib/store";
import { COURSES } from "@/lib/coursesData";
import { Award, CheckCircle, Download, Printer, Share2, Sparkles, ShieldCheck } from "lucide-react";

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const courseId = params.id as string;
  const course = COURSES.find((c) => c.id === courseId) || COURSES[0];

  const recipientName = user?.full_name || user?.username || "Maroqli Talabasi";
  const issueDate = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const certNumber = `CERT-MAROQLI-2026-${courseId.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white font-sans print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-20 max-w-5xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <BackButton />

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 py-2 px-4 bg-[#18181f] hover:bg-[#252530] border border-white/10 rounded-full text-xs font-bold text-white transition-all shadow-md"
            >
              <Share2 size={15} />
              <span>{copied ? "Nusxalandi!" : "Ulashish"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-red-600 to-violet-600 hover:from-red-700 hover:to-violet-700 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all"
            >
              <Printer size={15} />
              <span>Chop etish / PDF</span>
            </button>
          </div>
        </div>

        {/* Certificate Display Frame */}
        <div 
          ref={certRef}
          className="relative bg-gradient-to-b from-[#14141c] via-[#0d0d12] to-[#14141c] border-4 border-amber-500/40 rounded-3xl p-8 sm:p-14 shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center overflow-hidden font-sans print:border-black print:bg-white print:text-black print:shadow-none print:p-8"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-400/60 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-400/60 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-400/60 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-400/60 rounded-br-xl" />

          {/* Background Seal Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
            <Award size={400} className="text-amber-400" />
          </div>

          {/* Certificate Content */}
          <div className="relative z-10 space-y-6">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 font-mono text-xs font-black uppercase tracking-[0.3em]">
              <Sparkles size={16} />
              <span>MAROQLI ACADEMY • OFFICIAL CERTIFICATE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black font-display uppercase tracking-tight text-white print:text-black">
              Tugatganlik Haqida Sertifikat
            </h1>

            <p className="text-xs sm:text-sm text-secondary font-mono print:text-gray-600 uppercase tracking-widest">
              Ushbu sertifikat rasman tasdiqlaydi:
            </p>

            {/* Recipient Name */}
            <div className="py-2 border-b-2 border-amber-400/40 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-bold font-serif text-amber-300 print:text-black tracking-wide">
                {recipientName}
              </h2>
            </div>

            <p className="text-xs sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed print:text-black">
              Maroqli platformasining professional ta'lim dasturida nazariy bilimlarni egallab, amaliy darslar va har bir modul yakunidagi maxsus sinov testlarini <span className="text-emerald-400 font-bold print:text-black">100% muvaffaqiyatli</span> topshirganligi uchun quyidagi kurs boyicha berildi:
            </p>

            {/* Course Title Badge */}
            <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-6 py-3 shadow-lg print:bg-gray-100 print:border-gray-300">
              <h3 className="text-xl sm:text-2xl font-black text-red-400 print:text-black uppercase">
                {course.title}
              </h3>
              <p className="text-xs text-secondary print:text-gray-600 mt-1 font-mono">
                Davomiyligi: {course.total_duration} • {course.total_lessons} ta dars & testlar
              </p>
            </div>

            {/* Footer Seal & Signatures */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 print:border-gray-300 max-w-3xl mx-auto">
              {/* Verification & QR Code */}
              <div className="text-left font-mono text-[11px] text-secondary print:text-gray-600 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck size={16} />
                  <span>Rasman Tasdiqlangan Sertifikat</span>
                </div>
                <div>ID: <span className="text-white font-bold print:text-black">{certNumber}</span></div>
                <div>Sana: {issueDate}</div>
              </div>

              {/* Gold Seal Graphic */}
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center shrink-0 text-black font-black uppercase text-[10px] text-center leading-tight select-none">
                <div className="w-full h-full rounded-full border-2 border-dashed border-black/40 flex flex-col items-center justify-center">
                  <Award size={22} className="mb-0.5" />
                  <span>MAROQLI</span>
                  <span className="text-[8px]">SEAL</span>
                </div>
              </div>

              {/* Mentor Signature */}
              <div className="text-right font-sans text-xs text-secondary print:text-gray-600 space-y-1">
                <div className="font-serif italic text-lg text-amber-300 print:text-black font-bold">
                  {course.mentor_name}
                </div>
                <div className="font-bold text-white print:text-black">{course.mentor_title}</div>
                <div className="text-[10px] font-mono">Maroqli Academy Lead Instructor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
