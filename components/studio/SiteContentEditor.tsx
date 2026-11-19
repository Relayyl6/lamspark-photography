"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Save,
  Check,
  Loader2,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Quote,
  Plus,
  Trash2,
  Layers,
  Image as ImageIcon,
  HelpCircle,
  BarChart3,
  Camera,
  BookOpen,
  UploadCloud,
} from "lucide-react";

interface ContentField {
  key: string;
  label: string;
  section: string;
  description: string;
  defaultValue: string;
  isTextarea?: boolean;
}

const CONTENT_SCHEMA: ContentField[] = [
  {
    key: "hero_kicker",
    label: "Hero Eyebrow Kicker",
    section: "Homepage Hero",
    description: "Red accent banner text above master headline",
    defaultValue: "I CAPTURE · YOU REMEMBER",
  },
  {
    key: "hero_headline",
    label: "Master Display Headline",
    section: "Homepage Hero",
    description: "Main bold title on homepage (use period to split lines)",
    defaultValue: "REAL MOMENTS. BEAUTIFUL MEMORIES",
  },
  {
    key: "hero_subtitle",
    label: "Hero Subtitle Description",
    section: "Homepage Hero",
    description: "Short introductory editorial statement under title",
    defaultValue: "I capture real emotions and raw moments that tell your story in the most authentic and timeless way.",
    isTextarea: true,
  },
  {
    key: "about_quote",
    label: "Osemene's Signature Philosophy Quote",
    section: "About & Philosophy",
    description: "Featured quote displayed across About and Atelier pages",
    defaultValue: "I believe the most extraordinary moments are usually the quietest ones.",
    isTextarea: true,
  },
  {
    key: "studio_hours",
    label: "Studio Working Hours",
    section: "Contact & Studio Suite",
    description: "Operating schedule (West Africa Time, WAT = UTC+1)",
    defaultValue: "09:00 – 18:00 WAT · Monday through Saturday",
  },
  {
    key: "studio_address",
    label: "Studio Suite Address",
    section: "Contact & Studio Suite",
    description: "Private atelier location in Maitama",
    defaultValue: "Maitama Studio Suite, Maitama District, Abuja, Federal Capital Territory, Nigeria",
  },
  {
    key: "concierge_phone_primary",
    label: "Concierge Primary Phone",
    section: "Direct Communication",
    description: "Primary telephone line",
    defaultValue: "+234 813 084 7299",
  },
  {
    key: "concierge_phone_secondary",
    label: "Concierge Secondary Phone",
    section: "Direct Communication",
    description: "Secondary studio direct line",
    defaultValue: "+234 813 084 7299",
  },
  {
    key: "concierge_whatsapp",
    label: "WhatsApp Direct Number (E.164)",
    section: "Direct Communication",
    description: "Number formatted without + for WhatsApp wa.me links",
    defaultValue: "2348130847299",
  },
  {
    key: "concierge_email",
    label: "Concierge Email Address",
    section: "Direct Communication",
    description: "Official studio inquiry email",
    defaultValue: "concierge@lamsparks.com",
  },
];

type SubTab = "general" | "wheel" | "testimonials" | "stories" | "faqs" | "stats" | "perspectives";

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partition", "public");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.url || data.storageKey;
      if (uploadedUrl) {
        onChange(uploadedUrl);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Failed to upload: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <label className="text-[10px] uppercase text-muted font-semibold block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/... or https://..."
          className="flex-1 px-2.5 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-mono text-deep outline-none focus:border-gold"
        />
        <label className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream hover:bg-gold/20 border border-line text-xs font-body font-semibold text-deep transition-all shadow-2xs hover:border-gold">
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5 text-gold" />
          )}
          <span>{isUploading ? "Uploading..." : "Upload"}</span>
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

