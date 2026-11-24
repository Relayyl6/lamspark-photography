"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import type { SessionTypeSlug } from "@/lib/types";

interface SiteFaq {
  q: string;
  a: string;
}

interface ConciergeContent {
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  hours: string;
  faqs: SiteFaq[];
}

const DEFAULT_CONTENT: ConciergeContent = {
  phone: "+234 816 789 2044",
  email: "concierge@lamsparks.com",
  whatsapp: "+234 816 789 2044",
  address: "Suite 402, Maitama Executive Atelier, Maitama, Abuja, Nigeria",
  hours: "Tuesday – Saturday: 9:00 AM – 6:30 PM (WAT) · Sunday by Appointment",
  faqs: [
    {
      q: "How far in advance should we reserve our session?",
      a: "We recommend reserving 2 to 4 weeks in advance for weekend studio portraiture and maternity milestones, and 2 to 6 months in advance for weddings and major celebrations to ensure your preferred date is held.",
    },
    {
      q: "How does the 2-Hour Slot Hold work?",
      a: "When you select an available slot on our live calendar, it is held exclusively for you for 2 hours while you complete your deposit or share your payment receipt. If unpaid after 2 hours, it returns automatically to the live calendar.",
    },
    {
      q: "Where is the LamSparks studio located?",
      a: "Our private daylight atelier is nestled in Maitama, Abuja. Upon confirming your reservation, our concierge sends you private gate access directions, reserved parking details, and our pre-shoot styling lookbook.",
    },
    {
      q: "Do you offer wardrobe styling or makeup services?",
      a: "Yes. Our signature packages include access to our private atelier dressing suite, complimentary vanity prep time, and direct coordination with Abuja's top editorial makeup artists.",
    },
    {
      q: "What is your rescheduling and cancellation policy?",
      a: "We understand that family life and milestone schedules evolve. You may reschedule your session up to 48 hours prior to your shoot without penalty using your unique LamSparks reference code.",
    },
  ],
};

const SESSION_OPTIONS: Array<{ slug: SessionTypeSlug; label: string }> = [
  { slug: "toddler", label: "Toddler & First Steps Milestone" },
  { slug: "maternity", label: "Maternity & Motherhood" },
  { slug: "motherhood-bundle", label: "Motherhood Heirloom Bundle" },
  { slug: "family", label: "Family Heritage Portraiture" },
  { slug: "wedding", label: "Weddings & Nuptial Celebrations" },
  { slug: "event", label: "Events & High-Profile Milestones" },
  { slug: "individual-portrait", label: "Individual Portrait Suite" },
  { slug: "official-portrait", label: "Official & Executive Portrait" },
  { slug: "not-sure", label: "Concierge Consultation / Bespoke Request" },
];

