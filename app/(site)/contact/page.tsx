"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Instagram,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import type { SessionTypeSlug } from "@/lib/types";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    sessionType: "toddler" as SessionTypeSlug,
    timeframe: "Next Month",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Live Studio Open/Closed & West Africa Time (WAT = UTC+1) status
  const [studioStatus, setStudioStatus] = useState<{
    isOpen: boolean;
    currentTimeWAT: string;
  }>({
    isOpen: true,
    currentTimeWAT: "12:00 WAT",
  });

  useEffect(() => {
    function computeWAT() {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Africa/Lagos",
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
          hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const hourPart = parts.find((p) => p.type === "hour");
        const minPart = parts.find((p) => p.type === "minute");
        const dayPart = parts.find((p) => p.type === "weekday");

        const hour = hourPart ? parseInt(hourPart.value, 10) : 12;
        const min = minPart ? minPart.value : "00";
        const day = dayPart ? dayPart.value : "Mon";

        // Open Mon-Sat 09:00 - 18:00 WAT
        const isSunday = day === "Sun";
        const isWithinHours = hour >= 9 && hour < 18;
        const open = !isSunday && isWithinHours;

        setStudioStatus({
          isOpen: open,
          currentTimeWAT: `${hour.toString().padStart(2, "0")}:${min} WAT`,
        });
      } catch {
        // Fallback default
        setStudioStatus({
          isOpen: true,
          currentTimeWAT: "09:00 – 18:00 WAT",
        });
      }
    }

    computeWAT();
    const timer = setInterval(computeWAT, 30000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.fullName.trim(),
          whatsappPhone: formData.phone.trim(),
          clientEmail: formData.email.trim() || undefined,
          sessionType: formData.sessionType,
          answers: {
            purpose: formData.sessionType,
            preferredMonth: formData.timeframe,
            notes: formData.message.trim(),
          },
          source: "Website Concierge",
          messagingConsent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to submit inquiry at this time.");
      }

      setReferenceCode(data?.referenceCode || `LS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
      setIsSent(true);
    } catch (err: any) {
      // Graceful fallback to avoid client anxiety
      setErrorMessage(
        err?.message || "There was a momentary connection issue. You can also reach our concierge directly on WhatsApp."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyReference() {
    if (referenceCode) {
      navigator.clipboard.writeText(referenceCode);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#121110] overflow-y-auto">
      <Nav />
      <main className="flex-1 text-warm-white px-4 sm:px-6 lg:px-8 relative py-6 sm:py-10">
        {/* Subtle Background Grain Texture */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.7) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col flex-1">          

          {/* Main 2-Column Split Editorial Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start flex-1">
            {/* Left Column: Headline, Editorial Copy, Studio Concierge Details */}
            <div className="lg:col-span-6 space-y-5 sm:space-y-10 reveal-down">
              {/* Bold Editorial Headline with Red Accent Bar */}
              <div>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight uppercase leading-[0.92] text-warm-white">
                  <span className="flex items-center gap-4 sm:gap-6 mt-1 sm:mt-2">
                    <span>GET</span>
                    <span className="h-1.5 sm:h-2 w-16 sm:w-28 bg-red-600 inline-block shadow-sm" />
                    <span>IN TOUCH</span>
                  </span>
                </h1>
              </div>

              {/* Studio Information Grid */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                {/* Contact Direct */}
                <div className="space-y-3">
                  <span className="block font-mono text-xs uppercase tracking-widest text-red-400 font-semibold">
                    // CONTACT INFO //
                  </span>
                  <div className="font-body text-sm text-warm-white/90 space-y-1.5">
                    <a
                      href="tel:+2348130847299"
                      className="block font-medium hover:text-gold transition-colors"
                    >
                      +234 813 084 7299
                    </a>
                    <a
                      href="mailto:concierge@lamsparks.com"
                      className="block text-warm-white/60 hover:text-gold text-xs pt-1 transition-colors"
                    >
                      concierge@lamsparks.com
                    </a>
                  </div>
                </div>

                {/* Studio Location */}
                <div className="space-y-3">
                  <span className="block font-mono text-xs uppercase tracking-widest text-red-400 font-semibold">
                    // FIND US //
                  </span>
                  <div className="font-body text-sm text-warm-white/90 space-y-1.5">
                    <p className="font-medium">Maitama Studio Suite</p>
                    <p className="text-warm-white/80">Maitama District, Abuja</p>
                    <p className="text-warm-white/60 text-xs">
                      Federal Capital Territory, Nigeria
                    </p>
                    <p className="text-gold text-xs pt-0.5 font-mono uppercase tracking-wider">
                      By Private Appointment Only
                    </p>
                  </div>
                </div>
              </div>

              {/* Studio Hours with Live WAT Indicator */}
              <div className="pt-3 border-t border-white/10 space-y-2 hidden sm:block">
                <span className="block font-mono text-xs uppercase tracking-widest text-red-400 font-semibold">
                  // STUDIO WORKING HOURS //
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body text-sm text-warm-white/90">
                  <div className="space-y-1">
                    <p className="font-medium">09:00 – 18:00 WAT</p>
                    <p className="text-xs text-warm-white/60">
                      Monday through Saturday (West Africa Time, UTC+1)
                    </p>
                  </div>

                  {/* Live Studio Open/Closed Badge */}
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono shrink-0">
                    {studioStatus.isOpen ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-emerald-400 font-medium">Studio Open</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                        <span className="text-amber-300 font-medium">Studio Closed · Opens 09:00</span>
                      </>
                    )}
                    <span className="text-white/30">•</span>
                    <span className="text-warm-white/70">{studioStatus.currentTimeWAT}</span>
                  </div>
                </div>
              </div>

              {/* Direct Concierge WhatsApp Link & Social Community */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <span className="block font-mono text-xs uppercase tracking-widest text-red-400 font-semibold">
                  // DIRECT CONCIERGE ACCESS //
                </span>
                <div className="flex flex-col sm:flex-row items-stretch justify-between sm:items-center gap-4">
                  {/* WhatsApp Direct Link Button */}
                  <a
                    href="https://wa.me/2348130847299?text=Hello%20LamSparks%20Concierge%2C%20I%20would%20like%20to%20inquire%20about%20booking%20a%20portrait%20session."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-5 py-3 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 text-warm-white hover:text-emerald-300 transition-all group font-body text-xs uppercase tracking-wider font-medium"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>WhatsApp Direct Concierge</span>
                  </a>

                  {/* Social Channel Icons */}
                  <div className="hidden sm:flex items-center gap-2">
                    <a
                      href="https://instagram.com/lamsparksphotography"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-warm-white hover:text-gold transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-warm-white hover:text-gold transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-warm-white hover:text-gold transition-colors"
                      aria-label="Twitter / X"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                    <a
                      href="mailto:concierge@lamsparks.com"
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-warm-white hover:text-gold transition-colors"
                      aria-label="Email Studio"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Refined Dark Luxury Inquiry Form */}
            <div className="lg:col-span-6">
              <div className="reveal-up delay-100 bg-[#181615]/95 backdrop-blur-2xl p-4 sm:p-6 rounded-photo border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Thin Red Accent Border Line across the top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />

                {isSent ? (
                  /* Success Confirmation Screen */
                  <div className="py-10 text-center space-y-6 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-3xl text-warm-white font-medium">
                        Inquiry Received
                      </h3>
                      <p className="font-body text-xs sm:text-sm text-warm-white/75 max-w-sm mx-auto leading-relaxed">
                        Thank you, {formData.fullName}. Osemene and the studio concierge team will review your inquiry and follow up via WhatsApp within 2–4 studio hours.
                      </p>
                    </div>

                    {/* Reference Code Card with Copy */}
                    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs">
                      <span className="text-warm-white/50 uppercase tracking-widest">Reference:</span>
                      <span className="text-gold font-semibold tracking-wider">{referenceCode}</span>
                      <button
                        type="button"
                        onClick={handleCopyReference}
                        className="p-1 rounded hover:bg-white/10 text-warm-white/60 hover:text-warm-white transition-colors"
                        aria-label="Copy reference code"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Fast WhatsApp Continuity CTA */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href={`https://wa.me/2348130847299?text=${encodeURIComponent(
                          `Hello LamSparks Concierge, I just submitted an inquiry (${referenceCode}) for a ${formData.sessionType} session.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-body text-xs uppercase tracking-wider font-semibold transition-colors shadow-pill"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Continue on WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSent(false);
                          setFormData({
                            fullName: "",
                            phone: "",
                            email: "",
                            sessionType: "toddler",
                            timeframe: "Next Month",
                            message: "",
                          });
                        }}
                        className="w-full sm:w-auto font-body text-xs uppercase tracking-wider text-warm-white/60 hover:text-warm-white px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        Submit another inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Concierge Inquiry Form */
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl text-warm-white font-medium">
                        Studio Concierge Inquiry
                      </h2>
                      <p className="font-body text-xs sm:text-sm text-warm-white/60 mt-1">
                        Tell us about your envisioned portrait session or event.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-body leading-relaxed">
                        {errorMessage}
                      </div>
                    )}

                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block font-body text-xs uppercase tracking-wider text-warm-white/80 font-medium mb-1"
                      >
                        Full Name *
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                        placeholder="e.g. Amara Okafor"
                        className="w-full px-4 py-2 rounded-lg bg-[#23201e] border border-white/10 text-warm-white placeholder:text-warm-white/30 font-body text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors py-2"
                      />
                    </div>

                    {/* WhatsApp Phone & Email Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block font-body text-xs uppercase tracking-wider text-warm-white/80 font-medium mb-1"
                        >
                          WhatsApp Phone *
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="0813 084 7299"
                          className="w-full px-4 py-2 rounded-lg bg-[#23201e] border border-white/10 text-warm-white placeholder:text-warm-white/30 font-body text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors py-2"
                        />
                        <span className="block text-[11px] text-warm-white/40 mt-1">
                          For quotation delivery via WhatsApp
                        </span>
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block font-body text-xs uppercase tracking-wider text-warm-white/80 font-medium mb-1"
                        >
                          Email Address
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="amara@example.com"
                          className="w-full px-4 py-2 rounded-lg bg-[#23201e] border border-white/10 text-warm-white placeholder:text-warm-white/30 font-body text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors py-2"
                        />
                        <span className="block text-[11px] text-warm-white/40 mt-1">
                          Optional receipt & schedule copy
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:block gap-4 sm:space-y-4">
                      <div>
                        <label
                          htmlFor="sessionType"
                          className="block font-body text-xs uppercase tracking-wider text-warm-white/80 font-medium mb-1"
                        >
                          Session of Interest *
                        </label>
                        <div className="relative">
                          <select
                            id="sessionType"
                            value={formData.sessionType}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                sessionType: e.target.value as SessionTypeSlug,
                              }))
                            }
                            className="w-full px-4 py-2 rounded-lg bg-[#23201e] border border-white/10 text-warm-white font-body text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors appearance-none cursor-pointer"
                          >
                            <option value="toddler">Toddler & Children Studio Session</option>
                            <option value="maternity">Maternity & Motherhood Collection</option>
                            <option value="motherhood-bundle">
                              Motherhood Signature Bundle (Maternity + Toddler)
                            </option>
                            <option value="newborn">Newborn & Fresh 48 Session</option>
                            <option value="family">Family & Generational Portrait</option>
                            <option value="couple">Couple & Intimate Portrait</option>
                            <option value="official-portrait">Official Portraits & Headshots</option>
                            <option value="wedding">Weddings & Milestone Events</option>
                            <option value="not-sure">Bespoke Commission / Consultation</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-warm-white/60">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Desired Timeframe / Month */}
                      <div>
                        <label
                          htmlFor="timeframe"
                          className="block font-body text-xs uppercase tracking-wider text-warm-white/80 font-medium mb-1"
                        >
                          Desired Timeframe / Month *
                        </label>
                        <div className="relative">
                          <select
                            id="timeframe"
                            value={formData.timeframe}
                            onChange={(e) => setFormData((prev) => ({ ...prev, timeframe: e.target.value }))}
                            className="w-full px-4 py-2 rounded-lg bg-[#23201e] border border-white/10 text-warm-white font-body text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors appearance-none cursor-pointer"
                          >
                            <option value="This Month (Immediate / Urgent)">This Month (Immediate / Urgent)</option>
                            <option value="Next Month">Next Month</option>
                            <option value="Within 2–3 Months">Within 2–3 Months</option>
                            <option value="Later this Year">Later this Year</option>
                            <option value="Specific Date (Please note below)">Specific Date (Please note below)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-warm-white/60">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message / Notes */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block font-body text-xs uppercase tracking-wider text-warm-white/80 font-medium mb-1"
                      >
                        Message / Vision Notes *
                      </label>
                      <textarea
                        id="message"
                        rows={3}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your envisioned session, who will be joining, milestone dates, or specific aesthetic wishes..."
                        className="w-full px-4 py-2 rounded-lg bg-[#23201e] border border-white/10 text-warm-white placeholder:text-warm-white/30 font-body text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors py-2"
                      />
                    </div>

                    {/* Submit Button (White rectangular button + red arrow box from reference) */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group inline-flex items-center justify-between w-full sm:w-auto gap-4 bg-warm-white hover:bg-gold text-deep font-body text-xs uppercase tracking-wider font-semibold pl-6 pr-2 py-2 rounded-lg transition-all duration-300 shadow-floating disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <span>{isSubmitting ? "Submitting Inquiry..." : "Send message"}</span>
                        <span className="w-8 h-8 rounded-md bg-red-600 text-warm-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
