"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Sparkles,
  Aperture,
  RotateCcw,
  Calendar,
  MapPin,
  Heart,
} from "lucide-react";

interface StoryCard {
  id: string;
  number: string;
  title: string;
  category: string;
  location: string;
  client: string;
  date: string;
  image: string;
  story: string;
  craftNotes: {
    lens: string;
    lighting: string;
    sentiment: string;
  };
}

const STORIES: StoryCard[] = [
  {
    id: "maternity",
    number: "01",
    title: "Maternity Signature Grace",
    category: "New Life",
    location: "Guzape Atelier · Abuja",
    client: "Halima & Farouk",
    date: "Autumn 2026",
    image: "/images/client/weddings_3.webp",
    story:
      "Captured in the quiet golden hour at our Guzape studio suite. We allowed thirty minutes of silence before taking the first exposure, giving Halima the space to breathe and connect with her unborn daughter.",
    craftNotes: {
      lens: "Nikkor 50mm f/1.2 S @ f/1.4",
      lighting: "Soft north-facing ambient daylight + silver reflector bounce",
      sentiment: "Serenity, quiet anticipation, sacred motherhood",
    },
  },
  {
    id: "toddler",
    number: "02",
    title: "Unhurried Toddler Milestone",
    category: "Generations",
    location: "Maitama Studio · Abuja",
    client: "The Al-Hassan Family",
    date: "Late Summer 2026",
    image: "/images/client/events_4.webp",
    story:
      "We never ask children to perform or say cheese. Instead, we let three-year-old Zayd explore the studio props until his genuine wonder unfolded naturally. Real joy is captured, never rehearsed.",
    craftNotes: {
      lens: "Nikkor 85mm f/1.4G @ f/2.0",
      lighting: "Diffused beauty dish + continuous warm backlight",
      sentiment: "Childhood innocence, unguarded delight",
    },
  },
  {
    id: "motherhood",
    number: "03",
    title: "The Motherhood Heirloom",
    category: "Reverence",
    location: "Private Residence · Asokoro",
    client: "Dr. Zainab & Children",
    date: "Summer 2026",
    image: "/images/client/corporate_3.webp",
    story:
      "A three-generation portrait held at their private family compound. The heirloom album was crafted specifically so her grandchildren will see their matriarch in the timeless dignity she embodies.",
    craftNotes: {
      lens: "Nikkor 35mm f/1.4 ED @ f/2.8",
      lighting: "Veranda natural cross-light with velvet flag",
      sentiment: "Generational continuity, matriarchal heritage",
    },
  },
  {
    id: "portrait",
    number: "04",
    title: "Official Natural Light Portrait",
    category: "Legacy",
    location: "Central Studio · Abuja",
    client: "Senator K. Danjuma",
    date: "Spring 2026",
    image: "/images/client/corporate_1.webp",
    story:
      "Stripped of corporate stiff posture. An honest, contemplative study of leadership in Abuja. We used a simple hand-painted linen backdrop and unhurried natural window light.",
    craftNotes: {
      lens: "Nikkor 105mm f/1.4E ED @ f/2.2",
      lighting: "Single large 6ft scrim diffuse daylight",
      sentiment: "Gravitas, quiet intellect, timeless character",
    },
  },
];

