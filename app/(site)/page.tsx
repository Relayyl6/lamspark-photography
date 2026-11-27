import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HeroOverhaulSection } from "@/components/HeroOverhaulSection";
import { CuratedCollectionsSection } from "@/components/CuratedCollectionsSection";
import {
  EditorialTestimonialSection,
  type TrustStatItem,
} from "@/components/EditorialTestimonialSection";
import { getLiveSessionTypes } from "@/lib/catalog/live";
import { PhilosophyGallery } from "@/components/PhilosophyGallery";
import { LiveCalendarSection } from "@/components/LiveCalendarSection";
import type { EditorialTestimonial } from "@/lib/testimonials-data";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "LamSparks Photography | Bespoke Portrait & Event Studio in Abuja",
  absoluteTitle: true,
  description:
    "Private portrait & event studio in Maitama, Abuja by Osemene. Explore Toddler, Maternity, Newborn, Family, Executive & Wedding collections, view live calendar slots, and reserve your shoot online.",
  path: "/",
  image: "/og/home.jpg",
  imageAlt: "LamSparks Photography · Bespoke Portrait & Event Studio in Abuja, Nigeria",
});

const sql = neon(process.env.DATABASE_URL!);

function parseSettingJson(val: any) {
  if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

async function getHomeData() {
  try {
    const keys = [
      "hero_wheel_cards",
      "hero_kicker",
      "hero_headline",
      "hero_subtitle",
      "philosophy_photos",
      "about_stats",
      "site_testimonials",
    ];
    const [settingsRows, siteContentRows, galleryRows] = await Promise.all([
      sql
        .query(`SELECT key, value FROM settings WHERE key = ANY($1::text[])`, [keys])
        .catch(() => []),
      sql
        .query(`SELECT key, value FROM site_content WHERE key = ANY($1::text[])`, [keys])
        .catch(() => []),
      sql
        .query(
          `SELECT
            gi.id,
            a.storage_key as src,
            COALESCE(a.alt_text, g.title) as alt,
            COALESCE(gi.caption, g.title) as caption,
            COALESCE(a.session_type, g.session_type) as "sessionType",
            g.title as category,
            g.slug,
            et.name as "eventTypeName"
          FROM gallery_item gi
          JOIN gallery g ON gi.gallery_id = g.id
          JOIN asset a ON gi.asset_id = a.id
          LEFT JOIN event_type et ON et.slug = g.session_type
          ORDER BY g.display_order ASC, gi.display_order ASC
          LIMIT 60`
        )
        .catch(() => []),
    ]);

    const map: Record<string, any> = {};
    for (const r of [...siteContentRows, ...settingsRows]) {
      if (r && r.key) {
        map[r.key] = parseSettingJson(r.value);
      }
    }

    const aboutStats: TrustStatItem[] | undefined =
      Array.isArray(map.about_stats) && map.about_stats.length > 0
        ? map.about_stats
        : undefined;

    const testimonials: EditorialTestimonial[] | undefined =
      Array.isArray(map.site_testimonials) && map.site_testimonials.length > 0
        ? map.site_testimonials
        : undefined;

    const galleryPhotos = Array.isArray(galleryRows)
      ? galleryRows
          .filter((r: any) => Boolean(r?.src))
          .map((r: any) => ({
            id: String(r.id),
            src: String(r.src),
            alt: String(r.alt || r.category || "LamSparks Photography"),
            caption: String(r.caption || r.category || ""),
            sessionType: String(r.sessionType || "studio"),
            category: String(r.category || "Curated Collection"),
            slug: String(r.slug || "studio"),
            eventTypeName: r.eventTypeName ? String(r.eventTypeName) : undefined,
          }))
      : [];

    return {
      hero: {
        cards: Array.isArray(map.hero_wheel_cards) ? map.hero_wheel_cards : null,
        copy: {
          kicker:
            (typeof map.hero_kicker === "string" ? map.hero_kicker : null) ||
            "I CAPTURE · YOU REMEMBER",
          headline:
            (typeof map.hero_headline === "string" ? map.hero_headline : null) ||
            "REAL MOMENTS. BEAUTIFUL MEMORIES",
          subtitle:
            (typeof map.hero_subtitle === "string" ? map.hero_subtitle : null) ||
            "I capture real emotions and raw moments that tell your story in the most authentic and timeless way.",
        },
      },
      aboutStats,
      testimonials,
      philosophyPhotos: Array.isArray(map.philosophy_photos) ? map.philosophy_photos : [],
      galleryPhotos,
    };
  } catch (e) {
    console.error("[getHomeData error]", e);
    return {
      hero: { cards: null, copy: null },
      aboutStats: undefined,
      testimonials: undefined,
      philosophyPhotos: [],
      galleryPhotos: [],
    };
  }
}

export default async function HomePage() {
  const [liveSessions, homeData] = await Promise.all([
    getLiveSessionTypes(),
    getHomeData(),
  ]);

  const heroCardsToPreload = homeData.hero.cards || [];

  return (
    <>
      {/* High-Priority HTML Preload Scanner Links (Instantly Fetches Hero Cards Before React Hydration) */}
      {heroCardsToPreload.map((c: any) => (
        <link
          key={`preload-${c.id || c.image}`}
          rel="preload"
          as="image"
          href={c.image}
          type="image/webp"
          // @ts-ignore
          fetchpriority="high"
        />
      ))}

      {/* Editorial Navigation */}
      <Nav />

      <main className="flex-1 relative z-10">
        {/* Overhauled Editorial 3D Arched Panorama Hero with Integrated 3D Nikon Camera */}
        <HeroOverhaulSection
          initialCards={homeData.hero.cards}
          initialCopy={homeData.hero.copy}
        />

        {/* Live Studio Calendar: Free or Booked, At a Glance (Fetched from Neon DB) */}
        <LiveCalendarSection />

        {/* Brand Line & Editorial Philosophy Section */}
        <PhilosophyGallery initialPhotos={homeData.philosophyPhotos} />

        {/* Unboxed Full-Width Curated Collections with Category Filter & Infinite Scroll */}
        <CuratedCollectionsSection
          sessions={Object.values(liveSessions)}
          galleryPhotos={homeData.galleryPhotos}
        />

        {/* Full-Screen-Width Editorial Testimonial Carousel with Synced Studio Trust Box */}
        <EditorialTestimonialSection
          initialStats={homeData.aboutStats}
          initialTestimonials={homeData.testimonials}
        />
      </main>

      {/* Deep Organic Editorial Footer */}
      <Footer />
    </>
  );
}
