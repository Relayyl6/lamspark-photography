"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  GripVertical,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  MessageCircle,
  HelpCircle,
  Phone,
  User,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { PipelineStage, EnquiryRecord } from "@/lib/types";
import { transitionEnquiry } from "@/lib/pipeline/transition";

interface KanbanBoardProps {
  enquiries: EnquiryRecord[];
  onSelectEnquiry: (enquiry: EnquiryRecord) => void;
  onUpdateEnquiries: React.Dispatch<React.SetStateAction<EnquiryRecord[]>>;
  onOpenDepositsQueue?: () => void;
}

// 5 Strategic Pillars grouping 11 fine stages
interface PillarConfig {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  badgeBg: string;
  stages: PipelineStage[];
}

const PILLARS: PillarConfig[] = [
  {
    id: "inquiries",
    title: "Inquiries & Estimates",
    subtitle: "New requests, custom quotes & agreed rates",
    color: "border-amber-500/40 text-amber-900",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
    stages: ["enquiry", "agreed_to_price"],
  },
  {
    id: "booking",
    title: "Booking & Deposits",
    subtitle: "Payment verification & dates",
    color: "border-gold/60 text-deep",
    badgeBg: "bg-gold/20 text-deep border-gold/40",
    stages: ["deposit_reported", "deposit_paid"],
  },
  {
    id: "prep",
    title: "Prep & Confirmed",
    subtitle: "Wardrobe guidance, location & shoot schedule",
    color: "border-blue-500/40 text-blue-900",
    badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
    stages: ["preparation", "confirmed"],
  },
  {
    id: "culling",
    title: "Culling & Retouching",
    subtitle: "Raw ingest, master tones & client proofing",
    color: "border-purple-500/40 text-purple-900",
    badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
    stages: ["shot", "editing", "client_review"],
  },
  {
    id: "delivered",
    title: "Delivered & Closed",
    subtitle: "Final master downloads & private archiving",
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

  // Drag and Drop States
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverPillar, setDragOverPillar] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  // Mobile Touch Drag Tracking: Long-press threshold distinguishes card move from horizontal scroll
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const touchCardId = useRef<string | null>(null);
  const touchHoldTimer = useRef<NodeJS.Timeout | null>(null);
  const isTouchDragging = useRef<boolean>(false);
  const [touchLiftedCardId, setTouchLiftedCardId] = useState<string | null>(null);
  const [mobileMoveCard, setMobileMoveCard] = useState<EnquiryRecord | null>(null);
  const granularScrollRef = useRef<HTMLDivElement>(null);
  const pillarsScrollRef = useRef<HTMLDivElement>(null);

  // Quick Lead Modal
  const [showAddLead, setShowAddLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    clientName: "",
    whatsapp: "",
    email: "",
    sessionType: "toddler",
    purposeText: "",
  });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Filter inquiries based on search and session type
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      if (
        sessionFilter !== "All" &&
        item.session_type?.toLowerCase() !== sessionFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.reference_code.toLowerCase().includes(q);
        const matchesPurpose = item.purpose_text?.toLowerCase().includes(q);
        const matchesSource = item.source?.toLowerCase().includes(q);
        const matchesName = (item as any).client_name?.toLowerCase().includes(q);
        return matchesRef || matchesPurpose || matchesSource || matchesName;
      }
      return true;
    });
  }, [enquiries, searchQuery, sessionFilter]);

  // Handle Drag & Drop to target stage with DB sync
  async function handleDropCard(cardId: string, targetStage: PipelineStage) {
    if (!cardId || !targetStage) return;

    // Optimistically update local state
    onUpdateEnquiries((prev) =>
      prev.map((item) =>
        item.id === cardId
          ? { ...item, stage: targetStage, stage_entered_at: new Date().toISOString() }
          : item
      )
    );

    // Persist to Neon DB via PUT /api/admin/kanban
    try {
      await fetch("/api/admin/kanban", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cardId,
          stage: targetStage,
          waitingOn: targetStage === "deposit_reported" ? "us" : undefined,
        }),
      });
    } catch (err) {
      console.error("[Kanban DB sync error]", err);
    }
  }

  // Mobile Touch handlers: 220ms hold threshold isolates card dragging from horizontal board scrolling
  function handleTouchStart(e: React.TouchEvent, cardId: string) {
    if (touchHoldTimer.current) clearTimeout(touchHoldTimer.current);
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchCardId.current = cardId;
    isTouchDragging.current = false;

    // 220ms hold threshold: if finger is held still, activate card move mode
    touchHoldTimer.current = setTimeout(() => {
      isTouchDragging.current = true;
      setTouchLiftedCardId(cardId);
      setDraggedCardId(cardId);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate(40); } catch (_) {}
      }
    }, 220);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartX.current);
    const dy = Math.abs(touch.clientY - touchStartY.current);

    // If finger moved before hold threshold was reached, user is scrolling horizontally!
    if (!isTouchDragging.current) {
      if (dx > 8 || dy > 8) {
        if (touchHoldTimer.current) {
          clearTimeout(touchHoldTimer.current);
          touchHoldTimer.current = null;
        }
        touchCardId.current = null;
      }
      return; // Do NOT preventDefault! Let horizontal scroll happen naturally.
    }

    // Card is lifted: lock board scroll and track target column under finger
    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;

    const stageEl = el.closest("[data-stage-id]");
    if (stageEl) {
      const stageId = stageEl.getAttribute("data-stage-id") as PipelineStage;
      setDragOverStage(stageId);
      setDragOverPillar(null);
    }

    const pillarEl = el.closest("[data-pillar-id]");
    if (pillarEl) {
      const pillarId = pillarEl.getAttribute("data-pillar-id");
      setDragOverPillar(pillarId);
      setDragOverStage(null);
    }
  }

  function handleTouchEnd(e?: React.TouchEvent) {
    if (touchHoldTimer.current) {
      clearTimeout(touchHoldTimer.current);
      touchHoldTimer.current = null;
    }

    if (isTouchDragging.current && touchCardId.current) {
      if (e) e.stopPropagation();
      if (dragOverStage) {
        handleDropCard(touchCardId.current, dragOverStage);
      } else if (dragOverPillar) {
        const pillar = PILLARS.find((p) => p.id === dragOverPillar);
        if (pillar) handleDropCard(touchCardId.current, pillar.stages[0]);
      }
    }

    isTouchDragging.current = false;
    touchCardId.current = null;
    setTouchLiftedCardId(null);
    setDraggedCardId(null);
    setDragOverPillar(null);
    setDragOverStage(null);
  }

  function scrollGranular(offset: number) {
    if (granularScrollRef.current) {
      granularScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  }

  function scrollPillars(offset: number) {
    if (pillarsScrollRef.current) {
      pillarsScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  }

  function handleOpenMoveModal(e: React.SyntheticEvent, card: EnquiryRecord) {
    e.stopPropagation();
    setMobileMoveCard(card);
  }

  // Quick 1-click stage advancement
  function handleQuickAdvance(e: React.MouseEvent, enquiry: EnquiryRecord) {
    e.stopPropagation();
    const currentIndex = ALL_11_STAGES.findIndex((s) => s.id === enquiry.stage);
    if (currentIndex === -1 || currentIndex >= ALL_11_STAGES.length - 1) return;

    const nextStage = ALL_11_STAGES[currentIndex + 1].id;

    if (nextStage === "deposit_paid" && onOpenDepositsQueue) {
      const proceed = confirm(
        "Hard Rule #1: Deposits must be verified against bank records. Open Deposit Queue now?"
      );
      if (proceed) {
        onOpenDepositsQueue();
        return;
      }
    }

    const res = transitionEnquiry(enquiry, nextStage, "Studio Staff");
    if (res.success && res.enquiry) {
      handleDropCard(enquiry.id, nextStage);
    } else {
      alert(res.error || "Stage transition not permitted");
    }
  }

  // Add new lead directly to DB
  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadForm.clientName || !leadForm.whatsapp) return;

    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/admin/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadForm),
      });
      const data = await res.json();
      if (data.enquiry) {
        onUpdateEnquiries((prev) => [data.enquiry, ...prev]);
        setShowAddLead(false);
        setLeadForm({
          clientName: "",
          whatsapp: "",
          email: "",
          sessionType: "toddler",
          purposeText: "",
        });
      }
    } catch (err) {
      console.error("Failed to create lead:", err);
    } finally {
      setIsSubmittingLead(false);
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Top Filter and Controls Toolbar */}
      <div className="bg-warm-white p-4 rounded-2xl border border-line shadow-sm space-y-4 w-full max-w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client code (e.g. LS-9B2K), name or event..."
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

          {/* View Mode Switcher, Quick Lead Button and Counters */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setShowAddLead(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-deep text-warm-white hover:bg-gold hover:text-deep text-xs font-body font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Inquiry</span>
            </button>

            <div className="flex items-center p-1 bg-cream rounded-full border border-line text-xs font-body font-semibold">
              <button
                onClick={() => setViewMode("pillars")}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === "pillars"
                    ? "bg-deep text-warm-white shadow-xs"
                    : "text-muted hover:text-deep"
                }`}
              >
                5 Strategic Pillars
              </button>
              <button
                onClick={() => setViewMode("granular")}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === "granular"
                    ? "bg-deep text-warm-white shadow-xs"
                    : "text-muted hover:text-deep"
                }`}
              >
                11 Fine Stages
              </button>
            </div>

            <div className="text-xs font-mono text-muted bg-cream px-3 py-1.5 rounded-full border border-line whitespace-nowrap">
              {filteredEnquiries.length} Active Leads
            </div>
          </div>
        </div>

        {/* Drag Hint & Category Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-line/60 w-full">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider shrink-0 mr-1">
              Category:
            </span>
            {["All", "toddler", "maternity", "event", "wedding", "official-portrait"].map((type) => (
              <button
                key={type}
                onClick={() => setSessionFilter(type)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-body uppercase tracking-wider font-semibold transition-all shrink-0 ${
                  sessionFilter.toLowerCase() === type.toLowerCase()
                    ? "bg-gold text-deep shadow-xs font-bold"
                    : "bg-cream text-brown hover:bg-warm-white border border-line"
                }`}
              >
                {type === "official-portrait" ? "Official" : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-body text-gold/90 shrink-0">
            <GripVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Drag cards or tap &rarr; to advance stage</span>
            <span className="sm:hidden">Hold card 0.2s to move · Swipe to scroll columns</span>
          </div>
        </div>

        {touchLiftedCardId && (
          <div className="py-2 px-4 rounded-xl bg-gold/15 border border-gold/40 text-deep text-xs font-semibold flex items-center justify-between animate-pulse sm:hidden">
            <span className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gold" />
              Holding card · Drag and release over target column
            </span>
            <span className="font-mono text-[10px] text-muted">Hold Active</span>
          </div>
        )}
      </div>

      {/* Add New Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
              <h3 className="font-display text-xl text-deep font-semibold">Create New Client Inquiry</h3>
              <button onClick={() => setShowAddLead(false)} className="text-muted hover:text-deep">✕</button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">Client Full Name *</label>
                <input
                  required
                  type="text"
                  value={leadForm.clientName}
                  onChange={(e) => setLeadForm({ ...leadForm, clientName: e.target.value })}
                  placeholder="e.g. Amina Bello"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">WhatsApp Phone *</label>
                  <input
                    required
                    type="tel"
                    value={leadForm.whatsapp}
                    onChange={(e) => setLeadForm({ ...leadForm, whatsapp: e.target.value })}
                    placeholder="0813 000 0000"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="amina@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">Session Type</label>
                  <select
                    value={leadForm.sessionType}
                    onChange={(e) => setLeadForm({ ...leadForm, sessionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  >
                    <option value="toddler">Toddler &amp; Children</option>
                    <option value="maternity">Maternity &amp; Motherhood</option>
                    <option value="motherhood-bundle">Motherhood Bundle</option>
                    <option value="event">Event Coverage</option>
                    <option value="wedding">Weddings &amp; Ceremonies</option>
                    <option value="official-portrait">Official Portrait</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">Notes / Occasion</label>
                  <input
                    type="text"
                    value={leadForm.purposeText}
                    onChange={(e) => setLeadForm({ ...leadForm, purposeText: e.target.value })}
                    placeholder="e.g. 1st Birthday"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="px-4 py-2 rounded-lg text-xs font-body text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all"
                >
                  {isSubmittingLead ? "Creating..." : "Save to Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 1: EXECUTIVE PILLARS (5 Horizontal Swimlanes) */}
      {viewMode === "pillars" && (
        <div ref={pillarsScrollRef} className="w-full max-w-full min-w-0 overflow-x-auto pb-6 scroll-smooth lg:overflow-visible">
          <div className="flex lg:grid lg:grid-cols-5 gap-4 min-w-[1200px] lg:min-w-0 select-none">
            {PILLARS.map((pillar) => {
              const pillarCards = filteredEnquiries.filter((e) => pillar.stages.includes(e.stage));
              const isDragTarget = dragOverPillar === pillar.id;

              return (
                <div
                  key={pillar.id}
                  data-pillar-id={pillar.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverPillar !== pillar.id) setDragOverPillar(pillar.id);
                  }}
                  onDragLeave={() => setDragOverPillar(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain") || draggedCardId;
                    if (id) handleDropCard(id, pillar.stages[0]);
                    setDragOverPillar(null);
                    setDraggedCardId(null);
                  }}
                  className={`w-[280px] sm:w-[320px] lg:w-auto shrink-0 flex flex-col rounded-2xl border transition-all duration-200 p-3 sm:p-4 shadow-sm min-h-[580px] select-none ${
                    isDragTarget
                      ? "bg-amber-50/70 border-gold border-2 scale-[1.01] shadow-md ring-2 ring-gold/20"
                      : `bg-[#FBF9F6] ${pillar.color}`
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
                    {pillarCards.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-line/60 rounded-xl flex items-center justify-center text-center p-4">
                        <span className="text-xs font-body text-muted italic">Drop card here to move</span>
                      </div>
                    ) : (
                      pillarCards.map((card) => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", card.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggedCardId(card.id);
                          }}
                          onDragEnd={() => {
                            setDraggedCardId(null);
                            setDragOverPillar(null);
                            setDragOverStage(null);
                          }}
                          onTouchStart={(e) => handleTouchStart(e, card.id)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          onClick={() => onSelectEnquiry(card)}
                          style={{
                            WebkitTouchCallout: "none",
                            WebkitUserSelect: "none",
                            userSelect: "none",
                            touchAction: touchLiftedCardId === card.id ? "none" : "pan-x pan-y",
                          }}
                          className={`group relative p-3.5 rounded-xl bg-warm-white hover:bg-white border border-line hover:border-gold shadow-xs hover:shadow-editorial cursor-grab active:cursor-grabbing transition-all space-y-2.5 select-none ${
                            draggedCardId === card.id ? "opacity-50 scale-95" : ""
                          } ${
                            touchLiftedCardId === card.id
                              ? "scale-[1.03] ring-2 ring-gold border-gold shadow-2xl z-40 bg-amber-50/95"
                              : ""
                          }`}
                        >
                          {/* Top Bar with Reference & WhatsApp Link */}
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-deep group-hover:text-gold transition-colors flex items-center gap-1.5">
                              <GripVertical className="w-3 h-3 text-muted/60" />
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

                          {/* Client Name & Purpose */}
                          <div>
                            {(card as any).client_name && (
                              <span className="font-body text-xs font-bold text-deep block mb-0.5">
                                {(card as any).client_name}
                              </span>
                            )}
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

                            <div className="flex items-center gap-1">
                              <span
                                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                  card.waiting_on === "us"
                                    ? "bg-amber-100 text-amber-800 font-bold"
                                    : "bg-cream text-muted"
                                }`}
                              >
                                {card.waiting_on === "us" ? "Our Turn" : "Client Turn"}
                              </span>
                            </div>
                          </div>

                          {/* Accessible 1-tap Stage Selector & Advance Button */}
                          <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={(e) => handleOpenMoveModal(e, card)}
                              className="text-deep font-semibold inline-flex items-center gap-1 px-2 py-1 rounded bg-cream hover:bg-gold/20 border border-line transition-all shrink-0"
                            >
                              <span>Move</span>
                              <ChevronRight className="w-2.5 h-2.5 text-gold" />
                            </button>

                            <div className="flex items-center gap-1">
                              <select
                                value={card.stage}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleDropCard(card.id, e.target.value as PipelineStage)}
                                className="bg-cream/60 border border-line rounded px-1.5 py-1 text-deep font-body text-[10px] focus:outline-none focus:border-gold"
                              >
                                {ALL_11_STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    &rarr; {s.label}
                                  </option>
                                ))}
                              </select>

                              {card.stage !== "closed" && (
                                <button
                                  onClick={(e) => handleQuickAdvance(e, card)}
                                  className="text-gold hover:text-deep font-semibold inline-flex items-center gap-0.5 px-2 py-1 rounded hover:bg-cream transition-colors"
                                >
                                  <span>Next</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: GRANULAR 11-STAGE BOARD (Clamped to prevent page overflow) */}
      {viewMode === "granular" && (
        <div className="space-y-2 w-full max-w-full min-w-0">
          {/* Scroll navigation controls for 11 stages */}
          <div className="flex items-center justify-between px-1 py-1 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5 text-deep font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
              <span>11 Fine Production Stages</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollGranular(-320)}
                className="px-2.5 py-1 rounded-full border border-line bg-warm-white hover:bg-cream text-deep text-xs font-body font-semibold transition-all flex items-center gap-1 shadow-2xs"
                title="Scroll stages left"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-gold" />
                <span>Scroll Left</span>
              </button>
              <button
                type="button"
                onClick={() => scrollGranular(320)}
                className="px-2.5 py-1 rounded-full border border-line bg-warm-white hover:bg-cream text-deep text-xs font-body font-semibold transition-all flex items-center gap-1 shadow-2xs"
                title="Scroll stages right"
              >
                <span>Scroll Right</span>
                <ChevronRight className="w-3.5 h-3.5 text-gold" />
              </button>
            </div>
          </div>

          <div
            ref={granularScrollRef}
            className="w-full max-w-full min-w-0 overflow-x-auto pb-6 scroll-smooth select-none"
          >
            <div className="flex gap-3.5 w-max min-w-full select-none">
              {ALL_11_STAGES.map((stg) => {
                const stageCards = filteredEnquiries.filter((e) => e.stage === stg.id);
                const isTarget = dragOverStage === stg.id;

                return (
                  <div
                    key={stg.id}
                    data-stage-id={stg.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverStage(stg.id);
                    }}
                    onDragLeave={() => setDragOverStage(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain") || draggedCardId;
                      if (id) handleDropCard(id, stg.id);
                      setDragOverStage(null);
                      setDraggedCardId(null);
                    }}
                    className={`w-72 shrink-0 rounded-2xl border transition-all p-3 shadow-xs flex flex-col min-h-[550px] select-none ${
                      isTarget
                        ? "bg-amber-50/80 border-gold border-2 ring-2 ring-gold/20"
                        : "bg-[#FBF9F6] border-line"
                    }`}
                  >
                    <div className="pb-2 border-b border-line mb-3 flex items-center justify-between">
                      <span className="font-display text-xs font-semibold text-deep truncate">
                        {stg.label}
                      </span>
                      <span className="text-[10px] font-mono bg-cream px-1.5 py-0.5 rounded border border-line font-bold">
                        {stageCards.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[65vh]">
                      {stageCards.length === 0 ? (
                        <div className="h-24 border border-dashed border-line/60 rounded-lg flex items-center justify-center text-center p-2">
                          <span className="text-[10px] font-body text-muted italic">Drop card here</span>
                        </div>
                      ) : (
                        stageCards.map((card) => (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", card.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggedCardId(card.id);
                            }}
                            onDragEnd={() => {
                              setDraggedCardId(null);
                              setDragOverStage(null);
                            }}
                            onTouchStart={(e) => handleTouchStart(e, card.id)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onClick={() => onSelectEnquiry(card)}
                            style={{
                              WebkitTouchCallout: "none",
                              WebkitUserSelect: "none",
                              userSelect: "none",
                              touchAction: touchLiftedCardId === card.id ? "none" : "pan-x pan-y",
                            }}
                            className={`p-3 rounded-lg bg-warm-white border border-line hover:border-gold shadow-2xs cursor-grab active:cursor-grabbing text-xs space-y-2 transition-all select-none ${
                              draggedCardId === card.id ? "opacity-50" : ""
                            } ${
                              touchLiftedCardId === card.id
                                ? "scale-[1.03] ring-2 ring-gold border-gold shadow-2xl z-40 bg-amber-50/95"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="font-bold text-deep">{card.reference_code}</span>
                              <span className="text-gold font-bold uppercase">{card.session_type}</span>
                            </div>

                            {(card as any).client_name && (
                              <span className="font-body text-xs font-semibold text-deep block">
                                {(card as any).client_name}
                              </span>
                            )}

                            <p className="font-body text-[11px] text-brown/90 line-clamp-2">
                              {card.purpose_text}
                            </p>

                            <div className="pt-1.5 border-t border-line/50 flex items-center justify-between gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={(e) => handleOpenMoveModal(e, card)}
                                className="text-deep font-semibold inline-flex items-center gap-1 px-2 py-1 rounded bg-cream hover:bg-gold/20 border border-line transition-all shrink-0"
                              >
                                <span>Move</span>
                                <ChevronRight className="w-2.5 h-2.5 text-gold" />
                              </button>

                              <div className="flex items-center gap-1">
                                <select
                                  value={card.stage}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleDropCard(card.id, e.target.value as PipelineStage)}
                                  className="bg-cream/60 border border-line rounded px-1.5 py-1 text-deep font-body text-[10px] focus:outline-none"
                                >
                                  {ALL_11_STAGES.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      &rarr; {s.label}
                                    </option>
                                  ))}
                                </select>

                                {card.stage !== "closed" && (
                                  <button
                                    onClick={(e) => handleQuickAdvance(e, card)}
                                    className="text-gold hover:text-deep font-semibold inline-flex items-center gap-0.5 px-2 py-1 rounded hover:bg-cream transition-colors"
                                  >
                                    <span>Next</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Move Stage Sheet Modal */}
      {mobileMoveCard && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setMobileMoveCard(null)}
        >
          <div
            className="bg-warm-white rounded-t-3xl sm:rounded-2xl border border-line max-w-md w-full p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] font-mono text-gold font-bold uppercase tracking-wider block">
                  Move Stage · {mobileMoveCard.reference_code}
                </span>
                <h3 className="font-display text-lg text-deep font-semibold">
                  {(mobileMoveCard as any).client_name || mobileMoveCard.purpose_text}
                </h3>
              </div>
              <button
                onClick={() => setMobileMoveCard(null)}
                className="p-1 rounded-full text-muted hover:text-deep hover:bg-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-body text-brown/80">
              Select target stage to move this client commission to. All updates persist to Neon DB immediately:
            </p>

            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
              {ALL_11_STAGES.map((stg) => {
                const isCurrent = mobileMoveCard.stage === stg.id;
                return (
                  <button
                    key={stg.id}
                    onClick={() => {
                      handleDropCard(mobileMoveCard.id, stg.id);
                      setMobileMoveCard(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-body font-semibold transition-all ${
                      isCurrent
                        ? "bg-gold/20 border-gold text-deep font-bold ring-1 ring-gold"
                        : "bg-white hover:bg-cream/60 border-line text-deep"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-gold" : "bg-muted/40"}`} />
                      <span>{stg.label}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-mono uppercase bg-gold text-deep px-2 py-0.5 rounded-full font-bold">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-line flex justify-end">
              <button
                onClick={() => setMobileMoveCard(null)}
                className="px-4 py-2 rounded-full bg-cream text-deep text-xs font-body font-semibold hover:bg-line transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