export function ScrollWorld() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const activeStory = STORIES[activeIdx];

  const handleSelectStory = (idx: number) => {
    if (idx === activeIdx || isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(false);
    setTimeout(() => {
      setActiveIdx(idx);
      setIsAnimating(false);
    }, 220);
  };

  const handlePrev = () => {
    const nextIdx = activeIdx > 0 ? activeIdx - 1 : STORIES.length - 1;
    handleSelectStory(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (activeIdx + 1) % STORIES.length;
    handleSelectStory(nextIdx);
  };

  return (
    <section className="relative py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-warm-white/90 backdrop-blur-xl rounded-photo border border-gold/40 p-6 sm:p-12 shadow-editorial">
        {/* Editorial Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
            Interactive Storytelling Stage
          </span>
          <h2 className="font-display text-3xl sm:text-5xl text-deep font-normal leading-tight">
            Moments Suspended in Space & Light
          </h2>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-2.5 max-w-lg mx-auto leading-relaxed">
            Each chronicle is crafted with patient reverence. Click the card to flip between the heirloom portrait and the technical craft notes behind it.
          </p>
        </div>

      {/* Main Interactive Stage: Flippable Card (Left - Small Square) + Storytelling Narrative Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: 3D Flippable Editorial Card Stage (Small Square + Horizontal Deck) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            className="w-full max-w-[340px] sm:max-w-[380px] aspect-square relative cursor-pointer select-none"
            style={{ perspective: "1400px" }}
            onClick={() => setIsFlipped((prev) => !prev)}
            role="button"
            tabIndex={0}
            aria-label={`Flip card for ${activeStory.title}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsFlipped((prev) => !prev);
              }
            }}
          >
            {/* The 3D Rotating Square Flipper */}
            <div
              className={`w-full h-full relative transition-all duration-700 ease-out ${
                isAnimating ? "scale-95 opacity-60" : "scale-100 opacity-100"
              }`}
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* FRONT SIDE (Square): Heirloom Portrait */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-deep text-warm-white border border-gold/40 shadow-floating flex flex-col justify-between p-3.5 sm:p-4"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                {/* Photo Stage */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={activeStory.image}
                    alt={activeStory.title}
                    className="w-full h-full object-cover object-center transform transition-transform duration-1000 ease-out hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/30 to-deep/50" />
                </div>

                {/* Top Bar */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="bg-deep/85 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 text-warm-white text-[10px] font-body uppercase tracking-wider border border-white/10">
                    <Sparkles className="w-3 h-3 text-gold" />
                    <span>{activeStory.category}</span>
                  </div>
                  <div className="bg-gold text-deep font-display font-semibold text-[11px] px-2 py-0.5 rounded-full shadow-sm">
                    {activeStory.number} / 04
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="relative z-10 pt-2">
                  <span className="font-body text-[10px] text-gold font-semibold uppercase tracking-wider block mb-0.5">
                    {activeStory.location}
                  </span>
                  <h3 className="font-display text-base sm:text-lg text-warm-white font-normal leading-tight mb-2">
                    {activeStory.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[10px] text-warm-white/80">
                      {activeStory.client}
                    </span>
                    <span className="bg-warm-white/95 text-deep px-2.5 py-1 rounded-full text-[10px] font-body font-semibold flex items-center gap-1 shadow-sm">
                      <RotateCcw className="w-2.5 h-2.5 text-gold" />
                      <span>Flip ↺</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* BACK SIDE (Square): Technical Craft Notes */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl bg-deep text-warm-white border border-gold/40 shadow-floating p-4 sm:p-5 flex flex-col justify-between"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                      <span className="font-body text-[9px] uppercase tracking-[0.2em] text-gold font-bold block">
                        Chronicle Craft Notes · {activeStory.number}
                      </span>
                      <h4 className="font-display text-base text-warm-white font-normal truncate max-w-[210px]">
                        {activeStory.title}
                      </h4>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center text-gold">
                      <Aperture className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Narrative Quote */}
                  <blockquote className="font-serif italic text-xs leading-relaxed text-cream/90 pl-2 border-l border-gold/60 line-clamp-2">
                    &ldquo;{activeStory.story}&rdquo;
                  </blockquote>

                  {/* Technical Specifications */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                      <span className="font-body text-[8px] uppercase tracking-wider text-gold font-bold block">
                        Optics
                      </span>
                      <p className="font-body text-[10px] text-warm-white/90 truncate">
                        {activeStory.craftNotes.lens}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                      <span className="font-body text-[8px] uppercase tracking-wider text-gold font-bold block">
                        Light
                      </span>
                      <p className="font-body text-[10px] text-warm-white/90 truncate">
                        {activeStory.craftNotes.lighting}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back Footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="font-body text-[10px] text-gold flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    <span>Flip back</span>
                  </span>
                  <Link
                    href="/book"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] font-body uppercase tracking-wider text-warm-white hover:text-gold transition-colors font-semibold"
                  >
                    <span>Commission →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Deck of Horizontally Laid Out Cards to Choose From */}
          <div className="mt-6 w-full max-w-xl">
            <span className="font-body text-[10px] uppercase tracking-[0.22em] text-gold font-bold block mb-2 px-1">
              Chronicle Deck · Tap Card to Select
            </span>
            <div className="flex flex-row gap-2.5 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none snap-x">
              {STORIES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectStory(idx)}
                  className={`shrink-0 w-36 sm:w-44 rounded-xl border text-left p-2 transition-all duration-300 snap-start flex items-center gap-2.5 ${
                    activeIdx === idx
                      ? "bg-warm-white border-gold shadow-editorial ring-2 ring-gold/60 scale-[1.02]"
                      : "bg-warm-white/70 border-line/60 hover:bg-warm-white/95 hover:border-gold/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/10"
                  />
                  <div className="overflow-hidden">
                    <span className="font-body text-[9px] text-gold uppercase tracking-wider font-bold block">
                      {s.number}. {s.category}
                    </span>
                    <h4 className="font-display text-xs text-deep font-medium truncate">
                      {s.title}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Storytelling Narrative & Milestone Chronicle Selector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-warm-white/85 backdrop-blur-md rounded-photo p-6 sm:p-8 border border-line/70 shadow-editorial space-y-5">
            <div>
              <span className="font-body text-[10px] uppercase tracking-[0.22em] text-gold font-bold block mb-1">
                The Chronicle Journey
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-deep font-normal leading-snug">
                {activeStory.title}
              </h3>
            </div>

            <p className="font-body text-xs sm:text-sm text-brown/90 leading-relaxed">
              {activeStory.story}
            </p>

            <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs font-body text-muted">
              <span>Client: <strong className="text-deep font-medium">{activeStory.client}</strong></span>
              <span>Location: <strong className="text-deep font-medium">{activeStory.location.split("·")[0]}</strong></span>
            </div>

            {/* Quick Chronicle Jump Selector */}
            <div className="pt-4 border-t border-line/60">
              <span className="font-body text-[10px] uppercase tracking-[0.2em] text-muted font-bold block mb-3">
                Select Family Chronicle
              </span>
              <div className="grid grid-cols-2 gap-2">
                {STORIES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStory(idx)}
                    className={`p-2.5 rounded-lg text-left transition-all font-body text-xs flex items-center justify-between border ${
                      activeIdx === idx
                        ? "bg-cream border-gold text-deep font-semibold shadow-sm"
                        : "bg-white/60 border-line hover:border-gold/50 text-brown/80"
                    }`}
                  >
                    <span className="truncate pr-1">
                      <span className="text-gold font-bold mr-1.5">{s.number}.</span>
                      {s.category}
                    </span>
                    {activeIdx === idx && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/portfolio"
                className="w-full inline-flex items-center justify-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold py-3 rounded-full transition-all shadow-editorial"
              >
                <span>Explore Curated Portfolio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
