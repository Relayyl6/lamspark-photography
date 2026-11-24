import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HeroOverhaulSection } from "@/components/HeroOverhaulSection";
import { SessionCard } from "@/components/SessionCard";
import { EditorialTestimonialSection } from "@/components/EditorialTestimonialSection";
import { SESSION_TYPES } from "@/lib/catalog/seed";
import { getLiveSessionTypes } from "@/lib/catalog/live";
import { PhilosophyGallery } from "@/components/PhilosophyGallery";
import { LiveCalendarSection } from "@/components/LiveCalendarSection";
import { WhyFamiliesTrustUsSection } from "@/components/WhyFamiliesTrustUsSection";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

async function getHeroData() {
  try {
    const [settingsRows, siteContentRows] = await Promise.all([
      sql.query(
        `SELECT key, value FROM settings WHERE key IN ('hero_wheel_cards', 'hero_kicker', 'hero_headline', 'hero_subtitle')`
      ).catch(() => []),
      sql.query(
        `SELECT key, value FROM site_content WHERE key IN ('hero_wheel_cards', 'hero_kicker', 'hero_headline', 'hero_subtitle')`
      ).catch(() => []),
    ]);

    const map: Record<string, any> = {};
    for (const r of [...siteContentRows, ...settingsRows]) {
      if (r && r.key) {
        let val = r.value;
        if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        map[r.key] = val;
      }
    }

    return {
      cards: Array.isArray(map.hero_wheel_cards) ? map.hero_wheel_cards : null,
      copy: {
        kicker: (typeof map.hero_kicker === "string" ? map.hero_kicker : null) || "I CAPTURE · YOU REMEMBER",
        headline: (typeof map.hero_headline === "string" ? map.hero_headline : null) || "REAL MOMENTS. BEAUTIFUL MEMORIES",
        subtitle: (typeof map.hero_subtitle === "string" ? map.hero_subtitle : null) || "I capture real emotions and raw moments that tell your story in the most authentic and timeless way.",
      },
    };
  } catch (e) {
    console.error("[getHeroData error]", e);
    return { cards: null, copy: null };
  }
}

export default async function HomePage() {
  const [liveSessions, heroData] = await Promise.all([
    getLiveSessionTypes(),
    getHeroData(),
  ]);

  const featuredSessions = [
    liveSessions.toddler || SESSION_TYPES.toddler,
    liveSessions.maternity || SESSION_TYPES.maternity,
    liveSessions["motherhood-bundle"] || SESSION_TYPES["motherhood-bundle"],
  ];

  return (
    <>
      {/* Editorial Navigation */}
      <Nav />

      <main className="flex-1 relative z-10">
        {/* Overhauled Editorial 3D Arched Panorama Hero with Integrated 3D Nikon Camera */}
        <HeroOverhaulSection initialCards={heroData.cards} initialCopy={heroData.copy} />

        {/* Live Studio Calendar: Free or Booked, At a Glance (Fetched from Neon DB) */}
        <LiveCalendarSection />

        {/* Brand Line & Editorial Philosophy Section */}
        <PhilosophyGallery />

        {/* Session Categories Showcase */}
        <section className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-cream/70 backdrop-blur-xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl border border-white/40 shadow-[0_8px_40px_rgba(26,20,16,0.08)] p-5 sm:p-8 lg:p-10 reveal-up">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
              <div className="reveal-down">
                <span className="font-body text-[10px] uppercase tracking-[0.26em] text-gold font-bold block mb-1.5">
                  Curated Collections
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-deep font-normal leading-tight">
                  Unhurried Sessions for<br className="hidden sm:block" /> Every Milestone
                </h2>
              </div>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-wider text-deep hover:text-gold font-semibold transition-colors shrink-0 group reveal-left delay-150"
              >
                <span>View all session types</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {/* 3-col portrait card grid with staggered reveal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" data-stagger="true">
              {featuredSessions.slice(0, 3).map((session) => (
                <SessionCard key={session.slug} session={session} />
              ))}
            </div>
          </div>
        </section>

        {/* Full-Screen-Width Editorial Testimonial Carousel */}
        <EditorialTestimonialSection />

        {/* Why Families Trust Us: An Unhurried Approach to Art */}
        <WhyFamiliesTrustUsSection />
      </main>

      <Footer />
    </>
  );
}
