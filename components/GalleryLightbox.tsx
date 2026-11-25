"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  title: string;
  sessionSlug?: string;
  eventTypeName?: string;
  eventTypeBadgeColor?: string;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function GalleryLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Lock body scroll while lightbox is active
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0 || !mounted) return null;

  const current = images[currentIndex] || images[0];

  function handleNext() {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }

  function handlePrev() {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  // Touch swipe handling for mobile
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only swipe if horizontal distance is significantly greater than vertical
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-[#0E0C0A]/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 lg:p-8 animate-in fade-in duration-200 select-none cursor-pointer"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* HEADER BAR: Bespoke Responsive 2-Tier on Mobile, 1-Tier on Desktop */}
      <div
        className="w-full shrink-0 border-b border-warm-white/10 pb-2.5 sm:pb-3 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MOBILE HEADER (< 640px) */}
        <div className="sm:hidden flex flex-col gap-1.5">
          {/* Top Line: Badge + Counter + Close Button */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="font-body text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border truncate max-w-[210px] font-semibold"
              style={{
                borderColor: `${current.eventTypeBadgeColor || "#B8893A"}60`,
                color: current.eventTypeBadgeColor || "#B8893A",
                backgroundColor: `${current.eventTypeBadgeColor || "#B8893A"}18`,
              }}
            >
              {current.eventTypeName || current.category}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[11px] text-warm-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                {currentIndex + 1} / {images.length}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-warm-white hover:text-gold transition-colors rounded-full border border-warm-white/20 bg-white/5 active:scale-95"
                aria-label="Close full-screen image viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Bottom Line: Photograph Title */}
          <h3 className="font-display text-base font-medium text-warm-white tracking-wide truncate">
            {current.title}
          </h3>
        </div>

        {/* DESKTOP HEADER (>= 640px) */}
        <div className="hidden sm:flex items-center justify-between text-warm-white">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="font-display text-xl text-warm-white font-medium truncate max-w-md">
              {current.title}
            </h3>
            <span
              className="font-body text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-full border shrink-0 font-semibold"
              style={{
                borderColor: `${current.eventTypeBadgeColor || "#B8893A"}60`,
                color: current.eventTypeBadgeColor || "#B8893A",
                backgroundColor: `${current.eventTypeBadgeColor || "#B8893A"}18`,
              }}
            >
              {current.eventTypeName || current.category}
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="font-mono text-xs text-warm-white/60">
              {currentIndex + 1} of {images.length}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-warm-white hover:text-gold transition-colors rounded-full border border-warm-white/20 bg-white/5 hover:bg-white/10 active:scale-95"
              aria-label="Close full-screen image viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN IMAGE STAGE: Clicking outside the image closes the lightbox */}
      <div
        className="relative flex-1 flex items-center justify-center min-h-0 py-2 sm:py-4 overflow-hidden cursor-pointer"
        onClick={onClose}
      >
        {/* Previous Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-1 sm:left-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-deep/80 backdrop-blur-md border border-white/20 text-warm-white hover:text-gold hover:border-gold hover:bg-deep flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Main Photograph: Clicking directly on the image does NOT close */}
        <div
          className="relative max-h-full max-w-5xl w-full h-full flex items-center justify-center cursor-pointer"
          onClick={onClose}
        >
          <img
            key={current.id || current.src}
            src={current.src}
            alt={current.alt || current.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[70vh] sm:max-h-[76vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 cursor-default"
          />
        </div>

        {/* Next Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-1 sm:right-4 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-deep/80 backdrop-blur-md border border-white/20 text-warm-white hover:text-gold hover:border-gold hover:bg-deep flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* FOOTER BAR: Clean caption & CTA */}
      <div
        className="w-full shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 sm:pt-3 border-t border-warm-white/10 text-warm-white cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-body text-xs text-warm-white/70 max-w-xl text-center sm:text-left line-clamp-1 sm:line-clamp-2">
          {current.alt || current.title}
        </p>
        <Link
          href={`/book?session=${current.sessionSlug || "toddler"}`}
          onClick={onClose}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-deep font-body text-xs uppercase tracking-wider font-bold px-5 py-2.5 rounded-xl sm:rounded-full transition-all shrink-0 shadow-pill active:scale-95 text-center cursor-pointer"
        >
          <span>Book This Style</span>
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </Link>
      </div>
    </div>,
    document.body
  );
}
