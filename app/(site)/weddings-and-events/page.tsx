import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Check } from "lucide-react";
import { neon } from "@neondatabase/serverless";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { buildPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  title: "Weddings & Milestone Celebrations",
  description:
    "Bespoke Nigerian traditional & white wedding photography in Abuja by Osemene. Unhurried storytelling, planner timeline direction, 5–7 day highlight galleries & Italian heirloom albums.",
  path: "/weddings-and-events",
  image: "/og/weddings.jpg",
  imageAlt: "LamSparks Photography · Weddings & Milestone Celebrations Abuja",
});

interface WeddingFrame {
  id: string;
  src: string;
  label: string;
  alt: string;
  gallerySlug: string;
}

function normalizeImageSrc(src: string): string {
  if (!src) return "";
  if (src.startsWith("/images/client/") && /\.(jpe?g)$/i.test(src)) {
    return src.replace(/\.(jpe?g)$/i, ".webp");
  }
  return src;
}

async function getWeddingFramesFromDb(): Promise<WeddingFrame[]> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql.query(
      `SELECT
         gi.id,
         g.slug as "gallerySlug",
         g.title as "galleryTitle",
         a.storage_key as src,
         COALESCE(a.alt_text, g.title) as alt
       FROM gallery g
       JOIN gallery_item gi ON gi.gallery_id = g.id
       JOIN asset a ON gi.asset_id = a.id
       WHERE g.session_type = 'wedding'
       ORDER BY g.display_order ASC, gi.display_order ASC`
    );

    return (rows || [])
      .filter((r: any) => Boolean(r?.src))
      .map((r: any) => ({
        id: String(r.id),
        src: normalizeImageSrc(String(r.src)),
        label: String(r.galleryTitle || "Wedding Highlight"),
        alt: String(r.alt || r.galleryTitle || "LamSparks Wedding Photography"),
        gallerySlug: String(r.gallerySlug || "weddings"),
      }));
  } catch (err) {
    console.error("[WeddingsAndEventsPage DB fetch error]", err);
    return [];
  }
}

const HIGHLIGHTS = [
  "Timeline & Planner Direction",
  "Trad & White Ceremonies",
  "5–7 Day Highlight Gallery",
  "Italian Heirloom Albums",
];

export default async function WeddingsAndEventsPage() {
  const frames = await getWeddingFramesFromDb();

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

        {/* Live Database Wedding Gallery Grid */}
        {frames.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-12" data-stagger="true">
            {frames.map((frame, i) => (
              <Link
                key={frame.id}
                href={`/portfolio?event=${encodeURIComponent(frame.gallerySlug)}`}
                className={`reveal-up group relative overflow-hidden rounded-photo-mobile sm:rounded-photo border border-line bg-[#EDE7DD] shadow-editorial ${
                  i === 0 && frames.length % 2 === 1 ? "col-span-2 lg:col-span-2 aspect-[16/10] lg:aspect-[16/10]" : "aspect-[4/5]"
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
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-warm-white gap-2">
                  <span className="font-body text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold truncate">
                    {frame.label}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gold opacity-80 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mb-12 p-10 rounded-photo border border-line bg-warm-white text-center space-y-3">
            <p className="font-body text-sm text-muted">
              No wedding gallery highlights are published yet.
            </p>
            <Link
              href="/portfolio?event=weddings"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-gold hover:text-deep"
            >
              <span>Browse Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

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
