"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { SessionTypeMeta } from "@/lib/catalog/seed";

export interface CollectionPhotoCard {
  id: string;
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
  if (s.includes("official") || s.includes("individual") || s.includes("commercial") || s.includes("woodhall") || s.includes("corporate")) {
    return "official";
  }
  if (sessionCat === "events") return "event";
  if (sessionCat === "portraits") return "official";
  return "studio";
}

function getBadgeForGroup(group: "studio" | "maternity" | "wedding" | "event" | "official", explicitTitle?: string): string {
  if (explicitTitle && explicitTitle.length <= 26) {
    return explicitTitle;
  }
  switch (group) {
    case "maternity":
      return "Maternity & Motherhood";
    case "wedding":
      return "Weddings & Nuptials";
    case "event":
      return "Event Coverage";
    case "official":
      return "Official & Executive";
    case "studio":
    default:
      return "Studio Session";
  }
}

function CollectionCardItem({ card, index }: { card: CollectionPhotoCard; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <article
      key={card.id}
      className="group relative w-[260px] sm:w-[300px] lg:w-[325px] shrink-0 overflow-hidden rounded-2xl bg-deep shadow-[0_8px_24px_rgba(24,20,17,0.12)] hover:shadow-[0_16px_36px_rgba(24,20,17,0.22)] transition-all duration-500 cursor-pointer animate-in fade-in fill-mode-both"
      style={{
        animationDelay: `${Math.min(index * 60, 360)}ms`,
        animationDuration: "400ms",
      }}
    >
      <Link href={card.href} className="block relative aspect-[3/4] sm:aspect-[2/3] w-full overflow-hidden bg-[#EDE7DD]">
        {/* Skeleton placeholder with category badge (shown while image decodes) */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#EDE7DD] animate-pulse flex items-center justify-center pointer-events-none">
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-[#8A7A6E] font-medium">
              {card.badge}
            </span>
          </div>
        )}

        <img
          src={card.imageUrl}
          alt={`${card.badge} - LamSparks Photography Abuja`}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          decoding="async"
        />

        {/* Subtle gradient so top pill and bottom explore button pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35 pointer-events-none" />

        {/* Category Badge Atop the Picture */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span className="font-body text-[10px] uppercase tracking-[0.2em] text-warm-white font-semibold bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full truncate max-w-[90%]">
            {card.badge}
          </span>
        </div>

        {/* Only Explore Button at Bottom */}
        <div className="absolute bottom-3.5 right-3.5">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/55 group-hover:bg-gold backdrop-blur-md border border-white/25 group-hover:border-gold text-warm-white group-hover:text-deep transition-all duration-300 shadow-sm">
            <span className="font-body text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
              Explore
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function CuratedCollectionsSection({
  sessions,
  galleryPhotos = [],
}: CuratedCollectionsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "studio" | "maternity" | "wedding" | "event" | "official"
  >("all");
  const trackContainerRef = useRef<HTMLDivElement>(null);

  // Build capped list: maximum 3 distinct photos per service group (no duplicates)
  const allCards = useMemo(() => {
    const seenImages = new Set<string>();
    const countPerGroup: Record<string, number> = {
      studio: 0,
      maternity: 0,
      wedding: 0,
      event: 0,
      official: 0,
    };
    const cards: CollectionPhotoCard[] = [];

    // 1. First add signature live session types (up to 3 per group)
    for (const st of sessions) {
      if (!st.heroImage || st.slug === "not-sure") continue;
      if (seenImages.has(st.heroImage)) continue;
      const group = mapSessionSlugToGroup(st.slug, st.category);
      if (countPerGroup[group] >= 3) continue;

      seenImages.add(st.heroImage);
      countPerGroup[group]++;
      cards.push({
        id: `session-${st.slug}`,
        badge: getBadgeForGroup(group, st.title),
        categoryGroup: group,
        imageUrl: st.heroImage,
        href: `/sessions/${st.slug}`,
      });
    }

    // 2. Supplement with distinct gallery photos from Neon DB (capping each group at 3 max)
    for (const gp of galleryPhotos) {
      if (!gp.src || seenImages.has(gp.src)) continue;
      const group = mapSessionSlugToGroup(gp.sessionType || gp.slug);
      if (countPerGroup[group] >= 3) continue;

      seenImages.add(gp.src);
      countPerGroup[group]++;
      cards.push({
        id: `gal-${gp.id}`,
        badge: getBadgeForGroup(group, gp.eventTypeName || gp.category),
        categoryGroup: group,
        imageUrl: gp.src,
        href: `/portfolio?category=${encodeURIComponent(gp.slug || "studio")}`,
      });
    }

    return cards;
  }, [sessions, galleryPhotos]);

  // Filter cards by selected category tab
  const displayCards = useMemo(() => {
    if (activeCategory === "all") return allCards;
    return allCards.filter((c) => {
      if (activeCategory === "studio") {
        return c.categoryGroup === "studio";
      }
      return c.categoryGroup === activeCategory;
    });
  }, [allCards, activeCategory]);

  const handleManualScroll = (direction: "prev" | "next") => {
    const el = trackContainerRef.current;
    if (!el) return;
    const distance = direction === "next" ? 360 : -360;
    el.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <section
      id="collections"
      aria-label="Curated Collections Showcase"
      className="w-full py-8 sm:py-14 space-y-6 sm:space-y-8 overflow-x-clip scroll-mt-20"
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
                className="w-8 h-8 rounded-full border border-line bg-warm-white hover:border-gold flex items-center justify-center text-deep hover:text-gold transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleManualScroll("next")}
                aria-label="Scroll collections right"
                className="w-8 h-8 rounded-full border border-line bg-warm-white hover:border-gold flex items-center justify-center text-deep hover:text-gold transition-colors shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Category Selector Pills Atop the Pictures */}
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

      {/* Unboxed Horizontal Showcase Track: 3 Photos Per Service, No Duplicates, Minimal Content */}
      <div
        ref={trackContainerRef}
        className="relative w-full overflow-x-auto no-scrollbar py-2 px-4 sm:px-6 lg:px-8 scroll-smooth"
      >
        <div className="flex gap-4 sm:gap-5 w-max">
          {displayCards.map((card, idx) => (
            <CollectionCardItem key={card.id} card={card} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
