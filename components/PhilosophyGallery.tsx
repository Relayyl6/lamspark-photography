"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Measured from the reference clip (1132x676, 30 fps, 159 frames)    */
/*  - the whole scene is ONE horizontal strip; the camera pans on it   */
/*  - the pan is rigid: text and photos move by the same distance      */
/*  - the active photo is brought to about the centre of the screen,   */
/*    so far photos give long pans (485px) and neighbours short ones   */
/*  - fast start, long settle: ~0.35s core travel, tail to ~0.6s       */
/* ------------------------------------------------------------------ */

const BG = "#F5F3EF";
const INK = "#2B2927";
const MUTED = "#7A746C";
const GOLD = "#B8893A";

const PAD = 6; // white photo border, in design units
const PAN_MS = 700;
const PAN_EASE = "cubic-bezier(.22,1,.36,1)";
const SCROLL_VH_PER_STEP = 70; // how much page scroll each photo takes

// Design canvases. 1 design unit = 1px at these widths, scaled by `u`.
const DESKTOP = { W: 1132, H: 560, TRACK: 2790 };
const MOBILE = { W: 390, TEXT_H: 270, PHOTO_H: 340, TRACK: 1170 };

type Pose = { x: number; y: number; w: number; rot: number };

type Photo = {
  src: string;
  ar: number; // width / height of the picture. Adjust to match your files.
  title: string;
  sub: string;
  cluster: number;
  z: number;
  d: Pose; // desktop pose, absolute on the track
  m: Pose; // mobile pose, relative to its cluster
};

type TextBlock = { lead: string; body: string; x: number; cta?: boolean };
type Note = { text: string; x: number; y: number; arrow?: "up" | "down" };

