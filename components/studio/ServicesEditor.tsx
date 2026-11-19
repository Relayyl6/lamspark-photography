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
} from "lucide-react";
import type { SessionTypeSlug } from "@/lib/types";

interface SessionData {
  slug: SessionTypeSlug;
  title: string;
  tagline: string;
  description: string;
  fromPrice: number | null;
  heroImage: string;
  defaultDepositPercent: number;
  standardDeliveryDays: string;
  category: "studio" | "events" | "portraits";
  priceOverride: number | null;
  coverImageUrl: string | null;
  deliveryDaysOverride: string | null;
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
  const [editCover, setEditCover] = useState<string>("");
  const [editDelivery, setEditDelivery] = useState<string>("");

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
    setEditCover(session.coverImageUrl || session.heroImage);
    setEditDelivery(session.deliveryDaysOverride || session.standardDeliveryDays);
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
      const res = await fetch("/api/admin/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editingSession.slug,
          priceOverride: priceNum,
          coverImageUrl: editCover.trim() || null,
          deliveryDays: editDelivery.trim() || null,
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
                  coverImageUrl: data.override.cover_image_url,
                  deliveryDaysOverride: data.override.delivery_days,
                  hasOverride: true,
                }
              : s
          )
        );
        setStatusMessage(`Saved changes for ${editingSession.title}`);
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
            Service Catalog &amp; Rate Controls
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Services &amp; Pricing Editor
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Edit session investment rates, cover imagery, and standard delivery timelines. All edits persist to Neon DB as the single source of truth.
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
                  {session.hasOverride && (
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
                      <span className="text-muted">Starting Rate:</span>
                      <strong className="font-display text-base text-deep font-semibold">
                        {currentPrice !== null ? `₦${currentPrice.toLocaleString()}` : "Custom Bespoke"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-muted">Delivery Timeline:</span>
                      <span className="font-semibold text-deep truncate max-w-[160px]">
                        {currentDelivery}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(session)}
                    className="w-full py-2.5 rounded-full bg-cream hover:bg-white text-deep text-xs font-body font-semibold border border-line hover:border-gold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gold" />
                    <span>Edit Investment &amp; Cover</span>
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
          <div className="bg-warm-white rounded-2xl border border-line max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-xl text-deep font-semibold">
                  Edit {editingSession.title}
                </h3>
                <span className="text-xs font-mono text-muted uppercase">
                  Slug: {editingSession.slug}
                </span>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="text-muted hover:text-deep"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Starting Investment (NGN)
                </label>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="e.g. 140000"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Standard Delivery Timeline
                </label>
                <input
                  type="text"
                  value={editDelivery}
                  onChange={(e) => setEditDelivery(e.target.value)}
                  placeholder="e.g. 7 to 10 working days"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  placeholder="https://... or /images/client/..."
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep mb-2"
                />

                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream hover:bg-white border border-line text-xs font-body font-semibold text-deep transition-all shadow-2xs hover:border-gold">
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5 text-gold" />
                  )}
                  <span>Upload New Cover</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </label>
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
                  className="px-5 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all"
                >
                  {isSaving ? "Saving to DB..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
