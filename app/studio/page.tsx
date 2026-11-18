"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Inbox,
  Calendar,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Users,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  X,
  Sparkles,
  Smartphone,
  ChevronRight,
  Filter,
  Tag,
  FileText,
  UploadCloud,
  Menu,
  LogOut,
  Loader2,
} from "lucide-react";
import { PACKAGES, SESSION_TYPES } from "@/lib/catalog/seed";
import { EnquiryRecord, PipelineStage } from "@/lib/types";
import { transitionEnquiry } from "@/lib/pipeline/transition";
import { triageInboundMessage, checkDepositScreenshot } from "@/lib/ai/service";
import { KanbanBoard } from "@/components/studio/KanbanBoard";
import { GalleryManager } from "@/components/studio/GalleryManager";
import { ServicesEditor } from "@/components/studio/ServicesEditor";
import { SiteContentEditor } from "@/components/studio/SiteContentEditor";
import { SettingsManager } from "@/components/studio/SettingsManager";

const STAGES_LIST: { id: PipelineStage; label: string }[] = [
  { id: "enquiry", label: "Enquiry" },
  { id: "agreed_to_price", label: "Agreed to Price" },
  { id: "deposit_reported", label: "Deposit Reported" },
  { id: "deposit_paid", label: "Deposit Paid" },
  { id: "preparation", label: "Preparation" },
  { id: "confirmed", label: "Confirmed" },
  { id: "shot", label: "Shot" },
  { id: "editing", label: "Editing" },
  { id: "client_review", label: "Client Review" },
  { id: "delivered", label: "Delivered" },
  { id: "closed", label: "Closed" },
];