// One text block per cluster. Reverted to exact canonical positions alternating with photo clusters
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
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(0);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: 560,
  });
  const [navH, setNavH] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Fetch live photos from Neon DB
  useEffect(() => {
    fetch("/api/content?key=philosophy_photos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.value) && data.value.length > 0) {
          setPhotos(data.value);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
  }, [loading, photos.length]);

  /* ---------- page scroll -> active photo (single source of truth) ---------- */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - (window.innerHeight - navH);
      if (scrollable <= 0) return;
      const p = (navH - el.getBoundingClientRect().top) / scrollable;
      setIdx(Math.min(n - 1, Math.max(0, Math.round(p * (n - 1)))));
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
  }, [navH, n]);

  /* ---------- jump to a photo (thumbnail, swipe, keys) ---------- */
  const goTo = useCallback(
    (i: number) => {
      const el = sectionRef.current;
      if (!el) return;
      const t = Math.min(n - 1, Math.max(0, i));
      const scrollable = el.offsetHeight - (window.innerHeight - navH);
      const top =
        el.getBoundingClientRect().top + window.scrollY - navH + (scrollable * t) / (n - 1);
      // Instant jump: the CSS transition below draws the pan, like the clip.
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
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
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goTo(idx + (dx < 0 ? 1 : -1));
    }
  };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) < 24 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    const now = performance.now();
    if (now - wheelLock.current < 650) return;
    wheelLock.current = now;
    goTo(idx + (e.deltaX > 0 ? 1 : -1));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(idx + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(idx - 1); }
  };

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

  const poseOf = (p: Photo): Pose =>
    isMobile ? { ...p.m, x: p.cluster * MOBILE.W + p.m.x } : p.d;

  // Bring the active photo to the centre, clamped to the strip.
  const currentPhoto = photos[idx] || photos[0];
  const a = currentPhoto ? poseOf(currentPhoto) : { x: 30, y: 235, w: 200, rot: -3 };
  const cx = a.x + (a.w + PAD * 2) / 2;
  const cam = Math.min(Math.max(0, trackW - viewW), Math.max(0, cx - viewW * 0.5));

  const pan = reduceMotion ? "none" : `transform ${PAN_MS}ms ${PAN_EASE}`;
  const activeCluster = currentPhoto?.cluster ?? 0;

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
        <span className="block" style={{ color: INK }}>{t.lead}</span>
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
        <img
          src={p.src}
          alt={`${p.title} — ${p.sub}`}
          draggable={false}
          decoding="async"
          style={{
            display: "block",
            width: "100%",
            aspectRatio: p.ar,
            objectFit: "cover",
            borderRadius: 7 * u,
            userSelect: "none",
          }}
        />
      </div>
    );
  });

  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="The philosophy: a gallery of photographs"
      className="relative w-full outline-none"
      style={{
        background: BG,
        height: `calc(${(n - 1) * SCROLL_VH_PER_STEP}svh + 100svh - ${navH}px)`,
      }}
    >
      <style>{`
        @keyframes lsCap {
          from { opacity: 0; transform: translate3d(0, 8px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
      `}</style>

      <div
        className="sticky flex flex-col overflow-hidden"
        style={{ top: navH, height: `calc(100svh - ${navH}px)` }}
      >
        {/* ---------------- stage ---------------- */}
        <div
          ref={stageRef}
          className="relative flex-1 min-h-0 w-full overflow-hidden select-none"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragRef.current = null)}
          onWheel={onWheel}
        >
          {loading || photos.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-pulse z-10">
              <div className="w-48 h-5 bg-[#E2DCCE] rounded mb-6" />
              <div className="flex items-center justify-center gap-6 w-full max-w-4xl overflow-hidden">
                <div className="w-48 sm:w-60 h-64 sm:h-72 bg-[#E2DCCE] rounded-lg shadow-sm -rotate-3" />
                <div className="w-56 sm:w-68 h-72 sm:h-84 bg-[#DBD4C4] rounded-lg shadow-md z-10" />
                <div className="w-48 sm:w-60 h-64 sm:h-72 bg-[#E2DCCE] rounded-lg shadow-sm rotate-3" />
              </div>
            </div>
          ) : (
            <>
              {/* mobile: text band, panned by cluster */}
              {isMobile && (
                <div
                  className="absolute left-0"
                  style={{
                    top,
                    width: trackW * u,
                    height: MOBILE.TEXT_H * u,
                    transform: `translate3d(${-activeCluster * MOBILE.W * u}px,0,0)`,
                    transition: pan,
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

              {/* photo strip: everything on it pans rigidly together */}
              <div
                className="absolute left-0"
                style={{
                  top: isMobile ? top + MOBILE.TEXT_H * u : top,
                  width: trackW * u,
                  height: (isMobile ? MOBILE.PHOTO_H : DESKTOP.H) * u,
                  transform: `translate3d(${-cam * u}px,0,0)`,
                  transition: pan,
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
            </>
          )}
        </div>

        {/* ---------------- caption + filmstrip ---------------- */}
        <div className="shrink-0 flex flex-col items-center pt-2 pb-4 sm:pb-5">
          {currentPhoto ? (
            <div
              key={idx}
              className="text-center"
              style={{ animation: reduceMotion ? "none" : "lsCap 420ms cubic-bezier(.22,1,.36,1) both" }}
            >
              <p className="font-serif text-[15px] leading-tight" style={{ color: INK }}>
                {currentPhoto.title}
              </p>
              <p className="font-serif italic text-[14px] leading-tight mt-0.5" style={{ color: "#8B857D" }}>
                {currentPhoto.sub}
              </p>
            </div>
          ) : (
            <div className="h-9 flex items-center justify-center animate-pulse">
              <div className="w-32 h-4 bg-[#E2DCCE] rounded" />
            </div>
          )}

          <div className="w-px h-2.5 my-1.5" style={{ background: "#BDB6AB" }} />

          <div
            className="relative w-full max-w-[560px] overflow-hidden"
            style={{
              height: THUMB_H_ACTIVE + 10,
              WebkitMaskImage: "linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)",
              maskImage: "linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)",
            }}
          >
            {photos.length > 0 ? (
              <div
                className="absolute left-1/2 top-0 bottom-0 flex items-center"
                style={{
                  gap: GAP,
                  transform: `translateX(${-stripCenter}px)`,
                  transition: reduceMotion ? "none" : `transform 520ms ${PAN_EASE}`,
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
                      className="flex-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#B8893A]"
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
                          : `height 520ms ${PAN_EASE}, width 520ms ${PAN_EASE}, opacity 300ms`,
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
            ) : (
              <div className="flex items-center justify-center gap-2 h-full animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7].map((k) => (
                  <div key={k} className="w-8 h-7 bg-[#E2DCCE] rounded" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}