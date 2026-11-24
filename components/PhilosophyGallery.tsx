"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Editorial Monograph: Pinned Horizontal Continuous Filmstrip       */
/*  - Continuous camera pan: every pixel of scroll immediately moves  */
/*    the horizontal strip so the user immediately perceives motion   */
/*  - Fast, responsive travel: SCROLL_VH_PER_STEP reduced to 24vh     */
/*  - Live progress bar + chapter navigation indicators for clarity   */
/*  - 120fps direct DOM transforms without React re-render lag        */
/* ------------------------------------------------------------------ */

const BG = "#F5F3EF";
const INK = "#2B2927";
const MUTED = "#7A746C";
const GOLD = "#B8893A";

const PAD = 6; // white photo border, in design units
const PAN_EASE = "cubic-bezier(.22,1,.36,1)";
const SCROLL_VH_PER_STEP = 24; // fast, responsive scroll per photo (reduced from 70vh)

// Design canvases. 1 design unit = 1px at these widths, scaled by `u`.
const DESKTOP = { W: 1132, H: 560, TRACK: 2790 };
const MOBILE = { W: 390, TEXT_H: 270, PHOTO_H: 340, TRACK: 1170 };

type Pose = { x: number; y: number; w: number; rot: number };

type Photo = {
  src: string;
  ar: number;
  title: string;
  sub: string;
  cluster: number;
  z: number;
  d: Pose; // desktop pose, absolute on the track
  m: Pose; // mobile pose, relative to its cluster
};

type TextBlock = { lead: string; body: string; x: number; cta?: boolean };
type Note = { text: string; x: number; y: number; arrow?: "up" | "down" };

// Canonical default photos loaded immediately with zero flash of loading skeleton
const CANONICAL_PHOTOS: Photo[] = [
  {
    src: "/images/client/weddings_1.webp",
    ar: 0.72,
    cluster: 0,
    z: 3,
    title: "Sacred Unions",
    sub: "Wedding ceremonies",
    d: { x: 30, y: 235, w: 200, rot: -3 },
    m: { x: 12, y: 96, w: 118, rot: -3 },
  },
  {
    src: "/images/client/weddings_2.webp",
    ar: 0.72,
    cluster: 0,
    z: 1,
    title: "Cultural Heritage",
    sub: "Aso-Oke & grace",
    d: { x: 178, y: 90, w: 185, rot: 0.5 },
    m: { x: 100, y: 20, w: 118, rot: 0.5 },
  },
  {
    src: "/images/client/events_1.webp",
    ar: 0.72,
    cluster: 0,
    z: 2,
    title: "Milestone Galas",
    sub: "Unscripted warmth",
    d: { x: 345, y: 150, w: 205, rot: 3 },
    m: { x: 200, y: 110, w: 130, rot: 3 },
  },
  {
    src: "/images/client/corporate_1.webp",
    ar: 0.72,
    cluster: 1,
    z: 2,
    title: "Executive Gravitas",
    sub: "Commanding presence",
    d: { x: 960, y: 220, w: 210, rot: -2 },
    m: { x: 20, y: 100, w: 130, rot: -2 },
  },
  {
    src: "/images/client/events_3.webp",
    ar: 0.72,
    cluster: 1,
    z: 1,
    title: "Authentic Moments",
    sub: "Life, as it happens",
    d: { x: 1210, y: 140, w: 220, rot: 2.5 },
    m: { x: 180, y: 40, w: 140, rot: 2 },
  },
  {
    src: "/images/client/corporate_3.webp",
    ar: 0.72,
    cluster: 2,
    z: 2,
    title: "Dynasty & Legacy",
    sub: "Portraits of honor",
    d: { x: 1780, y: 220, w: 200, rot: -1.5 },
    m: { x: 20, y: 110, w: 130, rot: -1.5 },
  },
  {
    src: "/images/client/corporate_6.webp",
    ar: 0.72,
    cluster: 2,
    z: 1,
    title: "Studio Dignity",
    sub: "Tailored composure",
    d: { x: 1990, y: 80, w: 195, rot: 2 },
    m: { x: 170, y: 30, w: 130, rot: 2 },
  },
];

