"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, MessageCircle } from "lucide-react";

interface CameraPerspective {
  id: string;
  name: string;
  lensSpec: string;
  description: string;
  tag: string;
}

export function EditorialCameraShowcaseCTA() {
  const [perspectives, setPerspectives] = useState<CameraPerspective[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cameraRef = useRef<HTMLDivElement>(null);

  // Fetch live camera perspectives from Neon DB
  useEffect(() => {
    fetch("/api/content?key=camera_perspectives")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.value) && data.value.length > 0) {
          setPerspectives(data.value);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = perspectives[activeIdx] || perspectives[0];

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + perspectives.length) % perspectives.length);
  }, [perspectives.length]);

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % perspectives.length);
  }, [perspectives.length]);

  // Subtle 3D perspective mouse tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cameraRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Dignified, subtle tilt (max ±3.5 degrees)
    setTilt({
      x: -(y / (rect.height / 2)) * 3.5,
      y: (x / (rect.width / 2)) * 3.5,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Tactile camera shutter flash feedback
  const triggerShutter = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);
  };

  return (
    <section
      aria-label="Call to Action & Camera Showcase"
      className="relative w-full overflow-hidden bg-[#525B56] text-[#F8F4EE] border-y border-white/10 select-none py-10 sm:py-16 lg:py-20"
    >
      {/* 4 Continuous Vertical Dashed Architectural Gridlines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Line 1: Left Inset */}
        <div className="absolute top-0 bottom-0 left-6 sm:left-12 lg:left-16 border-r border-dashed border-white/10" />
        {/* Line 2: Left Center (~33% across) */}
        <div className="hidden md:block absolute top-0 bottom-0 left-[33%] border-r border-dashed border-white/10" />
        {/* Line 3: Right Center (~67% across) */}
        <div className="hidden md:block absolute top-0 bottom-0 left-[67%] border-r border-dashed border-white/10" />
        {/* Line 4: Right Inset */}
        <div className="absolute top-0 bottom-0 right-6 sm:right-12 lg:right-16 border-r border-dashed border-white/10" />
      </div>

      {/* Top Editorial Typography Header */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-4 mb-8 sm:mb-12">
        <span className="font-body text-[10px] sm:text-xs uppercase tracking-[0.26em] text-gold-light/90 font-semibold block mb-3">
          Begin Your Journey · Abuja Studio & Location
        </span>
        <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl text-[#FDFBF8] font-normal tracking-tight leading-[1.08]">
          Ready to Capture<br />
          Your Best Shot?
        </h2>
      </div>

      {/* Center Stage: Symmetrical Flanking Arrows & Vintage Camera */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Perspective"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/80 hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 shadow-editorial shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
        </button>

        {/* Center Camera Unit with Interactive Shutter & Subtle 3D Tilt */}
        <div
          ref={cameraRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={triggerShutter}
          title="Click to trigger camera shutter"
          className="relative cursor-pointer transition-transform duration-200 ease-out py-2 flex items-center justify-center flex-1 max-w-[580px]"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${
              isHovered ? 1.025 : 1
            })`,
          }}
        >
          {/* Transparent Cutout Camera */}
          <div className="relative w-full max-w-[320px] sm:max-w-[460px] lg:max-w-[540px] aspect-[947/588]">
            <Image
              src="/images/cameras/vintage-canon-rangefinder.png"
              alt="Vintage Rangefinder Camera — LamSparks Photography"
              fill
              priority
              className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)] transition-all"
              sizes="(max-width: 640px) 320px, (max-width: 1024px) 460px, 540px"
            />

            {/* Specular Multi-Coated Lens Element Shimmer */}
            <div
              className={`absolute top-[48%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full pointer-events-none transition-opacity duration-300 ${
                isHovered ? "opacity-40" : "opacity-20"
              } bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_0%,rgba(140,210,255,0.25)_45%,transparent_70%)]`}
            />

            {/* Shutter Flash Flare Feedback */}
            {shutterFlash && (
              <div className="absolute inset-0 bg-white/95 rounded-2xl animate-fade-out pointer-events-none z-30 transition-opacity duration-200" />
            )}
          </div>

          {/* Grounding Diffused Shadow */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-black/45 blur-xl rounded-full pointer-events-none" />
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Perspective"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white/80 hover:text-white transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 shadow-editorial shrink-0"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
        </button>
      </div>

      {/* Camera Model Badge Indicator */}
      <div className="text-center mt-4 h-5 flex items-center justify-center">
        {loading || !current ? (
          <div className="w-48 h-3.5 bg-white/20 rounded animate-pulse" />
        ) : (
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-white/50">
            {current.lensSpec}
          </span>
        )}
      </div>

      {/* Bottom Editorial Bar: Subtext & Dual Action Hub */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 mt-10 sm:mt-14 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
        {/* Bottom Left Subtext */}
        <div className="text-center sm:text-left max-w-xs min-h-[3rem] flex items-center">
          {loading || !current ? (
            <div className="w-full space-y-2 animate-pulse">
              <div className="w-full h-3 bg-white/20 rounded" />
              <div className="w-4/5 h-3 bg-white/20 rounded" />
            </div>
          ) : (
            <p className="font-body text-xs sm:text-[13px] text-stone-300/80 leading-relaxed">
              {current.description}
            </p>
          )}
        </div>

        {/* Bottom Right Dual Action Hub: Online Estimate & Direct WhatsApp Concierge */}
        <div className="flex items-center gap-3">
          <Link
            href="/book"
            className="font-body text-xs uppercase tracking-wider font-semibold text-[#FDFBF8] hover:text-deep bg-white/10 hover:bg-gold border border-white/25 hover:border-gold px-5 py-2.5 rounded-full transition-all duration-300 shadow-editorial backdrop-blur-sm inline-flex items-center gap-2 group"
          >
            <span>{current?.tag || "[Calculate Your Estimate ↗]"}</span>
          </Link>

          {/* WhatsApp Direct Concierge Deep Link */}
          <a
            href="https://wa.me/2348130847299?text=Hello%20LamSparks,%20I%20would%20love%20to%20learn%20more%20about%20booking%20a%20session"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Speak with Osemene directly on WhatsApp"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center text-gold hover:text-gold-light transition-all backdrop-blur-sm group"
            title="Chat with Osemene on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
          </a>
        </div>
      </div>
    </section>
  );
}
