"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { KanbanBoard } from "@/components/studio/KanbanBoard";
import { EnquiryRecord, PipelineStage } from "@/lib/types";
import { transitionEnquiry } from "@/lib/pipeline/transition";
import {
  X,
  MessageSquare,
  Loader2,
  Trash2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  DollarSign,
  FileText,
} from "lucide-react";
import Link from "next/link";

const STAGES_LIST: { id: PipelineStage; label: string }[] = [
  { id: "enquiry", label: "New Enquiry" },
  { id: "agreed_to_price", label: "Agreed to Price" },
  { id: "deposit_reported", label: "Deposit Reported" },
  { id: "deposit_paid", label: "Deposit Confirmed" },
  { id: "preparation", label: "Prep & Styling" },
  { id: "confirmed", label: "Confirmed Shoot" },
  { id: "shot", label: "Raw Shot Ingest" },
  { id: "editing", label: "Master Retouching" },
  { id: "client_review", label: "Client Reveal" },
  { id: "delivered", label: "Gallery Delivered" },
  { id: "closed", label: "Archived & Closed" },
];

export default function PipelinePage() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedEnquiry) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedEnquiry]);

  const loadPipeline = () => {
    setLoading(true);
    fetch("/api/admin/kanban")
      .then((res) => res.json())
      .then((data) => {
        if (data.enquiries) {
          setEnquiries(data.enquiries);
        }
      })
      .catch((err) => console.error("[kanban fetch]", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  // Handle permanent deletion of an enquiry/booking
  async function handleDeleteEnquiry(id: string, refCode: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/kanban?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries((prev) => prev.filter((e) => e.id !== id));
        setSelectedEnquiry(null);
        setShowDeleteConfirm(false);
        setToastMessage(`Booking ${refCode} has been permanently deleted.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || "Failed to delete booking");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  // Handle toggle of waiting on
  async function handleToggleWaitingOn(enquiry: EnquiryRecord) {
    const nextWaitingOn: "us" | "client" = enquiry.waiting_on === "us" ? "client" : "us";
    const updated: EnquiryRecord = { ...enquiry, waiting_on: nextWaitingOn };
    setEnquiries((prev) => prev.map((e) => (e.id === enquiry.id ? updated : e)));
    setSelectedEnquiry(updated);

    try {
      await fetch("/api/admin/kanban", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: enquiry.id, stage: enquiry.stage, waitingOn: nextWaitingOn }),
      });
    } catch (err) {
      console.error("[waiting_on sync error]", err);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-[120] bg-emerald-800 text-warm-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Client Operating System &amp; Milestones
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Studio Kanban Pipeline
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Executive workflow swimlanes · Tap any card or Details to view full client specs, financial breakdown, or delete bookings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/studio/calendar"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-line bg-warm-white hover:bg-cream text-deep text-xs font-body font-semibold transition-all shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-gold" />
            <span>Studio Calendar &amp; Slots</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Loading live studio pipeline from Neon DB...</span>
        </div>
      ) : (
        <KanbanBoard
          enquiries={enquiries}
          onSelectEnquiry={(e) => {
            setShowDeleteConfirm(false);
            setSelectedEnquiry(e);
          }}
          onUpdateEnquiries={setEnquiries}
        />
      )}

      {/* Comprehensive Booking / Enquiry Detail Modal */}
      {mounted && selectedEnquiry && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-warm-white rounded-3xl shadow-2xl border border-line p-5 sm:p-7 max-h-[92vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-sm uppercase bg-gold/15 text-gold font-bold px-2.5 py-0.5 rounded-lg border border-gold/30">
                    {selectedEnquiry.reference_code}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider bg-cream text-brown px-2 py-0.5 rounded border border-line font-semibold">
                    Source: {selectedEnquiry.source || "Website Booking Wizard"}
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    Created: {new Date(selectedEnquiry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl text-deep font-semibold">
                  {(selectedEnquiry as any).client_name || selectedEnquiry.purpose_text || "Commission Details"}
                </h2>
                <p className="font-body text-xs text-brown/80 mt-0.5">
                  {selectedEnquiry.purpose_text}
                </p>
              </div>

              <button
                onClick={() => setSelectedEnquiry(null)}
                className="w-8 h-8 rounded-xl hover:bg-cream border border-line text-deep flex items-center justify-center shrink-0 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client Contact Profile Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF9F6] border border-line space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-gold tracking-wider block">
                Client Information &amp; Direct Concierge
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cream border border-line flex items-center justify-center text-brown shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-muted uppercase block">Full Name</span>
                    <strong className="text-xs text-deep truncate block font-body">
                      {(selectedEnquiry as any).client_name || "Guest Client"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-muted uppercase block">WhatsApp</span>
                    {(selectedEnquiry as any).whatsapp ? (
                      <a
                        href={`https://wa.me/${String((selectedEnquiry as any).whatsapp).replace(/\D/g, "")}?text=Hello%20${encodeURIComponent((selectedEnquiry as any).client_name || "LamSparks Client")}%2C%20regarding%20your%20LamSparks%20commission%20${selectedEnquiry.reference_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-bold underline truncate block"
                      >
                        {(selectedEnquiry as any).whatsapp} &rarr;
                      </a>
                    ) : (
                      <span className="text-xs text-muted">Not provided</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-cream border border-line flex items-center justify-center text-brown shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-muted uppercase block">Email</span>
                    {(selectedEnquiry as any).client_email ? (
                      <a
                        href={`mailto:${(selectedEnquiry as any).client_email}`}
                        className="text-xs text-deep hover:text-gold truncate block font-body"
                      >
                        {(selectedEnquiry as any).client_email}
                      </a>
                    ) : (
                      <span className="text-xs text-muted">Not provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Session Specifications & Date / Outfits */}
            <div className="p-4 sm:p-5 rounded-2xl bg-cream/40 border border-line space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-deep tracking-wider block">
                Session Experience &amp; Styling Specifications
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-body">
                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Experience</span>
                  <span className="font-bold text-deep capitalize">
                    {selectedEnquiry.session_type?.replace(/-/g, " ")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Reserved Slot</span>
                  <span className="font-semibold text-deep">
                    {(selectedEnquiry.answers as any)?.selectedDate
                      ? `${(selectedEnquiry.answers as any).selectedDate} ${(selectedEnquiry.answers as any)?.timeSlot ? `· ${(selectedEnquiry.answers as any).timeSlot}` : ""}`
                      : "Date to be scheduled"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Outfits / People</span>
                  <span className="font-semibold text-deep">
                    {(selectedEnquiry.answers as any)?.outfits || (selectedEnquiry.answers as any)?.outfitCount || 1} Outfits
                    {(selectedEnquiry.answers as any)?.peopleCount ? ` · ${(selectedEnquiry.answers as any).peopleCount} People` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Location Type</span>
                  <span className="font-semibold text-deep capitalize">
                    {selectedEnquiry.answers?.locationType || "Studio Atelier, Abuja"}
                  </span>
                </div>

                {selectedEnquiry.answers?.notes && (
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-line/60">
                    <span className="text-[10px] font-mono text-muted uppercase block">Wardrobe / Session Notes</span>
                    <p className="text-xs text-brown/90 italic mt-0.5">
                      &ldquo;{selectedEnquiry.answers.notes}&rdquo;
                    </p>
                  </div>
                )}

                {selectedEnquiry.feeling_text && (
                  <div className="col-span-2 sm:col-span-4 pt-1">
                    <span className="text-[10px] font-mono text-muted uppercase block">Desired Feeling &amp; Vision</span>
                    <p className="text-xs text-deep font-serif italic mt-0.5">
                      {selectedEnquiry.feeling_text}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financials & Deposit Verification */}
            <div className="p-4 sm:p-5 rounded-2xl bg-warm-white border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-gold tracking-wider">
                  Financial Breakdown &amp; Bank Verification
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  {selectedEnquiry.stage === "deposit_paid" || selectedEnquiry.stage === "confirmed" ? "Deposit Confirmed" : "Verification Required"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-body">
                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Agreed Total</span>
                  <span className="font-display text-lg text-deep font-semibold">
                    {selectedEnquiry.agreed_price ? `₦${selectedEnquiry.agreed_price.toLocaleString()}` : "Custom Quote"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">70% Deposit Required</span>
                  <span className="font-display text-lg text-gold font-semibold">
                    {selectedEnquiry.agreed_price ? `₦${Math.round(selectedEnquiry.agreed_price * 0.7).toLocaleString()}` : "-"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">30% Balance Due</span>
                  <span className="font-display text-lg text-muted font-semibold">
                    {selectedEnquiry.agreed_price ? `₦${Math.round(selectedEnquiry.agreed_price * 0.3).toLocaleString()}` : "-"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-muted uppercase block">Bank Narration / Ref</span>
                  <span className="font-mono text-xs font-bold text-deep truncate block">
                    {selectedEnquiry.bank_reference || (selectedEnquiry as any).payment?.bankReference || "Not provided"}
                  </span>
                </div>
              </div>

              {/* Deposit Receipt Preview if Uploaded */}
              {selectedEnquiry.deposit_screenshot_url && (
                <div className="pt-3 border-t border-line/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold" />
                    <span className="text-xs font-semibold text-deep">
                      Bank Transfer Receipt Attached
                    </span>
                    {(selectedEnquiry as any).payment?.aiCheck && (
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        AI Verified
                      </span>
                    )}
                  </div>
                  <a
                    href={selectedEnquiry.deposit_screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Receipt Image</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Pipeline Stage Transition Controller */}
            <div className="space-y-3 pt-2 border-t border-line">
              <div className="flex items-center justify-between">
                <label className="font-body text-xs uppercase tracking-wider text-deep font-bold">
                  Advance Client Pipeline Stage
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleWaitingOn(selectedEnquiry)}
                  className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold transition-all border ${
                    selectedEnquiry.waiting_on === "us"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-cream text-muted border-line hover:border-gold"
                  }`}
                  title="Click to toggle waiting on status"
                >
                  Waiting on: {selectedEnquiry.waiting_on === "us" ? "Our Turn" : "Client Turn"} (Toggle)
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {STAGES_LIST.map((st) => {
                  const isCurrent = selectedEnquiry.stage === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        const updated = transitionEnquiry(selectedEnquiry, st.id, "Studio Staff");
                        if (updated.success && updated.enquiry) {
                          setEnquiries((prev) => prev.map((e) => (e.id === selectedEnquiry.id ? updated.enquiry! : e)));
                          setSelectedEnquiry(updated.enquiry);
                          // Sync to DB
                          fetch("/api/admin/kanban", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: selectedEnquiry.id, stage: st.id }),
                          }).catch((err) => console.error(err));
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-body transition-all text-center truncate ${
                        isCurrent
                          ? "bg-deep text-warm-white font-bold shadow-sm ring-1 ring-gold"
                          : "bg-cream/80 text-brown hover:bg-warm-white hover:text-deep border border-line/60"
                      }`}
                      title={st.label}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inline Permanent Deletion Confirmation Banner */}
            {showDeleteConfirm && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-xs uppercase tracking-wider block">
                      Confirm Permanent Deletion · {selectedEnquiry.reference_code}
                    </strong>
                    <p className="text-xs text-rose-800 mt-0.5">
                      Are you sure you want to delete this booking for{" "}
                      <strong>{(selectedEnquiry as any).client_name || "this client"}</strong>? This will remove all associated records (payments, slot holds, estimate snapshots) from Neon DB. This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-800 hover:bg-rose-100"
                  >
                    Cancel (Keep Safe)
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteEnquiry(selectedEnquiry.id, selectedEnquiry.reference_code)}
                    className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-warm-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{isDeleting ? "Deleting from DB..." : "Yes, Permanently Delete"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Delete Trigger */}
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-body font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Booking</span>
                </button>
              ) : <div />}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <a
                  href={
                    (selectedEnquiry as any).whatsapp
                      ? `https://wa.me/${String((selectedEnquiry as any).whatsapp).replace(/\D/g, "")}?text=Hello%20${encodeURIComponent((selectedEnquiry as any).client_name || "LamSparks Client")}%2C%20regarding%20your%20commission%20${selectedEnquiry.reference_code}`
                      : `https://wa.me/2348130847299?text=Hello%20regarding%20your%20LamSparks%20commission%20${selectedEnquiry.reference_code}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp Concierge</span>
                </a>

                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-6 py-2.5 bg-deep hover:bg-gold hover:text-deep text-warm-white font-body text-xs uppercase tracking-wider font-semibold rounded-xl transition-all text-center"
                >
                  Done
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