export function SiteContentEditor() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("general");
  const [contentValues, setContentValues] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  // Dynamic Array Collections
  const [wheelCards, setWheelCards] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [perspectives, setPerspectives] = useState<any[]>([]);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/content");
        const data = await res.json();
        if (data.content) {
          setContentValues(data.content);
          if (Array.isArray(data.content.hero_wheel_cards)) setWheelCards(data.content.hero_wheel_cards);
          if (Array.isArray(data.content.site_testimonials)) setTestimonials(data.content.site_testimonials);
          if (Array.isArray(data.content.site_stories)) setStories(data.content.site_stories);
          if (Array.isArray(data.content.site_faqs)) setFaqs(data.content.site_faqs);
          if (Array.isArray(data.content.about_stats)) setStats(data.content.about_stats);
          if (Array.isArray(data.content.camera_perspectives)) setPerspectives(data.content.camera_perspectives);
        }
      } catch (err) {
        console.error("Failed to load content:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadContent();
  }, []);

  async function saveItem(key: string, value: any) {
    setSavingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedKeys((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setSavedKeys((prev) => ({ ...prev, [key]: false }));
        }, 2500);
      }
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
    } finally {
      setSavingKeys((prev) => ({ ...prev, [key]: false }));
    }
  }

  const sections = Array.from(new Set(CONTENT_SCHEMA.map((f) => f.section)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
          Website CMS · Neon PostgreSQL
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
          Site Content &amp; Copy Single Source of Truth
        </h1>
        <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
          Everything written here persists to Neon DB and directly controls the public website. Zero hardcoded mock data.
        </p>
      </div>

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-line text-xs font-body font-semibold">
        {[
          { id: "general", label: "General Copy & Info", icon: FileText },
          { id: "wheel", label: "Hero 3D Wheel", icon: Layers },
          { id: "testimonials", label: "Testimonials & Reviews", icon: Quote },
          { id: "stories", label: "Session Stories", icon: BookOpen },
          { id: "faqs", label: "FAQs", icon: HelpCircle },
          { id: "stats", label: "About Stats", icon: BarChart3 },
          { id: "perspectives", label: "Camera Perspectives", icon: Camera },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-deep text-warm-white shadow-sm"
                  : "bg-warm-white text-deep/70 hover:bg-cream hover:text-deep border border-line/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Loading live content blobs from Neon...</span>
        </div>
      ) : (
        <div>
          {/* TAB 1: General Copy */}
          {activeSubTab === "general" && (
            <div className="space-y-8">
              {sections.map((sec) => (
                <div
                  key={sec}
                  className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-5"
                >
                  <div className="border-b border-line pb-3">
                    <h3 className="font-display text-xl text-deep font-semibold">
                      {sec}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {CONTENT_SCHEMA.filter((f) => f.section === sec).map((field) => {
                      const isSaving = savingKeys[field.key];
                      const isSaved = savedKeys[field.key];
                      const currentVal = contentValues[field.key] ?? field.defaultValue;

                      return (
                        <div
                          key={field.key}
                          className={field.isTextarea ? "md:col-span-2 space-y-2" : "space-y-2"}
                        >
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-deep uppercase tracking-wider">
                              {field.label}
                            </label>
                            <span className="text-[10px] font-mono text-muted">
                              key: {field.key}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted font-body">
                            {field.description}
                          </p>

                          <div className="flex gap-2">
                            {field.isTextarea ? (
                              <textarea
                                rows={3}
                                value={currentVal}
                                onChange={(e) =>
                                  setContentValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="flex-1 px-3.5 py-2.5 rounded-xl border border-line bg-cream/40 text-xs font-body text-deep focus:outline-none focus:border-gold"
                              />
                            ) : (
                              <input
                                type="text"
                                value={currentVal}
                                onChange={(e) =>
                                  setContentValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="flex-1 px-3.5 py-2 rounded-xl border border-line bg-cream/40 text-xs font-body text-deep focus:outline-none focus:border-gold"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => saveItem(field.key, contentValues[field.key] ?? field.defaultValue)}
                              disabled={isSaving}
                              className={`px-4 py-2 rounded-xl text-xs font-body font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                                isSaved
                                  ? "bg-emerald-600 text-white"
                                  : "bg-deep text-warm-white hover:bg-gold hover:text-deep"
                              }`}
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isSaved ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              <span>{isSaved ? "Saved" : "Save"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Hero 3D Wheel Cards */}
          {activeSubTab === "wheel" && (
            <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl text-deep font-semibold">
                    Homepage 3D Cylindrical Wheel Cards ({wheelCards.length})
                  </h3>
                  <p className="text-xs text-muted font-body mt-0.5">
                    Controls cards rotating in the 3D arch on the homepage hero.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newCard = {
                        id: `card-${Date.now()}`,
                        category: "COLLECTION",
                        label: "New Atelier Highlight",
                        subtitle: "Unhurried session in Abuja",
                        image: "/images/client/weddings_1.jpg",
                        href: "/sessions",
                      };
                      setWheelCards([...wheelCards, newCard]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream border border-line text-xs font-body font-semibold text-deep hover:bg-gold/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveItem("hero_wheel_cards", wheelCards)}
                    disabled={savingKeys["hero_wheel_cards"]}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep"
                  >
                    {savingKeys["hero_wheel_cards"] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedKeys["hero_wheel_cards"] ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savedKeys["hero_wheel_cards"] ? "Saved to DB" : "Save All Cards"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wheelCards.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className="p-4 rounded-xl border border-line bg-cream/30 space-y-3 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => setWheelCards(wheelCards.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                      <img
                        src={card.image}
                        alt={card.label}
                        className="w-16 h-20 object-cover rounded-lg border border-line shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={card.category}
                          onChange={(e) => {
                            const updated = [...wheelCards];
                            updated[idx].category = e.target.value.toUpperCase();
                            setWheelCards(updated);
                          }}
                          placeholder="CATEGORY"
                          className="w-full text-[10px] font-bold text-gold uppercase tracking-wider bg-transparent border-b border-transparent focus:border-gold outline-none"
                        />
                        <input
                          type="text"
                          value={card.label}
                          onChange={(e) => {
                            const updated = [...wheelCards];
                            updated[idx].label = e.target.value;
                            setWheelCards(updated);
                          }}
                          placeholder="Card Title"
                          className="w-full font-display text-sm font-semibold text-deep bg-transparent border-b border-transparent focus:border-gold outline-none mt-0.5"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-body">
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Subtitle</label>
                        <input
                          type="text"
                          value={card.subtitle}
                          onChange={(e) => {
                            const updated = [...wheelCards];
                            updated[idx].subtitle = e.target.value;
                            setWheelCards(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                        />
                      </div>
                      <ImageUploadField
                        label="Card Photo (File or URL)"
                        value={card.image}
                        onChange={(newUrl) => {
                          const updated = [...wheelCards];
                          updated[idx].image = newUrl;
                          setWheelCards(updated);
                        }}
                      />
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Link Href</label>
                        <input
                          type="text"
                          value={card.href}
                          onChange={(e) => {
                            const updated = [...wheelCards];
                            updated[idx].href = e.target.value;
                            setWheelCards(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-mono text-deep outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Testimonials */}
          {activeSubTab === "testimonials" && (
            <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl text-deep font-semibold">
                    Client Testimonials &amp; Love Notes ({testimonials.length})
                  </h3>
                  <p className="text-xs text-muted font-body mt-0.5">
                    Live feedback displayed across Homepage and the /love-notes showcase.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newT = {
                        id: `test-${Date.now()}`,
                        index: String(testimonials.length + 1).padStart(2, "0"),
                        clientName: "New Client",
                        roleOrLocation: "Maitama Studio · Abuja",
                        headline: "Pure Artistry & Dignity",
                        quote: "Our session was calm, unhurried, and deeply meaningful.",
                        avatarUrl: "/images/client/events_2.jpg",
                        active: true,
                      };
                      setTestimonials([...testimonials, newT]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream border border-line text-xs font-body font-semibold text-deep hover:bg-gold/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Testimonial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveItem("site_testimonials", testimonials)}
                    disabled={savingKeys["site_testimonials"]}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep"
                  >
                    {savingKeys["site_testimonials"] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedKeys["site_testimonials"] ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savedKeys["site_testimonials"] ? "Saved to DB" : "Save All Testimonials"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {testimonials.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-5 rounded-xl border border-line bg-cream/30 space-y-4 relative"
                  >
                    <button
                      type="button"
                      onClick={() => setTestimonials(testimonials.filter((_, i) => i !== idx))}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Client Name</label>
                        <input
                          type="text"
                          value={t.clientName}
                          onChange={(e) => {
                            const updated = [...testimonials];
                            updated[idx].clientName = e.target.value;
                            setTestimonials(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-semibold text-deep outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Role / Location</label>
                        <input
                          type="text"
                          value={t.roleOrLocation}
                          onChange={(e) => {
                            const updated = [...testimonials];
                            updated[idx].roleOrLocation = e.target.value;
                            setTestimonials(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Headline</label>
                        <input
                          type="text"
                          value={t.headline}
                          onChange={(e) => {
                            const updated = [...testimonials];
                            updated[idx].headline = e.target.value;
                            setTestimonials(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-semibold text-gold outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-muted font-semibold block">Quote Body</label>
                      <textarea
                        rows={2}
                        value={t.quote}
                        onChange={(e) => {
                          const updated = [...testimonials];
                          updated[idx].quote = e.target.value;
                          setTestimonials(updated);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-line bg-warm-white text-xs font-serif italic text-deep outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Session Stories */}
          {activeSubTab === "stories" && (
            <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl text-deep font-semibold">
                    Living Chronicles &amp; Stories ({stories.length})
                  </h3>
                  <p className="text-xs text-muted font-body mt-0.5">
                    Interactive flip chronicles featured on the /stories page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newStory = {
                        id: `story-${Date.now()}`,
                        number: String(stories.length + 1).padStart(2, "0"),
                        title: "New Session Chronicle",
                        subtitle: "Unhurried Afternoon in Maitama",
                        sessionType: "Toddler & Children Studio Session",
                        sessionSlug: "/sessions#toddler",
                        client: "Abuja Family",
                        date: "November 2026",
                        location: "Maitama Studio Suite, Abuja",
                        lightDetails: "Soft North Window Skylight",
                        excerpt: "A calm, unhurried session honoring family connection.",
                        quote: "A memory we will cherish for generations.",
                        quoteAuthor: "Client",
                        studioMood: "Warm, serene, acoustic guitar",
                        image: "/images/client/weddings_1.jpg",
                        imageAlt: "Session portrait",
                        vintageSign: "Abuja Atelier Archive",
                      };
                      setStories([...stories, newStory]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream border border-line text-xs font-body font-semibold text-deep hover:bg-gold/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Story</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveItem("site_stories", stories)}
                    disabled={savingKeys["site_stories"]}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep"
                  >
                    {savingKeys["site_stories"] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedKeys["site_stories"] ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savedKeys["site_stories"] ? "Saved to DB" : "Save All Stories"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {stories.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="p-5 rounded-xl border border-line bg-cream/30 space-y-3 relative"
                  >
                    <button
                      type="button"
                      onClick={() => setStories(stories.filter((_, i) => i !== idx))}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Title</label>
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => {
                            const updated = [...stories];
                            updated[idx].title = e.target.value;
                            setStories(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-semibold text-deep outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Client</label>
                        <input
                          type="text"
                          value={st.client}
                          onChange={(e) => {
                            const updated = [...stories];
                            updated[idx].client = e.target.value;
                            setStories(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                        />
                      </div>
                      <ImageUploadField
                        label="Story Cover Photo (File or URL)"
                        value={st.image}
                        onChange={(newUrl) => {
                          const updated = [...stories];
                          updated[idx].image = newUrl;
                          setStories(updated);
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-muted font-semibold block">Excerpt</label>
                      <textarea
                        rows={2}
                        value={st.excerpt}
                        onChange={(e) => {
                          const updated = [...stories];
                          updated[idx].excerpt = e.target.value;
                          setStories(updated);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FAQs */}
          {activeSubTab === "faqs" && (
            <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl text-deep font-semibold">
                    Frequently Asked Questions ({faqs.length})
                  </h3>
                  <p className="text-xs text-muted font-body mt-0.5">
                    Shown in a 2-column grid on the /faq page.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFaqs([...faqs, { q: "New Question?", a: "Clear guidance answer." }]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream border border-line text-xs font-body font-semibold text-deep hover:bg-gold/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add FAQ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveItem("site_faqs", faqs)}
                    disabled={savingKeys["site_faqs"]}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep"
                  >
                    {savingKeys["site_faqs"] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedKeys["site_faqs"] ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savedKeys["site_faqs"] ? "Saved to DB" : "Save All FAQs"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-line bg-cream/30 space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <label className="text-[10px] uppercase text-muted font-semibold block">Question</label>
                      <input
                        type="text"
                        value={faq.q}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[idx].q = e.target.value;
                          setFaqs(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-semibold text-deep outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-muted font-semibold block">Answer</label>
                      <textarea
                        rows={2}
                        value={faq.a}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[idx].a = e.target.value;
                          setFaqs(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: About Stats */}
          {activeSubTab === "stats" && (
            <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl text-deep font-semibold">
                    About Page Statistics ({stats.length})
                  </h3>
                  <p className="text-xs text-muted font-body mt-0.5">
                    Displayed on /about in the "Why Families Trust Us" section.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStats([...stats, { value: "100%", label: "Satisfaction", desc: "Our commitment.", iconName: "Sparkles" }]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream border border-line text-xs font-body font-semibold text-deep hover:bg-gold/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveItem("about_stats", stats)}
                    disabled={savingKeys["about_stats"]}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep"
                  >
                    {savingKeys["about_stats"] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedKeys["about_stats"] ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savedKeys["about_stats"] ? "Saved to DB" : "Save All Stats"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-line bg-cream/30 space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => setStats(stats.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove Stat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Stat Value</label>
                        <input
                          type="text"
                          value={s.value}
                          onChange={(e) => {
                            const updated = [...stats];
                            updated[idx].value = e.target.value;
                            setStats(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-bold text-deep outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Icon (Clock, Award, Heart, Sparkles)</label>
                        <input
                          type="text"
                          value={s.iconName || "Sparkles"}
                          onChange={(e) => {
                            const updated = [...stats];
                            updated[idx].iconName = e.target.value;
                            setStats(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-muted font-semibold block">Label</label>
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => {
                          const updated = [...stats];
                          updated[idx].label = e.target.value;
                          setStats(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-semibold text-deep outline-none focus:border-gold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-muted font-semibold block">Description</label>
                      <textarea
                        rows={2}
                        value={s.desc}
                        onChange={(e) => {
                          const updated = [...stats];
                          updated[idx].desc = e.target.value;
                          setStats(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: Camera Perspectives */}
          {activeSubTab === "perspectives" && (
            <div className="bg-warm-white p-5 sm:p-7 rounded-2xl border border-line shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h3 className="font-display text-xl text-deep font-semibold">
                    Camera Perspectives ({perspectives.length})
                  </h3>
                  <p className="text-xs text-muted font-body mt-0.5">
                    Controls lenses and perspectives in the interactive 3D camera CTA showcase.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPerspectives([
                        ...perspectives,
                        {
                          id: `lens-${Date.now()}`,
                          name: "New Lens Perspective",
                          lensSpec: "50mm Prime",
                          description: "Unhurried intimate portraiture.",
                          tag: "[Reserve Session ↗]",
                        },
                      ]);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream border border-line text-xs font-body font-semibold text-deep hover:bg-gold/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Perspective</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveItem("camera_perspectives", perspectives)}
                    disabled={savingKeys["camera_perspectives"]}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep"
                  >
                    {savingKeys["camera_perspectives"] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : savedKeys["camera_perspectives"] ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savedKeys["camera_perspectives"] ? "Saved to DB" : "Save All Perspectives"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {perspectives.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-4 rounded-xl border border-line bg-cream/30 space-y-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => setPerspectives(perspectives.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove perspective"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Camera / Name</label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...perspectives];
                            updated[idx].name = e.target.value;
                            setPerspectives(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs font-semibold text-deep outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-muted font-semibold block">Lens Spec</label>
                        <input
                          type="text"
                          value={p.lensSpec}
                          onChange={(e) => {
                            const updated = [...perspectives];
                            updated[idx].lensSpec = e.target.value;
                            setPerspectives(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-gold font-mono outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase text-muted font-semibold block">Description</label>
                      <textarea
                        rows={2}
                        value={p.description}
                        onChange={(e) => {
                          const updated = [...perspectives];
                          updated[idx].description = e.target.value;
                          setPerspectives(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-warm-white text-xs text-deep outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
