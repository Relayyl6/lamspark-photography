"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Nikon3DCamera } from "./Nikon3DCamera";

interface WheelCard {
  id: string;
  category: string;
  label: string;
  subtitle: string;
  image: string;
  href: string;
}

interface HeroOverhaulSectionProps {
  initialCards?: WheelCard[] | null;
  initialCopy?: {
    kicker: string;
    headline: string;
    subtitle: string;
  } | null;
}

interface SessionMeta {
  category: string;
  title: string;
  tagline: string;
  price: string;
  inclusions: string;
  slot: string;
  slug: string;
}

const SESSION_METAS: Record<string, SessionMeta> = {
  weddings: {
    category: "WEDDINGS",
    title: "Sacred Unions & Ceremonies",
    tagline: "Soulful, unhurried coverage capturing sacred vows & legacy moments",
    price: "Bespoke Consultation",
    inclusions: "Full-day coverage · Archival wedding album · Same-week preview",
    slot: "2026/2027 Booking Open · Abuja & Worldwide",
    slug: "wedding",
  },
  traditional: {
    category: "TRADITIONAL",
    title: "Cultural Heritage & Nuptials",
    tagline: "Honouring vibrant Aso-Oke, royal regalia & generational customs",
    price: "From ₦250,000",
    inclusions: "Haute couture lighting · Multi-outfit coverage · Private Maitama studio",
    slot: "Limited monthly slots · Maitama Atelier",
    slug: "wedding",
  },
  events: {
    category: "EVENTS",
    title: "Milestone Galas & Summits",
    tagline: "Discreet, sophisticated documentation of private galas & celebrations",
    price: "From ₦120,000",
    inclusions: "Discreet master photographer · High-res deliverables · Online guest gallery",
    slot: "Weekend dates available · Abuja & Beyond",
    slug: "event",
  },
  executive: {
    category: "EXECUTIVE",
    title: "Executive & Official Portraits",
    tagline: "Commanding visual presence for diplomats, industry leaders & visionaries",
    price: "From ₦85,000",
    inclusions: "Wardrobe prep · 3 curated looks · Handcrafted editorial retouches",
    slot: "Mon, Wed & Fri · Private Maitama Studio",
    slug: "official-portrait",
  },
  lifestyle: {
    category: "LIFESTYLE",
    title: "Toddler & Children Sessions",
    tagline: "Patient, gentle portraiture capturing authentic joy and unscripted smiles",
    price: "From ₦95,000",
    inclusions: "Unhurried pace · Playful sensory environment · Family cuddle shots included",
    slot: "Morning natural-light slots · Studio sanctuary",
    slug: "toddler",
  },
  legacy: {
    category: "LEGACY",
    title: "Family & Multi-Gen Portraits",
    tagline: "Timeless heirloom portraits celebrating family bonds across generations",
    price: "From ₦160,000",
    inclusions: "Generations together · Maitama studio suite · High-res museum print package",
    slot: "Private weekend studio buyout",
    slug: "family",
  },
  atelier: {
    category: "ATELIER",
    title: "Maternity & Motherhood",
    tagline: "Soft, intimate studio sanctuary honoring the profound journey of motherhood",
    price: "From ₦140,000",
    inclusions: "Luxury gown styling · Gentle pose guidance · Private dressing lounge",
    slot: "Gentle afternoon lighting · Maitama Studio",
    slug: "maternity",
  },
};

