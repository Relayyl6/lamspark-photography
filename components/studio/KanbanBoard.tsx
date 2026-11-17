"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  FolderOpen,
} from "lucide-react";
import type { PipelineStage, EnquiryRecord } from "@/lib/types";
import { transitionEnquiry } from "@/lib/pipeline/transition";

interface KanbanBoardProps {
  enquiries: EnquiryRecord[];
  onSelectEnquiry: (enquiry: EnquiryRecord) => void;
  onUpdateEnquiries: (updater: (prev: EnquiryRecord[]) => EnquiryRecord[]) => void;
  onOpenDepositsQueue: () => void;
}

// 5 High-Level Strategic Pillars for a Calm Luxury Studio Workflow
interface PillarDefinition {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  badgeBg: string;
  stages: PipelineStage[];
}

const PILLARS: PillarDefinition[] = [
  {
    id: "inquiries",
    title: "Inquiries & Estimates",
    subtitle: "New requests, custom quotes & agreed rates",
    color: "border-sky-500/40 text-sky-800",
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    stages: ["enquiry", "agreed_to_price"],
  },
  {
    id: "deposits",
    title: "Booking & Deposits",
    subtitle: "Reported transfers & human verification",
    color: "border-amber-500/40 text-amber-800",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    stages: ["deposit_reported", "deposit_paid"],
  },
  {
    id: "production",
    title: "Prep & Confirmed Shoots",
    subtitle: "Moodboards, styling prep & scheduled dates",
    color: "border-purple-500/40 text-purple-800",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    stages: ["preparation", "confirmed"],
  },
  {
    id: "retouching",
    title: "Culling & Retouching",
    subtitle: "Raw ingest, colour grading & client review",
    color: "border-indigo-500/40 text-indigo-800",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    stages: ["shot", "editing", "client_review"],
  },
  {
    id: "delivered",
    title: "Delivered & Archival",
    subtitle: "Private gallery live, framed craft & archive",
    color: "border-emerald-500/40 text-emerald-800",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stages: ["delivered", "closed"],
  },
];

