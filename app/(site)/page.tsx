import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HeroOverhaulSection } from "@/components/HeroOverhaulSection";
import { SessionCard } from "@/components/SessionCard";
import { EditorialTestimonialSection } from "@/components/EditorialTestimonialSection";
import { EditorialCameraShowcaseCTA } from "@/components/EditorialCameraShowcaseCTA";
import { SESSION_TYPES } from "@/lib/catalog/seed";
import { getLiveSessionTypes } from "@/lib/catalog/live";
import { BackgroundVideoLooper } from "@/components/BackgroundVideoLooper";
import { Nikon3DCamera } from "@/components/Nikon3DCamera";
import { LiquidLogo } from "@/components/LiquidLogo";
import { ShaderGradient } from "@/components/ShaderGradient";
import { PhilosophyGallery } from "@/components/PhilosophyGallery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const liveSessions = await getLiveSessionTypes();
  const featuredSessions = [
    liveSessions.toddler || SESSION_TYPES.toddler,
    liveSessions.maternity || SESSION_TYPES.maternity,
    liveSessions["motherhood-bundle"] || SESSION_TYPES["motherhood-bundle"],
  ];

  return (
    <>
      {/* Dynamic Background Video Looper: Seamlessly loops 4 editorial reels all throughout scrolling */}
      <BackgroundVideoLooper />

      {/* Editorial Navigation */}
      <Nav />

      <main className="flex-1 relative z-10">
        {/* Overhauled Editorial 3D Arched Panorama Hero with Integrated 3D Nikon Camera */}
        <HeroOverhaulSection />

        {/* Brand Line & Editorial Philosophy Section */}
        <PhilosophyGallery />

        {/* Session Categories Showcase */}
        <section className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-cream/70 backdrop-blur-xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl border border-white/40 shadow-[0_8px_40px_rgba(26,20,16,0.08)] p-5 sm:p-8 lg:p-10">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
              <div>
                <span className="font-body text-[10px] uppercase tracking-[0.26em] text-gold font-bold block mb-1.5">
                  Curated Collections
                </span>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-deep font-normal leading-tight">
                  Unhurried Sessions for<br className="hidden sm:block" /> Every Milestone
                </h2>
              </div>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-wider text-deep hover:text-gold font-semibold transition-colors shrink-0 group"
              >
                <span>View all session types</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {/* 3-col portrait card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {featuredSessions.slice(0, 3).map((session) => (
                <SessionCard key={session.slug} session={session} />
              ))}
            </div>
          </div>
        </section>

        {/* Full-Screen-Width Editorial Testimonial Carousel */}
        <EditorialTestimonialSection />

        {/* Full-Screen-Width Editorial Rangefinder Camera Showcase CTA */}
        <EditorialCameraShowcaseCTA />
      </main>

      <Footer />
    </>
  );
}