export default function ContactPage() {
  const [content, setContent] = useState<ConciergeContent>(DEFAULT_CONTENT);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form State
  const [clientName, setClientName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sessionType, setSessionType] = useState<SessionTypeSlug>("maternity");
  const [preferredMonth, setPreferredMonth] = useState("Immediate (Next 14 Days)");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Hydrate live content from Neon DB
  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.content) {
          const c = data.content;
          setContent((prev) => ({
            phone: c.concierge_phone_primary || prev.phone,
            email: c.concierge_email || prev.email,
            whatsapp: c.concierge_whatsapp || c.concierge_phone_primary || prev.whatsapp,
            address: c.studio_address || prev.address,
            hours: c.studio_hours || prev.hours,
            faqs:
              Array.isArray(c.site_faqs) && c.site_faqs.length > 0
                ? c.site_faqs
                : prev.faqs,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!clientName.trim() || !whatsappPhone.trim()) {
      setSubmitError("Please provide your name and WhatsApp telephone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          whatsappPhone: whatsappPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
          sessionType,
          answers: {
            purpose: purpose.trim() || "Milestone Concierge Consultation",
            preferredMonth,
            notes: `Submitted via Atelier Concierge page. Preferred timing: ${preferredMonth}`,
          },
          source: "Atelier Contact Concierge",
          messagingConsent: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to transmit inquiry to our concierge.");
      }

      setReferenceCode(data.referenceCode);
    } catch (err: any) {
      setSubmitError(err?.message || "Something went wrong. Please reach out via WhatsApp directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const cleanWhatsappDigits = content.whatsapp.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanWhatsappDigits || "2348167892044"}?text=${encodeURIComponent(
    `Hello LamSparks Concierge, I would like to inquire regarding portrait reservations.`
  )}`;

  const copyRefToClipboard = () => {
    if (!referenceCode) return;
    navigator.clipboard.writeText(referenceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-deep flex flex-col selection:bg-gold/25 selection:text-deep overflow-x-clip">
      {/* Editorial Navigation Bar */}
      <Nav />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-12 pb-16 sm:pb-24">
        {/* Top Editorial Oversized Header (Inspired by high-fashion atelier editorial layout) */}
        <div className="relative pt-2 sm:pt-6 pb-6 sm:pb-10 border-b border-deep/10">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-2">
            <span className="font-body text-[11px] sm:text-xs uppercase tracking-[0.28em] text-gold font-bold">
              Atelier Concierge · Abuja Studio
            </span>
            <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-muted font-body">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Studio Desk Open · West Africa Time (WAT)</span>
            </div>
          </div>

          {/* Colossal Display Title */}
          <h1 className="font-headline text-5xl sm:text-7xl md:text-8xl lg:text-[clamp(76px,10vw,144px)] font-black uppercase tracking-tight text-deep leading-[0.88] select-none break-words">
            CONTACT US
          </h1>

          <p className="mt-4 sm:mt-6 font-display italic text-lg sm:text-2xl text-deep/75 max-w-2xl font-light">
            Every timeless portrait begins with an unhurried conversation. Tell us your milestone, and our concierge will curate your bespoke session.
          </p>
        </div>

        {/* Main 2-Column Architectural Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-8 sm:pt-12 items-start">
          
          {/* LEFT COLUMN: Studio Directory, Hours & FAQ Accordion (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-12 sm:space-y-16">
            
            {/* Quick Navigation Action Row */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#inquiry-form"
                className="px-4 py-2.5 rounded-full bg-deep text-warm-white hover:bg-gold hover:text-deep font-body text-xs font-semibold tracking-wider uppercase transition-all duration-200 inline-flex items-center gap-2"
              >
                <span>Send Direct Note</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <Link
                href="/book"
                className="px-4 py-2.5 rounded-full border border-deep/20 hover:border-gold hover:text-gold font-body text-xs font-semibold tracking-wider uppercase transition-all duration-200 inline-flex items-center gap-1.5"
              >
                <span>View Live Calendar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-body text-xs font-semibold tracking-wider uppercase transition-all duration-200 inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Instant WhatsApp</span>
              </a>
            </div>

            {/* Atelier Studio Details Directory (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 pt-2 border-t border-deep/10">
              
              {/* Directory 01: Direct Concierge Line */}
              <div className="space-y-2">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-muted font-bold block">
                  01 / Direct Concierge
                </span>
                <h3 className="font-display text-xl sm:text-2xl text-deep font-normal">
                  Telephone & WhatsApp
                </h3>
                <p className="font-body text-xs text-muted leading-relaxed">
                  Direct telephone concierge for rapid date reservations, milestone inquiries, and styling prep.
                </p>
                <div className="pt-2 space-y-1.5">
                  <a
                    href={`tel:${content.phone.replace(/\s+/g, "")}`}
                    className="font-body text-sm font-semibold text-deep hover:text-gold transition-colors inline-flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{content.phone}</span>
                  </a>
                  <div>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-xs text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-2 font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Chat with Studio Concierge (Active)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Directory 02: Private Atelier Suite */}
              <div className="space-y-2">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-muted font-bold block">
                  02 / Atelier Suite
                </span>
                <h3 className="font-display text-xl sm:text-2xl text-deep font-normal">
                  Abuja Studio Location
                </h3>
                <p className="font-body text-xs text-muted leading-relaxed">
                  Private daylight daylight studio with dedicated client vanity dressing suites and secure parking.
                </p>
                <div className="pt-2">
                  <div className="font-body text-xs sm:text-sm text-deep/90 flex items-start gap-2 leading-snug">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                    <span>{content.address}</span>
                  </div>
                  <span className="font-body text-[11px] text-muted block mt-1">
                    Strictly by advance confirmed reservation
                  </span>
                </div>
              </div>

              {/* Directory 03: Written Correspondence */}
              <div className="space-y-2">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-muted font-bold block">
                  03 / Press & Inquiries
                </span>
                <h3 className="font-display text-xl sm:text-2xl text-deep font-normal">
                  Electronic Mail
                </h3>
                <p className="font-body text-xs text-muted leading-relaxed">
                  For heirloom commissions, corporate brand photography, commercial licenses, and collaborations.
                </p>
                <div className="pt-2">
                  <a
                    href={`mailto:${content.email}`}
                    className="font-body text-sm font-semibold text-deep hover:text-gold transition-colors inline-flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{content.email}</span>
                  </a>
                </div>
              </div>

              {/* Directory 04: Studio Hours & Pacing */}
              <div className="space-y-2">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-muted font-bold block">
                  04 / Atelier Hours
                </span>
                <h3 className="font-display text-xl sm:text-2xl text-deep font-normal">
                  Studio Schedule
                </h3>
                <p className="font-body text-xs text-muted leading-relaxed">
                  Sessions are paced with generous time buffers to ensure parents, toddlers, and couples never rush.
                </p>
                <div className="pt-2">
                  <div className="font-body text-xs sm:text-sm text-deep/90 flex items-start gap-2 leading-snug">
                    <Clock className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                    <span>{content.hours}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Architectural FAQ Section */}
            <div className="pt-8 border-t border-deep/10">
              <div className="mb-6 sm:mb-8">
                <span className="font-body text-[10px] uppercase tracking-[0.24em] text-gold font-bold block mb-1">
                  Answers for Discerning Clients
                </span>
                <h2 className="font-headline text-2xl sm:text-3xl text-deep uppercase tracking-wide">
                  FREQUENTLY ASKED QUESTIONS
                </h2>
              </div>

              <div className="divide-y divide-deep/10 border-y border-deep/10">
                {content.faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="transition-colors">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="w-full py-4 sm:py-5 flex items-center justify-between gap-4 text-left group min-h-[44px]"
                      >
                        <span className="font-display text-base sm:text-lg text-deep group-hover:text-gold transition-colors font-medium">
                          {faq.q}
                        </span>
                        <div
                          className={`w-7 h-7 rounded-full border border-deep/15 group-hover:border-gold flex items-center justify-center shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180 bg-gold/10 text-gold" : "text-deep/60"
                          }`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="pb-5 pt-1 pr-6 font-body text-xs sm:text-sm text-muted leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Editorial Studio Portrait + Atelier Concierge Inquiry Form (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            
            {/* Editorial Tall Portrait Card */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] bg-deep/5 border border-deep/10 shadow-sm group">
              <img
                src="/images/client/weddings_3.jpg"
                alt="LamSparks Photography Atelier Abuja"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-deep/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 text-warm-white">
                <span className="font-body text-[10px] uppercase tracking-[0.22em] text-gold font-bold block mb-1">
                  Unhurried Atelier Craft
                </span>
                <p className="font-display italic text-lg sm:text-xl font-light leading-snug">
                  “Dignity, melanin tonal nuance, and memories that outlive us.”
                </p>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-warm-white/70 font-body">
                  Maitama Suite · Abuja, Nigeria
                </div>
              </div>
            </div>

            {/* Atelier Concierge Inquiry Card */}
            <div
              id="inquiry-form"
              className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-deep/10 p-5 sm:p-8 shadow-[0_12px_40px_rgba(26,20,16,0.06)] scroll-mt-24"
            >
              {referenceCode ? (
                /* Success State */
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-deep">
                      Inquiry Received
                    </h3>
                    <p className="font-body text-xs text-muted mt-1 max-w-sm mx-auto">
                      Our concierge desk has received your details and will connect with you via WhatsApp shortly to finalize your date.
                    </p>
                  </div>

                  <div className="bg-[#FAF7F2] border border-gold/30 rounded-xl p-4 max-w-xs mx-auto">
                    <span className="font-body text-[10px] uppercase tracking-widest text-muted block mb-1">
                      Your Reference Code
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-display text-2xl font-bold text-deep tracking-wider">
                        {referenceCode}
                      </span>
                      <button
                        type="button"
                        onClick={copyRefToClipboard}
                        className="p-1.5 rounded-md hover:bg-gold/15 text-muted hover:text-deep transition-colors"
                        aria-label="Copy reference code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {copiedCode && (
                      <span className="text-[10px] text-emerald-600 block mt-1">
                        Copied to clipboard!
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href={`https://wa.me/${cleanWhatsappDigits || "2348167892044"}?text=${encodeURIComponent(
                        `Hello LamSparks Concierge, I just submitted an inquiry with reference code [${referenceCode}].`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-body text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Speed Up via WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setReferenceCode(null);
                        setClientName("");
                        setPurpose("");
                      }}
                      className="text-xs text-muted hover:text-deep transition-colors underline pt-2"
                    >
                      Submit Another Note
                    </button>
                  </div>
                </div>
              ) : (
                /* Inquiry Form */
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div>
                    <div className="flex items-center gap-1.5 text-gold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="font-body text-[10px] uppercase tracking-[0.24em] font-bold">
                        Bespoke Concierge Desk
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl text-deep">
                      Inquire or Commission a Session
                    </h3>
                    <p className="font-body text-xs text-muted leading-relaxed mt-0.5">
                      Share your vision with our atelier team. We reply within 2 studio hours.
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      {submitError}
                    </div>
                  )}

                  {/* Client Full Name */}
                  <div>
                    <label
                      htmlFor="clientName"
                      className="block font-body text-[11px] uppercase tracking-wider font-semibold text-deep mb-1"
                    >
                      Your Full Name *
                    </label>
                    <input
                      id="clientName"
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Amina Bello or Dr. & Mrs. Adeleke"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-deep/15 bg-white text-deep placeholder:text-muted/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all min-h-[44px]"
                    />
                  </div>

                  {/* WhatsApp Telephone */}
                  <div>
                    <label
                      htmlFor="whatsappPhone"
                      className="block font-body text-[11px] uppercase tracking-wider font-semibold text-deep mb-1"
                    >
                      WhatsApp Telephone *
                    </label>
                    <input
                      id="whatsappPhone"
                      type="tel"
                      required
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="e.g. 0816 789 2044"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-deep/15 bg-white text-deep placeholder:text-muted/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all min-h-[44px]"
                    />
                  </div>

                  {/* Client Email (Optional) */}
                  <div>
                    <label
                      htmlFor="clientEmail"
                      className="block font-body text-[11px] uppercase tracking-wider font-semibold text-deep mb-1"
                    >
                      Email Address (Optional)
                    </label>
                    <input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. amina@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-deep/15 bg-white text-deep placeholder:text-muted/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all min-h-[44px]"
                    />
                  </div>

                  {/* Session Type Select */}
                  <div>
                    <label
                      htmlFor="sessionType"
                      className="block font-body text-[11px] uppercase tracking-wider font-semibold text-deep mb-1"
                    >
                      Session Category *
                    </label>
                    <select
                      id="sessionType"
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value as SessionTypeSlug)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-deep/15 bg-white text-deep text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all min-h-[44px]"
                    >
                      {SESSION_OPTIONS.map((opt) => (
                        <option key={opt.slug} value={opt.slug}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Timing */}
                  <div>
                    <label
                      htmlFor="preferredMonth"
                      className="block font-body text-[11px] uppercase tracking-wider font-semibold text-deep mb-1"
                    >
                      Intended Timeline
                    </label>
                    <select
                      id="preferredMonth"
                      value={preferredMonth}
                      onChange={(e) => setPreferredMonth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-deep/15 bg-white text-deep text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all min-h-[44px]"
                    >
                      <option value="Immediate (Next 14 Days)">Immediate (Next 14 Days)</option>
                      <option value="Next 30 Days">Next 30 Days</option>
                      <option value="In 2 to 3 Months">In 2 to 3 Months</option>
                      <option value="Later this Year">Later this Year</option>
                      <option value="Flexible / Undecided">Flexible / Undecided</option>
                    </select>
                  </div>

                  {/* Purpose / Milestone Notes */}
                  <div>
                    <label
                      htmlFor="purpose"
                      className="block font-body text-[11px] uppercase tracking-wider font-semibold text-deep mb-1"
                    >
                      Tell Us About Your Milestone
                    </label>
                    <textarea
                      id="purpose"
                      rows={3}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. 1st Birthday Milestone with family, celebrating 30 weeks maternity, or private studio headshot."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-deep/15 bg-white text-deep placeholder:text-muted/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-deep hover:bg-gold text-warm-white hover:text-deep font-body text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm disabled:opacity-50 disabled:pointer-events-none min-h-[48px] flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span>Transmitting Inquiry...</span>
                    ) : (
                      <>
                        <span>Submit Atelier Inquiry</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-muted text-center font-body">
                    By submitting, our concierge team will reach out to you via WhatsApp. We never share your contact details.
                  </p>
                </form>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Deep Organic Editorial Footer */}
      <Footer />
    </div>
  );
}
