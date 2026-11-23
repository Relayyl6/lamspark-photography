"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  Info,
  Calendar,
  Clock,
  User,
  Heart,
  HelpCircle,
  UploadCloud,
  CheckCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SESSION_TYPES, PACKAGES, ADD_ONS } from "@/lib/catalog/seed";
import { calculateEstimate } from "@/lib/estimate/engine";
import { BookingAnswers, EstimateResult, SessionTypeSlug } from "@/lib/types";

function BookingWizard() {
  const searchParams = useSearchParams();
  const initialSession = (searchParams.get("session") as SessionTypeSlug) || "toddler";
  const initialPkg = searchParams.get("pkg") || undefined;

  // Step state: 1: Session, 2: Person & Feeling, 3: Specifics & Add-ons, 4: Contact, 5: Estimate & WhatsApp
  const [step, setStep] = useState(1);

  // Form answers state
  const [sessionType, setSessionType] = useState<SessionTypeSlug>(initialSession);
  const [packageId, setPackageId] = useState<string>(initialPkg || "");
  const [purpose, setPurpose] = useState("");
  const [feeling, setFeeling] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [additionalFamilyCount, setAdditionalFamilyCount] = useState(0);
  const [additionalChildCount, setAdditionalChildCount] = useState(0);
  const [weeksPregnant, setWeeksPregnant] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [locationType, setLocationType] = useState<"studio" | "outside" | "both">("studio");
  const [preferredMonth, setPreferredMonth] = useState("Next Month");
  const [priorityEditing, setPriorityEditing] = useState(false);
  const [reelsAddon, setReelsAddon] = useState(false);
  const [extraHours, setExtraHours] = useState(0);

  // Contact
  const [clientName, setClientName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Agreement ticks (Hard rule: changing any answer clears price tick!)
  const [priceAgreed, setPriceAgreed] = useState(false);
  const [messagingConsent, setMessagingConsent] = useState(false);
  const [marketingImageConsent, setMarketingImageConsent] = useState(false);

  // Unique reference code (e.g. LS-4F7K)
  const [referenceCode, setReferenceCode] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [depositReportedSuccess, setDepositReportedSuccess] = useState(false);
  const [livePackages, setLivePackages] = useState(PACKAGES);
  const [liveSessions, setLiveSessions] = useState<Record<string, any>>(SESSION_TYPES);

  // Load live packages & session types configured in Studio
  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.packages) && data.packages.length > 0) {
          setLivePackages(data.packages);
        }
        if (Array.isArray(data.sessions) && data.sessions.length > 0) {
          const map: Record<string, any> = {};
          for (const s of data.sessions) {
            map[s.slug] = s;
          }
          setLiveSessions(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Generate reference code on mount
    const code = "LS-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    setReferenceCode(code);
  }, []);

  // Always scroll to top of viewport on step change so the user stays at the top rather than near the footer
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Update default package when sessionType changes
  useEffect(() => {
    const available = livePackages.filter((p) => p.sessionType === sessionType);
    if (available.length > 0 && (!packageId || !available.some((p) => p.id === packageId))) {
      setPackageId(available[0].id);
    }
    // Hard rule: clear price agreement if session changes
    setPriceAgreed(false);
  }, [sessionType, livePackages]);

  // Compute estimate live using the pure engine
  const answers: BookingAnswers = useMemo(
    () => ({
      purpose,
      feeling,
      packageId,
      additionalFamilyCount,
      additionalChildCount,
      weeksPregnant,
      partnerName,
      childName,
      childAge,
      locationType,
      preferredMonth,
      priorityEditing,
      reelsAddon,
      extraHours,
    }),
    [
      purpose,
      feeling,
      packageId,
      additionalFamilyCount,
      additionalChildCount,
      weeksPregnant,
      partnerName,
      childName,
      childAge,
      locationType,
      preferredMonth,
      priorityEditing,
      reelsAddon,
      extraHours,
    ]
  );

  const estimate: EstimateResult = useMemo(() => {
    return calculateEstimate(sessionType, answers, packageId, livePackages, (liveSessions as any)[sessionType]);
  }, [sessionType, answers, packageId, livePackages, liveSessions]);

  const isBespoke = estimate.quoteRequired || estimate.total === 0;

  // Handle any answer change -> clears price agreed state per Hard Rule #5
  function handleAnswerChange<T>(setter: React.Dispatch<React.SetStateAction<T>>, val: T) {
    setter(val);
    setPriceAgreed(false);
  }

  // Normalise phone number to Nigerian format
  function formatNigerianPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      return "+234" + digits.slice(1);
    }
    if (digits.startsWith("234")) {
      return "+" + digits;
    }
    return raw;
  }

  // Save booking directly into Neon DB
  async function submitBookingToDb(uploadedReceiptUrl?: string) {
    if (!clientName.trim() || !whatsappPhone.trim()) return;

    try {
      await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          whatsappPhone: whatsappPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
          sessionType,
          answers,
          referenceCode,
          priceAgreed,
          messagingConsent,
          marketingConsent: marketingImageConsent,
          receiptUrl: uploadedReceiptUrl || receiptUrl || null,
        }),
      });
    } catch (err) {
      console.error("[Booking DB submission error]", err);
    }
  }

  // Upload bank transfer receipt directly from client wizard
  async function handleUploadBookingReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partition", "private");
      formData.append("sessionType", sessionType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.url || data.privateUrl || data.storageKey;

      if (uploadedUrl) {
        setReceiptUrl(uploadedUrl);
        setDepositReportedSuccess(true);
        // Persist booking with attached receipt into DB
        await submitBookingToDb(uploadedUrl);
      } else {
        alert(data.error || "Receipt upload failed");
      }
    } catch (err: any) {
      console.error("Booking receipt upload failed:", err);
      alert("Failed to upload receipt: " + err.message);
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  // Pre-filled WhatsApp message with reference code & answers
  const whatsappUrl = useMemo(() => {
    const businessNumber = "2348130847299"; // LamSparks official studio line (Osemene)
    const text = `Hello LamSparks! I have completed my session estimate online.\n\n` +
      `Reference: ${referenceCode}\n` +
      `Client: ${clientName || "Client"}\n` +
      `Session: ${liveSessions[sessionType]?.title || SESSION_TYPES[sessionType]?.title || sessionType}\n` +
      `Collection: ${estimate.packageName}\n` +
      `Purpose: ${purpose || "Special Milestone"}\n` +
      (feeling ? `Desired Feeling: ${feeling}\n` : "") +
      `Total Estimate: ₦${estimate.total.toLocaleString()}\n` +
      `Required Deposit (${estimate.depositPercent}%): ₦${estimate.depositAmount.toLocaleString()}\n` +
      `Balance on Shoot Day: ₦${estimate.balanceAmount.toLocaleString()}\n` +
      (receiptUrl ? `Transfer Receipt: Attached to my booking profile.\n\n` : `\n`) +
      `I have reviewed the terms and I am ready to confirm my booking with Osemene.`;

    return `https://wa.me/${businessNumber}?text=${encodeURIComponent(text)}`;
  }, [referenceCode, clientName, sessionType, estimate, purpose, feeling, receiptUrl]);

  const talkFirstUrl = useMemo(() => {
    const businessNumber = "2348130847299";
    const text = `Hello Osemene! I am looking at a ${liveSessions[sessionType]?.title || SESSION_TYPES[sessionType]?.title} session (Ref: ${referenceCode}), but I have a few questions before locking my date.`;
    return `https://wa.me/${businessNumber}?text=${encodeURIComponent(text)}`;
  }, [sessionType, referenceCode]);

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between">
      <Nav />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Step Progress Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs font-body uppercase tracking-wider text-muted mb-3">
            <span>Ref: {referenceCode}</span>
            <span>
              Step {step} of 5 · {step === 1 ? "Session" : step === 2 ? "Your Story" : step === 3 ? "Specifics" : step === 4 ? "Contact" : "Estimate"}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-line h-1 rounded-full overflow-hidden">
            <div
              className="bg-gold h-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Choose Session */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-1">
                Step 1 of 5
              </span>
              <h1 className="font-display text-3xl sm:text-5xl text-deep font-normal">
                What kind of session are you planning?
              </h1>
              <p className="font-body text-sm text-brown/80 mt-2">
                Select your category. Starting rates are shown below; your exact estimate will be calculated in the next steps.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(liveSessions).map((st: any) => (
                <button
                  key={st.slug}
                  type="button"
                  onClick={() => {
                    handleAnswerChange(setSessionType, st.slug);
                  }}
                  className={`p-5 rounded-photo text-left border transition-all flex flex-col justify-between ${
                    sessionType === st.slug
                      ? "border-gold bg-warm-white shadow-floating ring-1 ring-gold"
                      : "border-line bg-warm-white/70 hover:bg-warm-white hover:border-gold/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-xl text-deep font-medium">
                        {st.title}
                      </h3>
                      {sessionType === st.slug && (
                        <span className="w-5 h-5 rounded-full bg-gold text-deep flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-brown/80 leading-relaxed mb-3">
                      {st.tagline}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                    <span className="text-muted font-body">
                      {st.fromPrice !== null ? `From ₦${st.fromPrice.toLocaleString()}` : "Bespoke Quote"}
                    </span>
                    <span className="text-gold font-semibold uppercase text-[10px] tracking-wider">
                      Select
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-8 py-3.5 rounded-full transition-all shadow-editorial"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: About the Person (Before Any Price) */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-1">
                Step 2 of 5
              </span>
              <h1 className="font-display text-3xl sm:text-5xl text-deep font-normal">
                Tell us about this celebration
              </h1>
              <p className="font-body text-sm text-brown/80 mt-2">
                At LamSparks, we ask about the heart behind the photographs before money is ever mentioned.
              </p>
            </div>

            <div className="bg-warm-white p-6 sm:p-8 rounded-photo border border-line shadow-editorial space-y-6">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                  What is this session celebrating or for? <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Birthday, Maternity milestone, New career headshots..."
                  value={purpose}
                  onChange={(e) => handleAnswerChange(setPurpose, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep transition-all"
                />
              </div>

              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                  What feeling do you want from the photographs? <span className="text-muted font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Peaceful and regal, full of giggles and warmth, commanding and professional..."
                  value={feeling}
                  onChange={(e) => handleAnswerChange(setFeeling, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-deep hover:text-gold font-body text-xs uppercase tracking-wider font-semibold py-2 px-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!purpose.trim()}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 bg-deep hover:bg-brown disabled:opacity-50 text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-8 py-3.5 rounded-full transition-all shadow-editorial"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Session Specifics & Add-ons */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-1">
                Step 3 of 5
              </span>
              <h1 className="font-display text-3xl sm:text-5xl text-deep font-normal">
                Choose your collection &amp; options
              </h1>
              <p className="font-body text-sm text-brown/80 mt-2">
                Select your preferred collection tier and any additional family members or express options.
              </p>
            </div>

            {/* Collection Tier Picker */}
            <div className="space-y-3">
              <label className="block font-body text-xs uppercase tracking-wider text-gold font-semibold">
                Available Collections for {liveSessions[sessionType]?.title || SESSION_TYPES[sessionType]?.title}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {livePackages.filter((p) => p.sessionType === sessionType).map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => handleAnswerChange(setPackageId, pkg.id)}
                    className={`p-5 rounded-photo border cursor-pointer transition-all ${
                      packageId === pkg.id
                        ? "border-gold bg-warm-white shadow-floating ring-1 ring-gold"
                        : "border-line bg-warm-white/70 hover:bg-warm-white hover:border-gold/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-display text-xl text-deep font-medium">
                        {pkg.name}
                      </h4>
                      <span className="font-body text-sm font-semibold text-deep">
                        ₦{pkg.price?.toLocaleString()}
                      </span>
                    </div>
                    <p className="font-body text-xs text-muted mb-3 line-clamp-2">
                      {pkg.inclusions.join(", ")}
                    </p>
                    <span className="font-body text-[10px] uppercase tracking-wider text-gold font-semibold">
                      {packageId === pkg.id ? "✓ Selected" : "Select Tier"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Specific Inputs */}
            <div className="bg-warm-white p-6 sm:p-8 rounded-photo border border-line shadow-editorial space-y-6">
              {/* Toddler Specifics */}
              {sessionType === "toddler" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                      Child&apos;s Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Zara"
                      value={childName}
                      onChange={(e) => handleAnswerChange(setChildName, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                      Child&apos;s Age / Turning Age
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 year old"
                      value={childAge}
                      onChange={(e) => handleAnswerChange(setChildAge, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                      Additional Siblings/Family (+₦30,000 each)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={additionalFamilyCount}
                      onChange={(e) => handleAnswerChange(setAdditionalFamilyCount, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                      Twins or Multiples (+50% per child)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={additionalChildCount}
                      onChange={(e) => handleAnswerChange(setAdditionalChildCount, parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                    />
                  </div>
                </div>
              )}

              {/* Maternity Specifics */}
              {sessionType === "maternity" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                      Weeks Pregnant (at preferred date)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 30–34 weeks"
                      value={weeksPregnant}
                      onChange={(e) => handleAnswerChange(setWeeksPregnant, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                      Partner Joining Session?
                    </label>
                    <input
                      type="text"
                      placeholder="Partner's first name"
                      value={partnerName}
                      onChange={(e) => handleAnswerChange(setPartnerName, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                    />
                  </div>
                </div>
              )}

              {/* Location & Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                    Location Preference
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => handleAnswerChange(setLocationType, e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                  >
                    <option value="studio">Private Abuja Studio (Default)</option>
                    <option value="outside">Outdoor / On Location in Abuja</option>
                    <option value="both">Both Studio &amp; Outdoor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                    Preferred Timeframe
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Late this month, next month weekend..."
                    value={preferredMonth}
                    onChange={(e) => handleAnswerChange(setPreferredMonth, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep"
                  />
                </div>
              </div>

              {/* Common Add-on Toggles */}
              <div className="pt-4 border-t border-line space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priorityEditing}
                    onChange={(e) => handleAnswerChange(setPriorityEditing, e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-line text-gold focus:ring-gold"
                  />
                  <div>
                    <span className="font-body text-xs font-semibold text-deep block">
                      Express Priority Delivery (+₦30,000)
                    </span>
                    <span className="font-body text-xs text-muted block">
                      Expedites fine-art editing turnaround to 3–5 business days (or 24–48 hours for events).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reelsAddon}
                    onChange={(e) => handleAnswerChange(setReelsAddon, e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-line text-gold focus:ring-gold"
                  />
                  <div>
                    <span className="font-body text-xs font-semibold text-deep block">
                      Short Cinematic Content Reels (+₦{sessionType === "event" ? "200,000" : "150,000"})
                    </span>
                    <span className="font-body text-xs text-muted block">
                      2 professionally edited vertical video reels delivered digitally for Instagram/TikTok.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 text-deep hover:text-gold font-body text-xs uppercase tracking-wider font-semibold py-2 px-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-8 py-3.5 rounded-full transition-all shadow-editorial"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Name & Contact Details */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-1">
                Step 4 of 5
              </span>
              <h1 className="font-display text-3xl sm:text-5xl text-deep font-normal">
                How should Osemene address you?
              </h1>
              <p className="font-body text-sm text-brown/80 mt-2">
                Your WhatsApp number is where your personal estimate, prep guide, and private gallery will be sent.
              </p>
            </div>

            <div className="bg-warm-white p-6 sm:p-8 rounded-photo border border-line shadow-editorial space-y-6">
              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                  Full Name <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina Bello"
                  value={clientName}
                  onChange={(e) => handleAnswerChange(setClientName, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep transition-all"
                />
              </div>

              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                  WhatsApp Number <span className="text-gold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0813 084 7299 or +234..."
                  value={whatsappPhone}
                  onChange={(e) => handleAnswerChange(setWhatsappPhone, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep transition-all"
                />
                <span className="font-body text-[11px] text-muted block mt-1">
                  Nigerian formats normalized automatically. We never share your phone number.
                </span>
              </div>

              <div>
                <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-2">
                  Email Address <span className="text-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="amina@example.com"
                  value={clientEmail}
                  onChange={(e) => handleAnswerChange(setClientEmail, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-cream/40 focus:bg-warm-white focus:outline-none focus:border-gold font-body text-sm text-deep transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 text-deep hover:text-gold font-body text-xs uppercase tracking-wider font-semibold py-2 px-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!clientName.trim() || !whatsappPhone.trim()}
                onClick={() => setStep(5)}
                className="inline-flex items-center gap-2 bg-deep hover:bg-brown disabled:opacity-50 text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-8 py-3.5 rounded-full transition-all shadow-editorial"
              >
                <span>View My Estimate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Itemised Estimate, Agreement & WhatsApp Hand-off */}
        {step === 5 && (
          <div className="space-y-8 animate-fade-up">
            <div>
              <span className="font-body text-xs uppercase tracking-[0.24em] text-gold font-semibold block mb-1">
                Step 5 of 5 · Official Estimate
              </span>
              <h1 className="font-display text-3xl sm:text-5xl text-deep font-normal">
                Your Personal Session Estimate
              </h1>
              <p className="font-body text-sm text-brown/80 mt-2">
                Valid for 7 days (Ref: {referenceCode}). Every line item is transparently itemised below.
              </p>
            </div>

            {/* Itemised Breakdown Card */}
            <div className="bg-warm-white p-6 sm:p-10 rounded-photo border border-line shadow-floating space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-line">
                <div>
                  <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block">
                    Collection Selected
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-deep font-normal">
                    {estimate.packageName}
                  </h3>
                  <span className="font-body text-xs text-muted block mt-0.5">
                    Prepared for {clientName} · {liveSessions[sessionType]?.title || SESSION_TYPES[sessionType]?.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted block">
                    Reference
                  </span>
                  <span className="font-mono text-sm font-bold text-deep">
                    {referenceCode}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-4">
                <span className="font-body text-xs uppercase tracking-wider text-gold font-semibold block">
                  Itemised Inclusions
                </span>
                <div className="divide-y divide-line/60">
                  {estimate.lineItems.map((item) => (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-body text-sm font-semibold text-deep">
                          {item.label}
                        </h4>
                        {item.detail && (
                          <p className="font-body text-xs text-muted mt-0.5">
                            {item.detail}
                          </p>
                        )}
                      </div>
                      <span className="font-body text-sm font-bold text-deep shrink-0">
                        {item.amount > 0 ? `₦${item.amount.toLocaleString()}` : "Included / Bespoke"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Deposit Breakdown: Dual-mode for Fixed Packages vs Bespoke Consultations */}
              {isBespoke ? (
                <div className="bg-cream/60 p-6 rounded-lg border border-line/80 space-y-3">
                  <div className="flex items-center justify-between font-body text-base sm:text-lg font-bold text-deep">
                    <span>Investment Scope:</span>
                    <span className="font-display text-xl sm:text-2xl font-semibold text-gold">
                      Custom Proposal
                    </span>
                  </div>
                  <div className="pt-2 text-xs font-body text-brown/90 leading-relaxed border-t border-line/60">
                    Because bespoke commissions (executive delegations, diplomatic bilaterals, weddings, and multi-day celebrations) require personalized logistical curation, pricing and deliverables are personally tailored by Osemene upon enquiry review.
                  </div>
                  <div className="pt-1 text-[11px] font-mono text-muted">
                    No initial deposit is required today. Deposit &amp; payment schedule will be established upon quote approval.
                  </div>
                </div>
              ) : (
                <div className="bg-cream/60 p-6 rounded-lg border border-line/80 space-y-3">
                  <div className="flex items-center justify-between font-body text-base sm:text-lg font-bold text-deep">
                    <span>Total Investment:</span>
                    <span className="font-display text-2xl sm:text-3xl font-semibold">
                      ₦{estimate.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-line/80 flex items-center justify-between font-body text-xs sm:text-sm text-brown">
                    <span>
                      Non-Refundable Booking Deposit ({estimate.depositPercent}% to secure date):
                    </span>
                    <span className="font-semibold text-deep">
                      ₦{estimate.depositAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-body text-xs sm:text-sm text-brown">
                    <span>Balance Due on Shoot Day (30%):</span>
                    <span className="font-semibold text-deep">
                      ₦{estimate.balanceAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 text-[11px] text-muted font-body leading-relaxed border-t border-line/40">
                    {estimate.termsNote}
                  </div>
                </div>
              )}

              {/* Hard Rules Agreement Checkboxes */}
              <div className="pt-4 border-t border-line space-y-4">
                <label className="flex items-start gap-3 cursor-pointer bg-warm-white p-3 rounded-lg border border-line hover:border-gold/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={priceAgreed}
                    onChange={(e) => setPriceAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-line text-gold focus:ring-gold"
                  />
                  <div>
                    <span className="font-body text-sm font-semibold text-deep block">
                      {isBespoke ? (
                        <>
                          &ldquo;I confirm my details for this bespoke consultation request.&rdquo; <span className="text-gold">*</span>
                        </>
                      ) : (
                        <>
                          &ldquo;This price looks right to me.&rdquo; <span className="text-gold">*</span>
                        </>
                      )}
                    </span>
                    <span className="font-body text-xs text-muted block">
                      {isBespoke
                        ? "Confirms your dates, location, and coverage requirements are accurate for proposal drafting."
                        : "Confirms you have reviewed the itemised breakdown. (Note: changing any answer clears this tick)."}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer bg-warm-white p-3 rounded-lg border border-line hover:border-gold/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={messagingConsent}
                    onChange={(e) => setMessagingConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-line text-gold focus:ring-gold"
                  />
                  <div>
                    <span className="font-body text-sm font-semibold text-deep block">
                      Agree to receive WhatsApp communications for this booking <span className="text-gold">*</span>
                    </span>
                    <span className="font-body text-xs text-muted block">
                      Required for quote delivery, gentle prep guidance, and gallery link notifications via Meta&apos;s platform.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={marketingImageConsent}
                    onChange={(e) => setMarketingImageConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-line text-gold focus:ring-gold"
                  />
                  <div>
                    <span className="font-body text-xs font-medium text-brown/90 block">
                      Optional: Consent to feature selected photographs in LamSparks&apos; private portfolio
                    </span>
                    <span className="font-body text-[11px] text-muted block">
                      Unticked by default. We strictly respect privacy; you may withdraw at any time.
                    </span>
                  </div>
                </label>
              </div>

              {/* Bespoke Roadmap OR Direct Bank Transfer Details */}
              {isBespoke ? (
                <div className="pt-6 border-t border-line">
                  <div className="bg-warm-white p-5 sm:p-6 rounded-photo border border-line shadow-sm space-y-4">
                    <span className="font-body text-[10px] uppercase tracking-wider text-gold font-bold block">
                      Bespoke Concierge Workflow
                    </span>
                    <h4 className="font-display text-lg text-deep font-semibold">What Happens Next</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body">
                      <div className="bg-cream/60 p-3.5 rounded-xl border border-line/60 space-y-1">
                        <span className="w-5 h-5 rounded-full bg-gold/20 text-deep text-[11px] font-mono font-bold flex items-center justify-center">1</span>
                        <strong className="text-deep font-semibold block pt-1">Brief Review</strong>
                        <p className="text-muted text-[11px] leading-relaxed">Osemene personally reviews your date availability, venue logistics, and photographic vision.</p>
                      </div>
                      <div className="bg-cream/60 p-3.5 rounded-xl border border-line/60 space-y-1">
                        <span className="w-5 h-5 rounded-full bg-gold/20 text-deep text-[11px] font-mono font-bold flex items-center justify-center">2</span>
                        <strong className="text-deep font-semibold block pt-1">Custom Quote</strong>
                        <p className="text-muted text-[11px] leading-relaxed">You receive a formal, itemised proposal on WhatsApp or Email within 24 hours.</p>
                      </div>
                      <div className="bg-cream/60 p-3.5 rounded-xl border border-line/60 space-y-1">
                        <span className="w-5 h-5 rounded-full bg-gold/20 text-deep text-[11px] font-mono font-bold flex items-center justify-center">3</span>
                        <strong className="text-deep font-semibold block pt-1">Date Securing</strong>
                        <p className="text-muted text-[11px] leading-relaxed">Lock your date securely on the atelier calendar with the agreed deposit once approved.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Direct Bank Transfer Details Card */}
                  <div className="pt-6 border-t border-line">
                    <div className="bg-warm-white p-5 sm:p-6 rounded-photo border border-line shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-line">
                        <div>
                          <span className="font-body text-[10px] uppercase tracking-wider text-gold font-semibold block">
                            Direct Bank Transfer
                          </span>
                          <h4 className="font-display text-lg text-deep font-medium">Studio Deposit Account</h4>
                        </div>
                        <span className="text-xs font-semibold text-deep bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
                          ₦{estimate.depositAmount.toLocaleString()} Due
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body">
                        <div className="bg-cream/60 p-3 rounded-lg border border-line/60">
                          <span className="text-muted block text-[10px] uppercase tracking-wider">Bank</span>
                          <strong className="text-deep font-semibold text-sm">Fidelity Bank</strong>
                        </div>
                        <div className="bg-cream/60 p-3 rounded-lg border border-line/60">
                          <span className="text-muted block text-[10px] uppercase tracking-wider">Account Number</span>
                          <strong className="text-deep font-semibold text-sm tracking-wider">5601662438</strong>
                        </div>
                        <div className="bg-cream/60 p-3 rounded-lg border border-line/60">
                          <span className="text-muted block text-[10px] uppercase tracking-wider">Account Name</span>
                          <strong className="text-deep font-semibold text-xs leading-snug block">Lamsparks Photography</strong>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted font-body">
                        Please use reference <strong className="text-deep">{referenceCode}</strong> in the transfer remarks. Once transferred, you can share your receipt on WhatsApp or upload it directly below.
                      </p>
                    </div>
                  </div>

                  {/* Client Receipt Upload Zone */}
                  <div className="pt-4 border-t border-line/60">
                    <div className="p-5 rounded-2xl bg-[#F8F5F0] border border-line space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-body text-[10px] uppercase tracking-wider text-gold font-bold block">
                            Direct Receipt Upload (Optional or Immediate)
                          </span>
                          <h4 className="font-display text-base text-deep font-semibold">
                            Already completed your transfer?
                          </h4>
                        </div>
                        {depositReportedSuccess && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Deposit Reported</span>
                          </span>
                        )}
                      </div>

                      {depositReportedSuccess && receiptUrl ? (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-body text-emerald-900 space-y-2">
                          <p className="font-semibold">
                            ✓ Proof of transfer received for Ref: {referenceCode}.
                          </p>
                          <p className="text-[11px] text-emerald-800 leading-relaxed">
                            Your deposit has entered the LamSparks Studio Verification Queue. Our team will verify it directly against our Fidelity Bank statement and confirm your date.
                          </p>
                          <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-deep hover:text-gold font-semibold underline pt-1">
                            <span>Upload a different receipt screenshot</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingReceipt}
                              className="hidden"
                              onChange={handleUploadBookingReceipt}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-xs font-body text-brown/85 leading-relaxed max-w-md">
                            Upload your bank transfer screenshot now to fast-track date verification, or share it directly on WhatsApp.
                          </p>
                          <label className="cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-deep hover:bg-gold hover:text-deep text-warm-white text-xs font-body font-semibold transition-all shadow-sm shrink-0 text-center">
                            {isUploadingReceipt ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gold" />
                            ) : (
                              <UploadCloud className="w-4 h-4 text-gold" />
                            )}
                            <span>{isUploadingReceipt ? "Uploading..." : "Upload Transfer Receipt"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingReceipt}
                              className="hidden"
                              onChange={handleUploadBookingReceipt}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Hand-off Action Buttons */}
              <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <a
                  href={priceAgreed && messagingConsent ? whatsappUrl : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full sm:flex-1 inline-flex items-center justify-center gap-3 py-3.5 sm:py-4 px-5 rounded-xl sm:rounded-full font-body text-xs uppercase tracking-wider font-semibold shadow-editorial transition-all text-center ${
                    priceAgreed && messagingConsent
                      ? "bg-deep hover:bg-brown text-warm-white"
                      : "bg-line text-muted cursor-not-allowed opacity-60"
                  }`}
                  onClick={(e) => {
                    if (!priceAgreed || !messagingConsent) {
                      e.preventDefault();
                      alert("Please check both 'This price looks right to me' and the WhatsApp messaging consent box to continue.");
                      return;
                    }
                    submitBookingToDb();
                  }}
                >
                  <MessageCircle className="w-4 h-4 text-gold shrink-0" />
                  <span>Continue to WhatsApp ({referenceCode})</span>
                </a>

                {/* Talk with Osemene first */}
                <a
                  href={talkFirstUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-line hover:border-gold text-deep font-body text-xs uppercase tracking-wider font-medium px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-full transition-colors whitespace-nowrap text-center"
                >
                  <span>Talk with Osemene First</span>
                </a>
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 text-deep hover:text-gold font-body text-xs uppercase tracking-wider font-semibold py-2 px-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Edit Details</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Total Bar on Step 1–4 */}
      {step < 5 && (
        <div className="lg:hidden sticky bottom-0 z-40 bg-warm-white/95 backdrop-blur-md border-t border-line px-5 py-3 flex items-center justify-between shadow-floating">
          <div>
            <span className="font-body text-[10px] uppercase tracking-wider text-muted block">
              Estimated Total
            </span>
            <span className="font-display text-lg font-semibold text-deep">
              ₦{estimate.total.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(5, prev + 1))}
            className="inline-flex items-center gap-2 bg-deep text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-full shadow-editorial"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-serif">Loading booking studio...</div>}>
      <BookingWizard />
    </Suspense>
  );
}
