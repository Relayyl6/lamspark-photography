import React from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
            Legal & Compliance
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-deep font-normal">
            Privacy Notice
          </h1>
          <p className="font-body text-xs text-muted mt-2">
            Compliance with Nigeria Data Protection Act (NDPA) 2023 · Effective October 2026
          </p>
        </div>

        <div className="space-y-8 font-body text-sm sm:text-base text-brown/90 leading-relaxed bg-warm-white p-8 sm:p-10 rounded-photo border border-line shadow-editorial">
          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">1. Introduction & Ownership</h2>
            <p>
              LamSparks Photography (&ldquo;LamSparks&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a bespoke portrait studio located in Abuja, Nigeria, founded by Osemene. We are committed to safeguarding your personal data in full compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">2. Information We Collect</h2>
            <p>
              We collect information you provide directly through our estimate request engine, WhatsApp communications, and session questionnaires:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-brown/80">
              <li>Contact details: Full name, WhatsApp telephone number, email address.</li>
              <li>Session specifics: Milestone purpose, preferred month, child&apos;s name and age (provided and consented to by the parent/guardian).</li>
              <li>Comfort notes: Any quiet preferences or physical requirements to make your studio time pleasant.</li>
              <li>Payment records: Bank transfer reference and screenshot details.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">3. Third-Party Platform Disclosures</h2>
            <p>
              In accordance with our statutory transparency duties:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-brown/80">
              <li>
                <strong>Meta Platforms (WhatsApp &amp; Instagram):</strong> Communications, assistant messages, and estimate reference links pass through Meta&apos;s cloud infrastructure and are subject to Meta&apos;s privacy policies.
              </li>
              <li>
                <strong>Background AI Helpers:</strong> We employ automated background helpers solely to assist human triage of incoming inquiries and to check deposit receipt reference details. <em>Our AI helpers never communicate directly with clients as an AI, never make financial decisions alone, and client personal data is never sold or used to train public machine learning models.</em>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">4. Consent &amp; Image Rights</h2>
            <p>
              Your images are your family&apos;s heirloom. We uphold separate, unbundled consents:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-brown/80">
              <li><strong>Messaging Consent:</strong> Required to deliver your quote, preparation details, and gallery links via WhatsApp.</li>
              <li><strong>Marketing &amp; Portfolio Consent:</strong> We will never post or publish your photographs on our public portfolio or social media channels without your explicit, voluntary consent. You may withdraw this consent at any time.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">5. Your Legal Rights</h2>
            <p>
              Under the NDPA 2023, you have the right to request access to your stored records, request correction, or request deletion (subject to legal and tax retention periods for financial transactions). To exercise your rights, please contact Osemene at <strong>hello@lamsparks.com</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
