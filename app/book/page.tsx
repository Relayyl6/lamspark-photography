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
  User,
  MapPin,
  FileCheck2,
} from "lucide-react";
import { Nav } from "@/components/Nav";
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
  const rawSession = searchParams.get("session") as SessionTypeSlug | null;
  const initialDate = searchParams.get("date") || "";
  const initialTime = searchParams.get("time") || "";
  const initialSession = rawSession || "toddler";
  const initialPkg = searchParams.get("pkg") || undefined;

  // 5-Step Architecture: 1: Session, 2: Package, 3: Date & Time, 4: Your Details, 5: Deposit / Held
  const [step, setStep] = useState(rawSession ? 2 : 1);

  // Core selections
  const [sessionType, setSessionType] = useState<SessionTypeSlug>(initialSession);
  const [packageId, setPackageId] = useState<string>(initialPkg || "");
  const [selectedDate, setSelectedDate] = useState<string>(initialDate); // YYYY-MM-DD
  const [timeSlot, setTimeSlot] = useState<string>(initialTime);

  // Client contact (Decluttered)
  const [clientName, setClientName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [portfolioConsent, setPortfolioConsent] = useState(false);

  // Dynamic packages & session overrides from DB
  const [livePackages, setLivePackages] = useState(PACKAGES);
  const [liveSessions, setLiveSessions] = useState<Record<string, any>>(SESSION_TYPES);

  // Live Calendar Availability state (for Step 3 & Reschedule Modal)
  const [bookedSlots, setBookedSlots] = useState<Array<{ date: string; timeSlot: string; status: string }>>([]);
  const [lockedSlots, setLockedSlots] = useState<Array<{ date: string; timeSlot: string; reason?: string }>>([]);
  const [blockedDays, setBlockedDays] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Booking management / status state
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [holdRemainingMs, setHoldRemainingMs] = useState<number | null>(null);
  const [reholdError, setReholdError] = useState<string | null>(null);

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
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const [y, m] = initialDate.split("-").map((v) => parseInt(v, 10));
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

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
          // Save or refresh in device localStorage
          try {
            const raw = localStorage.getItem("lamsparks_saved_bookings");
            const existing = raw ? JSON.parse(raw) : [];
            const filtered = existing.filter((b: any) => b.referenceCode !== data.booking.referenceCode);
            const shootStart = data.booking.shootStart || (data.booking.answers?.selectedDate ? `${data.booking.answers.selectedDate} at ${data.booking.answers.timeSlot || ""}` : "");
            const newRecord = {
              referenceCode: data.booking.referenceCode,
              sessionTitle: data.booking.sessionType || "Atelier Session",
              shootStart,
              status: data.booking.status || "awaiting_deposit",
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem("lamsparks_saved_bookings", JSON.stringify([newRecord, ...filtered].slice(0, 5)));
          } catch {}
          setStep(5);
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

  // Fetch live availability for current calendar month & reschedule modal
  const activeAvailMonth = useMemo(() => {
    if (isRescheduleOpen && selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return selectedDate.slice(0, 7);
    }
    return `${currentCalendarDate.getFullYear()}-${pad(currentCalendarDate.getMonth() + 1)}`;
  }, [currentCalendarDate, isRescheduleOpen, selectedDate]);

  useEffect(() => {
    setIsLoadingAvailability(true);
    fetch(`/api/availability?month=${activeAvailMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBookedSlots(data.bookedSlots || []);
          setLockedSlots(data.lockedSlots || []);
          setBlockedDays(data.blockedDays || []);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingAvailability(false));
  }, [activeAvailMonth, step]);

  // Live 1-second countdown for the 2-hour temporary hold
  useEffect(() => {
    if (!activeBooking?.holdExpiresAt || activeBooking?.status !== "awaiting_deposit") {
      setHoldRemainingMs(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(activeBooking.holdExpiresAt).getTime() - Date.now();
      setHoldRemainingMs(Math.max(0, diff));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeBooking?.holdExpiresAt, activeBooking?.status]);

  // Available packages for current session
  const currentPackages = useMemo(() => {
    return livePackages.filter((p) => p.sessionType === sessionType);
  }, [livePackages, sessionType]);

  const selectedPackage = useMemo(() => {
    return currentPackages.find((p) => p.id === packageId) || currentPackages[0] || null;
  }, [currentPackages, packageId]);

  // Concise answers object feeding estimate engine & photographer shoot record
  const bookingAnswers: BookingAnswers = useMemo(
    () => ({
      purpose: notes || `${liveSessions[sessionType]?.title || sessionType} Session`,
      packageId: selectedPackage?.id,
      packageName: selectedPackage?.name,
      selectedDate,
      timeSlot,
      notes,
    }),
    [notes, liveSessions, sessionType, selectedPackage, selectedDate, timeSlot]
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

  // Calendar Event Data
  const calendarEvent = useMemo(() => {
    let start = new Date();
    let end = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const bookingShootStart =
      activeBooking?.shootStart || (selectedDate && timeSlot ? `${selectedDate} ${timeSlot}` : null);

    if (bookingShootStart) {
      const match = bookingShootStart.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        const [, datePart, hourStr, minStr, ampm] = match;
        let hours = parseInt(hourStr, 10);
        const mins = parseInt(minStr, 10);
        if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
        start = new Date(`${datePart}T${pad(hours)}:${pad(mins)}:00+01:00`);
        end = new Date(start.getTime() + 90 * 60 * 1000);
      } else {
        const parsed = new Date(bookingShootStart);
        if (!isNaN(parsed.getTime())) {
          start = parsed;
          end = activeBooking?.shootEnd
            ? new Date(activeBooking.shootEnd)
            : new Date(parsed.getTime() + 90 * 60 * 1000);
        }
      }
    }

    const title = `LamSparks Atelier Shoot: ${liveSessions[activeBooking?.sessionType || sessionType]?.title || "Photography"}`;
    const location = "LamSparks Private Atelier Studio, Abuja, Nigeria";
    const description =
      `LamSparks Photography Session\n` +
      `Reference: ${activeBooking?.referenceCode || "Confirmed"}\n` +
      `Client: ${activeBooking?.client?.name || clientName}\n` +
      `Studio Contact: +234 813 084 7299\n\n` +
      `Please arrive 15 minutes before your scheduled slot for wardrobe prep and styling direction.`;

    return { title, location, description, startDate: start, endDate: end };
  }, [activeBooking, sessionType, liveSessions, selectedDate, timeSlot, clientName]);

  // Calendar Month Navigation
  const monthName = currentCalendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Build Calendar Days for the Month with live availability counts
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      isBlocked: boolean;
      openCount: number;
    }[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    for (let i = 0; i < firstDay; i++) {
      days.push({
        dateStr: "",
        dayNum: 0,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isBlocked: false,
        openCount: 0,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isBlocked = blockedDays.includes(dateStr);
      const bookedCount =
        bookedSlots.filter((b) => b.date === dateStr).length +
        lockedSlots.filter((l) => l.date === dateStr).length;
      const openCount = isPast || isBlocked ? 0 : Math.max(0, TIME_SLOTS.length - bookedCount);

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isPast,
        isToday,
        isBlocked,
        openCount,
      });
    }

    return days;
  }, [currentCalendarDate, bookedSlots, lockedSlots, blockedDays]);

  // Helper to check availability status of a specific slot on selectedDate
  const getSlotStatus = (dateStr: string, slotLabel: string) => {
    if (!dateStr) return { available: true, badge: "" };
    if (blockedDays.includes(dateStr)) return { available: false, badge: "Closed" };
    const locked = lockedSlots.find((l) => l.date === dateStr && l.timeSlot === slotLabel);
    if (locked) return { available: false, badge: "Reserved" };
    const booked = bookedSlots.find((b) => b.date === dateStr && b.timeSlot === slotLabel);
    if (booked) {
      return {
        available: false,
        badge: booked.status === "held" ? "Held (20h)" : "Booked",
      };
    }
    return { available: true, badge: "" };
  };

  // Handle Session Selection on Step 1
  const handleSelectSession = (slug: SessionTypeSlug) => {
    setSessionType(slug);
    const available = livePackages.filter((p) => p.sessionType === slug);
    if (available.length > 0) {
      setPackageId(available[0].id);
    }
    setStep(2);
  };

  // Handle Create Booking Submission (Step 4 -> Step 5)
  async function handleCreateBooking() {
    if (!clientName.trim() || !whatsappPhone.trim() || !selectedDate || !timeSlot) {
      alert("Please ensure your name, WhatsApp number, date, and time slot are filled.");
      return;
    }

    if (!termsAgreed) {
      alert("Please agree to the booking deposit terms to proceed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const shootStartIso = `${selectedDate} ${timeSlot}`;

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType,
          packageId: selectedPackage?.id,
          packageName: selectedPackage?.name,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          whatsappPhone: whatsappPhone.trim(),
          selectedDate,
          timeSlot,
          shootStart: shootStartIso,
          answers: bookingAnswers,
          estimate,
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
        // Save to device localStorage so client can track under "My Booking"
        try {
          const raw = localStorage.getItem("lamsparks_saved_bookings");
          const existing = raw ? JSON.parse(raw) : [];
          const filtered = existing.filter((b: any) => b.referenceCode !== data.referenceCode);
          const newRecord = {
            referenceCode: data.referenceCode,
            sessionTitle: liveSessions[sessionType]?.title || sessionType,
            shootStart: `${selectedDate} at ${timeSlot}`,
            status: "awaiting_deposit",
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem("lamsparks_saved_bookings", JSON.stringify([newRecord, ...filtered].slice(0, 5)));
        } catch {}

        // Update URL to make it a revisitable page
        router.replace(`/book?ref=${data.referenceCode}`, { scroll: false });
        setStep(5);
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

  // Handle Re-Reserving an Expired 20-Hour Hold (with collision check against already booked slots)
  async function handleReholdBooking() {
    if (!activeBooking?.referenceCode) return;

    setReholdError(null);
    setIsUpdatingBooking(true);
    try {
      const res = await fetch("/api/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceCode: activeBooking.referenceCode,
          action: "rehold",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReholdError(null);
        const refresh = await fetch(`/api/booking?ref=${encodeURIComponent(activeBooking.referenceCode)}`);
        const refData = await refresh.json();
        if (refData.success && refData.booking) {
          setActiveBooking(refData.booking);
        }
      } else {
        const errMsg = data.error || "This time slot has already been booked or claimed by another client. Please select an available slot.";
        setReholdError(errMsg);
        setIsRescheduleOpen(true);
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to re-reserve slot. Please select another open time.";
      setReholdError(errMsg);
      setIsRescheduleOpen(true);
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
        const aiCheckData = data.aiCheck || null;

        // Report deposit to DB with AI verification metadata
        const patchRes = await fetch("/api/booking", {
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
        const patchData = await patchRes.json();

        if (!patchRes.ok) {
          alert(patchData.error || "Could not attach deposit receipt.");
          if (patchRes.status === 409) {
            setIsRescheduleOpen(true);
          }
          return;
        }

        setReceiptUrl(uploadedUrl);
        setReceiptReported(true);
        if (aiCheckData) {
          setAiAnalysisResult(aiCheckData);
        }

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
      `Deposit Required (70%): ₦${depositAmt}\n` +
      `Total Investment: ₦${totalAmt}\n\n` +
      `I am transferring my deposit now. Here is my reference.`;

    return `https://wa.me/${businessNumber}?text=${encodeURIComponent(text)}`;
  }, [activeBooking, clientName, liveSessions, sessionType, selectedPackage, estimate, selectedDate, timeSlot]);

  // Is this an existing booking view?
  const isExistingBookingView = Boolean(activeBooking && activeBooking.referenceCode);

  return (
    <div className="min-h-screen bg-[#FDFBF8] text-[#1A1410] flex flex-col font-sans selection:bg-[#C9A96E]/20">
      <Nav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Loading Spinner for Existing Booking Query */}
        {isLoadingBooking && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A96E]" />
            <p className="font-serif text-lg text-[#6E6359]">Retrieving your session reservation...</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: DEPOSIT / TIME HELD & REVISITABLE BOOKING PAGE                    */}
        {/* ========================================================================= */}
        {!isLoadingBooking && isExistingBookingView && (
          <div className="space-y-8 animate-fade-up">
            {/* Confirmation Banner */}
            {activeBooking.status === "cancelled" ? (
              <div className="p-6 rounded-3xl bg-neutral-100 border border-neutral-300 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-neutral-800">
                  <Info className="w-5 h-5 text-neutral-500" />
                  <h2 className="font-serif text-2xl">This Session Has Been Cancelled</h2>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Booking ref <span className="font-mono font-bold">{activeBooking.referenceCode}</span> was released on request.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBooking(null);
                      router.replace("/book", { scroll: false });
                      setStep(1);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1410] text-[#FDFBF8] text-xs font-bold uppercase tracking-wider hover:bg-[#C9A96E] hover:text-[#111111] transition-colors"
                  >
                    <span>Book a New Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : activeBooking.status === "expired" || (activeBooking.status === "awaiting_deposit" && holdRemainingMs === 0) ? (
              <>
                {/* Expired 20-Hour Hold Banner */}
                <div className="p-5 sm:p-6 rounded-3xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-rose-800 block">
                        20-Hour Hold Expired · Slot Released
                      </span>
                      <p className="text-xs sm:text-sm text-rose-900 font-medium mt-0.5">
                        The 20-hour reservation window for {activeBooking.referenceCode} has elapsed without a deposit receipt, so the time slot returned to the public calendar.
                      </p>
                      {reholdError && (
                        <p className="text-xs text-rose-700 font-semibold mt-1.5 bg-rose-100/70 p-2 rounded-lg border border-rose-300">
                          {reholdError}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isUpdatingBooking}
                      onClick={handleReholdBooking}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-[#1A1410] hover:bg-[#C9A96E] text-[#FDFBF8] hover:text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      {isUpdatingBooking ? "Checking..." : "Re-Reserve Slot (20h)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRescheduleOpen(true)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-full border border-rose-300 bg-white text-rose-900 hover:bg-rose-100 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Choose New Time
                    </button>
                  </div>
                </div>
              </>
            ) : activeBooking.status === "confirmed" || activeBooking.status === "completed" ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-800 block">
                      Session Confirmed &amp; Locked
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-900 font-medium">
                      Your deposit is verified and your date is permanently reserved on Osemene&apos;s Maitama calendar.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-900 border border-emerald-300 shrink-0">
                  Slot Locked ✓
                </span>
              </div>
            ) : activeBooking.status === "reported" ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/90 border border-gold/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#B88746] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C6226] block">
                      Deposit Receipt Uploaded · Slot Protected
                    </span>
                    <p className="text-xs sm:text-sm text-[#1A1410] font-medium">
                      We have received your transfer slip. Your time slot is safely protected from expiring while our studio confirms bank settlement.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gold/20 text-[#1A1410] border border-gold/40 shrink-0">
                  Verifying Transfer
                </span>
              </div>
            ) : (
              /* Active 20-Hour Temporary Hold Banner with Live Countdown */
              <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 block">
                      Slot Held Temporarily (20 Hours)
                    </span>
                    <p className="text-xs sm:text-sm text-amber-900 font-medium">
                      Reserved temporarily for 20 hours. Complete your deposit transfer and upload your receipt to lock this session.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex flex-wrap items-center gap-2">
                  {holdRemainingMs !== null && holdRemainingMs > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#1A1410] text-[#E8D5B0] shadow-xs">
                      {pad(Math.floor(holdRemainingMs / 3600000))}h : {pad(Math.floor((holdRemainingMs % 3600000) / 60000))}m : {pad(Math.floor((holdRemainingMs % 60000) / 1000))}s left
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-900 border border-amber-300">
                    {(activeBooking.estimate?.depositPercent || estimate.depositPercent || 70)}% Deposit Required
                  </span>
                </div>
              </div>
            )}

            {activeBooking.status !== "cancelled" && (
              <>
                {/* Main 2-Column Self-Serve Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Bank Transfer & Receipt Flow */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Welcome Title */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs uppercase tracking-wider text-[#6E6359] font-medium">
                          Booking Ref:
                        </span>
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-[#F8F4EE] border border-[#E5DECF] text-[#1A1410]">
                          {activeBooking.referenceCode}
                        </span>
                      </div>
                      <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal">
                        Your time is held,{" "}
                        <span className="text-[#C9A96E] italic font-serif">
                          {activeBooking.client?.name || clientName || "there"}
                        </span>
                      </h1>
                      <p className="text-xs sm:text-sm text-[#6E6359] mt-2 leading-relaxed">
                        Follow the two simple steps below to finalize your booking with Osemene.
                      </p>
                    </div>

                    {/* Step 1 Card: Transfer Details */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5DECF]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#1A1410] text-[#FDFBF8] text-xs font-bold flex items-center justify-center font-mono">
                            1
                          </span>
                          <h3 className="font-serif text-xl sm:text-2xl text-[#1A1410]">
                            Transfer Deposit to Studio Account
                          </h3>
                        </div>
                        <span className="font-serif text-xl sm:text-2xl font-bold text-[#C9A96E]">
                          ₦{(activeBooking.estimate?.depositAmount || estimate.depositAmount).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-[#F8F4EE] border border-[#E5DECF]/80">
                          <span className="text-[#6E6359] uppercase tracking-wider text-[10px] block mb-1">
                            Bank Name
                          </span>
                          <span className="font-bold text-[#1A1410] text-sm">Fidelity Bank</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#F8F4EE] border border-[#E5DECF]/80 flex items-center justify-between">
                          <div>
                            <span className="text-[#6E6359] uppercase tracking-wider text-[10px] block mb-1">
                              Account Number
                            </span>
                            <span className="font-mono font-bold text-[#1A1410] text-sm tracking-wider">
                              5080045230
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard("5080045230", "Account Number Copied")}
                            className="p-2 rounded-xl hover:bg-white text-[#6E6359] hover:text-[#1A1410] transition-colors"
                            title="Copy Account Number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#F8F4EE] border border-[#E5DECF]/80">
                          <span className="text-[#6E6359] uppercase tracking-wider text-[10px] block mb-1">
                            Account Name
                          </span>
                          <span className="font-bold text-[#1A1410] text-sm">LamSparks Photography</span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#F8F4EE] border border-[#E5DECF]/80 flex items-center justify-between">
                          <div>
                            <span className="text-[#6E6359] uppercase tracking-wider text-[10px] block mb-1">
                              Payment Reference
                            </span>
                            <span className="font-mono font-bold text-[#C9A96E] text-sm">
                              {activeBooking.referenceCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeBooking.referenceCode, "Booking Ref Copied")}
                            className="p-2 rounded-xl hover:bg-white text-[#6E6359] hover:text-[#1A1410] transition-colors"
                            title="Copy Reference"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {copyFeedback && (
                        <div className="text-center text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 rounded-lg border border-emerald-200">
                          ✓ {copyFeedback}
                        </div>
                      )}
                    </div>

                    {/* Step 2 Card: WhatsApp Handoff & Direct Receipt Upload Zone */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5DECF]">
                        <span className="w-6 h-6 rounded-full bg-[#1A1410] text-[#FDFBF8] text-xs font-bold flex items-center justify-center font-mono">
                          2
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl text-[#1A1410]">
                          Confirm Deposit &amp; Send Receipt
                        </h3>
                      </div>

                      <p className="text-xs text-[#6E6359] leading-relaxed">
                        To lock your session immediately, choose your preferred method below: send your receipt directly to Osemene on WhatsApp, or upload it here for automated studio reconciliation.
                      </p>

                      {/* Primary Action: Gold Button for WhatsApp Confirmation */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#C9A96E] hover:bg-[#b5955a] text-[#1A1410] font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md group text-center"
                      >
                        <MessageCircle className="w-5 h-5 text-[#1A1410]" />
                        <span>I&apos;ve made my deposit: send receipt on WhatsApp</span>
                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>

                      {/* Direct Upload Zone (Add-on fallback) */}
                      <div className="pt-4 border-t border-[#E5DECF] space-y-3">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#6E6359] block">
                          Or Direct Studio Upload (Instant AI Receipt Verification)
                        </span>

                        <label className="block p-5 rounded-2xl border-2 border-dashed border-[#E5DECF] hover:border-[#C9A96E] bg-[#F8F4EE]/60 hover:bg-[#F8F4EE] transition-colors cursor-pointer text-center space-y-2">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleUploadReceipt}
                            disabled={isUploadingReceipt}
                            className="hidden"
                          />
                          <UploadCloud className="w-8 h-8 text-[#C9A96E] mx-auto" />
                          <div className="text-xs font-semibold text-[#1A1410]">
                            {isUploadingReceipt ? "Analyzing receipt with AI..." : "Click to upload transfer screenshot"}
                          </div>
                          <p className="text-[11px] text-[#6E6359]">
                            JPEG, PNG or PDF. Extracted details will be matched against your session deposit.
                          </p>
                        </label>

                        {/* Upload Status / AI Verification Pill */}
                        {receiptReported && (
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span>Receipt Uploaded Successfully</span>
                            </div>
                            {aiAnalysisResult && (
                              <div className="text-[11px] text-emerald-700 space-y-1 pt-1 border-t border-emerald-200">
                                <div>Bank: {aiAnalysisResult.bankName || "Detected"}</div>
                                <div>Amount: ₦{Number(aiAnalysisResult.extractedAmount || 0).toLocaleString()}</div>
                                <div>Status: {aiAnalysisResult.statusMessage || "Pending Studio Review"}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Save Your Booking Link Card */}
                    <div className="p-6 rounded-3xl bg-[#F8F4EE] border border-[#E5DECF] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A96E] block">
                          Revisitable Link
                        </span>
                        <h4 className="font-serif text-lg text-[#1A1410]">Save Your Personal Booking Link</h4>
                        <p className="text-xs text-[#6E6359]">
                          Bookmark this URL to track deposit confirmation, reschedule, or cancel anytime.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(window.location.href, "Booking Link Copied")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1410] text-[#FDFBF8] hover:bg-[#C9A96E] hover:text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Sticky Summary & Self-Serve Controls */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                    <div className="p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-5">
                      {/* Bespoke Editorial Image Banner */}
                      <div className="relative h-40 sm:h-48 w-full rounded-2xl overflow-hidden border border-[#E5DECF] bg-[#F8F4EE]">
                        <img
                          src={liveSessions[activeBooking.sessionType || sessionType]?.heroImage || "/images/client/weddings_3.jpg"}
                          alt={liveSessions[activeBooking.sessionType || sessionType]?.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-white font-bold bg-[#1A1410]/80 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/20">
                            {liveSessions[activeBooking.sessionType || sessionType]?.title}
                          </span>
                        </div>
                      </div>

                      {/* Session Header */}
                      <div className="pb-3 border-b border-[#E5DECF]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#C9A96E] uppercase tracking-wider font-bold">
                            Session Summary
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                              activeBooking.status === "confirmed" || activeBooking.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : activeBooking.status === "reported"
                                ? "bg-gold/25 text-[#1A1410]"
                                : activeBooking.status === "expired" ||
                                  (activeBooking.status === "awaiting_deposit" && holdRemainingMs === 0)
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {activeBooking.status === "confirmed" || activeBooking.status === "completed"
                              ? "Confirmed"
                              : activeBooking.status === "reported"
                              ? "Verifying Deposit"
                              : activeBooking.status === "expired" ||
                                (activeBooking.status === "awaiting_deposit" && holdRemainingMs === 0)
                              ? "Hold Expired"
                              : "Awaiting Deposit"}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl text-[#1A1410] mt-1">
                          {liveSessions[activeBooking.sessionType || sessionType]?.title}
                        </h3>
                        <p className="text-xs text-[#6E6359] mt-0.5">
                          {activeBooking.answers?.packageName || selectedPackage?.name}
                        </p>
                      </div>

                      {/* Shoot Details */}
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="w-4 h-4 text-[#C9A96E] shrink-0" />
                          <div>
                            <span className="text-[#6E6359] block text-[10px] uppercase">Shoot Date &amp; Time</span>
                            <span className="font-semibold text-[#1A1410]">
                              {activeBooking.shootDateFormatted && activeBooking.shootTimeSlot
                                ? `${new Date(`${activeBooking.shootDateFormatted}T12:00:00`).toLocaleDateString("en-NG", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })} at ${activeBooking.shootTimeSlot}`
                                : activeBooking.shootStart
                                ? `${new Date(activeBooking.shootStart).toLocaleDateString("en-NG", {
                                    timeZone: "Africa/Lagos",
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })} at ${new Date(activeBooking.shootStart).toLocaleTimeString("en-NG", {
                                    timeZone: "Africa/Lagos",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`
                                : `${selectedDate} at ${timeSlot}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-[#C9A96E] shrink-0" />
                          <div>
                            <span className="text-[#6E6359] block text-[10px] uppercase">Studio Location</span>
                            <span className="font-semibold text-[#1A1410]">
                              LamSparks Private Abuja Studio
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mathematically Correct Financial Breakdown */}
                      <div className="pt-4 border-t border-[#E5DECF] space-y-2.5 text-xs">
                        <div className="flex items-center justify-between text-[#6E6359]">
                          <span>Total Investment:</span>
                          <span className="font-semibold text-[#1A1410] text-sm">
                            ₦{(activeBooking.estimate?.total || estimate.total).toLocaleString()}
                          </span>
                        </div>
                        {(() => {
                          const tot = activeBooking.estimate?.total || estimate.total;
                          const dep = activeBooking.estimate?.depositAmount || estimate.depositAmount;
                          const bal = activeBooking.estimate?.balanceAmount || estimate.balanceAmount;
                          const pct = tot > 0 ? Math.round((dep / tot) * 100) : (activeBooking.estimate?.depositPercent || estimate.depositPercent || 70);
                          return (
                            <>
                              <div className="flex items-center justify-between text-amber-900 bg-amber-500/10 p-2.5 rounded-lg border border-amber-300/60 font-semibold">
                                <span>Deposit to Book ({pct}%):</span>
                                <span>₦{dep.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-[#6E6359]">
                                <span>Balance on Shoot Day ({100 - pct}%):</span>
                                <span className="font-semibold text-[#1A1410]">₦{bal.toLocaleString()}</span>
                              </div>
                            </>
                          );
                        })()}
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

            {/* Reschedule Modal (Responsive, Non-cutoff, Scrollable Body with Pinned Actions) */}
            {isRescheduleOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
                <div className="bg-[#FDFBF8] max-w-lg w-full rounded-3xl border border-[#E5DECF] shadow-2xl flex flex-col max-h-[calc(100vh-3rem)] overflow-hidden animate-in zoom-in-95 duration-200">
                  {/* Pinned Modal Header */}
                  <div className="p-5 sm:p-6 pb-4 border-b border-[#E5DECF] shrink-0 flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl text-[#1A1410]">Move to Another Time</h3>
                      <p className="text-xs text-[#6E6359] mt-0.5">
                        Choose a new date and time slot for booking {activeBooking.referenceCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRescheduleOpen(false)}
                      className="w-8 h-8 rounded-full bg-[#F8F4EE] flex items-center justify-center text-[#6E6359] hover:text-[#1A1410] shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Modal Body */}
                  <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Date Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410]">
                        Select New Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                      />
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410]">
                        Select New Time Slot
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {TIME_SLOTS.map((slot) => {
                          const { available, badge } = getSlotStatus(selectedDate, slot.id);
                          const isSelected = timeSlot === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={!available}
                              onClick={() => setTimeSlot(slot.id)}
                              className={`p-2.5 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center justify-center ${
                                isSelected
                                  ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410]"
                                  : !available
                                  ? "bg-[#F8F4EE]/50 text-[#6E6359]/40 border-transparent cursor-not-allowed line-through"
                                  : "bg-[#F8F4EE] text-[#6E6359] border-[#E5DECF] hover:border-[#C9A96E]"
                              }`}
                            >
                              <span>{slot.label}</span>
                              {!available && (
                                <span className="text-[9px] font-mono uppercase no-underline mt-0.5 text-rose-700/70">
                                  {badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Pinned Modal Footer */}
                  <div className="p-4 sm:p-6 pt-3 border-t border-[#E5DECF] bg-[#FDFBF8] shrink-0 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRescheduleOpen(false)}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#6E6359] hover:text-[#1A1410]"
                    >
                      Keep Current Time
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingBooking || !selectedDate || !timeSlot}
                      onClick={handleReschedule}
                      className="px-6 py-2.5 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {isUpdatingBooking ? "Updating..." : "Confirm New Slot"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Calm Bespoke Atelier Cancel Modal (Responsive & Non-cutoff) */}
            {isCancelModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
                <div className="bg-[#FDFBF8] max-w-md w-full rounded-3xl border border-[#E5DECF] shadow-2xl flex flex-col max-h-[calc(100vh-3rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 sm:p-6 pb-3 border-b border-[#E5DECF] shrink-0 space-y-1 text-center sm:text-left">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#C9A96E] font-bold block">
                      Atelier Schedule Update
                    </span>
                    <h3 className="font-headline uppercase tracking-tight text-2xl sm:text-3xl text-[#1A1410] font-black">
                      CANCEL THIS SESSION?
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6E6359] leading-relaxed pt-1">
                      Your time goes back on the calendar for someone else.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 space-y-1.5 overflow-y-auto flex-1">
                    <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410]">
                      Reason (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Schedule conflict, travel dates changed..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-xs text-[#1A1410] focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div className="p-4 sm:p-6 pt-3 border-t border-[#E5DECF] bg-[#FDFBF8] shrink-0 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(false)}
                      className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#1A1410] border border-[#E5DECF] bg-white hover:bg-[#F8F4EE] transition-colors"
                    >
                      Keep it
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingBooking}
                      onClick={handleCancelBooking}
                      className="px-6 py-2.5 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {isUpdatingBooking ? "Updating..." : "Yes, cancel it"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* NEW 5-STEP BESPOKE BOOKING WIZARD                                         */}
        {/* ========================================================================= */}
        {!isLoadingBooking && !isExistingBookingView && (
          <div className="space-y-8 animate-fade-up">
            {/* 5-Step Stepper Header */}
            <div className="space-y-3 pb-6 border-b border-[#E5DECF]">
              <div className="flex items-center justify-between text-xs tracking-wider">
                <span className="text-[10px] font-mono uppercase font-bold text-[#C9A96E] tracking-[0.2em]">
                  LamSparks Atelier Booking
                </span>
                <span className="text-[10px] font-mono uppercase font-bold text-[#1A1410] tracking-wider">
                  Step {step} of 5
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                {[
                  { num: 1, label: "Session" },
                  { num: 2, label: "Package" },
                  { num: 3, label: "Date & Time" },
                  { num: 4, label: "Your Details" },
                  { num: 5, label: "Deposit" },
                ].map((s) => (
                  <div key={s.num} className="space-y-1.5">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        step >= s.num ? "bg-[#C9A96E]" : "bg-[#E5DECF]"
                      }`}
                    />
                    <span
                      className={`hidden sm:block text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                        step === s.num
                          ? "text-[#1A1410]"
                          : step > s.num
                          ? "text-[#C9A96E]"
                          : "text-[#6E6359]/60"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: SESSION DISCOVERY ("WHAT ARE WE SHOOTING?") */}
            {step === 1 && (
              <div className="space-y-8 step-transition">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h1 className="font-headline uppercase tracking-tight text-[#1A1410] font-black text-4xl sm:text-6xl md:text-7xl leading-[0.95]">
                    WHAT ARE WE <span className="text-[#C9A96E]">SHOOTING?</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6359] font-sans">
                    Choose a session to see its packages, prices and terms.
                  </p>
                </div>

                {/* 4-Column Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {Object.values(liveSessions).map((st: any) => {
                    const lowestPrice = livePackages
                      .filter((p) => p.sessionType === st.slug && p.price !== null)
                      .reduce((min, p) => (p.price && p.price < min ? p.price : min), Infinity);
                    const displayPrice = lowestPrice !== Infinity ? lowestPrice : st.fromPrice;

                    return (
                      <div
                        key={st.slug}
                        className="group relative rounded-3xl overflow-hidden bg-[#1A1410] border border-[#E5DECF] shadow-md flex flex-col justify-end min-h-[380px] sm:min-h-[420px] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                      >
                        {/* Background Image */}
                        <img
                          src={st.heroImage || "/images/client/weddings_1.jpg"}
                          alt={st.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Soft Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

                        {/* Card Details */}
                        <div className="relative z-10 p-5 text-white flex flex-col justify-end space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E] block font-mono">
                              {st.standardDeliveryDays ? `${st.standardDeliveryDays} · ` : ""}
                              {displayPrice ? `From ₦${displayPrice.toLocaleString()}` : "Bespoke Consultation"}
                            </span>
                            <h3 className="font-headline text-2xl sm:text-3xl uppercase tracking-tight text-white font-black leading-none">
                              {st.title}
                            </h3>
                          </div>
                          <p className="text-xs text-white/80 line-clamp-2 font-sans font-normal leading-relaxed">
                            {st.tagline || st.description}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSelectSession(st.slug)}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] text-xs font-bold uppercase tracking-wider transition-all shadow-sm group-hover:shadow"
                          >
                            <span>See packages →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: PACKAGE PICKER (Inspired by Reference Video 00:21 - 00:24) */}
            {step === 2 && (
              <div className="space-y-6 sm:space-y-8 step-transition">
                {/* Top Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#6E6359]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 font-bold text-[#1A1410] hover:text-[#C9A96E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change session</span>
                  </button>
                  <span className="text-[#E5DECF]">/</span>
                  <span className="text-[#C9A96E] font-semibold">{liveSessions[sessionType]?.title}</span>
                  <span className="text-[#E5DECF]">/</span>
                  <span className="text-[#6E6359]">Choose a package</span>
                </div>

                {/* Headline: "Pick your package" with key word in gold */}
                <div>
                  <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal">
                    Pick your <span className="text-[#C9A96E] italic font-serif">package</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6359] mt-1.5">
                    Select the collection that fits your celebration. Duration, outfit counts, and inclusions are clearly detailed.
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

                  {/* Right Column: Package Cards Grid & Terms Card */}
                  <div className="lg:col-span-8 space-y-6">
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

                    {/* Terms & Conditions Card Under Packages (Inspired by Video 00:24) */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-[#F8F4EE] border border-[#E5DECF] space-y-4">
                      <div className="flex items-center gap-2 text-[#1A1410]">
                        <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
                        <span className="font-bold text-xs uppercase tracking-widest text-[#1A1410]">
                          Terms &amp; Conditions
                        </span>
                      </div>
                      <ul className="space-y-2.5 text-xs text-[#6E6359] leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0 mt-1.5" />
                          <span>
                            <strong className="text-[#1A1410]">Booking Deposit:</strong> A {estimate.depositPercent}% non-refundable deposit is required to reserve your date and studio time. The remaining balance ({100 - estimate.depositPercent}%) is due on or before shoot day.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0 mt-1.5" />
                          <span>
                            <strong className="text-[#1A1410]">Delivery Turnaround:</strong> Retouched soft-copy images are delivered within {liveSessions[sessionType]?.standardDeliveryDays || "5 to 7 business days"} via your private, high-resolution online gallery.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0 mt-1.5" />
                          <span>
                            <strong className="text-[#1A1410]">Additional Edited Copies:</strong> Extra retouched images can be ordered at ₦10,000 each after your private gallery preview.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0 mt-1.5" />
                          <span>
                            <strong className="text-[#1A1410]">Atelier Studio Suite:</strong> Private dressing suite, climate-controlled studio, and professional lighting director are included with all sessions.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0 mt-1.5" />
                          <span>
                            <strong className="text-[#1A1410]">Rescheduling:</strong> Rescheduling is complimentary when requested at least 48 hours before your session time.
                          </span>
                        </li>
                      </ul>
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
                    onClick={() => setStep(3)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-md group"
                  >
                    <span>Choose a Date</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: LIVE CALENDAR & TIME (Inspired by Reference Video 00:27 - 00:30) */}
            {step === 3 && (
              <div className="space-y-8 step-transition">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#6E6359] mb-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1 font-semibold text-[#1A1410] hover:text-[#C9A96E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Packages</span>
                  </button>
                  <span>/</span>
                  <span className="text-[#C9A96E] font-medium">{liveSessions[sessionType]?.title}</span>
                  <span>/</span>
                  <span className="text-[#6E6359]">{selectedPackage?.name}</span>
                  <span>/</span>
                  <span>Date &amp; Time</span>
                </div>

                <div>
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
                          onClick={prevMonth}
                          className="w-9 h-9 rounded-full border border-[#E5DECF] hover:border-[#1A1410] flex items-center justify-center text-[#1A1410] hover:bg-[#F8F4EE] transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="w-9 h-9 rounded-full border border-[#E5DECF] hover:border-[#1A1410] flex items-center justify-center text-[#1A1410] hover:bg-[#F8F4EE] transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Day-of-week header */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <span key={day} className="text-[11px] uppercase tracking-wider font-bold text-[#6E6359] py-1">
                          {day}
                        </span>
                      ))}
                    </div>

                    {/* Calendar Day Grid (Square & Generous 2x Proportion) */}
                    <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                      {calendarDays.map((cd, idx) => {
                        if (!cd.isCurrentMonth) {
                          return <div key={idx} className="w-full aspect-square" />;
                        }

                        const isSelected = selectedDate === cd.dateStr;
                        const isUnavailable = cd.isPast || cd.isBlocked || cd.openCount === 0;

                        return (
                          <button
                            key={cd.dateStr}
                            type="button"
                            disabled={isUnavailable}
                            onClick={() => {
                              setSelectedDate(cd.dateStr);
                              setTimeSlot("");
                            }}
                            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center relative text-sm sm:text-base md:text-lg font-semibold transition-all ${
                              isSelected
                                ? "bg-[#1A1410] text-[#FDFBF8] shadow-lg ring-2 ring-[#C9A96E] scale-[1.03]"
                                : isUnavailable
                                ? "text-[#6E6359]/30 cursor-not-allowed bg-transparent"
                                : "hover:bg-[#F8F4EE] text-[#1A1410] hover:text-[#C9A96E] border border-transparent hover:border-[#E5DECF] shadow-xs hover:scale-[1.02]"
                            }`}
                          >
                            <span className="leading-none">{cd.dayNum}</span>
                            {!isUnavailable && !isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="pt-4 border-t border-[#E5DECF] flex items-center justify-between flex-wrap gap-4 text-xs text-[#6E6359]">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Free Slot</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1A1410]" />
                          <span>Selected Day</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#E5DECF]" />
                          <span>Full / Closed</span>
                        </div>
                      </div>
                      {isLoadingAvailability && (
                        <span className="text-[11px] font-mono text-[#C9A96E] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Syncing live calendar...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Col: Sticky Time Slots grouped by Morning, Afternoon, Evening */}
                  <div className="lg:col-span-5 lg:sticky lg:top-24 p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6">
                    <div>
                      <span className="text-[10px] text-[#C9A96E] uppercase tracking-wider font-bold block mb-1">
                        Select Session Time
                      </span>
                      <h3 className="font-serif text-2xl text-[#1A1410]">
                        {selectedDate
                          ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })
                          : "Pick a date first"}
                      </h3>
                      <p className="text-xs text-[#6E6359] mt-0.5">
                        {blockedDays.includes(selectedDate)
                          ? "Studio is closed on this selected date."
                          : "Booked slots & active 20-hour holds are locked in real time."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {["Morning", "Afternoon", "Evening (Golden Hour)"].map((period) => {
                        const slots = TIME_SLOTS.filter((s) => s.period.startsWith(period.split(" ")[0]));
                        return (
                          <div key={period} className="space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6359] block">
                              {period}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {slots.map((slot) => {
                                const isSelected = timeSlot === slot.id;
                                const { available, badge } = getSlotStatus(selectedDate, slot.id);
                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    disabled={!selectedDate || !available}
                                    onClick={() => setTimeSlot(slot.id)}
                                    className={`p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                                      isSelected
                                        ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410] shadow-sm"
                                        : !selectedDate || !available
                                        ? "bg-[#F8F4EE]/50 text-[#6E6359]/40 border-transparent cursor-not-allowed line-through"
                                        : "bg-[#F8F4EE] text-[#1A1410] border-[#E5DECF] hover:border-[#C9A96E]"
                                    }`}
                                  >
                                    <span>{slot.label}</span>
                                    {!available && selectedDate ? (
                                      <span className="text-[9px] font-mono uppercase no-underline text-[#6E6359]/70">
                                        {badge}
                                      </span>
                                    ) : (
                                      <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-[#C9A96E]" : "text-[#6E6359]"}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Total Bar */}
                <div className="sticky bottom-4 z-30 p-4 sm:p-5 rounded-2xl bg-[#1A1410] text-[#FDFBF8] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-[#C9A96E] uppercase tracking-widest font-bold block">
                      {selectedPackage?.name} · {selectedDate || "Select day"} {timeSlot ? `at ${timeSlot}` : ""}
                    </span>
                    <div className="text-sm sm:text-base font-medium">
                      Deposit to lock slot: ₦{estimate.depositAmount.toLocaleString()} ({estimate.depositPercent}%)
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-3 rounded-full text-xs font-semibold text-[#FDFBF8] hover:text-[#C9A96E]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!selectedDate || !timeSlot}
                      onClick={() => setStep(4)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-md group disabled:opacity-40"
                    >
                      <span>Continue to Details</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: YOUR DETAILS (Decluttered, Frictionless & Under 30s) */}
            {step === 4 && (
              <div className="space-y-8 step-transition">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#6E6359] mb-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1 font-semibold text-[#1A1410] hover:text-[#C9A96E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Date &amp; Time</span>
                  </button>
                  <span>/</span>
                  <span>Almost Done</span>
                </div>

                <div>
                  <h1 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal">
                    Almost <span className="text-[#C9A96E] italic font-serif">done</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[#6E6359] mt-1.5">
                    Your contact details and wardrobe notes for session day.
                  </p>
                </div>

                {/* 2-Column Layout: Form on Left, Sticky Summary on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Clean Frictionless Form */}
                  <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6">
                    {/* Section 1: Contact Details */}
                    <div className="space-y-4">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#C9A96E] block pb-1 border-b border-[#E5DECF]">
                        Client Information
                      </span>

                      {/* Full Name */}
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
                          Nigerian numbers normalized automatically. Used for shoot coordination &amp; online gallery delivery.
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

                    {/* Section 2: Helpful Session Notes & Wardrobe Ideas */}
                    <div className="space-y-4 pt-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#C9A96E] block pb-1 border-b border-[#E5DECF]">
                        Session Notes &amp; Wardrobe Ideas
                      </span>

                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-[#1A1410] mb-1.5">
                          Shoot Details &amp; Special Requests
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Location ideas, outfits, number of people or children, makeup artist, special requests..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] text-sm text-[#1A1410] focus:bg-[#FDFBF8] focus:outline-none focus:border-[#C9A96E] leading-relaxed"
                        />
                      </div>

                      {/* Terms & Conditions Checkbox */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E5DECF] bg-[#F8F4EE] cursor-pointer hover:border-[#C9A96E]/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={termsAgreed}
                          onChange={(e) => setTermsAgreed(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-[#E5DECF] text-[#C9A96E] focus:ring-[#C9A96E]"
                        />
                        <span className="text-xs text-[#1A1410] leading-relaxed">
                          I agree to the {estimate.depositPercent}% booking deposit requirement to hold this studio time. Remaining balance is due on shoot day. <span className="text-[#C9A96E]">*</span>
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
                          Optional: I am comfortable with LamSparks featuring selected frames in the atelier portfolio.
                        </span>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-[#E5DECF] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-[#1A1410] hover:text-[#C9A96E]"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || !clientName.trim() || !whatsappPhone.trim() || !termsAgreed}
                        onClick={handleCreateBooking}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] font-sans text-xs uppercase tracking-wider font-bold transition-all disabled:opacity-40 shadow-md group"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
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

                  {/* Right Column: Sticky Order Summary */}
                  <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#FDFBF8] border border-[#E5DECF] shadow-sm space-y-6 sticky top-24">
                    {/* Bespoke Service Image Banner in Summary Card */}
                    <div className="relative h-36 sm:h-44 w-full rounded-2xl overflow-hidden border border-[#E5DECF] bg-[#F8F4EE]">
                      <img
                        src={liveSessions[sessionType]?.heroImage || "/images/client/weddings_3.jpg"}
                        alt={liveSessions[sessionType]?.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white font-bold bg-[#1A1410]/80 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/20">
                          {liveSessions[sessionType]?.title}
                        </span>
                      </div>
                    </div>

                    <div className="pb-3 border-b border-[#E5DECF]">
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
                          {(selectedPackage as any)?.durationMinutes ? `${(selectedPackage as any).durationMinutes} mins` : "Standard Duration"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#6E6359]">Studio Location:</span>
                        <span className="font-semibold text-[#1A1410]">
                          LamSparks Private Abuja Studio
                        </span>
                      </div>
                    </div>

                    {/* Financial Breakdown with Mathematically Correct Percentages */}
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

                    <div className="pt-2">
                      <div className="p-3 rounded-xl bg-[#F8F4EE] border border-[#E5DECF] text-[11px] text-[#6E6359] flex items-center justify-between">
                        <span>Delivery Timeline</span>
                        <span className="font-semibold text-[#1A1410]">{estimate.deliveryTimeline}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
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
