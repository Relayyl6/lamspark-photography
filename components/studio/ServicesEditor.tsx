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
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
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
    <div className="space-y-6 animate-in fade-in duration-200">
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
          <div className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Loading live session configurations...</span>
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

                  <div className="pt-3 border-t border-line/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted font-body">Starting Rate:</span>
                      <span className="font-display text-base font-semibold text-deep">
                        {currentPrice !== null ? `₦${currentPrice.toLocaleString()}` : "Bespoke Quote"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted font-body">Delivery Timeline:</span>
                      <span className="font-mono text-xs text-deep">
                        {currentDelivery}
                      </span>
                    </div>
                  </div>

                  {/* Edit Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenEdit(session)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-line bg-cream/50 hover:bg-gold hover:text-deep hover:border-gold text-deep text-xs font-body font-semibold transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Price &amp; Cover</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="font-body text-[10px] uppercase tracking-wider text-gold font-bold block">
                  Service Configuration
                </span>
                <h3 className="font-display text-xl text-deep font-semibold">
                  {editingSession.title}
                </h3>
              </div>
              <button onClick={() => setEditingSession(null)} className="text-muted hover:text-deep">✕</button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4">
              {/* Price Field */}
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Starting Investment Rate (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-muted text-xs">₦</span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-line bg-cream/40 text-sm font-mono text-deep"
                  />
                </div>
                <span className="text-[11px] text-muted font-body mt-1 block">
                  * Note: Price is used for personal estimate calculation and studio reference.
                </span>
              </div>

              {/* Cover Image Field + Upload Button */}
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editCover}
                    onChange={(e) => setEditCover(e.target.value)}
                    placeholder="https://... or /images/client/weddings_1.jpg"
                    className="flex-1 px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-mono text-deep"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-deep text-warm-white hover:bg-gold hover:text-deep text-xs font-body font-semibold cursor-pointer shrink-0 transition-all">
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              {/* Delivery Days Field */}
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Delivery Timeline Text
                </label>
                <input
                  type="text"
                  value={editDelivery}
                  onChange={(e) => setEditDelivery(e.target.value)}
                  placeholder="e.g. 7 to 10 business days"
                  className="w-full px-3 py-2.5 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              {/* Actions */}
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
                  className="px-5 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? "Saving..." : "Save to Database"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
