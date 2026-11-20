"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  Sun,
  Clock,
  BookOpen,
  MapPin,
  Flame,
  CheckCircle2,
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
  const [viewMode, setViewMode] = useState<"portrait" | "craft">("portrait");
  const [isChanging, setIsChanging] = useState(false);

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

  function switchStory(newIndex: number) {
    if (newIndex === activeStoryIdx || !stories[newIndex]) return;
    setIsChanging(true);
    setViewMode("portrait");
    setTimeout(() => {
      setActiveStoryIdx(newIndex);
      setIsChanging(false);
    }, 180);
  }

  function goToPrevious() {
    const nextIdx = activeStoryIdx > 0 ? activeStoryIdx - 1 : stories.length - 1;
    switchStory(nextIdx);
  }

  function goToNext() {
    const nextIdx = (activeStoryIdx + 1) % stories.length;
    switchStory(nextIdx);
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStoryIdx, stories.length]);

  return (
    <>
      <Nav />
      <main className="flex-1 bg-[#FAF8F5] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 selection:bg-gold-light selection:text-deep">
        <div className="max-w-7xl mx-auto">
          {/* Header Block */}
          <div className="max-w-3xl mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-white border border-line text-[11px] font-body uppercase tracking-[0.24em] text-gold font-bold mb-3 shadow-editorial">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Real Abuja Families · The Living Chronicles</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl text-deep font-normal leading-[1.08] tracking-tight">
              Session Stories
            </h1>
            <p className="font-serif italic text-lg sm:text-2xl text-brown/90 mt-3 font-normal max-w-2xl leading-relaxed">
              Every portrait is born from conversation, unhurried pacing, and quiet reverence in our Maitama studio.
            </p>
          </div>

          {loading || !current ? (
            /* Skeleton Loading State */
            <div className="animate-pulse space-y-8">
              <div className="h-16 bg-cream rounded-2xl border border-line" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 h-[520px] bg-cream rounded-photo border border-line" />
                <div className="lg:col-span-5 h-[520px] bg-cream rounded-photo border border-line" />
              </div>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {/* Top Navigation & Chronicle Index Bar */}
              <div className="bg-warm-white p-4 sm:p-5 rounded-photo border border-line shadow-editorial flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-display text-2xl sm:text-3xl text-gold font-light tracking-wider">
                    {current.number}
                  </span>
                  <div className="h-6 w-[1px] bg-line" />
                  <div>
                    <span className="font-body text-[10px] uppercase tracking-[0.2em] text-muted font-bold block">
                      Chronicle {activeStoryIdx + 1} of {stories.length}
                    </span>
                    <h2 className="font-display text-base sm:text-lg text-deep font-medium leading-tight">
                      {current.subtitle}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {/* Segmented Dots Indicator */}
                  <div className="flex items-center gap-2">
                    {stories.map((story, i) => (
                      <button
                        key={story.id}
                        type="button"
                        onClick={() => switchStory(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === activeStoryIdx
                            ? "w-8 bg-gold shadow-sm"
                            : i < activeStoryIdx
                            ? "w-2.5 bg-gold/50"
                            : "w-2.5 bg-line hover:bg-gold/40"
                        }`}
                        aria-label={`Jump to chronicle ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Stepper Buttons */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      type="button"
                      onClick={goToPrevious}
                      className="p-2.5 rounded-full border border-line bg-cream hover:bg-warm-white hover:border-gold hover:text-gold transition-all text-deep active:scale-95"
                      aria-label="Previous chronicle"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="p-2.5 rounded-full border border-line bg-cream hover:bg-warm-white hover:border-gold hover:text-gold transition-all text-deep active:scale-95"
                      aria-label="Next chronicle"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Master Feature Spread: Left Visual & Right Narrative */}
              <div
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch transition-opacity duration-200 ${
                  isChanging ? "opacity-40" : "opacity-100"
                }`}
              >
                {/* --- Left Column: Large Editorial Showcase Frame (7 cols) --- */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="relative w-full rounded-photo overflow-hidden border border-line shadow-floating bg-deep flex-1 min-h-[460px] sm:min-h-[580px] flex flex-col justify-between">
                    {viewMode === "portrait" ? (
                      <>
                        {/* High-Resolution Portrait with Archival Contrast Overlay */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={current.image}
                            alt={current.imageAlt || current.title}
                            className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/20 to-deep/60 pointer-events-none" />
                        </div>

                        {/* Top Bar on Image */}
                        <div className="relative z-10 p-5 sm:p-6 flex items-start justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-deep/85 backdrop-blur-md border border-gold/40 text-[10px] font-body uppercase tracking-[0.2em] text-gold font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                            {current.sessionType}
                          </span>

                          <button
                            type="button"
                            onClick={() => setViewMode("craft")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-white/95 hover:bg-warm-white text-deep text-[11px] font-body font-semibold border border-gold/40 shadow-editorial transition-all hover:scale-105"
                          >
                            <Camera className="w-3.5 h-3.5 text-gold" />
                            <span>Craft &amp; Optics Specs</span>
                          </button>
                        </div>

                        {/* Bottom Archival Plaque */}
                        <div className="relative z-10 p-5 sm:p-7 bg-gradient-to-t from-deep via-deep/90 to-transparent">
                          <span className="font-body text-[10px] text-gold font-semibold uppercase tracking-[0.22em] block mb-1">
                            {current.vintageSign}
                          </span>
                          <h3 className="font-display text-2xl sm:text-3xl text-warm-white font-normal leading-tight mb-2">
                            {current.title}
                          </h3>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-warm-white/80 font-body pt-2 border-t border-white/15">
                            <span>{current.client} · {current.date}</span>
                            <span className="text-gold font-serif italic text-xs sm:text-sm">
                              {current.lightDetails}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Craft & Technical Alchemy Exhibition Sheet */
                      <div className="p-6 sm:p-8 bg-warm-white text-deep h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
                            <div>
                              <span className="font-body text-[10px] uppercase tracking-[0.24em] text-gold font-bold block mb-1">
                                Technical Monograph
                              </span>
                              <h3 className="font-display text-xl sm:text-2xl text-deep font-normal">
                                Behind the Lens: {current.title}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewMode("portrait")}
                              className="px-3.5 py-1.5 rounded-full bg-cream hover:bg-gold-light/40 border border-line text-xs font-body font-semibold text-deep transition-all"
                            >
                              <span>View Portrait ↺</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-xl bg-cream/70 border border-line/60">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-wider text-muted font-bold block mb-1">
                                <Camera className="w-3.5 h-3.5 text-gold" />
                                Optics &amp; Prime Glass
                              </span>
                              <p className="font-display text-base text-deep font-medium">
                                {current.craft.lens}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-cream/70 border border-line/60">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-wider text-muted font-bold block mb-1">
                                <Sun className="w-3.5 h-3.5 text-gold" />
                                Lighting Architecture
                              </span>
                              <p className="font-display text-base text-deep font-medium">
                                {current.craft.lighting}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-cream/70 border border-line/60">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-wider text-muted font-bold block mb-1">
                                <Clock className="w-3.5 h-3.5 text-gold" />
                                Session Tempo &amp; Pacing
                              </span>
                              <p className="font-body text-xs sm:text-sm text-brown font-medium">
                                {current.craft.pacing}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl bg-cream/70 border border-line/60">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-wider text-muted font-bold block mb-1">
                                <BookOpen className="w-3.5 h-3.5 text-gold" />
                                Keepsake Monograph
                              </span>
                              <p className="font-body text-xs sm:text-sm text-brown font-medium">
                                {current.craft.keepsake}
                              </p>
                            </div>
                          </div>

                          <blockquote className="p-4 rounded-xl bg-deep text-warm-white border border-gold/30 space-y-1">
                            <p className="font-serif italic text-sm text-gold-light">
                              &ldquo;{current.quote}&rdquo;
                            </p>
                            <cite className="font-body not-italic text-[10px] uppercase tracking-wider text-warm-white/70 block">
                              — {current.quoteAuthor}
                            </cite>
                          </blockquote>
                        </div>

                        <div className="pt-4 border-t border-line flex items-center justify-between">
                          <Link
                            href={current.sessionSlug || "/sessions"}
                            className="inline-flex items-center gap-1.5 text-xs font-body font-semibold text-deep hover:text-gold transition-colors"
                          >
                            <span>Explore this Session Format</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href="/book"
                            className="inline-flex items-center gap-2 bg-deep text-warm-white px-4 py-2 rounded-full text-xs font-body font-semibold uppercase tracking-wider hover:bg-gold hover:text-deep transition-all shadow-sm"
                          >
                            <span>Commission Shoot</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- Right Column: Journal Notes & Editorial Narrative (5 cols) --- */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  {/* Journal Card */}
                  <div className="bg-warm-white p-7 sm:p-8 rounded-photo border border-line shadow-editorial space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-body text-[10px] uppercase tracking-[0.26em] text-gold font-bold">
                          Studio Journal Notes
                        </span>
                        <span className="font-serif italic text-xs text-muted">
                          Abuja Studio Suite
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl text-deep font-normal leading-tight mb-4">
                        {current.subtitle}
                      </h3>

                      <p className="font-body text-sm text-brown/90 leading-relaxed mb-6 font-light">
                        {current.excerpt}
                      </p>

                      <div className="space-y-4 pt-4 border-t border-line/60">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-body text-[10px] uppercase tracking-wider text-muted font-bold">
                              Setting &amp; Location
                            </span>
                            <span className="font-body text-xs text-deep font-medium">
                              {current.location}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Flame className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-body text-[10px] uppercase tracking-wider text-muted font-bold">
                              Studio Ambiance
                            </span>
                            <span className="font-body text-xs text-deep font-medium">
                              {current.studioMood}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <BookOpen className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-body text-[10px] uppercase tracking-wider text-muted font-bold">
                              Selected Keepsake Monograph
                            </span>
                            <span className="font-body text-xs text-deep font-medium">
                              {current.craft.keepsake}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-line/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <Link
                        href={current.sessionSlug || "/sessions"}
                        className="inline-flex items-center justify-center gap-1.5 font-body text-xs uppercase tracking-wider font-semibold text-deep hover:text-gold transition-colors py-2"
                      >
                        <span>View Session Format →</span>
                      </Link>

                      <Link
                        href={`/book?session=${current.sessionType?.toLowerCase().includes("toddler") ? "toddler" : current.sessionType?.toLowerCase().includes("maternity") ? "maternity" : "events"}`}
                        className="inline-flex items-center justify-center gap-2 bg-deep text-warm-white px-5 py-2.5 rounded-full font-body text-xs uppercase tracking-wider font-semibold hover:bg-gold hover:text-deep transition-all shadow-editorial"
                      >
                        <span>Begin Your Chronicle</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Private Commission Callout */}
                  <div className="bg-warm-white/90 p-5 rounded-photo border border-line/80 shadow-sm text-center space-y-2">
                    <span className="font-body text-[10px] uppercase tracking-[0.2em] text-gold font-bold block">
                      Private Commission
                    </span>
                    <p className="font-serif italic text-sm text-brown/90 leading-relaxed">
                      &ldquo;Every family holds an unrepeatable cadence. We preserve it with unhurried reverence.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* The Chronicle Archive Selector (Filmstrip Deck) */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div>
                    <span className="font-body text-[10px] uppercase tracking-[0.22em] text-gold font-bold block">
                      Archive Catalog
                    </span>
                    <h3 className="font-display text-xl text-deep font-normal">
                      Select Chronicle to Inspect
                    </h3>
                  </div>
                  <span className="font-body text-xs text-muted">
                    {activeStoryIdx + 1} of {stories.length} Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stories.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => switchStory(idx)}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 group ${
                        activeStoryIdx === idx
                          ? "bg-warm-white border-gold shadow-editorial ring-1 ring-gold"
                          : "bg-warm-white/70 border-line/70 hover:bg-warm-white hover:border-gold/50"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-deep border border-black/10 relative">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {activeStoryIdx === idx && (
                          <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-warm-white drop-shadow" />
                          </div>
                        )}
                      </div>

                      <div className="overflow-hidden flex-1">
                        <span className="font-body text-[9px] text-gold uppercase tracking-wider font-bold block mb-0.5">
                          {s.number}. {s.sessionType}
                        </span>
                        <h4 className="font-display text-sm text-deep font-medium truncate group-hover:text-gold transition-colors">
                          {s.title}
                        </h4>
                        <p className="font-body text-[11px] text-muted truncate mt-0.5">
                          {s.client}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Editorial Philosophy Statement */}
          <div className="mt-20 sm:mt-24 bg-deep text-warm-white rounded-photo p-8 sm:p-14 border border-gold/30 shadow-floating text-center relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10 space-y-6">
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block">
                The LamSparks Promise
              </span>
              <blockquote className="font-display text-2xl sm:text-4xl text-warm-white font-normal leading-snug">
                &ldquo;I don&apos;t ask your children to smile. I give them the room to feel safe, and the smile comes on its own.&rdquo;
              </blockquote>
              <cite className="font-body not-italic text-xs text-gold-light tracking-wider block">
                — Osemene · Founder &amp; Principal Photographer
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