const ALL_11_STAGES: { id: PipelineStage; label: string }[] = [
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

export function KanbanBoard({
  enquiries,
  onSelectEnquiry,
  onUpdateEnquiries,
  onOpenDepositsQueue,
}: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<"pillars" | "granular">("pillars");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState<string>("All");
  const [activeMobilePillar, setActiveMobilePillar] = useState<string>("inquiries");

  // Filter inquiries based on search and session type
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      // Session filter
      if (
        sessionFilter !== "All" &&
        item.session_type?.toLowerCase() !== sessionFilter.toLowerCase()
      ) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.reference_code.toLowerCase().includes(q);
        const matchesPurpose = item.purpose_text?.toLowerCase().includes(q);
        const matchesSource = item.source?.toLowerCase().includes(q);
        return matchesRef || matchesPurpose || matchesSource;
      }
      return true;
    });
  }, [enquiries, searchQuery, sessionFilter]);

  // Quick Advance Handler with stage machine validation
  function handleQuickAdvance(e: React.MouseEvent, enquiry: EnquiryRecord) {
    e.stopPropagation();

    // Natural progression route
    const nextStageMap: Record<PipelineStage, PipelineStage | null> = {
      enquiry: "agreed_to_price",
      agreed_to_price: "deposit_reported",
      deposit_reported: null, // Must go through human deposit verification!
      deposit_paid: "preparation",
      preparation: "confirmed",
      confirmed: "shot",
      shot: "editing",
      editing: "client_review",
      client_review: "delivered",
      delivered: "closed",
      closed: null,
    };

    const nextStage = nextStageMap[enquiry.stage];

    if (enquiry.stage === "deposit_reported") {
      onOpenDepositsQueue();
      return;
    }

    if (!nextStage) {
      onSelectEnquiry(enquiry);
      return;
    }

    const res = transitionEnquiry(enquiry, nextStage, "Studio Staff");
    if (res.success && res.enquiry) {
      onUpdateEnquiries((prev) =>
        prev.map((item) => (item.id === enquiry.id ? res.enquiry! : item))
      );
    } else {
      alert(res.error || "Stage transition not permitted");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Toolbar */}
      <div className="bg-warm-white p-4 rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client code (e.g. LS-9B2K) or event..."
              className="w-full pl-9 pr-4 py-2 rounded-full border border-line bg-cream/50 text-xs font-body text-deep focus:outline-none focus:border-gold transition-colors"
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

          {/* View Mode Switcher and Counters */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="flex items-center p-1 bg-cream rounded-full border border-line text-xs font-body font-semibold">
              <button
                onClick={() => setViewMode("pillars")}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === "pillars"
                    ? "bg-deep text-warm-white shadow-sm"
                    : "text-muted hover:text-deep"
                }`}
              >
                Executive Pillars (5)
              </button>
              <button
                onClick={() => setViewMode("granular")}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === "granular"
                    ? "bg-deep text-warm-white shadow-sm"
                    : "text-muted hover:text-deep"
                }`}
              >
                All 11 Stages
              </button>
            </div>

            <span className="text-xs font-body text-muted hidden sm:inline">
              Showing <strong>{filteredEnquiries.length}</strong> active client cards
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-muted font-body shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Session:</span>
          </span>
          {["All", "wedding", "corporate", "event", "toddler", "maternity"].map((cat) => {
            const isSelected = sessionFilter === cat;
            const label =
              cat === "All"
                ? "All Sessions"
                : cat === "wedding"
                ? "Weddings"
                : cat === "corporate"
                ? "Corporate & MOU"
                : cat === "event"
                ? "Galas & Events"
                : cat === "toddler"
                ? "Toddler & Family"
                : "Maternity";
            return (
              <button
                key={cat}
                onClick={() => setSessionFilter(cat)}
                className={`px-3 py-1.5 rounded-full font-body whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-gold text-deep border-gold font-semibold shadow-xs"
                    : "bg-cream text-brown border-line hover:border-gold/60"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE PILLAR TABS (Quick-jump between pillars on small screens) */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 no-scrollbar">
        {PILLARS.map((p) => {
          const count = filteredEnquiries.filter((e) => p.stages.includes(e.stage)).length;
          const isActive = activeMobilePillar === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveMobilePillar(p.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-body font-semibold flex items-center gap-2 border transition-all ${
                isActive
                  ? "bg-deep text-warm-white border-deep shadow-md"
                  : "bg-warm-white text-muted border-line hover:border-gold"
              }`}
            >
              <span>{p.title.split(" ")[0]}</span>
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                  isActive ? "bg-gold text-deep" : "bg-cream text-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KANBAN BOARD VIEW 1: EXECUTIVE PILLARS (5 Columns) */}
      {viewMode === "pillars" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4.5">
          {PILLARS.map((pillar) => {
            const pillarCards = filteredEnquiries.filter((e) => pillar.stages.includes(e.stage));
            const isHiddenOnMobile =
              typeof window !== "undefined" &&
              window.innerWidth < 1024 &&
              activeMobilePillar !== pillar.id;

            return (
              <div
                key={pillar.id}
                className={`flex flex-col bg-[#FBF9F6] rounded-2xl border ${
                  pillar.color
                } p-3 sm:p-4 shadow-sm min-h-[580px] ${
                  isHiddenOnMobile ? "hidden lg:flex" : "flex"
                }`}
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-line mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold text-deep">
                      {pillar.title}
                    </h3>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${pillar.badgeBg}`}
                    >
                      {pillarCards.length}
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-muted mt-0.5 line-clamp-1">
                    {pillar.subtitle}
                  </p>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                  {pillarCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => onSelectEnquiry(card)}
                      className="group relative p-3.5 rounded-xl bg-warm-white hover:bg-white border border-line hover:border-gold shadow-xs hover:shadow-editorial cursor-pointer transition-all space-y-2.5"
                    >
                      {/* Top Bar with Reference, Source & WhatsApp Link */}
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-deep group-hover:text-gold transition-colors">
                          {card.reference_code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="uppercase text-[9px] bg-cream px-1.5 py-0.5 rounded text-brown font-semibold border border-line">
                            {card.source || "Website"}
                          </span>
                          <a
                            href={`https://wa.me/2349064982841?text=Hello%20regarding%20your%20LamSparks%20commission%20${card.reference_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Chat with client on WhatsApp"
                            className="w-5 h-5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Purpose & Session Type */}
                      <div>
                        <span className="font-body text-[9px] uppercase tracking-wider text-gold font-bold block mb-0.5">
                          {card.session_type || "Commission"}
                        </span>
                        <h4 className="font-body text-xs font-semibold text-deep line-clamp-2 leading-snug">
                          {card.purpose_text}
                        </h4>
                      </div>

                      {/* Financials & Waiting Status */}
                      <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px]">
                        <div>
                          {card.agreed_price ? (
                            <span className="font-semibold text-deep">
                              ₦{card.agreed_price.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted italic">Estimate pending</span>
                          )}
                        </div>

                        {/* Waiting On Indicator */}
                        <span
                          className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                            card.waiting_on === "us"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : "bg-cream text-muted"
                          }`}
                        >
                          Waiting on {card.waiting_on}
                        </span>
                      </div>

                      {/* Special Action Alert for Deposit Reported */}
                      {card.stage === "deposit_reported" && (
                        <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between text-[11px] text-amber-900">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-semibold text-[10px]">Verify Transfer</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDepositsQueue();
                            }}
                            className="text-[10px] uppercase font-bold text-amber-800 hover:underline"
                          >
                            Review →
                          </button>
                        </div>
                      )}

                      {/* Quick Advance Button */}
                      {card.stage !== "deposit_reported" && card.stage !== "closed" && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={(e) => handleQuickAdvance(e, card)}
                            className="inline-flex items-center gap-1 font-body text-[10px] text-gold hover:text-deep transition-colors font-semibold"
                          >
                            <span>Advance Stage</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty Column Placeholder */}
                  {pillarCards.length === 0 && (
                    <div className="h-44 border border-dashed border-line rounded-xl flex flex-col items-center justify-center p-4 text-center text-muted">
                      <FolderOpen className="w-6 h-6 stroke-[1.2] mb-1.5 opacity-60" />
                      <span className="font-body text-xs">No cards in this pillar</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN BOARD VIEW 2: GRANULAR 11 STAGES (Smooth Horizontal Board) */}
      {viewMode === "granular" && (
        <div className="flex gap-4 overflow-x-auto pb-6 scroll-smooth">
          {ALL_11_STAGES.map((stage, idx) => {
            const stageCards = filteredEnquiries.filter((e) => e.stage === stage.id);
            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-warm-white rounded-2xl border border-line p-4 flex flex-col justify-between max-h-[75vh] shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-gold font-bold block">
                        Stage {idx + 1} of 11
                      </span>
                      <h4 className="font-body text-xs font-bold text-deep uppercase tracking-wider">
                        {stage.label}
                      </h4>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-cream text-deep text-[11px] font-bold flex items-center justify-center border border-line">
                      {stageCards.length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                    {stageCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onSelectEnquiry(card)}
                        className="p-3 rounded-xl bg-cream/50 hover:bg-white border border-line hover:border-gold cursor-pointer shadow-xs transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                          <span className="font-bold text-deep">{card.reference_code}</span>
                          <span className="uppercase text-[9px] bg-gold/15 text-gold px-1.5 py-0.5 rounded font-semibold">
                            {card.source || "Website"}
                          </span>
                        </div>
                        <h5 className="font-body text-xs font-semibold text-deep line-clamp-1">
                          {card.purpose_text}
                        </h5>
                        <div className="pt-2 border-t border-line/40 flex items-center justify-between text-[11px]">
                          <span className="text-muted">
                            Wait: <strong>{card.waiting_on}</strong>
                          </span>
                          {card.agreed_price && (
                            <span className="font-semibold text-deep">
                              ₦{card.agreed_price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageCards.length === 0 && (
                      <div className="py-8 text-center text-muted font-body text-xs italic">
                        Empty
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-line/40 mt-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted">
                    {stageCards.length} client{stageCards.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
