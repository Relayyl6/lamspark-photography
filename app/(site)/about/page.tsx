import React from "react";
import Link from "next/link";
import { ArrowUpRight, Heart, Sparkles, Clock, Award } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, any> = {
  Clock,
  Award,
  Heart,
  Sparkles,
};

export default async function AboutPage() {
  let stats = [
    {
      value: "10+",
      label: "Years of Empathy",
      desc: "Capturing Nigeria's most tender family and milestone stories.",
      iconName: "Clock",
    },
    {
      value: "1,200+",
      label: "Heirloom Keepsakes",
      desc: "Museum-grade Italian leather albums & archival wooden frames delivered.",
      iconName: "Award",
    },
    {
      value: "100%",
      label: "Unhurried Pace",
      desc: "Only one family per half-day in our Maitama studio. Zero time pressure.",
      iconName: "Heart",
    },
    {
      value: "4.98★",
      label: "Client Reverence",
      desc: "Abuja's premier word-of-mouth studio for families and dignitaries.",
      iconName: "Sparkles",
    },
  ];

  let aboutQuote = "I believe the most extraordinary moments are usually the quietest ones.";

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const statsRow = await sql.query(
      `SELECT value FROM settings WHERE key = 'about_stats' LIMIT 1`
    ).catch(() => []);
    if (statsRow.length > 0 && Array.isArray(statsRow[0].value) && statsRow[0].value.length > 0) {
      stats = statsRow[0].value;
    }

    const quoteRow = await sql.query(
      `SELECT value FROM settings WHERE key = 'about_quote' LIMIT 1`
    ).catch(() => []);
    if (quoteRow.length > 0 && typeof quoteRow[0].value === "string") {
      aboutQuote = quoteRow[0].value;
    }
  } catch (err) {
    console.error("[AboutPage DB error]", err);
  }

  return (
    <>
      <Nav />
      <main className="flex-1 bg-cream py-14 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Story Section: Osemene & Lametu Heritage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20 sm:mb-28">
            <div className="lg:col-span-7 space-y-6 reveal-down">
              <span className="font-body text-xs uppercase tracking-[0.26em] text-gold font-bold block">
                The Founder & Artist
              </span>
              <h1 className="font-display text-4xl sm:text-6xl text-deep font-normal leading-[1.1]">
                Honouring Lametu. Sparkling Lives.
              </h1>
              <p className="font-serif italic text-xl sm:text-2xl text-brown pl-4 border-l-2 border-gold/70 my-4">
                &ldquo;{aboutQuote}&rdquo;
              </p>
              <div className="space-y-4 font-body text-sm sm:text-base text-brown/90 leading-relaxed">
                <p>
                  My name is <strong>Osemene</strong>. I am a photographer, a mother, and the creator of <strong>LamSparks Photography</strong> based in Abuja, Nigeria.
                </p>
                <p>
                  People often ask where the name came from. It is deeply personal. <strong>Lam</strong> comes from <em>Lametu</em> — my beloved mother. She embodied patience, warmth, and an unwavering belief in holding family close. When I picked up my first camera, her encouragement sparked something inside me that would never extinguish.
                </p>
                <p>
                  The <strong>Sparks</strong> represents the sudden, fleeting glint of delight in a child’s eye, the tender pride of an expectant father, the quiet confidence of a woman in her prime.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-full transition-all shadow-editorial"
                >
                  <span>Book a Session with Osemene</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
                <Link
                  href="/stories"
                  className="font-body text-xs uppercase tracking-wider text-deep hover:text-gold border-b border-deep/40 hover:border-gold pb-1 font-semibold transition-colors"
                >
                  Explore Stories →
                </Link>
              </div>
            </div>

            {/* Osemene's Portrait */}
            <div className="lg:col-span-5 relative reveal-up delay-150">
              <div className="aspect-[4/5] rounded-photo overflow-hidden border border-line shadow-floating bg-cream">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                  alt="Osemene, Founder and Principal Photographer of LamSparks Photography Abuja"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-warm-white p-5 rounded-lg border border-gold/40 shadow-editorial max-w-xs hidden sm:block">
                <span className="font-body text-[10px] uppercase tracking-wider text-gold font-semibold block">
                  Abuja, Nigeria
                </span>
                <p className="font-serif italic text-sm text-deep">
                  &ldquo;Unhurried sessions, because true connection cannot be rushed.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* "WHY CHOOSE US" STATS SECTION (RESPONSIVE: grid-cols-2 ON MOBILE) */}
          <div className="border-t border-line pt-16 sm:pt-20 mb-20 sm:mb-28">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 reveal-down">
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-bold block mb-2">
                Why Families Trust Us
              </span>
              <h2 className="font-display text-3xl sm:text-5xl text-deep font-normal">
                An Unhurried Approach to Art
              </h2>
              <p className="font-body text-xs sm:text-sm text-brown/80 mt-2">
                We reject transactional, factory-style photoshoots. Every appointment is treated as an heirloom commission.
              </p>
            </div>

            {/* Responsive: 2 columns on mobile, 4 columns on desktop with staggered reveals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" data-stagger="true">
              {stats.map((s, idx) => {
                const IconComponent = ICON_MAP[s.iconName || "Sparkles"] || Sparkles;
                return (
                  <LiquidGlassCard key={idx} className="reveal-up p-5 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold mb-4 border border-gold/30">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-display text-3xl sm:text-5xl text-deep font-light tracking-tight block">
                        {s.value}
                      </span>
                      <h4 className="font-display text-sm sm:text-base text-deep font-medium mt-1">
                        {s.label}
                      </h4>
                    </div>
                    <p className="font-body text-[11px] sm:text-xs text-brown/80 mt-3 leading-relaxed">
                      {s.desc}
                    </p>
                  </LiquidGlassCard>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
