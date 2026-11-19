"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Edit2,
  Check,
  X,
  UploadCloud,
  Loader2,
  Sparkles,
  ExternalLink,
  Calendar,
  Clock,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Percent,
  Layers,
} from "lucide-react";
import type { SessionTypeSlug } from "@/lib/types";

interface SessionData {
  slug: SessionTypeSlug;
  title: string;
  tagline: string;
  description: string;
  fromPrice: number | null;
  promoPrice: number | null;
  heroImage: string;
  defaultDepositPercent: number;
  depositPercent: number;
  standardDeliveryDays: string;
  category: "studio" | "events" | "portraits";
  priceOverride: number | null;
  coverImageUrl: string | null;
  deliveryDaysOverride: string | null;
  packageTiers?: any[];
  hasOverride: boolean;
}

export function ServicesEditor() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<SessionData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [editPrice, setEditPrice] = useState<string>("");
  const [editPromoPrice, setEditPromoPrice] = useState<string>("");
  const [editDepositPercent, setEditDepositPercent] = useState<string>("");
  const [editCover, setEditCover] = useState<string>("");
  const [editDelivery, setEditDelivery] = useState<string>("");
  const [editPackageTiers, setEditPackageTiers] = useState<any[]>([]);
  const [newInclusionText, setNewInclusionText] = useState<{ [tierIdx: number]: string }>({});

  async function loadSessions() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/sessions");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired or unauthorized. Please re-login to the Studio.");
        }
        throw new Error(`Failed to fetch sessions from database (${res.status})`);
      }
      const data = await res.json();
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else {
        throw new Error(data.error || "No sessions returned");
      }
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      setErrorMessage(err.message || "Failed to load live sessions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  function handleOpenEdit(session: SessionData) {
    setEditingSession(session);
    setEditPrice(
      session.priceOverride !== null
        ? String(session.priceOverride)
        : session.fromPrice !== null
        ? String(session.fromPrice)
        : ""
    );
    setEditPromoPrice(session.promoPrice !== null ? String(session.promoPrice) : "");
    setEditDepositPercent(String(session.depositPercent || session.defaultDepositPercent || 70));
    setEditCover(session.coverImageUrl || session.heroImage);
    setEditDelivery(session.deliveryDaysOverride || session.standardDeliveryDays);
    setEditPackageTiers(
      Array.isArray(session.packageTiers) && session.packageTiers.length > 0
        ? JSON.parse(JSON.stringify(session.packageTiers))
        : []
    );
    setNewInclusionText({});
  }

  function handleAddTier() {
    setEditPackageTiers((prev) => [
      ...prev,
      {
        id: `${editingSession?.slug}-tier-${Date.now().toString(36)}`,
        name: "New Collection Tier",
        price: 150000,
        promoPrice: null,
        badge: "",
        deliveryDaysText: "7 to 10 working days",
        inclusions: ["1 studio outfit", "5 professionally edited images"],
      },
    ]);
  }

  function handleRemoveTier(idx: number) {
    setEditPackageTiers((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleUpdateTier(idx: number, field: string, value: any) {
    setEditPackageTiers((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t))
    );
  }

  function handleAddInclusion(tierIdx: number) {
    const text = newInclusionText[tierIdx]?.trim();
    if (!text) return;
    setEditPackageTiers((prev) =>
      prev.map((t, i) =>
        i === tierIdx
          ? { ...t, inclusions: [...(t.inclusions || []), text] }
          : t
      )
    );
    setNewInclusionText((prev) => ({ ...prev, [tierIdx]: "" }));
  }

  function handleRemoveInclusion(tierIdx: number, incIdx: number) {
    setEditPackageTiers((prev) =>
      prev.map((t, i) =>
        i === tierIdx
          ? {
              ...t,
              inclusions: (t.inclusions || []).filter((_: any, k: number) => k !== incIdx),
            }
          : t
      )
    );
  }

  // Upload a new cover image directly
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingSession) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partition", "public");
      formData.append("sessionType", editingSession.slug);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url || data.storageKey) {
        setEditCover(data.url || data.storageKey);
      }
    } catch (err) {
      console.error("Cover upload failed:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  // Save changes to Neon DB via PUT /api/admin/sessions
  async function handleSaveSession(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSession) return;

    setIsSaving(true);
    try {
      const priceNum = editPrice.trim() ? parseInt(editPrice.replace(/[^0-9]/g, ""), 10) : null;
      const promoNum = editPromoPrice.trim() ? parseInt(editPromoPrice.replace(/[^0-9]/g, ""), 10) : null;
      const depositNum = editDepositPercent.trim() ? parseInt(editDepositPercent.replace(/[^0-9]/g, ""), 10) : null;

      const res = await fetch("/api/admin/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editingSession.slug,
          priceOverride: priceNum,
          promoPrice: promoNum,
          depositPercent: depositNum,
          coverImageUrl: editCover.trim() || null,
          deliveryDays: editDelivery.trim() || null,
          packageTiers: editPackageTiers,
        }),
      });

      const data = await res.json();
      if (data.override) {
        setSessions((prev) =>
          prev.map((s) =>
            s.slug === editingSession.slug
              ? {
                  ...s,
                  priceOverride: data.override.price_override,
                  promoPrice: data.override.promo_price,
                  depositPercent: data.override.deposit_percent || s.depositPercent,
                  coverImageUrl: data.override.cover_image_url,
                  deliveryDaysOverride: data.override.delivery_days,
                  packageTiers: data.override.package_tiers || editPackageTiers,
                  hasOverride: true,
                }
              : s
          )
        );
        setStatusMessage(`Saved pricing, promo & collections for ${editingSession.title}`);
        setTimeout(() => setStatusMessage(null), 3000);
        setEditingSession(null);
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Service Catalog, Investment &amp; Promotional Rates
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Services &amp; Pricing Editor
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Manage investment starting rates, seasonal promo prices (e.g. Maternity bundles), deposit percentages, and delivery timelines. All edits persist to Neon DB as the single source of truth.
          </p>
        </div>

        {statusMessage && (
          <div className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in self-start sm:self-auto">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Services Grid or Loading / Error states */}
      {isLoading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Loading live session configurations from Neon DB...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-8 text-center bg-warm-white rounded-2xl border border-red-200 space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="font-display text-lg text-deep font-semibold">Unable to Load Services</h3>
          <p className="text-xs font-body text-red-600 max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={loadSessions}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-8 text-center bg-warm-white rounded-2xl border border-line space-y-3">
          <Tag className="w-8 h-8 text-gold mx-auto opacity-50" />
          <h3 className="font-display text-lg text-deep">No services found in database</h3>
          <button
            onClick={loadSessions}
            className="px-4 py-2 bg-deep text-warm-white rounded-full text-xs font-semibold"
          >
            Refresh Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => {
            const currentPrice = session.priceOverride ?? session.fromPrice;
            const currentCover = session.coverImageUrl || session.heroImage;
            const currentDelivery = session.deliveryDaysOverride || session.standardDeliveryDays;
            const depositPct = session.depositPercent || session.defaultDepositPercent || 70;

            return (
              <div
                key={session.slug}
                className="bg-warm-white rounded-2xl border border-line overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Visual Stage */}
                <div className="relative aspect-[16/10] bg-cream overflow-hidden">
                  <img
                    src={currentCover}
                    alt={session.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-deep/80 backdrop-blur-sm text-warm-white px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider">
                    {session.category}
                  </div>
                  {session.promoPrice && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Promo Active</span>
                    </div>
                  )}
                  {!session.promoPrice && session.hasOverride && (
                    <div className="absolute top-3 right-3 bg-gold text-deep font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Live DB Override</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display text-lg text-deep font-semibold">
                      {session.title}
                    </h3>
                    <p className="font-body text-xs text-brown/80 mt-1 line-clamp-2">
                      {session.tagline}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-line/60">
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-muted">Standard Rate:</span>
                      <strong className="font-display text-base text-deep font-semibold">
                        {currentPrice !== null ? `₦${currentPrice.toLocaleString()}` : "Custom Bespoke"}
                      </strong>
                    </div>

                    {session.promoPrice && (
                      <div className="flex items-center justify-between text-xs font-body bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <span className="text-amber-900 font-semibold text-[11px] uppercase tracking-wider">
                          Promo / Bundle Rate:
                        </span>
                        <strong className="font-display text-sm text-amber-900 font-bold">
                          ₦{session.promoPrice.toLocaleString()}
                        </strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-muted">Deposit Required:</span>
                      <span className="font-mono text-gold font-bold">
                        {depositPct}% to lock date
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-muted">Delivery Timeline:</span>
                      <span className="font-semibold text-deep truncate max-w-[160px]">
                        {currentDelivery}
                      </span>
                    </div>

                    {Array.isArray(session.packageTiers) && session.packageTiers.length > 0 && (
                      <div className="pt-2 border-t border-line/40">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gold font-bold block mb-1">
                          {session.packageTiers.length} Collections Configured:
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {session.packageTiers.map((t: any, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] font-body bg-cream/90 text-deep px-2 py-0.5 rounded border border-line whitespace-nowrap"
                            >
                              {t.name} {t.price ? `· ₦${(t.promoPrice || t.price).toLocaleString()}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenEdit(session)}
                    className="w-full py-2.5 rounded-full bg-cream hover:bg-white text-deep text-xs font-body font-semibold border border-line hover:border-gold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gold" />
                    <span>Edit Rates, Promo &amp; Collections</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-xl text-deep font-semibold">
                  Edit {editingSession.title}
                </h3>
                <span className="text-xs font-mono text-muted uppercase">
                  Slug: {editingSession.slug} · Database Single Source of Truth
                </span>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="text-muted hover:text-deep p-1 rounded-full hover:bg-cream"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-5">
              {/* Top Level Session Controls */}
              <div className="p-4 bg-cream/40 rounded-xl border border-line space-y-3">
                <span className="text-[11px] font-mono text-gold font-bold uppercase tracking-wider block">
                  1. Overall Session Defaults
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                      Starting Investment (NGN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="e.g. 140000"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-body text-deep"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                      Global Promo Rate (NGN)
                    </label>
                    <input
                      type="text"
                      value={editPromoPrice}
                      onChange={(e) => setEditPromoPrice(e.target.value)}
                      placeholder="e.g. 120000 or blank"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-body text-deep"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                      Deposit Percentage (%)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={editDepositPercent}
                      onChange={(e) => setEditDepositPercent(e.target.value)}
                      placeholder="70 (Maternity: 50)"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-body text-deep"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                      Default Delivery Timeline
                    </label>
                    <input
                      type="text"
                      value={editDelivery}
                      onChange={(e) => setEditDelivery(e.target.value)}
                      placeholder="e.g. 7 to 10 working days"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-body text-deep"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                      Cover Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editCover}
                        onChange={(e) => setEditCover(e.target.value)}
                        placeholder="https://... or /images/client/..."
                        className="flex-1 px-3 py-2 rounded-lg border border-line bg-white text-xs font-body text-deep"
                      />
                      <label className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold transition-all hover:bg-gold hover:text-deep">
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5" />
                        )}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          className="hidden"
                          onChange={handleCoverUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collection Packages / Tiers Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-gold font-bold uppercase tracking-wider block">
                      2. Available Collections &amp; Package Tiers ({editPackageTiers.length})
                    </span>
                    <p className="text-[11px] font-body text-brown/80">
                      Configure individual packages (Mini Glow, Classic Bloom, Signature Grace, Luxury Motherhood, etc.). These reflect directly on the booking page and catalog.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="px-3 py-1.5 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all shrink-0 shadow-2xs"
                  >
                    + Add Collection Tier
                  </button>
                </div>

                {editPackageTiers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-line text-center text-xs text-muted">
                    No individual collection tiers defined. Click &ldquo;+ Add Collection Tier&rdquo; to create one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editPackageTiers.map((tier, idx) => (
                      <div
                        key={tier.id || idx}
                        className="p-3.5 rounded-xl border border-line bg-cream/30 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-line/60">
                          <span className="text-xs font-display font-bold text-deep flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gold/20 text-deep text-[11px] font-mono flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            {tier.name || "Untitled Tier"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                          >
                            Remove Tier
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                              Tier Name
                            </label>
                            <input
                              type="text"
                              value={tier.name || ""}
                              onChange={(e) => handleUpdateTier(idx, "name", e.target.value)}
                              placeholder="e.g. Mini Glow"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-white text-xs font-body text-deep"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                              Regular Rate (₦)
                            </label>
                            <input
                              type="number"
                              value={tier.price ?? ""}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  "price",
                                  e.target.value ? parseInt(e.target.value, 10) : null
                                )
                              }
                              placeholder="140000"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-white text-xs font-body text-deep"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                              Promo Rate (₦)
                            </label>
                            <input
                              type="number"
                              value={tier.promoPrice ?? ""}
                              onChange={(e) =>
                                handleUpdateTier(
                                  idx,
                                  "promoPrice",
                                  e.target.value ? parseInt(e.target.value, 10) : null
                                )
                              }
                              placeholder="Optional promo"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-white text-xs font-body text-deep"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                              Badge / Label (e.g. Popular Choice, Heirloom)
                            </label>
                            <input
                              type="text"
                              value={tier.badge || ""}
                              onChange={(e) => handleUpdateTier(idx, "badge", e.target.value)}
                              placeholder="e.g. POPULAR CHOICE"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-white text-xs font-body text-deep"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">
                              Turnaround Timeline
                            </label>
                            <input
                              type="text"
                              value={tier.deliveryDaysText || ""}
                              onChange={(e) =>
                                handleUpdateTier(idx, "deliveryDaysText", e.target.value)
                              }
                              placeholder="e.g. 10 business days"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-white text-xs font-body text-deep"
                            />
                          </div>
                        </div>

                        {/* Inclusions list */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                            Inclusions / Deliverables
                          </label>
                          <div className="space-y-1">
                            {(tier.inclusions || []).map((inc: string, incIdx: number) => (
                              <div
                                key={incIdx}
                                className="flex items-center justify-between gap-2 px-2.5 py-1 rounded bg-white border border-line/60 text-xs text-deep"
                              >
                                <span className="flex-1 font-body text-[11px]">{inc}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInclusion(idx, incIdx)}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={newInclusionText[idx] || ""}
                              onChange={(e) =>
                                setNewInclusionText((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddInclusion(idx);
                                }
                              }}
                              placeholder="Add deliverable (e.g. 5 retouched images, 1 outfit)..."
                              className="flex-1 px-2.5 py-1 rounded border border-line bg-white text-xs font-body text-deep"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddInclusion(idx)}
                              className="px-3 py-1 rounded bg-cream hover:bg-gold hover:text-deep text-xs font-semibold border border-line"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-lg text-xs font-body text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm"
                >
                  {isSaving ? "Saving to DB..." : "Save Session & Collections"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
