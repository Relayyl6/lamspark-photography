import React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SessionCard } from "@/components/SessionCard";
import { getLiveSessionTypes } from "@/lib/catalog/live";

export const dynamic = "force-dynamic";

export default async function SessionsIndexPage() {
  const sessionTypes = await getLiveSessionTypes();
  const sessions = Object.values(sessionTypes);

  return (
    <>
      <Nav />
      <main className="flex-1 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Header */}
        <div className="max-w-3xl mb-16">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-3">
            Collections & Inclusions
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-deep font-normal leading-tight">
            Thoughtfully Designed Session Collections
          </h1>
          <p className="font-body text-base text-brown/85 mt-4 leading-relaxed">
            Every session at LamSparks is planned with ample time, deliberate styling, and unhurried guidance in our Abuja studio or on location. Explore our core session categories below to see inclusions, timelines, and starting investments.
          </p>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sessions.map((session) => (
            <SessionCard key={session.slug} session={session} />
          ))}
        </div>

        {/* Two-Step Pricing Notice */}
        <div className="mt-20 p-8 sm:p-10 rounded-photo bg-warm-white border border-line shadow-editorial max-w-4xl mx-auto">
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
