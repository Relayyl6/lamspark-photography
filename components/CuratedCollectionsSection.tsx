"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { SessionTypeMeta } from "@/lib/catalog/seed";

export interface CollectionPhotoCard {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  categoryGroup: "studio" | "maternity" | "wedding" | "event" | "official";
  imageUrl: string;
  href: string;
}

interface CuratedCollectionsSectionProps {
  sessions: SessionTypeMeta[];
  galleryPhotos?: Array<{
    id: string;
    src: string;
    alt: string;
    caption: string;
    sessionType: string;
    category: string;
    slug: string;
    eventTypeName?: string;
  }>;
}

const FILTER_TABS: Array<{
  id: "all" | "studio" | "maternity" | "wedding" | "event" | "official";
  label: string;
}> = [
  { id: "all", label: "All Collections" },
  { id: "studio", label: "Studio & Family" },
  { id: "maternity", label: "Maternity & Motherhood" },
  { id: "wedding", label: "Weddings & Couples" },
  { id: "event", label: "Events & Milestones" },
  { id: "official", label: "Official & Executive" },
];

function mapSessionSlugToGroup(
  slug: string,
  sessionCat?: string
): "studio" | "maternity" | "wedding" | "event" | "official" {
  const s = (slug || "").toLowerCase();
  if (s.includes("maternity") || s.includes("motherhood") || s.includes("newborn")) {
    return "maternity";
  }
  if (s.includes("wedding") || s.includes("couple")) {
    return "wedding";
  }
  if (s.includes("event") || s.includes("cultural") || s.includes("milestone") || s.includes("memorial")) {
    return "event";
  }
  if (s.includes("official") || s.includes("individual") || s.includes("commercial") || s.includes("woodhall")) {
    return "official";
  }
  if (sessionCat === "events") return "event";
  if (sessionCat === "portraits") return "official";
  return "studio";
}

