"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface BookedSlot {
  id: string;
  start: string;
  end: string;
  date: string;
  timeSlot: string;
  sessionType: string;
  status: string;
}

interface LockedSlot {
  date: string;
  timeSlot: string;
  reason?: string;
}

const CATEGORIES = [
  { id: "portrait", slug: "official-portrait", label: "Portraits" },
  { id: "birthday", slug: "birthday", label: "Birthday" },
  { id: "wedding", slug: "wedding", label: "Wedding" },
  { id: "pre-wedding", slug: "pre-wedding", label: "Pre-wedding" },
  { id: "family", slug: "toddler", label: "Family" },
  { id: "convocation", slug: "convocation", label: "Convocation" },
  { id: "event", slug: "event", label: "Event" },
  { id: "maternity", slug: "maternity", label: "Maternity" },
];

const STANDARD_TIME_SLOTS = [
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

export function LiveCalendarSection() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    // Default to tomorrow or today's date in YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Live availability data from DB
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [lockedSlots, setLockedSlots] = useState<LockedSlot[]>([]);
  const [blockedDays, setBlockedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthParam = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;

  // Fetch live availability for current month
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/availability?month=${monthParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBookedSlots(data.bookedSlots || []);
          setLockedSlots(data.lockedSlots || []);
          setBlockedDays(data.blockedDays || []);
        }
      })
      .catch((err) => console.error("Failed to load availability:", err))
      .finally(() => setIsLoading(false));
  }, [monthParam]);

  // Calendar Month Navigation
  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthHeader = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }).toUpperCase();

  // Days grid calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      isBlocked: boolean;
      bookedCount: number;
      openCount: number;
    }[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Padding for prev month days
    for (let i = 0; i < firstDay; i++) {
      days.push({
        dateStr: "",
        dayNum: 0,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isBlocked: false,
        bookedCount: 0,
        openCount: 0,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isBlocked = blockedDays.includes(dateStr);

      // Count booked/locked on this date
      const dateBookings = bookedSlots.filter((b) => b.date === dateStr);
      const dateLocks = lockedSlots.filter((l) => l.date === dateStr);
      const bookedCount = dateBookings.length + dateLocks.length;
      const openCount = isPast || isBlocked ? 0 : Math.max(0, STANDARD_TIME_SLOTS.length - bookedCount);

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isPast,
        isToday,
        isBlocked,
        bookedCount,
        openCount,
      });
    }

    return days;
  }, [currentDate, bookedSlots, lockedSlots, blockedDays]);

  // Selected date info
  const selectedDayObj = useMemo(() => {
    if (!selectedDayStr) return null;
    const [y, m, d] = selectedDayStr.split("-").map((v) => parseInt(v, 10));
    const dateObj = new Date(y, m - 1, d);
    return {
      formatted: dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).toUpperCase(),
      isPast: selectedDayStr < new Date().toISOString().split("T")[0],
      isBlocked: blockedDays.includes(selectedDayStr),
    };
  }, [selectedDayStr, blockedDays]);

  // Compute status for each time slot on selected date
  const slotStatuses = useMemo(() => {
    if (!selectedDayStr) return [];

    return STANDARD_TIME_SLOTS.map((slot) => {
      // Check if slot is booked by a client
      const booked = bookedSlots.find(
        (b) => b.date === selectedDayStr && b.timeSlot === slot
      );
      if (booked) {
        return { slot, status: "booked", label: "Already Booked" };
      }

      // Check if slot is locked by studio
      const locked = lockedSlots.find(
        (l) => l.date === selectedDayStr && l.timeSlot === slot
      );
      if (locked) {
        return { slot, status: "locked", label: locked.reason || "Studio Reserved" };
      }

      if (selectedDayObj?.isPast) {
        return { slot, status: "closed", label: "Closed" };
      }

      if (selectedDayObj?.isBlocked) {
        return { slot, status: "blocked", label: "Studio Closed" };
      }

      return { slot, status: "open", label: "Open" };
    });
  }, [selectedDayStr, bookedSlots, lockedSlots, selectedDayObj]);

  const openSlotCount = slotStatuses.filter((s) => s.status === "open").length;
  const bookedSlotCount = slotStatuses.filter((s) => s.status === "booked" || s.status === "locked").length;

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-[#FAF7F2] rounded-3xl sm:rounded-[36px] border border-[#E5DECF] p-6 sm:p-10 lg:p-12 shadow-sm space-y-8 relative overflow-hidden">
        {/* Soft decorative background tint */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[10.5px] font-mono uppercase tracking-[0.2em] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE CALENDAR</span>
            </div>

            <h2 className="font-headline uppercase tracking-tight text-[#1A1410] font-black text-3xl sm:text-5xl lg:text-6xl leading-[0.95]">
              FREE OR BOOKED, <br />
              <span className="text-[#C9A96E]">AT A GLANCE.</span>
            </h2>
          </div>

          <div className="max-w-md text-xs sm:text-sm text-[#6E6359] leading-relaxed">
            <p>
              LamSparks live studio calendar. Pick a session to see which days are free, then tap a free day for its times. Booked times are taken straight away, so nobody can double-book.
            </p>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSlot(null);
                }}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410] shadow-sm"
                    : "bg-white text-[#6E6359] border-[#E5DECF] hover:border-[#C9A96E] hover:text-[#1A1410]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Calendar & Times Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Monthly Calendar (7 cols on Desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DECF]">
              <h3 className="font-headline text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1410] font-black">
                {monthHeader}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-9 h-9 rounded-full bg-white border border-[#E5DECF] hover:border-[#1A1410] flex items-center justify-center text-[#1A1410] hover:bg-[#F8F4EE] transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-9 h-9 rounded-full bg-white border border-[#E5DECF] hover:border-[#1A1410] flex items-center justify-center text-[#1A1410] hover:bg-[#F8F4EE] transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <span key={day} className="text-[10px] sm:text-[11px] font-mono uppercase font-bold text-[#6E6359]/80 py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((cd, idx) => {
                if (!cd.isCurrentMonth) {
                  return <div key={idx} className="aspect-square" />;
                }

                const isSelected = selectedDayStr === cd.dateStr;

                return (
                  <button
                    key={cd.dateStr}
                    type="button"
                    disabled={cd.isPast || cd.isBlocked}
                    onClick={() => {
                      setSelectedDayStr(cd.dateStr);
                      setSelectedSlot(null);
                    }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-[#1A1410] text-[#FDFBF8] shadow-md ring-2 ring-[#C9A96E]"
                        : cd.isPast || cd.isBlocked
                        ? "text-[#6E6359]/30 cursor-not-allowed bg-transparent"
                        : "bg-white hover:bg-warm-white text-[#1A1410] hover:text-[#C9A96E] border border-[#E5DECF]/70 hover:border-[#C9A96E] shadow-2xs"
                    }`}
                  >
                    <span className="font-semibold">{cd.dayNum}</span>

                    {/* Visual Availability Dot */}
                    {!cd.isPast && !cd.isBlocked && !isSelected && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          cd.openCount > 0 ? "bg-emerald-500" : "bg-neutral-300"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-[#E5DECF] flex items-center gap-6 text-[11px] text-[#6E6359]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Open Start Times</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A1410]" />
                <span>Selected Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E5DECF]" />
                <span>Past / Studio Closed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Time Slots Box (5 cols on Desktop) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-[#E5DECF] shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A96E] font-bold block">
                {selectedCategory.label.toUpperCase()}
              </span>
              <h3 className="font-headline text-2xl sm:text-3xl uppercase tracking-tight text-[#1A1410] font-black">
                {selectedDayObj?.formatted || "SELECT A DATE"}
              </h3>
              <p className="text-xs text-[#6E6359] pt-1">
                {selectedDayObj?.isBlocked ? (
                  <span className="text-rose-700 font-semibold">Studio is closed on this date.</span>
                ) : selectedDayObj?.isPast ? (
                  <span className="text-neutral-500">This date has already passed.</span>
                ) : (
                  <span>
                    <strong className="text-[#1A1410]">{openSlotCount} start times open</strong> · {bookedSlotCount} already booked
                  </span>
                )}
              </p>
            </div>

            {/* Time Slot Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {slotStatuses.map((item) => {
                const isSelected = selectedSlot === item.slot;
                const isUnavailable = item.status !== "open";

                return (
                  <button
                    key={item.slot}
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => setSelectedSlot(item.slot)}
                    className={`p-3.5 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between border ${
                      isSelected
                        ? "bg-[#1A1410] text-[#FDFBF8] border-[#1A1410] shadow-sm"
                        : isUnavailable
                        ? "bg-[#F8F4EE]/80 text-[#6E6359]/40 border-transparent cursor-not-allowed line-through"
                        : "bg-[#FAF7F2] text-[#1A1410] border-[#E5DECF] hover:border-[#C9A96E] hover:bg-white"
                    }`}
                  >
                    <span>{item.slot}</span>
                    {isUnavailable ? (
                      <span className="text-[9.5px] font-mono no-underline uppercase text-[#6E6359]/60">
                        {item.status === "booked" ? "Booked" : "Held"}
                      </span>
                    ) : (
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-[#C9A96E]" : "text-[#6E6359]"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Slot Action */}
            {selectedSlot ? (
              <div className="pt-4 border-t border-[#E5DECF] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6E6359]">Selected Appointment:</span>
                  <span className="font-bold text-[#1A1410]">
                    {selectedSlot} · {selectedDayStr}
                  </span>
                </div>

                <Link
                  href={`/book?session=${selectedCategory.slug}&date=${selectedDayStr}&time=${encodeURIComponent(selectedSlot)}`}
                  className="w-full inline-flex items-center justify-center gap-2 p-3.5 rounded-full bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] text-xs font-bold uppercase tracking-wider transition-all shadow-md group"
                >
                  <span>Book this time slot</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              <div className="pt-4 border-t border-[#E5DECF] text-center text-xs text-[#6E6359]">
                Tap any available slot above to lock it directly into your session enquiry.
              </div>
            )}
          </div>
        </div>

        {/* Floating / Embedded WhatsApp Help Badge */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E5DECF]">
          <span className="text-xs text-[#6E6359]">
            Looking for bespoke dates, VIP evening shoots, or multi-day coverage?
          </span>

          <a
            href={`https://wa.me/2348130847299?text=${encodeURIComponent(
              `Hello Osemene! I was browsing your live studio calendar for ${selectedCategory.label} around ${selectedDayStr}. Is a session available?`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1410] text-[#FDFBF8] hover:bg-[#C9A96E] hover:text-[#111111] text-xs font-bold uppercase tracking-wider transition-all shadow-sm shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ask Osemene on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
