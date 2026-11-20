import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export default async function FAQPage() {
  let faqs = [
    {
      q: "Where is the LamSparks studio located?",
      a: "Our private portrait studio is based in Abuja, Nigeria. To preserve a peaceful, unhurried atmosphere for every client, studio visits are strictly by appointment. The exact address and directions are provided upon booking confirmation.",
    },
    {
      q: "What is your deposit and payment policy?",
      a: "To reserve your date on our calendar, a non-refundable booking fee is required (70% standard, or 50% for Maternity collections). The remaining balance is due on or before shoot day. Sessions cannot proceed without balance payment.",
    },
    {
      q: "How long until I receive my edited photographs?",
      a: "Standard editing delivery times are tailored to each collection: Toddler sessions take 7 to 14 working days; Maternity takes 10 business days; and Events take 5 to 7 business days. Express Delivery (3 to 5 business days or 24-48 hours for events) is available as an add-on.",
    },
    {
      q: "What if my child or I need to reschedule?",
      a: "We understand that children get sick and unexpected events happen. We offer one complimentary reschedule when you notify us at least 48 hours prior to your session time. Rescheduling with less than 48 hours notice forfeits the booking fee.",
    },
    {
      q: "Do you supply raw or unedited files?",
      a: "No. Raw files are unfinished digital negatives and do not represent the craftsmanship of LamSparks. Every image delivered to you has undergone master colour grading, exposure balance, and fine-art retouching.",
    },
    {
      q: "What should we wear for our session?",
      a: "Upon booking, we send our gentle Prep Guide outlining recommended colour palettes (earth tones, warm neutrals, soft creams, textures) and advice on coordinating outfits without matchy-matchy uniforms.",
    },
    {
      q: "Will my images be published on social media?",
      a: "Only with your explicit consent! We strictly uphold client dignity and NDPA 2023 privacy rights. If you prefer to keep your portraits private, we honour that completely.",
    },
    {
      q: "Can I bring family members to a toddler or maternity session?",
      a: "Yes! Toddler packages include parents or siblings per collection tier (e.g., Luxury covers siblings and includes a family session). For smaller tiers, additional family members or children can be added transparently via our estimate builder.",
    },
  ];

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const row = await sql.query(
      `SELECT value FROM settings WHERE key = 'site_faqs' LIMIT 1`
    ).catch(() => []);

    if (row.length > 0 && Array.isArray(row[0].value) && row[0].value.length > 0) {
      faqs = row[0].value;
    }
  } catch (err) {
    console.error("[FAQPage DB error]", err);
  }

  return (
    <>
      <Nav />
      <main className="flex-1 py-10 sm:py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 page-enter">
        <div className="text-center mb-10 reveal-down">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-3">
            Clear Guidance
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="font-body text-base text-brown/85 mt-4 leading-relaxed max-w-xl mx-auto">
            Everything you need to know about our unhurried approach, deposit policies, timelines, and studio etiquette in Abuja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6" data-stagger="true">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="reveal-up p-5 sm:p-6 rounded-2xl bg-warm-white/90 backdrop-blur-md border border-gold/30 shadow-editorial hover:shadow-floating transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="font-display text-base sm:text-lg text-deep font-medium leading-snug">
                  {faq.q}
                </h3>
                <p className="font-body text-xs sm:text-sm text-brown/85 mt-2.5 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 p-6 sm:p-8 rounded-photo bg-warm-white/95 border border-gold/40 shadow-editorial text-center max-w-xl mx-auto">
          <h3 className="font-display text-xl sm:text-2xl text-deep font-normal">
            Have a Specific Question?
          </h3>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-2">
            Reach out directly to our Abuja studio concierge on WhatsApp or submit a private session inquiry.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-3 rounded-full transition-all shadow-editorial"
            >
              <span>Contact Concierge</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-cream hover:bg-gold-light/40 text-deep border border-line font-body text-xs uppercase tracking-wider font-semibold px-5 py-3 rounded-full transition-all"
            >
              <span>Build an Estimate</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
