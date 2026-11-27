"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Clock,
  Calendar as CalendarIcon,
  MessageCircle,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Nav } from "@/components/Nav";

interface SavedBookingItem {
  referenceCode: string;
  sessionTitle: string;
  shootStart?: string;
  createdAt?: string;
  status?: string;
}

const SESSION_NAME_MAP: Record<string, string> = {
  "motherhood-bundle": "Motherhood Bundle (Maternity + Newborn)",
  "toddler": "Toddler & Children",
  "maternity": "Maternity & Motherhood",
  "wedding": "Weddings & Ceremonies",
  "event": "Event Coverage",
  "newborn": "Newborn Portraits",
  "family": "Family Portraits",
  "couple": "Couple & Engagement",
  "individual-portrait": "Individual Portraits",
  "official-portrait": "Executive & Official Portraits",
  "not-sure": "Bespoke Consultation",
};

function formatSessionTitle(raw?: string): string {
  if (!raw) return "Atelier Session";
  const slug = raw.toLowerCase().trim();
  if (SESSION_NAME_MAP[slug]) return SESSION_NAME_MAP[slug];
  return slug
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatBookingDate(raw?: string): string {
  if (!raw) return "Date held with studio";
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${datePart} · ${timePart}`;
    }
  } catch {}
  return raw;
}

export default function FindBookingPage() {
  const router = useRouter();
  const [deviceBookings, setDeviceBookings] = useState<SavedBookingItem[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load saved bookings from device localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lamsparks_saved_bookings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDeviceBookings(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read local bookings", e);
    }
  }, []);

  // Remove a booking from local device history
  const handleRemoveBooking = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deviceBookings.filter((b) => b.referenceCode !== ref);
    setDeviceBookings(updated);
    try {
      localStorage.setItem("lamsparks_saved_bookings", JSON.stringify(updated));
    } catch {}
  };

  // Extract clean reference code from pasted URL or raw string
  const extractRef = (input: string): string => {
    const trimmed = input.trim();
    // If it's a URL
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const refParam = url.searchParams.get("ref");
        if (refParam) return refParam.trim().toUpperCase();
        // Or path-based /booking/REF or /book/REF
        const parts = url.pathname.split("/").filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart !== "book" && lastPart !== "find-booking") {
          return lastPart.trim().toUpperCase();
        }
      }
    } catch {}

    // If query string was pasted e.g. "?ref=LS-GHL2"
    if (trimmed.includes("ref=")) {
      const match = trimmed.match(/ref=([A-Za-z0-9_-]+)/);
      if (match && match[1]) return match[1].trim().toUpperCase();
    }

    return trimmed.toUpperCase();
  };

  // Handle Find Booking submit
  const handleFindBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const ref = extractRef(inputVal);
    if (!ref) {
      setSearchError("Please enter a booking reference code or paste your saved booking link.");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/booking?ref=${encodeURIComponent(ref)}`);
      const data = await res.json();

      if (data.success && data.booking) {
        // Save to device history so it's easily accessible next time
        const existing = deviceBookings.filter((b) => b.referenceCode !== data.booking.referenceCode);
        const shootStart = data.booking.shootStart || (data.booking.answers?.selectedDate ? `${data.booking.answers.selectedDate} at ${data.booking.answers.timeSlot || ""}` : "");
        const newRecord: SavedBookingItem = {
          referenceCode: data.booking.referenceCode,
          sessionTitle: formatSessionTitle(data.booking.answers?.sessionTypeName || data.booking.sessionType || "Atelier Session"),
          shootStart,
          status: data.booking.status || "awaiting_deposit",
          createdAt: new Date().toISOString(),
        };
        const updated = [newRecord, ...existing].slice(0, 5);
        setDeviceBookings(updated);
        try {
          localStorage.setItem("lamsparks_saved_bookings", JSON.stringify(updated));
        } catch {}

        // Navigate to the personal revisitable booking page
        router.push(`/book?ref=${encodeURIComponent(data.booking.referenceCode)}`);
      } else {
        setSearchError(
          `Booking reference "${ref}" could not be found. Please double-check your code or contact Osemene directly.`
        );
      }
    } catch (err: any) {
      setSearchError("Unable to verify booking right now. Please try again or message the studio.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF8] text-[#1A1410] flex flex-col font-sans selection:bg-[#C9A96E]/20">
      <Nav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 sm:pb-16">
        <div className="space-y-10 animate-fade-up">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96E] font-bold block">
              YOUR BOOKING
            </span>
            <h1 className="font-headline uppercase tracking-tight text-[#1A1410] font-black text-4xl sm:text-6xl md:text-7xl leading-[0.95]">
              FIND MY <span className="text-[#C9A96E]">BOOKING</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6359] font-sans leading-relaxed pt-1">
              Locate the live details of any session booked with LamSparks. Track deposit confirmation, view your reserved date, reschedule, or cancel.
            </p>
          </div>

          {/* SECTION 1: Booked on This Device */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-bold text-[#6E6359]">
                Booked on this device
              </span>
              {deviceBookings.length > 0 && (
                <span className="text-[11px] text-[#6E6359] font-medium">
                  {deviceBookings.length} session{deviceBookings.length > 1 ? "s" : ""} recorded
                </span>
              )}
            </div>

            {deviceBookings.length === 0 ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-[#F8F4EE] border border-[#E5DECF] text-center space-y-2">
                <Clock className="w-6 h-6 text-[#C9A96E] mx-auto opacity-70" />
                <h4 className="font-serif text-lg text-[#1A1410]">No bookings recorded on this device yet</h4>
                <p className="text-xs text-[#6E6359] max-w-md mx-auto leading-relaxed">
                  When you reserve a session on this phone or browser, it will be automatically saved here for one-tap access. You can also paste your link below.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deviceBookings.map((b) => (
                  <div
                    key={b.referenceCode}
                    onClick={() => router.push(`/book?ref=${encodeURIComponent(b.referenceCode)}`)}
                    className="p-5 sm:p-6 rounded-3xl bg-[#F8F4EE] hover:bg-white border border-[#E5DECF] hover:border-[#C9A96E] transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#1A1410] group-hover:text-[#C9A96E] transition-colors leading-snug">
                          {formatSessionTitle(b.sessionTitle)}
                        </h3>
                        {b.status && (
                          <span
                            className={`text-[9.5px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                              b.status === "confirmed" || b.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : b.status === "cancelled"
                                ? "bg-neutral-200 text-neutral-700 border border-neutral-300"
                                : b.status === "expired"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-900 border border-amber-300/60"
                            }`}
                          >
                            {b.status === "expired" ? "hold expired" : b.status.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6E6359] font-sans">
                        {formatBookingDate(b.shootStart)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <span className="font-mono text-xs font-bold text-[#1A1410] group-hover:text-[#C9A96E] transition-colors flex items-center gap-1">
                        Ref {b.referenceCode} →
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveBooking(b.referenceCode, e)}
                        title="Remove from history"
                        className="p-1.5 rounded-full text-[#6E6359] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Paste the Booking Link You Saved */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#F8F4EE] border border-[#E5DECF] space-y-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#1A1410] block mb-1">
                Paste the booking link you saved
              </span>
              <p className="text-xs text-[#6E6359]">
                Paste your full booking URL or enter your booking reference code (e.g. LS-GHL2).
              </p>
            </div>

            <form onSubmit={handleFindBooking} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="https://.../book?ref=LS-XXXX or enter LS-XXXX"
                    className="w-full px-4 py-3 rounded-2xl border border-[#E5DECF] bg-white text-sm text-[#1A1410] focus:outline-none focus:border-[#C9A96E] placeholder-[#6E6359]/50 shadow-inner font-mono text-xs"
                  />
                  {inputVal && (
                    <button
                      type="button"
                      onClick={() => setInputVal("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6E6359] hover:text-[#1A1410]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !inputVal.trim()}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-[#C9A96E] hover:bg-[#b5955a] text-[#111111] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm shrink-0"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Find Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {searchError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}
            </form>
          </div>

          {/* Concierge WhatsApp Help */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5DECF] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C9A96E] font-bold block">
                Studio Concierge
              </span>
              <h4 className="font-serif text-lg text-[#1A1410]">Can&apos;t find your booking link or receipt?</h4>
              <p className="text-xs text-[#6E6359]">
                Osemene can look up your session details directly with your WhatsApp phone number or name.
              </p>
            </div>

            <a
              href="https://wa.me/2348130847299?text=Hello%20LamSparks%20Studio!%20I%20need%20help%20locating%20my%20session%20booking%20reference."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1410] text-[#FDFBF8] hover:bg-[#C9A96E] hover:text-[#111111] text-xs font-bold uppercase tracking-wider transition-all shadow-sm shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
