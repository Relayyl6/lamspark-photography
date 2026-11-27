"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Search,
  CheckCircle,
  Filter,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Plus,
  Loader2,
  CalendarCheck,
  AlertCircle,
  Lock,
  Trash2,
  Eye,
  AlertTriangle,
  X,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { extractDateAndSlotWAT, parseSlotToTimestampsWAT } from "@/lib/booking-hold";
import { StudioCalendarManager } from "./StudioCalendarManager";

const STUDIO_TIME_SLOTS = [
  { id: "09:30 AM", label: "09:30 AM", period: "Morning" },
  { id: "11:00 AM", label: "11:00 AM", period: "Morning" },
  { id: "01:30 PM", label: "01:30 PM", period: "Afternoon" },
  { id: "03:00 PM", label: "03:00 PM", period: "Afternoon" },
  { id: "04:30 PM", label: "04:30 PM", period: "Afternoon" },
  { id: "05:30 PM", label: "05:30 PM", period: "Evening" },
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function normalizeSlot(s: string): string {
  return (s || "").trim().toUpperCase().replace(/^0/, "");
}

function normalizeDate(d: string): string {
  return (d || "").trim().slice(0, 10);
}

interface BookingItem {
  id: string;
  enquiry_id: string;
  shoot_start: string;
  shoot_end: string;
  location_type: string;
  location_detail: string | null;
  status: "confirmed" | "rescheduled" | "completed" | "cancelled" | "shooting" | "held" | "expired";
  hold_expires_at?: string | null;
  reschedule_count: number;
  reference_code: string;
  session_type: string;
  purpose_text: string;
  agreed_price: number;
  deposit_recorded: number;
  balance_due: number;
  bank_reference: string | null;
  client: {
    id: string;
    name: string;
    whatsapp: string;
    email: string | null;
  };
  created_at: string;
}

export function BookingsTracker() {
  const [viewMode, setViewMode] = useState<"roster" | "calendar">("roster");
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<BookingItem | null>(null);
  const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [bookedSlots, setBookedSlots] = useState<Array<{ date: string; timeSlot: string; status: string }>>([]);
  const [lockedSlots, setLockedSlots] = useState<Array<{ date: string; timeSlot: string; reason?: string }>>([]);
  const [blockedDays, setBlockedDays] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-seed date, slot, and calendar month from the selected booking when opening Reschedule modal
  useEffect(() => {
    if (!selectedBooking) return;
    const parsed = selectedBooking.shoot_start
      ? extractDateAndSlotWAT(selectedBooking.shoot_start)
      : { date: "", timeSlot: "" };
    if (parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      setRescheduleDate(parsed.date);
      const [y, m] = parsed.date.split("-").map((v) => parseInt(v, 10));
      setCalendarMonth(new Date(y, m - 1, 1));
    } else {
      setRescheduleDate("");
      setCalendarMonth(new Date());
    }
    setRescheduleSlot("");
  }, [selectedBooking]);

  // Fetch live studio availability for the active calendar month while modal is open
  useEffect(() => {
    if (!selectedBooking) return;
    let active = true;
    const monthParam = `${calendarMonth.getFullYear()}-${pad2(calendarMonth.getMonth() + 1)}`;
    setIsLoadingAvailability(true);
    fetch(`/api/availability?month=${monthParam}&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success) {
          setBookedSlots(
            (data.bookedSlots || []).map((b: any) => ({
              date: normalizeDate(b.date),
              timeSlot: b.timeSlot,
              status: b.status,
            }))
          );
          setLockedSlots(
            (data.lockedSlots || []).map((l: any) => ({
              date: normalizeDate(l.date),
              timeSlot: l.timeSlot,
              reason: l.reason,
            }))
          );
          setBlockedDays((data.blockedDays || []).map((d: any) => normalizeDate(d.date || d)));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingAvailability(false);
      });
    return () => {
      active = false;
    };
  }, [selectedBooking, calendarMonth]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

    const days: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isBlocked: boolean;
      openCount: number;
    }[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ dateStr: "", dayNum: 0, isCurrentMonth: false, isPast: true, isBlocked: false, openCount: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad2(month + 1)}-${pad2(d)}`;
      const isPast = dateStr < todayStr;
      const isBlocked = blockedDays.includes(dateStr);
      const takenCount =
        bookedSlots.filter((b) => b.date === dateStr).length +
        lockedSlots.filter((l) => l.date === dateStr).length;
      const openCount = isPast || isBlocked ? 0 : Math.max(0, STUDIO_TIME_SLOTS.length - takenCount);
      days.push({ dateStr, dayNum: d, isCurrentMonth: true, isPast, isBlocked, openCount });
    }

    return days;
  }, [calendarMonth, bookedSlots, lockedSlots, blockedDays]);

  const getSlotStatus = (dateStr: string, slotLabel: string) => {
    if (!dateStr) return { available: true, badge: "" };
    const normDate = normalizeDate(dateStr);
    const normSlot = normalizeSlot(slotLabel);
    const currentSlot = selectedBooking?.shoot_start
      ? extractDateAndSlotWAT(selectedBooking.shoot_start)
      : null;

    if (
      currentSlot &&
      normalizeDate(currentSlot.date) === normDate &&
      normalizeSlot(currentSlot.timeSlot) === normSlot
    ) {
      return { available: false, badge: "Current" };
    }
    if (blockedDays.includes(normDate)) {
      return { available: false, badge: "Closed" };
    }
    const locked = lockedSlots.find(
      (l) => normalizeDate(l.date) === normDate && normalizeSlot(l.timeSlot) === normSlot
    );
    if (locked) return { available: false, badge: "Reserved" };
    const booked = bookedSlots.find(
      (b) => normalizeDate(b.date) === normDate && normalizeSlot(b.timeSlot) === normSlot
    );
    if (booked) {
      return { available: false, badge: booked.status === "held" ? "Held (20h)" : "Booked" };
    }
    return { available: true, badge: "" };
  };

  useEffect(() => {
    if (selectedBooking || bookingToDelete || detailBooking) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedBooking, bookingToDelete, detailBooking]);

  async function loadBookings() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "All" && b.status !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.client.name.toLowerCase().includes(q) ||
          b.reference_code.toLowerCase().includes(q) ||
          b.purpose_text.toLowerCase().includes(q) ||
          b.session_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  // Update booking status
  async function handleUpdateStatus(bookingId: string, nextStatus: string) {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus as any } : b))
        );
        setStatusMessage(`Booking status updated to ${nextStatus}`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle permanent deletion of a booking
  async function handleDeleteBooking(booking: BookingItem) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/bookings?id=${encodeURIComponent(booking.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b.id !== booking.id));
        setBookingToDelete(null);
        setDetailBooking(null);
        setStatusMessage(`Booking ${booking.reference_code} permanently deleted.`);
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        alert(data.error || "Failed to delete booking");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  // Handle rescheduling
  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBooking || !rescheduleDate || !rescheduleSlot) return;

    setIsUpdating(true);
    try {
      const { start: startIso, end: endIso } = parseSlotToTimestampsWAT(
        rescheduleDate,
        rescheduleSlot,
        120
      );

      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          status: "rescheduled",
          shootStart: startIso,
          shootEnd: endIso,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? {
                  ...b,
                  status: "rescheduled",
                  shoot_start: startIso,
                  shoot_end: endIso,
                  reschedule_count: b.reschedule_count + 1,
                }
              : b
          )
        );
        setStatusMessage(`Session rescheduled to ${rescheduleDate} · ${rescheduleSlot}`);
        setTimeout(() => setStatusMessage(null), 3500);
        setSelectedBooking(null);
        setRescheduleDate("");
        setRescheduleSlot("");
      } else {
        alert(data.error || "Could not reschedule to this date & time.");
      }
    } catch (err) {
      console.error("Failed to reschedule:", err);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Studio Shoot Schedule &amp; Production Roster
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Bookings &amp; Session Tracker
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Track confirmed client sessions, shoot dates, location logistics, and remaining balances due on shoot day.
          </p>
        </div>

        {statusMessage && (
          <div className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* View Switcher: Bookings List vs Live Calendar & Slot Locks */}
      <div className="flex items-center gap-2 p-1 bg-warm-white rounded-2xl border border-line w-fit">
        <button
          type="button"
          onClick={() => setViewMode("roster")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-body font-semibold transition-all ${
            viewMode === "roster"
              ? "bg-deep text-warm-white shadow-xs"
              : "text-brown hover:text-deep hover:bg-cream"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Bookings Roster ({bookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("calendar")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-body font-semibold transition-all ${
            viewMode === "calendar"
              ? "bg-deep text-warm-white shadow-xs"
              : "text-brown hover:text-deep hover:bg-cream"
          }`}
        >
          <Lock className="w-4 h-4 text-gold" />
          <span>Live Calendar &amp; Slot Locks (Operability)</span>
        </button>
      </div>

      {viewMode === "calendar" ? (
        <StudioCalendarManager />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-warm-white p-4 rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, ref (LS-XXXX), or session..."
              className="w-full pl-9 pr-4 py-2 rounded-full border border-line bg-cream/50 text-xs font-body text-deep focus:outline-none focus:border-gold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-deep text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {["All", "Held", "Confirmed", "Expired", "Shooting", "Rescheduled", "Completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all shrink-0 ${
                  statusFilter.toLowerCase() === st.toLowerCase()
                    ? "bg-deep text-warm-white shadow-xs"
                    : "bg-cream text-brown hover:bg-warm-white border border-line"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Loading confirmed shoot roster from Neon DB...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-warm-white rounded-2xl border border-line">
          <CalendarCheck className="w-10 h-10 text-gold mx-auto mb-3 opacity-60" />
          <h3 className="font-display text-2xl text-deep font-medium">No Bookings Found</h3>
          <p className="font-body text-xs text-muted mt-1">
            {searchQuery || statusFilter !== "All"
              ? "No sessions match your filter criteria."
              : "When client deposits are verified, confirmed shoots automatically appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookings.map((b) => {
            const startDate = new Date(b.shoot_start);
            const isToday =
              startDate.toDateString() === new Date().toDateString();

            return (
              <div
                key={b.id}
                className={`bg-warm-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isToday
                    ? "border-gold/80 ring-2 ring-gold/20 bg-amber-50/20"
                    : "border-line"
                }`}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-gold/15 text-gold px-2.5 py-0.5 rounded-full border border-gold/30">
                      {b.reference_code}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                        b.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : b.status === "rescheduled"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : b.status === "completed"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : b.status === "held"
                          ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                          : b.status === "expired"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-cream text-muted"
                      }`}
                    >
                      {b.status === "held"
                        ? "Held · 20h Hold"
                        : b.status === "expired"
                        ? "Hold Expired"
                        : b.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-xl text-deep font-semibold">
                      {b.client.name}
                    </h3>
                    <span className="text-xs font-body text-gold font-bold uppercase tracking-wider block">
                      {b.session_type} Session
                    </span>
                    <p className="font-body text-xs text-brown/80 mt-1 line-clamp-1">
                      {b.purpose_text}
                    </p>
                  </div>
                </div>

                {/* Shoot Date & Logistics */}
                <div className="p-3.5 bg-cream/60 rounded-xl border border-line/60 space-y-2 text-xs font-body">
                  <div className="flex items-center gap-2 text-deep font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    <span>
                      {startDate.toLocaleDateString("en-NG", {
                        timeZone: "Africa/Lagos",
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-muted font-mono font-normal">
                      · {startDate.toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-brown">
                    <MapPin className="w-3.5 h-3.5 text-gold" />
                    <span className="capitalize">
                      {b.location_type === "studio"
                        ? "Maitama Studio Suite, Abuja"
                        : b.location_detail || "Outdoor / Client Residence"}
                    </span>
                  </div>

                  {b.bank_reference && (
                    <div className="text-[11px] text-muted pt-1 border-t border-line/40">
                      Bank Ref: <strong className="text-deep font-mono">{b.bank_reference}</strong>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="flex items-center justify-between text-xs font-body pt-1">
                  <div>
                    <span className="text-[10px] text-muted uppercase block">Deposit Paid</span>
                    <span className="font-bold text-emerald-700">
                      ₦{b.deposit_recorded.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted uppercase block">Balance Due (Shoot Day)</span>
                    <span className="font-bold text-deep">
                      ₦{b.balance_due.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-3 border-t border-line flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${b.client.whatsapp.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(b.client.name)}!%20Regarding%20your%20upcoming%20LamSparks%20shoot%20(${b.reference_code})`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-body font-semibold transition-all shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setDetailBooking(b)}
                      className="px-2.5 py-1.5 rounded-full bg-gold/15 hover:bg-gold/30 text-gold-darker border border-gold/40 text-xs font-body font-semibold transition-all inline-flex items-center gap-1 shrink-0"
                      title="View full booking details"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-2.5 py-1.5 rounded-full bg-cream hover:bg-warm-white border border-line text-xs font-body font-semibold text-deep transition-all shrink-0"
                      title="Reschedule session"
                    >
                      Reschedule
                    </button>

                    {b.status === "held" && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, "confirmed")}
                        className="px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-warm-white text-xs font-body font-semibold transition-all shrink-0"
                      >
                        Confirm Slot
                      </button>
                    )}

                    {b.status === "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, "completed")}
                        className="px-3 py-1.5 rounded-full bg-deep hover:bg-gold hover:text-deep text-warm-white text-xs font-body font-semibold transition-all shrink-0"
                      >
                        Complete Shoot
                      </button>
                    )}

                    {/* Delete Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setBookingToDelete(b)}
                      className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center transition-colors shrink-0"
                      title={`Delete booking ${b.reference_code}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Reschedule Modal */}
      {mounted && selectedBooking && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-warm-white rounded-3xl border border-line max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
              <div>
                <h3 className="font-display text-lg sm:text-xl text-deep font-semibold">
                  Reschedule Shoot
                </h3>
                <span className="font-mono text-[11px] sm:text-xs text-gold">
                  Ref: {selectedBooking.reference_code} · {selectedBooking.client.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full border border-line bg-cream/60 flex items-center justify-center text-muted hover:text-deep transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                {/* Custom Atelier Month Calendar */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8F4EE] border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-gold font-bold block">
                        Atelier Availability
                      </span>
                      <h4 className="font-display text-lg text-deep font-medium leading-tight">
                        {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                          )
                        }
                        className="w-8 h-8 rounded-full border border-line bg-white hover:border-deep flex items-center justify-center text-deep transition-colors"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarMonth(
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                          )
                        }
                        className="w-8 h-8 rounded-full border border-line bg-white hover:border-deep flex items-center justify-center text-deep transition-colors"
                        aria-label="Next month"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <span key={day} className="text-[10px] uppercase tracking-wider font-bold text-muted py-0.5">
                        {day}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map((cd, idx) => {
                      if (!cd.isCurrentMonth) {
                        return <div key={idx} className="w-full aspect-square" />;
                      }

                      const isSelected = rescheduleDate === cd.dateStr;
                      const isUnavailable = cd.isPast || cd.isBlocked;

                      return (
                        <button
                          key={cd.dateStr}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => {
                            setRescheduleDate(cd.dateStr);
                            setRescheduleSlot("");
                          }}
                          className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                            isSelected
                              ? "bg-deep text-warm-white shadow-md ring-2 ring-gold"
                              : isUnavailable
                              ? "text-muted/30 cursor-not-allowed bg-transparent"
                              : "hover:bg-white text-deep hover:text-gold border border-transparent hover:border-line"
                          }`}
                        >
                          <span className="leading-none">{cd.dayNum}</span>
                          {!isUnavailable && !isSelected && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                cd.openCount > 0 ? "bg-emerald-500" : "bg-line"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Open</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-deep inline-block" />
                        <span>Selected</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-line inline-block" />
                        <span>Full</span>
                      </span>
                    </div>
                    {isLoadingAvailability && (
                      <span className="text-[10px] font-mono text-gold flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Syncing...
                      </span>
                    )}
                  </div>
                </div>

                {/* Studio Time Slots */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider">
                      Select New Time Slot (WAT) *
                    </label>
                    {rescheduleDate && (
                      <span className="text-xs text-gold font-medium">
                        {new Date(rescheduleDate + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {!rescheduleDate ? (
                    <div className="p-3.5 rounded-xl border border-dashed border-line text-center text-xs text-muted">
                      Choose a date on the calendar above to view studio time slots.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {STUDIO_TIME_SLOTS.map((slot) => {
                        const { available, badge } = getSlotStatus(rescheduleDate, slot.id);
                        const isSelected = normalizeSlot(rescheduleSlot) === normalizeSlot(slot.id);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!available}
                            onClick={() => setRescheduleSlot(slot.id)}
                            className={`p-2.5 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center justify-center ${
                              isSelected
                                ? "bg-deep text-warm-white border-deep shadow-sm"
                                : !available
                                ? "bg-cream/50 text-muted/45 border-transparent cursor-not-allowed line-through"
                                : "bg-white text-brown border-line hover:border-gold hover:text-deep"
                            }`}
                          >
                            <span>{slot.label}</span>
                            {!available && (
                              <span className="text-[9px] font-mono uppercase no-underline mt-0.5 text-rose-700/80">
                                {badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted font-body leading-relaxed">
                  Per studio policy, date changes within 72 hours of the original shoot date carry no penalty when coordinated with the Maitama studio assistant.
                </p>
              </div>

              <div className="px-5 py-3.5 border-t border-line bg-warm-white shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-line text-xs font-body font-semibold text-muted hover:text-deep hover:bg-cream text-center transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !rescheduleDate || !rescheduleSlot}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all text-center disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Confirm New Date"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {mounted && bookingToDelete && createPortal(
        <div
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setBookingToDelete(null)}
        >
          <div
            className="bg-warm-white rounded-2xl border border-line max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 text-rose-900">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl text-deep font-semibold">
                  Delete Booking · {bookingToDelete.reference_code}
                </h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete this booking for{" "}
                  <strong>{bookingToDelete.client.name}</strong> ({bookingToDelete.session_type} Session)? This will release the calendar slot and permanently remove all associated records from Neon DB. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-line flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBookingToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-deep hover:bg-cream transition-colors"
              >
                Cancel (Keep Safe)
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteBooking(bookingToDelete)}
                className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-warm-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? "Deleting..." : "Yes, Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Comprehensive Booking Details Modal */}
      {mounted && detailBooking && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setDetailBooking(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-warm-white rounded-3xl shadow-2xl border border-line p-5 sm:p-7 max-h-[92vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs uppercase bg-gold/15 text-gold font-bold px-2.5 py-0.5 rounded-lg border border-gold/30">
                    {detailBooking.reference_code}
                  </span>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cream text-muted border border-line">
                    Status: {detailBooking.status}
                  </span>
                </div>
                <h2 className="font-display text-2xl text-deep font-semibold">
                  {detailBooking.client.name}
                </h2>
                <span className="text-xs font-body text-gold font-bold uppercase tracking-wider block">
                  {detailBooking.session_type} Session
                </span>
              </div>
              <button
                onClick={() => setDetailBooking(null)}
                className="w-8 h-8 rounded-xl hover:bg-cream border border-line text-deep flex items-center justify-center shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Client Profile */}
            <div className="p-4 rounded-2xl bg-[#FBF9F6] border border-line space-y-2.5 text-xs font-body">
              <span className="text-[10px] font-mono uppercase font-bold text-gold tracking-wider block">
                Client Contact
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-muted block text-[10px] uppercase">Name</span>
                  <strong className="text-deep font-semibold">{detailBooking.client.name}</strong>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">WhatsApp</span>
                  <a
                    href={`https://wa.me/${detailBooking.client.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    {detailBooking.client.whatsapp} &rarr;
                  </a>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Email</span>
                  <span className="text-deep truncate block">
                    {detailBooking.client.email || "Not provided"}
                  </span>
                </div>
              </div>
            </div>

            {/* Logistics & Timing */}
            <div className="p-4 rounded-2xl bg-cream/40 border border-line space-y-2 text-xs font-body">
              <span className="text-[10px] font-mono uppercase font-bold text-deep tracking-wider block">
                Logistics &amp; Reserved Slot
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-deep font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span>
                    {new Date(detailBooking.shoot_start).toLocaleDateString("en-NG", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {new Date(detailBooking.shoot_start).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-brown">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  <span className="capitalize">
                    {detailBooking.location_type === "studio"
                      ? "Maitama Studio Suite, Abuja"
                      : detailBooking.location_detail || "Outdoor / Client Residence"}
                  </span>
                </div>
                {detailBooking.purpose_text && (
                  <div className="col-span-2 pt-1">
                    <span className="text-muted block text-[10px] uppercase">Purpose / Occasion</span>
                    <span className="text-deep">{detailBooking.purpose_text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financials */}
            <div className="p-4 rounded-2xl bg-warm-white border border-line space-y-2 text-xs font-body">
              <span className="text-[10px] font-mono uppercase font-bold text-gold tracking-wider block">
                Financial Breakdown
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-muted block text-[10px] uppercase">Total Agreed</span>
                  <strong className="text-sm font-display text-deep">
                    ₦{detailBooking.agreed_price.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Deposit Recorded</span>
                  <strong className="text-sm font-display text-emerald-700">
                    ₦{detailBooking.deposit_recorded.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase">Balance Due (Shoot Day)</span>
                  <strong className="text-sm font-display text-deep">
                    ₦{detailBooking.balance_due.toLocaleString()}
                  </strong>
                </div>
              </div>
              {detailBooking.bank_reference && (
                <div className="text-[11px] text-muted pt-2 border-t border-line/40">
                  Bank Reference: <strong className="text-deep font-mono">{detailBooking.bank_reference}</strong>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const b = detailBooking;
                  setDetailBooking(null);
                  setBookingToDelete(b);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-body font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Booking</span>
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const b = detailBooking;
                    setDetailBooking(null);
                    setSelectedBooking(b);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-line bg-cream hover:bg-warm-white text-xs font-body font-semibold text-deep transition-all"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setDetailBooking(null)}
                  className="px-6 py-2.5 rounded-xl bg-deep hover:bg-gold hover:text-deep text-warm-white text-xs font-body font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