const CARD_PLACEHOLDERS: Record<string, string> = {
  weddings: "data:image/webp;base64,UklGRnQAAABXRUJQVlA4IGgAAADQAwCdASoQABgAPzmGuVOvKSWisAgB4CcJZQAAXAIEvgA8hAcQy/AA/qNoFGaTYs1Rw9pXn6CzMcFoSJWR+akDoybj3wQeKsFgZvOkjTk+fT0a3tvOwz8cco2pH6yz7cybbRU71q2wAA==",
  traditional: "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAABwBACdASoQABgAPzmGuVOvKSWisAgB4CcJbACdOUE6UAwkTj6n5tedAMAasAD+wC9zzOi8hDu+HmtrdUboQ8DMYtrJSbO9HwO1tEBbLmPOBDgteG59NhlwIeR7FbOFL2Qf4AAA",
  events: "data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAAAQBACdASoQABgAPzmGuVOvKSWisAgB4CcJQBOgBCwAIXXtUPZ19/P4AAD9+5TKrZLhLN7jQT/Wks9YGmM6IaG4P4ZkI62Zmf1ksVetiF/nP/3ygdWKLFP6Apamda0tf3O7ajYM/kbaNinDcsaPf104J9sv3vrt53FjPpNnQWwaHEC2fp+GAAAA",
  executive: "data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAAAQBACdASoQABgAPzmGulOvKSWisAgB4CcJQBOgA0hkSLfWOIzT2NE2AAD9+5X7kGQPFG+920Q23YAylPfqdRPlTRxuETBdk646dUNZlmpcNCWCzoYkSQ2U4cRqSwVLDM+3zZ0dgbONeRi0uL1tQqRRPO+UpYDWz6lbz/4oL7pHFAAA",
  lifestyle: "data:image/webp;base64,UklGRpAAAABXRUJQVlA4IIQAAAAwBACdASoQABgAPzmEuVOvKKWisAgB4CcJYgC7ACLWvZSbgyxKujVvbgAA90XFR+tL/GO59jyrEtwmmkWX3vMmf52aZauRHnFXnfQfO4gn3DRv7W4O14PtrHxIIU0jwTrEB7YHgaCMpLVuRrNXpt+dQvK/Io1b3iFekIEDqm78GJtaAAA=",
  legacy: "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAADQAwCdASoQABgAPzmKulOvKaWisAgB4CcJQBOmUABNjM5wZriKNwAA/dFe/WHnvw7PZGODKXASg2PQAnVnvBIxdeclrrYagl1NTgXZbGxJkFAj4zd2TCbzAm7lPlCzYBeJvz37HQOzT9LnV+rQAAAA",
  atelier: "data:image/webp;base64,UklGRpgAAABXRUJQVlA4IIwAAADQAwCdASoQABgAPzmEuVOvKKWisAgB4CcJYgCdABIQgGQEY3iWrKQA+jZeoYOPqsSli1kK6oEf6anklb0/4c6y/kqY4284V39iecobIAU3gJGg2+IbiJTqU8jvtqu3QcyZp+82cqBNsG778nefo2s7lUu7CHO9EqPhh6GBAj74CBtFZMIzmBfG2JoAAA=="
};

const DEFAULT_HERO_CARDS: WheelCard[] = [
  {
    id: "weddings",
    href: "/sessions",
    image: "/images/client/hero/weddings_1_card.webp",
    label: "Sacred Unions",
    category: "WEDDINGS",
    subtitle: "Unhurried wedding ceremonies in Abuja"
  },
  {
    id: "traditional",
    href: "/sessions",
    image: "/images/client/hero/weddings_2_card.webp",
    label: "Cultural Heritage",
    category: "TRADITIONAL",
    subtitle: "Vibrant Aso-Oke & generational grace"
  },
  {
    id: "events",
    href: "/sessions",
    image: "/images/client/hero/events_1_card.webp",
    label: "Milestone Galas",
    category: "EVENTS",
    subtitle: "Unscripted warmth & celebrations"
  },
  {
    id: "executive",
    href: "/portfolio",
    image: "/images/client/hero/corporate_1_card.webp",
    label: "Executive Leadership",
    category: "EXECUTIVE",
    subtitle: "Commanding visual presence"
  },
  {
    id: "lifestyle",
    href: "/sessions",
    image: "/images/client/hero/events_3_card.webp",
    label: "Authentic Moments",
    category: "LIFESTYLE",
    subtitle: "Honouring unscripted warmth & life"
  },
  {
    id: "legacy",
    href: "/sessions",
    image: "/images/client/hero/corporate_3_card.webp",
    label: "Generational Craft",
    category: "LEGACY",
    subtitle: "Heirloom memories for decades"
  },
  {
    id: "atelier",
    href: "/sessions",
    image: "/images/client/hero/corporate_6_card.webp",
    label: "Studio Dignity",
    category: "ATELIER",
    subtitle: "Quiet authority and elegance"
  }
];

