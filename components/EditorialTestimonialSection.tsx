"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, Award, Clock, Heart, Shield, Sparkles, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { EditorialTestimonial } from "@/lib/testimonials-data";

export interface TrustStatItem {
  value: string;
  label: string;
  desc: string;
  iconName?: string;
}

function renderStatIcon(iconName?: string) {
  const key = (iconName || "").trim().toLowerCase();
  const cls = "w-4 h-4 stroke-[1.75]";
  switch (key) {
    case "clock":
      return <Clock className={cls} />;
    case "award":
      return <Award className={cls} />;
    case "heart":
      return <Heart className={cls} />;
    case "star":
      return <Star className={cls} />;
    case "shield":
      return <Shield className={cls} />;
    case "sparkles":
    default:
      return <Sparkles className={cls} />;
  }
}

interface EditorialTestimonialSectionProps {
  autoAdvanceInterval?: number; // ms, default 7500
  initialStats?: TrustStatItem[];
  initialTestimonials?: EditorialTestimonial[];
}

export function EditorialTestimonialSection({
  autoAdvanceInterval = 7500,
  initialStats,
  initialTestimonials,
}: EditorialTestimonialSectionProps) {
  const hasInitialTestimonials =
    Array.isArray(initialTestimonials) && initialTestimonials.length > 0;
  const hasInitialStats = Array.isArray(initialStats) && initialStats.length > 0;

  const [testimonials, setTestimonials] = useState<EditorialTestimonial[]>(
    hasInitialTestimonials ? initialTestimonials! : []
  );
  const [stats, setStats] = useState<TrustStatItem[]>(
    hasInitialStats ? initialStats! : []
  );
  const [loading, setLoading] = useState(!hasInitialTestimonials);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch live testimonials from Neon DB if not hydrated from SSR
  useEffect(() => {
    if (!hasInitialTestimonials) {
      setLoading(true);
      fetch("/api/testimonials")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
            setTestimonials(data.testimonials);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    if (!hasInitialStats) {
      fetch("/api/content?key=about_stats")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.value) && data.value.length > 0) {
            setStats(data.value);
          }
        })
        .catch(() => {});
    }
  }, [hasInitialTestimonials, hasInitialStats]);

  const current = testimonials[currentIndex] || null;
  const totalFormatted = Math.max(testimonials.length, 1).toString().padStart(2, "0");
  const activeStat = stats.length > 0 ? stats[currentIndex % stats.length] : null;
  const displayIndex = current?.index || String(currentIndex + 1).padStart(2, "0");

  const goToNext = useCallback(() => {
    if (testimonials.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const goToIndex = (idx: number) => {
    if (idx === currentIndex || testimonials.length === 0) return;
    setCurrentIndex(idx);
  };

  // Auto-advance timer (pauses on user interaction)
  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;
    timerRef.current = setInterval(() => {
      goToNext();
    }, autoAdvanceInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoAdvanceInterval, goToNext, testimonials.length]);

  return (
    <section
      aria-label="Client Testimonials & Love Notes"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="relative w-full bg-[#F4F5F1] text-deep border-y border-line/60 overflow-hidden py-10 sm:py-14 lg:py-16 select-none"
    >
      {/* 4 Continuous Architectural Vertical Dashed Column Gridlines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Line 1: Left Gutter Inset */}
        <div className="absolute top-0 bottom-0 left-4 sm:left-8 lg:left-12 border-r border-dashed border-deep/15" />
        {/* Line 2: Sidebar / Main Division (~26% across) */}
        <div className="hidden md:block absolute top-0 bottom-0 left-[26%] border-r border-dashed border-deep/15" />
        {/* Line 3: Internal Quote / Accent Division (~68% across) */}
        <div className="hidden lg:block absolute top-0 bottom-0 left-[68%] border-r border-dashed border-deep/15" />
        {/* Line 4: Right Gutter Inset */}
        <div className="absolute top-0 bottom-0 right-4 sm:right-8 lg:right-12 border-r border-dashed border-deep/15" />
      </div>

      {/* Subtle Autoplay Progress Line at Top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-deep/5 z-20">
        <div
          key={`${currentIndex}-${isPaused ? "paused" : "running"}`}
          className={`h-full bg-gold/75 transition-all ${
            isPaused ? "opacity-30" : "animate-progress"
          }`}
          style={{
            animationDuration: `${autoAdvanceInterval}ms`,
            animationTimingFunction: "linear",
          }}
        />
      </div>

      {/* Grid Content Stage */}
      {loading || !current ? (
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 min-h-[460px] lg:min-h-[520px] items-stretch">
          <div className="md:col-span-3 flex flex-col justify-between pr-2 sm:pr-4 border-b md:border-b-0 border-deep/10 pb-6 md:pb-0">
            <div>
              <div className="h-16 w-24 bg-deep/10 rounded animate-pulse mb-8" />
              <div className="h-4 w-32 bg-deep/15 rounded animate-pulse mb-2" />
              <div className="h-3 w-40 bg-muted/20 rounded animate-pulse" />
            </div>
            <div className="mt-6 sm:mt-8 h-32 rounded-2xl bg-[#FAF7F2]/80 border border-[#E5DECF] animate-pulse" />
            <div className="flex items-center gap-4 mt-6 md:mt-auto pt-5">
              <div className="w-11 h-11 rounded-full bg-deep/10 animate-pulse" />
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-gold/15 animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-gold/10 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="md:col-span-9 flex flex-col justify-between pl-0 md:pl-6 lg:pl-10">
            <div className="flex items-center justify-between pb-4 sm:pb-6">
              <div className="h-3 w-24 bg-deep/15 rounded animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-deep/10 animate-pulse" />
            </div>
            <div className="my-auto py-4 sm:py-6 space-y-4 max-w-4xl">
              <div className="h-10 sm:h-12 w-3/4 bg-gold/20 rounded animate-pulse" />
              <div className="h-6 w-full bg-deep/10 rounded animate-pulse" />
              <div className="h-6 w-5/6 bg-deep/10 rounded animate-pulse" />
              <div className="h-6 w-2/3 bg-deep/10 rounded animate-pulse" />
            </div>
            <div className="pt-6 border-t border-deep/10 flex items-center justify-between">
              <div className="h-3.5 w-48 bg-muted/20 rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-gold/25 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ) : (
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 min-h-[460px] lg:min-h-[520px] items-stretch">
        
        {/* LEFT COLUMN: Numeric Index, Author Details, Synced Studio Trust Box, Navigation Trigger, Avatars (md:col-span-3) */}
        <div className="md:col-span-3 flex flex-col justify-between pr-2 sm:pr-4 border-b md:border-b-0 border-deep/10 pb-6 md:pb-0 reveal-down">
          <div>
            {/* Index Counter 01 /08 */}
            <div className="flex items-baseline">
              <span className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-deep tracking-tighter">
                {displayIndex}
              </span>
              <span className="font-body text-sm sm:text-base text-muted tracking-widest ml-1 font-normal">
                /{totalFormatted}
              </span>
            </div>

            {/* Client Bracket Tag & Studio Role with Framer Motion */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id || currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 sm:mt-8"
              >
                <h4 className="font-body text-xs sm:text-sm font-semibold tracking-wider text-deep">
                  [{current.clientName}]
                </h4>
                <p className="font-body text-[11px] sm:text-xs text-muted mt-1 leading-snug">
                  {current.roleOrLocation}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Integrated Single Studio Trust Box (cycles with active testimonial, sourced from settings.about_stats) */}
          <AnimatePresence mode="wait">
            {activeStat && (
              <motion.div
                key={activeStat.label || (currentIndex % stats.length)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 sm:mt-8"
              >
                <div className="bg-[#FAF7F2]/95 border border-[#E5DECF] rounded-2xl p-4 sm:p-5 shadow-[0_6px_24px_rgba(26,20,16,0.04)] backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center text-gold shrink-0">
                      {renderStatIcon(activeStat.iconName)}
                    </div>
                    <span className="font-body text-[9px] uppercase tracking-[0.2em] text-deep/45 font-semibold pt-1">
                      Approach · {String((currentIndex % stats.length) + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-normal text-deep leading-none mb-1.5">
                    {activeStat.value}
                  </div>
                  <h5 className="font-body text-[11px] uppercase tracking-[0.14em] font-bold text-deep/85 mb-1">
                    {activeStat.label}
                  </h5>
                  <p className="font-body text-xs text-muted leading-relaxed">
                    {activeStat.desc}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Trigger & Avatar Previews Cluster */}
          <div className="mt-6 md:mt-auto pt-5 flex items-center justify-between md:justify-start gap-4">
            {/* Circular Arrow Button (Advances to next) */}
            <button
              type="button"
              onClick={goToNext}
              aria-label="View Next Testimonial"
              className="w-11 h-11 rounded-full border border-deep/20 hover:border-gold hover:bg-gold/10 flex items-center justify-center transition-all duration-300 text-deep hover:text-gold group shrink-0 shadow-sm"
            >
              <ArrowRight className="w-4 h-4 stroke-[1.5] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Clickable Client Avatar Cluster (native img prevents Next optimizer failures on production) */}
            <div className="flex items-center -space-x-2 py-1">
              {testimonials.map((t, idx) => {
                const isActive = idx === currentIndex;
                const isRelevant =
                  idx === currentIndex ||
                  idx === (currentIndex + 1) % testimonials.length ||
                  idx === (currentIndex + 2) % testimonials.length;

                if (!isRelevant) return null;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => goToIndex(idx)}
                    aria-label={`Jump to review by ${t.clientName}`}
                    className={`relative rounded-full transition-all duration-300 overflow-hidden bg-sand ${
                      isActive
                        ? "w-9 h-9 ring-2 ring-gold z-10 scale-105"
                        : "w-8 h-8 opacity-75 hover:opacity-100 ring-1 ring-deep/15 hover:scale-105"
                    }`}
                  >
                    <img
                      src={t.avatarUrl || "/images/client/events_2.webp"}
                      alt={t.clientName}
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = "true";
                          img.src = "/images/client/events_2.webp";
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT / MAIN QUOTE COLUMN: Tag, Giant Display Serif Statement, Bottom Controls (md:col-span-9) */}
        <div className="md:col-span-9 flex flex-col justify-between pl-0 md:pl-6 lg:pl-10 reveal-up delay-100">
          
          {/* Header Row: Category Tag [Testimonial] & Circular Dark Quotation Seal */}
          <div className="flex items-center justify-between pb-4 sm:pb-6">
            <span className="font-body text-xs uppercase tracking-[0.22em] text-deep/70 font-semibold">
              [Testimonial]
            </span>

            {/* Circular Dark Quotation Badge */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-deep text-warm-white flex items-center justify-center shadow-editorial shrink-0">
              <span className="font-display text-xl sm:text-2xl leading-none font-bold select-none">
                “
              </span>
            </div>
          </div>

          {/* Colossal Quotation Statement with Framer Motion Crossfade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id || currentIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="my-auto py-4 sm:py-6"
            >
              <div className="max-w-4xl">
                <h3 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-deep font-normal leading-[1.12] tracking-tight mb-4">
                  <span className="text-gold font-serif mr-1">“</span>
                  {current.headline}
                </h3>
                <p className="font-display italic text-lg sm:text-2xl lg:text-3xl text-deep/85 font-light leading-relaxed max-w-3xl">
                  {current.quote}”
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Bar: Brand Promise Tagline, Quote Glyph, and [Next] Trigger */}
          <div className="pt-6 border-t border-deep/10 flex items-center justify-between">
            <p className="font-body text-xs sm:text-sm text-muted tracking-wide">
              See Through the Eyes of Our Families
            </p>

            <div className="hidden lg:block text-deep/25 font-display text-lg select-none">
              ”
            </div>

            <button
              type="button"
              onClick={goToNext}
              className="font-body text-xs sm:text-sm font-semibold tracking-wider text-deep hover:text-gold transition-colors inline-flex items-center gap-1 group"
            >
              <span>[Next]</span>
            </button>
          </div>
        </div>

      </div>
      )}
    </section>
  );
}
