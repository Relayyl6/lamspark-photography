"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  FolderOpen,
  Check,
  X,
  ExternalLink,
  Eye,
  Loader2,
  Sparkles,
  Tag,
  ChevronDown,
  Layers,
  Palette,
  ArrowRight,
} from "lucide-react";

interface Gallery {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  session_type: string | null;
  cover_asset_id: string | null;
  item_count: number;
  created_at: string;
}

interface Asset {
  id: string;
  storage_key: string;
  kind: string;
  session_type: string | null;
  alt_text: string | null;
  created_at: string;
  gallery_item_id?: string;
  caption?: string;
}

interface EventType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badgeColor: string;
  displayOrder: number;
  galleryCount?: number;
  photoCount?: number;
}

const PRESET_COLORS = [
  "#B8893A", // Gold / Brass
  "#C59B27", // Warm Amber
  "#8E6D3B", // Deep Bronze
  "#A65B32", // Terracotta
  "#5A6577", // Slate Steel
  "#2F5C45", // Deep Pine
  "#934A5F", // Mulberry
  "#C98A7D", // Rose Blush
  "#5B8E7D", // Sage Green
  "#7A6855", // Basalt Earth
  "#3B5249", // Forest Green
  "#1C2C22", // Atelier Noir
];

export function GalleryManager() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [galleryAssets, setGalleryAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Dynamic Event Types State
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [eventTypeForm, setEventTypeForm] = useState({
    name: "",
    slug: "",
    description: "",
    badgeColor: "#B8893A",
    displayOrder: 99,
  });
  const [isSavingEventType, setIsSavingEventType] = useState(false);
  const [quickChangeTypeGalleryId, setQuickChangeTypeGalleryId] = useState<string | null>(null);

  // Gallery Modal
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    slug: "",
    description: "",
    sessionType: "official-portrait",
    coverImage: "",
  });

  // Photo Edit Modal
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetAltText, setAssetAltText] = useState("");

  // Load Event Types
  async function loadEventTypes() {
    try {
      const res = await fetch("/api/admin/event-types");
      const data = await res.json();
      if (data.success && Array.isArray(data.eventTypes)) {
        setEventTypes(data.eventTypes);
      }
    } catch (err) {
      console.error("Failed to load event types:", err);
    }
  }

  // Load galleries
  async function loadGalleries() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (data.galleries) {
        setGalleries(data.galleries);
        if (!selectedGallery && data.galleries.length > 0) {
          selectGallery(data.galleries[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load galleries:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Load assets for a specific gallery
  async function selectGallery(gallery: Gallery) {
    setSelectedGallery(gallery);
    try {
      const res = await fetch(`/api/admin/assets?galleryId=${gallery.id}`);
      const data = await res.json();
      if (data.assets) {
        setGalleryAssets(data.assets);
      }
    } catch (err) {
      console.error("Failed to load gallery assets:", err);
    }
  }

  useEffect(() => {
    loadGalleries();
    loadEventTypes();
  }, []);

  // Quick Change Gallery Type (Inline from card or inspector)
  async function handleQuickChangeType(galleryId: string, newSessionType: string) {
    try {
      const res = await fetch(`/api/admin/gallery/${galleryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType: newSessionType, cascadeToAssets: true }),
      });
      const data = await res.json();
      if (data.gallery) {
        setGalleries((prev) =>
          prev.map((g) => (g.id === galleryId ? { ...g, session_type: newSessionType } : g))
        );
        if (selectedGallery?.id === galleryId) {
          setSelectedGallery((prev) => (prev ? { ...prev, session_type: newSessionType } : null));
        }
        setQuickChangeTypeGalleryId(null);
        loadEventTypes(); // Update live counters
      }
    } catch (err) {
      console.error("Failed to quick change gallery type:", err);
    }
  }

  // Save or Create Event Type
  async function handleSaveEventType(e: React.FormEvent) {
    e.preventDefault();
    if (!eventTypeForm.name.trim()) return;

    setIsSavingEventType(true);
    try {
      if (editingEventType) {
        // Update
        const res = await fetch(`/api/admin/event-types/${editingEventType.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventTypeForm),
        });
        const data = await res.json();
        if (data.success && data.eventType) {
          setEventTypes((prev) =>
            prev.map((t) => (t.id === editingEventType.id ? { ...t, ...data.eventType } : t))
          );
          setEditingEventType(null);
          loadGalleries(); // in case slug cascaded
        }
      } else {
        // Create
        const res = await fetch("/api/admin/event-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventTypeForm),
        });
        const data = await res.json();
        if (data.success && data.eventType) {
          setEventTypes((prev) => [...prev, data.eventType]);
          // Also set as active selection in gallery form if opened from there
          setGalleryForm((prev) => ({ ...prev, sessionType: data.eventType.slug }));
        }
      }

      setEventTypeForm({
        name: "",
        slug: "",
        description: "",
        badgeColor: "#B8893A",
        displayOrder: 99,
      });
      setEditingEventType(null);
    } catch (err) {
      console.error("Failed to save event type:", err);
    } finally {
      setIsSavingEventType(false);
    }
  }

  // Delete Event Type
  async function handleDeleteEventType(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete event type "${name}"? Linked galleries will be unlinked to "general".`)) return;

    try {
      const res = await fetch(`/api/admin/event-types/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEventTypes((prev) => prev.filter((t) => t.id !== id));
        loadGalleries();
      }
    } catch (err) {
      console.error("Failed to delete event type:", err);
    }
  }

  // Save or Create Gallery
  async function handleSaveGallery(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingGallery) {
        // Update
        const res = await fetch(`/api/admin/gallery/${editingGallery.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: galleryForm.title,
            slug: galleryForm.slug,
            description: galleryForm.description,
            coverImage: galleryForm.coverImage,
            sessionType: galleryForm.sessionType,
            cascadeToAssets: true,
          }),
        });
        const data = await res.json();
        if (data.gallery) {
          setGalleries((prev) =>
            prev.map((g) => (g.id === editingGallery.id ? { ...g, ...data.gallery } : g))
          );
          if (selectedGallery?.id === editingGallery.id) {
            setSelectedGallery((prev) => (prev ? { ...prev, ...data.gallery } : null));
          }
          loadEventTypes();
        }
      } else {
        // Create
        const res = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: galleryForm.title,
            slug: galleryForm.slug,
            description: galleryForm.description,
            sessionType: galleryForm.sessionType,
            coverImage: galleryForm.coverImage,
          }),
        });
        const data = await res.json();
        if (data.gallery) {
          setGalleries((prev) => [data.gallery, ...prev]);
          selectGallery(data.gallery);
          loadEventTypes();
        }
      }
      setShowGalleryModal(false);
      setEditingGallery(null);
      setGalleryForm({
        title: "",
        slug: "",
        description: "",
        sessionType: eventTypes[0]?.slug || "official-portrait",
        coverImage: "",
      });
    } catch (err) {
      console.error("Failed to save gallery:", err);
    }
  }

  // Delete Gallery
  async function handleDeleteGallery(id: string) {
    if (!confirm("Are you sure you want to delete this gallery? This will unlink photos from it.")) return;
    try {
      await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      setGalleries((prev) => prev.filter((g) => g.id !== id));
      if (selectedGallery?.id === id) {
        setSelectedGallery(null);
        setGalleryAssets([]);
      }
      loadEventTypes();
    } catch (err) {
      console.error("Failed to delete gallery:", err);
    }
  }

  // Direct Photo Upload to Selected Gallery
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedGallery) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${files.length} photo(s)...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("partition", "public");
        formData.append("sessionType", selectedGallery.session_type || "general");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (uploadData.success) {
          const assetRes = await fetch("/api/admin/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storageKey: uploadData.url || uploadData.storageKey,
              storageBucket: "portfolio-assets",
              kind: "photo",
              sessionType: selectedGallery.session_type,
              altText: file.name.replace(/\.[^/.]+$/, ""),
              galleryId: selectedGallery.id,
              consentStatus: "portfolio",
            }),
          });
          const assetData = await assetRes.json();
          if (assetData.asset) {
            setGalleryAssets((prev) => [assetData.asset, ...prev]);
          }
        }
      }
      setUploadProgress("Upload complete!");
      setTimeout(() => setUploadProgress(null), 2500);
      loadGalleries();
      loadEventTypes();
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadProgress("Upload failed. Please check network/files.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  // Delete photo
  async function handleDeleteAsset(assetId: string) {
    if (!confirm("Remove this photo from the gallery and site?")) return;
    try {
      await fetch(`/api/admin/assets/${assetId}`, { method: "DELETE" });
      setGalleryAssets((prev) => prev.filter((a) => a.id !== assetId));
      loadGalleries();
      loadEventTypes();
    } catch (err) {
      console.error("Failed to delete asset:", err);
    }
  }

  // Update photo alt/caption
  async function handleSaveAssetAlt() {
    if (!editingAsset) return;
    try {
      await fetch(`/api/admin/assets/${editingAsset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: assetAltText }),
      });
      setGalleryAssets((prev) =>
        prev.map((a) => (a.id === editingAsset.id ? { ...a, alt_text: assetAltText } : a))
      );
      setEditingAsset(null);
    } catch (err) {
      console.error("Failed to update photo alt text:", err);
    }
  }

  // Helper to get event type object
  function getEventTypeMeta(sessionType: string | null) {
    const found = eventTypes.find((et) => et.slug === sessionType);
    if (found) return found;
    return {
      name: sessionType ? sessionType.replace(/-/g, " ") : "General Collection",
      badgeColor: "#B8893A",
      slug: sessionType || "general",
    };
  }

  return (
    <div className="space-y-8 select-none">
      {/* Studio Top Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Media Studio · Single Source of Truth
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Visual Archives &amp; Event Types Manager
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Create distinct event galleries, manage picture event types, change classifications, and upload high-res client captures.
          </p>
        </div>

        {/* Dual Primary Actions: Event Types Manager & Create Gallery */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Manage Event Types Button */}
          <button
            type="button"
            onClick={() => {
              setEditingEventType(null);
              setEventTypeForm({
                name: "",
                slug: "",
                description: "",
                badgeColor: "#B8893A",
                displayOrder: eventTypes.length + 1,
              });
              setShowEventTypeModal(true);
            }}
            className="inline-flex items-center gap-2 bg-warm-white hover:bg-cream text-deep border border-gold/40 hover:border-gold font-body text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-full shadow-sm transition-all"
            title="Configure and perform CRUD on Event Types"
          >
            <Tag className="w-3.5 h-3.5 text-gold" />
            <span>Event Types ({eventTypes.length})</span>
          </button>

          {/* Create Gallery Button */}
          <button
            type="button"
            onClick={() => {
              setEditingGallery(null);
              setGalleryForm({
                title: "",
                slug: "",
                description: "",
                sessionType: eventTypes[0]?.slug || "official-portrait",
                coverImage: "",
              });
              setShowGalleryModal(true);
            }}
            className="inline-flex items-center gap-2 bg-deep hover:bg-gold hover:text-deep text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-full transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Gallery</span>
          </button>
        </div>
      </div>

      {/* Gallery Selector Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs font-body text-muted">
          <span>All Seeded &amp; Distinct Event Galleries ({galleries.length})</span>
          <span className="text-[11px]">Click a card to inspect or change event type</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {galleries.map((gal) => {
            const isSelected = selectedGallery?.id === gal.id;
            const meta = getEventTypeMeta(gal.session_type);
            const isQuickChangeOpen = quickChangeTypeGalleryId === gal.id;

            return (
              <div
                key={gal.id}
                onClick={() => selectGallery(gal)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? "bg-warm-white border-gold shadow-md ring-2 ring-gold/25"
                    : "bg-cream/40 border-line hover:bg-warm-white hover:border-gold/50"
                }`}
              >
                <div>
                  {/* Category Pill with Quick Change Trigger */}
                  <div className="relative mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickChangeTypeGalleryId(isQuickChangeOpen ? null : gal.id);
                      }}
                      className="font-body text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 max-w-full truncate"
                      style={{
                        backgroundColor: `${meta.badgeColor}15`,
                        borderColor: `${meta.badgeColor}40`,
                        color: meta.badgeColor,
                      }}
                      title="Click to quickly reclassify event type"
                    >
                      <span className="truncate">{meta.name}</span>
                      <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-70" />
                    </button>

                    {/* Quick Change Dropdown Popup */}
                    {isQuickChangeOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 top-full mt-1 z-30 bg-warm-white border border-line rounded-xl shadow-2xl p-2 w-56 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider border-b border-line">
                          Change Event Type
                        </div>
                        <div className="max-h-48 overflow-y-auto no-scrollbar py-1">
                          {eventTypes.map((et) => (
                            <button
                              key={et.id}
                              type="button"
                              onClick={() => handleQuickChangeType(gal.id, et.slug)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-body flex items-center justify-between hover:bg-cream transition-colors ${
                                gal.session_type === et.slug ? "font-bold text-deep bg-cream/70" : "text-brown"
                              }`}
                            >
                              <span className="truncate">{et.name}</span>
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: et.badgeColor }}
                              />
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickChangeTypeGalleryId(null);
                            setShowEventTypeModal(true);
                          }}
                          className="w-full text-center text-[11px] text-gold font-semibold py-1 border-t border-line hover:underline"
                        >
                          + Add New Event Type
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 className="font-display text-sm font-semibold text-deep line-clamp-2 leading-snug" title={gal.title}>
                    {gal.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-muted mt-1.5">
                    <span>{gal.item_count ?? 0} photographs</span>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-2.5 flex items-center justify-between border-t border-line/60 mt-3">
                  <span className="text-[10px] font-mono text-muted/80 truncate max-w-[100px]">
                    /{gal.slug}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGallery(gal);
                        setGalleryForm({
                          title: gal.title,
                          slug: gal.slug,
                          description: gal.description || "",
                          sessionType: gal.session_type || eventTypes[0]?.slug || "official-portrait",
                          coverImage: gal.cover_asset_id || "",
                        });
                        setShowGalleryModal(true);
                      }}
                      className="text-muted hover:text-deep p-1.5 rounded-lg hover:bg-cream transition-colors"
                      title="Edit Gallery Metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGallery(gal.id);
                      }}
                      className="text-muted hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Gallery"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Gallery Management Stage */}
      {selectedGallery && (
        <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-line">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-display text-2xl sm:text-3xl text-deep font-semibold">
                  {selectedGallery.title}
                </h2>
                <span className="text-xs font-mono text-muted bg-cream px-2 py-0.5 rounded border border-line">
                  slug: /{selectedGallery.slug}
                </span>

                {/* Inline Event Type Reclassifier Pill */}
                {(() => {
                  const currentMeta = getEventTypeMeta(selectedGallery.session_type);
                  return (
                    <div className="relative inline-block">
                      <select
                        value={selectedGallery.session_type || "general"}
                        onChange={(e) => handleQuickChangeType(selectedGallery.id, e.target.value)}
                        className="font-body text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-all appearance-none pr-6"
                        style={{
                          backgroundColor: `${currentMeta.badgeColor}15`,
                          borderColor: `${currentMeta.badgeColor}50`,
                          color: currentMeta.badgeColor,
                        }}
                        title="Change Event Type for this gallery"
                      >
                        {eventTypes.map((et) => (
                          <option key={et.id} value={et.slug}>
                            Type: {et.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: currentMeta.badgeColor }}
                      />
                    </div>
                  );
                })()}
              </div>

              {selectedGallery.description && (
                <p className="font-body text-xs sm:text-sm text-muted mt-1 max-w-2xl leading-relaxed">
                  {selectedGallery.description}
                </p>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex items-center gap-3 shrink-0">
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-deep hover:bg-gold hover:text-deep text-warm-white text-xs font-body font-semibold cursor-pointer transition-all shadow-sm active:scale-95">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Uploading progress notification */}
          {uploadProgress && (
            <div className="p-3 bg-cream rounded-xl border border-line flex items-center gap-3 text-xs font-body text-deep animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
              <span>{uploadProgress}</span>
            </div>
          )}

          {/* Gallery Assets Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-body text-xs font-semibold uppercase tracking-wider text-muted">
                Photographs in this Event ({galleryAssets.length})
              </span>
              <span className="text-[11px] text-muted font-body">
                Stored in Neon Lakebase Storage · Synced Live to /portfolio
              </span>
            </div>

            {galleryAssets.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed border-line rounded-xl bg-cream/30">
                <FolderOpen className="w-10 h-10 text-muted mx-auto mb-3 stroke-[1.2]" />
                <h4 className="font-display text-lg text-deep mb-1">No photographs linked yet</h4>
                <p className="font-body text-xs text-muted max-w-sm mx-auto mb-4">
                  Upload photographs directly above to publish them to this distinct event gallery.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {galleryAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-cream border border-line shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={asset.storage_key}
                      alt={asset.alt_text || "Gallery Photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Photo Action Overlay on Hover */}
                    <div className="absolute inset-0 bg-deep/80 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-warm-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-gold truncate max-w-[80px]">
                          {asset.session_type || "general"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-body line-clamp-2 leading-tight">
                          {asset.alt_text || "No caption"}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAsset(asset);
                            setAssetAltText(asset.alt_text || "");
                          }}
                          className="w-full py-1 text-center bg-white/20 hover:bg-gold hover:text-deep rounded text-[10px] font-semibold transition-colors"
                        >
                          Edit Caption
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EVENT TYPES & CATEGORIES MANAGER (FULL CRUD OPS)                 */}
      {/* ========================================================================= */}
      {showEventTypeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-3xl border border-line max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-line shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-deep font-semibold">
                    Picture Event Types &amp; Categories
                  </h3>
                  <p className="font-body text-xs text-muted">
                    Manage the classifications assigned to event galleries and client photographs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEventTypeModal(false);
                  setEditingEventType(null);
                }}
                className="w-8 h-8 rounded-full border border-line hover:bg-cream flex items-center justify-center text-muted hover:text-deep"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body: Create/Edit Form + Event Types List */}
            <div className="overflow-y-auto no-scrollbar py-4 space-y-6 flex-1">
              {/* Form: Add or Edit Event Type */}
              <form onSubmit={handleSaveEventType} className="bg-cream/50 p-4 rounded-2xl border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs font-semibold uppercase tracking-wider text-deep">
                    {editingEventType ? `Edit Event Type: ${editingEventType.name}` : "+ Add New Picture Event Type"}
                  </span>
                  {editingEventType && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventType(null);
                        setEventTypeForm({
                          name: "",
                          slug: "",
                          description: "",
                          badgeColor: "#B8893A",
                          displayOrder: eventTypes.length + 1,
                        });
                      }}
                      className="text-xs text-muted hover:text-deep underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                      Event Type Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={eventTypeForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                        setEventTypeForm((prev) => ({
                          ...prev,
                          name,
                          slug: editingEventType ? prev.slug : slug,
                        }));
                      }}
                      placeholder="e.g. Fashion Runway"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-warm-white text-xs font-body text-deep"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                      Slug (identifier)
                    </label>
                    <input
                      type="text"
                      value={eventTypeForm.slug}
                      onChange={(e) => setEventTypeForm({ ...eventTypeForm, slug: e.target.value })}
                      placeholder="e.g. fashion-runway"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-warm-white text-xs font-body text-deep"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={eventTypeForm.description}
                    onChange={(e) => setEventTypeForm({ ...eventTypeForm, description: e.target.value })}
                    placeholder="Short summary of this picture event style..."
                    className="w-full px-3 py-2 rounded-lg border border-line bg-warm-white text-xs font-body text-deep"
                  />
                </div>

                {/* Color Swatch Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1.5">
                    Badge Color Swatch
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setEventTypeForm({ ...eventTypeForm, badgeColor: hex })}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          eventTypeForm.badgeColor === hex ? "border-deep scale-125 shadow-sm" : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-[10px] font-mono text-muted">Custom:</span>
                      <input
                        type="color"
                        value={eventTypeForm.badgeColor}
                        onChange={(e) => setEventTypeForm({ ...eventTypeForm, badgeColor: e.target.value })}
                        className="w-6 h-6 rounded border border-line cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingEventType}
                    className="inline-flex items-center gap-1.5 bg-deep hover:bg-gold hover:text-deep text-warm-white font-body text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isSavingEventType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{editingEventType ? "Update Event Type" : "Create Event Type"}</span>
                  </button>
                </div>
              </form>

              {/* Event Types Table */}
              <div>
                <span className="font-body text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
                  Existing Event Types ({eventTypes.length})
                </span>

                <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-warm-white">
                  {eventTypes.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-cream/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: t.badgeColor }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-semibold text-deep truncate">
                              {t.name}
                            </span>
                            <span className="font-mono text-[10px] text-muted bg-cream px-1.5 py-0.5 rounded border border-line/60">
                              /{t.slug}
                            </span>
                          </div>
                          {t.description && (
                            <p className="font-body text-xs text-muted truncate max-w-sm mt-0.5">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats & Action Buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline-flex text-[11px] font-mono text-muted">
                          {t.galleryCount ?? 0} galleries · {t.photoCount ?? 0} photos
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventType(t);
                              setEventTypeForm({
                                name: t.name,
                                slug: t.slug,
                                description: t.description || "",
                                badgeColor: t.badgeColor || "#B8893A",
                                displayOrder: t.displayOrder || 99,
                              });
                            }}
                            className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-cream"
                            title="Edit this event type"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEventType(t.id, t.name)}
                            className="p-1.5 text-muted hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete this event type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-line flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowEventTypeModal(false);
                  setEditingEventType(null);
                }}
                className="px-5 py-2 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT GALLERY (WITH DYNAMIC EVENT TYPE SELECTOR)         */}
      {/* ========================================================================= */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-3xl border border-line max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl text-deep font-semibold mb-4">
              {editingGallery ? `Edit Gallery: ${editingGallery.title}` : "+ Create New Event Gallery"}
            </h3>

            <form onSubmit={handleSaveGallery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Gallery / Event Title *
                </label>
                <input
                  required
                  type="text"
                  value={galleryForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    setGalleryForm((prev) => ({
                      ...prev,
                      title,
                      slug: editingGallery ? prev.slug : slug,
                    }));
                  }}
                  placeholder="e.g. Woodhall MOU & Bilateral Accord"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                    Slug (URL identifier) *
                  </label>
                  <input
                    required
                    type="text"
                    value={galleryForm.slug}
                    onChange={(e) => setGalleryForm({ ...galleryForm, slug: e.target.value })}
                    placeholder="e.g. woodhall-mou"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-deep uppercase tracking-wider">
                      Event Type *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEventTypeModal(true)}
                      className="text-[10px] text-gold font-bold hover:underline"
                    >
                      + New Type
                    </button>
                  </div>
                  <select
                    value={galleryForm.sessionType}
                    onChange={(e) => setGalleryForm({ ...galleryForm, sessionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  >
                    {eventTypes.map((et) => (
                      <option key={et.id} value={et.slug}>
                        {et.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={galleryForm.description}
                  onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                  placeholder="Short editorial summary of this event series..."
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Cover Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={galleryForm.coverImage}
                  onChange={(e) => setGalleryForm({ ...galleryForm, coverImage: e.target.value })}
                  placeholder="https://... or /images/client/corporate_1.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>

              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGalleryModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-body text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm"
                >
                  Save Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT PHOTO DETAILS                                              */}
      {/* ========================================================================= */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-lg text-deep font-semibold mb-3">Edit Photo Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Title / Caption
                </label>
                <input
                  type="text"
                  value={assetAltText}
                  onChange={(e) => setAssetAltText(e.target.value)}
                  placeholder="e.g. Groom looking at Bride"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setEditingAsset(null)}
                  className="px-3 py-1.5 text-xs text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssetAlt}
                  className="px-4 py-1.5 rounded-lg bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
