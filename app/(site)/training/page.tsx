import React from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Camera, Award } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function TrainingPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-3">
            Mentorship & Masterclasses
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-deep font-normal leading-tight">
            The Craft of Editorial Portraiture
          </h1>
          <p className="font-body text-base text-brown/85 mt-4 leading-relaxed">
            Hands-on mentorship programs in Abuja taught personally by Osemene. Learn natural light handling, toddler pacing, delicate client care, and the business of luxury photography.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 bg-warm-white rounded-photo border border-line shadow-editorial space-y-4">
            <Camera className="w-8 h-8 text-gold" />
            <h3 className="font-display text-2xl text-deep font-medium">
              Studio Lighting & Pacing
            </h3>
            <p className="font-body text-xs sm:text-sm text-brown/80 leading-relaxed">
              Master unhurried direction, creating safe environments for toddlers, and flattering studio strobe lighting.
            </p>
          </div>

          <div className="p-8 bg-warm-white rounded-photo border border-line shadow-editorial space-y-4">
            <BookOpen className="w-8 h-8 text-gold" />
            <h3 className="font-display text-2xl text-deep font-medium">
              Fine Art Post-Production
            </h3>
            <p className="font-body text-xs sm:text-sm text-brown/80 leading-relaxed">
              Our signature colour-grading workflows, skin retouching without losing natural pores, and file management.
            </p>
          </div>

          <div className="p-8 bg-warm-white rounded-photo border border-line shadow-editorial space-y-4">
            <Award className="w-8 h-8 text-gold" />
            <h3 className="font-display text-2xl text-deep font-medium">
              Studio Operating System
            </h3>
            <p className="font-body text-xs sm:text-sm text-brown/80 leading-relaxed">
              Transparent two-step pricing, client pipeline management, WhatsApp integration, and building enduring trust.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 bg-warm-white rounded-photo border border-line text-center max-w-2xl mx-auto space-y-4">
          <h2 className="font-display text-3xl text-deep font-normal">
            Join the Next Abuja Cohort
          </h2>
          <p className="font-body text-xs sm:text-sm text-brown/80">
            Intimate cohorts strictly capped at 6 students to ensure personal portfolio reviews and studio practice.
          </p>
          <div className="pt-4">
            <a
              href="https://wa.me/2348130847299?text=Hello%20LamSparks,%20I%20am%20interested%20in%20joining%20the%20photography%20masterclass"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-7 py-3.5 rounded-full transition-all"
            >
              <span>Apply via WhatsApp</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
