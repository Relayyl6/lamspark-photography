"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  MessageCircle,
  Instagram,
  Sparkles,
  User,
  Phone,
  Check,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Radio,
  Plus,
  QrCode,
  Smartphone,
  RefreshCw,
  LogOut,
  X,
  Key,
  Wifi,
  WifiOff,
} from "lucide-react";

interface MessageItem {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  sent_by?: string;
  ai_label?: string;
  ai_draft?: string;
  created_at: string;
}

interface ConversationItem {
  id: string;
  clientId: string;
  clientName: string;
  whatsapp: string;
  channel: string;
  state: "bot" | "human";
  lastInboundAt?: string;
  messages: MessageItem[];
}

interface BaileysStatus {
  state: "disconnected" | "connecting" | "qr_ready" | "connected";
  qrCodeDataUrl: string | null;
  pairingCode: string | null;
  user: {
    id: string;
    name?: string;
    phone?: string;
  } | null;
  error?: string | null;
}

interface InstagramStatus {
  connected: boolean;
  username: string | null;
  userId?: string | null;
  error?: string | null;
}

export function HumanInbox() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Channel filter
  const [channelFilter, setChannelFilter] = useState<"all" | "whatsapp" | "instagram">("all");

  // Device Link Modal State (Baileys & IG Direct)
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceTab, setDeviceTab] = useState<"whatsapp" | "instagram">("whatsapp");

  // Baileys WhatsApp State
  const [waStatus, setWaStatus] = useState<BaileysStatus>({
    state: "disconnected",
    qrCodeDataUrl: null,
    pairingCode: null,
    user: null,
  });
  const [waLoading, setWaLoading] = useState(false);
  const [pairPhone, setPairPhone] = useState("+234 813 084 7299");
  const [waMode, setWaMode] = useState<"qr" | "pair">("qr");

  // Instagram Direct State
  const [igStatus, setIgStatus] = useState<InstagramStatus>({
    connected: false,
    username: null,
  });
  const [igLoading, setIgLoading] = useState(false);
  const [igUsername, setIgUsername] = useState("lamsparksphotography");
  const [igPassword, setIgPassword] = useState("");
  const [igMessage, setIgMessage] = useState<string | null>(null);

  // Inbound Pipeline Simulator Modal
  const [showSimModal, setShowSimModal] = useState(false);
  const [simChannel, setSimChannel] = useState<"whatsapp" | "instagram">("whatsapp");
  const [simSender, setSimSender] = useState("Amina Bello");
  const [simPhone, setSimPhone] = useState("+234 803 123 4567");
  const [simText, setSimText] = useState("Hello! I would love to book an unhurried toddler session in Maitama studio next week.");
  const [isSimulating, setIsSimulating] = useState(false);

  // Load Inbox and Device Statuses
  async function loadInbox() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/inbox");
      const data = await res.json();
      if (data.conversations && data.conversations.length > 0) {
        setConversations(data.conversations);
        setSelectedConvId((prev) => prev || data.conversations[0].id);
      }

      // Fetch channel statuses
      const waRes = await fetch("/api/admin/channels/whatsapp");
      const waJson = await waRes.json();
      if (waJson.status) setWaStatus(waJson.status);

      const igRes = await fetch("/api/admin/channels/instagram");
      const igJson = await igRes.json();
      if (igJson.status) setIgStatus(igJson.status);
    } catch (err) {
      console.error("Failed to load inbox:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  // Poll WhatsApp status if connecting
  useEffect(() => {
    if (waStatus.state === "qr_ready" || waStatus.state === "connecting") {
      const interval = setInterval(async () => {
        try {
          const res = await fetch("/api/admin/channels/whatsapp");
          const json = await res.json();
          if (json.status) {
            setWaStatus(json.status);
            if (json.status.state === "connected") {
              clearInterval(interval);
              setStatusMessage("WhatsApp linked successfully!");
              setTimeout(() => setStatusMessage(null), 4000);
            }
          }
        } catch {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [waStatus.state]);

  // --- Baileys Actions ---
  async function handleStartWhatsApp() {
    setWaLoading(true);
    try {
      const res = await fetch("/api/admin/channels/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const json = await res.json();
      if (json.status) setWaStatus(json.status);
    } catch (err) {
      console.error(err);
    } finally {
      setWaLoading(false);
    }
  }

  async function handlePairWhatsApp() {
    setWaLoading(true);
    try {
      const res = await fetch("/api/admin/channels/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pair", phoneNumber: pairPhone }),
      });
      const json = await res.json();
      if (json.status) setWaStatus(json.status);
    } catch (err) {
      console.error(err);
    } finally {
      setWaLoading(false);
    }
  }

  async function handleDisconnectWhatsApp() {
    if (!confirm("Are you sure you want to unlink WhatsApp Web?")) return;
    const clear = confirm("Would you also like to purge test inbox conversations so the inbox is spotless before linking the client's phone?");

    setWaLoading(true);
    try {
      await fetch("/api/admin/channels/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", clearMessages: clear }),
      });
      setWaStatus({
        state: "disconnected",
        qrCodeDataUrl: null,
        pairingCode: null,
        user: null,
      });
      await loadInbox();
    } catch (err) {
      console.error(err);
    } finally {
      setWaLoading(false);
    }
  }

  async function handleLogoutInstagram() {
    if (!confirm("Are you sure you want to log out of Instagram Direct?")) return;
    const clear = confirm("Would you also like to purge test Instagram DMs from the inbox?");

    setIgLoading(true);
    try {
      await fetch("/api/admin/channels/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", clearMessages: clear }),
      });
      setIgStatus({ connected: false, username: null, userId: null });
      await loadInbox();
    } catch (err) {
      console.error(err);
    } finally {
      setIgLoading(false);
    }
  }

  // --- Instagram Actions ---
  async function handleLoginInstagram(e: React.FormEvent) {
    e.preventDefault();
    setIgLoading(true);
    setIgMessage(null);
    try {
      const res = await fetch("/api/admin/channels/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          username: igUsername.replace("@", "").trim(),
          password: igPassword,
        }),
      });
      const json = await res.json();
      if (json.success && json.status) {
        setIgStatus(json.status);
        setIgMessage("Connected to Instagram Direct!");
        setIgPassword("");
        setTimeout(() => setIgMessage(null), 3000);
      } else {
        setIgMessage(json.error || "Login failed.");
      }
    } catch (err: any) {
      setIgMessage(err.message || "Failed to login");
    } finally {
      setIgLoading(false);
    }
  }

  async function handleSyncInstagram() {
    setIgLoading(true);
    try {
      const res = await fetch("/api/admin/channels/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json();
      setStatusMessage(`Synced Instagram inbox. ${json.newMessagesCount || 0} new messages.`);
      setTimeout(() => setStatusMessage(null), 3000);
      await loadInbox();
    } catch {
      setStatusMessage("Error syncing Instagram");
    } finally {
      setIgLoading(false);
    }
  }

  // --- Send Outbound Reply ---
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !activeConv) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv.id,
          text: replyText.trim(),
          channel: activeConv.channel || "whatsapp",
        }),
      });

      if (res.ok) {
        setReplyText("");
        setStatusMessage(
          `Message dispatched to ${activeConv.clientName} via ${activeConv.channel}!`
        );
        setTimeout(() => setStatusMessage(null), 4000);
        await loadInbox();
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsSending(false);
    }
  }

  async function handleToggleState(conv: ConversationItem) {
    const nextState = conv.state === "human" ? "bot" : "human";
    try {
      const res = await fetch("/api/admin/inbox", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conv.id,
          state: nextState,
        }),
      });
      if (res.ok) {
        await loadInbox();
      }
    } catch (err) {
      console.error("Toggle state error:", err);
    }
  }

  async function handleSimulateInbound(e: React.FormEvent) {
    e.preventDefault();
    if (!simText.trim()) return;

    setIsSimulating(true);
    try {
      const res = await fetch("/api/admin/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_inbound",
          channel: simChannel,
          sender_name: simSender,
          sender_phone: simPhone,
          message: simText.trim(),
        }),
      });

      if (res.ok) {
        setStatusMessage(`Simulated ${simChannel.toUpperCase()} message ingested into database!`);
        setTimeout(() => setStatusMessage(null), 4000);
        setShowSimModal(false);
        setSimText("");
        await loadInbox();
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  }

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header with Status Indicators & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Concierge Communications &amp; Multi-Channel Hub
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Human Inbox
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Zero-API stress WhatsApp Web (Baileys) and direct Instagram integration for <strong>+234 813 084 7299</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDeviceModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream hover:bg-cream/70 text-deep border border-line text-xs font-semibold transition-all shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-gold" />
            <span>Link Devices (QR / IG)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSimModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-gold" />
            <span>Simulate Inbound</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Live Direct Channel Status Bar */}
      <div className="p-3.5 bg-warm-white rounded-2xl border border-line shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* WhatsApp Baileys Status */}
          <button
            type="button"
            onClick={() => {
              setDeviceTab("whatsapp");
              setShowDeviceModal(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              waStatus.state === "connected"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {waStatus.state === "connected"
                ? `WhatsApp Web Linked (${waStatus.user?.phone || "+234 813 084 7299"})`
                : "WhatsApp Web Not Linked (Click to Scan QR)"}
            </span>
          </button>

          {/* Instagram Direct Status */}
          <button
            type="button"
            onClick={() => {
              setDeviceTab("instagram");
              setShowDeviceModal(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              igStatus.connected
                ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                : "bg-cream text-muted border-line hover:text-deep"
            }`}
          >
            <Instagram className="w-3.5 h-3.5 text-purple-600" />
            <span>
              {igStatus.connected
                ? `Instagram Direct Linked (@${igStatus.username})`
                : "Instagram Direct (Click to Connect)"}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadInbox}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-deep font-body self-end sm:self-auto"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Inbox Two-Pane Interface */}
      {isLoading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Loading live concierge threads...</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-12 text-center bg-warm-white rounded-2xl border border-line">
          <Inbox className="w-10 h-10 text-gold mx-auto mb-3 opacity-60" />
          <h3 className="font-display text-2xl text-deep font-medium">Inbox Clear</h3>
          <p className="font-body text-xs text-muted mt-1">
            No active conversation threads. Messages received on your WhatsApp line or Instagram will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-warm-white rounded-2xl border border-line shadow-sm overflow-hidden min-h-[620px]">
          {/* Left Pane: Conversation List with Channel Switcher */}
          <div className="border-b lg:border-b-0 lg:border-r border-line p-3 sm:p-4 space-y-3">
            {/* Channel Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-cream rounded-lg border border-line text-xs font-body">
              <button
                type="button"
                onClick={() => setChannelFilter("all")}
                className={`flex-1 py-1 rounded text-center font-semibold transition-all ${
                  channelFilter === "all" ? "bg-deep text-warm-white shadow-xs" : "text-muted hover:text-deep"
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("whatsapp")}
                className={`flex-1 py-1 rounded text-center font-semibold transition-all flex items-center justify-center gap-1 ${
                  channelFilter === "whatsapp" ? "bg-emerald-700 text-white shadow-xs" : "text-muted hover:text-deep"
                }`}
              >
                <MessageCircle className="w-3 h-3" />
                <span>WA ({conversations.filter((c) => c.channel?.toLowerCase() === "whatsapp").length})</span>
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("instagram")}
                className={`flex-1 py-1 rounded text-center font-semibold transition-all flex items-center justify-center gap-1 ${
                  channelFilter === "instagram" ? "bg-purple-700 text-white shadow-xs" : "text-muted hover:text-deep"
                }`}
              >
                <Instagram className="w-3 h-3" />
                <span>IG ({conversations.filter((c) => c.channel?.toLowerCase() === "instagram").length})</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
              {conversations
                .filter((c) => channelFilter === "all" || c.channel?.toLowerCase() === channelFilter)
                .map((conv) => {
                  const isSelected = conv.id === activeConv?.id;
                  const isInstagram = conv.channel?.toLowerCase() === "instagram";
                  const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-cream/80 border-gold shadow-xs"
                          : "bg-warm-white hover:bg-cream/40 border-line/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {isInstagram ? (
                            <Instagram className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                          <h4 className="font-display text-sm font-semibold text-deep truncate">
                            {conv.clientName}
                          </h4>
                        </div>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full font-bold ${
                            conv.state === "human"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {conv.state === "human" ? "Human" : "AI Mode"}
                        </span>
                      </div>

                      <p className="font-body text-xs text-brown/80 line-clamp-1 mb-1">
                        {lastMsg ? lastMsg.body : "No messages yet"}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                        <span>{conv.whatsapp}</span>
                        <span className="capitalize">{conv.channel}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Pane: Thread & Reply Editor */}
          {activeConv && (
            <div className="lg:col-span-2 p-5 flex flex-col justify-between space-y-5">
              {/* Thread Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    {activeConv.channel?.toLowerCase() === "instagram" ? (
                      <Instagram className="w-4 h-4 text-purple-600" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                    )}
                    <h3 className="font-display text-xl text-deep font-semibold">
                      {activeConv.clientName}
                    </h3>
                  </div>
                  <span className="font-body text-xs text-muted block mt-0.5">
                    {activeConv.channel?.toUpperCase()} · {activeConv.whatsapp}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleState(activeConv)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    activeConv.state === "human"
                      ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  {activeConv.state === "human"
                    ? "✓ Human Active (Click to Resume AI)"
                    : "Take Over Conversation"}
                </button>
              </div>

              {/* Messages Timeline */}
              <div className="space-y-3 overflow-y-auto max-h-[260px] pr-2">
                {activeConv.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.direction === "outbound" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-body leading-relaxed ${
                        m.direction === "outbound"
                          ? "bg-deep text-warm-white rounded-br-none"
                          : "bg-cream text-deep border border-line rounded-bl-none"
                      }`}
                    >
                      <p>{m.body}</p>
                    </div>
                    <span className="text-[10px] text-muted font-mono mt-1">
                      {m.direction === "outbound" ? m.sent_by || "Studio Staff" : activeConv.clientName}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Triage Card */}
              {(() => {
                const lastInbound = [...activeConv.messages].reverse().find((m) => m.direction === "inbound");
                return (
                  <div className="p-3.5 bg-cream/70 rounded-xl border border-line space-y-1 text-xs font-body">
                    <div className="flex items-center gap-1.5 text-gold font-bold uppercase tracking-wider text-[10px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Triage Analysis</span>
                    </div>
                    <p className="text-brown/90 text-xs">
                      <strong>Intent:</strong> {lastInbound?.ai_label || "General Client Inquiry"}
                    </p>
                    {lastInbound?.ai_draft && (
                      <p className="text-muted text-[11px]">
                        <strong>Suggested Direction:</strong> {lastInbound.ai_draft}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="space-y-3 pt-2 border-t border-line">
                <div className="flex items-center justify-between">
                  <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold">
                    Human Reply (Osemene&apos;s Voice)
                  </label>
                  <span className="text-[10px] font-mono text-muted flex items-center gap-1">
                    {activeConv.channel?.toLowerCase() === "instagram" ? (
                      <>
                        <Instagram className="w-3 h-3 text-purple-600" />
                        <span>Sends directly via Instagram Direct</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>Sends directly from WhatsApp Web Line</span>
                      </>
                    )}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Review or write your bespoke response here..."
                  className="w-full p-3.5 rounded-xl border border-line font-body text-xs sm:text-sm text-deep focus:border-gold focus:outline-none bg-warm-white transition-colors"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted font-body">
                    {activeConv.channel?.toLowerCase() === "instagram"
                      ? "Dispatches straight to client's Instagram DM."
                      : "Dispatches straight to client's WhatsApp on their phone."}
                  </span>
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Reply</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* DEVICE LINKING MODAL (BAILEYS QR + INSTAGRAM DIRECT) */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-warm-white w-full max-w-lg rounded-2xl border border-line shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gold" />
                <h3 className="font-display text-lg font-semibold text-deep">
                  Link Messaging Devices (Zero API Stress)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeviceModal(false)}
                className="text-muted hover:text-deep p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <button
                type="button"
                onClick={() => setDeviceTab("whatsapp")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  deviceTab === "whatsapp"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-cream text-brown hover:bg-cream/70"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Web (Baileys)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceTab("instagram")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  deviceTab === "instagram"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-cream text-brown hover:bg-cream/70"
                }`}
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram Direct</span>
              </button>
            </div>

            {/* Tab 1: WhatsApp Web via Baileys */}
            {deviceTab === "whatsapp" && (
              <div className="space-y-4">
                {waStatus.state === "connected" ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
                    <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div>
                      <h4 className="font-display text-base font-semibold text-deep">
                        WhatsApp Web Connected
                      </h4>
                      <p className="font-body text-xs text-muted">
                        Operating on {waStatus.user?.phone || "+234 813 084 7299"}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectWhatsApp}
                      disabled={waLoading}
                      className="px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-all"
                    >
                      Unlink Device
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWaMode("qr")}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${waMode === "qr" ? "bg-deep text-warm-white" : "bg-cream text-muted"}`}
                      >
                        Scan QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setWaMode("pair")}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${waMode === "pair" ? "bg-deep text-warm-white" : "bg-cream text-muted"}`}
                      >
                        Pair with Phone
                      </button>
                    </div>

                    {waMode === "qr" && (
                      <div className="flex flex-col items-center justify-center p-4 bg-cream/30 rounded-xl border border-line text-center space-y-3">
                        {waStatus.qrCodeDataUrl ? (
                          <img
                            src={waStatus.qrCodeDataUrl}
                            alt="WhatsApp Web QR Code"
                            className="w-48 h-48 object-contain rounded bg-white p-2 border border-line"
                          />
                        ) : waLoading ? (
                          <div className="p-6">
                            <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
                            <span className="text-xs text-muted mt-2 block">Generating QR code...</span>
                          </div>
                        ) : (
                          <div className="p-6 text-muted text-xs">
                            <QrCode className="w-10 h-10 mx-auto text-muted/60 mb-2" />
                            <span>Click &ldquo;Start WhatsApp Link&rdquo; to generate QR code</span>
                          </div>
                        )}
                        <ol className="text-left font-body text-xs text-muted space-y-1 list-decimal pl-4 max-w-xs">
                          <li>Open WhatsApp on <strong>+234 813 084 7299</strong></li>
                          <li>Tap <strong>Linked Devices &rarr; Link a Device</strong></li>
                          <li>Scan this QR code</li>
                        </ol>
                        <button
                          type="button"
                          onClick={handleStartWhatsApp}
                          disabled={waLoading}
                          className="px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          {waLoading ? "Connecting..." : waStatus.qrCodeDataUrl ? "Refresh QR" : "Start WhatsApp Link"}
                        </button>
                      </div>
                    )}

                    {waMode === "pair" && (
                      <div className="p-4 bg-cream/30 rounded-xl border border-line space-y-3">
                        <label className="block text-xs font-semibold text-deep">
                          WhatsApp Phone Number
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pairPhone}
                            onChange={(e) => setPairPhone(e.target.value)}
                            placeholder="+234 813 084 7299"
                            className="flex-1 px-3 py-1.5 rounded-lg border border-line bg-white text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={handlePairWhatsApp}
                            disabled={waLoading}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all"
                          >
                            Get Code
                          </button>
                        </div>
                        {waStatus.pairingCode && (
                          <div className="p-3 bg-white rounded-lg border border-gold/50 text-center">
                            <span className="text-[11px] text-muted block mb-1">Enter code on your phone:</span>
                            <span className="font-mono text-xl font-bold tracking-widest text-deep">{waStatus.pairingCode}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Instagram Direct */}
            {deviceTab === "instagram" && (
              <div className="space-y-4">
                {igStatus.connected ? (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center space-y-3">
                    <Check className="w-8 h-8 text-purple-600 mx-auto" />
                    <div>
                      <h4 className="font-display text-base font-semibold text-deep">
                        Connected to Instagram Direct
                      </h4>
                      <p className="font-body text-xs text-muted">
                        Signed in as <strong>@{igStatus.username}</strong>
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleSyncInstagram}
                        disabled={igLoading}
                        className="px-4 py-1.5 rounded-full bg-white border border-line text-xs font-semibold text-deep hover:bg-cream transition-all"
                      >
                        {igLoading ? "Syncing..." : "Sync DMs Now"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleLoginInstagram} className="space-y-3">
                    {igMessage && (
                      <div className="p-2.5 bg-cream text-xs rounded-lg border border-line text-deep">
                        {igMessage}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-deep mb-1">Instagram Username</label>
                      <input
                        type="text"
                        value={igUsername}
                        onChange={(e) => setIgUsername(e.target.value)}
                        placeholder="lamsparksphotography"
                        required
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-deep mb-1">Instagram Password</label>
                      <input
                        type="password"
                        value={igPassword}
                        onChange={(e) => setIgPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-3 py-1.5 rounded-lg border border-line bg-white text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="submit"
                        disabled={igLoading}
                        className="px-5 py-2 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm"
                      >
                        {igLoading ? "Connecting..." : "Connect Instagram Direct"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIMULATOR MODAL */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-warm-white w-full max-w-lg rounded-2xl border border-line shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <h3 className="font-display text-lg font-semibold text-deep">
                  Simulate Client Inbound Message
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-muted hover:text-deep p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateInbound} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-semibold text-deep mb-1.5">
                  Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimChannel("whatsapp")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      simChannel === "whatsapp"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                        : "bg-white border-line text-muted"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimChannel("instagram")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      simChannel === "instagram"
                        ? "bg-purple-50 border-purple-500 text-purple-800 shadow-xs"
                        : "bg-white border-line text-muted"
                    }`}
                  >
                    <Instagram className="w-4 h-4 text-purple-600" />
                    <span>Instagram Direct</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-deep mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={simSender}
                    onChange={(e) => setSimSender(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs text-deep"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-deep mb-1">
                    Phone / IG Handle
                  </label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-mono text-deep"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep mb-1">
                  Inbound Message Body
                </label>
                <textarea
                  rows={3}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border border-line bg-white text-xs text-deep focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating || !simText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm disabled:opacity-50"
                >
                  {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Fire Simulation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
