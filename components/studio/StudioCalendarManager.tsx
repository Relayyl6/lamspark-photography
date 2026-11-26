"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Loader2,
  User,
  Phone,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { SESSION_TYPES } from "@/lib/catalog/seed";

const TIME_SLOTS = [
  "09:30 AM",
  "11:00 AM",
  "01:30 PM",
  "03:00 PM",
  "04:30 PM",
  "05:30 PM",
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function normalizeSlot(s: string): string {
  return (s || "").trim().toUpperCase().replace(/^0/, "");
}

function normalizeDate(d: string): string {
  return (d || "").trim().slice(0, 10);
}

export function StudioCalendarManager() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  });

  // State from backend
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [lockedSlots, setLockedSlots] = useState<any[]>([]);
  const [blockedDays, setBlockedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Slot Lock Form state
  const [activeLockingSlot, setActiveLockingSlot] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState("");

  // Block Day Form state
  const [isBlockDayOpen, setIsBlockDayOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  // Quick Manual / Phone Booking Modal state
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [quickClientName, setQuickClientName] = useState("");
  const [quickClientPhone, setQuickClientPhone] = useState("");
  const [quickSessionType, setQuickSessionType] = useState("toddler");
  const [quickTimeSlot, setQuickTimeSlot] = useState(TIME_SLOTS[0]);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const monthParam = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;

  // Load data for month
  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/availability?month=${monthParam}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.success) {
        setBookedSlots(data.bookedSlots || []);
        setLockedSlots(data.lockedSlots || []);
        setBlockedDays(data.blockedDays || []);
      }
    } catch (err) {
      console.error("Failed to load studio calendar data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [monthParam]);

  // Execute Slot Lock / Unlock Action with optimistic updates
  const handleSlotAction = async (action: "lock_slot" | "unlock_slot", timeSlot: string, reason?: string) => {
    setIsActionPending(true);

    const normTargetDate = normalizeDate(selectedDateStr);
    const normTargetSlot = normalizeSlot(timeSlot);

    // Optimistic UI update
    if (action === "unlock_slot") {
      setLockedSlots((prev) =>
        prev.filter(
          (l) => !(normalizeDate(l.date) === normTargetDate && normalizeSlot(l.timeSlot) === normTargetSlot)
        )
      );
    } else if (action === "lock_slot") {
      setLockedSlots((prev) => [
        ...prev.filter(
          (l) => !(normalizeDate(l.date) === normTargetDate && normalizeSlot(l.timeSlot) === normTargetSlot)
        ),
        { date: normTargetDate, timeSlot, reason: reason || "Studio Reserved" },
      ]);
    }

    try {
      const res = await fetch("/api/admin/calendar-locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          date: selectedDateStr,
          timeSlot,
          reason: reason || "Studio Reserved",
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.lockedSlots)) {
          setLockedSlots(data.lockedSlots);
        }
        setStatusMessage(action === "lock_slot" ? `Slot ${timeSlot} locked successfully` : `Slot ${timeSlot} unlocked`);
        setTimeout(() => setStatusMessage(null), 3000);
        setActiveLockingSlot(null);
        setLockReason("");
        await loadCalendarData();
      } else {
        alert(data.error || "Action failed");
        await loadCalendarData();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      await loadCalendarData();
    } finally {
      setIsActionPending(false);
    }
  };

  // Execute Block / Unblock Day Action with optimistic updates
  const handleDayAction = async (action: "block_day" | "unblock_day") => {
    setIsActionPending(true);
    const normTargetDate = normalizeDate(selectedDateStr);

    if (action === "block_day") {
      setBlockedDays((prev) => [...prev.filter((d) => normalizeDate(d) !== normTargetDate), normTargetDate]);
    } else {
      setBlockedDays((prev) => prev.filter((d) => normalizeDate(d) !== normTargetDate));
    }

    try {
      const res = await fetch("/api/admin/calendar-locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          date: selectedDateStr,
          reason: blockReason || "Studio Closed",
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.blockedDays)) {
          setBlockedDays(data.blockedDays.map((d: any) => (typeof d === "string" ? d : d.date)));
        }
        setStatusMessage(action === "block_day" ? `Day ${selectedDateStr} closed to bookings` : `Day ${selectedDateStr} reopened`);
        setTimeout(() => setStatusMessage(null), 3000);
        setIsBlockDayOpen(false);
        setBlockReason("");
        await loadCalendarData();
      } else {
        alert(data.error || "Action failed");
        await loadCalendarData();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      await loadCalendarData();
    } finally {
      setIsActionPending(false);
    }
  };

  // Handle Quick Manual / Phone Booking
  const handleQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim() || !quickClientPhone.trim() || !selectedDateStr || !quickTimeSlot) {
      alert("Please fill in client name and phone number");
      return;
    }

    setIsSubmittingQuick(true);
    try {
      const shootStartIso = `${selectedDateStr} ${quickTimeSlot}`;
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: quickSessionType,
          clientName: quickClientName.trim(),
          whatsappPhone: quickClientPhone.trim(),
          selectedDate: selectedDateStr,
          timeSlot: quickTimeSlot,
          shootStart: shootStartIso,
          answers: {
            purpose: `Direct Studio Phone/Walk-in Reservation (${quickSessionType})`,
            selectedDate: selectedDateStr,
            timeSlot: quickTimeSlot,
            notes: "Created via Studio OS Calendar Operability",
          },
          estimate: {
            total: 100000,
            depositPercent: 70,
            depositAmount: 70000,
            balanceAmount: 30000,
            packageName: "Studio Direct",
            lineItems: [{ id: "direct", label: "Studio Direct Booking", amount: 100000 }],
            rulesVersion: "2026.11",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Direct booking ${data.referenceCode} created!`);
        setTimeout(() => setStatusMessage(null), 3500);
        setIsQuickBookingOpen(false);
        setQuickClientName("");
        setQuickClientPhone("");
        await loadCalendarData();
      } else {
        alert(data.error || "Failed to create direct booking");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthHeader = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calendar days grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: any[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNum: 0, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isBlocked = blockedDays.some(
        (b) => normalizeDate(typeof b === "string" ? b : (b as any).date) === normalizeDate(dateStr)
      );
      const dayBookings = bookedSlots.filter((b) => normalizeDate(b.date) === normalizeDate(dateStr));
      const dayLocks = lockedSlots.filter((l) => normalizeDate(l.date) === normalizeDate(dateStr));

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isBlocked,
        bookedCount: dayBookings.length,
        lockedCount: dayLocks.length,
      });
    }

    return days;
  }, [currentDate, bookedSlots, lockedSlots, blockedDays]);

  const isCurrentDayBlocked = blockedDays.some(
    (b) => normalizeDate(typeof b === "string" ? b : (b as any).date) === normalizeDate(selectedDateStr)
  );

  return (
    <div className="space-y-6">
      {/* Operability Header & Action Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-warm-white border border-line shadow-xs">
        <div>
          <span className="font-body text-[10px] uppercase font-bold tracking-[0.2em] text-gold block">
            Studio Operating System
          </span>
          <h2 className="font-display text-2xl text-deep font-semibold">
            Calendar Operability &amp; Slot Locks
          </h2>
          <p className="font-body text-xs text-brown/80 mt-0.5">
            Lock times for VIP shoots, studio maintenance, or personal breaks. Block whole days or create phone bookings directly.
          </p>
        </div>

        {statusMessage ? (
          <div className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsQuickBookingOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-deep text-warm-white hover:bg-gold hover:text-deep text-xs font-body font-semibold transition-all shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Direct Phone / Walk-in Booking</span>
          </button>
        )}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Month Calendar (7 cols) */}
        <div className="lg:col-span-7 bg-warm-white p-5 sm:p-6 rounded-2xl border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="font-display text-xl text-deep font-semibold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gold" />
              <span>{monthHeader}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-full border border-line hover:border-gold flex items-center justify-center text-brown hover:text-deep bg-cream/40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-full border border-line hover:border-gold flex items-center justify-center text-brown hover:text-deep bg-cream/40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
              <span key={d} className="text-[10px] font-mono uppercase font-bold text-muted py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cd, idx) => {
              if (!cd.isCurrentMonth) {
                return <div key={idx} className="aspect-square" />;
              }

              const isSelected = selectedDateStr === cd.dateStr;

              return (
                <button
                  key={cd.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(cd.dateStr)}
                  className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-between border transition-all text-xs font-semibold relative ${
                    isSelected
                      ? "bg-deep text-warm-white border-deep ring-2 ring-gold"
                      : cd.isBlocked
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-cream/40 text-deep border-line hover:border-gold"
                  }`}
                >
                  <span className="text-[11px] font-mono">{cd.dayNum}</span>

                  <div className="flex items-center gap-1">
                    {cd.bookedCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title={`${cd.bookedCount} booked`} />
                    )}
                    {cd.lockedCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${cd.lockedCount} locked`} />
                    )}
                    {cd.isBlocked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" title="Day Closed" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-line flex items-center gap-5 text-[11px] font-body text-muted flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Client Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Studio Locked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>Day Closed</span>
            </div>
          </div>
        </div>

        {/* Right Column: Day Slot Manager (5 cols) */}
        <div className="lg:col-span-5 bg-warm-white p-5 sm:p-6 rounded-2xl border border-line shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-line">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold font-bold block">
                Selected Day
              </span>
              <h3 className="font-display text-xl text-deep font-semibold">
                {selectedDateStr}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {isCurrentDayBlocked ? "Studio is marked CLOSED for this date" : "Manage individual slot locks for this date"}
              </p>
            </div>

            {/* Block / Unblock Day Toggle */}
            {isCurrentDayBlocked ? (
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => handleDayAction("unblock_day")}
                className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-semibold shrink-0"
              >
                Reopen Day
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsBlockDayOpen(!isBlockDayOpen)}
                className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-semibold shrink-0"
              >
                Close Entire Day
              </button>
            )}
          </div>

          {/* Inline Block Day Form */}
          {isBlockDayOpen && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
              <span className="text-xs font-bold text-rose-900 block">
                Mark Entire Day Closed ({selectedDateStr})
              </span>
              <input
                type="text"
                placeholder="Reason e.g. Studio Maintenance / Public Holiday"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-rose-300 bg-white text-xs text-deep focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlockDayOpen(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={() => handleDayAction("block_day")}
                  className="px-4 py-1.5 rounded-lg bg-rose-700 text-warm-white text-xs font-bold hover:bg-rose-800"
                >
                  Confirm Close Day
                </button>
              </div>
            </div>
          )}

          {/* Time Slots List */}
          <div className="space-y-2.5">
            <span className="text-xs uppercase tracking-wider font-bold text-deep block">
              Time Slots ({selectedDateStr})
            </span>

            {TIME_SLOTS.map((slot) => {
              const booked = bookedSlots.find(
                (b) =>
                  normalizeDate(b.date) === normalizeDate(selectedDateStr) &&
                  normalizeSlot(b.timeSlot) === normalizeSlot(slot)
              );
              const locked = lockedSlots.find(
                (l) =>
                  normalizeDate(l.date) === normalizeDate(selectedDateStr) &&
                  normalizeSlot(l.timeSlot) === normalizeSlot(slot)
              );
              const isLocking = activeLockingSlot === slot;

              return (
                <div
                  key={slot}
                  className="p-3 rounded-xl border border-line bg-cream/30 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted" />
                      <span className="text-xs font-bold text-deep">{slot}</span>
                    </div>

                    {booked ? (
                      <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span>Booked ({booked.sessionType})</span>
                      </span>
                    ) : locked ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Locked: {locked.reason || "Reserved"}
                        </span>
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => handleSlotAction("unlock_slot", slot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warm-white hover:bg-emerald-50 text-muted hover:text-emerald-700 border border-line hover:border-emerald-300 text-xs font-semibold transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Unlock Slot"
                        >
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Unlock</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase font-semibold text-muted">
                          Open on Site
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLockingSlot(isLocking ? null : slot);
                            setLockReason("");
                          }}
                          className="px-2.5 py-1 rounded-lg border border-line hover:border-gold bg-warm-white text-[11px] font-semibold text-deep hover:text-gold flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Lock</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Form to Lock Slot */}
                  {isLocking && (
                    <div className="pt-2 border-t border-line/60 flex items-center gap-2 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="Reason e.g. Private Shoot / Break"
                        value={lockReason}
                        onChange={(e) => setLockReason(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-line bg-white text-xs text-deep focus:outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        disabled={isActionPending}
                        onClick={() => handleSlotAction("lock_slot", slot, lockReason)}
                        className="px-3 py-1.5 rounded-lg bg-deep text-warm-white hover:bg-gold hover:text-deep text-xs font-semibold shrink-0"
                      >
                        Lock
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLockingSlot(null)}
                        className="text-xs text-muted hover:text-deep px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Direct Phone / Walk-in Booking Modal */}
      {isQuickBookingOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-xl text-deep font-semibold">
                  Direct Studio / Phone Booking
                </h3>
                <p className="text-xs text-muted">
                  Reserve a slot immediately for a client calling or walking into the atelier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickBookingOpen(false)}
                className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-muted hover:text-deep"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickBooking} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-deep uppercase tracking-wider mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Aliyu Bello"
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-cream/40 text-xs text-deep focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-deep uppercase tracking-wider mb-1">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0813 084 7299"
                  value={quickClientPhone}
                  onChange={(e) => setQuickClientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-cream/40 text-xs text-deep focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-deep uppercase tracking-wider mb-1">
                    Session Experience
                  </label>
                  <select
                    value={quickSessionType}
                    onChange={(e) => setQuickSessionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-cream/40 text-xs text-deep focus:outline-none focus:border-gold"
                  >
                    {Object.values(SESSION_TYPES).map((st) => (
                      <option key={st.slug} value={st.slug}>
                        {st.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-deep uppercase tracking-wider mb-1">
                    Time Slot
                  </label>
                  <select
                    value={quickTimeSlot}
                    onChange={(e) => setQuickTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-cream/40 text-xs text-deep focus:outline-none focus:border-gold"
                  >
                    {TIME_SLOTS.map((ts) => (
                      <option key={ts} value={ts}>
                        {ts}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cream/60 border border-line text-[11px] text-muted space-y-1">
                <div>Date: <strong className="text-deep">{selectedDateStr}</strong></div>
                <div>Status: Confirms slot on database and locks it against double-booking.</div>
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickBookingOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuick}
                  className="px-5 py-2.5 rounded-xl bg-deep text-warm-white hover:bg-gold hover:text-deep text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {isSubmittingQuick ? "Creating..." : "Confirm Studio Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
