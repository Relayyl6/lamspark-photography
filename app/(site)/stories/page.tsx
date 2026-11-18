"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  Sun,
  Clock,
  BookOpen,
  Heart,
  Quote,
  Eye,
  Compass,
  Layers,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

interface StoryItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  sessionType: string;
  sessionSlug: string;
  client: string;
  date: string;
  location: string;
  lightDetails: string;
  excerpt: string;
  quote: string;
  quoteAuthor: string;
  studioMood: string;
  craft: {
    lens: string;
    lighting: string;
    pacing: string;
    keepsake: string;
  };
  image: string;
  imageAlt: string;
  vintageSign: string;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const showcaseRef = useRef<HTMLDivElement>(null);

  // Fetch live stories from Neon DB
  useEffect(() => {
    fetch("/api/stories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.stories) && data.stories.length > 0) {
          setStories(data.stories);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = stories[activeStoryIdx] || stories[0];

  // Keyboard navigation for unhurried browsing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === " " || e.key === "Enter") {
        // Toggle flip when focusing stage
        if (document.activeElement?.getAttribute("data-interactive-card")) {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStoryIdx]);

  function switchStory(newIndex: number) {
    if (newIndex === activeStoryIdx) return;
    setIsChanging(true);
    setIsFlipped(false);
    setTimeout(() => {
      setActiveStoryIdx(newIndex);
      setIsChanging(false);
      if (showcaseRef.current) {
        showcaseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
  }

  function goToPrevious() {
    const nextIdx = activeStoryIdx > 0 ? activeStoryIdx - 1 : stories.length - 1;
    switchStory(nextIdx);
  }

  function goToNext() {
    const nextIdx = (activeStoryIdx + 1) % stories.length;
    switchStory(nextIdx);
  }

  return (
    <>
      <Nav />
      <main className="flex-1 bg-cream py-12 sm:py-20 px-4 sm:px-6 lg:px-8 selection:bg-gold-light selection:text-deep">
        <div className="max-w-7xl mx-auto">
          {/* Editorial Section Header */}
          <div className="max-w-3xl mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-white border border-line text-xs font-body uppercase tracking-[0.22em] text-gold font-semibold mb-4 shadow-editorial">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Real Abuja Families · The Living Chronicles</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl text-deep font-normal leading-[1.08] tracking-tight">
              Session Stories
            </h1>
            <p className="font-body text-base sm:text-lg text-brown/90 mt-5 leading-relaxed font-light">
              Every portrait is born from conversation, unhurried time, and deep reverence. Click the card below to flip between the photographic composition and the intimate client narrative behind it.
            </p>
          </div>

          {/* Interactive Story Showcase Stage */}
          {loading || !current ? (
            <div className="scroll-mt-24 mb-24 animate-pulse">
              {/* Story Narrative Player Bar Skeleton */}
              <div className="bg-warm-white/80 rounded-photo p-4 sm:p-6 border border-line mb-8 shadow-editorial">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 bg-line/60 rounded" />
                    <div className="h-7 w-[1px] bg-line" />
                    <div className="space-y-2">
                      <div className="w-24 h-3 bg-line/60 rounded" />
                      <div className="w-48 h-5 bg-line/80 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-line/60" />
                    <div className="w-9 h-9 rounded-full bg-line/60" />
                  </div>
                </div>
              </div>

              {/* Stage Skeleton: Left Square Card + Right Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 flex flex-col items-center">
                  <div className="w-full max-w-[380px] sm:max-w-[440px] aspect-square rounded-photo bg-[#EBE5DC] border border-gold/30 flex flex-col justify-between p-6 shadow-floating">
                    <div className="flex justify-between items-center">
                      <div className="w-28 h-5 rounded-full bg-white/60" />
                      <div className="w-16 h-6 rounded-full bg-white/60" />
                    </div>
                    <div className="space-y-3">
                      <div className="w-32 h-3 bg-white/50 rounded" />
                      <div className="w-3/4 h-6 bg-white/70 rounded" />
                      <div className="w-1/2 h-4 bg-white/50 rounded" />
                    </div>
                  </div>

                  {/* Thumbnail Deck Skeleton */}
                  <div className="mt-8 w-full max-w-2xl">
                    <div className="flex gap-3 overflow-hidden">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-48 h-16 rounded-xl bg-[#EBE5DC] border border-line/60 p-2.5 flex items-center gap-3 shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-white/60" />
                          <div className="space-y-1.5 flex-1">
                            <div className="w-16 h-2.5 bg-white/60 rounded" />
                            <div className="w-24 h-3 bg-white/70 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-warm-white/90 rounded-photo p-6 sm:p-8 border border-line shadow-editorial space-y-4">
                    <div className="w-28 h-3 bg-line/60 rounded" />
                    <div className="w-44 h-6 bg-line/80 rounded" />
                    <div className="space-y-2 pt-2">
                      <div className="w-full h-3 bg-line/40 rounded" />
                      <div className="w-5/6 h-3 bg-line/40 rounded" />
                      <div className="w-4/6 h-3 bg-line/40 rounded" />
                    </div>
                    <div className="space-y-3 pt-4 border-t border-line/60">
                      <div className="w-32 h-3 bg-line/50 rounded" />
                      <div className="w-48 h-4 bg-line/60 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div ref={showcaseRef} className="scroll-mt-24 mb-24">
            {/* Story Narrative Player Bar */}
            <div className="bg-warm-white rounded-photo p-4 sm:p-6 border border-line mb-8 shadow-editorial">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Story tracker text */}
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl sm:text-3xl text-gold font-light">
                    {current.number}
                  </span>
                  <div className="h-7 w-[1px] bg-line" />
                  <div>
                    <span className="font-body text-[11px] uppercase tracking-[0.2em] text-muted font-bold block">
                      Chronicle {activeStoryIdx + 1} of {stories.length}
                    </span>
                    <h2 className="font-display text-lg sm:text-xl text-deep font-normal leading-tight">
                      {current.subtitle}
                    </h2>
                  </div>
                </div>

                {/* Progress Indicators & Navigation Controls */}
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Segmented Progress Pills */}
                  <div className="hidden sm:flex items-center gap-2">
                    {stories.map((story, i) => (
                      <button
                        key={story.id}
                        type="button"
                        onClick={() => switchStory(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === activeStoryIdx
                            ? "w-8 bg-gold shadow-sm"
                            : i < activeStoryIdx
                            ? "w-3 bg-gold/50"
                            : "w-3 bg-line hover:bg-gold/40"
                        }`}
                        aria-label={`Jump to story ${i + 1}: ${story.title}`}
                      />
                    ))}
                  </div>

                  {/* Stepper Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goToPrevious}
                      className="p-3 rounded-full border border-line bg-cream hover:bg-warm-white hover:border-gold hover:text-gold transition-all duration-200 active:scale-95 text-deep"
                      aria-label="Previous family story"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="p-3 rounded-full border border-line bg-cream hover:bg-warm-white hover:border-gold hover:text-gold transition-all duration-200 active:scale-95 text-deep"
                      aria-label="Next family story"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Flippable Card Stage (Small Square) & Companion Chronicle */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left / Center Stage: The 3D Flippable Small Square Story Card */}
              <div className="lg:col-span-8 flex flex-col items-center">
                <div
                  className="w-full max-w-[380px] sm:max-w-[440px] aspect-square relative rounded-photo transition-all duration-300"
                  style={{ perspective: "1200px" }}
                >
                  {/* The Flippable 3D Square Container */}
                  <div
                    data-interactive-card="true"
                    tabIndex={0}
                    role="button"
                    aria-label={`Story card for ${current.title}. Press space or enter to flip.`}
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className={`relative w-full h-full rounded-photo cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-gold/60 transition-transform duration-700 ease-out preserve-3d ${
                      isChanging ? "opacity-75 scale-[0.98]" : "opacity-100 scale-100"
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* ==============================================================
                        FRONT OF CARD (Square): Full Editorial Portrait & Metadata
                        ============================================================== */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-photo overflow-hidden bg-deep text-warm-white shadow-floating border border-gold/40 flex flex-col justify-between"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      {/* Full Editorial Portrait with Vignette Overlay */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src={current.image}
                          alt={current.imageAlt}
                          className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/40 to-deep/60" />
                      </div>

                      {/* FRONT CARD TOP BAR */}
                      <div className="relative z-10 p-4 sm:p-5 flex items-start justify-between gap-2">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-deep/85 backdrop-blur-md border border-gold/40 text-[9px] sm:text-[10px] font-body uppercase tracking-[0.2em] text-gold font-bold">
                          {current.sessionType}
                        </span>

                        {/* Interactive Flip CTA Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(true);
                          }}
                          className="flex items-center gap-1.5 bg-warm-white/95 hover:bg-warm-white text-deep px-3 py-1.5 rounded-full border border-gold/60 shadow-editorial text-[11px] font-body font-medium transition-all duration-300 hover:scale-105 active:scale-95 group shrink-0"
                          aria-label="Flip card to read craft story"
                        >
                          <RotateCw className="w-3 h-3 text-gold group-hover:rotate-180 transition-transform duration-500" />
                          <span>Flip ↺</span>
                        </button>
                      </div>

                      {/* FRONT CARD BOTTOM BAR */}
                      <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-t from-deep via-deep/85 to-transparent">
                        <span className="font-body text-[10px] text-gold font-semibold uppercase tracking-wider block mb-0.5">
                          {current.vintageSign}
                        </span>
                        <h3 className="font-display text-lg sm:text-2xl text-warm-white font-normal leading-tight drop-shadow-sm mb-1.5">
                          {current.title}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-warm-white/80 font-body">
                          <span>{current.client} · {current.date}</span>
                          <span className="text-gold font-serif italic text-xs">{current.lightDetails}</span>
                        </div>
                      </div>
                    </div>

                    {/* ==============================================================
                        BACK OF CARD (Square): Behind-the-Scenes Craft Alchemy
                        ============================================================== */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-photo overflow-hidden bg-warm-white text-deep shadow-floating border border-gold/40 p-4 sm:p-6 flex flex-col justify-between"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {/* Top Header of Back Side */}
                      <div>
                        <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
                          <div>
                            <span className="font-body text-[9px] uppercase tracking-[0.2em] text-gold font-bold block">
                              Behind the Lens · Craft Story
                            </span>
                            <h3 className="font-display text-base sm:text-lg text-deep font-normal leading-tight">
                              {current.title}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFlipped(false);
                            }}
                            className="flex items-center gap-1 bg-cream hover:bg-warm-white px-2.5 py-1 rounded-full border border-gold/40 text-[10px] font-body text-deep font-medium transition-all group shrink-0"
                            aria-label="Flip back to portrait"
                          >
                            <RotateCw className="w-2.5 h-2.5 text-gold group-hover:-rotate-180 transition-transform duration-500" />
                            <span>Flip Back ↻</span>
                          </button>
                        </div>

                        {/* Craft Specifications Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-cream/60 p-2 rounded-lg border border-line/60">
                            <span className="font-body text-[9px] uppercase tracking-wider text-muted font-bold block">
                              Optics & Glass
                            </span>
                            <p className="font-body text-[11px] text-deep font-medium truncate">
                              {current.craft.lens}
                            </p>
                          </div>
                          <div className="bg-cream/60 p-2 rounded-lg border border-line/60">
                            <span className="font-body text-[9px] uppercase tracking-wider text-muted font-bold block">
                              Light Alchemy
                            </span>
                            <p className="font-body text-[11px] text-deep font-medium truncate">
                              {current.craft.lighting}
                            </p>
                          </div>
                        </div>

                        {/* Emotive Narrative Excerpt */}
                        <div className="space-y-1">
                          <blockquote className="font-serif italic text-xs text-brown/90 leading-relaxed border-l-2 border-gold/50 pl-2.5 line-clamp-3">
                            &ldquo;{current.quote}&rdquo;
                          </blockquote>
                        </div>
                      </div>

                      {/* Bottom Action inside Square Back */}
                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        <Link
                          href={current.sessionSlug}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-body font-semibold text-deep hover:text-gold transition-colors"
                        >
                          <span>Explore Session</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>

                        <Link
                          href="/book"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 bg-deep hover:bg-brown text-warm-white font-body text-[10px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full transition-all"
                        >
                          <span>Commission</span>
                          <ArrowUpRight className="w-3 h-3 text-gold-light" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deck of Horizontally Laid Out Cards to Choose From */}
                <div className="mt-8 w-full max-w-2xl">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="font-body text-[10px] uppercase tracking-[0.22em] text-gold font-bold">
                      Chronicle Deck · Tap to Inspect
                    </span>
                    <span className="font-body text-[11px] text-muted">
                      {activeStoryIdx + 1} of {stories.length} Chronicles
                    </span>
                  </div>
                  <div className="flex flex-row gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x">
                    {stories.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => switchStory(idx)}
                        className={`shrink-0 w-44 sm:w-52 rounded-xl border text-left p-2.5 transition-all duration-300 snap-start flex items-center gap-3 ${
                          activeStoryIdx === idx
                            ? "bg-warm-white border-gold shadow-editorial ring-2 ring-gold/60 scale-[1.02]"
                            : "bg-warm-white/70 border-line/60 hover:bg-warm-white/95 hover:border-gold/40 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-black/10"
                        />
                        <div className="overflow-hidden">
                          <span className="font-body text-[9px] text-gold uppercase tracking-wider font-bold block mb-0.5">
                            {s.number}. {s.sessionType}
                          </span>
                          <h4 className="font-display text-xs text-deep font-medium truncate">
                            {s.title}
                          </h4>
                          <p className="font-body text-[10px] text-muted truncate">
                            {s.client}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Companion Panel: Editorial Story Context & Quick Index */}
              <div className="lg:col-span-4 space-y-6">
                {/* Atmosphere & Studio Journal Card */}
                <div className="bg-warm-white rounded-photo p-6 sm:p-8 border border-line shadow-editorial">
                  <span className="font-body text-[10px] uppercase tracking-[0.24em] text-gold font-bold block mb-2">
                    Studio Journal Notes
                  </span>
                  <h3 className="font-display text-2xl text-deep font-normal mb-3">
                    {current.subtitle}
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-brown/85 leading-relaxed mb-6 font-light">
                    Every session at LamSparks is designed around the emotional tempo of your family. There are no loud countdowns, no rigid schedules, and no manufactured smiles.
                  </p>

                  <div className="space-y-4 pt-4 border-t border-line/60">
                    <div>
                      <span className="block font-body text-[10px] uppercase tracking-wider text-muted font-bold">
                        Location & Setting
                      </span>
                      <span className="font-body text-xs text-deep font-medium">
                        {current.location}
                      </span>
                    </div>

                    <div>
                      <span className="block font-body text-[10px] uppercase tracking-wider text-muted font-bold">
                        Studio Ambiance
                      </span>
                      <span className="font-body text-xs text-deep font-medium">
                        {current.studioMood}
                      </span>
                    </div>

                    <div>
                      <span className="block font-body text-[10px] uppercase tracking-wider text-muted font-bold">
                        Selected Keepsake Monograph
                      </span>
                      <span className="font-body text-xs text-deep font-medium">
                        {current.craft.keepsake}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsFlipped((prev) => !prev)}
                      className="inline-flex items-center gap-2 text-xs font-body font-semibold text-gold hover:text-brown transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{isFlipped ? "View Portrait Side" : "Inspect Craft Notes"}</span>
                    </button>
                    <span className="font-serif italic text-xs text-muted">
                      Abuja, Nigeria
                    </span>
                  </div>
                </div>

                {/* Commission Chronicle Note */}
                <div className="bg-warm-white/80 rounded-photo p-6 border border-line shadow-editorial text-center space-y-3">
                  <span className="font-body text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                    Private Commission
                  </span>
                  <p className="font-serif italic text-sm text-brown/90 leading-relaxed">
                    &ldquo;Every family holds an unrepeatable cadence. We preserve it with unhurried reverence.&rdquo;
                  </p>
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-1.5 text-xs font-body uppercase tracking-wider text-deep hover:text-gold font-semibold pt-1 border-b border-gold/40 hover:border-gold transition-colors"
                  >
                    <span>Begin Your Family Chronicle →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Editorial Philosophy Statement */}
          <div className="mt-20 sm:mt-28 bg-deep text-warm-white rounded-photo p-8 sm:p-14 border border-gold/30 shadow-floating text-center relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10 space-y-6">
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block">
                The LamSparks Promise
              </span>
              <blockquote className="font-display text-2xl sm:text-4xl text-warm-white font-normal leading-snug">
                &ldquo;I don't ask your children to smile. I give them the room to feel safe, and the smile comes on its own.&rdquo;
              </blockquote>
              <cite className="font-body not-italic text-xs text-gold-light tracking-wider block">
                — Osemene · Founder & Principal Photographer
              </cite>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-deep font-body text-xs uppercase tracking-wider font-semibold px-7 py-3 rounded-full transition-all shadow-editorial"
                >
                  <span>Request a Bespoke Session Quote</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sessions"
                  className="inline-flex items-center gap-2 bg-warm-white/10 hover:bg-warm-white/20 text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-full border border-white/20 transition-all"
                >
                  <span>View All Session Formats</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
