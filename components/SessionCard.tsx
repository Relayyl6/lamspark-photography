"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SessionTypeMeta } from "@/lib/catalog/seed";

interface SessionCardProps {
  session: SessionTypeMeta;
  priority?: boolean;
}

function SessionCardImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
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

    const onNativeLoad = () => setIsLoaded(true);
    const onNativeError = () => setIsLoaded(true);

    img.addEventListener("load", onNativeLoad);
    img.addEventListener("error", onNativeError);

    const interval = setInterval(() => {
      if (img.complete && img.naturalWidth > 0) {
        setIsLoaded(true);
        clearInterval(interval);
      }
    }, 150);

    const safetyTimer = setTimeout(() => {
      setIsLoaded(true);
      clearInterval(interval);
    }, 1500);

    return () => {
      img.removeEventListener("load", onNativeLoad);
      img.removeEventListener("error", onNativeError);
      clearInterval(interval);
      clearTimeout(safetyTimer);
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
        className={`relative z-[1] w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export function SessionCard({ session, priority = false }: SessionCardProps) {
  return (
    <article className="reveal-up group relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#EDE7DD] shadow-[0_8px_32px_rgba(24,20,17,0.18)] hover:shadow-[0_16px_48px_rgba(24,20,17,0.30)] transition-all duration-500 cursor-pointer">
      <Link href={`/sessions/${session.slug}`} className="block">
        {/* Full-bleed Image with Smooth Ivory Dissolve */}
        <div className="relative aspect-[3/4] sm:aspect-[2/3] w-full overflow-hidden">
          <SessionCardImage
            src={session.heroImage}
            alt={`${session.title} - LamSparks Photography Abuja`}
            priority={priority}
          />

          {/* Gradient overlay — stronger at bottom for text legibility */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#0E0C0A]/95 via-[#0E0C0A]/30 to-transparent pointer-events-none" />

          {/* Category pill top-left */}
          <div className="absolute top-3 left-3 z-[3] pointer-events-none">
            <span className="font-body text-[9px] uppercase tracking-[0.2em] text-warm-white/90 font-semibold bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-full">
              {session.category === "studio" ? "Studio Session" : session.category === "events" ? "Event Coverage" : "Portrait"}
            </span>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-[3]">
            <span className="font-body text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-gold font-bold block mb-1">
              {session.category === "studio" ? "Abuja Studio" : "Milestone"}
            </span>
            <h3 className="font-display text-sm sm:text-base lg:text-lg text-warm-white font-medium leading-snug mb-3 group-hover:text-gold transition-colors duration-300">
              {session.title}
            </h3>

            {/* CTA row */}
            <div className="flex items-center gap-2">
              <span className="font-body text-[10px] sm:text-xs uppercase tracking-wider text-warm-white/70 font-semibold group-hover:text-warm-white transition-colors">
                Explore
              </span>
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/30 group-hover:border-gold group-hover:bg-gold flex items-center justify-center transition-all duration-300 shrink-0">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-warm-white/80 group-hover:text-deep transition-colors" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
