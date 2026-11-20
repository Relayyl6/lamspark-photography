"use client";

import React from "react";
import Link from "next/link";
import { Instagram, MessageCircle, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-warm-white/80 backdrop-blur-md text-deep pt-20 pb-0 overflow-hidden border-t border-line mt-auto">
      {/* Wave Animation Styles */}
      <style jsx>{`
        @keyframes waveRoll1 {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @keyframes waveRoll2 {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes waveRoll3 {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        @keyframes waveFloatVertical {
          0%, 100% {
            transform: translateY(0px) scaleY(1);
          }
          50% {
            transform: translateY(-8px) scaleY(1.06);
          }
        }
        @keyframes waveGlowPulse {
          0%, 100% {
            opacity: 0.75;
            filter: brightness(1) saturate(1.2);
          }
          50% {
            opacity: 0.95;
            filter: brightness(1.2) saturate(1.4);
          }
        }
        .animate-wave-1 {
          animation: waveRoll1 16s linear infinite;
        }
        .animate-wave-2 {
          animation: waveRoll2 22s linear infinite;
        }
        .animate-wave-3 {
          animation: waveRoll3 28s linear infinite;
        }
        .animate-wave-float {
          animation: waveFloatVertical 7s ease-in-out infinite;
        }
        .animate-wave-glow {
          animation: waveGlowPulse 5s ease-in-out infinite;
        }
      `}</style>

      {/* Top Section: Brand Info + 4 Link Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 sm:pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 sm:gap-10 lg:gap-12" data-stagger="true">
          {/* Brand Left Column */}
          <div className="reveal-up col-span-2 md:col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block group">
              <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-deep group-hover:text-gold transition-colors">
                LamSparks.
              </span>
              <span className="block font-body text-[10px] uppercase tracking-[0.24em] text-muted -mt-0.5">
                Photography · Abuja
              </span>
            </Link>

            <p className="font-body text-xs text-brown/85 leading-relaxed max-w-sm">
              Unhurried portraiture & landmark celebrations in Abuja, Nigeria.
            </p>

            {/* Social Media Pill Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-line bg-cream/70 flex items-center justify-center text-brown hover:text-gold hover:border-gold transition-colors shadow-sm"
                aria-label="X / Twitter"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com/lamsparksphotography"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-line bg-cream/70 flex items-center justify-center text-brown hover:text-gold hover:border-gold transition-colors shadow-sm"
                aria-label="Instagram @lamsparksphotography"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-line bg-cream/70 flex items-center justify-center text-brown hover:text-gold hover:border-gold transition-colors shadow-sm"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://wa.me/2348130847299"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-line bg-cream/70 flex items-center justify-center text-brown hover:text-gold hover:border-gold transition-colors shadow-sm"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 1: Sessions */}
          <div className="reveal-up col-span-1 md:col-span-1 lg:col-span-1">
            <h4 className="font-body text-xs uppercase tracking-[0.18em] text-deep font-bold mb-4">
              Sessions
            </h4>
            <ul className="space-y-2.5 font-body text-xs sm:text-[13px] text-brown/90">
              <li>
                <Link href="/sessions/toddler" className="hover:text-gold transition-colors">
                  Toddler & Children
                </Link>
              </li>
              <li>
                <Link href="/sessions/maternity" className="hover:text-gold transition-colors">
                  Maternity & Motherhood
                </Link>
              </li>
              <li>
                <Link href="/sessions/motherhood-bundle" className="hover:text-gold transition-colors">
                  Motherhood Bundle (-15%)
                </Link>
              </li>
              <li>
                <Link href="/weddings-and-events" className="hover:text-gold transition-colors">
                  Weddings & Events
                </Link>
              </li>
              <li>
                <Link href="/sessions/official-portrait" className="hover:text-gold transition-colors">
                  Portraits & Headshots
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Studio */}
          <div className="reveal-up col-span-1 md:col-span-1 lg:col-span-1">
            <h4 className="font-body text-xs uppercase tracking-[0.18em] text-deep font-bold mb-4">
              Studio
            </h4>
            <ul className="space-y-2.5 font-body text-xs sm:text-[13px] text-brown/90">
              <li>
                <Link href="/about" className="hover:text-gold transition-colors">
                  About Osemene
                </Link>
              </li>
              <li>
                <Link href="/stories" className="hover:text-gold transition-colors">
                  Session Stories
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="hover:text-gold transition-colors">
                  Curated Portfolio
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-gold transition-colors flex items-center gap-1.5 text-brown/90">
                  <span>Studio OS</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="reveal-up col-span-1 md:col-span-1 lg:col-span-1">
            <h4 className="font-body text-xs uppercase tracking-[0.18em] text-deep font-bold mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 font-body text-xs sm:text-[13px] text-brown/90">
              <li>
                <Link href="/faq" className="hover:text-gold transition-colors">
                  Session FAQ & Prep
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-gold transition-colors">
                  Request an Estimate
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold transition-colors">
                  Contact Concierge
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="reveal-up col-span-1 md:col-span-1 lg:col-span-1">
            <h4 className="font-body text-xs uppercase tracking-[0.18em] text-deep font-bold mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 font-body text-xs sm:text-[13px] text-brown/90">
              <li>
                <Link href="/legal/privacy" className="hover:text-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-gold transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/shoot-guidelines" className="hover:text-gold transition-colors">
                  Shoot Guidelines
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold transition-colors">
                  Maitama Studio Suite
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Middle & Lower Stage: Pure Handcrafted Animated Rolling Wave Landscape + Typographic Brand */}
      <div
        className="relative w-full overflow-hidden select-none pt-16 sm:pt-28 pb-8 sm:pb-12"
        style={{
          background: "linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 14%, #EADBCA 28%, #D4C1A8 42%, #9B7E62 58%, #573E2E 72%, #2B1D16 85%, #18100C 94%, #0D0907 100%)",
        }}
      >
        {/* Bespoke Horizon Twilight Glow & Seamless Feathered Blend (Zero Sharp Lines) */}
        <div className="absolute top-0 inset-x-0 h-44 pointer-events-none overflow-hidden z-10">
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/60 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-36 bg-gradient-to-b from-[#C9A96E]/20 via-[#C9A96E]/5 to-transparent blur-3xl" />
        </div>

        {/* Warm Atelier Ambient Glows (Warm Gold & Amber - Zero neon purple/pink) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-700/10 rounded-full blur-[110px] animate-wave-glow" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[120px] animate-wave-glow" style={{ animationDelay: "2.5s" }} />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-[#2E2016]/20 rounded-full blur-[120px]" />
        </div>

        {/* Back Wave Layer: Deep Velvety Obsidian Espresso (Behind text) */}
        <div
          className="absolute inset-x-0 bottom-0 h-72 sm:h-96 md:h-[460px] z-0 pointer-events-none overflow-hidden opacity-90"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, transparent 12%, rgba(0,0,0,0.15) 26%, rgba(0,0,0,0.6) 48%, black 75%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 12%, rgba(0,0,0,0.15) 26%, rgba(0,0,0,0.6) 48%, black 75%, black 100%)",
          }}
        >
          <div className="w-[200%] h-full animate-wave-3">
            <svg
              viewBox="0 0 2400 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full preserve-3d"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="ls-wave-deep" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2A1E17" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#1C140F" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#0E0A07" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d="M 0 120 C 200 80, 400 160, 600 130 C 800 100, 1000 160, 1200 120 C 1400 80, 1600 160, 1800 130 C 2000 100, 2200 160, 2400 120 L 2400 320 L 0 320 Z"
                fill="url(#ls-wave-deep)"
              />
            </svg>
          </div>
        </div>

        {/* Huge Bold Brand Wordmark: LamSparks. (Responsive scaling with zero cutoff on mobile) */}
        <div className="relative z-10 w-full text-center px-4 pointer-events-none pt-2 sm:pt-4 md:pt-8 overflow-hidden">
          <span className="font-sans font-black tracking-[-0.03em] sm:tracking-[-0.05em] md:tracking-[-0.07em] leading-[0.85] block text-[clamp(34px,11.2vw,240px)] text-warm-white/95 select-none whitespace-nowrap drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
            LamSparks.
          </span>
        </div>

        {/* Front Multi-Layer Rolling Wave Dunes (Cohesive Warm Bronze, Satin Gold & Deep Velvet Noir) */}
        <div
          className="absolute inset-x-0 bottom-0 h-64 sm:h-80 md:h-[400px] z-20 pointer-events-none overflow-hidden"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, transparent 10%, rgba(0,0,0,0.12) 24%, rgba(0,0,0,0.55) 45%, black 72%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 10%, rgba(0,0,0,0.12) 24%, rgba(0,0,0,0.55) 45%, black 72%, black 100%)",
          }}
        >
          {/* Layer 1: Warm Espresso & Tobacco Bronze Dune */}
          <div className="absolute inset-0 animate-wave-float">
            <div className="w-[200%] h-full animate-wave-2 opacity-90">
              <svg
                viewBox="0 0 2400 320"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ls-wave-bronze" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38291E" />
                    <stop offset="35%" stopColor="#4A3728" />
                    <stop offset="70%" stopColor="#5E4633" />
                    <stop offset="85%" stopColor="#4A3728" />
                    <stop offset="100%" stopColor="#38291E" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 150 C 150 190, 300 190, 450 120 C 600 50, 600 50, 750 80 C 900 110, 1050 110, 1200 150 C 1350 190, 1500 190, 1650 120 C 1800 50, 1800 50, 1950 80 C 2100 110, 2250 110, 2400 150 L 2400 320 L 0 320 Z"
                  fill="url(#ls-wave-bronze)"
                  fillOpacity="0.88"
                />
              </svg>
            </div>
          </div>

          {/* Layer 2: Satin Atelier Gold & Warm Amber Dune */}
          <div className="absolute inset-0 animate-wave-float" style={{ animationDelay: "-3s" }}>
            <div className="w-[200%] h-full animate-wave-1 opacity-90">
              <svg
                viewBox="0 0 2400 320"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ls-wave-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7A5A32" />
                    <stop offset="30%" stopColor="#A8814D" />
                    <stop offset="60%" stopColor="#C9A96E" />
                    <stop offset="85%" stopColor="#96703B" />
                    <stop offset="100%" stopColor="#7A5A32" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 130 C 150 100, 300 190, 450 160 C 600 130, 750 70, 900 100 C 1050 130, 1050 160, 1200 130 C 1350 100, 1500 190, 1650 160 C 1800 130, 1950 70, 2100 100 C 2250 130, 2250 160, 2400 130 L 2400 320 L 0 320 Z"
                  fill="url(#ls-wave-gold)"
                  fillOpacity="0.85"
                />
              </svg>
            </div>
          </div>

          {/* Layer 3: Smooth Deep Velvet Noir with Bronze Crest */}
          <div className="absolute inset-0 animate-wave-float" style={{ animationDelay: "-5s" }}>
            <div className="w-[200%] h-full animate-wave-3 opacity-95">
              <svg
                viewBox="0 0 2400 320"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ls-wave-noir" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1F1611" />
                    <stop offset="30%" stopColor="#2A1E17" />
                    <stop offset="60%" stopColor="#33241C" />
                    <stop offset="85%" stopColor="#251A14" />
                    <stop offset="100%" stopColor="#1F1611" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 170 C 150 150, 300 110, 450 125 C 600 140, 750 200, 900 185 C 1050 170, 1050 190, 1200 170 C 1350 150, 1500 110, 1650 125 C 1800 140, 1950 200, 2100 185 C 2250 170, 2250 190, 2400 170 L 2400 320 L 0 320 Z"
                  fill="url(#ls-wave-noir)"
                  fillOpacity="0.94"
                />
              </svg>
            </div>
          </div>

          {/* Soft Deep Velvet Bottom Overlay for Clean Contrast with Base Bar */}
          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[#100C09] via-[#100C09]/80 to-transparent pointer-events-none" />
        </div>

        {/* Base Copyright Bar */}
        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 mt-4 sm:mt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 font-body text-xs text-warm-white/70">
          <div className="text-center sm:text-left">
            © 2026 LamSparks Photography, Inc. All rights reserved.
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-warm-white/80 font-medium">
            <span>Made by Yemuel -</span>
            <a
              href="tel:09064982841"
              className="text-gold hover:underline hover:text-warm-white transition-colors font-mono"
            >
              09064982841
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
