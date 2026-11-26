"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
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
    slot: "Limited 2026/2027 Dates · Abuja & Nationwide",
    slug: "wedding",
  },
  traditional: {
    title: "Cultural Heritage",
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
    title: "Toddler & Children",
    price: "From ₦95,000",
    slot: "Unhurried morning slots · Ages 1 to 10",
    slug: "toddler",
  },
  legacy: {
    title: "Family Portraits",
    price: "From ₦160,000",
    slot: "Generations together · Maitama Studio Suite",
    slug: "family",
  },
  atelier: {
    title: "Maternity & Motherhood",
    price: "From ₦140,000 (50% Deposit)",
    slot: "Gentle afternoon lighting · Calm sanctuary",
    slug: "maternity",
  },
};

export function HeroOverhaulSection({ initialCards = null, initialCopy = null }: HeroOverhaulSectionProps) {
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [wheelH, setWheelH] = useState(320);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [navH, setNavH] = useState(72);
  const [rotationAngle, setRotationAngle] = useState(0); // rendering only
  const [cards, setCards] = useState<WheelCard[]>(initialCards || []);
  const [[activeMobileIndex, mobileDirection], setMobileState] = useState<[number, number]>([0, 0]);
  const [loading, setLoading] = useState(!initialCards || initialCards.length === 0);
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

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const count = cards.length || 7;

  // Desktop Responsive 3D Geometry (Untouched for desktop & tab)
  const angleStep = 15;
  const cardHeight = Math.round(Math.min(Math.max(wheelH * 0.72, 150), 360));
  const cardWidth = Math.round(cardHeight * 0.705);
  const spacing = cardWidth * 1.08;
  const cylinderRadius = spacing / Math.sin((angleStep * Math.PI) / 180);
  const totalRange = Math.max(1, count * angleStep);

  // Fetch live settings/cards from Neon DB silently in background
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

  // Smooth 60fps spring interpolation & momentum glide (for desktop/tablet wheel)
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

    targetRef.current = startAngleRef.current - dx * 0.09;

    const now = performance.now();
    if (now - lastTRef.current > 16) {
      velocityRef.current = -(e.clientX - lastXRef.current) / 160;
      lastXRef.current = e.clientX;
      lastTRef.current = now;
    }
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 3) targetRef.current += delta * 0.08;
  };

  // Center a specific card index on desktop
  const selectCardIndex = useCallback((index: number) => {
    const target = (index - 3) * angleStep;
    const k = Math.round((angleRef.current - target) / totalRange);
    targetRef.current = target + k * totalRange;
  }, [angleStep, totalRange]);

  // Mobile animation variants for crisp "fade in/out atop and under"
  const mobileVariants: Variants = {
    enter: (dir: number) => ({
      opacity: 0,
      scale: 1.04,
      y: dir >= 0 ? 18 : -18,
      zIndex: 2, // ATOP
    }),
    center: {
      opacity: 1,
      scale: 1,
      y: 0,
      zIndex: 2,
      transition: {
        opacity: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
        y: { type: "spring" as const, stiffness: 340, damping: 32 },
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      scale: 0.94,
      y: dir >= 0 ? -14 : 14,
      zIndex: 1, // UNDER
      transition: {
        opacity: { duration: 0.22, ease: [0.4, 0, 1, 1] },
        scale: { duration: 0.26, ease: [0.4, 0, 1, 1] },
        y: { duration: 0.22, ease: [0.4, 0, 1, 1] },
      },
    }),
  };

  // Mobile swipe gestures & pagination
  const paginateMobile = useCallback(
    (newIndex: number) => {
      if (newIndex === activeMobileIndex || cards.length === 0) return;
      const dir = newIndex > activeMobileIndex ? 1 : -1;
      setMobileState([newIndex, dir]);
    },
    [activeMobileIndex, cards.length]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (cards.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
      if (dx < 0) {
        const nextIndex = (activeMobileIndex + 1) % cards.length;
        setMobileState([nextIndex, 1]);
      } else {
        const prevIndex = (activeMobileIndex - 1 + cards.length) % cards.length;
        setMobileState([prevIndex, -1]);
      }
    }
  };

  // Mobile current card calculation
  const currentMobileCard = cards[activeMobileIndex] || cards[0];
  const currentInfo = (currentMobileCard ? MOBILE_SESSION_META[currentMobileCard.id] : null) || {
    title: currentMobileCard?.label || "Bespoke Session",
    price: "Bespoke Atelier Consultation",
    slot: "Private Maitama Studio · Abuja",
    slug: currentMobileCard?.id || "not-sure",
  };

  // Calculate which card is currently closest to center on desktop
  const normalizedAngle = (((rotationAngle % totalRange) + totalRange) % totalRange);
  const rawIndex = Math.round(normalizedAngle / angleStep);
  const activeIndex = (((3 + rawIndex) % count) + count) % count;

  return (
    <>
      {/* ======================================================== */}
      {/* 1. MOBILE-ONLY HERO ATELIER SHOWCASE (block md:hidden)   */}
      {/* Takes up 100% full mobile screen height, prominent card,  */}
      {/* vertical thumb rail, 'Book This Session' & WhatsApp      */}
      {/* ======================================================== */}
      <section
        style={{ height: `calc(100dvh - ${navH}px)` }}
        className="flex md:hidden flex-col w-full p-2.5 sm:p-4 bg-[#14100D] overflow-hidden select-none border-b border-[#2A231E]"
      >
        {/* Main Card + Right Vertical Rail (Fills Remaining Vertical Space) */}
        <div className="flex-1 min-h-0 flex gap-2 sm:gap-3 w-full">
          {/* Main Card (~82% width) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex-1 h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1C1814]"
          >
            {/* Animated Photo Transition: enters ATOP (zIndex: 2), exits UNDER (zIndex: 1) */}
            <AnimatePresence custom={mobileDirection} initial={false}>
              <motion.div
                key={currentMobileCard?.image || activeMobileIndex}
                custom={mobileDirection}
                variants={mobileVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full overflow-hidden"
              >
                {currentMobileCard?.image && (
                  <img
                    src={currentMobileCard.image}
                    alt={currentMobileCard.label || "LamSparks Session"}
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                  />
                )}

                {/* Cinematic Gradient at the Bottom for Text Clarity */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
              </motion.div>
            </AnimatePresence>

            {/* Category Tag at Top Left with smooth crossfade */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentMobileCard?.category}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.2 }}
                  className="px-2.5 py-1 rounded-full text-[9px] font-sans font-bold uppercase tracking-[0.2em] bg-black/60 backdrop-blur-md text-[#E0B253] border border-white/15 shadow-sm block"
                >
                  {currentMobileCard?.category}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Live Indicator at Top Right */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-sans uppercase tracking-wider bg-black/50 backdrop-blur-md text-white/80 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Available</span>
              </span>
            </div>

            {/* Bottom Content: Title, Price, Slot Info with Crisp Motion */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 pointer-events-none overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMobileCard?.id || activeMobileIndex}
                  initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-1"
                >
                  <h2 className="font-serif text-2xl text-white font-normal leading-tight drop-shadow-md">
                    {currentInfo.title}
                  </h2>
                  <p className="font-sans text-xs text-[#E0B253] font-semibold drop-shadow-sm">
                    {currentInfo.price}
                  </p>
                  <p className="font-sans text-[10.5px] text-white/75 drop-shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                    <span className="truncate">{currentInfo.slot}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Vertical Thumbnail Rail (~18% width) */}
          <div className="w-11 sm:w-12 shrink-0 flex flex-col justify-between py-0.5 gap-1.5">
            {cards.map((card, idx) => {
              const isActive = activeMobileIndex === idx;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => paginateMobile(idx)}
                  aria-label={`Select ${card.category}`}
                  className={`flex-1 w-full rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-center border ${
                    isActive
                      ? "border-[#E5C483] shadow-md scale-[1.04]"
                      : "bg-[#221C18]/90 hover:bg-[#2A231E] border-white/10 opacity-60 hover:opacity-90"
                  }`}
                >
                  <img
                    src={card.image}
                    alt={card.label}
                    className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                  />
                  <div
                    className={`absolute inset-0 transition-colors ${
                      isActive ? "bg-[#C9A96E]/30" : "bg-black/45"
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="active-mobile-rail-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-[#C9A96E] border-2 border-[#E5C483] ring-2 ring-[#C9A96E]/50 rounded-xl"
                    />
                  )}
                  <span
                    className={`relative z-10 text-[9px] font-mono font-bold tracking-tighter ${
                      isActive ? "text-white drop-shadow-sm font-extrabold" : "text-white/60"
                    }`}
                  >
                    0{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Row: "Book This Session" + "WhatsApp" */}
        <div className="pt-2.5 shrink-0 flex items-center gap-2 w-full pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          {/* Main Booking Button (replaces 'See packages' as requested) */}
          <Link
            href={`/book?session=${currentInfo.slug}`}
            className="flex-1 py-3 px-3.5 rounded-xl bg-white hover:bg-white/95 active:scale-[0.99] text-[#14100D] font-sans font-bold text-xs uppercase tracking-wider text-center shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <span>Book This Session</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>

          {/* WhatsApp Direct Concierge */}
          <a
            href={`https://wa.me/2348130847299?text=${encodeURIComponent(
              `Hello LamSparks Concierge, I would like to book or inquire about the ${currentInfo.title} session.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3.5 rounded-xl bg-[#221C18] hover:bg-[#2C241F] active:scale-[0.99] border border-white/20 text-white font-sans font-bold text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>WhatsApp</span>
          </a>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. DESKTOP & TABLET VIEW (hidden md:flex)                */}
      {/* 100% UNTOUCHED 3D cylindrical wheel layout & Nikon cam   */}
      {/* ======================================================== */}
      <section
        style={{ height: `calc(100dvh - ${navH}px)` }}
        className="hidden md:flex relative w-full min-h-[520px] flex-col overflow-hidden pt-8 pb-5 select-none bg-[#FAF7F2] border-b border-[#E8E2D8]"
      >
        {/* Background Ambience: Subtle warm ivory canvas */}
        <div className="absolute inset-0 bg-[#FAF7F2] pointer-events-none -z-10" />

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 text-center shrink-0">
          {/* --- 1. EYEBROW KICKER WITH FLANKING ACCENT LINES (CENTERED) --- */}
          <div className="flex items-center justify-center gap-3 mb-3 animate-fade-down delay-100">
            <span className="w-12 h-[1.5px] bg-[#D93829] rounded-none shrink-0" />
            <span className="font-sans text-xs uppercase tracking-[0.28em] text-[#D93829] font-bold whitespace-nowrap">
              {heroCopy.kicker}
            </span>
            <span className="w-12 h-[1.5px] bg-[#D93829] rounded-none shrink-0" />
          </div>

          {/* --- 2. MASTER DISPLAY TITLE WITH NESTLED 3D CAMERA ANCHOR --- */}
          <div className="relative inline-block max-w-3xl mx-auto mb-3 animate-fade-down delay-200">
            {/* Main Two-Line Ultra-Bold Condensed Sans Headline */}
            <h1 className="font-headline uppercase tracking-tight text-[#111111] font-black text-[clamp(1.9rem,min(6vw,8svh),4.5rem)] leading-[1.05] select-none text-center px-2">
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
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FAF7F2] to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FAF7F2] to-transparent z-20 pointer-events-none" />

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
                    <div className="w-full h-full rounded-[24px] bg-[#EDE7DD] animate-pulse border border-line/60 p-3.5 flex flex-col justify-end shadow-editorial">
                      <div className="h-2 w-14 bg-gold/25 rounded mb-2" />
                      <div className="h-3.5 w-24 bg-deep/15 rounded" />
                    </div>
                  </div>
                );
              })
            ) : (
              cards.map((card, idx) => {
                // Index 3 is center card
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
                    }}
                  >
                    <div
                      className={`w-full h-full rounded-[24px] overflow-hidden shadow-[0_16px_36px_rgba(24,20,17,0.28)] border transition-all duration-300 relative group bg-[#181411] ${
                        isCenterFocus
                          ? "border-[#D93829] ring-2 ring-[#D93829]/50 shadow-[0_22px_45px_rgba(217,56,41,0.35)]"
                          : "border-white/60 hover:border-gold/80"
                      }`}
                    >
                      <img
                        src={card.image}
                        alt={card.label}
                        className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-none"
                        loading="eager"
                        decoding="async"
                        fetchPriority={idx === 3 ? "high" : "auto"}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.endsWith(".webp")) {
                            target.src = target.src.replace(".webp", ".jpg");
                          }
                        }}
                      />

                      {/* Gradient Overlay for Editorial Depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#181411]/95 via-[#181411]/25 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Card Info at Bottom */}
                      <div className="absolute bottom-3 left-3 right-3 text-left">
                        <span className="font-sans text-[9px] uppercase tracking-[0.22em] text-[#E0B253] font-bold block mb-0.5">
                          {card.category}
                        </span>
                        <h4 className="font-sans font-semibold text-xs lg:text-sm text-[#FAF7F2] line-clamp-1 leading-snug">
                          {card.label}
                        </h4>
                      </div>

                      {/* Center Focus Badge */}
                      {isCenterFocus && (
                        <div className="absolute top-2.5 right-2.5 bg-[#D93829] text-white p-1 rounded-full shadow-md animate-pulse">
                          <Camera className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- 6. CURVED / ARCHED CATEGORY TRAJECTORY WITH RED DOTS --- */}
        <div className="relative max-w-5xl w-full mx-auto mt-3 text-center shrink-0 animate-fade-up delay-400">
          <div className="flex items-center justify-center gap-3 md:gap-5 text-[11px] font-sans uppercase tracking-[0.2em] text-[#6E6359] flex-wrap md:flex-nowrap px-2">
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
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shrink-0 ${
                          isSelected ? "bg-[#D93829] scale-125" : "bg-[#D93829]/70"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Interactive Hint Indicator */}
          <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-[#6E6359]/60 font-medium">
            Swipe to explore
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-[#D93829] text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors"
            >
              View Portfolio
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md group"
            >
              <span>BOOK</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