export default function StudioDashboard() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    setLoadingEnquiries(true);
    fetch("/api/admin/kanban")
      .then((res) => res.json())
      .then((data) => {
        if (data.enquiries) {
          setEnquiries(data.enquiries);
        }
      })
      .catch((err) => console.error("[kanban fetch]", err))
      .finally(() => setLoadingEnquiries(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/studio/login";
  }

  const [activeTab, setActiveTab] = useState<
    "today" | "pipeline" | "deposits" | "services" | "gallery" | "inbox" | "content" | "settings"
  >("pipeline");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploadingDepositId, setUploadingDepositId] = useState<string | null>(null);

  // Upload or replace deposit screenshot
  async function handleUploadDepositReceipt(e: React.ChangeEvent<HTMLInputElement>, enq: EnquiryRecord) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDepositId(enq.id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partition", "private");
      formData.append("enquiryId", enq.id);
      formData.append("sessionType", enq.session_type || "general");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.url || data.privateUrl || data.storageKey;

      if (uploadedUrl) {
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === enq.id
              ? {
                  ...item,
                  deposit_screenshot_url: uploadedUrl,
                  payment: item.payment
                    ? { ...item.payment, screenshotAssetId: uploadedUrl }
                    : { id: "new-p", status: "pending", amountExpected: Math.round((item.agreed_price || 0) * 0.7) },
                }
              : item
          )
        );
        alert("Receipt uploaded and attached successfully!");
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error("Receipt upload error:", err);
      alert("Failed to upload receipt: " + err.message);
    } finally {
      setUploadingDepositId(null);
    }
  }



  // Deposit review form state & receipt lightbox
  const [bankRefInput, setBankRefInput] = useState("");
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [zoomedReceiptUrl, setZoomedReceiptUrl] = useState<string | null>(null);

  // Human Inbox state
  const [selectedConversationId, setSelectedConversationId] = useState<string>("conv-1");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({
    "conv-1": "Hello Hadiza! Absolutely, your Luxury collection comfortably accommodates 3 to 4 outfit changes for both girls. We have plenty of time for calm breaks in between.",
    "conv-2": "Hello David! We have Friday at 2:30 PM open in our Maitama studio. Let us know if that works perfectly for your schedule.",
  });
  const [inboxStatus, setInboxStatus] = useState<string | null>(null);

  // Content Calendar state
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [newContentForm, setNewContentForm] = useState({
    platform: "Instagram",
    format: "Carousel",
    pillar: "Craft & Light",
    topic: "",
    date: "Next Monday, 11:00 AM",
  });

  // Asset Library filter
  const [assetFilter, setAssetFilter] = useState<string>("all");

  // Settings & CMS save status
  const [settingsSavedStatus, setSettingsSavedStatus] = useState<string | null>(null);
  const [websiteCopySavedStatus, setWebsiteCopySavedStatus] = useState<string | null>(null);

  // Inbound messages simulation for Human Inbox
  const [conversations, setConversations] = useState([
    {
      id: "conv-1",
      client: "Hadiza M.",
      phone: "+234 803 123 4567",
      channel: "WhatsApp",
      lastMessage: "Good morning! Can we bring three outfits for our twin girls' birthday shoot?",
      timestamp: "10 mins ago",
      state: "bot",
      triage: triageInboundMessage("Good morning! Can we bring three outfits for our twin girls' birthday shoot?"),
    },
    {
      id: "conv-2",
      client: "David O.",
      phone: "+234 812 987 6543",
      channel: "Instagram DM",
      lastMessage: "I need to reschedule our headshots from Thursday to Friday afternoon if possible.",
      timestamp: "45 mins ago",
      state: "human",
      triage: triageInboundMessage("I need to reschedule our headshots from Thursday to Friday afternoon if possible."),
    },
  ]);

  // Content calendar weekly posting targets
  const [contentItems, setContentItems] = useState([
    {
      id: "c-1",
      platform: "Instagram",
      format: "Carousel",
      pillar: "Craft & Light",
      topic: "Behind the scenes of our unhurried toddler pacing",
      status: "Scheduled",
      date: "Tomorrow, 10:00 AM",
      hasConsent: true,
    },
    {
      id: "c-2",
      platform: "LinkedIn",
      format: "Article",
      pillar: "Executive Presence",
      topic: "Why executive headshots in Abuja need gentle, natural lighting",
      status: "Drafting",
      date: "Friday, 12:00 PM",
      hasConsent: true,
    },
  ]);

  // Asset library with consent checking
  const [assets, setAssets] = useState([
    {
      id: "ast-1",
      title: "Zara 1st Birthday Studio Portrait",
      sessionType: "Toddler",
      consentStatus: "both", // portfolio & marketing
      preview: "https://images.unsplash.com/photo-1519689680058-324335c77eda?auto=format&fit=crop&w=600&q=80",
      altApproved: true,
    },
    {
      id: "ast-2",
      title: "Private Family Portrait",
      sessionType: "Family",
      consentStatus: "none", // NO consent for marketing
      preview: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80",
      altApproved: false,
    },
  ]);

  // Hard Rule #1: Record deposit (Requires human team member!)
  function handleRecordDeposit(enquiry: EnquiryRecord) {
    if (!bankRefInput.trim()) {
      alert("Please enter the confirmed bank reference ID from your bank statement.");
      return;
    }

    const result = transitionEnquiry(enquiry, "deposit_paid", "Osemene", {
      depositRecordedBy: "Osemene",
      bankReference: bankRefInput.trim(),
    });

    if (result.success && result.enquiry) {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? result.enquiry! : e))
      );
      setBankRefInput("");
      alert(`Deposit recorded successfully by Osemene. Enquiry moved to Deposit Paid.`);
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  // Reject deposit
  function handleRejectDeposit(enquiry: EnquiryRecord) {
    const reason = prompt("Reason for rejection (e.g. transfer not reflected, wrong amount):");
    if (!reason) return;

    const result = transitionEnquiry(enquiry, "agreed_to_price", "Osemene", {
      reason,
    });

    if (result.success && result.enquiry) {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? result.enquiry! : e))
      );
      alert("Deposit rejected. Client notified via WhatsApp assistant to verify transfer.");
    }
  }

  // Deposits waiting for human verification
  const depositsQueue = enquiries.filter((e) => e.stage === "deposit_reported");

  return (
    <div className="min-h-screen bg-cream text-deep flex flex-col">
      {/* Studio Top Navigation Bar */}
      <header className="bg-deep text-warm-white border-b border-warm-white/10 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        {/* Left: Mobile Drawer Trigger + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-gold hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="font-display text-lg sm:text-xl font-semibold text-warm-white tracking-tight flex items-center gap-1.5">
            <span>LamSparks</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block"></span>
          </Link>

          <span className="font-body text-[10px] uppercase tracking-wider text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30 hidden lg:inline-block">
            Studio Operating System
          </span>
        </div>

        {/* Right: Authenticated User & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-body text-xs text-cream/70 hidden sm:inline">
            Logged in as <strong>{currentUser?.name || "Osemene"}</strong> ({currentUser?.role || "Owner"})
          </span>

          <Link
            href="/"
            className="font-body text-xs text-gold hover:text-warm-white border border-gold/40 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0"
          >
            Public Site ↗
          </Link>

          <button
            onClick={handleLogout}
            className="font-body text-xs text-red-300 hover:text-red-100 border border-red-500/30 bg-red-950/20 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 sm:hidden text-red-300" />
            <span className="whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Out Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-[#181411] text-warm-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div>
                  <span className="font-display text-lg font-semibold text-warm-white">LamSparks Studio</span>
                  <span className="text-[10px] text-gold font-body block uppercase tracking-wider">Navigation Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cream/70"
                >
                  <X className="w-5 h-5 text-warm-white" />
                </button>
              </div>

              <nav className="space-y-1">
                {[
                  { id: "today", label: "Today Overview", icon: Clock },
                  { id: "pipeline", label: "Pipeline Board", icon: BarChart3 },
                  {
                    id: "deposits",
                    label: "Deposit Queue",
                    icon: CheckCircle,
                    badge: depositsQueue.length > 0 ? depositsQueue.length : 1,
                  },
                  { id: "services", label: "Services & Pricing", icon: Tag },
                  { id: "gallery", label: "Gallery Manager", icon: ImageIcon },
                  { id: "inbox", label: "Human Inbox", icon: Inbox },
                  { id: "content", label: "Site Content CMS", icon: FileText },
                  { id: "settings", label: "Studio Settings", icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-body text-xs uppercase tracking-wider font-semibold transition-all ${
                        isActive
                          ? "bg-gold text-deep font-bold shadow-md"
                          : "text-cream/80 hover:bg-white/5 hover:text-warm-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-deep" : "text-gold"}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          isActive ? "bg-deep text-gold" : "bg-gold text-deep"
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] font-body text-cream/50">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Abuja Studio Active</span>
              </div>
              <span>LamSparks Studio OS v2.4</span>
            </div>
          </aside>
        </div>
      )}

      {/* Main Studio Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop Sidebar Nav (md:flex, hidden on mobile) */}
        <aside className="hidden md:flex w-64 bg-[#FAF8F5] border-r border-[#EFE9E1] p-4 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] flex-col justify-between select-none z-30">
          <nav className="w-full space-y-1.5 overflow-y-auto no-scrollbar">
            {[
              { id: "today", label: "TODAY OVERVIEW", icon: Clock },
              { id: "pipeline", label: "PIPELINE BOARD", icon: BarChart3 },
              {
                id: "deposits",
                label: "DEPOSIT QUEUE",
                icon: CheckCircle,
                badge: depositsQueue.length > 0 ? depositsQueue.length : 1,
              },
              { id: "services", label: "SERVICES & PRICING", icon: Tag },
              { id: "gallery", label: "GALLERY MANAGER", icon: ImageIcon },
              { id: "inbox", label: "HUMAN INBOX", icon: Inbox },
              { id: "content", label: "SITE CONTENT CMS", icon: FileText },
              { id: "settings", label: "STUDIO SETTINGS", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-body text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap text-left ${
                    isActive
                      ? "bg-[#181411] text-warm-white shadow-md"
                      : "text-[#736253] hover:bg-[#F2ECE3] hover:text-[#181411]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C9A96E]" : "text-[#B89874]"}`} />
                    <span className="font-semibold">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="w-5 h-5 rounded-full bg-[#B88746] text-[#181411] text-[11px] font-bold flex items-center justify-center shrink-0 ml-2">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#EFE9E1]">
            <div className="flex items-center gap-2 text-[11px] text-muted font-body">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Abuja Studio Active</span>
            </div>
            <p className="text-[10px] text-muted/80 mt-0.5">LamSparks Studio OS v2.4</p>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {/* TAB 1: TODAY OVERVIEW */}
          {activeTab === "today" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
                  Daily Command Center
                </span>
                <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                  Today in the Studio
                </h1>
                <p className="font-body text-xs sm:text-sm text-muted mt-1">
                  Working hours: 09:00 – 18:00 (Africa/Lagos). Flags count only within studio hours.
                </p>
              </div>

              {/* Status Alert Cards - 2x2 on Mobile, 4-col on Desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted block mb-1">
                    Deposits to Check
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-semibold text-deep">
                      {depositsQueue.length}
                    </span>
                    <button
                      onClick={() => setActiveTab("deposits")}
                      className="text-xs font-body uppercase text-gold hover:underline font-semibold"
                    >
                      Review →
                    </button>
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted block mb-1">
                    Shoots Today &amp; Tomorrow
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-semibold text-deep">
                      1
                    </span>
                    <span className="text-xs font-body text-muted">
                      Kamsi Toddler (2pm)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted block mb-1">
                    Edits Due This Week
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-semibold text-deep">
                      2
                    </span>
                    <span className="text-xs font-body text-muted">
                      Balogun Event
                    </span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
                  <span className="font-body text-[10px] uppercase tracking-wider text-muted block mb-1">
                    Human Inbox Unread
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-semibold text-deep">
                      {conversations.length}
                    </span>
                    <button
                      onClick={() => setActiveTab("inbox")}
                      className="text-xs font-body uppercase text-gold hover:underline font-semibold"
                    >
                      Open →
                    </button>
                  </div>
                </div>
              </div>

              {/* Priority Action Queue */}
              <div className="bg-warm-white p-6 rounded-photo border border-line shadow-editorial space-y-4">
                <h3 className="font-display text-2xl text-deep font-normal">
                  Immediate Team Actions Required
                </h3>
                <div className="divide-y divide-line">
                  {depositsQueue.map((enq) => (
                    <div key={enq.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                          <h4 className="font-body text-sm font-semibold text-deep">
                            Deposit Screenshot Reported (Ref: {enq.reference_code})
                          </h4>
                          <span className="text-xs font-mono text-muted">
                            ₦{enq.agreed_price?.toLocaleString()}
                          </span>
                        </div>
                        <p className="font-body text-xs text-muted mt-1">
                          {enq.purpose_text} · Client sent screenshot via WhatsApp assistant.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("deposits")}
                        className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-full transition-all"
                      >
                        <span>Inspect Screenshot &amp; Record</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PIPELINE BOARD (True Calm Luxury Kanban Board) */}
          {activeTab === "pipeline" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
                    Client Operating System
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                    Studio Kanban Pipeline
                  </h1>
                </div>
                <div className="text-xs font-body text-muted">
                  Executive workflow swimlanes · 1-click stage progression &amp; direct WhatsApp messaging.
                </div>
              </div>

              {loadingEnquiries ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-72 rounded-2xl bg-warm-white/70 animate-pulse border border-line p-4 space-y-3">
                      <div className="h-4 bg-line rounded w-1/3" />
                      <div className="h-20 bg-line/50 rounded-xl" />
                      <div className="h-4 bg-line/70 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <KanbanBoard
                  enquiries={enquiries}
                  onSelectEnquiry={setSelectedEnquiry}
                  onUpdateEnquiries={setEnquiries}
                  onOpenDepositsQueue={() => setActiveTab("deposits")}
                />
              )}
            </div>
          )}

          {/* TAB 3: DEPOSIT QUEUE (Human Verification + AI Screenshot Analysis) */}
          {activeTab === "deposits" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
                  Hard Rule #1 Enforcement
                </span>
                <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                  Deposit Queue
                </h1>
                <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
                  <strong>The system never confirms a deposit automatically.</strong> An authorized team member inspects the screenshot against bank records, inputs the bank reference, and confirms.
                </p>
                <div className="mt-3 p-3.5 bg-gold/10 border border-gold/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-deep font-body">
                    <span className="font-semibold text-gold block">Official Receiving Bank Account:</span>
                    <span>PalmPay · Account: <strong>9064982841</strong> · Name: <strong>LEONARD OSEGHALE OSELUMHENSE</strong></span>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] uppercase tracking-wider bg-gold text-deep font-bold px-2.5 py-1 rounded-full">Active Channel</span>
                </div>
              </div>

              {depositsQueue.length === 0 ? (
                <div className="p-12 text-center bg-warm-white rounded-photo border border-line">
                  <CheckCircle className="w-10 h-10 text-gold mx-auto mb-3" />
                  <h3 className="font-display text-2xl text-deep font-medium">All Deposits Cleared</h3>
                  <p className="font-body text-xs text-muted mt-1">
                    No pending transfer screenshots in the queue.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {depositsQueue.map((enq) => {
                    const expected = Math.round((enq.agreed_price || 0) * 0.7);
                    const aiData = enq.payment?.aiCheck as any;

                    return (
                      <div
                        key={enq.id}
                        className="bg-warm-white p-4 sm:p-5 rounded-2xl border border-line shadow-sm hover:shadow-md transition-all duration-300 space-y-3.5 max-w-xl"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-line/60">
                          <div>
                            <span className="font-body text-[10px] uppercase tracking-wider text-gold font-bold block">
                              Pending Verification
                            </span>
                            <h3 className="font-display text-lg sm:text-xl text-deep font-medium">
                              Ref: {enq.reference_code}
                            </h3>
                          </div>
                          <span className="font-body text-xs font-bold text-deep bg-gold/15 border border-gold/30 px-2.5 py-1 rounded-full">
                            Expected: ₦{expected.toLocaleString()}
                          </span>
                        </div>

                        {/* Compact Screenshot Inspector */}
                        <div
                          onClick={() => enq.deposit_screenshot_url && setZoomedReceiptUrl(enq.deposit_screenshot_url)}
                          className="h-32 sm:h-36 w-full rounded-xl overflow-hidden border border-line bg-[#16120F]/5 relative group cursor-pointer"
                        >
                          {enq.deposit_screenshot_url ? (
                            <img
                              src={enq.deposit_screenshot_url}
                              alt="Transfer Receipt Screenshot"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-muted">
                              <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
                              <span className="text-[11px]">Client transfer receipt attached</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-deep/85 text-warm-white px-2 py-0.5 rounded text-[10px] font-body backdrop-blur-sm">
                            Client Upload
                          </div>
                          <div className="absolute bottom-2 right-2 bg-deep/85 hover:bg-deep text-warm-white px-2.5 py-1 rounded text-[10px] font-body flex items-center gap-1 backdrop-blur-sm transition-all shadow-sm">
                            <Eye className="w-3 h-3 text-gold" />
                            <span>Click to Zoom Receipt</span>
                          </div>
                        </div>

                        {/* Upload / Replace Receipt button */}
                        <div className="flex items-center justify-between text-xs font-body">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream hover:bg-white border border-line text-xs font-body font-semibold text-deep transition-all shadow-2xs hover:border-gold">
                            {uploadingDepositId === enq.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5 text-gold" />
                            )}
                            <span>{enq.deposit_screenshot_url ? "Replace Receipt" : "Upload Receipt"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingDepositId === enq.id}
                              className="hidden"
                              onChange={(e) => handleUploadDepositReceipt(e, enq)}
                            />
                          </label>
                          <span className="text-[11px] text-muted">Supports JPG, PNG</span>
                        </div>

                        {/* Background AI Analysis Readout */}
                        <div className="p-3 bg-cream/70 rounded-xl border border-line/80 text-xs font-body space-y-1.5">
                          <div className="flex items-center gap-1.5 text-gold font-semibold text-[11px]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Background AI Verification Status:</span>
                          </div>
                          <p className="text-brown/90 text-[11px] leading-relaxed line-clamp-2">
                            {aiData?.summary || "Automated OCR pending. Staff must verify transfer directly against bank statement."}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-line/40">
                            <span>Detected: {aiData?.extractedAmount ? `₦${Number(aiData.extractedAmount).toLocaleString()}` : "₦476,000"}</span>
                            <span>Bank Ref: {aiData?.reference || "Pending manual entry"}</span>
                          </div>
                        </div>

                        {/* Human Action Controls */}
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="block font-body text-[11px] uppercase tracking-wider text-deep font-semibold mb-1">
                              Bank Transaction Reference (Required) <span className="text-gold">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. GTB-TXN-8839210"
                              value={bankRefInput}
                              onChange={(e) => setBankRefInput(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-line font-body text-xs sm:text-sm text-deep focus:border-gold focus:outline-none bg-warm-white transition-colors"
                            />
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleRecordDeposit(enq)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold py-2.5 rounded-full transition-all shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 text-gold" />
                              <span>Verify &amp; Record</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRejectDeposit(enq)}
                              className="px-4 py-2.5 border border-line hover:border-red-400 text-red-600 font-body text-xs uppercase tracking-wider font-semibold rounded-full transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HUMAN INBOX (Unified Inbound + AI Triage) */}
          {activeTab === "inbox" && (() => {
            const activeConv = conversations.find((c) => c.id === selectedConversationId) || conversations[0];
            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
                    Unified Messaging
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                    Human Inbox
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
                    Incoming WhatsApp, Instagram and Facebook messages with background AI triage labels. Taking over a conversation pauses automation for that client.
                  </p>
                </div>

                {inboxStatus && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl font-body text-xs flex items-center justify-between">
                    <span className="font-semibold">✓ {inboxStatus}</span>
                    <button onClick={() => setInboxStatus(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Conversation List */}
                  <div className="space-y-3">
                    {conversations.map((c) => {
                      const isSelected = c.id === activeConv.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedConversationId(c.id)}
                          className={`p-4 rounded-photo border cursor-pointer shadow-editorial transition-all ${
                            isSelected
                              ? "bg-warm-white border-gold shadow-md ring-1 ring-gold"
                              : "bg-warm-white/70 border-line hover:border-gold/60"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-deep">{c.client}</span>
                            <span className="text-[10px] text-muted">{c.timestamp}</span>
                          </div>
                          <span className="font-body text-[10px] uppercase tracking-wider text-gold font-semibold block mb-2">
                            {c.channel} · State: {c.state === "human" ? "Human Managed" : "AI Concierge"}
                          </span>
                          <p className="font-body text-xs text-brown/90 line-clamp-2">
                            {c.lastMessage}
                          </p>
                          {/* AI Triage Label */}
                          <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[11px]">
                            <span className="bg-gold/15 text-deep px-2 py-0.5 rounded font-medium">
                              AI: {c.triage.label.replace(/_/g, " ")}
                            </span>
                            <span className="text-gold font-semibold">Inspect →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Thread Workspace */}
                  <div className="lg:col-span-2 bg-warm-white p-6 rounded-photo border border-line shadow-floating space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-line gap-3">
                      <div>
                        <h3 className="font-display text-2xl text-deep font-medium">
                          {activeConv.client} ({activeConv.phone})
                        </h3>
                        <span className="font-body text-xs text-muted">
                          {activeConv.channel} · Active Thread
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setConversations((prev) =>
                            prev.map((c) =>
                              c.id === activeConv.id
                                ? { ...c, state: c.state === "human" ? "bot" : "human" }
                                : c
                            )
                          );
                        }}
                        className={`font-body text-xs uppercase tracking-wider px-4 py-2 rounded-full font-semibold transition-all ${
                          activeConv.state === "human"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-gold text-deep hover:bg-gold/90"
                        }`}
                      >
                        {activeConv.state === "human" ? "✓ Human Active (Click to Resume AI)" : "Take Over Conversation"}
                      </button>
                    </div>

                    {/* AI Triage Card */}
                    <div className="p-4 bg-cream/70 rounded-lg border border-line space-y-2">
                      <div className="flex items-center gap-2 text-xs font-body font-semibold text-gold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Background AI Triage Analysis</span>
                      </div>
                      <p className="font-body text-xs text-brown/90">
                        <strong>Client Message:</strong> &ldquo;{activeConv.lastMessage}&rdquo;
                      </p>
                      <p className="font-body text-xs text-muted">
                        <strong>Suggested Concierge Action:</strong> Respond with unhurried warmth and affirm custom wardrobe pacing.
                      </p>
                    </div>

                    {/* Draft Reply Area (Never sent without human review) */}
                    <div className="space-y-3">
                      <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold">
                        Human Reply (Written in Osemene&apos;s Voice)
                      </label>
                      <textarea
                        rows={4}
                        value={replyTexts[activeConv.id] || ""}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({
                            ...prev,
                            [activeConv.id]: e.target.value,
                          }))
                        }
                        placeholder="Write your bespoke client message here..."
                        className="w-full p-4 rounded-lg border border-line font-body text-sm text-deep focus:border-gold focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setInboxStatus(`Dispatched message to ${activeConv.client} (${activeConv.phone}) via official WhatsApp.`);
                            setTimeout(() => setInboxStatus(null), 4000);
                          }}
                          className="bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-full transition-all"
                        >
                          Send via WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 4: SERVICES & PRICING CRUD */}
          {activeTab === "services" && <ServicesEditor />}

          {/* TAB 5: GALLERY & ASSETS MANAGER */}
          {activeTab === "gallery" && <GalleryManager />}

          {/* TAB 6: SITE CONTENT CMS */}
          {activeTab === "content" && <SiteContentEditor />}

          {/* TAB 7: STUDIO SETTINGS */}
          {activeTab === "settings" && <SettingsManager />}
        </section>
      </div>

      {/* MODAL 1: ENQUIRY DETAIL MODAL (Pipeline Inspection & Transitions) */}
      {selectedEnquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-warm-white rounded-2xl shadow-2xl border border-line p-6 max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs uppercase bg-gold/15 text-gold px-2 py-0.5 rounded font-bold">
                    {selectedEnquiry.reference_code}
                  </span>
                  <span className="font-body text-xs uppercase tracking-wider text-muted font-semibold">
                    Source: {selectedEnquiry.source}
                  </span>
                </div>
                <h2 className="font-display text-2xl text-deep font-medium">
                  {selectedEnquiry.purpose_text || "Client Session Enquiry"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 rounded-full hover:bg-cream border border-line text-deep"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-cream/60 rounded-xl border border-line text-xs font-body">
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Session Type</span>
                <span className="font-bold text-deep capitalize">{selectedEnquiry.session_type}</span>
              </div>
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Agreed Price</span>
                <span className="font-bold text-deep">
                  {selectedEnquiry.agreed_price ? `₦${selectedEnquiry.agreed_price.toLocaleString()}` : "Custom Quote"}
                </span>
              </div>
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Current Stage</span>
                <span className="font-bold text-gold capitalize">{selectedEnquiry.stage.replace(/_/g, " ")}</span>
              </div>
              <div>
                <span className="text-muted block font-semibold text-[10px] uppercase">Waiting On</span>
                <span className="font-semibold text-deep capitalize">{selectedEnquiry.waiting_on}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted block font-semibold text-[10px] uppercase">Client Desired Feeling</span>
                <span className="text-brown/90">{selectedEnquiry.feeling_text || "Unhurried, natural aesthetic"}</span>
              </div>
            </div>

            {/* Stage Transition Control */}
            <div className="space-y-2 pt-2 border-t border-line">
              <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold">
                Advance Client Pipeline Stage
              </label>
              <div className="flex flex-wrap gap-2">
                {STAGES_LIST.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      const updated = transitionEnquiry(selectedEnquiry, st.id, currentUser?.name || "Osemene");
                      if (updated.success && updated.enquiry) {
                        setEnquiries((prev) => prev.map((e) => (e.id === selectedEnquiry.id ? updated.enquiry! : e)));
                        setSelectedEnquiry(updated.enquiry);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                      selectedEnquiry.stage === st.id
                        ? "bg-deep text-warm-white font-bold shadow-sm"
                        : "bg-cream/80 text-brown hover:bg-warm-white hover:text-deep border border-line/60"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={`https://wa.me/2348130847299?text=Hello%20${encodeURIComponent(selectedEnquiry.purpose_text || "LamSparks Client")}%20(Ref:%20${selectedEnquiry.reference_code})`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-body text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-full transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Concierge</span>
              </a>

              <button
                onClick={() => setSelectedEnquiry(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-deep text-warm-white font-body text-xs uppercase tracking-wider font-semibold rounded-full"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HIGH-RESOLUTION RECEIPT LIGHTBOX */}
      {zoomedReceiptUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setZoomedReceiptUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-warm-white rounded-2xl overflow-hidden shadow-2xl border border-line flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-cream/70">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold" />
                <h3 className="font-display text-base font-semibold text-deep">
                  High-Resolution Bank Transfer Receipt Inspector
                </h3>
              </div>
              <button
                onClick={() => setZoomedReceiptUrl(null)}
                className="p-1 rounded-full text-deep hover:bg-cream border border-line transition-colors"
                aria-label="Close receipt inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto max-h-[72vh] p-4 flex items-center justify-center bg-[#181411]/5">
              <img
                src={zoomedReceiptUrl}
                alt="Full Zoomed Bank Transfer Receipt"
                className="max-h-[68vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="px-5 py-3 border-t border-line bg-cream/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-body text-brown">
              <span>Verify: Account Name, Sender Name, Session Ref, and Date/Timestamp against your bank statement.</span>
              <button
                onClick={() => setZoomedReceiptUrl(null)}
                className="self-end sm:self-auto px-4 py-1.5 bg-deep text-warm-white text-xs uppercase tracking-wider rounded-full font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
