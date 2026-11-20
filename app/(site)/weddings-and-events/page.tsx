import React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Heart, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function WeddingsAndEventsPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-3">
            Bespoke Coverage · Abuja & Beyond
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-deep font-normal leading-tight">
            Weddings & Milestone Celebrations
          </h1>
          <p className="font-body text-base text-brown/85 mt-4 leading-relaxed">
            Weddings and ceremonies are sacred gatherings of legacy, cultural heritage, and deep emotion. We take a limited number of commissions each year to ensure Osemene personally directs your visual narrative.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="aspect-[4/3] rounded-photo overflow-hidden border border-line shadow-editorial">
            <img
              src="/images/client/weddings/weddings_1.jpg"
              alt="Bespoke luxury Nigerian wedding photography Abuja - LamSparks"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl text-deep font-normal">
              What Coverage Includes
            </h2>
            <ul className="space-y-3 font-body text-sm text-brown/90">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>Pre-wedding creative consultation and timeline coordination with your planner.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>Coverage of Traditional ceremonies, White wedding ceremonies, and reception festivities.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>Private online highlight gallery within 5–7 business days; complete heirloom gallery within 3–4 weeks.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>Optional handcrafted Italian leather albums and cinematic highlight reels.</span>
              </li>
            </ul>
            <div className="pt-4">
              <Link
                href="/book?session=wedding"
                className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-7 py-4 rounded-full transition-all shadow-editorial"
              >
                <span>Request Wedding Proposal</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
