"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Camera,
  Sparkles,
  Maximize2,
  Instagram,
  Facebook,
  Twitter,
  SlidersHorizontal,
  Database,
  CheckCircle2,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { GalleryLightbox, GalleryImage } from "@/components/GalleryLightbox";

interface NeonGalleryItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  sessionType: string;
  category: string;
  slug: string;
}

interface NeonGallery {
  id: string;
  slug: string;
  title: string;
  description: string;
  sessionType: string;
  displayOrder: number;
  coverAssetId: string | null;
  items: NeonGalleryItem[];
}

export default function PortfolioPage() {
  const [galleries, setGalleries] = useState<NeonGallery[]>([]);
  const [allItems, setAllItems] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiveFromDb, setIsLiveFromDb] = useState<boolean>(false);

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

  const categories = ["All", ...galleries.map((g) => g.title)];

  const filteredImages =
    selectedCategory === "All"
      ? allItems
      : allItems.filter((img) => img.category === selectedCategory);

  function scrollToGallery() {
    const el = document.getElementById("gallery-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Nav />
      <main className="flex-1 bg-cream text-deep">
        {/* CURATED GALLERY SECTION */}
        <section
          id="gallery-section"
          className="pb-14 pt-7 sm:pb-20 sm:pt-10 lg:pt-12 lg:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-line">
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
                Curated Works
              </h2>
              <p className="font-body text-xs sm:text-sm text-brown/85 mt-2 max-w-lg">
                Explore fine art captures from our private Maitama studio, executive delegations, and sacred Nigerian celebrations.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted font-body mr-1">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              {categories.map((cat) => {
                const count =
                  cat === "All"
                    ? allItems.length
                    : allItems.filter((img) => img.category === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`font-body text-xs px-4 py-2 rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-deep text-warm-white border-deep shadow-pill font-semibold"
                        : "bg-warm-white text-brown/85 border-line hover:border-gold hover:text-deep"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? "bg-warm-white/20 text-warm-white"
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

          {/* RESPONSIVE GALLERY GRID: strictly grid-cols-2 on mobile */}
          {!loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredImages.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className="group relative aspect-[3/4] rounded-photo-mobile sm:rounded-photo overflow-hidden cursor-pointer bg-warm-white border border-line shadow-editorial transition-all duration-500 hover:shadow-floating"
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
                  {/* Photo */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Glassmorphic Hover Reveal Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/40 to-transparent backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3 sm:p-5 text-warm-white">
                    {/* Top Bar with Category & Inspect Icon */}
                    <div className="flex items-center justify-between">
                      <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-wider text-gold font-bold px-2 py-0.5 rounded-full bg-deep/60 border border-gold/30 backdrop-blur-sm">
                        {img.category}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-warm-white group-hover:text-gold transition-colors">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Bottom Text & Full Screen Inspect Cue */}
                    <div className="space-y-1">
                      <h3 className="font-display text-sm sm:text-lg font-medium leading-tight text-warm-white">
                        {img.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-warm-white/75 font-body">
                        <span>Inspect Photograph</span>
                        <ArrowUpRight className="w-3 h-3 text-gold" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State Fallback */}
          {!loading && filteredImages.length === 0 && (
            <div className="text-center py-20 px-4 bg-warm-white rounded-photo border border-line">
              <Camera className="w-12 h-12 text-muted mx-auto mb-4 stroke-[1.2]" />
              <h3 className="font-display text-2xl text-deep mb-2">
                No Photographs in this Category Yet
              </h3>
              <p className="font-body text-sm text-muted max-w-md mx-auto mb-6">
                Our atelier is constantly curating and colour-grading new commissions from our Maitama studio.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="font-body text-xs uppercase tracking-wider text-deep border border-line px-5 py-2.5 rounded-full hover:border-gold transition-colors font-semibold"
              >
                View All Categories
              </button>
            </div>
          )}

          {/* Bottom Summary Bar */}
          <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body text-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Showing <strong>{filteredImages.length}</strong> of{" "}
                <strong>{allItems.length}</strong> archived client photographs
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
      <Footer />
    </>
  );
}
