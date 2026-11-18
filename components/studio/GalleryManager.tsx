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

export function GalleryManager() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [galleryAssets, setGalleryAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Gallery Modal
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    slug: "",
    description: "",
    sessionType: "studio",
    coverImage: "",
  });

  // Photo Edit Modal
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetAltText, setAssetAltText] = useState("");

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
  }, []);

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
            description: galleryForm.description,
            coverImage: galleryForm.coverImage,
            sessionType: galleryForm.sessionType,
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
        }
      }
      setShowGalleryModal(false);
      setEditingGallery(null);
      setGalleryForm({ title: "", slug: "", description: "", sessionType: "studio", coverImage: "" });
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
          // Link asset to gallery in Neon DB
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
      console.error("Failed to update asset:", err);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Media Studio · Single Source of Truth
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Visual Archives &amp; Gallery Manager
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Create, update, upload, and organize live photo galleries displayed across the public site.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGallery(null);
            setGalleryForm({ title: "", slug: "", description: "", sessionType: "studio", coverImage: "" });
            setShowGalleryModal(true);
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-deep hover:bg-gold hover:text-deep text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-full transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Gallery</span>
        </button>
      </div>

      {/* Gallery Selector Pills / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {galleries.map((gal) => {
          const isSelected = selectedGallery?.id === gal.id;
          return (
            <div
              key={gal.id}
              onClick={() => selectGallery(gal)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isSelected
                  ? "bg-warm-white border-gold shadow-md ring-2 ring-gold/20"
                  : "bg-cream/40 border-line hover:bg-warm-white"
              }`}
            >
              <div>
                <span className="font-body text-[9px] uppercase tracking-wider text-gold font-bold block mb-1">
                  {gal.session_type || "Collection"}
                </span>
                <h4 className="font-display text-sm font-semibold text-deep line-clamp-1">
                  {gal.title}
                </h4>
                <span className="text-[11px] font-mono text-muted">
                  {gal.item_count ?? 0} photos
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-line/60 mt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGallery(gal);
                    setGalleryForm({
                      title: gal.title,
                      slug: gal.slug,
                      description: gal.description || "",
                      sessionType: gal.session_type || "studio",
                      coverImage: gal.cover_asset_id || "",
                    });
                    setShowGalleryModal(true);
                  }}
                  className="text-muted hover:text-deep p-1 rounded"
                  title="Edit Gallery Details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGallery(gal.id);
                  }}
                  className="text-muted hover:text-red-600 p-1 rounded"
                  title="Delete Gallery"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Gallery Management Stage */}
      {selectedGallery && (
        <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="font-display text-2xl text-deep font-semibold">
                  {selectedGallery.title}
                </h2>
                <span className="text-xs font-mono text-muted bg-cream px-2 py-0.5 rounded border border-line">
                  slug: /{selectedGallery.slug}
                </span>
              </div>
              {selectedGallery.description && (
                <p className="font-body text-xs text-muted mt-1">
                  {selectedGallery.description}
                </p>
              )}
            </div>

            {/* Upload Button */}
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-deep hover:bg-gold hover:text-deep text-warm-white text-xs font-body font-semibold cursor-pointer transition-all shadow-sm">
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

          {/* Upload Progress Message */}
          {uploadProgress && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-body flex items-center gap-2 animate-in fade-in">
              {isUploading && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
              <span>{uploadProgress}</span>
            </div>
          )}

          {/* Photo Grid */}
          {galleryAssets.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-line rounded-2xl space-y-3">
              <ImageIcon className="w-10 h-10 text-muted mx-auto" />
              <p className="font-body text-sm text-muted">
                No photos in this gallery yet. Click <strong>Upload Photos</strong> above to add client imagery.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {galleryAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-xl overflow-hidden border border-line bg-cream/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-[4/5] relative overflow-hidden bg-cream">
                    <img
                      src={asset.storage_key}
                      alt={asset.alt_text || "Photo"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => {
                          setEditingAsset(asset);
                          setAssetAltText(asset.alt_text || "");
                        }}
                        className="p-2 rounded-full bg-white/90 text-deep hover:bg-white transition-colors"
                        title="Edit Title / Alt Text"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 text-[11px] font-body bg-warm-white flex items-center justify-between">
                    <span className="truncate text-deep font-medium" title={asset.alt_text || "Untitled"}>
                      {asset.alt_text || "Untitled"}
                    </span>
                    <a
                      href={asset.storage_key}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-gold"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gallery Modal (Create / Edit) */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-line pb-3">
              <h3 className="font-display text-xl text-deep font-semibold">
                {editingGallery ? "Edit Gallery Details" : "Create New Gallery"}
              </h3>
              <button onClick={() => setShowGalleryModal(false)} className="text-muted hover:text-deep">✕</button>
            </div>

            <form onSubmit={handleSaveGallery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Gallery Title *
                </label>
                <input
                  required
                  type="text"
                  value={galleryForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    setGalleryForm((prev) => ({
                      ...prev,
                      title,
                      slug: editingGallery ? prev.slug : slug,
                    }));
                  }}
                  placeholder="e.g. Sacred Unions"
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
                    placeholder="e.g. sacred-unions"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                    Session Category
                  </label>
                  <select
                    value={galleryForm.sessionType}
                    onChange={(e) => setGalleryForm({ ...galleryForm, sessionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/40 text-xs font-body text-deep"
                  >
                    <option value="weddings">Weddings</option>
                    <option value="corporate">Corporate / Executive</option>
                    <option value="events">Events & Galas</option>
                    <option value="portraits">Studio Portraits</option>
                    <option value="toddler">Toddler & Children</option>
                    <option value="maternity">Maternity</option>
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
                  placeholder="Short editorial summary of this series..."
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
                  placeholder="https://... or /images/client/weddings_1.jpg"
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
                  className="px-5 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all"
                >
                  Save Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Photo Alt Modal */}
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