function FastCardImage({
  src,
  alt,
  placeholder,
  isPriority,
}: {
  src: string;
  alt: string;
  placeholder?: string;
  isPriority: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[#181411]"
      style={{
        backgroundImage: placeholder ? `url("${placeholder}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover object-center transform group-hover:scale-105 transition-all duration-300 ease-out pointer-events-none ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="eager"
        decoding="async"
        fetchPriority={isPriority ? "high" : "auto"}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src.endsWith(".webp")) {
            target.src = target.src.replace(".webp", ".jpg");
          }
        }}
      />
    </div>
  );
}

export function HeroOverhaulSection({ initialCards = null, initialCopy = null }: HeroOverhaulSectionProps) {
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [wheelH, setWheelH] = useState(320);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [navH, setNavH] = useState(80);
  const [rotationAngle, setRotationAngle] = useState(0); // rendering only
  const [cards, setCards] = useState<WheelCard[]>(
    initialCards && initialCards.length > 0 ? initialCards : DEFAULT_HERO_CARDS
  );
  const [loading, setLoading] = useState(false);
  const [heroCopy, setHeroCopy] = useState(initialCopy || {
    kicker: "I CAPTURE · YOU REMEMBER",
    headline: "REAL MOMENTS. BEAUTIFUL MEMORIES",
    subtitle: "I capture real emotions and raw moments that tell your story in the most authentic and timeless way.",
  });
  const angleRef = useRef(0);
  const targetRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startAngleRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const movedRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const count = cards.length || 7;
  const isMobile = viewportWidth < 768;

  // Responsive 3D Geometry
  const angleStep = isMobile ? 22 : 15;
  const cardHeight = isMobile
    ? Math.round(Math.min(Math.max(wheelH * 0.64, 185), 245))
    : Math.round(Math.min(Math.max(wheelH * 0.70, 220), 360));
  const cardWidth = Math.round(cardHeight * 0.705);
  const spacing = cardWidth * (isMobile ? 1.04 : 1.08);
  const cylinderRadius = spacing / Math.sin((angleStep * Math.PI) / 180);
  const totalRange = Math.max(1, count * angleStep);

  // Fetch live settings/cards from Neon DB silently in background (Never wipe cards with skeleton if initialCards exist)
  useEffect(() => {
    if (!cards || cards.length === 0) {
      setLoading(true);
    }
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.content) {
          if (Array.isArray(data.content.hero_wheel_cards) && data.content.hero_wheel_cards.length > 0) {
            setCards(data.content.hero_wheel_cards);
          }
          setHeroCopy({
            kicker: data.content.hero_kicker || "I CAPTURE · YOU REMEMBER",
            headline: data.content.hero_headline || "REAL MOMENTS. BEAUTIFUL MEMORIES",
            subtitle: data.content.hero_subtitle || "I capture real emotions and raw moments that tell your story in the most authentic and timeless way.",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Preload all card images for instant, smooth entering into screen with zero flash
  useEffect(() => {
    if (!cards || cards.length === 0) return;
    cards.forEach((card) => {
      if (card.image && typeof window !== "undefined") {
        const img = new Image();
        img.src = card.image;
      }
    });
  }, [cards]);

  useEffect(() => {
    function handleResize() {
      if (typeof window !== "undefined") {
        setViewportWidth(window.innerWidth);
        setViewportHeight(window.innerHeight);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWheelH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const nav = document.querySelector("header") as HTMLElement | null;
    if (!nav) return;
    const update = () => setNavH(nav.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // Smooth 60fps spring interpolation & momentum glide
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (draggingRef.current) {
        angleRef.current = targetRef.current;
      } else {
        if (Math.abs(velocityRef.current) > 0.02) {
          targetRef.current += velocityRef.current * dt * 42;
          velocityRef.current *= Math.pow(0.92, dt * 60);
        }
        const diff = targetRef.current - angleRef.current;
        angleRef.current =
          Math.abs(diff) < 0.01 ? targetRef.current : angleRef.current + diff * 0.16;
      }

      setRotationAngle(angleRef.current);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    movedRef.current = false;
    velocityRef.current = 0;
    startXRef.current = e.clientX;
    startAngleRef.current = targetRef.current;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;

    if (!movedRef.current && Math.abs(dx) > 6) {
      movedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!movedRef.current) return;

    const factor = isMobile ? 0.22 : 0.09;
    targetRef.current = startAngleRef.current - dx * factor;

    const now = performance.now();
    if (now - lastTRef.current > 16) {
      velocityRef.current = -(e.clientX - lastXRef.current) / 160;
      lastXRef.current = e.clientX;
      lastTRef.current = now;
    }
  };

  // Auto-advance to the next card every 2.5 seconds
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    autoPlayTimerRef.current = setInterval(() => {
      if (!draggingRef.current && count > 0) {
        targetRef.current += angleStep;
      }
    }, 2500);
  }, [angleStep, count]);

  useEffect(() => {
    resetAutoPlay();
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [resetAutoPlay]);

  const onPointerUp = () => {
    draggingRef.current = false;
    resetAutoPlay();
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 3) {
      targetRef.current += delta * 0.08;
      resetAutoPlay();
    }
  };

  // Center a specific card index
  const selectCardIndex = useCallback((index: number) => {
    const target = (index - 3) * angleStep;
    const k = Math.round((angleRef.current - target) / totalRange);
    targetRef.current = target + k * totalRange;
    resetAutoPlay();
  }, [angleStep, totalRange, resetAutoPlay]);

  // Calculate which card is currently closest to center
  const normalizedAngle = (((rotationAngle % totalRange) + totalRange) % totalRange);
  const rawIndex = Math.round(normalizedAngle / angleStep);
  const activeIndex = (((3 + rawIndex) % count) + count) % count;

  const activeCard = cards[activeIndex] || cards[0] || DEFAULT_HERO_CARDS[0];
  const activeMeta: SessionMeta = (activeCard && SESSION_METAS[activeCard.id]) || {
    category: activeCard?.category || "BESPOKE",
    title: activeCard?.label || "Bespoke Portrait Session",
    tagline: activeCard?.subtitle || "Unhurried, soulful storytelling in Abuja",
    price: "Bespoke Consultation",
    inclusions: "Maitama Studio & On-Location · Archival Master Edits",
    slot: "Private Maitama Studio",
    slug: "not-sure",
  };

  return (
    <section
      style={{ height: `calc(100dvh - ${navH}px)` }}
      className="relative w-full min-h-0 sm:min-h-[520px] flex flex-col justify-between overflow-hidden pt-2 sm:pt-6 pb-[max(0.6rem,env(safe-area-inset-bottom))] sm:pb-5 select-none bg-[#FAF7F2] border-b border-[#E8E2D8]"
    >
      {/* Background Ambience: Subtle warm ivory canvas */}
      <div className="absolute inset-0 bg-[#FAF7F2] pointer-events-none -z-10" />

      <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center shrink-0">
        {/* --- 1. EYEBROW KICKER WITH FLANKING ACCENT LINES (CENTERED) --- */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2 animate-fade-down delay-100">
          <span className="w-6 sm:w-12 h-[1.5px] bg-[#D93829] rounded-full sm:rounded-none shrink-0" />
          <span className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.28em] text-[#D93829] font-bold whitespace-nowrap">
            {heroCopy.kicker}
          </span>
          <span className="w-6 sm:w-12 h-[1.5px] bg-[#D93829] rounded-full sm:rounded-none shrink-0" />
        </div>

        {/* --- 2. MASTER DISPLAY TITLE WITH NESTLED 3D CAMERA ANCHOR --- */}
        <div className="relative inline-block max-w-3xl mx-auto mb-1 sm:mb-3 animate-fade-down delay-200">
          {/* Main Two-Line Ultra-Bold Condensed Sans Headline */}
          <h1 className="font-headline uppercase tracking-tight text-[#111111] font-black text-[clamp(1.65rem,7.4vw,2.25rem)] sm:text-[clamp(1.9rem,min(6vw,8svh),4.5rem)] leading-[0.93] sm:leading-[1.05] select-none text-center px-1 sm:px-2">
            <span className="block drop-shadow-sm whitespace-nowrap">
              {heroCopy.headline.includes(".") ? heroCopy.headline.split(".")[0] : heroCopy.headline}
            </span>
            {heroCopy.headline.includes(".") && (
              <span className="block drop-shadow-sm whitespace-nowrap">
                {heroCopy.headline.split(".").slice(1).join(".").trim()}
              </span>
            )}
          </h1>

          {/* Floating 3D Nikon Camera (Upper-Right Shoulder on Desktop, Zero Mobile Overhead) */}
          <div className="hidden lg:block absolute -top-8 lg:-top-12 -right-24 lg:-right-32 xl:-right-40 w-[160px] lg:w-[190px] h-[160px] lg:h-[190px] pointer-events-auto z-20 cursor-grab active:cursor-grabbing animate-blur-in delay-300">
            <div className="absolute inset-0 rounded-full bg-gold/15 blur-2xl -z-10 pointer-events-none transform scale-90" />
            <Nikon3DCamera />
          </div>
        </div>
      </div>
      

      {/* --- 5. THE SIGNATURE WIDE PANORAMIC 3D CARDS WHEEL (FULL SCREEN WIDTH) --- */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={handleWheel}
        className="relative w-full flex-1 min-h-0 overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
        style={{ perspective: "1600px", perspectiveOrigin: "50% 50%" }}
      >
        {/* Soft edge gradient fades so cards emerge seamlessly from the screen edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-r from-[#FAF7F2] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-20 bg-gradient-to-l from-[#FAF7F2] to-transparent z-20 pointer-events-none" />

        {/* 3D Cylindrical Wide Stage */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {loading || cards.length === 0 ? (
            [-2, -1, 0, 1, 2].map((offset) => {
              const cardAngle = offset * angleStep;
              const rad = (cardAngle * Math.PI) / 180;
              const x = Math.sin(rad) * cylinderRadius;
              const z = (Math.cos(rad) - 1) * cylinderRadius;
              const rotateY = cardAngle * 0.5;
              const translateY = Math.pow(Math.abs(cardAngle) * 0.16, 1.6);
              const scale = Math.max(0.78, 1 - Math.abs(cardAngle) * 0.0032);
              return (
                <div
                  key={`skeleton-${offset}`}
                  className="absolute pointer-events-none"
                  style={{
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    transform: `translate3d(${x}px, ${translateY}px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                    zIndex: 30 - Math.abs(offset),
                  }}
                >
                  <div className="w-full h-full rounded-[18px] sm:rounded-[24px] bg-[#EDE7DD] animate-pulse border border-line/60 p-3.5 flex flex-col justify-end shadow-editorial">
                    <div className="h-2 w-14 bg-gold/25 rounded mb-2" />
                    <div className="h-3.5 w-24 bg-deep/15 rounded" />
                  </div>
                </div>
              );
            })
          ) : (
            cards.map((card, idx) => {
            // Index 3 is COMMERCIAL (center card)
            const cardOffset = idx - 3;
            const cardAngle = cardOffset * angleStep;

            // Seamless infinite modulo wrapping around totalRange
            let diff = (cardAngle - rotationAngle) % totalRange;
            if (diff > totalRange / 2) diff -= totalRange;
            if (diff < -totalRange / 2) diff += totalRange;

            // Compute 3D cylindrical coordinates
            const rad = (diff * Math.PI) / 180;
            const x = Math.sin(rad) * cylinderRadius;
            const z = (Math.cos(rad) - 1) * cylinderRadius;

            // Gentle inward rotation (faces slightly towards the camera center)
            const rotateY = diff * 0.5;

            // Symmetrical convex arch: center card is at peak, side cards drop gracefully
            const translateY = Math.pow(Math.abs(diff) * 0.16, 1.6);

            // Subtle scale decay for depth
            const scale = Math.max(0.78, 1 - Math.abs(diff) * 0.0032);

            // Hide cards that wrap too far around the back of the cylinder
            const opacity = Math.abs(diff) < totalRange / 2 ? 1 : 0;
            const zIndex = Math.round(50 - Math.abs(diff));
            const isCenterFocus = Math.abs(diff) < angleStep * 0.52;

            return (
              <div
                key={card.id}
                onClick={(e) => {
                  e.stopPropagation();
                  selectCardIndex(idx);
                }}
                className="absolute select-none pointer-events-auto"
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transform: `translate3d(${x}px, ${translateY}px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                  zIndex,
                  opacity,
                  cursor: "pointer",
                  willChange: "transform, opacity",
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div
                  className={`w-full h-full rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-[0_16px_36px_rgba(24,20,17,0.28)] border transition-all duration-300 relative group bg-[#181411] ${
                    isCenterFocus
                      ? "border-[#D93829] ring-2 ring-[#D93829]/50 shadow-[0_22px_45px_rgba(217,56,41,0.35)]"
                      : "border-white/60 hover:border-gold/80"
                  }`}
                >
                  <FastCardImage
                    src={card.image}
                    alt={card.label}
                    placeholder={CARD_PLACEHOLDERS[card.id]}
                    isPriority={isCenterFocus}
                  />

                  {/* Gradient Overlay for Editorial Depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181411]/95 via-[#181411]/25 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Card Info at Bottom */}
                  <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 text-left">
                    <span className="font-sans text-[8px] sm:text-[9px] uppercase tracking-[0.22em] text-[#E0B253] font-bold block mb-0.5">
                      {card.category}
                    </span>
                    <h4 className="font-sans font-semibold text-[11px] sm:text-xs lg:text-sm text-[#FAF7F2] line-clamp-1 leading-snug">
                      {card.label}
                    </h4>
                  </div>

                  {/* Center Focus Badge */}
                  {isCenterFocus && (
                    <div className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 bg-[#D93829] text-white p-1 rounded-full shadow-md animate-pulse">
                      <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* --- 6. UNIFIED EDITORIAL ATELIER CONSOLE & TRUST DECK (Desktop & Mobile) --- */}
      <div className="relative w-full max-w-5xl mx-auto px-3 sm:px-6 mt-1 sm:mt-2 shrink-0 z-30 animate-fade-up delay-300">
        {/* Category Trajectory & Interactive Scrubber */}
        <div className="flex items-center justify-center gap-1 sm:gap-2.5 md:gap-4 text-[7.5px] sm:text-[10px] md:text-[11px] font-sans uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#6E6359] flex-wrap md:flex-nowrap mb-1.5 sm:mb-2 px-1">
          {loading || cards.length === 0 ? (
            [1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-3 w-14 bg-line/60 rounded-full animate-pulse" />
            ))
          ) : (
            cards.map((card, idx) => {
              const isSelected = activeIndex === idx;

              return (
                <React.Fragment key={card.id}>
                  <button
                    onClick={() => selectCardIndex(idx)}
                    className={`transition-all duration-300 font-bold focus:outline-none cursor-pointer whitespace-nowrap px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "text-[#D93829] bg-[#D93829]/10 scale-105 drop-shadow-sm"
                        : "text-[#6E6359] hover:text-[#D93829]"
                    }`}
                  >
                    {card.category}
                  </button>
                  {idx < cards.length - 1 && (
                    <span
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 shrink-0 ${
                        isSelected ? "bg-[#D93829] scale-125" : "bg-[#D93829]/60"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Live Active Session Spotlight Console (Desktop & Mobile) */}
        <AnimatePresence mode="wait">
          {activeCard && (
            <motion.div
              key={activeCard.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#E8E2D8] p-2.5 sm:p-4 shadow-[0_8px_30px_rgba(24,20,17,0.06)] flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-5"
            >
              {/* Left Column: Active Session Identity & Inclusions */}
              <div className="min-w-0 flex-1 text-center sm:text-left w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.22em] text-[#D93829] font-bold truncate">
                    {activeMeta.category}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[#6E6359]/60">·</span>
                  <span className="text-[9.5px] sm:text-[11px] text-[#C9A96E] font-semibold truncate">
                    {activeMeta.price}
                  </span>
                  <span className="hidden md:inline text-[9px] text-[#6E6359]/60">·</span>
                  <span className="hidden md:inline text-[10px] text-[#6E6359] font-medium truncate">
                    {activeMeta.slot}
                  </span>
                </div>
                <h3 className="font-serif text-xs sm:text-base lg:text-lg text-[#111111] font-bold truncate leading-tight">
                  {activeMeta.title}
                </h3>
                <p className="hidden sm:block text-[10px] lg:text-[11px] text-[#6E6359] font-sans mt-0.5 line-clamp-1">
                  {activeMeta.tagline} · {activeMeta.inclusions}
                </p>
              </div>

              {/* Right Column: Direct Responsive Action Hub */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center shrink-0">
                <Link
                  href={`/sessions/${activeMeta.slug}`}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full border border-[#D9D1C5] hover:border-[#111111] text-[#111111] text-[9.5px] sm:text-[11px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.16em] transition-all bg-transparent hover:bg-white"
                >
                  <span>Guide & Rates</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </Link>
                <Link
                  href={`/book?session=${activeMeta.slug}`}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-[#111111] hover:bg-[#D93829] text-white text-[9.5px] sm:text-[11px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] transition-all shadow-sm hover:shadow-md group"
                >
                  <span>Book This Session</span>
                  <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop 4-Pillar Atelier Trust Strip */}
        <div className="hidden sm:grid grid-cols-4 gap-2 md:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[#E8E2D8]/60 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <div className="min-w-0">
              <div className="text-[9.5px] lg:text-[10px] font-bold uppercase tracking-wider text-[#111111] truncate">
                Private Maitama Studio
              </div>
              <div className="text-[8.5px] lg:text-[9px] text-[#6E6359] truncate">
                Natural light & strobe facility
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <div className="min-w-0">
              <div className="text-[9.5px] lg:text-[10px] font-bold uppercase tracking-wider text-[#111111] truncate">
                1-on-1 Wardrobe Prep
              </div>
              <div className="text-[8.5px] lg:text-[9px] text-[#6E6359] truncate">
                Personal styling consultation
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <div className="min-w-0">
              <div className="text-[9.5px] lg:text-[10px] font-bold uppercase tracking-wider text-[#111111] truncate">
                Fine-Art Retouching
              </div>
              <div className="text-[8.5px] lg:text-[9px] text-[#6E6359] truncate">
                Hand-graded master edits
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <div className="min-w-0">
              <div className="text-[9.5px] lg:text-[10px] font-bold uppercase tracking-wider text-[#111111] truncate">
                20-Min Slot Lock
              </div>
              <div className="text-[8.5px] lg:text-[9px] text-[#6E6359] truncate">
                Instant calendar confirmation
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Atelier Trust Micro-Ticker */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-1.5 text-[8px] uppercase tracking-[0.14em] text-[#6E6359]/80 font-medium px-1 text-center">
          <span>✦ Maitama Private Studio</span>
          <span>·</span>
          <span>✦ 20h Slot Lock</span>
          <span>·</span>
          <span>✦ Fine-Art Retouching</span>
        </div>
      </div>
    </section>
  );
}
