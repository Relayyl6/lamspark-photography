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
} from "lucide-react";

interface BookingItem {
  id: string;
  enquiry_id: string;
  shoot_start: string;
  shoot_end: string;
  location_type: string;
  location_detail: string | null;
  status: "confirmed" | "rescheduled" | "completed" | "cancelled" | "shooting" | "held";
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
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedBooking]);

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

  // Handle rescheduling
  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBooking || !rescheduleDate) return;

    setIsUpdating(true);
    try {
      const start = new Date(rescheduleDate);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours shoot

      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          status: "rescheduled",
          shootStart: start.toISOString(),
          shootEnd: end.toISOString(),
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
                  shoot_start: start.toISOString(),
                  shoot_end: end.toISOString(),
                  reschedule_count: b.reschedule_count + 1,
                }
              : b
          )
        );
        setStatusMessage(`Session rescheduled to ${start.toLocaleDateString()}`);
        setTimeout(() => setStatusMessage(null), 3000);
        setSelectedBooking(null);
        setRescheduleDate("");
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
            {["All", "Held", "Confirmed", "Shooting", "Rescheduled", "Completed"].map((st) => (
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
                          : "bg-cream text-muted"
                      }`}
                    >
                      {b.status === "held" ? "Held · Pending Deposit" : b.status}
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
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-muted font-mono font-normal">
                      · {startDate.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
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
                <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/${b.client.whatsapp.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(b.client.name)}!%20Regarding%20your%20upcoming%20LamSparks%20shoot%20(${b.reference_code})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-body font-semibold transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-2.5 py-1.5 rounded-full bg-cream hover:bg-warm-white border border-line text-xs font-body font-semibold text-deep transition-all"
                      title="Reschedule session"
                    >
                      Reschedule
                    </button>

                    {b.status === "held" && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, "confirmed")}
                        className="px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-warm-white text-xs font-body font-semibold transition-all"
                      >
                        Confirm Slot
                      </button>
                    )}

                    {b.status === "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus(b.id, "completed")}
                        className="px-3 py-1.5 rounded-full bg-deep hover:bg-gold hover:text-deep text-warm-white text-xs font-body font-semibold transition-all"
                      >
                        Complete Shoot
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {mounted && selectedBooking && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-md w-full p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl text-deep font-semibold">
                  Reschedule Shoot
                </h3>
                <span className="font-mono text-[11px] sm:text-xs text-gold">
                  Ref: {selectedBooking.reference_code} · {selectedBooking.client.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-line flex items-center justify-center text-muted hover:text-deep"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Select New Shoot Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep focus:border-gold focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-muted font-body leading-relaxed">
                Per studio policy, date changes within 72 hours of the original shoot date carry no penalty when coordinated with the Maitama studio assistant.
              </p>

              <div className="pt-3 border-t border-line flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-line text-xs font-body font-semibold text-muted hover:text-deep hover:bg-cream text-center transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all text-center"
                >
                  {isUpdating ? "Saving..." : "Confirm New Date"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
