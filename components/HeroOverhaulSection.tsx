"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera } from "lucide-react";
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

const MOBILE_SESSION_META: Record<
  string,
  { title: string; price: string; slot: string; slug: string }
> = {
  weddings: {
    title: "Weddings & Ceremonies",
    price: "Bespoke Consultation",
    slot: "2026/2027 Dates · Abuja & Nationwide",
    slug: "wedding",
  },
  traditional: {
    title: "Cultural Heritage & Nuptials",
    price: "From ₦250,000",
    slot: "Aso-Oke & Haute Couture · Maitama Studio",
    slug: "wedding",
  },
  events: {
    title: "Milestone Events & Galas",
    price: "From ₦120,000",
    slot: "Weekend dates available · Discreet coverage",
    slug: "event",
  },
  executive: {
    title: "Executive & Official Portraits",
    price: "From ₦85,000",
    slot: "Mon, Wed & Fri · Private Maitama Studio",
    slug: "official-portrait",
  },
  lifestyle: {
    title: "Toddler & Children Sessions",
    price: "From ₦95,000",
    slot: "Unhurried morning slots · Ages 1 to 10",
    slug: "toddler",
  },
  legacy: {
    title: "Family & Multi-Gen Portraits",
    price: "From ₦160,000",
    slot: "Generations together · Maitama Studio Suite",
    slug: "family",
  },
  atelier: {
    title: "Maternity & Motherhood",
    price: "From ₦140,000",
    slot: "Gentle afternoon lighting · Calm sanctuary",
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
  const angleStep = isMobile ? 24 : 15;
  const cardHeight = isMobile
    ? Math.round(Math.min(Math.max(wheelH * 0.80, 235), 335))
    : Math.round(Math.min(Math.max(wheelH * 0.72, 150), 360));
  const cardWidth = Math.round(cardHeight * (isMobile ? 0.74 : 0.705));
  const spacing = cardWidth * (isMobile ? 1.06 : 1.08);
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

  // Auto-advance to the next card every 5 seconds
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    autoPlayTimerRef.current = setInterval(() => {
      if (!draggingRef.current && count > 0) {
        targetRef.current += angleStep;
      }
    }, 5000);
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

  return (
    <section
      style={{ height: "100dvh" }}
      className="relative w-full min-h-0 sm:min-h-[600px] flex flex-col overflow-hidden pt-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] sm:pt-[6.5rem] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5 select-none bg-[#FAF7F2] border-b border-[#E8E2D8]"
    >
      {/* Background Ambience: Subtle warm ivory canvas */}
      <div className="absolute inset-0 bg-[#FAF7F2] pointer-events-none -z-10" />

      {/* Mobile-Only Subtle Blurred LAMSPARKS Hue in Nav Slot (Subtly Covered When Nav Appears) */}
      <div
        aria-hidden="true"
        className="sm:hidden absolute top-2.5 inset-x-2.5 h-13 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
      >
        <div className="absolute inset-x-10 h-8 rounded-full bg-gradient-to-r from-[#C9A96E]/20 via-[#D93829]/12 to-[#C9A96E]/20 blur-xl" />
        <span className="font-display text-[22px] font-bold uppercase tracking-[0.38em] text-[#8A7559]/35 blur-[4.5px] whitespace-nowrap">
          LAMSPARKS
        </span>
      </div>

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

      {/* Mobile-Only Active Spotlight (Fills Whitespace Below Image Carousel) */}
      <div className="block sm:hidden w-full max-w-sm mx-auto px-3.5 my-1 shrink-0 z-30">
        <AnimatePresence mode="wait">
          {cards[activeIndex] && (
            <motion.div
              key={cards[activeIndex].id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/85 backdrop-blur-md rounded-2xl border border-[#E8E2D8] p-2.5 shadow-sm flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#D93829] font-bold truncate">
                    {cards[activeIndex].category}
                  </span>
                  <span className="text-[9px] text-[#6E6359]/60">·</span>
                  <span className="text-[9.5px] text-[#C9A96E] font-semibold truncate">
                    {MOBILE_SESSION_META[cards[activeIndex].id]?.price || "Bespoke Atelier"}
                  </span>
                </div>
                <h3 className="font-serif text-xs text-[#111111] font-semibold truncate leading-tight">
                  {MOBILE_SESSION_META[cards[activeIndex].id]?.title || cards[activeIndex].label}
                </h3>
              </div>
              <Link
                href={`/book?session=${MOBILE_SESSION_META[cards[activeIndex].id]?.slug || "not-sure"}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#111111] hover:bg-[#D93829] text-white text-[9.5px] font-bold uppercase tracking-wider shrink-0 transition-colors shadow-sm"
              >
                <span>Book</span>
                <ArrowUpRight className="w-2.5 h-2.5 stroke-[2.5]" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- 6. CURVED / ARCHED CATEGORY TRAJECTORY WITH RED DOTS --- */}
      <div className="relative max-w-5xl w-full mx-auto mt-1.5 sm:mt-3 text-center shrink-0 animate-fade-up delay-400">
        <div className="flex items-center justify-center gap-1 sm:gap-3 md:gap-5 text-[7.5px] sm:text-[11px] font-sans uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#6E6359] flex-wrap md:flex-nowrap px-2">
          {loading || cards.length === 0 ? (
            [1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-3 w-16 bg-line/60 rounded-full animate-pulse" />
            ))
          ) : (
            cards.map((card, idx) => {
              const isSelected = activeIndex === idx;

              return (
                <React.Fragment key={card.id}>
                  <button
                    onClick={() => selectCardIndex(idx)}
                    className={`transition-all duration-300 font-bold focus:outline-none cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "text-[#D93829] scale-105 drop-shadow-sm"
                        : "text-[#6E6359] hover:text-[#D93829]"
                    }`}
                  >
                    {card.category}
                  </button>
                  {idx < cards.length - 1 && (
                    <span
                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 shrink-0 ${
                        isSelected ? "bg-[#D93829] scale-125" : "bg-[#D93829]/70"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="mt-2 sm:mt-3.5 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#111111] hover:bg-[#D93829] text-white px-4 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] transition-colors"
          >
            View Portfolio
            <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </Link>
          <Link
            href="/book"
            aria-label="Book a session"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] w-[34px] h-[34px] sm:w-auto sm:h-auto sm:px-6 sm:py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.2em] transition-all shadow-sm hover:shadow-md group"
          >
            <span className="hidden sm:inline">BOOK</span>
            <ArrowUpRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Mobile Atelier Trust Micro-Ticker */}
        <div className="flex sm:hidden items-center justify-center gap-2 mt-2 text-[8px] uppercase tracking-[0.16em] text-[#6E6359]/70 font-medium px-2 text-center">
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
