"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Check,
  MessageCircle,
  Layers,
  Sliders,
  ShieldCheck,
  Package,
  MapPin,
  Star,
  Clock,
} from "lucide-react";
import { LiquidLogo } from "@/components/LiquidLogo";

export function BentoCareSection() {
  // Card 1: Interactive Palette Swatch State
  const [selectedSwatch, setSelectedSwatch] = useState(0);
  const swatches = [
    { name: "Ivory Silk", hex: "#F4EFE6" },
    { name: "Terracotta Clay", hex: "#C57451" },
    { name: "Deep Olive", hex: "#444C38" },
    { name: "Atelier Gold", hex: "#C9A96E" },
  ];

  // Card 4: Interactive Retouching Texture Slider State (60 to 100)
  const [textureDepth, setTextureDepth] = useState(100);

  return (
    <section
      aria-label="Our Rhythm and Client Care Bento"
      className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Section Header with Frosted Glass Plate for High Legibility */}
      <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
        <div className="inline-block bg-warm-white/85 backdrop-blur-md rounded-2xl px-5 py-4 sm:px-8 sm:py-5 border border-gold/30 shadow-editorial">
          <span className="font-body text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-gold font-bold block mb-1">
            Our Rhythm · Abuja Atelier
          </span>
          <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl text-deep font-normal tracking-tight">
            How We Care for You
          </h2>
          <p className="font-body text-xs sm:text-sm text-brown/85 mt-1.5 leading-relaxed max-w-xl mx-auto">
            No rush, no rigid scripts. A completely guided, stress-free experience from your first personal estimate to the private gallery reveal.
          </p>
        </div>
      </div>

      {/* The 5-Card Luxury Bento Grid 
          - On Desktop (lg): 12-column grid. Row 1 has Card 1 (4 cols) & Card 2 (8 cols). Row 2 has Cards 3, 4, 5 (4 cols each).
          - On Mobile (< lg): 2-column grid. Card 2 spans 2 cols on top, followed by paired 1-col cards (Cards 1 & 3, Cards 4 & 5).
      */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 select-none">
        
        {/* ========================================================
            CARD 2 (Top Right on Desktop / Row 1 Full-Width on Mobile)
            The Unhurried Session Experience
            Desktop: lg:col-span-8 lg:order-2 | Mobile: col-span-2
        ======================================================== */}
        <div className="col-span-2 lg:col-span-8 lg:order-2 bg-gradient-to-br from-[#1C2C22] to-[#121E17] rounded-[22px] sm:rounded-[30px] p-5 sm:p-8 lg:p-9 border border-white/10 shadow-[0_16px_40px_-12px_rgba(18,30,23,0.3)] relative overflow-hidden flex flex-col md:flex-row justify-between items-center group min-h-[320px] sm:min-h-[360px] lg:min-h-[410px]">
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text Block */}
          <div className="z-10 max-w-md text-left mb-5 md:mb-0 w-full md:w-auto">
            {/* 5-Star Rating Badge */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3.5">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 stroke-none" />
                ))}
              </div>
              <span className="font-body text-[10px] sm:text-xs text-warm-white/80 font-medium tracking-wide">
                (5.0 Adoration · Abuja Families)
              </span>
            </div>

            <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-[0.24em] text-gold-light font-semibold block mb-0.5 sm:mb-1">
              Step 03 · The Heart of LamSparks
            </span>
            <h3 className="font-display text-xl sm:text-3xl lg:text-4xl text-warm-white font-normal leading-[1.1] mb-2 sm:mb-3">
              Moments given space to breathe.
            </h3>
            <p className="font-body text-[11px] sm:text-xs lg:text-sm text-warm-white/80 leading-relaxed max-w-sm">
              In our calm Maitama sanctuary or on location across Abuja. Ample time for changes, feeding, and quiet grace. We never rush a child.
            </p>

            <div className="mt-3.5 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[10px] sm:text-[11px] font-body text-warm-white/90">
                <MapPin className="w-3 h-3 text-gold-light" />
                Maitama & Asokoro
              </span>
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[10px] sm:text-[11px] font-body text-warm-white/90">
                <Clock className="w-3 h-3 text-gold-light" />
                Zero Rushed Posing
              </span>
            </div>
          </div>

          {/* Right Phone Mockup with Studio OS Preview */}
          <div className="z-10 relative w-full sm:w-auto flex justify-center md:justify-end">
            <div className="w-[200px] xs:w-[220px] sm:w-[250px] bg-[#0E1511] rounded-[24px] border-[4px] border-[#2E3E33] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.6)] p-3 relative overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500">
              {/* Speaker / Dynamic Island Pill */}
              <div className="w-16 h-3 bg-black rounded-full mx-auto mb-2.5" />

              {/* In-App Live Studio Preview Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-warm-white mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-body text-gold-light uppercase tracking-wider font-semibold">
                    Studio OS Live
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h5 className="font-display text-xs sm:text-sm font-medium">The Al-Hassan Portrait</h5>
                <p className="text-[9px] text-warm-white/70 font-body">Maitama Private Session</p>
              </div>

              {/* Photo Contact Sheet Strip */}
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <div className="h-14 sm:h-16 rounded-lg bg-emerald-950/80 border border-white/10 overflow-hidden relative">
                  <Image
                    src="https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=400&q=80"
                    alt="Atelier Portrait candid"
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
                <div className="h-14 sm:h-16 rounded-lg bg-emerald-950/80 border border-white/10 overflow-hidden relative">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                    alt="Atelier Portrait candid 2"
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              </div>

              {/* Status Pill Inside Phone */}
              <div className="bg-[#D8E28C] text-[#1A1410] rounded-lg py-1 px-2 text-center font-body text-[9px] sm:text-[10px] font-semibold tracking-wide">
                Unhurried Pace · 100% Guided
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            CARD 1 (Top Left on Desktop / Row 2 Left on Mobile)
            Unhurried Prep & Styling
            Desktop: lg:col-span-4 lg:order-1 | Mobile: col-span-1
        ======================================================== */}
        <div className="col-span-1 lg:col-span-4 lg:order-1 bg-[#F7F5F0] rounded-[22px] sm:rounded-[30px] p-3.5 sm:p-6 lg:p-7 border border-black/[0.06] shadow-[0_10px_30px_-12px_rgba(26,20,16,0.06)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_16px_36px_-12px_rgba(26,20,16,0.12)] transition-all duration-300 min-h-[290px] sm:min-h-[360px] lg:min-h-[410px]">
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

          {/* Floating Wardrobe & Prep Mockup Card */}
          <div className="w-full bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-black/[0.06] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.08)] mb-3 sm:mb-4 transition-transform group-hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5 sm:pb-2 mb-2 sm:mb-2.5">
              <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-wider text-muted font-medium truncate">
                Prep & Palette
              </span>
              <span className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Active
              </span>
            </div>

            {/* Interactive Palette Swatches */}
            <div className="mb-2 sm:mb-3">
              <div className="text-[9px] sm:text-[10px] text-brown/80 font-body mb-1 truncate">
                Palette: <strong className="text-deep font-medium">{swatches[selectedSwatch].name}</strong>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {swatches.map((swatch, idx) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setSelectedSwatch(idx)}
                    aria-label={`Select ${swatch.name} palette`}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all cursor-pointer ${
                      selectedSwatch === idx
                        ? "border-deep scale-110 shadow-sm"
                        : "border-transparent opacity-85 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-1 text-[8px] sm:text-[11px] font-body text-brown/90">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gold/25 flex items-center justify-center text-deep shrink-0">
                  <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                </div>
                <span className="truncate">Unhurried styling direction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gold/25 flex items-center justify-center text-deep shrink-0">
                  <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3]" />
                </div>
                <span className="truncate">Quiet rest protocol</span>
              </div>
            </div>
          </div>

          {/* Bottom Editorial Copy */}
          <div>
            <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-gold font-bold block mb-0.5 sm:mb-1">
              Step 02 · Guidance
            </span>
            <h3 className="font-display text-sm sm:text-xl lg:text-2xl text-deep font-normal leading-snug">
              Unhurried Prep & Styling
            </h3>
            <p className="font-body text-[10px] sm:text-xs text-brown/80 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Gentle styling guides, tailored palettes, and rest protocols sent before your session.
            </p>
          </div>
        </div>

        {/* ========================================================
            CARD 3 (Bottom Left on Desktop / Row 2 Right on Mobile)
            Bespoke Personal Estimate (AGENTS.md Compliant: No Fixed Price)
            Desktop: lg:col-span-4 lg:order-3 | Mobile: col-span-1
        ======================================================== */}
        <div className="col-span-1 lg:col-span-4 lg:order-3 bg-[#234230] rounded-[22px] sm:rounded-[30px] p-3.5 sm:p-6 lg:p-7 border border-white/10 shadow-[0_12px_36px_-12px_rgba(26,50,35,0.25)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_18px_40px_-12px_rgba(26,50,35,0.35)] transition-all duration-300 min-h-[290px] sm:min-h-[360px] lg:min-h-[390px]">
          {/* Floating Estimate Card */}
          <div className="w-full bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] mb-3 sm:mb-4 transition-transform group-hover:-translate-y-1 duration-300">
            <div className="flex items-center justify-between border-b border-line pb-1.5 sm:pb-2 mb-2">
              <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-wider text-muted font-medium truncate">
                Bespoke Curation
              </span>
              <Sparkles className="w-3 h-3 text-gold shrink-0" />
            </div>

            {/* Custom Itemised Estimate Badge */}
            <div className="my-1.5 sm:my-2 text-center py-1.5 sm:py-2 bg-cream/70 rounded-lg sm:rounded-xl border border-line/60">
              <span className="block font-display text-sm sm:text-lg text-deep font-semibold">
                Itemised Estimate
              </span>
              <span className="block font-body text-[8px] sm:text-[10px] text-muted">
                Transparent · Zero Hidden Costs
              </span>
            </div>

            {/* Dual Concierge Paths (Online + WhatsApp per AGENTS.md Rule 4) */}
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-1.5 pt-1">
              <Link
                href="/book"
                className="w-full py-1 sm:py-1.5 px-1.5 bg-deep text-warm-white rounded-md sm:rounded-lg text-center font-body text-[8px] sm:text-[10px] font-semibold hover:bg-brown transition-colors flex items-center justify-center gap-1"
              >
                <span>Calculate ↗</span>
              </Link>
              <a
                href="https://wa.me/2340000000000?text=Hello%20LamSparks%20Atelier,%20I%20would%20love%20a%20personal%20estimate"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1 sm:py-1.5 px-1.5 bg-emerald-600 text-white rounded-md sm:rounded-lg text-center font-body text-[8px] sm:text-[10px] font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-2.5 h-2.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Bottom Editorial Copy */}
          <div>
            <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-[#D8E28C] font-bold block mb-0.5 sm:mb-1">
              Step 01 · Investment
            </span>
            <h3 className="font-display text-sm sm:text-xl lg:text-2xl text-warm-white font-normal leading-snug">
              Bespoke Estimate
            </h3>
            <p className="font-body text-[10px] sm:text-xs text-warm-white/80 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Answer a few questions about your desired feeling and receive an itemised estimate in two minutes.
            </p>
          </div>
        </div>

        {/* ========================================================
            CARD 4 (Bottom Middle on Desktop / Row 3 Left on Mobile)
            Generational Melanin Toning (Master Retouching)
            Desktop: lg:col-span-4 lg:order-4 | Mobile: col-span-1
        ======================================================== */}
        <div className="col-span-1 lg:col-span-4 lg:order-4 bg-[#DCE59A] rounded-[22px] sm:rounded-[30px] p-3.5 sm:p-6 lg:p-7 border border-black/[0.06] shadow-[0_12px_36px_-12px_rgba(180,195,110,0.3)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_18px_40px_-12px_rgba(180,195,110,0.4)] transition-all duration-300 min-h-[290px] sm:min-h-[360px] lg:min-h-[390px]">
          {/* Floating Melanin Slider & Retouching Card */}
          <div className="w-full bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.12)] mb-3 sm:mb-4 transition-transform group-hover:-translate-y-1 duration-300 text-deep">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-1.5 sm:pb-2 mb-2">
              <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-wider text-muted font-medium truncate">
                Colour Grading
              </span>
              <Sliders className="w-3 h-3 text-deep shrink-0" />
            </div>

            {/* Melanin Undertone Chips */}
            <div className="flex items-center justify-between mb-2 sm:mb-2.5 px-0.5">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#5C3826] border border-black/10 inline-block" />
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#825237] border border-black/10 inline-block" />
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#B27C52] border border-black/10 inline-block" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-body text-muted font-medium truncate">
                True Melanin
              </span>
            </div>

            {/* Interactive Texture Fidelity Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] sm:text-[10px] font-body">
                <span className="text-brown">Skin Texture</span>
                <span className="font-bold text-deep">{textureDepth}% Depth</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                value={textureDepth}
                onChange={(e) => setTextureDepth(Number(e.target.value))}
                className="w-full accent-[#234230] h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Zero Plastic Smoothing Guarantee */}
            <div className="mt-2 text-center py-0.5 sm:py-1 bg-emerald-50 rounded-md sm:rounded-lg border border-emerald-200/50">
              <span className="text-[8px] sm:text-[9px] font-body font-semibold text-emerald-900 tracking-wide uppercase">
                Zero Plastic Smoothing
              </span>
            </div>
          </div>

          {/* Bottom Editorial Copy */}
          <div>
            <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-[#234230] font-bold block mb-0.5 sm:mb-1">
              Step 04 · Retouching
            </span>
            <h3 className="font-display text-sm sm:text-xl lg:text-2xl text-deep font-normal leading-snug">
              Melanin Toning
            </h3>
            <p className="font-body text-[10px] sm:text-xs text-brown/90 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Graded specifically for rich, natural melanin skin tones with delicate hand-drawn lighting.
            </p>
          </div>
        </div>

        {/* ========================================================
            CARD 5 (Bottom Right on Desktop / Row 3 Right on Mobile)
            Archival Delivery & Private Reveal
            Desktop: lg:col-span-4 lg:order-5 | Mobile: col-span-1
        ======================================================== */}
        <div className="col-span-1 lg:col-span-4 lg:order-5 bg-[#FBF9F5] rounded-[22px] sm:rounded-[30px] p-3.5 sm:p-6 lg:p-7 border border-black/[0.05] shadow-[0_10px_30px_-12px_rgba(26,20,16,0.06)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_16px_36px_-12px_rgba(26,20,16,0.12)] transition-all duration-300 min-h-[290px] sm:min-h-[360px] lg:min-h-[390px]">
          {/* Cascading Tactile Delivery Cards */}
          <div className="w-full space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 transition-transform group-hover:-translate-y-1 duration-300">
            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-black/[0.06] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold-hover shrink-0">
                  <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-[9px] sm:text-[11px] font-body text-deep font-medium truncate">
                  Handcrafted Linen Box
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-body text-muted uppercase tracking-wider shrink-0">
                Archival
              </span>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-black/[0.06] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                  <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-[9px] sm:text-[11px] font-body text-deep font-medium truncate">
                  Museum Canvas
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-body text-muted uppercase tracking-wider shrink-0">
                Fine Art
              </span>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-black/[0.06] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1A1410] flex items-center justify-center text-warm-white shrink-0">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold-light" />
                </div>
                <span className="text-[9px] sm:text-[11px] font-body text-deep font-medium truncate">
                  Private Online Reveal
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-body text-muted uppercase tracking-wider shrink-0">
                4K Vault
              </span>
            </div>
          </div>

          {/* Bottom Editorial Copy */}
          <div>
            <span className="font-body text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-gold font-bold block mb-0.5 sm:mb-1">
              Step 05 · Heirlooms
            </span>
            <h3 className="font-display text-sm sm:text-xl lg:text-2xl text-deep font-normal leading-snug">
              Archival Reveal
            </h3>
            <p className="font-body text-[10px] sm:text-xs text-brown/80 mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Private online gallery unveiled alongside handcrafted heirloom albums and white-glove Abuja delivery.
            </p>
          </div>
        </div>

      </div>

      {/* Archival Assurance Strip (Integrated under Bento) */}
      <div className="mt-5 sm:mt-7 bg-warm-white/85 backdrop-blur-md rounded-xl sm:rounded-2xl border border-gold/30 p-3.5 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h5 className="font-display text-xs sm:text-base text-deep font-medium">
              Museum-Grade Retouching & Generational Archival Craft
            </h5>
            <p className="font-body text-[10px] sm:text-xs text-brown/80 mt-0.5">
              Calibrated for rich, natural melanin skin tones with authentic texture and zero plastic smoothing.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2.5">
          <LiquidLogo size="sm" />
          <div className="text-left font-body">
            <span className="block text-[10px] sm:text-[11px] font-semibold text-deep uppercase tracking-wider">
              Archival Guarantee
            </span>
            <span className="block text-[9px] sm:text-[10px] text-muted">Abuja Private Atelier</span>
          </div>
        </div>
      </div>
    </section>
  );
}
