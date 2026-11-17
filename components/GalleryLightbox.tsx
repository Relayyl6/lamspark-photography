"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
  title: string;
  sessionSlug?: string;
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

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];

  function handleNext() {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }

  function handlePrev() {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-deep/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between text-warm-white">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl text-warm-white font-medium">
            {current.title}
          </span>
          <span className="font-body text-xs text-gold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-gold/40">
            {current.category}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-body text-xs text-warm-white/60">
            {currentIndex + 1} of {images.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 text-warm-white hover:text-gold transition-colors rounded-full border border-warm-white/20"
            aria-label="Close full-screen image viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-deep/60 text-warm-white hover:text-gold hover:bg-deep transition-all"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="relative max-h-full max-w-5xl flex items-center justify-center">
          <img
            src={current.src}
            alt={current.alt}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-deep/60 text-warm-white hover:text-gold hover:bg-deep transition-all"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Footer Info & Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-warm-white/10 text-warm-white">
        <p className="font-body text-xs sm:text-sm text-warm-white/70 max-w-lg text-center sm:text-left">
          {current.alt}
        </p>
        <Link
          href={`/book?session=${current.sessionSlug || "toddler"}`}
          onClick={onClose}
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-hover text-deep font-body text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-full transition-all"
        >
          <span>Book this style</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        </Link>
      </div>
    </div>
  );
}
