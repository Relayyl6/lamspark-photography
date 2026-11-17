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
import { BackgroundVideoLooper } from "@/components/BackgroundVideoLooper";
import { Nikon3DCamera } from "@/components/Nikon3DCamera";
import { LiquidLogo } from "@/components/LiquidLogo";
import { ShaderGradient } from "@/components/ShaderGradient";
import { PhilosophyGallery } from "@/components/PhilosophyGallery";

export default function HomePage() {
  const featuredSessions = [
    SESSION_TYPES.toddler,
    SESSION_TYPES.maternity,
    SESSION_TYPES["motherhood-bundle"],
    SESSION_TYPES["official-portrait"],
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

        {/* Session Categories Showcase (Translucent Glassmorphic Surface) */}
        <section className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-cream/65 backdrop-blur-md rounded-photo border border-line/60 p-6 sm:p-10 shadow-editorial">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
              <div>
                <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
                  Curated Collections
                </span>
                <h2 className="font-display text-3xl sm:text-5xl text-deep font-normal">
                  Unhurried Sessions for Every Milestone
                </h2>
              </div>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-wider text-deep hover:text-gold font-semibold transition-colors"
              >
                <span>View all session types</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {featuredSessions.map((session, idx) => (
                <div key={session.slug} className={idx === 3 ? "block md:hidden" : ""}>
                  <SessionCard session={session} />
                </div>
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
