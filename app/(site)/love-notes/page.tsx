import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { TestimonialCard } from "@/components/TestimonialCard";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export default async function LoveNotesPage() {
  let testimonials: Array<{
    quote: string;
    clientFirstName: string;
    sessionType: string;
    location: string;
  }> = [];

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const settingsRow = await sql.query(
      `SELECT value FROM settings WHERE key = 'site_testimonials' LIMIT 1`
    ).catch(() => []);

    if (settingsRow.length > 0 && Array.isArray(settingsRow[0].value) && settingsRow[0].value.length > 0) {
      testimonials = settingsRow[0].value.map((t: any) => ({
        quote: t.quote,
        clientFirstName: t.clientName || t.firstName || "Anonymous Client",
        sessionType: t.headline || "Atelier Session",
        location: t.roleOrLocation || "Abuja, Nigeria",
      }));
    } else {
      const tableRows = await sql.query(
        `SELECT id, first_name, session_type, quote, context FROM testimonial WHERE active = true ORDER BY created_at DESC`
      ).catch(() => []);

      if (tableRows.length > 0) {
        testimonials = tableRows.map((t: any) => ({
          quote: t.quote,
          clientFirstName: t.first_name,
          sessionType: t.session_type,
          location: t.context || "Abuja",
        }));
      }
    }
  } catch (err) {
    console.error("[LoveNotesPage error]", err);
  }

  return (
    <>
      <Nav />
      <main className="flex-1 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16 reveal-down">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-3">
            Social Proof & Words of Warmth
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-deep font-normal leading-tight">
            Client Love Notes
          </h1>
          <p className="font-body text-base text-brown/85 mt-4 leading-relaxed">
            Real feedback from clients who have stepped into our Abuja studio or welcomed us to document their celebrations. Published strictly with client consent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" data-stagger="true">
          {testimonials.map((t, idx) => (
            <TestimonialCard
              key={idx}
              quote={t.quote}
              clientFirstName={t.clientFirstName}
              sessionType={t.sessionType}
              location={t.location}
            />
          ))}
        </div>

        <div className="mt-20 p-8 sm:p-10 rounded-photo bg-warm-white border border-line shadow-editorial max-w-3xl mx-auto text-center">
          <span className="font-body text-xs uppercase tracking-[0.2em] text-gold font-semibold block mb-1">
            Experience the Unhurried Studio
          </span>
          <h3 className="font-display text-2xl sm:text-3xl text-deep font-normal mt-1">
            Ready to Create Your Own Family Heirlooms?
          </h3>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-2 max-w-lg mx-auto">
            Step into our serene Abuja studio. Reserve your date on our calendar or build your tailored estimate in minutes.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-full transition-all shadow-editorial"
            >
              <span>Build Your Estimate</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <Link
              href="/sessions"
              className="inline-flex items-center gap-2 bg-cream hover:bg-gold-light/40 text-deep border border-line font-body text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-full transition-all"
            >
              <span>View Collections</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
