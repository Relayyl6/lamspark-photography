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
} from "lucide-react";
import { StudioCalendarManager } from "./StudioCalendarManager";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
