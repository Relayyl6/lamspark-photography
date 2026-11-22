"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { KanbanBoard } from "@/components/studio/KanbanBoard";
import { EnquiryRecord, PipelineStage } from "@/lib/types";
import { transitionEnquiry } from "@/lib/pipeline/transition";
import { X, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";

const STAGES_LIST: { id: PipelineStage; label: string }[] = [
  { id: "enquiry", label: "Enquiry" },
  { id: "agreed_to_price", label: "Agreed to Price" },
  { id: "deposit_reported", label: "Deposit Reported" },
  { id: "deposit_paid", label: "Deposit Paid" },
  { id: "preparation", label: "Preparation" },
  { id: "confirmed", label: "Confirmed" },
  { id: "shot", label: "Shot" },
  { id: "editing", label: "Editing" },
  { id: "client_review", label: "Client Review" },
  { id: "delivered", label: "Delivered" },
  { id: "closed", label: "Closed" },
];

export default function PipelinePage() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
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
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Client Operating System &amp; Milestones
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Studio Kanban Pipeline
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Executive workflow swimlanes · 1-click stage progression &amp; direct WhatsApp messaging.
          </p>
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
          onSelectEnquiry={setSelectedEnquiry}
          onUpdateEnquiries={setEnquiries}
        />
      )}

      {/* Enquiry Detail Modal */}
      {mounted && selectedEnquiry && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-warm-white rounded-2xl shadow-2xl border border-line p-4 sm:p-6 max-h-[94vh] overflow-y-auto space-y-4 sm:space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3 sm:pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs uppercase bg-gold/15 text-gold px-2 py-0.5 rounded font-bold">
                    {selectedEnquiry.reference_code}
                  </span>
                  <span className="font-body text-xs uppercase tracking-wider text-muted font-semibold">
                    Source: {selectedEnquiry.source}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl text-deep font-medium">
                  {selectedEnquiry.purpose_text || "Client Session Enquiry"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-cream border border-line text-deep flex items-center justify-center shrink-0 ml-2"
                aria-label="Close details"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-cream/60 rounded-xl border border-line text-xs font-body">
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Session Type</span>
                <span className="font-bold text-deep capitalize">{selectedEnquiry.session_type}</span>
              </div>
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Agreed Price</span>
                <span className="font-bold text-deep">
                  {selectedEnquiry.agreed_price ? `₦${selectedEnquiry.agreed_price.toLocaleString()}` : "Custom Quote"}
                </span>
              </div>
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Current Stage</span>
                <span className="font-bold text-gold capitalize">{selectedEnquiry.stage.replace(/_/g, " ")}</span>
              </div>
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Waiting On</span>
                <span className="font-semibold text-deep capitalize">{selectedEnquiry.waiting_on}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted block font-semibold text-[10px] uppercase">Client Desired Feeling</span>
                <span className="text-brown/90">{selectedEnquiry.feeling_text || "Unhurried, natural aesthetic"}</span>
              </div>
            </div>

            {/* Stage Transition Control */}
            <div className="space-y-2 pt-2 border-t border-line">
              <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold">
                Advance Client Pipeline Stage
              </label>
              <div className="flex flex-wrap gap-2">
                {STAGES_LIST.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      const updated = transitionEnquiry(selectedEnquiry, st.id, "Osemene");
                      if (updated.success && updated.enquiry) {
                        setEnquiries((prev) => prev.map((e) => (e.id === selectedEnquiry.id ? updated.enquiry! : e)));
                        setSelectedEnquiry(updated.enquiry);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                      selectedEnquiry.stage === st.id
                        ? "bg-deep text-warm-white font-bold shadow-sm"
                        : "bg-cream/80 text-brown hover:bg-warm-white hover:text-deep border border-line/60"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <a
                href={`https://wa.me/2348130847299?text=Hello%20${encodeURIComponent(selectedEnquiry.purpose_text || "LamSparks Client")}%20(Ref:%20${selectedEnquiry.reference_code})`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-xl transition-all text-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Concierge</span>
              </a>

              <button
                onClick={() => setSelectedEnquiry(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-deep hover:bg-gold hover:text-deep text-warm-white font-body text-xs uppercase tracking-wider font-semibold rounded-xl transition-all text-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
