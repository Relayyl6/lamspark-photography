"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  Plus,
  Share2,
  Lock,
  Eye,
  Loader2,
  Tag,
  Filter,
  Check,
  Instagram,
  Linkedin,
  Smartphone,
} from "lucide-react";

interface ContentItem {
  id: string;
  platforms: string[];
  format: string;
  pillar: string;
  purpose: string;
  status: string;
  publish_at_by_platform: Record<string, string>;
  caption_by_platform: Record<string, string>;
  created_at: string;
}

export function ContentCalendar() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [formPlatform, setFormPlatform] = useState("Instagram");
  const [formFormat, setFormFormat] = useState("Carousel");
  const [formPillar, setFormPillar] = useState("Craft & Light");
  const [formTopic, setFormTopic] = useState("");
  const [formDate, setFormDate] = useState("Next Tuesday, 10:00 AM");
  const [formCaption, setFormCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadCalendar() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/calendar");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load calendar:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCalendar();
  }, []);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!formTopic.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formPlatform,
          format: formFormat,
          pillar: formPillar,
          topic: formTopic.trim(),
          scheduledDate: formDate.trim(),
          caption: formCaption.trim() || formTopic.trim(),
        }),
      });
      const data = await res.json();
      if (data.item) {
        setItems((prev) => [data.item, ...prev]);
        setStatusMessage(`Scheduled post for ${formPlatform}!`);
        setTimeout(() => setStatusMessage(null), 3000);
        setShowAddModal(false);
        setFormTopic("");
        setFormCaption("");
      }
    } catch (err) {
      console.error("Failed to schedule post:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (platformFilter === "All") return true;
    const plats = Array.isArray(item.platforms) ? item.platforms : [];
    return plats.some((p) => p.toLowerCase().includes(platformFilter.toLowerCase()));
  });

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Studio Editorial Queue &amp; Brand Storytelling
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Content Calendar
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Curate weekly social releases across Instagram, TikTok, WhatsApp Status, and LinkedIn with mandatory client privacy &amp; consent validation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-deep text-warm-white hover:bg-gold hover:text-deep text-xs font-body font-semibold transition-all shadow-editorial self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Schedule Post</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-warm-white p-4 rounded-2xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs font-body uppercase tracking-wider text-muted font-semibold mr-1">
            Platform:
          </span>
          {["All", "Instagram", "WhatsApp", "TikTok", "LinkedIn"].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all shrink-0 ${
                platformFilter.toLowerCase() === p.toLowerCase()
                  ? "bg-deep text-warm-white shadow-xs"
                  : "bg-cream text-brown hover:bg-warm-white border border-line"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-muted">
          {filteredItems.length} Scheduled Publications
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Loading studio editorial schedule...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-warm-white rounded-2xl border border-line">
          <Calendar className="w-10 h-10 text-gold mx-auto mb-3 opacity-60" />
          <h3 className="font-display text-2xl text-deep font-medium">Editorial Queue Empty</h3>
          <p className="font-body text-xs text-muted mt-1">
            Schedule a storytelling piece or behind-the-scenes post using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const plats = Array.isArray(item.platforms) ? item.platforms : [String(item.platforms)];
            const dateStr =
              item.publish_at_by_platform && typeof item.publish_at_by_platform === "object"
                ? Object.values(item.publish_at_by_platform)[0]
                : "Scheduled";

            return (
              <div
                key={item.id}
                className="bg-warm-white rounded-2xl border border-line p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header with Platforms & Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {plats.map((pl) => (
                        <span
                          key={pl}
                          className="font-mono text-[10px] font-bold uppercase bg-cream px-2 py-0.5 rounded border border-line text-brown"
                        >
                          {pl}
                        </span>
                      ))}
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                        item.status === "Published"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-gold/15 text-gold border border-gold/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-body text-[10px] uppercase tracking-wider text-gold font-bold block mb-0.5">
                      {item.pillar} · {item.format}
                    </span>
                    <h3 className="font-display text-lg text-deep font-semibold leading-snug">
                      {item.purpose}
                    </h3>
                  </div>
                </div>

                {/* Caption Snippet */}
                {item.caption_by_platform && (
                  <p className="text-xs font-body text-brown/80 bg-cream/50 p-3 rounded-xl border border-line/50 line-clamp-2">
                    &ldquo;{Object.values(item.caption_by_platform)[0]}&rdquo;
                  </p>
                )}

                {/* Privacy Consent Badge */}
                <div className="p-2.5 bg-cream/70 rounded-xl border border-line/60 flex items-center gap-2 text-xs font-body">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] text-brown font-medium">
                    Model Release &amp; Client Consent Verified
                  </span>
                </div>

                {/* Footer Logistics */}
                <div className="pt-2 border-t border-line flex items-center justify-between text-xs font-body text-muted">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>{dateStr}</span>
                  </div>
                  <span className="text-deep font-semibold text-[11px]">Maitama Studio</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-xl text-deep font-semibold">
                Schedule Brand Editorial Post
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-deep">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                    Platform
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp Status">WhatsApp Status</option>
                    <option value="TikTok">TikTok</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                    Format
                  </label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  >
                    <option value="Carousel">Carousel (Storytelling)</option>
                    <option value="Short Reel">Short Reel / Video</option>
                    <option value="Editorial Single">Editorial Master Portrait</option>
                    <option value="Text Reflection">Behind-the-Lens Article</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Editorial Pillar
                </label>
                <select
                  value={formPillar}
                  onChange={(e) => setFormPillar(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                >
                  <option value="Craft & Light">Craft &amp; Light (Natural Window Lighting)</option>
                  <option value="Purity & Pacing">Purity &amp; Pacing (Unhurried Toddlers)</option>
                  <option value="Cultural Heritage">Cultural Heritage (Aso-Oke &amp; Regal Grace)</option>
                  <option value="Executive Presence">Executive Presence (Abuja Leadership)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Topic &amp; Story Focus *
                </label>
                <input
                  type="text"
                  required
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="e.g. Why toddler sessions require playful pauses rather than stiff posing"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Proposed Caption
                </label>
                <textarea
                  rows={3}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="Draft caption in Osemene's unhurried voice..."
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Scheduled Time
                </label>
                <input
                  type="text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  placeholder="e.g. Next Tuesday, 10:00 AM"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-body text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all"
                >
                  {isSubmitting ? "Scheduling..." : "Add to Editorial Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