// One text block per cluster
const TEXTS: TextBlock[] = [
  {
    lead: "Capturing moments.",
    body: "The name LamSparks is born from love, honouring my mother, Lametu. She taught me that life’s most profound treasures are the fleeting, tender glances between loved ones that often go unseen.",
    x: 610,
  },
  {
    lead: "Preserving memories.",
    body: "We never rush a child, force a pose, or crowd an intimate space. In our Abuja studio and on location, we create portraits that stay with families for generations.",
    x: 1480,
  },
  {
    lead: "Sparkling lives.",
    body: "From unhurried wedding ceremonies to heirloom family portraits, every frame is made to be kept.",
    x: 2300,
    cta: true,
  },
];

// 3 Chapters corresponding to the clusters
const CHAPTERS = [
  { index: 0, photoIdx: 0, label: "Capturing Moments", kicker: "Chapter I" },
  { index: 1, photoIdx: 3, label: "Preserving Memories", kicker: "Chapter II" },
  { index: 2, photoIdx: 5, label: "Sparkling Lives", kicker: "Chapter III" },
];

// Handwritten annotations (desktop only), absolute on the track
const NOTES: Note[] = [
  { text: "Unhurried, unscripted", x: 170, y: 58 },
  { text: "Aso-Oke & grace", x: 265, y: 468, arrow: "up" },
  { text: "Golden hour, Abuja", x: 1020, y: 60, arrow: "down" },
  { text: "Quiet authority", x: 1860, y: 60 },
];

const HAND = "var(--font-hand), 'Segoe Print', 'Bradley Hand', cursive";

function Arrow({ dir, s }: { dir: "up" | "down"; s: number }) {
  return (
    <svg
      width={56 * s}
      height={38 * s}
      viewBox="0 0 56 38"
      fill="none"
      stroke="#3A3632"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: "block", transform: dir === "up" ? "scaleY(-1)" : undefined }}
    >
      <path d="M5 3 C 4 24, 22 34, 49 27" />
      <path d="M43 22 L50 27 L44 32" />
    </svg>
  );
}

