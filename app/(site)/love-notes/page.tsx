import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { TestimonialCard } from "@/components/TestimonialCard";

export default function LoveNotesPage() {
  const testimonials = [
    {
      quote: "Osemene has an extraordinary gift with children. My two-year-old was fussy when we arrived, but within ten minutes she had him giggling without any pressure. The portraits on our living room wall bring me to tears every single day.",
      clientFirstName: "Amina",
      sessionType: "Toddler Luxury Session",
      location: "Maitama, Abuja",
    },
    {
      quote: "Carrying my first child was both exhilarating and vulnerable. Osemene made me feel so calm, dignified, and beautiful. There was zero awkwardness, just pure grace. I cannot recommend LamSparks enough to every expectant mother in Abuja.",
      clientFirstName: "Chidinma",
      sessionType: "Maternity Signature Grace",
      location: "Guzape, Abuja",
    },
    {
      quote: "We wanted professional headshots for our corporate advisory firm in Central Area. LamSparks delivered beyond expectations — crisp, authoritative, yet remarkably warm. The entire executive committee was thrilled.",
      clientFirstName: "Tunde",
      sessionType: "Executive & Official Portraits",
      location: "Central Business District, Abuja",
    },
    {
      quote: "The Motherhood Bundle was the best decision we made. Having the maternity session flow directly into the newborn portraits with the same colour grading made our baby album look like an editorial publication.",
      clientFirstName: "Fatima",
      sessionType: "Motherhood Legacy Bundle",
      location: "Asokoro, Abuja",
    },
    {
      quote: "Every detail was taken care of — the studio temperature was warm for my newborn, the gentle music in the background, and the unhurried tea breaks. It felt more like a spa day than a photoshoot.",
      clientFirstName: "Ngozi",
      sessionType: "Newborn Portraits",
      location: "Jabi, Abuja",
    },
    {
      quote: "Covered our daughter's 5th birthday celebration in Abuja. Osemene captured every tiny emotion, the giggles, the grandparents dancing. Truly unobtrusive and deeply gifted.",
      clientFirstName: "Ibrahim",
      sessionType: "Event Coverage",
      location: "Wuse II, Abuja",
    },
  ];

  return (
    <>
      <Nav />
      <main className="flex-1 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        <div className="mt-20 p-8 rounded-photo bg-warm-white border border-line text-center max-w-2xl mx-auto space-y-4">
          <h3 className="font-display text-2xl text-deep font-normal">
            Ready to Experience the LamSparks Rhythm?
          </h3>
          <p className="font-body text-xs sm:text-sm text-muted">
            Plan your personal portrait session with unhurried care.
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-full transition-all"
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
