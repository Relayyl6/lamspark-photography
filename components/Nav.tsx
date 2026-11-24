"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X, ChevronDown, Sparkles, BookOpen, Camera, Shield, User } from "lucide-react";

export function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"sessions" | "galleries" | null>(null);

  // Mobile accordion states
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [mobileGalleriesOpen, setMobileGalleriesOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const sessionLinks = [
    { href: "/sessions/toddler", label: "Toddler & Children", desc: "Ages 1–10, unhurried play, 0 stiff poses" },
    { href: "/sessions/maternity", label: "Maternity & Motherhood", desc: "Graceful expectant silhouettes & calm light" },
    { href: "/sessions/motherhood-bundle", label: "Motherhood Signature Bundle", desc: "Maternity + Toddler package (-15% savings)" },
    { href: "/weddings-and-events", label: "Weddings & Milestone Events", desc: "Ceremonies, dinners, and landmark celebrations" },
    { href: "/sessions/official-portrait", label: "Official Portraits & Headshots", desc: "Commanding, dignified portraits for leaders" },
    { href: "/sessions", label: "Browse All Sessions ↗", desc: "Explore the full session catalogue" },
  ];

  const galleryLinks = [
    { href: "/portfolio", label: "Curated Portfolio", desc: "Archival Series 02 · Vintage camera matte board & fine art works" },
    { href: "/love-notes", label: "Client Love Notes", desc: "Real memories & words from families across Nigeria" },
    { href: "/faq", label: "Session FAQ & Prep", desc: "Timing, booking steps, and studio suite details" },
  ];

  return (
    <header className={`sticky top-0 z-50 border-b border-line transition-all animate-fade-down ${
      mobileMenuOpen ? "bg-[#FAF8F5]" : "bg-cream/85 backdrop-blur-md"
    }`}>
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-18 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* 1. Left Brand Wordmark */}
        <Link href="/" className="group flex flex-col justify-center shrink-0">
          <span className="font-display text-xl sm:text-2xl lg:text-3xl tracking-tight text-deep font-semibold transition-colors group-hover:text-gold leading-none">
            LamSparks
          </span>
          <span className="font-body text-[8.5px] sm:text-[9.5px] lg:text-[10px] uppercase tracking-[0.22em] text-muted mt-0.5 font-medium leading-none">
            Photography · Abuja
          </span>
        </Link>

        {/* 2. Center Action Pill: Centered Desktop Pill Button */}
        <div className="hidden lg:flex items-center justify-center shrink-0">
          <Link
            href="/book"
            className="inline-flex items-center gap-2.5 bg-deep text-warm-white hover:bg-brown px-4 py-2 rounded-full shadow-pill transition-all transform hover:-translate-y-0.5 group shrink-0"
          >
            <span className="font-body text-xs tracking-wider uppercase font-semibold">
              Book a session
            </span>
            <span className="w-5 h-5 rounded-full bg-gold text-deep flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            </span>
          </Link>
        </div>

        {/* 3. Right Navigation: Curated Dropdowns + Loud High-Visibility Studio OS Button */}
        <nav ref={navRef} className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
          {/* Dropdown 1: Sessions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "sessions" ? null : "sessions")}
              className={`inline-flex items-center gap-1 font-body text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                openDropdown === "sessions" ? "text-deep bg-warm-white shadow-sm" : "text-brown/90 hover:text-deep hover:bg-warm-white/60"
              }`}
              aria-expanded={openDropdown === "sessions"}
            >
              <span>Sessions</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openDropdown === "sessions" ? "rotate-180 text-gold" : "text-muted"
                }`}
              />
            </button>

            {openDropdown === "sessions" && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-[#FAF8F5] rounded-xl border border-[#E5DDD2] shadow-2xl p-3 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 text-[10px] font-body uppercase tracking-[0.2em] text-gold font-bold border-b border-[#E5DDD2]">
                  Select a Session Experience
                </div>
                {sessionLinks.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => setOpenDropdown(null)}
                    className="block p-2.5 rounded-lg hover:bg-[#F2ECE3] transition-colors group"
                  >
                    <span className="block font-display text-sm font-medium text-deep group-hover:text-gold transition-colors">
                      {s.label}
                    </span>
                    <span className="block font-body text-[11px] text-muted line-clamp-1 mt-0.5">
                      {s.desc}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown 2: Galleries */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "galleries" ? null : "galleries")}
              className={`inline-flex items-center gap-1 font-body text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                openDropdown === "galleries" ? "text-deep bg-warm-white shadow-sm" : "text-brown/90 hover:text-deep hover:bg-warm-white/60"
              }`}
              aria-expanded={openDropdown === "galleries"}
            >
              <span>Galleries</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openDropdown === "galleries" ? "rotate-180 text-gold" : "text-muted"
                }`}
              />
            </button>

            {openDropdown === "galleries" && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-[#FAF8F5] rounded-xl border border-[#E5DDD2] shadow-2xl p-3 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 text-[10px] font-body uppercase tracking-[0.2em] text-gold font-bold border-b border-[#E5DDD2]">
                  Visual Archives & Chronicles
                </div>
                {galleryLinks.map((g) => (
                  <Link
                    key={g.href}
                    href={g.href}
                    onClick={() => setOpenDropdown(null)}
                    className="block p-2.5 rounded-lg hover:bg-[#F2ECE3] transition-colors group"
                  >
                    <span className="block font-display text-sm font-medium text-deep group-hover:text-gold transition-colors">
                      {g.label}
                    </span>
                    <span className="block font-body text-[11px] text-muted line-clamp-1 mt-0.5">
                      {g.desc}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Direct Link: My Booking */}
          <Link
            href="/find-booking"
            className="font-body text-[13px] font-medium text-brown/90 hover:text-deep hover:bg-warm-white/60 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            My Booking
          </Link>

          {/* Direct Link: Contact */}
          <Link
            href="/contact"
            className="font-body text-[13px] font-medium text-brown/90 hover:text-deep hover:bg-warm-white/60 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Contact
          </Link>

          {/* Clean Studio OS Button: Just a Person Icon */}
          <Link
            href="/studio"
            className="w-9 h-9 rounded-full border border-line bg-cream/70 hover:bg-warm-white hover:border-gold flex items-center justify-center text-brown/90 hover:text-gold transition-all duration-200 shrink-0 ml-1 group shadow-sm"
            title="Studio OS Portal"
            aria-label="Studio OS Login"
          >
            <User className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
          </Link>
        </nav>

        {/* 4. Mobile Controls (lg:hidden) */}
        <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
          {/* Mobile Booking Action Pill with Arrow */}
          <Link
            href="/book"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-deep text-warm-white hover:bg-brown px-2.5 sm:px-3.5 py-1.5 rounded-full shadow-pill transition-all transform hover:-translate-y-0.5 group shrink-0"
          >
            <span className="font-body text-[10.5px] sm:text-xs tracking-wider uppercase font-semibold whitespace-nowrap">
              Book a session
            </span>
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gold text-deep flex items-center justify-center group-hover:rotate-45 transition-transform duration-300 shrink-0">
              <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
            </span>
          </Link>

          {/* Quick Studio link with Person Icon on Mobile */}
          <Link
            href="/studio"
            className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-line bg-cream text-brown hover:text-gold shrink-0"
            title="Studio OS"
            aria-label="Studio OS"
          >
            <User className="w-3.5 h-3.5 text-gold" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 rounded-lg text-deep hover:bg-cream border border-line focus:outline-none shrink-0"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* 5. Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed left-0 right-0 top-14 sm:top-16 lg:top-18 bottom-0 w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] z-50 bg-[#FAF8F5] border-t border-line overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 flex flex-col justify-between shadow-2xl animate-in fade-in duration-200">
          <div className="space-y-3 sm:space-y-4">
            {/* Accordion 1: Sessions */}
            <div className="border-b border-line/60 pb-2.5 sm:pb-3">
              <button
                type="button"
                onClick={() => setMobileSessionsOpen(!mobileSessionsOpen)}
                className="w-full flex items-center justify-between py-1.5 text-left"
              >
                <span className="font-display text-base sm:text-lg text-deep font-medium">Sessions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold transition-transform duration-200 ${
                    mobileSessionsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileSessionsOpen && (
                <div className="pl-3 py-1.5 space-y-1.5 border-l-2 border-gold/40 mt-1">
                  {sessionLinks.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 text-[13px] sm:text-sm font-body text-brown hover:text-gold"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion 2: Galleries */}
            <div className="border-b border-line/60 pb-2.5 sm:pb-3">
              <button
                type="button"
                onClick={() => setMobileGalleriesOpen(!mobileGalleriesOpen)}
                className="w-full flex items-center justify-between py-1.5 text-left"
              >
                <span className="font-display text-base sm:text-lg text-deep font-medium">Galleries</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold transition-transform duration-200 ${
                    mobileGalleriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {mobileGalleriesOpen && (
                <div className="pl-3 py-1.5 space-y-1.5 border-l-2 border-gold/40 mt-1">
                  {galleryLinks.map((g) => (
                    <Link
                      key={g.href}
                      href={g.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 text-[13px] sm:text-sm font-body text-brown hover:text-gold"
                    >
                      {g.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Link: My Booking */}
            <div className="border-b border-line/60 pb-3">
              <Link
                href="/find-booking"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 font-display text-lg text-deep font-medium hover:text-gold"
              >
                <span>My Booking</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-gold font-bold px-2 py-0.5 rounded-full bg-gold/15">
                  Find Status
                </span>
              </Link>
            </div>

            {/* Direct Link: Contact */}
            <div className="border-b border-line/60 pb-3">
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 font-display text-lg text-deep font-medium hover:text-gold"
              >
                Contact Concierge
              </Link>
            </div>
          </div>

          {/* Bottom Actions on Mobile: Book a session + Clean Studio OS button */}
          <div className="pt-6 space-y-3 mt-6 border-t border-line">
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-deep text-warm-white py-3.5 rounded-full font-body text-xs font-semibold uppercase tracking-wider shadow-editorial"
            >
              <span>Book a session</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/studio"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-full border border-line bg-cream/80 hover:bg-warm-white text-brown hover:text-deep transition-colors"
            >
              <User className="w-4 h-4 text-gold" />
              <span className="font-body text-xs font-semibold uppercase tracking-wider">
                Studio OS Portal
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