export function PhilosophyGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const mobileTextRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(0);
  const idxRef = useRef(0);

  const [photos, setPhotos] = useState<Photo[]>(CANONICAL_PHOTOS);
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: 560,
  });
  const [navH, setNavH] = useState(64);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Fetch live photos from Neon DB (with canonical fallbacks)
  useEffect(() => {
    fetch("/api/content?key=philosophy_photos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.value) && data.value.length > 0) {
          setPhotos(data.value);
        }
      })
      .catch(() => {});
  }, []);

  const n = Math.max(1, photos.length);

  /* ---------- environment ---------- */
  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
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

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || window.innerWidth || 1200;
      const h = el.clientHeight || 560;
      setSize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [photos.length]);

  /* ---------- layout maths ---------- */
  const W = size.w;
  const H = size.h;
  const isMobile = W < 768;

  const designH = isMobile ? MOBILE.TEXT_H + MOBILE.PHOTO_H : DESKTOP.H;
  const u = isMobile
    ? Math.max(0.5, Math.min(W / MOBILE.W, H / designH))
    : Math.max(0.5, Math.min(W / DESKTOP.W, H / DESKTOP.H, 1.6));

  const top = Math.max(0, (H - designH * u) / 2);
  const trackW = isMobile ? MOBILE.TRACK : DESKTOP.TRACK;
  const viewW = W / u;
  const maxCam = Math.max(0, trackW - viewW);

  const poseOf = (p: Photo): Pose =>
    isMobile ? { ...p.m, x: p.cluster * MOBILE.W + p.m.x } : p.d;

  const currentPhoto = photos[idx] || photos[0];
  const activeCluster = currentPhoto?.cluster ?? 0;

  /* ---------- continuous page scroll -> real-time camera position ---------- */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - (window.innerHeight - navH);
      if (scrollable <= 0) return;

      const rawP = (navH - el.getBoundingClientRect().top) / scrollable;
      const p = Math.min(1, Math.max(0, rawP));

      const currentTrackW = isMobile ? MOBILE.TRACK : DESKTOP.TRACK;
      const currentViewW = W / u;
      const currentMaxCam = Math.max(0, currentTrackW - currentViewW);
      const cam = p * currentMaxCam;

      // Direct hardware-accelerated transform without React re-render churn
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-cam * u}px,0,0)`;
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${Math.min(100, Math.max(4, p * 100))}%`;
      }

      const newIdx = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
      if (newIdx !== idxRef.current) {
        idxRef.current = newIdx;
        setIdx(newIdx);
      }

      if (isMobile && mobileTextRef.current) {
        const cluster = photos[newIdx]?.cluster ?? Math.min(2, Math.floor(p * 3));
        mobileTextRef.current.style.transform = `translate3d(${-cluster * MOBILE.W * u}px,0,0)`;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [navH, n, isMobile, W, u, photos]);

  /* ---------- jump to a photo (thumbnail, chapter buttons, swipe, keys) ---------- */
  const goTo = useCallback(
    (i: number) => {
      const el = sectionRef.current;
      if (!el) return;
      const t = Math.min(n - 1, Math.max(0, i));
      const scrollable = el.offsetHeight - (window.innerHeight - navH);
      const targetTop =
        el.getBoundingClientRect().top + window.scrollY - navH + (scrollable * t) / (n - 1);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    },
    [navH, n]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragRef.current;
    dragRef.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      goTo(idx + (dx < 0 ? 1 : -1));
    }
  };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) < 20 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    const now = performance.now();
    if (now - wheelLock.current < 400) return;
    wheelLock.current = now;
    goTo(idx + (e.deltaX > 0 ? 1 : -1));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(idx + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(idx - 1); }
  };

  /* ---------- filmstrip maths ---------- */
  const THUMB_H = 28;
  const THUMB_H_ACTIVE = 46;
  const GAP = 8;
  let acc = 0;
  let stripCenter = 0;
  photos.forEach((p, i) => {
    const h = i === idx ? THUMB_H_ACTIVE : THUMB_H;
    const w = h * p.ar;
    if (i === idx) stripCenter = acc + w / 2;
    acc += w + GAP;
  });

  const renderText = (t: TextBlock, width: number, fs: number) => (
    <div style={{ width: width * u }}>
      <p className="font-serif" style={{ fontSize: fs * u, lineHeight: 1.32, margin: 0 }}>
        <span className="block font-medium" style={{ color: INK }}>{t.lead}</span>
        <span style={{ color: MUTED }}>{t.body}</span>
      </p>
      {t.cta && (
        <div
          className="flex flex-wrap gap-x-5 gap-y-2"
          style={{ marginTop: 22 * u, fontSize: Math.max(11, 11 * u) }}
        >
          <Link
            href="/about"
            className="font-sans uppercase font-semibold tracking-[0.18em] pb-1 border-b transition-colors hover:text-[#B8893A] hover:border-[#B8893A]"
            style={{ color: INK, borderColor: "rgba(43,41,39,.4)" }}
          >
            Read Osemene’s Story →
          </Link>
          <Link
            href="/portfolio"
            className="font-sans uppercase font-semibold tracking-[0.18em] pb-1 border-b transition-colors hover:opacity-80"
            style={{ color: GOLD, borderColor: "rgba(184,137,58,.5)" }}
          >
            View The Archive →
          </Link>
        </div>
      )}
    </div>
  );

  const photoCards = photos.map((p) => {
    const ps = poseOf(p);
    return (
      <div
        key={p.src}
        className="absolute"
        style={{
          left: ps.x * u,
          top: ps.y * u,
          width: (ps.w + PAD * 2) * u,
          padding: PAD * u,
          background: "#fff",
          borderRadius: 12 * u,
          transform: `rotate(${ps.rot}deg)`,
          zIndex: p.z,
          boxShadow: `0 ${14 * u}px ${34 * u}px -${10 * u}px rgba(30,25,20,.30), 0 ${2 * u}px ${6 * u}px rgba(30,25,20,.08)`,
        }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: p.ar,
            borderRadius: 7 * u,
            overflow: "hidden",
            background: "#EAE5DC",
          }}
        >
          <img
            src={p.src}
            alt={`${p.title} — ${p.sub}`}
            draggable={false}
            decoding="async"
            loading="eager"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith(".webp")) {
                target.src = target.src.replace(".webp", ".jpg");
              }
            }}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              aspectRatio: p.ar,
              objectFit: "cover",
              borderRadius: 7 * u,
              userSelect: "none",
            }}
          />
        </div>
      </div>
    );
  });

  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="The philosophy: an editorial gallery of photographs"
      className="relative w-full outline-none"
      style={{
        background: BG,
        height: `calc(${(n - 1) * SCROLL_VH_PER_STEP}svh + 100svh - ${navH}px)`,
      }}
    >
      <style>{`
        @keyframes lsCap {
          from { opacity: 0; transform: translate3d(0, 6px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
      `}</style>

      <div
        className="sticky flex flex-col overflow-hidden"
        style={{ top: navH, height: `calc(100svh - ${navH}px)` }}
      >
        {/* ---------------- top editorial chapter & horizontal progress bar ---------------- */}
        <div className="shrink-0 w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between border-b border-[#EAE5DC]/80 bg-[#F5F3EF]/95 backdrop-blur-sm z-20 reveal-down">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {CHAPTERS.map((chap) => {
              const isActive = activeCluster === chap.index;
              return (
                <button
                  key={chap.index}
                  type="button"
                  onClick={() => goTo(chap.photoIdx)}
                  className={`px-2.5 sm:px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-sans tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#2B2927] text-[#F5F3EF] font-bold shadow-xs"
                      : "text-[#7A746C] hover:text-[#2B2927] hover:bg-[#EAE5DC]"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className="hidden sm:inline mr-1 opacity-70">{chap.kicker}:</span>
                  <span>{chap.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#7A746C]">
              <span>Scroll</span>
              <span className="text-[#B8893A] font-bold animate-pulse">↔</span>
              <span>to pan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[11px] font-semibold text-[#2B2927] tabular-nums">
                0{idx + 1}
              </span>
              <div className="w-14 sm:w-20 h-1 bg-[#E2DCCE] rounded-full overflow-hidden">
                <div
                  ref={progressBarRef}
                  className="h-full bg-[#B8893A] transition-all duration-150 origin-left"
                  style={{ width: `${Math.min(100, Math.max(4, ((idx + 1) / n) * 100))}%` }}
                />
              </div>
              <span className="font-sans text-[11px] text-[#8B857D] tabular-nums">
                0{n}
              </span>
            </div>
          </div>
        </div>

        {/* ---------------- stage ---------------- */}
        <div
          ref={stageRef}
          className="relative flex-1 min-h-0 w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragRef.current = null)}
          onWheel={onWheel}
        >
          {/* mobile: text band, panned by cluster */}
          {isMobile && (
            <div
              ref={mobileTextRef}
              className="absolute left-0"
              style={{
                top,
                width: trackW * u,
                height: MOBILE.TEXT_H * u,
                transform: `translate3d(${-activeCluster * MOBILE.W * u}px,0,0)`,
                transition: reduceMotion ? "none" : "transform 350ms cubic-bezier(.22,1,.36,1)",
                willChange: "transform",
              }}
            >
              {TEXTS.map((t, k) => (
                <div
                  key={t.lead}
                  className="absolute"
                  style={{ left: (k * MOBILE.W + 20) * u, top: 28 * u }}
                  aria-hidden={k !== activeCluster}
                >
                  {renderText(t, MOBILE.W - 40, 23)}
                </div>
              ))}
            </div>
          )}

          {/* photo strip: continuous hardware-accelerated pan with zero input lag */}
          <div
            ref={trackRef}
            className="absolute left-0"
            style={{
              top: isMobile ? top + MOBILE.TEXT_H * u : top,
              width: trackW * u,
              height: (isMobile ? MOBILE.PHOTO_H : DESKTOP.H) * u,
              transform: "translate3d(0,0,0)",
              willChange: "transform",
            }}
          >
            {photoCards}

            {!isMobile &&
              NOTES.map((nt) => (
                <div
                  key={nt.text}
                  className="absolute pointer-events-none"
                  style={{
                    left: nt.x * u,
                    top: nt.y * u,
                    fontFamily: HAND,
                    fontSize: 17 * u,
                    color: "#2B2927",
                    lineHeight: 1.1,
                  }}
                >
                  {nt.arrow === "up" && <Arrow dir="up" s={u} />}
                  <span className="block whitespace-nowrap">{nt.text}</span>
                  {nt.arrow === "down" && <Arrow dir="down" s={u} />}
                </div>
              ))}

            {!isMobile &&
              TEXTS.map((t) => (
                <div
                  key={t.lead}
                  className="absolute flex items-center"
                  style={{ left: t.x * u, top: 0, height: DESKTOP.H * u }}
                >
                  {renderText(t, 300, 25)}
                </div>
              ))}
          </div>
        </div>

        {/* ---------------- caption + filmstrip ---------------- */}
        <div className="shrink-0 flex flex-col items-center pt-2 pb-3 sm:pb-4 border-t border-[#EAE5DC]/60 bg-[#F5F3EF] reveal-up">
          {currentPhoto ? (
            <div
              key={idx}
              className="text-center"
              style={{ animation: reduceMotion ? "none" : "lsCap 300ms cubic-bezier(.22,1,.36,1) both" }}
            >
              <p className="font-serif text-[14px] sm:text-[15px] font-medium leading-tight" style={{ color: INK }}>
                {currentPhoto.title}
              </p>
              <p className="font-serif italic text-[12px] sm:text-[13px] leading-tight mt-0.5" style={{ color: "#8B857D" }}>
                {currentPhoto.sub}
              </p>
            </div>
          ) : (
            <div className="h-8 flex items-center justify-center animate-pulse">
              <div className="w-32 h-4 bg-[#E2DCCE] rounded" />
            </div>
          )}

          <div className="w-px h-2 my-1" style={{ background: "#BDB6AB" }} />

          <div
            className="relative w-full max-w-[560px] overflow-hidden"
            style={{
              height: THUMB_H_ACTIVE + 6,
              WebkitMaskImage: "linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)",
              maskImage: "linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)",
            }}
          >
            {photos.length > 0 && (
              <div
                className="absolute left-1/2 top-0 bottom-0 flex items-center"
                style={{
                  gap: GAP,
                  transform: `translateX(${-stripCenter}px)`,
                  transition: reduceMotion ? "none" : `transform 400ms ${PAN_EASE}`,
                }}
              >
                {photos.map((p, i) => {
                  const active = i === idx;
                  const h = active ? THUMB_H_ACTIVE : THUMB_H;
                  return (
                    <button
                      key={p.src}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`${p.title}, ${p.sub}`}
                      aria-current={active}
                      className="flex-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#B8893A] cursor-pointer"
                      style={{
                        height: h,
                        width: h * p.ar,
                        borderRadius: 3,
                        border: active ? "2px solid #fff" : "0",
                        boxShadow: active
                          ? "0 4px 12px rgba(30,25,20,.25)"
                          : "0 1px 3px rgba(30,25,20,.15)",
                        opacity: active ? 1 : 0.82,
                        transition: reduceMotion
                          ? "none"
                          : `height 400ms ${PAN_EASE}, width 400ms ${PAN_EASE}, opacity 250ms`,
                      }}
                    >
                      <img
                        src={p.src}
                        alt=""
                        draggable={false}
                        className="h-full w-full object-cover block"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
