import React from "react";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Studio Shoot Guidelines & Wardrobe Prep",
  description:
    "Wardrobe tonal guidance, arrival timing, and studio preparation checklist for a calm portrait session at LamSparks Photography in Maitama, Abuja.",
  path: "/legal/shoot-guidelines",
});

export default function ShootGuidelinesPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
            Preparation Guide
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-deep font-normal">
            Studio Shoot Guidelines
          </h1>
          <p className="font-body text-xs text-muted mt-2">
            Ensuring a Calm & Sparkling Experience in Abuja
          </p>
        </div>

        <div className="space-y-8 font-body text-sm sm:text-base text-brown/90 leading-relaxed bg-warm-white p-8 sm:p-10 rounded-photo border border-line shadow-editorial">
          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">1. Wardrobe & Purity of Tone</h2>
            <p>
              We recommend solid neutrals, creams, warm browns, muted sage, and subtle textures (linen, silk, fine knitwear). Please avoid bold logos, heavy graphic tees, and neon colours that create harsh colour casts on skin.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">2. Toddler Preparation</h2>
            <p>
              Schedule session times directly after your child&apos;s natural morning nap. Please feed them before arriving and pack dry snacks (such as cheerios, crackers, or clear fruit) that won&apos;t stain clothing or studio backdrops.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">3. Newborn Safety & Temperature</h2>
            <p>
              Our Abuja studio is strictly heated to a warm, comfortable temperature for unclothed or swaddled infants. We recommend dressing in light layers yourself so you remain comfortable.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
