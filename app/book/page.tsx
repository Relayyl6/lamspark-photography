"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  AlertCircle,
  Heart,
  User,
  Film,
  Zap,
  MapPin,
  FileCheck2,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SESSION_TYPES, PACKAGES } from "@/lib/catalog/seed";
import { calculateEstimate } from "@/lib/estimate/engine";
import { BookingAnswers, EstimateResult, SessionTypeSlug } from "@/lib/types";

// Standard LamSparks atelier shoot time slots
const TIME_SLOTS = [
  { id: "09:30 AM", label: "09:30 AM", period: "Morning" },
  { id: "11:00 AM", label: "11:00 AM", period: "Morning" },
  { id: "01:30 PM", label: "01:30 PM", period: "Afternoon" },
  { id: "03:00 PM", label: "03:00 PM", period: "Afternoon" },
  { id: "04:30 PM", label: "04:30 PM", period: "Afternoon" },
  { id: "05:30 PM", label: "05:30 PM", period: "Evening (Golden Hour)" },
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function downloadIcsFile(event: {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
}) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LamSparks Photography//Bespoke Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:lamsparks-${Date.now()}@lamsparks.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `lamsparks-session.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getGoogleCalendarUrl(event: {
  title: string;
  description?: string;
  details?: string;
  location: string;
  startDate: Date;
  endDate: Date;
}) {
  const detailText = event.description || event.details || "";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${formatDate(event.startDate)}/${formatDate(event.endDate)}&details=${encodeURIComponent(
    detailText
  )}&location=${encodeURIComponent(event.location)}`;
}

function BookingWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const refParam = searchParams.get("ref");
  const initialSession = (searchParams.get("session") as SessionTypeSlug) || "toddler";
  const initialPkg = searchParams.get("pkg") || undefined;

  // Step state: 1: Package, 2: Date & Time, 3: Your Details & Shoot Operability, 4: Deposit & Time Held
  const [step, setStep] = useState(1);

  // Core selections
  const [sessionType, setSessionType] = useState<SessionTypeSlug>(initialSession);
  const [packageId, setPackageId] = useState<string>(initialPkg || "");
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD
  const [timeSlot, setTimeSlot] = useState<string>("");

  // Client contact
  const [clientName, setClientName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Prior flow specifics for photographer operability
  const [purpose, setPurpose] = useState("");
  const [feeling, setFeeling] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [additionalFamilyCount, setAdditionalFamilyCount] = useState(0);
  const [additionalChildCount, setAdditionalChildCount] = useState(0);
  const [weeksPregnant, setWeeksPregnant] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [locationType, setLocationType] = useState<"studio" | "outside" | "both">("studio");
  const [priorityEditing, setPriorityEditing] = useState(false);
  const [reelsAddon, setReelsAddon] = useState(false);
  const [extraHours, setExtraHours] = useState(0);
  const [notes, setNotes] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [portfolioConsent, setPortfolioConsent] = useState(false);

  // Dynamic packages & session overrides from DB
  const [livePackages, setLivePackages] = useState(PACKAGES);
  const [liveSessions, setLiveSessions] = useState<Record<string, any>>(SESSION_TYPES);

  // Booking management / status state
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Modals for self-serve management
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);

  // Receipt upload & AI check state
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptReported, setReceiptReported] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  // Calendar month state
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // 1. Fetch live sessions & packages configured in Studio
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

  // 2. If ref parameter is present, load the existing revisitable booking
  useEffect(() => {
    if (!refParam) return;

    setIsLoadingBooking(true);
    fetch(`/api/booking?ref=${encodeURIComponent(refParam)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.booking) {
          setActiveBooking(data.booking);
          setSessionType(data.booking.sessionType || "toddler");
          setClientName(data.booking.client?.name || "");
          setWhatsappPhone(data.booking.client?.whatsapp || "");
          setClientEmail(data.booking.client?.email || "");
          if (data.booking.payment?.receiptUrl) {
            setReceiptUrl(data.booking.payment.receiptUrl);
            setReceiptReported(true);
          }
          if (data.booking.payment?.aiCheck) {
            setAiAnalysisResult(data.booking.payment.aiCheck);
          }
        }
      })
      .catch((err) => console.error("Failed to load booking:", err))
      .finally(() => setIsLoadingBooking(false));
  }, [refParam]);

  // Keep package selection valid when sessionType changes
  useEffect(() => {
    const available = livePackages.filter((p) => p.sessionType === sessionType);
    if (available.length > 0 && (!packageId || !available.some((p) => p.id === packageId))) {
      setPackageId(available[0].id);
    }
  }, [sessionType, livePackages, packageId]);

  // Scroll to top on step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Available packages for current session
  const currentPackages = useMemo(() => {
    return livePackages.filter((p) => p.sessionType === sessionType);
  }, [livePackages, sessionType]);

  const selectedPackage = useMemo(() => {
    return currentPackages.find((p) => p.id === packageId) || currentPackages[0] || null;
  }, [currentPackages, packageId]);

  // Comprehensive answers object feeding both estimate engine & photographer shoot sheet
  const bookingAnswers: BookingAnswers = useMemo(
    () => ({
      purpose: purpose || notes || `${liveSessions[sessionType]?.title || sessionType} Session`,
      feeling: feeling || undefined,
      packageId: selectedPackage?.id,
      childName: childName || undefined,
      childAge: childAge || undefined,
      additionalFamilyCount,
      additionalChildCount,
      weeksPregnant: weeksPregnant || undefined,
      partnerName: partnerName || undefined,
      locationType,
      priorityEditing,
      reelsAddon,
      extraHours,
      selectedDate,
      timeSlot,
      notes,
    }),
    [
      purpose,
      feeling,
      notes,
      liveSessions,
      sessionType,
      selectedPackage,
      childName,
      childAge,
      additionalFamilyCount,
      additionalChildCount,
      weeksPregnant,
      partnerName,
      locationType,
      priorityEditing,
      reelsAddon,
      extraHours,
      selectedDate,
      timeSlot,
    ]
  );

  const estimate: EstimateResult = useMemo(() => {
    return calculateEstimate(
      sessionType,
      bookingAnswers,
      selectedPackage?.id,
      livePackages,
      (liveSessions as any)[sessionType]
    );
  }, [sessionType, bookingAnswers, selectedPackage, livePackages, liveSessions]);

  // Calendar Helpers
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfWeek = useMemo(() => {
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7; // Monday = 0
  }, [year, month]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const monthName = useMemo(() => {
    return currentCalendarDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  }, [currentCalendarDate]);

  // Create booking in database
  async function handleCreateBooking() {
    if (!clientName.trim() || !whatsappPhone.trim() || !selectedDate || !timeSlot) {
      alert("Please ensure your name, WhatsApp phone number, shoot date, and time slot are selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          whatsappPhone: whatsappPhone.trim(),
          clientEmail: clientEmail.trim() || undefined,
          sessionType,
          selectedDate,
          timeSlot,
          answers: {
            ...bookingAnswers,
            packageName: selectedPackage?.name,
          },
          priceAgreed: true,
          messagingConsent: true,
          marketingConsent: portfolioConsent,
        }),
      });

      const data = await res.json();
      if (data.success && data.referenceCode) {
        // Re-query booking to get canonical record
        const detailRes = await fetch(`/api/booking?ref=${encodeURIComponent(data.referenceCode)}`);
        const detailData = await detailRes.json();
        if (detailData.success && detailData.booking) {
          setActiveBooking(detailData.booking);
        } else {
          setActiveBooking({
            referenceCode: data.referenceCode,
            status: "awaiting_deposit",
            sessionType,
            shootStart: `${selectedDate} ${timeSlot}`,
            client: { name: clientName, whatsapp: whatsappPhone, email: clientEmail },
            estimate,
            answers: bookingAnswers,
            holdExpiresAt: data.holdExpiresAt,
          });
        }
        // Update URL to make it a revisitable page
        router.replace(`/book?ref=${data.referenceCode}`, { scroll: false });
        setStep(4);
      } else {
        alert(data.error || "Failed to reserve slot. Please try again.");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      alert("An unexpected error occurred. Please contact studio directly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Reschedule
  async function handleReschedule() {
    if (!activeBooking?.referenceCode || !selectedDate || !timeSlot) {
      alert("Please pick a new date and time slot.");
      return;
    }

    setIsUpdatingBooking(true);
    try {
      const res = await fetch("/api/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceCode: activeBooking.referenceCode,
          action: "reschedule",
          newDate: selectedDate,
          newTimeSlot: timeSlot,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRescheduleOpen(false);
        // Refresh booking
        const refresh = await fetch(`/api/booking?ref=${encodeURIComponent(activeBooking.referenceCode)}`);
        const refData = await refresh.json();
        if (refData.success) {
          setActiveBooking(refData.booking);
        }
        alert("Your session has been successfully rescheduled!");
      } else {
        alert(data.error || "Could not reschedule at this time.");
      }
    } catch (err: any) {
      alert("Reschedule failed: " + err.message);
    } finally {
      setIsUpdatingBooking(false);
    }
  }

  // Handle Cancel Booking
  async function handleCancelBooking() {
    if (!activeBooking?.referenceCode) return;

    setIsUpdatingBooking(true);
    try {
      const res = await fetch("/api/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceCode: activeBooking.referenceCode,
          action: "cancel",
          reason: cancelReason || "Cancelled by client",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCancelModalOpen(false);
        const refresh = await fetch(`/api/booking?ref=${encodeURIComponent(activeBooking.referenceCode)}`);
        const refData = await refresh.json();
        if (refData.success) {
          setActiveBooking(refData.booking);
        }
      } else {
        alert(data.error || "Could not cancel booking.");
      }
    } catch (err: any) {
      alert("Cancellation failed: " + err.message);
    } finally {
      setIsUpdatingBooking(false);
    }
  }

  // Direct Receipt Upload with AI Parsing & Accounting Check
  async function handleUploadReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeBooking?.referenceCode) return;

    setIsUploadingReceipt(true);
    try {
      const targetDeposit = activeBooking.estimate?.depositAmount || estimate.depositAmount;
      const targetTotal = activeBooking.estimate?.total || estimate.total;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("partition", "private");
      formData.append("sessionType", activeBooking.sessionType || sessionType);
      formData.append("referenceCode", activeBooking.referenceCode);
      formData.append("expectedDeposit", String(targetDeposit));
      formData.append("totalAmount", String(targetTotal));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.url || data.privateUrl || data.storageKey;

      if (uploadedUrl) {
        setReceiptUrl(uploadedUrl);
        setReceiptReported(true);

        const aiCheckData = data.aiCheck || null;
        if (aiCheckData) {
          setAiAnalysisResult(aiCheckData);
        }

        // Report deposit to DB with AI verification metadata
        await fetch("/api/booking", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referenceCode: activeBooking.referenceCode,
            action: "report_deposit",
            receiptUrl: uploadedUrl,
            aiCheck: aiCheckData,
            amountExpected: targetDeposit,
            amountRecorded: aiCheckData?.extractedAmount || null,
            bankReference: aiCheckData?.reference || activeBooking.referenceCode,
          }),
        });

        // Refresh booking
        const refresh = await fetch(`/api/booking?ref=${encodeURIComponent(activeBooking.referenceCode)}`);
        const refData = await refresh.json();
        if (refData.success && refData.booking) {
          setActiveBooking(refData.booking);
          if (refData.booking.payment?.aiCheck) {
            setAiAnalysisResult(refData.booking.payment.aiCheck);
          }
        }
      } else {
        alert(data.error || "Receipt upload failed.");
      }
    } catch (err: any) {
      alert("Failed to upload receipt: " + err.message);
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  // WhatsApp Pre-filled Fallback Handoff
  const whatsappUrl = useMemo(() => {
    const businessNumber = "2348130847299"; // LamSparks Studio Line (Osemene)
    const ref = activeBooking?.referenceCode || "LS-REF";
    const name = activeBooking?.client?.name || clientName || "Client";
    const sessionTitle = liveSessions[activeBooking?.sessionType || sessionType]?.title || sessionType;
    const pkgName = activeBooking?.answers?.packageName || selectedPackage?.name || "Collection";
    const depositAmt = (activeBooking?.estimate?.depositAmount || estimate.depositAmount).toLocaleString();
    const totalAmt = (activeBooking?.estimate?.total || estimate.total).toLocaleString();

    let shootInfo = "";
    if (activeBooking?.shootStart) {
      const d = new Date(activeBooking.shootStart);
      shootInfo = `Shoot Date: ${d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}\n`;
    } else if (selectedDate && timeSlot) {
      shootInfo = `Shoot Date: ${selectedDate} at ${timeSlot}\n`;
    }

    const text =
      `Hello LamSparks Studio! I have held my session online.\n\n` +
      `Booking Ref: ${ref}\n` +
      `Client: ${name}\n` +
      `Session: ${sessionTitle}\n` +
      `Package: ${pkgName}\n` +
      shootInfo +
      `Deposit (${activeBooking?.estimate?.depositPercent || estimate.depositPercent}%): ₦${depositAmt}\n` +
      `Total Investment: ₦${totalAmt}\n\n` +
      (receiptReported || receiptUrl
        ? `I have uploaded my bank transfer receipt for verification.\n`
        : `I am transferring the deposit now and sharing my receipt screenshot here.\n`) +
      `Looking forward to confirming our date with Osemene!`;

    return `https://wa.me/${businessNumber}?text=${encodeURIComponent(text)}`;
  }, [activeBooking, clientName, liveSessions, sessionType, selectedPackage, estimate, selectedDate, timeSlot, receiptReported, receiptUrl]);

  // Calendar Event Data for Google & .ics
  const calendarEvent = useMemo(() => {
    let startDate = new Date();
    let endDate = new Date(startDate.getTime() + 7200000);

    const shootStart = activeBooking?.shootStart;
    if (shootStart) {
      startDate = new Date(shootStart);
      endDate = new Date(startDate.getTime() + 7200000);
    } else if (selectedDate && timeSlot) {
      const [y, m, d] = selectedDate.split("-").map((n) => parseInt(n, 10));
      startDate = new Date(y, m - 1, d, 11, 0, 0);
      endDate = new Date(startDate.getTime() + 7200000);
    }

    const sessionTitle = liveSessions[activeBooking?.sessionType || sessionType]?.title || "Photography Session";
    const ref = activeBooking?.referenceCode || "LS-BOOKING";

    return {
      title: `LamSparks: ${sessionTitle} (Ref: ${ref})`,
      description: `Bespoke photography session with LamSparks Photography (Osemene). Studio deposit confirmed. Booking Ref: ${ref}. Location: Private Abuja Studio.`,
      location: "LamSparks Private Studio, Abuja, Nigeria",
      startDate,
      endDate,
    };
  }, [activeBooking, sessionType, selectedDate, timeSlot, liveSessions]);

  // Full shareable booking link
  const shareableBookingUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const ref = activeBooking?.referenceCode || refParam || "";
    return `${window.location.origin}/book?ref=${encodeURIComponent(ref)}`;
  }, [activeBooking, refParam]);

  const isExistingBookingView = Boolean(activeBooking && activeBooking.referenceCode);

  return (
    <div className="min-h-screen bg-[#F8F4EE] flex flex-col justify-between text-[#1A1410] font-sans">
      <Nav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* Loading existing booking state */}
        {isLoadingBooking && (
          <div className="p-16 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A96E] mx-auto" />
            <p className="font-serif text-lg text-[#1A1410]">Retrieving your session booking...</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REVISITABLE BOOKING PAGE / TIME HELD CONFIRMATION                         */}
        {/* ========================================================================= */}
        {!isLoadingBooking && isExistingBookingView && (
          <div className="space-y-8 animate-fade-up">
            {/* Top Breadcrumb & Status Pill */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5DECF]">
              <div className="flex items-center gap-2 text-xs font-medium text-[#6E6359]">
                <Link href="/" className="hover:text-[#1A1410] transition-colors">
                  LamSparks
                </Link>
                <span>/</span>
                <span className="text-[#1A1410]">Booking Ref: {activeBooking.referenceCode}</span>
              </div>

              {/* Status Pill */}
              <div>
                {activeBooking.status === "cancelled" ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-700 border border-stone-300">
                    <span className="w-2 h-2 rounded-full bg-stone-500" />
                    Cancelled
                  </span>
                ) : activeBooking.status === "confirmed" ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Confirmed &amp; Secured
                  </span>
                ) : activeBooking.status === "reported" || receiptReported ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    Deposit Reported · Verification in Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Awaiting Deposit
                  </span>
                )}
              </div>
            </div>

            {/* Cancelled Banner */}
            {activeBooking.status === "cancelled" ? (
              <div className="p-6 rounded-2xl bg-[#FDFBF8] border border-stone-300 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-serif text-2xl sm:text-3xl text-[#1A1410]">
                      Your booking is cancelled
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6E6359] mt-0.5">
                      Session Ref: {activeBooking.referenceCode} has been released.
                    </p>
                  </div>
                </div>
                {activeBooking.closedReason && (
                  <p className="text-xs text-[#6E6359] bg-[#F8F4EE] p-3 rounded-lg border border-[#E5DECF]">
                    <strong>Reason:</strong> {activeBooking.closedReason}
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    href="/book"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1410] hover:bg-[#C9A96E] hover:text-[#1A1410] text-[#FDFBF8] text-xs uppercase tracking-wider font-semibold transition-all shadow-sm"
                  >
                    <span>Book a new session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Greeting & Time Held Header */}
                <div className="space-y-2">
                  <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal leading-tight">
                    Your time is held,{" "}
                    <span className="italic font-serif text-[#C9A96E]">
                      {activeBooking.client?.name || clientName || "Friend"}
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-[#6E6359]">
                    {activeBooking.status === "confirmed"
                      ? "Your date and studio time slot are officially locked on Osemene's calendar."
                      : "We have temporarily reserved your slot. Complete your deposit transfer below to confirm your date."}
                  </p>
                </div>

                {/* Hold Deadline Alert (when awaiting deposit) */}
                {activeBooking.status !== "confirmed" && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs uppercase tracking-wider font-bold text-amber-900 block">
                          Slot Held Temporarily
                        </span>
                        <p className="text-xs sm:text-sm text-amber-800">
                          Reserved for you for 2 hours. Please transfer your deposit to lock this session.
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-block font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-200/60 text-amber-900">
                      {activeBooking?.estimate?.depositPercent || estimate.depositPercent}% Deposit Required
                    </span>
                  </div>
                )}

                {/* 2-Column Details & Payment Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                  {/* Left Column: Payment & Deposit Steps with AI Verification */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Step 1: Studio Bank Account Details */}
                    <div className="p-6 rounded-2xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5DECF]">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1A1410] text-[#FDFBF8] text-xs font-mono font-bold flex items-center justify-center">
                            1
                          </span>
                          <h3 className="font-serif text-lg text-[#1A1410] font-semibold">
                            Transfer Deposit to Studio Account
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#1A1410] bg-[#C9A96E]/20 px-3 py-1 rounded-full border border-[#C9A96E]/40">
                          ₦{(activeBooking.estimate?.depositAmount || estimate.depositAmount).toLocaleString()} Due
                        </span>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DECF] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#6E6359] uppercase tracking-wider block font-sans">
                              Bank Name
                            </span>
                            <span className="text-sm font-bold text-[#1A1410]">Fidelity Bank</span>
                          </div>
                          <span className="text-[11px] text-[#6E6359] font-sans">Nigeria</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DECF] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#6E6359] uppercase tracking-wider block font-sans">
                              Account Number
                            </span>
                            <span className="text-base font-bold text-[#1A1410] tracking-wider">
                              5601662438
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard("5601662438", "account")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1410] text-[#FDFBF8] text-[11px] font-sans font-semibold hover:bg-[#C9A96E] hover:text-[#1A1410] transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copyFeedback === "account" ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DECF] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#6E6359] uppercase tracking-wider block font-sans">
                              Account Name
                            </span>
                            <span className="text-xs font-bold text-[#1A1410] font-sans">
                              Lamsparks Photography
                            </span>
                          </div>
                          <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DECF] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#6E6359] uppercase tracking-wider block font-sans">
                              Transfer Remarks / Reference
                            </span>
                            <span className="text-sm font-bold text-[#1A1410]">
                              {activeBooking.referenceCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeBooking.referenceCode, "ref")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1410] text-[#FDFBF8] text-[11px] font-sans font-semibold hover:bg-[#C9A96E] hover:text-[#1A1410] transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copyFeedback === "ref" ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#6E6359] leading-relaxed">
                        Please use reference <strong className="text-[#1A1410]">{activeBooking.referenceCode}</strong> in your transfer narrative so your deposit is auto-matched immediately.
                      </p>
                    </div>

                    {/* Step 2: Send Receipt with WhatsApp Fallback & Direct AI Upload */}
                    <div className="p-6 rounded-2xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5DECF]">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1A1410] text-[#FDFBF8] text-xs font-mono font-bold flex items-center justify-center">
                            2
                          </span>
                          <h3 className="font-serif text-lg text-[#1A1410] font-semibold">
                            Send Receipt Screenshot
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-[#6E6359] uppercase tracking-wider">
                          Instant Verification
                        </span>
                      </div>

                      {/* Primary Gold Fallback Button */}
                      <div className="space-y-3">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#1A1410] font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-md group text-center"
                        >
                          <MessageCircle className="w-4 h-4 text-[#1A1410] group-hover:scale-110 transition-transform" />
                          <span>I&apos;ve Made My Deposit: Send Receipt on WhatsApp</span>
                        </a>

                        <div className="relative flex items-center justify-center">
                          <div className="border-t border-[#E5DECF] w-full" />
                          <span className="bg-[#FDFBF8] px-3 text-[10px] font-mono uppercase text-[#6E6359] tracking-wider absolute">
                            Or Upload Directly For AI Parsing
                          </span>
                        </div>

                        {/* Direct Screenshot Upload Zone */}
                        <div className="p-4 rounded-2xl bg-[#F8F4EE] border border-[#E5DECF] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider font-bold text-[#C9A96E] block">
                                Direct Upload &amp; AI Extraction
                              </span>
                              <p className="text-xs text-[#6E6359] mt-0.5">
                                Upload your transfer screenshot to auto-extract transaction reference &amp; speed up confirmation.
                              </p>
                            </div>

                            <label className="cursor-pointer shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1410] hover:bg-[#C9A96E] hover:text-[#1A1410] text-[#FDFBF8] text-xs font-semibold transition-all shadow-sm">
                              {isUploadingReceipt ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#C9A96E]" />
                              ) : (
                                <UploadCloud className="w-4 h-4 text-[#C9A96E]" />
                              )}
                              <span>{isUploadingReceipt ? "Analyzing Receipt..." : "Upload Screenshot"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingReceipt}
                                className="hidden"
                                onChange={handleUploadReceipt}
                              />
                            </label>
                          </div>

                          {/* AI Receipt Verification Display */}
                          {(aiAnalysisResult || receiptReported) && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 mt-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                                  <span>Transfer Proof Recorded</span>
                                </div>
                                {aiAnalysisResult?.accountingCheck?.badge && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900">
                                    {aiAnalysisResult.accountingCheck.badge.label}
                                  </span>
                                )}
                              </div>

                              {aiAnalysisResult?.extractedAmount ? (
                                <div className="space-y-1 text-[11px] text-emerald-800">
                                  <p>
                                    <strong>AI Extracted:</strong> ₦{aiAnalysisResult.extractedAmount.toLocaleString()}{" "}
                                    {aiAnalysisResult.recipientBank ? `to ${aiAnalysisResult.recipientBank}` : "to Fidelity Bank"}
                                  </p>
                                  {aiAnalysisResult.senderName && (
                                    <p><strong>Sender:</strong> {aiAnalysisResult.senderName}</p>
                                  )}
                                  {aiAnalysisResult.reference && (
                                    <p className="font-mono"><strong>Ref / Session ID:</strong> {aiAnalysisResult.reference}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[11px] text-emerald-800">
                                  Screenshot uploaded. Studio staff will verify your payment against our bank ledger.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shareable Booking URL Box */}
                    <div className="p-6 rounded-2xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base text-[#1A1410] font-semibold flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-[#C9A96E]" />
                          <span>Your Personal Booking Link</span>
                        </h4>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-[#6E6359]">
                          No Login Required
                        </span>
                      </div>
                      <p className="text-xs text-[#6E6359]">
                        Bookmark or save this link. You can revisit this page at any time to monitor deposit status, move your session date, or cancel:
                      </p>
                      <div className="p-3 rounded-xl bg-[#F8F4EE] border border-[#E5DECF] flex items-center justify-between gap-3">
                        <span className="font-mono text-xs text-[#1A1410] truncate select-all">
                          {shareableBookingUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(shareableBookingUrl, "url")}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1410] text-[#FDFBF8] text-xs font-semibold hover:bg-[#C9A96E] hover:text-[#1A1410] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copyFeedback === "url" ? "Copied!" : "Copy Link"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Order Summary, Shoot Operability Details & Calendar (Sticky on Desktop) */}
                  <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                    {/* Session Summary Card */}
                    <div className="p-6 rounded-2xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-5">
                      {/* Bespoke Service Image Banner in Summary Card */}
                      <div className="relative h-36 sm:h-44 w-full rounded-xl overflow-hidden mb-4 border border-[#E5DECF] bg-[#F8F4EE]">
                        <img
                          src={liveSessions[activeBooking.sessionType || sessionType]?.heroImage || "/images/client/weddings_3.jpg"}
                          alt={liveSessions[activeBooking.sessionType || sessionType]?.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex items-end p-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white font-bold bg-[#1A1410]/75 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/20">
                            {liveSessions[activeBooking.sessionType || sessionType]?.title}
                          </span>
                        </div>
                      </div>

                      <div className="pb-4 border-b border-[#E5DECF]">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#C9A96E] block mb-1">
                          Session Summary
                        </span>
                        <h3 className="font-serif text-2xl text-[#1A1410] font-normal">
                          {liveSessions[activeBooking.sessionType || sessionType]?.title || activeBooking.sessionType}
                        </h3>
                        <p className="text-xs text-[#6E6359] mt-0.5">
                          {activeBooking.answers?.packageName || selectedPackage?.name || "Bespoke Collection"}
                        </p>
                      </div>

                      {/* Shoot Date & Time */}
                      <div className="space-y-3 text-xs">
                        <div className="flex items-start gap-3">
                          <CalendarIcon className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#6E6359] block">Shoot Date &amp; Time</span>
                            <span className="font-semibold text-[#1A1410] text-sm">
                              {activeBooking.shootStart
                                ? new Date(activeBooking.shootStart).toLocaleString("en-US", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : selectedDate && timeSlot
                                ? `${selectedDate} at ${timeSlot}`
                                : "Date to be scheduled"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#6E6359] block">Studio Location</span>
                            <span className="font-semibold text-[#1A1410]">
                              LamSparks Private Abuja Studio
                            </span>
                          </div>
                        </div>

                        {/* Prior Flow Shoot Operability Details */}
                        {activeBooking.answers && (
                          <div className="pt-3 border-t border-[#E5DECF] space-y-1.5 text-[11px] text-[#6E6359]">
                            {activeBooking.answers.childName && (
                              <p><strong>Child:</strong> {activeBooking.answers.childName} ({activeBooking.answers.childAge || "Milestone"})</p>
                            )}
                            {activeBooking.answers.partnerName && (
                              <p><strong>Partner:</strong> {activeBooking.answers.partnerName}</p>
                            )}
                            {activeBooking.answers.feeling && (
                              <p><strong>Desired Mood:</strong> &ldquo;{activeBooking.answers.feeling}&rdquo;</p>
                            )}
                            {activeBooking.answers.reelsAddon && (
                              <p className="text-[#C9A96E] font-semibold">✓ Cinematic Content Reels Included</p>
                            )}
                            {activeBooking.answers.priorityEditing && (
                              <p className="text-[#C9A96E] font-semibold">✓ Express Priority Delivery Included</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Financial Breakdown */}
                      <div className="pt-4 border-t border-[#E5DECF] space-y-2.5 text-xs">
                        <div className="flex items-center justify-between text-[#6E6359]">
                          <span>Total Investment:</span>
                          <span className="font-semibold text-[#1A1410] text-sm">
                            ₦{(activeBooking.estimate?.total || estimate.total).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-amber-900 bg-amber-500/10 p-2.5 rounded-lg border border-amber-300/60 font-semibold">
                          <span>Deposit to Book ({activeBooking.estimate?.depositPercent || estimate.depositPercent}%):</span>
                          <span>
                            ₦{(activeBooking.estimate?.depositAmount || estimate.depositAmount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#6E6359]">
                          <span>Balance on Shoot Day ({100 - (activeBooking.estimate?.depositPercent || estimate.depositPercent)}%):</span>
                          <span className="font-semibold text-[#1A1410]">
                            ₦{(activeBooking.estimate?.balanceAmount || estimate.balanceAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Add to Calendar Buttons */}
                      <div className="pt-4 border-t border-[#E5DECF] space-y-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6E6359] block">
                          Add to Calendar
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={getGoogleCalendarUrl(calendarEvent)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E5DECF] hover:border-[#1A1410] bg-[#F8F4EE] text-xs font-semibold text-[#1A1410] transition-colors"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 text-[#C9A96E]" />
                            <span>Google Calendar</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => downloadIcsFile(calendarEvent)}
                            className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E5DECF] hover:border-[#1A1410] bg-[#F8F4EE] text-xs font-semibold text-[#1A1410] transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-[#C9A96E]" />
                            <span>Apple / Outlook (.ics)</span>
                          </button>
                        </div>
                      </div>

                      {/* Self-Serve Actions: Reschedule & Cancel */}
                      <div className="pt-4 border-t border-[#E5DECF] flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setIsRescheduleOpen(true)}
                          className="flex-1 py-2.5 px-3 rounded-xl border border-[#E5DECF] hover:border-[#1A1410] text-xs font-semibold text-[#1A1410] hover:bg-[#F8F4EE] transition-colors text-center"
                        >
                          Move to another time
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsCancelModalOpen(true)}
                          className="py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 transition-colors"
                        >
                          Cancel booking
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Reschedule Modal */}
            {isRescheduleOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#FDFBF8] max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-[#E5DECF] shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5DECF]">
                    <div>
                      <h3 className="font-serif text-2xl text-[#1A1410]">Move to Another Time</h3>
                      <p className="text-xs text-[#6E6359] mt-0.5">
                        Choose a new date and time slot for booking {activeBooking.referenceCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRescheduleOpen(false)}
                      className="w-8 h-8 rounded-full bg-[#F8F4EE] flex items-center justify-center text-[#6E6359] hover:text-[#1A1410]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410]">
                      Select New Date
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  {/* Time Slot Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410]">
                      Select New Time Slot
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setTimeSlot(slot.id)}
                          className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            timeSlot === slot.id
                              ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410]"
                              : "bg-[#F8F4EE] text-[#1A1410] border-[#E5DECF] hover:border-[#C9A96E]"
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5DECF] flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRescheduleOpen(false)}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#6E6359] hover:text-[#1A1410]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingBooking || !selectedDate || !timeSlot}
                      onClick={handleReschedule}
                      className="px-6 py-2.5 rounded-full bg-[#1A1410] hover:bg-[#C9A96E] hover:text-[#1A1410] text-[#FDFBF8] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {isUpdatingBooking ? "Updating..." : "Confirm New Slot"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Modal */}
            {isCancelModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#FDFBF8] max-w-md w-full rounded-3xl p-6 sm:p-8 border border-[#E5DECF] shadow-2xl space-y-5">
                  <div className="flex items-center gap-3 text-rose-700">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <h3 className="font-serif text-2xl text-[#1A1410]">Cancel This Session?</h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#6E6359] leading-relaxed">
                    Are you sure you want to cancel your session with LamSparks? Releasing this slot will make it available for another client.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-bold text-[#6E6359]">
                      Reason (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Schedule conflict, travel dates changed..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-xs text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#E5DECF] flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#1A1410] bg-[#F8F4EE] hover:bg-[#E5DECF] transition-colors"
                    >
                      Keep It (Safe)
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingBooking}
                      onClick={handleCancelBooking}
                      className="px-5 py-2.5 rounded-full bg-rose-700 hover:bg-rose-800 text-[#FDFBF8] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {isUpdatingBooking ? "Cancelling..." : "Yes, Cancel It"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* NEW BOOKING WIZARD (STREAMLINED 4-STEP SELF-SERVE PATH)                   */}
        {/* ========================================================================= */}
        {!isLoadingBooking && !isExistingBookingView && (
          <div className="space-y-8 animate-fade-up">
            {/* Stepper Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[#6E6359] font-medium">
                <span>LamSparks Atelier Booking</span>
                <span>Step {step} of 4</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: 1, label: "Package" },
                  { num: 2, label: "Date & Time" },
                  { num: 3, label: "Details & Vision" },
                  { num: 4, label: "Deposit" },
                ].map((s) => (
                  <div key={s.num} className="space-y-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step >= s.num ? "bg-[#C9A96E]" : "bg-[#E5DECF]"
                      }`}
                    />
                    <span
                      className={`hidden sm:block text-[10px] uppercase tracking-wider font-semibold ${
                        step === s.num ? "text-[#1A1410]" : "text-[#6E6359]/70"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: PACKAGE PICKER (Inspired by Reference Video 00:21 - 00:24) */}
            {step === 1 && (
              <div className="space-y-8">
                {/* Category Chips at Top */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A96E] font-bold block">
                    1. Select Category
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {Object.values(liveSessions).map((st: any) => (
                      <button
                        key={st.slug}
                        type="button"
                        onClick={() => {
                          setSessionType(st.slug);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                          sessionType === st.slug
                            ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410] shadow-sm"
                            : "bg-[#FDFBF8] text-[#6E6359] border-[#E5DECF] hover:border-[#C9A96E]"
                        }`}
                      >
                        {st.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headline: "Pick your package" with key word in gold */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#6E6359] mb-1">
                    {liveSessions[sessionType]?.title || "Session"} / Choose a package
                  </div>
                  <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal">
                    Pick your <span className="text-[#C9A96E] italic font-serif">package</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6359] mt-1.5">
                    Select the collection that fits your celebration. Duration, setups, and inclusions are clearly detailed.
                  </p>
                </div>

                {/* Two-Column Editorial Package Picker: Bespoke Photo on Left (Sticky) + Package Cards on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Bespoke Service Editorial Portrait (Sticky on Desktop) */}
                  <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                    <div className="relative rounded-3xl overflow-hidden shadow-md border border-[#E5DECF] bg-[#F8F4EE] group aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4]">
                      <img
                        src={liveSessions[sessionType]?.heroImage || "/images/client/weddings_3.jpg"}
                        alt={liveSessions[sessionType]?.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5 text-white">
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#C9A96E] font-bold block mb-1">
                          LamSparks Atelier · Abuja
                        </span>
                        <h3 className="font-serif text-2xl text-white font-medium leading-tight">
                          {liveSessions[sessionType]?.title}
                        </h3>
                        <p className="text-xs text-white/80 line-clamp-2 mt-1 font-sans">
                          {liveSessions[sessionType]?.tagline}
                        </p>
                        <div className="pt-3 mt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
                          <span>{liveSessions[sessionType]?.standardDeliveryDays || "5–7 business days"}</span>
                          <span className="font-serif font-bold text-[#C9A96E]">
                            {liveSessions[sessionType]?.fromPrice ? `From ₦${liveSessions[sessionType].fromPrice.toLocaleString()}` : "Bespoke"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FDFBF8] border border-[#E5DECF] text-xs text-[#6E6359] space-y-1 hidden lg:block">
                      <span className="font-bold text-[#1A1410] uppercase tracking-wider text-[10px] block">
                        Atelier Craft Promise
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {liveSessions[sessionType]?.description || "Unhurried, intentional studio sessions tailored to your celebration."}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Package Cards Grid */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentPackages.map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => setPackageId(pkg.id)}
                            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                              isSelected
                                ? "bg-[#FDFBF8] border-[#C9A96E] ring-2 ring-[#C9A96E] shadow-lg scale-[1.01]"
                                : "bg-[#FDFBF8]/80 border-[#E5DECF] hover:border-[#C9A96E]/60 hover:bg-[#FDFBF8]"
                            }`}
                          >
                            {/* Radio Dot indicator */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <h3 className="font-serif text-xl sm:text-2xl text-[#1A1410] font-medium leading-snug">
                                  {pkg.name}
                                </h3>
                                <span className="text-xs font-semibold text-[#6E6359]">
                                  {(pkg as any)?.durationMinutes ? `${(pkg as any).durationMinutes} mins` : "Standard Duration"}
                                </span>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                                  isSelected
                                    ? "border-[#C9A96E] bg-[#C9A96E]"
                                    : "border-[#E5DECF] bg-transparent"
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#1A1410]" />}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="py-2 border-y border-[#E5DECF]/80 my-3">
                              <span className="text-[10px] text-[#6E6359] uppercase tracking-wider block">
                                Starting from
                              </span>
                              <span className="font-serif text-2xl font-bold text-[#1A1410]">
                                ₦{(pkg.price || 0).toLocaleString()}
                              </span>
                            </div>

                            {/* Inclusions */}
                            <ul className="space-y-2 mb-4 text-xs text-[#6E6359] flex-1">
                              {pkg.inclusions.map((inc, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-[#C9A96E] shrink-0 mt-0.5" />
                                  <span>{inc}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="pt-2">
                              <span
                                className={`text-[11px] uppercase tracking-wider font-bold block ${
                                  isSelected ? "text-[#C9A96E]" : "text-[#6E6359]"
                                }`}
                              >
                                {isSelected ? "Selected ✓" : "Click to select"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Total Bar (Inspired by Video 00:24) */}
                <div className="sticky bottom-4 z-30 p-4 sm:p-5 rounded-2xl bg-[#1A1410] text-[#FDFBF8] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-[#C9A96E] uppercase tracking-widest font-bold block">
                      Selected: {selectedPackage?.name || "Package"}
                    </span>
                    <div className="text-sm sm:text-base font-medium">
                      Total ₦{(selectedPackage?.price || 0).toLocaleString()} · Deposit to book ₦
                      {Math.round((selectedPackage?.price || 0) * (estimate.depositPercent / 100)).toLocaleString()} ({estimate.depositPercent}%)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#1A1410] font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-md group"
                  >
                    <span>Choose a Date</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LIVE CALENDAR & TIME (Inspired by Reference Video 00:27 - 00:30) */}
            {step === 2 && (
              <div className="space-y-8">
                {/* Breadcrumb & Header */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#6E6359] mb-1">
                    {liveSessions[sessionType]?.title} / {selectedPackage?.name} / Date and Time
                  </div>
                  <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal">
                    Free or booked,{" "}
                    <span className="text-[#C9A96E] italic font-serif">at a glance</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6359] mt-1.5">
                    Checking Osemene&apos;s calendar... Pick your preferred date and session time slot.
                  </p>
                </div>

                {/* Two-Column Calendar Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Col: Calendar Grid */}
                  <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6">
                    {/* Month Navigator */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#E5DECF]">
                      <h3 className="font-serif text-2xl text-[#1A1410] font-normal">
                        {monthName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCalendarDate(new Date(year, month - 1, 1));
                          }}
                          className="w-8 h-8 rounded-full border border-[#E5DECF] hover:border-[#1A1410] flex items-center justify-center text-[#1A1410] transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCalendarDate(new Date(year, month + 1, 1));
                          }}
                          className="w-8 h-8 rounded-full border border-[#E5DECF] hover:border-[#1A1410] flex items-center justify-center text-[#1A1410] transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Day Headers (Mon - Sun) */}
                    <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase text-[#6E6359] tracking-wider">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <div key={d} className="py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days Matrix */}
                    <div className="grid grid-cols-7 gap-2">
                      {/* Empty padding days */}
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-2 h-10 sm:h-12" />
                      ))}

                      {/* Day cells */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateFormatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                        const isPast = dateFormatted < todayStr;
                        const isSelected = selectedDate === dateFormatted;

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            disabled={isPast}
                            onClick={() => setSelectedDate(dateFormatted)}
                            className={`h-10 sm:h-12 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col items-center justify-center relative ${
                              isPast
                                ? "text-[#E5DECF] cursor-not-allowed"
                                : isSelected
                                ? "bg-[#1A1410] text-[#FDFBF8] ring-2 ring-[#C9A96E] shadow-sm font-bold"
                                : "bg-[#F8F4EE] text-[#1A1410] hover:bg-[#C9A96E]/20 hover:border-[#C9A96E]"
                            }`}
                          >
                            <span>{dayNum}</span>
                            {!isPast && (
                              <span
                                className={`w-1 h-1 rounded-full mt-0.5 ${
                                  isSelected ? "bg-[#C9A96E]" : "bg-[#C9A96E]/60"
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="pt-4 border-t border-[#E5DECF] flex items-center justify-between text-xs text-[#6E6359]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]" />
                        <span>Free</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1A1410]" />
                        <span>Selected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E5DECF]" />
                        <span>Unavailable / Past</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Col: Selected Day's Time Slots */}
                  <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6">
                    <div>
                      <span className="text-[10px] text-[#C9A96E] uppercase tracking-wider font-bold block mb-1">
                        Selected Date
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl text-[#1A1410]">
                        {selectedDate
                          ? new Date(selectedDate + "T12:00:00Z").toLocaleDateString("en-US", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Choose a day on the calendar"}
                      </h3>
                    </div>

                    {selectedDate ? (
                      <div className="space-y-4">
                        {["Morning", "Afternoon", "Evening (Golden Hour)"].map((period) => {
                          const slotsInPeriod = TIME_SLOTS.filter((s) => s.period.startsWith(period.split(" ")[0]));
                          return (
                            <div key={period} className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-[#6E6359] tracking-wider block">
                                {period}
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {slotsInPeriod.map((slot) => {
                                  const isSlotSelected = timeSlot === slot.id;
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => setTimeSlot(slot.id)}
                                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-center flex items-center justify-between ${
                                        isSlotSelected
                                          ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410] ring-1 ring-[#C9A96E] shadow-sm"
                                          : "bg-[#F8F4EE] text-[#1A1410] border-[#E5DECF] hover:border-[#C9A96E]"
                                      }`}
                                    >
                                      <span>{slot.label}</span>
                                      {isSlotSelected && (
                                        <Check className="w-3.5 h-3.5 text-[#C9A96E]" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-[#6E6359] border border-dashed border-[#E5DECF] rounded-2xl">
                        Please select an available date on the calendar to see available time slots.
                      </div>
                    )}

                    <div className="pt-4 border-t border-[#E5DECF] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-[#1A1410] hover:text-[#C9A96E]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        disabled={!selectedDate || !timeSlot}
                        onClick={() => setStep(3)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1A1410] hover:bg-[#C9A96E] hover:text-[#1A1410] text-[#FDFBF8] text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-40 shadow-sm"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: YOUR DETAILS & SHOOT OPERABILITY (Prior Flow Specifics Re-integrated) */}
            {step === 3 && (
              <div className="space-y-8">
                {/* Breadcrumb & Header */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#6E6359] mb-1">
                    {liveSessions[sessionType]?.title} / {selectedPackage?.name} / {selectedDate} ({timeSlot})
                  </div>
                  <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal">
                    Almost <span className="text-[#C9A96E] italic font-serif">done</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6359] mt-1.5">
                    Provide your contact details and session specifics so Osemene can tailor your shoot to perfection.
                  </p>
                </div>

                {/* 2-Column Layout: Form on Left, Sticky Summary on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Form with Prior Flow Details */}
                  <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6">
                    {/* Section 1: Contact Information */}
                    <div className="space-y-4">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#C9A96E] block pb-1 border-b border-[#E5DECF]">
                        1. Contact Information
                      </span>

                      {/* Name */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          Full Name <span className="text-[#C9A96E]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Amina Bello"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:bg-[#FDFBF8] focus:outline-none focus:border-[#C9A96E]"
                        />
                      </div>

                      {/* WhatsApp / Phone */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          WhatsApp Phone <span className="text-[#C9A96E]">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 0813 084 7299"
                          value={whatsappPhone}
                          onChange={(e) => setWhatsappPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:bg-[#FDFBF8] focus:outline-none focus:border-[#C9A96E]"
                        />
                        <span className="text-[11px] text-[#6E6359] mt-1 block">
                          Nigerian numbers normalized automatically. Used for WhatsApp confirmation &amp; gallery delivery.
                        </span>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          Email Address <span className="text-[#6E6359] font-normal">(for calendar invite &amp; receipt)</span>
                        </label>
                        <input
                          type="email"
                          placeholder="amina@example.com"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:bg-[#FDFBF8] focus:outline-none focus:border-[#C9A96E]"
                        />
                      </div>
                    </div>

                    {/* Section 2: Session Heart & Vision (From Prior Flow) */}
                    <div className="space-y-4 pt-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#C9A96E] block pb-1 border-b border-[#E5DECF]">
                        2. Session Heart &amp; Vision
                      </span>

                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          What is this session celebrating or for?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1st Birthday, Maternity milestone, New executive headshots..."
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:bg-[#FDFBF8] focus:outline-none focus:border-[#C9A96E]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          What feeling do you want from the photographs?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Peaceful and regal, full of giggles and warmth, commanding and editorial..."
                          value={feeling}
                          onChange={(e) => setFeeling(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:bg-[#FDFBF8] focus:outline-none focus:border-[#C9A96E]"
                        />
                      </div>
                    </div>

                    {/* Section 3: Session Specifics for Photographer Operability */}
                    <div className="space-y-4 pt-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#C9A96E] block pb-1 border-b border-[#E5DECF]">
                        3. Specifics &amp; Shoot Logistics
                      </span>

                      {/* Toddler Specifics */}
                      {sessionType === "toddler" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                              Child&apos;s Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Zara"
                              value={childName}
                              onChange={(e) => setChildName(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                              Child&apos;s Age / Turning Age
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 1 year old"
                              value={childAge}
                              onChange={(e) => setChildAge(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                              Additional Siblings / Family (+₦30k each)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={6}
                              value={additionalFamilyCount}
                              onChange={(e) => setAdditionalFamilyCount(parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                              Twins or Multiples (+50% per child)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={3}
                              value={additionalChildCount}
                              onChange={(e) => setAdditionalChildCount(parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Maternity Specifics */}
                      {sessionType === "maternity" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                              Weeks Pregnant (at preferred date)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 30–34 weeks"
                              value={weeksPregnant}
                              onChange={(e) => setWeeksPregnant(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                              Partner Joining Session? (Partner&apos;s Name)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Emeka"
                              value={partnerName}
                              onChange={(e) => setPartnerName(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Couples / Weddings Partner */}
                      {(sessionType === "couple" || sessionType === "wedding") && (
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                            Partner / Spouse Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Ose"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                          />
                        </div>
                      )}

                      {/* Location Preference */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          Studio vs Location Preference
                        </label>
                        <select
                          value={locationType}
                          onChange={(e) => setLocationType(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                        >
                          <option value="studio">Private Abuja Studio (Default)</option>
                          <option value="outside">Outdoor / On Location in Abuja</option>
                          <option value="both">Both Studio &amp; Outdoor Session</option>
                        </select>
                      </div>

                      {/* Add-on Toggles */}
                      <div className="pt-2 space-y-3">
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] cursor-pointer hover:border-[#C9A96E] transition-colors">
                          <input
                            type="checkbox"
                            checked={priorityEditing}
                            onChange={(e) => setPriorityEditing(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-[#E5DECF] text-[#C9A96E] focus:ring-[#C9A96E]"
                          />
                          <div>
                            <span className="text-xs font-bold text-[#1A1410] flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-[#C9A96E]" />
                              <span>Express Priority Delivery (+₦30,000)</span>
                            </span>
                            <span className="text-[11px] text-[#6E6359] block mt-0.5">
                              Expedites fine-art editing turnaround to 3–5 business days (or 24–48 hours for events).
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] cursor-pointer hover:border-[#C9A96E] transition-colors">
                          <input
                            type="checkbox"
                            checked={reelsAddon}
                            onChange={(e) => setReelsAddon(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-[#E5DECF] text-[#C9A96E] focus:ring-[#C9A96E]"
                          />
                          <div>
                            <span className="text-xs font-bold text-[#1A1410] flex items-center gap-1.5">
                              <Film className="w-3.5 h-3.5 text-[#C9A96E]" />
                              <span>
                                Short Cinematic Content Reels (+₦{sessionType === "event" ? "200,000" : "150,000"})
                              </span>
                            </span>
                            <span className="text-[11px] text-[#6E6359] block mt-0.5">
                              2 professionally edited vertical video reels delivered digitally for Instagram/TikTok.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Notes Box */}
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          Additional Requests or Wardrobe Notes
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Outfits, number of people, makeup artist, special props..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                        />
                      </div>

                      {/* Terms & Conditions Checkbox */}
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] cursor-pointer hover:border-[#C9A96E]/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={termsAgreed}
                          onChange={(e) => setTermsAgreed(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-[#E5DECF] text-[#C9A96E] focus:ring-[#C9A96E]"
                        />
                        <span className="text-xs text-[#1A1410] leading-relaxed">
                          I agree to the {estimate.depositPercent}% booking deposit requirement to hold this studio slot and confirm I have reviewed LamSparks&apos; booking policy. <span className="text-[#C9A96E]">*</span>
                        </span>
                      </label>

                      {/* Optional Portfolio Consent */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-transparent cursor-pointer">
                        <input
                          type="checkbox"
                          checked={portfolioConsent}
                          onChange={(e) => setPortfolioConsent(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-[#E5DECF] text-[#C9A96E] focus:ring-[#C9A96E]"
                        />
                        <span className="text-[11px] text-[#6E6359] leading-relaxed">
                          Optional: Consent to feature selected photographs in LamSparks&apos; private portfolio. Unticked by default.
                        </span>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-[#E5DECF] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-[#1A1410] hover:text-[#C9A96E]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || !clientName.trim() || !whatsappPhone.trim() || !termsAgreed}
                        onClick={handleCreateBooking}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#1A1410] font-sans text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-40 shadow-md group"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#1A1410]" />
                            <span>Reserving Slot...</span>
                          </>
                        ) : (
                          <>
                            <span>Book and See Deposit Details</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Sticky Live Summary */}
                  <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6 sticky top-24">
                    {/* Bespoke Service Image Banner in Summary Card */}
                    <div className="relative h-36 sm:h-44 w-full rounded-xl overflow-hidden border border-[#E5DECF] bg-[#F8F4EE]">
                      <img
                        src={liveSessions[sessionType]?.heroImage || "/images/client/weddings_3.jpg"}
                        alt={liveSessions[sessionType]?.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex items-end p-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white font-bold bg-[#1A1410]/75 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/20">
                          {liveSessions[sessionType]?.title}
                        </span>
                      </div>
                    </div>

                    <div className="pb-4 border-b border-[#E5DECF]">
                      <span className="text-[10px] text-[#C9A96E] uppercase tracking-wider font-bold block mb-1">
                        Order Summary
                      </span>
                      <h3 className="font-serif text-2xl text-[#1A1410]">
                        {liveSessions[sessionType]?.title}
                      </h3>
                      <p className="text-xs text-[#6E6359] mt-0.5">
                        {selectedPackage?.name}
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6E6359]">Date &amp; Time:</span>
                        <span className="font-semibold text-[#1A1410]">
                          {selectedDate} at {timeSlot}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#6E6359]">Session Length:</span>
                        <span className="font-semibold text-[#1A1410]">
                          {(selectedPackage as any)?.durationMinutes ? `${(selectedPackage as any).durationMinutes} mins` : "2 hours"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#6E6359]">Location:</span>
                        <span className="font-semibold text-[#1A1410] capitalize">
                          {locationType === "studio" ? "Private Abuja Studio" : locationType === "outside" ? "Outdoor / Location" : "Studio & Outdoor"}
                        </span>
                      </div>

                      {/* Itemised Add-ons in Summary */}
                      {estimate.lineItems.length > 1 && (
                        <div className="pt-3 border-t border-[#E5DECF] space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-[#C9A96E] tracking-wider block">
                            Included Inclusions &amp; Add-ons
                          </span>
                          {estimate.lineItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-[11px] text-[#6E6359]">
                              <span className="truncate max-w-[200px]">{item.label}</span>
                              <span className="font-semibold text-[#1A1410]">₦{item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#E5DECF] space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-[#6E6359]">
                        <span>Total Investment:</span>
                        <span className="font-semibold text-[#1A1410] text-sm">
                          ₦{estimate.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-amber-900 bg-amber-500/10 p-2.5 rounded-lg border border-amber-300/60 font-semibold">
                        <span>Deposit to Book ({estimate.depositPercent}%):</span>
                        <span>
                          ₦{estimate.depositAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#6E6359]">
                        <span>Balance on Shoot Day ({100 - estimate.depositPercent}%):</span>
                        <span className="font-semibold text-[#1A1410]">
                          ₦{estimate.balanceAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center p-12 text-[#1A1410] font-serif">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A96E]" />
        </div>
      }
    >
      <BookingWizard />
    </Suspense>
  );
}
