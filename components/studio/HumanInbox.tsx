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

export function HumanInbox() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Channel filter
  const [channelFilter, setChannelFilter] = useState<"all" | "whatsapp" | "instagram">("all");

  // Inbound Pipeline Simulator Modal
  const [showSimModal, setShowSimModal] = useState(false);
  const [simChannel, setSimChannel] = useState<"whatsapp" | "instagram">("whatsapp");
  const [simSender, setSimSender] = useState("Amina Bello");
  const [simPhone, setSimPhone] = useState("+234 803 123 4567");
  const [simText, setSimText] = useState("Hello! I would love to book an unhurried toddler session in Maitama studio next week.");
  const [isSimulating, setIsSimulating] = useState(false);

  async function handleSimulateInbound(e: React.FormEvent) {
    e.preventDefault();
    if (!simText.trim()) return;

    setIsSimulating(true);
    try {
      const endpoint = simChannel === "whatsapp" ? "/api/webhooks/whatsapp" : "/api/webhooks/instagram";
      let payload: any;

      if (simChannel === "whatsapp") {
        const cleanNumber = simPhone.replace(/\D/g, "") || "2348031234567";
        payload = {
          entry: [
            {
              changes: [
                {
                  value: {
                    contacts: [{ profile: { name: simSender || "Client" } }],
                    messages: [
                      {
                        from: cleanNumber,
                        text: { body: simText.trim() },
                        type: "text",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };
      } else {
        payload = {
          entry: [
            {
              messaging: [
                {
                  sender: { id: `ig_${Date.now()}` },
                  message: { text: simText.trim() },
                },
              ],
            },
          ],
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatusMessage(
          `Simulated ${simChannel.toUpperCase()} message received by webhook & saved to DB!`
        );
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

  async function loadInbox() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/inbox");
      const data = await res.json();
      if (data.conversations && data.conversations.length > 0) {
        setConversations(data.conversations);
        setSelectedConvId((prev) => prev || data.conversations[0].id);
      }
    } catch (err) {
      console.error("Failed to load inbox:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Sync draft response when active conversation changes
  useEffect(() => {
    if (activeConv) {
      const lastInbound = [...activeConv.messages].reverse().find((m) => m.direction === "inbound");
      setReplyText(lastInbound?.ai_draft || "");
    }
  }, [selectedConvId, conversations]);

  // Toggle Human Active vs Bot mode
  async function handleToggleState(conv: ConversationItem) {
    const nextState = conv.state === "human" ? "bot" : "human";
    try {
      await fetch("/api/admin/inbox", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conv.id, state: nextState }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, state: nextState } : c))
      );
    } catch (err) {
      console.error("Failed to toggle state:", err);
    }
  }

  // Send message
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newMsg: MessageItem = {
          id: `msg-${Date.now()}`,
          direction: "outbound",
          body: replyText.trim(),
          sent_by: "Osemene",
          created_at: new Date().toISOString(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, messages: [...c.messages, newMsg], state: "human" }
              : c
          )
        );

        // Open WhatsApp web with the message pre-filled
        const cleanPhone = activeConv.whatsapp.replace(/\D/g, "");
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyText.trim())}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");

        setStatusMessage(`Dispatched message to ${activeConv.clientName} (${activeConv.whatsapp})`);
        setTimeout(() => setStatusMessage(null), 4000);
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 animate-in fade-in duration-200">
      {/* Top Header with Simulator Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Concierge Communications &amp; Multi-Channel Hub
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Human Inbox
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Unified live inbox for <strong>WhatsApp (+234 906 498 2841)</strong> and <strong>Instagram Direct</strong>. No automated message leaves without human authorization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSimModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-gold" />
          <span>Simulate Test Inbound Message</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Multi-Channel Architecture Summary Box */}
      <div className="p-4 bg-warm-white rounded-2xl border border-line shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-deep font-body uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>Multi-Channel Webhooks Active</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp Cloud API
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <Instagram className="w-3 h-3 text-rose-600" /> Instagram Direct API
            </span>
          </div>
        </div>
        <p className="text-xs font-body text-brown/80 leading-relaxed">
          Inbound client messages route directly to <code className="bg-cream px-1.5 py-0.5 rounded text-[11px] font-mono">/api/webhooks/whatsapp</code> and <code className="bg-cream px-1.5 py-0.5 rounded text-[11px] font-mono">/api/webhooks/instagram</code>. Background AI evaluates intent, suggests replies, and tags VIP inquiries.
        </p>
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
            No active client conversation threads. Click &ldquo;Simulate Test Inbound Message&rdquo; to test the pipeline live.
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
                <span>WA ({conversations.filter((c) => c.channel === "whatsapp").length})</span>
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("instagram")}
                className={`flex-1 py-1 rounded text-center font-semibold transition-all flex items-center justify-center gap-1 ${
                  channelFilter === "instagram" ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-xs" : "text-muted hover:text-deep"
                }`}
              >
                <Instagram className="w-3 h-3" />
                <span>IG ({conversations.filter((c) => c.channel === "instagram").length})</span>
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
                      <span>{conv.channel}</span>
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
                  <h3 className="font-display text-xl text-deep font-semibold">
                    {activeConv.clientName}
                  </h3>
                  <span className="font-body text-xs text-muted">
                    {activeConv.channel} · {activeConv.whatsapp}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleState(activeConv)}
                  className={`font-body text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                    activeConv.state === "human"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-gold text-deep hover:bg-gold/90"
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
                  <div className="p-3.5 bg-cream/70 rounded-xl border border-line space-y-1.5 text-xs font-body">
                    <div className="flex items-center gap-1.5 text-gold font-bold uppercase tracking-wider text-[10px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Background AI Triage Analysis</span>
                    </div>
                    <p className="text-brown/90 text-xs">
                      <strong>Intent Classification:</strong> {lastInbound?.ai_label || "General Client Inquiry"}
                    </p>
                    <p className="text-muted text-[11px]">
                      <strong>Concierge Guidance:</strong> Respond in Osemene&apos;s calm, tailored voice. Reassure wardrobe flexibility and natural studio pacing.
                    </p>
                  </div>
                );
              })()}

              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="space-y-3 pt-2 border-t border-line">
                <label className="block font-body text-xs uppercase tracking-wider text-deep font-semibold">
                  Human Reply (Written in Osemene&apos;s Voice)
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Review or write your bespoke response here..."
                  className="w-full p-3.5 rounded-xl border border-line font-body text-xs sm:text-sm text-deep focus:border-gold focus:outline-none bg-warm-white transition-colors"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted font-body">
                    Clicking Send dispatches to client and opens WhatsApp.
                  </span>
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-gold" />
                    )}
                    <span>Send via WhatsApp</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Simulator Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-2xl border border-line max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-lg text-deep font-semibold">
                  Simulate Live Inbound Message
                </h3>
                <p className="font-body text-xs text-muted">
                  Triggers the actual webhook to test pipeline, AI triage &amp; database ingest.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-muted hover:text-deep"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateInbound} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimChannel("whatsapp")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      simChannel === "whatsapp"
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-cream text-brown border-line hover:border-gold"
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimChannel("instagram")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      simChannel === "instagram"
                        ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white border-purple-600 shadow-xs"
                        : "bg-cream text-brown border-line hover:border-gold"
                    }`}
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram DM</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={simSender}
                    onChange={(e) => setSimSender(e.target.value)}
                    placeholder="e.g. Amina Bello"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/30 text-xs font-body text-deep"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                    {simChannel === "whatsapp" ? "Phone Number" : "IG Handle"}
                  </label>
                  <input
                    type="text"
                    required
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    placeholder={simChannel === "whatsapp" ? "+234 803 123 4567" : "@amina_bello"}
                    className="w-full px-3 py-2 rounded-lg border border-line bg-cream/30 text-xs font-body text-deep font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                  Inbound Message Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="Type an inquiry (e.g. Can we book a luxury toddler session for Saturday?)..."
                  className="w-full p-3 rounded-lg border border-line bg-cream/30 text-xs font-body text-deep"
                />
              </div>

              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-body text-muted hover:text-deep"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="px-5 py-2 rounded-lg bg-deep text-warm-white text-xs font-body font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm"
                >
                  {isSimulating ? "Ingesting..." : "Fire Live Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
