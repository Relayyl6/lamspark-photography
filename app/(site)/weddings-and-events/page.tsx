import React from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Check } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const WEDDING_GALLERY_FRAMES = [
  {
    src: "/images/client/weddings_1.webp",
    label: "White Wedding",
    alt: "Luxury Abuja wedding portrait - LamSparks",
  },
  {
    src: "/images/client/weddings_2.webp",
    label: "Traditional Aso-Oke",
    alt: "Traditional Nigerian wedding ceremony Abuja - LamSparks",
  },
  {
    src: "/images/client/weddings/weddings_1.webp",
    label: "Bridal Grace",
    alt: "Nigerian bridal portrait - LamSparks",
  },
  {
    src: "/images/client/weddings_3.webp",
    label: "Pre-Wedding",
    alt: "Couple intimacy and connection - LamSparks",
  },
  {
    src: "/images/client/weddings/weddings_2.webp",
    label: "Ceremony Moments",
    alt: "Wedding ceremony storytelling - LamSparks",
  },
  {
    src: "/images/client/weddings_4.webp",
    label: "Reception & Toast",
    alt: "Wedding celebration reception in Abuja - LamSparks",
  },
  {
    src: "/images/client/weddings/weddings_4.webp",
    label: "Timeless Unions",
    alt: "Heirloom wedding memories - LamSparks",
  },
  {
    src: "/images/client/weddings_5.webp",
    label: "Heritage & Joy",
    alt: "Cultural wedding celebration - LamSparks",
  },
];

const HIGHLIGHTS = [
  "Timeline & Planner Direction",
  "Trad & White Ceremonies",
  "5–7 Day Highlight Gallery",
  "Italian Heirloom Albums",
];

export default function WeddingsAndEventsPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Visual-First Editorial Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12 reveal-down">
          <div className="max-w-2xl">
            <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
              Bespoke Coverage · Abuja &amp; Beyond
            </span>
            <h1 className="font-display text-4xl sm:text-6xl text-deep font-normal leading-tight">
              Weddings &amp; Milestones
            </h1>
            <p className="font-body text-sm sm:text-base text-brown/80 mt-3 leading-relaxed">
              Unhurried heirloom storytelling personally directed by Osemene.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/portfolio?event=weddings"
              className="inline-flex items-center gap-2 border border-line hover:border-gold bg-warm-white text-deep font-body text-xs uppercase tracking-wider font-semibold px-5 py-3.5 rounded-full transition-colors"
            >
              <span>Wedding Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/book?session=wedding"
              className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-full transition-all shadow-editorial"
            >
              <span>Request Proposal</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* Rich Editorial Wedding Photo Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-12" data-stagger="true">
          {WEDDING_GALLERY_FRAMES.map((frame, i) => (
            <Link
              key={frame.src}
              href="/portfolio?event=weddings"
              className={`reveal-up group relative overflow-hidden rounded-photo-mobile sm:rounded-photo border border-line bg-[#EDE7DD] shadow-editorial ${
                i === 0 || i === 5 ? "aspect-[3/4]" : "aspect-[4/5]"
              }`}
            >
              <img
                src={frame.src}
                alt={frame.alt}
                loading={i < 4 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/75 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-warm-white">
                <span className="font-body text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold">
                  {frame.label}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gold opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Concise Coverage Pill Strip */}
        <div className="bg-warm-white border border-line rounded-photo px-6 py-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2.5 w-full lg:w-auto">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-deep font-medium">
                <Check className="w-4 h-4 text-gold shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/book?session=wedding"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gold hover:text-deep transition-colors shrink-0"
          >
            <span>Check Wedding Dates</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
