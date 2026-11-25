"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Maximize2,
  SlidersHorizontal,
  Database,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { GalleryLightbox, GalleryImage } from "@/components/GalleryLightbox";

interface NeonGalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  sessionType: string;
  eventTypeName?: string;
  eventTypeBadgeColor?: string;
  category: string;
  slug: string;
}

interface NeonGallery {
  id: string;
  slug: string;
  title: string;
  description: string;
  sessionType: string;
  eventTypeName?: string;
  eventTypeBadgeColor?: string;
  displayOrder: number;
  coverAssetId: string | null;
  items: NeonGalleryItem[];
}

function PortfolioCardImage({
  src,
  alt,
  isMobileActive,
  priority = false,
}: {
  src: string;
  alt: string;
  isMobileActive: boolean;
  priority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedSrc = useMemo(() => {
    if (!src) return src;
    if (src.startsWith("/images/client/") && /\.(jpe?g)$/i.test(src)) {
      return src.replace(/\.(jpe?g)$/i, ".webp");
    }
    return src;
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      return;
    }

    const onNativeLoad = () => {
      if (img.naturalWidth > 0) {
        setIsLoaded(true);
      }
    };
    const onNativeError = () => {
      setIsLoaded(true);
    };

    img.addEventListener("load", onNativeLoad);
    img.addEventListener("error", onNativeError);

    const interval = setInterval(() => {
      if (img.complete && img.naturalWidth > 0) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    const maxTimer = setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) {
        setIsLoaded(true);
      }
      clearInterval(interval);
    }, 8000);

    return () => {
      img.removeEventListener("load", onNativeLoad);
      img.removeEventListener("error", onNativeError);
      clearInterval(interval);
      clearTimeout(maxTimer);
    };
  }, [optimizedSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#EDE7DD]">
      <div
        className={`absolute inset-0 bg-[#EDE7DD] transition-opacity duration-700 ease-out pointer-events-none z-0 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="w-full h-full bg-gradient-to-tr from-[#E5DEC9]/50 via-[#EDE7DD] to-[#FAF7F2] animate-pulse" />
      </div>

      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          setIsLoaded(true);
          const target = e.currentTarget;
          if (target.src.endsWith(".webp")) {
            target.src = target.src.replace(/\.webp$/, ".jpg");
          }
        }}
        className={`relative z-[1] w-full h-full object-cover transition-all duration-700 ease-out ${
          isMobileActive ? "scale-105" : "group-hover:scale-105"
        } ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export default function PortfolioPage() {
  const [galleries, setGalleries] = useState<NeonGallery[]>([]);
  const [allItems, setAllItems] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiveFromDb, setIsLiveFromDb] = useState<boolean>(false);

  // Close mobile active card when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent | TouchEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-portfolio-card]")) {
        setActiveCardId(null);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        setLoading(true);
        const res = await fetch("/api/portfolio");
        const data = await res.json();
        if (data.success && Array.isArray(data.galleries)) {
          setGalleries(data.galleries);
          setIsLiveFromDb(data.source === "neon_database");

          // Flatten gallery items into uniform GalleryImage format
          const flattened: GalleryImage[] = [];
          data.galleries.forEach((gal: NeonGallery) => {
            gal.items.forEach((item: NeonGalleryItem) => {
              flattened.push({
                id: item.id,
                src: item.src,
                alt: item.alt,
                category: gal.title,
                title: item.caption.split(" — ")[0] || gal.title,
                sessionSlug: gal.slug,
                eventTypeName: item.eventTypeName || gal.eventTypeName,
                eventTypeBadgeColor: item.eventTypeBadgeColor || gal.eventTypeBadgeColor,
              });
            });
          });
          setAllItems(flattened);
        }
      } catch (err) {
        console.error("Failed to load portfolio from database:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, []);

  // Distinct events list from database
  const categories = ["All", ...galleries.map((g) => g.title)];

  const filteredImages =
    selectedCategory === "All"
      ? allItems
      : allItems.filter((img) => img.category === selectedCategory);

  // Concise label helper for clean pill display across all 9 distinct events
  function getPillDisplayLabel(cat: string) {
    if (cat === "All") return "All Events";
    if (cat.includes("Jessica")) return "Jessica & Tunji";
    if (cat.includes("Woodhall")) return "Woodhall MOU";
    if (cat.includes("Studio Atelier")) return "Studio Atelier";
    if (cat.includes("EFKAS")) return "EFKAS 24'";
    if (cat.includes("Igninake")) return "Memorial Celebration";
    if (cat.includes("Koye")) return "Koye Launch";
    if (cat.includes("Bribena")) return "Milestones & Birthday";
    if (cat.includes("Galas") || cat.includes("Events Portfolio")) return "Grand Galas";
    if (cat.includes("Unions") || cat.includes("Weddings")) return "Sacred Unions";
    return cat;
  }

  return (
    <>
      <Nav />
      <main className="flex-1 bg-cream text-deep">
        {/* CURATED GALLERY SECTION */}
        <section
          id="gallery-section"
          className="pb-14 pt-6 sm:pb-20 sm:pt-10 lg:pt-12 lg:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Header & Filter Controls */}
          <div className="flex flex-col gap-5 mb-8 pb-6 border-b border-line reveal-down">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-bold">
                    Visual Archive
                  </span>
                  {isLiveFromDb && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/20 text-emerald-700 border border-emerald-500/30">
                      <Database className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Neon PostgreSQL Live</span>
                    </span>
                  )}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-deep font-normal tracking-tight">
                  Curated Works &amp; Events
                </h2>
                <p className="font-body text-xs sm:text-sm text-brown/85 mt-2 max-w-xl">
                  Explore fine art captures from our private Maitama studio, executive bilateral delegations, luxury weddings, and grand Nigerian galas.
                </p>
              </div>

              {/* Event Counter Badge */}
              <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-muted bg-warm-white border border-line px-3.5 py-1.5 rounded-full shrink-0">
                <span className="w-2 h-2 rounded-full bg-gold" />
                <span>{galleries.length} Distinct Events · {allItems.length} Photographs</span>
              </div>
            </div>

            {/* PRESENTABLE RESPONSIVE FILTER BAR: Horizontal swipe on mobile, clean pills on desktop */}
            <div className="relative pt-2">
              <div className="flex items-center justify-between sm:hidden mb-1 text-[11px] text-muted font-body">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-brown">
                  <SlidersHorizontal className="w-3 h-3 text-gold" />
                  <span>Filter by Event</span>
                </span>
                <span className="text-[10px] text-muted">Swipe ↔</span>
              </div>

              {/* Scrollable pill container on mobile without multiline wrapping */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted font-body mr-1 shrink-0">
                  <SlidersHorizontal className="w-3 h-3 text-gold" />
                  <span>Events:</span>
                </span>
                {categories.map((cat) => {
                  const count =
                    cat === "All"
                      ? allItems.length
                      : allItems.filter((img) => img.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  const displayLabel = getPillDisplayLabel(cat);

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveCardId(null);
                      }}
                      className={`font-body text-xs px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border transition-all duration-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${
                        isSelected
                          ? "bg-deep text-warm-white border-deep shadow-pill font-semibold"
                          : "bg-warm-white text-brown/85 border-line hover:border-gold hover:text-deep"
                      }`}
                      title={cat}
                    >
                      <span>{displayLabel}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected
                            ? "bg-warm-white/20 text-warm-white font-semibold"
                            : "bg-cream text-muted"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-photo-mobile sm:rounded-photo bg-warm-white/60 border border-line"
                />
              ))}
            </div>
          )}

          {/* RESPONSIVE GALLERY GRID: 2-Tap on Mobile, Hover on Desktop */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" data-stagger="true">
              {filteredImages.map((img, idx) => {
                const isMobileActive = activeCardId === img.id;

                return (
                  <div
                    key={img.id}
                    data-portfolio-card={img.id}
                    onClick={(e) => {
                      // Check touch capability
                      const isTouchDevice =
                        typeof window !== "undefined" &&
                        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

                      if (isTouchDevice) {
                        if (isMobileActive) {
                          // 2nd tap: opens full-screen lightbox preview!
                          setActiveImageIndex(idx);
                        } else {
                          // 1st tap: activate card and reveal overlay!
                          e.stopPropagation();
                          setActiveCardId(img.id);
                        }
                      } else {
                        // Desktop mouse pointer: click opens directly
                        setActiveImageIndex(idx);
                      }
                    }}
                    className={`reveal-up group relative aspect-[3/4] rounded-photo-mobile sm:rounded-photo overflow-hidden cursor-pointer bg-warm-white border transition-all duration-300 shadow-editorial hover:shadow-floating ${
                      isMobileActive ? "ring-2 ring-gold border-gold scale-[1.01]" : "border-line"
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveImageIndex(idx);
                      }
                    }}
                    aria-label={`Open full-screen view for ${img.title} (${img.category})`}
                  >
                    {/* Photo with smooth ivory dissolve */}
                    <PortfolioCardImage
                      src={img.src}
                      alt={img.alt}
                      isMobileActive={isMobileActive}
                      priority={idx < 4}
                    />

                    {/* Glassmorphic Overlay: Active on 1st tap (mobile) or hover (desktop) */}
                    <div
                      className={`absolute inset-0 z-[2] bg-gradient-to-t from-deep/95 via-deep/45 to-transparent backdrop-blur-[2px] transition-all duration-300 flex flex-col justify-between p-3 sm:p-5 text-warm-white ${
                        isMobileActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {/* Top Bar with Category & Inspect Icon */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="font-body text-[8px] sm:text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-deep/80 border backdrop-blur-sm truncate max-w-[130px] sm:max-w-none"
                          style={{
                            borderColor: `${img.eventTypeBadgeColor || "#B8893A"}50`,
                            color: img.eventTypeBadgeColor || "#B8893A",
                          }}
                        >
                          {img.eventTypeName || img.category}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(idx);
                          }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-warm-white hover:text-gold hover:border-gold transition-colors active:scale-95 shrink-0"
                          aria-label="Inspect full screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom Text & Full Screen Inspect Cue */}
                      <div className="space-y-1">
                        <h3 className="font-display text-xs sm:text-base font-medium leading-tight text-warm-white line-clamp-2">
                          {img.title}
                        </h3>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(idx);
                          }}
                          className="flex items-center gap-1 text-[9px] sm:text-xs text-gold/90 font-body font-semibold pt-0.5 hover:underline"
                        >
                          <span>{isMobileActive ? "Tap to view full screen" : "Inspect Photograph"}</span>
                          <ArrowUpRight className="w-3 h-3 text-gold shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State Fallback */}
          {!loading && filteredImages.length === 0 && (
            <div className="text-center py-20 px-4 bg-warm-white rounded-photo border border-line">
              <Camera className="w-12 h-12 text-muted mx-auto mb-4 stroke-[1.2]" />
              <h3 className="font-display text-2xl text-deep mb-2">
                No Photographs in this Event Archive Yet
              </h3>
              <p className="font-body text-sm text-muted max-w-md mx-auto mb-6">
                Our atelier is currently colour-grading new commissions from our Maitama studio for this event collection.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="font-body text-xs uppercase tracking-wider text-deep border border-line px-5 py-2.5 rounded-full hover:border-gold transition-colors font-semibold"
              >
                View All Events
              </button>
            </div>
          )}

          {/* Bottom Summary Bar */}
          <div className="reveal-up mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body text-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Showing <strong>{filteredImages.length}</strong> of{" "}
                <strong>{allItems.length}</strong> photographs across{" "}
                <strong>{galleries.length}</strong> events
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Maitama Studio &amp; Abuja Commissions</span>
              <span>·</span>
              <Link href="/contact" className="text-gold hover:underline font-semibold">
                Commission a Session →
              </Link>
            </div>
          </div>
        </section>

        {/* LIGHTBOX MODAL */}
        <GalleryLightbox
          images={filteredImages}
          initialIndex={activeImageIndex ?? 0}
          isOpen={activeImageIndex !== null}
          onClose={() => setActiveImageIndex(null)}
        />

        {/* BESPOKE COMMISSION BANNER */}
        <section className="bg-deep text-warm-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-gold/20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-bold block">
              Private Atelier Commissions
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-normal leading-tight">
              Begin Your Commission in Calm Elegance
            </h2>
            <p className="font-body text-sm sm:text-base text-warm-white/80 max-w-xl mx-auto leading-relaxed">
              Every commission begins with a gentle conversation about your desired feeling,
              styling palettes, and generational intentions.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sessions"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-deep font-body text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-full shadow-editorial transition-all"
              >
                <span>Explore Session Offerings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-warm-white/10 text-warm-white border border-warm-white/30 font-body text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-full transition-all"
              >
                <span>Request a Personal Estimate</span>
                <ArrowUpRight className="w-4 h-4 text-gold" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
