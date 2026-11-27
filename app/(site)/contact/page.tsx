"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Twitter,
} from "lucide-react";

interface ConciergeContent {
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  hours: string;
}

const DEFAULT_CONTENT: ConciergeContent = {
  phone: "+234 816 789 2044",
  email: "concierge@lamsparks.com",
  whatsapp: "+234 816 789 2044",
  address: "Maitama Suite · Abuja, Nigeria",
  hours: "Tue – Sat: 9:00 AM – 6:30 PM (WAT)",
};

export default function ContactPage() {
  const [content, setContent] = useState<ConciergeContent>(DEFAULT_CONTENT);

  // Hydrate live content from Neon DB if configured
  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.content) {
          const c = data.content;
          setContent((prev) => ({
            phone: c.concierge_phone_primary || prev.phone,
            email: c.concierge_email || prev.email,
            whatsapp: c.concierge_whatsapp || c.concierge_phone_primary || prev.whatsapp,
            address: c.studio_address || prev.address,
            hours: c.studio_hours || prev.hours,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const cleanWhatsappDigits = content.whatsapp.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsappDigits || "2348167892044"}?text=${encodeURIComponent(
    "Hello LamSparks Concierge, I would like to inquire regarding portrait reservations."
  )}`;

  const directNoteUrl = `mailto:${content.email}?subject=${encodeURIComponent(
    "Atelier Milestone Inquiry — LamSparks Concierge"
  )}&body=${encodeURIComponent(
    "Hello LamSparks Concierge,\n\nI would like to inquire about reserving a milestone portrait session.\n\nPreferred Month/Date:\nSession Type:\nGuest Count:\n\nThank you!"
  )}`;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-deep flex flex-col selection:bg-gold/25 selection:text-deep overflow-x-clip">
      {/* Editorial Navigation */}
      <Nav />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 sm:pt-28 pb-8 sm:pb-12 lg:pb-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: Editorial Contact Hero & Direct Action Pills */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* Header Block */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-body text-[11px] sm:text-xs uppercase tracking-[0.28em] text-gold font-bold">
                  ATELIER CONCIERGE · ABUJA STUDIO
                </span>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-muted font-body">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Desk Open · WAT</span>
                </div>
              </div>

              {/* Colossal Display Title */}
              <h1 className="font-headline text-6xl sm:text-7xl md:text-8xl lg:text-[clamp(76px,9.5vw,132px)] font-black uppercase tracking-tight text-deep leading-[0.88] select-none break-words">
                CONTACT US
              </h1>

              {/* Editorial Subtitle */}
              <p className="font-display italic text-lg sm:text-2xl text-deep/75 font-light leading-relaxed max-w-2xl pt-1">
                Every timeless portrait begins with an unhurried conversation. Tell us your milestone, and our concierge will curate your bespoke session.
              </p>
            </div>

            {/* Subtle Divider */}
            <div className="border-b border-deep/10 pt-1" />

            {/* Primary Action Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={directNoteUrl}
                className="px-5 py-3 rounded-full bg-deep text-warm-white hover:bg-gold hover:text-deep font-body text-xs font-bold tracking-wider uppercase transition-all duration-200 inline-flex items-center gap-2 shadow-sm"
              >
                <span>Send Direct Note</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <Link
                href="/book"
                className="px-5 py-3 rounded-full border border-deep/20 hover:border-gold hover:text-gold bg-white/70 font-body text-xs font-bold tracking-wider uppercase transition-all duration-200 inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>View Live Calendar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 font-body text-xs font-bold tracking-wider uppercase transition-all duration-200 inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#128C7E]" />
                <span>Instant WhatsApp</span>
              </a>
            </div>

            {/* Secondary Contact & Social Pills Below */}
            <div className="pt-4 space-y-3">
              <span className="font-body text-[10px] uppercase tracking-[0.22em] text-muted/80 font-bold block">
                Direct Channels & Atelier Details
              </span>

              <div className="flex flex-wrap gap-2.5">
                <a
                  href={`tel:${content.phone.replace(/\s+/g, "")}`}
                  className="px-3.5 py-2 rounded-xl bg-white/80 border border-deep/10 hover:border-gold text-deep font-body text-xs font-medium inline-flex items-center gap-2 transition-all hover:bg-white"
                >
                  <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>{content.phone}</span>
                </a>

                <a
                  href={`mailto:${content.email}`}
                  className="px-3.5 py-2 rounded-xl bg-white/80 border border-deep/10 hover:border-gold text-deep font-body text-xs font-medium inline-flex items-center gap-2 transition-all hover:bg-white"
                >
                  <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>{content.email}</span>
                </a>

                <div className="px-3.5 py-2 rounded-xl bg-white/80 border border-deep/10 text-deep font-body text-xs font-medium inline-flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>{content.address}</span>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-white/80 border border-deep/10 text-deep font-body text-xs font-medium inline-flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>{content.hours}</span>
                </div>

                <a
                  href="https://instagram.com/lamsparks_photography"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/80 border border-deep/10 hover:border-gold text-deep font-body text-xs font-medium inline-flex items-center gap-2 transition-all hover:bg-white"
                >
                  <Instagram className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>@lamsparks_photography</span>
                </a>

                <a
                  href="https://twitter.com/lamsparks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/80 border border-deep/10 hover:border-gold text-deep font-body text-xs font-medium inline-flex items-center gap-2 transition-all hover:bg-white"
                >
                  <Twitter className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>@lamsparks</span>
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Portrait Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] bg-deep/5 border border-deep/10 shadow-[0_16px_50px_rgba(26,20,16,0.12)] group">
              <img
                src="/images/client/weddings_3.jpg"
                alt="LamSparks Photography Abuja Studio"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* Bottom Vignette Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/20 to-transparent pointer-events-none" />
              
              {/* Overlay Atelier Quote Badge */}
              <div className="absolute bottom-5 left-5 right-5 text-warm-white space-y-1">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-gold font-bold block mb-1">
                  UNHURRIED ATELIER CRAFT
                </span>
                <p className="font-display italic text-lg sm:text-xl font-light leading-snug">
                  “Dignity, melanin tonal nuance, and memories that outlive us.”
                </p>
                <div className="pt-2 text-[10px] uppercase tracking-[0.16em] text-warm-white/70 font-body">
                  MAITAMA SUITE · ABUJA, NIGERIA
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
