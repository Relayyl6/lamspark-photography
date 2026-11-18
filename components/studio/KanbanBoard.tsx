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
  Plus,
  MoveHorizontal,
  GripVertical,
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

  // Drag and Drop States
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverPillar, setDragOverPillar] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

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

  // Handle Drag & Drop to target stage
  async function handleDropCard(cardId: string, targetStage: PipelineStage) {
    if (!cardId || !targetStage) return;

    // Optimistically update
    onUpdateEnquiries((prev) =>
      prev.map((item) =>
        item.id === cardId
          ? { ...item, stage: targetStage, stage_entered_at: new Date().toISOString() }
          : item
      )
    );

    try {
      await fetch("/api/admin/kanban", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, stage: targetStage }),
      });
    } catch (err) {
      console.error("Failed to persist stage to DB:", err);
    }
  }

  // Quick Advance Handler with stage machine validation
  function handleQuickAdvance(e: React.MouseEvent, enquiry: EnquiryRecord) {
    e.stopPropagation();

    const nextStageMap: Record<PipelineStage, PipelineStage | null> = {
      enquiry: "agreed_to_price",
      agreed_to_price: "deposit_reported",
      deposit_reported: null,
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
          <div className="flex items-center gap-3 self-end lg:self-auto flex-wrap">
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

            <div className="text-xs font-mono text-muted bg-cream px-3 py-1.5 rounded-full border border-line">
              {filteredEnquiries.length} Active Leads
            </div>
          </div>
        </div>

        {/* Drag Hint & Category Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-line/60">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
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
            <span>Drag cards between columns to move stages</span>
          </div>
        </div>
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
                    <option value="toddler">Toddler & Children</option>
                    <option value="maternity">Maternity & Motherhood</option>
                    <option value="motherhood-bundle">Motherhood Bundle</option>
                    <option value="event">Event Coverage</option>
                    <option value="wedding">Weddings & Ceremonies</option>
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

      {/* KANBAN BOARD VIEW 1: EXECUTIVE PILLARS (5 Horizontal Swimlanes scrollable on mobile, 5-col grid on desktop) */}
      {viewMode === "pillars" && (
        <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto lg:overflow-visible pb-4 scroll-smooth">
          {PILLARS.map((pillar) => {
            const pillarCards = filteredEnquiries.filter((e) => pillar.stages.includes(e.stage));
            const isDragTarget = dragOverPillar === pillar.id;

            return (
              <div
                key={pillar.id}
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
                className={`w-[280px] sm:w-[320px] lg:w-auto shrink-0 flex flex-col rounded-2xl border transition-all duration-200 p-3 sm:p-4 shadow-sm min-h-[580px] ${
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
                        onClick={() => onSelectEnquiry(card)}
                        className={`group relative p-3.5 rounded-xl bg-warm-white hover:bg-white border border-line hover:border-gold shadow-xs hover:shadow-editorial cursor-grab active:cursor-grabbing transition-all space-y-2.5 ${
                          draggedCardId === card.id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Top Bar with Reference, Source & WhatsApp Link */}
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

                        {/* Stage Selector Dropdown for quick reordering */}
                        <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
                          <select
                            value={card.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleDropCard(card.id, e.target.value as PipelineStage)}
                            className="bg-cream/60 border border-line rounded px-1.5 py-0.5 text-deep font-body text-[10px] focus:outline-none focus:border-gold"
                          >
                            {ALL_11_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                → {s.label}
                              </option>
                            ))}
                          </select>

                          {card.stage !== "closed" && (
                            <button
                              onClick={(e) => handleQuickAdvance(e, card)}
                              className="text-gold hover:text-deep font-semibold inline-flex items-center gap-0.5"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KANBAN BOARD VIEW 2: GRANULAR 11-STAGE BOARD */}
      {viewMode === "granular" && (
        <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth">
          {ALL_11_STAGES.map((stg) => {
            const stageCards = filteredEnquiries.filter((e) => e.stage === stg.id);
            const isTarget = dragOverStage === stg.id;

            return (
              <div
                key={stg.id}
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
                className={`w-72 shrink-0 rounded-2xl border transition-all p-3 shadow-xs flex flex-col min-h-[550px] ${
                  isTarget ? "bg-amber-50/80 border-gold border-2" : "bg-[#FBF9F6] border-line"
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
                        onClick={() => onSelectEnquiry(card)}
                        className={`p-3 rounded-lg bg-warm-white border border-line hover:border-gold shadow-2xs cursor-grab active:cursor-grabbing text-xs space-y-1.5 ${
                          draggedCardId === card.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="font-bold text-deep">{card.reference_code}</span>
                          <span className="text-gold font-bold uppercase">{card.session_type}</span>
                        </div>
                        <p className="font-body text-[11px] text-deep line-clamp-2">
                          {card.purpose_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
