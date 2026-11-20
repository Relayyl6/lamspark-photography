"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
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

export function HeroOverhaulSection({ initialCards = null, initialCopy = null }: HeroOverhaulSectionProps) {
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [wheelH, setWheelH] = useState(320);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [navH, setNavH] = useState(80);
  const [rotationAngle, setRotationAngle] = useState(0); // rendering only
  const [cards, setCards] = useState<WheelCard[]>(initialCards || []);
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

  const containerRef = useRef<HTMLDivElement>(null);

  const count = cards.length || 7;
  const isMobile = viewportWidth < 768;

  // Responsive 3D Geometry
  const angleStep = isMobile ? 22 : 15;
  const cardHeight = isMobile
    ? Math.round(Math.min(Math.max(wheelH * 0.82, 260), 305))
    : Math.round(Math.min(Math.max(wheelH * 0.72, 150), 360));
  const cardWidth = Math.round(cardHeight * 0.705);
  const spacing = cardWidth * (isMobile ? 1.04 : 1.08);
  const cylinderRadius = spacing / Math.sin((angleStep * Math.PI) / 180);
  const totalRange = Math.max(1, count * angleStep);

  // Fetch live settings/cards from Neon DB
  useEffect(() => {
    setLoading(true);
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

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 3) targetRef.current += delta * 0.08;
  };

  // Center a specific card index
  const selectCardIndex = useCallback((index: number) => {
    const target = (index - 3) * angleStep;
    const k = Math.round((angleRef.current - target) / totalRange);
    targetRef.current = target + k * totalRange;
  }, [angleStep, totalRange]);

  // Calculate which card is currently closest to center
  const normalizedAngle = (((rotationAngle % totalRange) + totalRange) % totalRange);
  const rawIndex = Math.round(normalizedAngle / angleStep);
  const activeIndex = (((3 + rawIndex) % count) + count) % count;

  return (
    <section
      style={{ height: `calc(100svh - ${navH}px)` }}
      className="relative w-full min-h-[520px] flex flex-col overflow-hidden pt-2 sm:pt-8 pb-2 sm:pb-5 select-none bg-[#FAF7F2] border-b border-[#E8E2D8]"
    >
      {/* Background Ambience: Subtle warm ivory canvas */}
      <div className="absolute inset-0 bg-[#FAF7F2] pointer-events-none -z-10" />

      <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center shrink-0">
        {/* --- 1. EYEBROW KICKER WITH FLANKING ACCENT LINES (CENTERED) --- */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-1 sm:mb-3 animate-fade-down delay-100">
          <span className="w-8 sm:w-12 h-[2px] sm:h-[1.5px] bg-[#D93829] rounded-full sm:rounded-none shrink-0" />
          <span className="font-sans text-xs sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.28em] text-[#D93829] font-bold whitespace-nowrap">
            {heroCopy.kicker}
          </span>
          <span className="w-8 sm:w-12 h-[2px] sm:h-[1.5px] bg-[#D93829] rounded-full sm:rounded-none shrink-0" />
        </div>

        {/* --- 2. MASTER DISPLAY TITLE WITH NESTLED 3D CAMERA ANCHOR --- */}
        <div className="relative inline-block max-w-3xl mx-auto mb-1.5 sm:mb-3 animate-fade-down delay-200">
          {/* Main Two-Line Ultra-Bold Condensed Sans Headline (Mobile-only larger scale, untouched desktop/tab) */}
          <h1 className="font-headline uppercase tracking-tight text-[#111111] font-black text-[clamp(2.15rem,9.6vw,2.9rem)] sm:text-[clamp(1.9rem,min(6vw,8svh),4.5rem)] leading-[0.93] sm:leading-[1.05] select-none text-center px-1 sm:px-2">
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
                }}
              >
                <div
                  className={`w-full h-full rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-[0_16px_36px_rgba(24,20,17,0.28)] border transition-all duration-300 relative group bg-[#181411] ${
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

      {/* --- 6. CURVED / ARCHED CATEGORY TRAJECTORY WITH RED DOTS --- */}
      <div className="relative max-w-5xl w-full mx-auto mt-2 sm:mt-3 text-center shrink-0 animate-fade-up delay-400">
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-5 text-[8px] sm:text-[11px] font-sans uppercase tracking-[0.2em] text-[#6E6359] flex-wrap md:flex-nowrap px-2">
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
        <div className="mt-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-[#6E6359]/60 font-medium">
          Swipe to explore
        </div>

        <Link
          href="/portfolio"
          className="mt-2 sm:mt-3 inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-[#D93829] text-white px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors"
        >
          View Portfolio
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
