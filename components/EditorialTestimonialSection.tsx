"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ATELIER_TESTIMONIALS, type EditorialTestimonial } from "@/lib/testimonials-data";

interface EditorialTestimonialSectionProps {
  autoAdvanceInterval?: number; // ms, default 7500
}

export function EditorialTestimonialSection({
  autoAdvanceInterval = 7500,
}: EditorialTestimonialSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const testimonials = ATELIER_TESTIMONIALS;
  const current = testimonials[currentIndex];
  const totalFormatted = testimonials.length.toString().padStart(2, "0");

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      setIsTransitioning(false);
    }, 240);
  }, [testimonials.length]);

  const goToIndex = (idx: number) => {
    if (idx === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setIsTransitioning(false);
    }, 240);
  };

  // Auto-advance timer (pauses on user interaction)
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      goToNext();
    }, autoAdvanceInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoAdvanceInterval, goToNext]);

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
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 min-h-[440px] lg:min-h-[500px] items-stretch">
        
        {/* LEFT COLUMN: Numeric Index, Author Details, Navigation Trigger, Avatars (md:col-span-3) */}
        <div className="md:col-span-3 flex flex-col justify-between pr-2 sm:pr-4 border-b md:border-b-0 border-deep/10 pb-6 md:pb-0">
          <div>
            {/* Index Counter 01 /08 */}
            <div className="flex items-baseline">
              <span className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-deep tracking-tighter">
                {current.index}
              </span>
              <span className="font-body text-sm sm:text-base text-muted tracking-widest ml-1 font-normal">
                /{totalFormatted}
              </span>
            </div>

            {/* Client Bracket Tag & Studio Role */}
            <div className="mt-8 sm:mt-12">
              <h4 className="font-body text-xs sm:text-sm font-semibold tracking-wider text-deep">
                [{current.clientName}]
              </h4>
              <p className="font-body text-[11px] sm:text-xs text-muted mt-1 leading-snug">
                {current.roleOrLocation}
              </p>
            </div>
          </div>

          {/* Action Trigger & Avatar Previews Cluster */}
          <div className="mt-8 md:mt-auto pt-6 flex items-center justify-between md:justify-start gap-4">
            {/* Circular Arrow Button (Advances to next) */}
            <button
              type="button"
              onClick={goToNext}
              aria-label="View Next Testimonial"
              className="w-11 h-11 rounded-full border border-deep/20 hover:border-gold hover:bg-gold/10 flex items-center justify-center transition-all duration-300 text-deep hover:text-gold group shrink-0 shadow-sm"
            >
              <ArrowRight className="w-4 h-4 stroke-[1.5] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Clickable Client Avatar Cluster */}
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
                    className={`relative rounded-full transition-all duration-300 overflow-hidden ${
                      isActive
                        ? "w-9 h-9 ring-2 ring-gold z-10 scale-105"
                        : "w-8 h-8 opacity-65 hover:opacity-100 ring-1 ring-deep/10 hover:scale-105"
                    }`}
                  >
                    <Image
                      src={t.avatarUrl}
                      alt={t.clientName}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT / MAIN QUOTE COLUMN: Tag, Giant Display Serif Statement, Bottom Controls (md:col-span-9) */}
        <div className="md:col-span-9 flex flex-col justify-between pl-0 md:pl-6 lg:pl-10">
          
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

          {/* Colossal Quotation Statement with Smooth Crossfade */}
          <div
            className={`my-auto py-4 sm:py-6 transition-all duration-300 transform ${
              isTransitioning
                ? "opacity-0 translate-y-3"
                : "opacity-100 translate-y-0"
            }`}
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
          </div>

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
    </section>
  );
}