export function CuratedCollectionsSection({
  sessions,
  galleryPhotos = [],
}: CuratedCollectionsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "studio" | "maternity" | "wedding" | "event" | "official"
  >("all");
  const [isPaused, setIsPaused] = useState(false);
  const trackContainerRef = useRef<HTMLDivElement>(null);

  // Merge live sessions with curated gallery photographs cleanly without duplicates
  const allCards = useMemo(() => {
    const seenImages = new Set<string>();
    const cards: CollectionPhotoCard[] = [];

    // 1. Prioritize signature sessions
    for (const st of sessions) {
      if (!st.heroImage || st.slug === "not-sure") continue;
      seenImages.add(st.heroImage);
      const group = mapSessionSlugToGroup(st.slug, st.category);
      cards.push({
        id: `session-${st.slug}`,
        title: st.title,
        subtitle: st.category === "studio" ? "Abuja Studio" : st.category === "events" ? "Celebration" : "Portraiture",
        badge:
          st.category === "studio"
            ? "Studio Session"
            : st.category === "events"
            ? "Event Coverage"
            : "Portrait Suite",
        categoryGroup: group,
        imageUrl: st.heroImage,
        href: `/sessions/${st.slug}`,
      });
    }

    // 2. Mix in curated archive photos from Neon gallery tables for deep variety per category
    for (const gp of galleryPhotos) {
      if (!gp.src || seenImages.has(gp.src)) continue;
      seenImages.add(gp.src);
      const group = mapSessionSlugToGroup(gp.sessionType || gp.slug);
      cards.push({
        id: `gal-${gp.id}`,
        title: gp.caption || gp.category || "Atelier Highlight",
        subtitle: gp.eventTypeName || gp.category || "Curated Archive",
        badge: gp.category || "Studio Archive",
        categoryGroup: group,
        imageUrl: gp.src,
        href: `/portfolio?category=${encodeURIComponent(gp.slug)}`,
      });
    }

    return cards;
  }, [sessions, galleryPhotos]);

  const filteredCards = useMemo(() => {
    if (activeCategory === "all") return allCards;
    return allCards.filter((c) => {
      if (activeCategory === "studio") {
        return c.categoryGroup === "studio" || c.categoryGroup === "maternity";
      }
      return c.categoryGroup === activeCategory;
    });
  }, [allCards, activeCategory]);

  // Ensure enough cards exist for a seamless, continuous edge-to-edge loop on ultra-wide screens
  const marqueeLoopCards = useMemo(() => {
    const base = filteredCards.length > 0 ? filteredCards : allCards;
    if (base.length === 0) return [];
    let padded = [...base];
    while (padded.length < 8) {
      padded = [...padded, ...base];
    }
    return [...padded, ...padded];
  }, [filteredCards, allCards]);

  // Dynamic duration proportional to item count so visual speed feels calm & steady
  const durationSeconds = useMemo(() => {
    const halfLen = Math.max(4, Math.floor(marqueeLoopCards.length / 2));
    return Math.min(110, Math.max(28, halfLen * 4.5));
  }, [marqueeLoopCards.length]);

  const handleManualScroll = (direction: "prev" | "next") => {
    const el = trackContainerRef.current;
    if (!el) return;
    const distance = direction === "next" ? 340 : -340;
    el.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <section
      aria-label="Curated Collections Showcase"
      className="w-full py-10 sm:py-16 space-y-6 sm:space-y-8 overflow-x-clip"
    >
      {/* Unboxed Clean Header & Category Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-body text-[10px] uppercase tracking-[0.26em] text-gold font-bold block mb-1.5">
              Curated Collections
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-deep font-normal leading-tight">
              Unhurried Sessions for<br className="hidden sm:block" /> Every Milestone
            </h2>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            <Link
              href="/sessions"
              className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-wider text-deep hover:text-gold font-semibold transition-colors shrink-0 group"
            >
              <span>View all session types</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleManualScroll("prev")}
                aria-label="Scroll collections left"
                className="w-8 h-8 rounded-full border border-line bg-warm-white hover:border-gold flex items-center justify-center text-deep hover:text-gold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleManualScroll("next")}
                aria-label="Scroll collections right"
                className="w-8 h-8 rounded-full border border-line bg-warm-white hover:border-gold flex items-center justify-center text-deep hover:text-gold transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Category Pills Atop the Pictures */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_TABS.map((tab) => {
            const isSelected = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-body font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410] shadow-xs"
                    : "bg-warm-white/80 text-brown border-line hover:border-gold hover:text-deep"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edge-to-Edge Unboxed Infinite Horizontal Scroll Track */}
      <div
        ref={trackContainerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="collections-marquee-wrap relative w-full overflow-x-auto no-scrollbar py-2"
      >
        {/* Seamless 2-Half Infinite Strip */}
        <div
          key={activeCategory}
          className="animate-collections-marquee flex gap-4 sm:gap-5 px-4 sm:px-6"
          style={{
            animationDuration: `${durationSeconds}s`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {marqueeLoopCards.map((card, idx) => (
            <article
              key={`${card.id}-${idx}`}
              className="group relative w-[255px] sm:w-[290px] lg:w-[320px] shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-deep shadow-[0_8px_28px_rgba(24,20,17,0.16)] hover:shadow-[0_16px_42px_rgba(24,20,17,0.28)] transition-all duration-500 cursor-pointer"
            >
              <Link href={card.href} className="block">
                <div className="relative aspect-[3/4] sm:aspect-[2/3] w-full overflow-hidden">
                  <img
                    src={card.imageUrl}
                    alt={`${card.title} - LamSparks Photography Abuja`}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Bottom gradient for text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0C0A]/95 via-[#0E0C0A]/25 to-transparent" />

                  {/* Category pill top-left */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="font-body text-[9px] uppercase tracking-[0.2em] text-warm-white/95 font-semibold bg-black/30 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-full truncate max-w-[85%]">
                      {card.badge}
                    </span>
                  </div>

                  {/* Bottom Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <span className="font-body text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-gold font-bold block mb-1 truncate">
                      {card.subtitle}
                    </span>
                    <h3 className="font-display text-sm sm:text-base lg:text-lg text-warm-white font-medium leading-snug mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-2">
                      {card.title}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="font-body text-[10px] sm:text-xs uppercase tracking-wider text-warm-white/75 font-semibold group-hover:text-warm-white transition-colors">
                        Explore
                      </span>
                      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/30 group-hover:border-gold group-hover:bg-gold flex items-center justify-center transition-all duration-300 shrink-0">
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-warm-white/80 group-hover:text-deep transition-colors" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
