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
} from "lucide-react";
import { PACKAGES, SESSION_TYPES } from "@/lib/catalog/seed";
import { EnquiryRecord, PipelineStage } from "@/lib/types";
import { transitionEnquiry } from "@/lib/pipeline/transition";
import { triageInboundMessage, checkDepositScreenshot } from "@/lib/ai/service";
import { KanbanBoard } from "@/components/studio/KanbanBoard";

// Initial seed enquiries across stages
const INITIAL_ENQUIRIES: EnquiryRecord[] = [
  {
    id: "enq-101",
    reference_code: "LS-9B2K",
    client_id: "cli-1",
    session_type: "toddler",
    package_id: "toddler-luxury",
    stage: "deposit_reported",
    waiting_on: "us",
    stage_entered_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    source: "Instagram",
    custom_quote: false,
    purpose_text: "1st Birthday Milestone for baby Kamsi",
    feeling_text: "Pure joy, unhurried, warm neutral backdrops",
    answers: {
      purpose: "1st Birthday Milestone",
      packageId: "toddler-luxury",
      childName: "Kamsi",
      childAge: "1",
      additionalFamilyCount: 1,
    },
    agreed_price: 680000,
    deposit_reported_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    deposit_screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "enq-102",
    reference_code: "LS-4M7L",
    client_id: "cli-2",
    session_type: "maternity",
    package_id: "maternity-signature-grace",
    stage: "deposit_paid",
    waiting_on: "us",
    stage_entered_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    source: "WhatsApp",
    custom_quote: false,
    purpose_text: "First pregnancy at 32 weeks",
    feeling_text: "Serene, regal, soft drapery",
    answers: {
      purpose: "First pregnancy",
      packageId: "maternity-signature-grace",
      weeksPregnant: "32 weeks",
    },
    agreed_price: 255000,
    deposit_paid_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    deposit_recorded_by: "Osemene",
    bank_reference: "GTB-TXN-88492019",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: "enq-103",
    reference_code: "LS-7T3Q",
    client_id: "cli-3",
    session_type: "event",
    package_id: "event-4h",
    stage: "editing",
    waiting_on: "us",
    stage_entered_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    source: "Referral",
    custom_quote: false,
    purpose_text: "50th Birthday Dinner Celebration in Maitama",
    answers: {
      purpose: "50th Birthday Celebration",
      packageId: "event-4h",
      reelsAddon: true,
    },
    agreed_price: 400000,
    deposit_paid_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    deposit_recorded_by: "Osemene",
    created_at: new Date(Date.now() - 140 * 3600 * 1000).toISOString(),
  },
  {
    id: "enq-104",
    reference_code: "LS-3P8X",
    client_id: "cli-4",
    session_type: "wedding",
    stage: "enquiry",
    waiting_on: "us",
    stage_entered_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    source: "Website",
    custom_quote: true,
    purpose_text: "Two-day traditional & church wedding in Abuja",
    answers: {
      purpose: "Two-day traditional & church wedding",
    },
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/studio/login";
  }

  const [activeTab, setActiveTab] = useState<
    "today" | "pipeline" | "deposits" | "inbox" | "content" | "assets" | "settings"
  >("pipeline");

  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(INITIAL_ENQUIRIES);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);

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
      <header className="bg-deep text-warm-white border-b border-warm-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-xl font-semibold text-warm-white">
            LamSparks
          </Link>
          <span className="font-body text-[10px] uppercase tracking-wider text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
            Studio Operating System
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-cream/70 hidden sm:inline">
            Logged in as <strong>{currentUser?.name || "Osemene"}</strong> ({currentUser?.role || "Owner"})
          </span>
          <button
            onClick={handleLogout}
            className="font-body text-[11px] text-red-300 hover:text-red-100 border border-red-500/30 bg-red-950/20 px-2.5 py-1 rounded-full transition-colors"
          >
            Sign Out
          </button>
          <Link
            href="/"
            className="font-body text-xs text-gold hover:text-warm-white border border-gold/40 px-3 py-1.5 rounded-full transition-colors"
          >
            Public Site ↗
          </Link>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav - Horizontally Scrollable on Mobile, Sticky Column on Tablet & Desktop */}
        <aside className="w-full md:w-64 bg-[#FAF8F5] border-b md:border-b-0 md:border-r border-[#EFE9E1] p-2 sm:p-3 md:p-4 shrink-0 md:sticky md:top-[61px] md:h-[calc(100vh-61px)] flex md:flex-col md:justify-between select-none z-30">
          <div className="w-full flex md:flex-col gap-1.5 md:space-y-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar py-1 md:py-0 scroll-smooth">
            {[
              { id: "today", label: "TODAY OVERVIEW", icon: Clock },
              { id: "pipeline", label: "PIPELINE BOARD", icon: BarChart3 },
              {
                id: "deposits",
                label: "DEPOSIT QUEUE",
                icon: CheckCircle,
                badge: depositsQueue.length > 0 ? depositsQueue.length : 1,
              },
              { id: "inbox", label: "HUMAN INBOX", icon: Inbox },
              { id: "content", label: "CONTENT CALENDAR", icon: Calendar },
              { id: "assets", label: "ASSET LIBRARY", icon: ImageIcon },
              { id: "settings", label: "STUDIO SETTINGS", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`shrink-0 md:w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-body text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap text-left ${
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
          </div>

          <div className="hidden md:block pt-3 border-t border-[#EFE9E1]">
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

              {/* Status Alert Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
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

                <div className="p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
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

                <div className="p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
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

                <div className="p-5 bg-warm-white rounded-photo border border-line shadow-editorial">
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

              <KanbanBoard
                enquiries={enquiries}
                onSelectEnquiry={setSelectedEnquiry}
                onUpdateEnquiries={setEnquiries}
                onOpenDepositsQueue={() => setActiveTab("deposits")}
              />
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

          {/* TAB 5: CONTENT CALENDAR & CAPTION BANK */}
          {activeTab === "content" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
                    Social Publishing OS
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                    Content Calendar &amp; Caption Bank
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
                    Plan posts across Instagram, Facebook, LinkedIn and Journal. <strong>Hard rule: posting is always a human action; the system only reminds.</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingContent(!isAddingContent)}
                  className="self-start sm:self-auto bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-full transition-all flex items-center gap-2 shrink-0 shadow-sm"
                >
                  <span>{isAddingContent ? "✕ Close Form" : "+ Schedule New Post"}</span>
                </button>
              </div>

              {/* Add New Post Form */}
              {isAddingContent && (
                <div className="p-5 bg-warm-white rounded-2xl border border-gold/40 shadow-editorial space-y-4 animate-in fade-in duration-200">
                  <h3 className="font-display text-lg text-deep font-semibold border-b border-line pb-2">
                    Draft New Scheduled Content
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-body text-[11px] uppercase tracking-wider text-deep font-semibold mb-1">
                        Platform
                      </label>
                      <select
                        value={newContentForm.platform}
                        onChange={(e) => setNewContentForm((prev) => ({ ...prev, platform: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-line font-body text-xs text-deep bg-cream/30"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Journal">Journal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-body text-[11px] uppercase tracking-wider text-deep font-semibold mb-1">
                        Format
                      </label>
                      <select
                        value={newContentForm.format}
                        onChange={(e) => setNewContentForm((prev) => ({ ...prev, format: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-line font-body text-xs text-deep bg-cream/30"
                      >
                        <option value="Carousel">Carousel</option>
                        <option value="Single Photo">Single Photo</option>
                        <option value="Reel / Video">Reel / Video</option>
                        <option value="Article">Editorial Article</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-body text-[11px] uppercase tracking-wider text-deep font-semibold mb-1">
                        Pillar
                      </label>
                      <select
                        value={newContentForm.pillar}
                        onChange={(e) => setNewContentForm((prev) => ({ ...prev, pillar: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-line font-body text-xs text-deep bg-cream/30"
                      >
                        <option value="Craft & Light">Craft &amp; Light</option>
                        <option value="Executive Presence">Executive Presence</option>
                        <option value="Family Legacy">Family Legacy</option>
                        <option value="Studio Notes">Studio Notes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-[11px] uppercase tracking-wider text-deep font-semibold mb-1">
                        Topic / Editorial Focus *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. The importance of quiet pauses during toddler portraits"
                        value={newContentForm.topic}
                        onChange={(e) => setNewContentForm((prev) => ({ ...prev, topic: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-line font-body text-xs sm:text-sm text-deep bg-cream/30"
                      />
                    </div>
                    <div>
                      <label className="block font-body text-[11px] uppercase tracking-wider text-deep font-semibold mb-1">
                        Publish Date &amp; Time
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Next Monday, 11:00 AM"
                        value={newContentForm.date}
                        onChange={(e) => setNewContentForm((prev) => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-line font-body text-xs sm:text-sm text-deep bg-cream/30"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
                    <button
                      type="button"
                      onClick={() => setIsAddingContent(false)}
                      className="px-4 py-2 border border-line rounded-full font-body text-xs text-brown hover:text-deep"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newContentForm.topic.trim()) {
                          alert("Please enter a topic or caption focus.");
                          return;
                        }
                        setContentItems((prev) => [
                          {
                            id: `c-${Date.now()}`,
                            platform: newContentForm.platform,
                            format: newContentForm.format,
                            pillar: newContentForm.pillar,
                            topic: newContentForm.topic,
                            status: "Scheduled",
                            date: newContentForm.date || "Next Monday, 11:00 AM",
                            hasConsent: true,
                          },
                          ...prev,
                        ]);
                        setIsAddingContent(false);
                        setNewContentForm({
                          platform: "Instagram",
                          format: "Carousel",
                          pillar: "Craft & Light",
                          topic: "",
                          date: "Next Monday, 11:00 AM",
                        });
                      }}
                      className="bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-2 rounded-full"
                    >
                      Save to Calendar
                    </button>
                  </div>
                </div>
              )}

              {/* Weekly Targets & Gap Warning */}
              <div className="p-4 bg-gold/15 rounded-photo border border-gold/40 flex items-center justify-between">
                <div>
                  <h4 className="font-body text-xs font-semibold text-deep uppercase tracking-wider">
                    Weekly Posting Targets
                  </h4>
                  <p className="font-body text-xs text-muted mt-0.5">
                    Target: 3 Instagram, 1 LinkedIn. Current: {contentItems.length} scheduled.
                  </p>
                </div>
                <span className="font-body text-xs uppercase tracking-wider text-deep font-semibold bg-gold/30 px-3 py-1 rounded-full">
                  {contentItems.length >= 4 ? "Target Met" : `${4 - contentItems.length} Post(s) Below Target`}
                </span>
              </div>

              {/* Scheduled Items List */}
              <div className="space-y-4">
                {contentItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 bg-warm-white rounded-photo border border-line shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-body text-xs uppercase tracking-wider text-gold font-semibold">
                          {item.platform} · {item.format}
                        </span>
                        <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted font-body">
                          Pillar: {item.pillar}
                        </span>
                      </div>
                      <h4 className="font-display text-xl text-deep font-medium">
                        {item.topic}
                      </h4>
                      <span className="font-body text-xs text-muted mt-1 block">
                        Scheduled: {item.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-body text-[11px] text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
                        Consent Verified
                      </span>
                      <button
                        type="button"
                        onClick={() => alert(`WhatsApp reminder dispatched to staff for "${item.topic}".`)}
                        className="bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-full transition-all"
                      >
                        Send Post Reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ASSET LIBRARY & STRICT CONSENT ENFORCEMENT */}
          {activeTab === "assets" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
                    NDPA 2023 Compliance
                  </span>
                  <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                    Asset Library
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
                    <strong>Strict Consent Enforcement:</strong> An asset without explicit marketing consent cannot be attached to social posts or scheduled.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {["all", "Toddler", "Family", "Maternity"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAssetFilter(cat.toLowerCase())}
                      className={`px-3 py-1.5 rounded-full text-xs font-body font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                        assetFilter === cat.toLowerCase()
                          ? "bg-deep text-warm-white shadow-sm"
                          : "bg-warm-white text-brown border border-line hover:border-gold/60"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets
                  .filter((asset) =>
                    assetFilter === "all" ? true : asset.sessionType.toLowerCase() === assetFilter
                  )
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-warm-white rounded-photo border border-line overflow-hidden shadow-editorial"
                    >
                      <div className="aspect-[4/3] bg-cream relative">
                        <img
                          src={asset.preview}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
                            asset.consentStatus === "both" || asset.consentStatus === "marketing"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {asset.consentStatus === "both"
                            ? "✓ Marketing Consented"
                            : "✕ No Marketing Consent"}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-display text-lg text-deep font-medium">
                          {asset.title}
                        </h4>
                        <p className="font-body text-xs text-muted">
                          Session: {asset.sessionType} · Alt text {asset.altApproved ? "Approved" : "Pending review"}
                        </p>
                        <div className="pt-2">
                          {asset.consentStatus === "none" ? (
                            <span className="text-[11px] text-red-600 block font-body font-medium">
                              Blocked from public marketing per client wishes (NDPA protected).
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert(`Asset "${asset.title}" attached to next draft post.`)}
                              className="font-body text-xs uppercase tracking-wider text-deep hover:text-gold font-semibold"
                            >
                              + Use in Content Item
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}


          {/* TAB 8: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
              <div>
                <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
                  Global Configuration
                </span>
                <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
                  Studio Settings
                </h1>
              </div>

              {settingsSavedStatus && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-body text-sm flex items-center justify-between">
                  <span>✓ {settingsSavedStatus}</span>
                  <button onClick={() => setSettingsSavedStatus(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
                </div>
              )}

              <div className="bg-warm-white p-6 sm:p-8 rounded-photo border border-line shadow-editorial space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-1">
                      Official WhatsApp Number
                    </label>
                    <input
                      type="text"
                      defaultValue="+234 813 084 7299"
                      className="w-full px-4 py-2 rounded-lg border border-line font-body text-sm text-deep"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-1">
                      Sending Hours (Lagos Time)
                    </label>
                    <input
                      type="text"
                      defaultValue="09:00 – 19:00"
                      className="w-full px-4 py-2 rounded-lg border border-line font-body text-sm text-deep"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold mb-1">
                    Bank Account Details for Transfers
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Bank: PalmPay&#10;Account Number: 9064982841&#10;Account Name: LEONARD OSEGHALE OSELUMHENSE"
                    className="w-full px-4 py-2 rounded-lg border border-line font-body text-sm text-deep"
                  />
                </div>

                <div className="pt-4 border-t border-line flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsSavedStatus("Studio settings and official bank details saved successfully!");
                      setTimeout(() => setSettingsSavedStatus(null), 4000);
                    }}
                    className="bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-full transition-all shadow-sm"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
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
