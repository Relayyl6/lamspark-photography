import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SessionCard } from "@/components/SessionCard";
import { getLiveSessionTypes } from "@/lib/catalog/live";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bespoke Photography Sessions & Collections",
  description:
    "Explore our core session offerings at LamSparks Photography in Maitama, Abuja. From unhurried toddler and maternity sessions to executive portraits and luxury weddings.",
  openGraph: {
    title: "Bespoke Photography Sessions & Collections | LamSparks Abuja",
    description:
      "Explore core session offerings from LamSparks Photography in Maitama, Abuja. Inclusions, timelines, and transparent starting rates.",
    images: [
      {
        url: "/images/client/weddings_1.webp",
        width: 1200,
        height: 630,
        alt: "LamSparks Photography Collections Abuja",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bespoke Photography Collections | LamSparks Abuja",
    description: "Unhurried toddler, maternity, family, wedding, and executive portrait sessions.",
    images: ["/images/client/weddings_1.webp"],
  },
};

export default async function SessionsIndexPage() {
  const sessionTypes = await getLiveSessionTypes();
  const sessions = Object.values(sessionTypes);

  return (
    <>
      <Nav />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Header - Tightened Spacing */}
        <div className="max-w-3xl mb-6 sm:mb-8 reveal-down">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
            Collections & Inclusions
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-deep font-normal leading-tight">
            Thoughtfully Designed Session Collections
          </h1>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" data-stagger="true">
          {sessions.map((session, idx) => (
            <SessionCard key={session.slug} session={session} priority={idx < 3} />
          ))}
        </div>

        {/* Two-Step Pricing Notice */}
        <div className="reveal-up mt-14 sm:mt-16 p-8 sm:p-10 rounded-photo bg-warm-white border border-line shadow-editorial max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <span className="font-body text-xs uppercase tracking-[0.2em] text-gold font-semibold block mb-1">
                Transparent & Bespoke
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-deep font-normal">
                How Our Two-Step Pricing Works
              </h3>
              <p className="font-body text-xs sm:text-sm text-brown/80 mt-2 max-w-xl">
                We believe in complete transparency. Our collections show starting rates above, and our personal estimate engine calculates the exact total, deposit (70% or 50% for maternity), and balance based on your specific family members, outfits, and timing.
              </p>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-full whitespace-nowrap transition-all shadow-editorial"
            >
              <span>Build Your Estimate</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
