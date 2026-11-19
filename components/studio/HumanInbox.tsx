"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  MessageCircle,
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
      {/* Top Header */}
      <div>
        <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
          Concierge Communications &amp; Human-in-the-Loop Hub
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
          Human Inbox
        </h1>
        <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
          Meta WhatsApp Cloud API inbound hub with AI triage analysis. <strong>Strict luxury protocol:</strong> No message is ever sent without authorized human review.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* WhatsApp Cloud API Architecture Summary Box */}
      <div className="p-4 bg-warm-white rounded-2xl border border-line shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-deep font-body uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <span>WhatsApp Cloud API Architecture &amp; Business Integration</span>
        </div>
        <p className="text-xs font-body text-brown/80 leading-relaxed">
          Inbound client messages to <strong>+234 906 498 2841</strong> route through Meta&apos;s Webhook (<code className="bg-cream px-1.5 py-0.5 rounded text-[11px] font-mono">/api/webhooks/whatsapp</code>). Background AI classifies client sentiment, draft suggestions in Osemene&apos;s calm tone, and highlights any urgent reschedule or transfer screenshot.
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
            No active client conversation threads pending human response.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-warm-white rounded-2xl border border-line shadow-sm overflow-hidden min-h-[620px]">
          {/* Left Pane: Conversation List */}
          <div className="border-b lg:border-b-0 lg:border-r border-line p-3 sm:p-4 space-y-2">
            <span className="font-body text-[10px] uppercase tracking-wider text-muted font-bold px-2 block mb-1">
              Active Client Threads ({conversations.length})
            </span>
            <div className="space-y-1.5">
              {conversations.map((conv) => {
                const isSelected = conv.id === activeConv?.id;
                const lastMsg = conv.messages[conv.messages.length - 1];

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
                      <h4 className="font-display text-sm font-semibold text-deep truncate">
                        {conv.clientName}
                      </h4>
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
    </div>
  );
}
