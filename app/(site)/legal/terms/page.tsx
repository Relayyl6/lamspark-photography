import React from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default function TermsOfServicePage() {
  return (
    <>
      <Nav />
      <main className="flex-1 py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-2">
            Legal & Compliance
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-deep font-normal">
            Terms of Service
          </h1>
          <p className="font-body text-xs text-muted mt-2">
            Standard Studio Policies · Effective October 2026
          </p>
        </div>

        <div className="space-y-8 font-body text-sm sm:text-base text-brown/90 leading-relaxed bg-warm-white p-8 sm:p-10 rounded-photo border border-line shadow-editorial">
          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">1. Booking & Deposits</h2>
            <p>
              A non-refundable booking deposit (70% standard, or 50% for Maternity collections) is required to secure your appointment on our studio calendar. The remaining balance must be paid in full on or before the session date. No session can proceed without full payment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">2. Rescheduling Policy</h2>
            <p>
              Clients may reschedule their session once with at least <strong>48 hours advance notice</strong> without forfeiting their deposit. Rescheduling requests submitted with less than 48 hours notice forfeit the booking fee and require a new deposit to rebook.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">3. Punctuality & Grace Period</h2>
            <p>
              To maintain our unhurried pacing for all clients, a 30-minute grace period applies to studio arrival. Arrivals beyond the 30-minute grace period incur a ₦10,000 late arrival fee or may result in abbreviated shooting time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-2xl text-deep font-medium">4. Delivery Timelines & Raw Files</h2>
            <p>
              Professionally edited images are delivered digitally via a private soft-copy gallery within the standard timeline for your collection (7–14 working days for Toddler, 10 business days for Maternity, 5–7 business days for Events). Raw or unedited camera files are never provided under any circumstance.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
