import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowRight, Check, Clock, Calendar, ShieldCheck, Heart, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SESSION_TYPES, ADD_ONS } from "@/lib/catalog/seed";
import { getLiveSessionTypes, getLivePackages } from "@/lib/catalog/live";
import { SessionTypeSlug } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SessionPageProps {
  params: {
    type: string;
  };
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const liveSessions = await getLiveSessionTypes();
  const session =
    liveSessions[params.type as SessionTypeSlug] ||
    SESSION_TYPES[params.type as SessionTypeSlug];

  if (!session) {
    return {
      title: "Session Details | LamSparks Photography Abuja",
    };
  }

  const title = `${session.title} | Bespoke Photography Session`;
  const description = `${session.tagline} ${session.description}`.slice(0, 160);
  const imageUrl = session.heroImage?.replace(/\.jpg$/, ".webp") || session.heroImage || "/images/client/weddings_1.webp";

  return {
    title,
    description,
    openGraph: {
      title: `${session.title} · LamSparks Photography Abuja`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${session.title} - LamSparks Atelier Abuja`,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${session.title} · LamSparks Photography Abuja`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SessionDetailPage({ params }: SessionPageProps) {
  const liveSessions = await getLiveSessionTypes();
  const session = liveSessions[params.type as SessionTypeSlug] || SESSION_TYPES[params.type as SessionTypeSlug];
  if (!session) {
    notFound();
  }

  const packages = await getLivePackages(session.slug);
  const addOns = ADD_ONS.filter((a) => a.sessionType === session.slug || a.sessionType === "all");

  // Derive live starting rate dynamically from live studio packages or session override
  const packagePrices = packages
    .map((p) => (typeof p.price === "number" && p.price > 0 ? p.price : null))
    .filter((p): p is number => p !== null);
  const lowestPackagePrice = packagePrices.length > 0 ? Math.min(...packagePrices) : null;
  const startingPrice = lowestPackagePrice ?? session.fromPrice;

  const standardDelivery = session.standardDeliveryDays || "5 to 7 business days";
  const standardDepositPercent = (session as any).depositPercent ?? session.defaultDepositPercent ?? 70;

  return (
    <>
      <Nav />
      <main className="flex-1 pb-24">
        {/* 1. Hero Image & One-Line Promise */}
        <div className="relative w-full bg-deep text-warm-white pt-28 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 opacity-25">
            <img
              src={session.heroImage?.replace(/\.jpg$/, ".webp") || session.heroImage}
              alt={session.title}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center filter blur-sm"
            />
          </div>
          <div className="relative max-w-4xl mx-auto text-center space-y-4 reveal-down">
            <span className="font-body text-xs uppercase tracking-[0.26em] text-gold font-semibold block">
              {session.category === "studio" ? "Abuja Studio Session" : session.category === "events" ? "Event Coverage" : "Editorial Portraiture"}
            </span>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal leading-tight">
              {session.title}
            </h1>
            <p className="font-serif italic text-lg sm:text-2xl text-gold-light max-w-2xl mx-auto">
              {session.tagline}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left 2 Cols: Editorial Details */}
            <div className="lg:col-span-2 space-y-16">
              {/* 2. Who it is for */}
              <section className="space-y-4 reveal-up">
                <span className="font-body text-xs uppercase tracking-[0.2em] text-gold font-semibold block">
                  The Experience
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                  Who This Session is Created For
                </h2>
                <p className="font-body text-base text-brown/90 leading-relaxed">
                  {session.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-warm-white rounded-lg border border-line">
                    <span className="font-body text-xs font-semibold text-deep uppercase tracking-wider block mb-1">
                      Unhurried Pacing
                    </span>
                    <p className="font-body text-xs text-muted">
                      We never rush. Ample time for rest, outfit changes, feeding, or breaks.
                    </p>
                  </div>
                  <div className="p-4 bg-warm-white rounded-lg border border-line">
                    <span className="font-body text-xs font-semibold text-deep uppercase tracking-wider block mb-1">
                      Private Abuja Studio
                    </span>
                    <p className="font-body text-xs text-muted">
                      Calm, climate-controlled, sanitized environment tailored for your comfort.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Packages & What is Included (from Seed, never retyped) */}
              <section className="space-y-6">
                <div>
                  <span className="font-body text-xs uppercase tracking-[0.2em] text-gold font-semibold block mb-1">
                    Packages & Options
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                    Available Collections
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-stagger="true">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="reveal-up bg-warm-white pt-8 sm:pt-9 px-7 sm:px-8 pb-7 rounded-photo-mobile sm:rounded-photo border border-line shadow-editorial flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2.5">
                          <h3 className="font-display text-2xl sm:text-[1.65rem] text-deep font-medium leading-snug">
                            {pkg.name}
                          </h3>
                          {pkg.badge && (
                            <span className="shrink-0 bg-gold/15 text-deep font-body text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full border border-gold/30 mt-1 whitespace-nowrap">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mb-5">
                          <p className="font-body text-lg font-semibold text-deep">
                            {pkg.price ? `₦${pkg.price.toLocaleString()}` : "Bespoke Quote"}
                          </p>
                          {(pkg as any).originalPrice && (
                            <span className="font-body text-xs text-muted line-through">
                              ₦{(pkg as any).originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <ul className="space-y-2.5 font-body text-xs text-brown/90 mb-6">
                          {(pkg.inclusions || []).map((inc: string, i: number) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-line/60 flex items-center justify-between">
                        <span className="font-body text-[11px] text-muted">
                          Turnaround: {pkg.deliveryDaysText}
                        </span>
                        <Link
                          href={`/book?session=${session.slug}&pkg=${pkg.id}`}
                          className="font-body text-xs uppercase tracking-wider font-semibold text-deep hover:text-gold transition-colors"
                        >
                          Select →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. How the Session Works */}
              <section className="space-y-6">
                <span className="font-body text-xs uppercase tracking-[0.2em] text-gold font-semibold block mb-1">
                  Step by Step
                </span>
                <h2 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                  How Your Session Unfolds
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-stagger="true">
                  {[
                    {
                      title: "1. Consultation & Date Selection",
                      desc: "Submit your estimate request. We confirm date availability on our private Abuja studio calendar.",
                    },
                    {
                      title: "2. Gentle Prep & Styling Guidance",
                      desc: "We provide wardrobe recommendations, colour palettes, and tailored guidance for a relaxed experience.",
                    },
                    {
                      title: "3. Session Day in Abuja",
                      desc: "Relax in our private studio with refreshments, gentle music, and gentle guided direction.",
                    },
                    {
                      title: "4. Fine Art Retouching & Delivery",
                      desc: `Your portraits undergo signature colour grading. Delivered via private soft-copy gallery within ${session.standardDeliveryDays}.`,
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="reveal-up p-5 bg-warm-white rounded-lg border border-line flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gold/20 text-deep flex items-center justify-center font-display font-semibold shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-display text-lg text-deep font-medium mb-1">
                          {step.title}
                        </h4>
                        <p className="font-body text-xs sm:text-sm text-brown/80">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Col: Sticky Booking Card & Two-Step Pricing Info */}
            <div className="space-y-8">
              <div className="sticky top-28 bg-warm-white p-7 sm:p-8 rounded-photo border border-line shadow-floating">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
                  Investment Summary
                </span>
                <h3 className="font-display text-3xl text-deep font-normal mb-2">
                  {session.promoPrice && session.promoPrice < (startingPrice || Infinity) ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-muted text-sm uppercase">from</span>
                      <span className="text-deep font-semibold">₦{session.promoPrice.toLocaleString()}</span>
                      {startingPrice && (
                        <span className="text-muted text-base line-through font-normal">
                          ₦{startingPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  ) : startingPrice ? (
                    <>
                      <span className="text-muted text-sm uppercase mr-1">from</span>
                      <span className="text-deep font-semibold">₦{startingPrice.toLocaleString()}</span>
                    </>
                  ) : (
                    "Bespoke Consultation"
                  )}
                </h3>
                <p className="font-body text-xs text-muted mb-6">
                  Turnaround: {standardDelivery} · Deposit: {standardDepositPercent}%
                </p>

                <div className="space-y-3 pt-4 border-t border-line/60 mb-6">
                  <div className="flex items-center gap-2 text-xs text-brown/90">
                    <Clock className="w-4 h-4 text-gold shrink-0" />
                    <span>Standard delivery {standardDelivery}</span>
                  </div>
                  {session.expressDeliveryDays && (
                    <div className="flex items-center gap-2 text-xs text-brown/90">
                      <Sparkles className="w-4 h-4 text-gold shrink-0" />
                      <span>Express delivery available ({session.expressDeliveryDays})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-brown/90">
                    <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                    <span>Non-refundable deposit locks your date</span>
                  </div>
                </div>

                <Link
                  href={`/book?session=${session.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold py-4 rounded-full transition-all shadow-editorial mb-3"
                >
                  <span>Build Itemised Estimate</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </Link>

                <a
                  href={`https://wa.me/2348130847299?text=Hello%20LamSparks,%20I%20am%20interested%20in%20a%20${encodeURIComponent(session.title)}%20session`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 border border-line hover:border-gold text-deep font-body text-xs uppercase tracking-wider font-medium py-3 rounded-full transition-colors"
                >
                  <span>Talk with Osemene First</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 9. Mobile Sticky Bottom Bar (Total / CTA) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-warm-white/95 backdrop-blur-md border-t border-line px-5 py-3.5 flex items-center justify-between shadow-floating">
          <div>
            <span className="font-body text-[10px] uppercase tracking-wider text-muted block">
              Investment
            </span>
            <span className="font-display text-lg font-semibold text-deep">
              {session.fromPrice ? `from ₦${session.fromPrice.toLocaleString()}` : "Bespoke Quote"}
            </span>
          </div>
          <Link
            href={`/book?session=${session.slug}`}
            className="inline-flex items-center gap-2 bg-deep text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-full shadow-editorial"
          >
            <span>Start Booking</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
