"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  User,
  ShieldCheck,
  Copy,
  Check,
  Cloud,
  Database,
  Lock,
  ExternalLink,
  Loader2,
  MessageCircle,
  Instagram,
  Key,
  Save,
  Radio,
  QrCode,
  Smartphone,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface SettingsData {
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  adminEmail: string;
  adminName: string;
  cloudinaryConfigured: boolean;
  metaCredentials?: {
    whatsappPhoneNumberId: string;
    hasWhatsappToken: boolean;
    instagramAccountId: string;
    hasInstagramToken: boolean;
    webhookVerifyToken: string;
  };
  webhookEndpoints?: {
    whatsappWebhookUrl: string;
    instagramWebhookUrl: string;
  };
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
  lastSyncAt?: string | null;
  error?: string | null;
}

export function SettingsManager() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Baileys WhatsApp State
  const [waStatus, setWaStatus] = useState<BaileysStatus>({
    state: "disconnected",
    qrCodeDataUrl: null,
    pairingCode: null,
    user: null,
  });
  const [waLoading, setWaLoading] = useState(false);
  const [pairPhone, setPairPhone] = useState("+234 906 498 2841");
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

  // Meta Cloud API Fallback State
  const [showMetaFallback, setShowMetaFallback] = useState(false);
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [igAccountId, setIgAccountId] = useState("");
  const [igToken, setIgToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("lamsparks_secure_token_2026");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaSaveStatus, setMetaSaveStatus] = useState<string | null>(null);

  // Load Initial Settings & Statuses
  useEffect(() => {
    async function loadAll() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        setData(json);
        if (json.metaCredentials) {
          setWaPhoneId(json.metaCredentials.whatsappPhoneNumberId || "");
          setIgAccountId(json.metaCredentials.instagramAccountId || "");
          setVerifyToken(json.metaCredentials.webhookVerifyToken || "lamsparks_secure_token_2026");
        }

        // Fetch WhatsApp status
        const waRes = await fetch("/api/admin/channels/whatsapp");
        const waJson = await waRes.json();
        if (waJson.status) setWaStatus(waJson.status);

        // Fetch Instagram status
        const igRes = await fetch("/api/admin/channels/instagram");
        const igJson = await igRes.json();
        if (igJson.status) setIgStatus(igJson.status);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  // Poll WhatsApp status if in connecting / qr_ready state
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
            }
          }
        } catch {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [waStatus.state]);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    if (id === "account") {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedUrl(id);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  }

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
    setWaLoading(true);
    try {
      await fetch("/api/admin/channels/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      setWaStatus({
        state: "disconnected",
        qrCodeDataUrl: null,
        pairingCode: null,
        user: null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setWaLoading(false);
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
        setIgMessage("Successfully linked Instagram Direct!");
        setIgPassword("");
      } else {
        setIgMessage(json.error || "Login failed. Check credentials.");
      }
    } catch (err: any) {
      setIgMessage(err.message || "Network error logging into Instagram");
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
      setIgMessage(`Sync complete. ${json.newMessagesCount || 0} new messages ingested.`);
      setTimeout(() => setIgMessage(null), 4000);
    } catch (err: any) {
      setIgMessage("Error syncing Instagram DMs");
    } finally {
      setIgLoading(false);
    }
  }

  async function handleLogoutInstagram() {
    setIgLoading(true);
    try {
      await fetch("/api/admin/channels/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setIgStatus({ connected: false, username: null });
      setIgMessage("Instagram session logged out.");
    } catch {}
    finally {
      setIgLoading(false);
    }
  }

  // --- Meta Fallback ---
  async function handleSaveMetaCredentials(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingMeta(true);
    setMetaSaveStatus(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappPhoneNumberId: waPhoneId,
          whatsappAccessToken: waToken,
          instagramAccountId: igAccountId,
          instagramAccessToken: igToken,
          webhookVerifyToken: verifyToken,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setMetaSaveStatus("Meta API credentials saved to Neon DB!");
        setTimeout(() => setMetaSaveStatus(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save Meta credentials:", err);
    } finally {
      setIsSavingMeta(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
        <span className="font-body text-xs text-muted">Loading studio configurations...</span>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://lamsparks.com";

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      <div>
        <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
          Direct Channels &amp; Operating Credentials
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
          Studio Settings &amp; Integrations
        </h1>
        <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
          Zero-API stress WhatsApp Web linking (Baileys), direct Instagram connectivity, deposit bank details, and Cloudinary media storage.
        </p>
      </div>

      {/* 1. WHATSAPP WEB LINKING (BAILEYS ENGINE - ZERO META STRESS) */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-deep font-semibold">
                  WhatsApp Web Integration (Baileys Multi-Device)
                </h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Zero Meta API Stress
                </span>
              </div>
              <p className="font-body text-xs text-muted mt-0.5">
                Connects directly to WhatsApp Web. Scan QR code or enter pairing code to link <strong>+234 906 498 2841</strong> directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {waStatus.state === "connected" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Connected: {waStatus.user?.phone || "+234 906 498 2841"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{waStatus.state === "qr_ready" ? "Scan QR to Link" : "Device Unlinked"}</span>
              </span>
            )}
          </div>
        </div>

        {waStatus.state === "connected" ? (
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-display text-sm font-semibold text-deep">
                Active Session: {waStatus.user?.name || "LamSparks Studio Line"}
              </h4>
              <p className="font-body text-xs text-brown/80 mt-0.5">
                All incoming chats automatically ingest into the Human Inbox with AI triage tags. Outbound replies send straight from this number.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDisconnectWhatsApp}
              disabled={waLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-all shrink-0"
            >
              {waLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Unlink WhatsApp Device</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWaMode("qr")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  waMode === "qr"
                    ? "bg-deep text-warm-white shadow-xs"
                    : "bg-cream text-brown hover:bg-cream/70"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setWaMode("pair")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  waMode === "pair"
                    ? "bg-deep text-warm-white shadow-xs"
                    : "bg-cream text-brown hover:bg-cream/70"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Pair with Phone Number</span>
              </button>
            </div>

            {waMode === "qr" && (
              <div className="p-5 bg-cream/30 rounded-xl border border-line flex flex-col sm:flex-row items-center gap-6">
                <div className="p-3 bg-white rounded-xl border border-line shadow-sm shrink-0 flex items-center justify-center min-w-[200px] min-h-[200px]">
                  {waStatus.qrCodeDataUrl ? (
                    <img
                      src={waStatus.qrCodeDataUrl}
                      alt="WhatsApp Web QR Code"
                      className="w-48 h-48 object-contain rounded"
                    />
                  ) : waLoading ? (
                    <div className="text-center p-6 space-y-2">
                      <Loader2 className="w-7 h-7 animate-spin text-gold mx-auto" />
                      <span className="text-xs text-muted block">Generating QR code...</span>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2 text-muted">
                      <QrCode className="w-10 h-10 mx-auto text-muted/60" />
                      <span className="text-xs block">Click "Start Link" below</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 font-body text-xs text-brown">
                  <h4 className="font-display text-sm font-semibold text-deep">
                    How to Link your Phone in 10 Seconds:
                  </h4>
                  <ol className="list-decimal pl-4 space-y-1.5 text-muted leading-relaxed">
                    <li>Open WhatsApp on your phone (<strong>+234 906 498 2841</strong>).</li>
                    <li>Tap <strong>Settings &rarr; Linked Devices &rarr; Link a Device</strong>.</li>
                    <li>Point your camera at this QR code on the screen.</li>
                  </ol>
                  <p className="text-[11px] text-muted italic">
                    Once scanned, your studio inbox will instantly receive and reply to WhatsApp messages with zero Meta API stress!
                  </p>
                  <button
                    type="button"
                    onClick={handleStartWhatsApp}
                    disabled={waLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    {waLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>{waStatus.qrCodeDataUrl ? "Refresh QR Code" : "Start WhatsApp Link"}</span>
                  </button>
                </div>
              </div>
            )}

            {waMode === "pair" && (
              <div className="p-5 bg-cream/30 rounded-xl border border-line space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-deep mb-1">
                      Business Phone Number (International format)
                    </label>
                    <input
                      type="text"
                      value={pairPhone}
                      onChange={(e) => setPairPhone(e.target.value)}
                      placeholder="+234 906 498 2841"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-mono text-deep"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePairWhatsApp}
                    disabled={waLoading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-all shadow-sm h-9"
                  >
                    {waLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Request Pairing Code</span>
                  </button>
                </div>

                {waStatus.pairingCode && (
                  <div className="p-4 bg-white rounded-xl border border-gold/60 text-center space-y-2">
                    <span className="text-xs text-muted block">Enter this code on your phone:</span>
                    <div className="font-mono text-2xl font-bold tracking-widest text-deep bg-cream/60 py-2 rounded-lg inline-block px-6 border border-line">
                      {waStatus.pairingCode}
                    </div>
                    <p className="text-[11px] text-muted">
                      Open WhatsApp on your phone &rarr; <strong>Linked Devices &rarr; Link with phone number</strong> and type this code.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. INSTAGRAM DIRECT MESSAGING (FREE DIRECT CLIENT) */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-deep font-semibold">
                  Instagram Direct Client (Zero Graph API Review)
                </h3>
                <span className="text-[10px] font-mono uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                  Direct Ingestion
                </span>
              </div>
              <p className="font-body text-xs text-muted mt-0.5">
                Connect your studio Instagram (<strong>@lamsparksphotography</strong>) directly to receive and answer DMs from the inbox.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {igStatus.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Connected: @{igStatus.username}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/10 text-muted text-xs font-semibold border border-line">
                <span>Not Connected</span>
              </span>
            )}
          </div>
        </div>

        {igMessage && (
          <div className="p-3 bg-cream text-deep text-xs font-semibold rounded-xl border border-line flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>{igMessage}</span>
          </div>
        )}

        {igStatus.connected ? (
          <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-display text-sm font-semibold text-deep">
                Active Direct Session (@{igStatus.username})
              </h4>
              <p className="font-body text-xs text-brown/80 mt-0.5">
                Last synchronized: {igStatus.lastSyncAt ? new Date(igStatus.lastSyncAt).toLocaleTimeString() : "Just now"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncInstagram}
                disabled={igLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-cream border border-line text-xs font-semibold text-deep transition-all"
              >
                {igLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Sync DMs Now</span>
              </button>
              <button
                type="button"
                onClick={handleLogoutInstagram}
                disabled={igLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLoginInstagram} className="space-y-3 p-4 bg-cream/30 rounded-xl border border-line">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-deep mb-1">
                  Instagram Username
                </label>
                <input
                  type="text"
                  value={igUsername}
                  onChange={(e) => setIgUsername(e.target.value)}
                  placeholder="lamsparksphotography"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs text-deep"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-deep mb-1">
                  Instagram Password
                </label>
                <input
                  type="password"
                  value={igPassword}
                  onChange={(e) => setIgPassword(e.target.value)}
                  placeholder="Account password"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs text-deep"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted">
                Cookies are encrypted and saved locally in <code>./data/ig_session.json</code>.
              </span>
              <button
                type="submit"
                disabled={igLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm"
              >
                {igLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Instagram className="w-3.5 h-3.5 text-rose-400" />}
                <span>Connect Instagram Direct</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. OPTIONAL META CLOUD API (ENTERPRISE WEBHOOK FALLBACK) */}
      <div className="bg-warm-white p-5 rounded-2xl border border-line shadow-sm space-y-4">
        <button
          type="button"
          onClick={() => setShowMetaFallback(!showMetaFallback)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-muted" />
            <div>
              <h3 className="font-display text-sm font-semibold text-deep">
                Optional: Meta Cloud API Webhooks (Enterprise Fallback)
              </h3>
              <p className="font-body text-[11px] text-muted">
                If you already have a Meta Developer App with verified webhooks, you can also store tokens here.
              </p>
            </div>
          </div>
          {showMetaFallback ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
        </button>

        {showMetaFallback && (
          <form onSubmit={handleSaveMetaCredentials} className="space-y-4 pt-3 border-t border-line animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-cream/30 rounded-xl border border-line text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">WhatsApp Webhook Callback</span>
                <span className="truncate block bg-white px-2 py-1 rounded border border-line text-[11px]">{origin}/api/webhooks/whatsapp</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted block mb-1">Instagram Webhook Callback</span>
                <span className="truncate block bg-white px-2 py-1 rounded border border-line text-[11px]">{origin}/api/webhooks/instagram</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-deep mb-1">WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  placeholder="e.g. 102938475610293"
                  className="w-full px-3 py-1.5 rounded border border-line bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-deep mb-1">WhatsApp Permanent Access Token</label>
                <input
                  type="password"
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  placeholder={data?.metaCredentials?.hasWhatsappToken ? "•••••••• (Configured)" : "EAAG..."}
                  className="w-full px-3 py-1.5 rounded border border-line bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingMeta}
                className="px-4 py-1.5 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all"
              >
                {isSavingMeta ? "Saving..." : "Save Meta Tokens to DB"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. BANK ACCOUNT FOR CLIENT DEPOSITS */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-line">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-lg text-deep font-semibold">
              Primary Client Deposit Account (Environment Sourced)
            </h3>
            <p className="font-body text-xs text-muted">
              Display payment details shown to booking clients on the frontend.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-body">
          <div className="bg-cream/50 p-4 rounded-xl border border-line">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block mb-1">
              Bank Institution
            </span>
            <span className="font-display text-base font-semibold text-deep">
              {data?.bankDetails.bankName || "PalmPay"}
            </span>
          </div>

          <div className="bg-cream/50 p-4 rounded-xl border border-line">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block mb-1">
              Account Number
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-deep tracking-wider">
                {data?.bankDetails.accountNumber || "9064982841"}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(data?.bankDetails.accountNumber || "9064982841", "account")}
                className="text-muted hover:text-deep p-1 rounded hover:bg-cream transition-colors"
                title="Copy Account Number"
              >
                {copiedAccount ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-cream/50 p-4 rounded-xl border border-line">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block mb-1">
              Account Beneficiary
            </span>
            <span className="font-display text-sm font-semibold text-deep line-clamp-1">
              {data?.bankDetails.accountName || "LEONARD OSEGHALE OSELUMHENSE"}
            </span>
          </div>
        </div>
      </div>

      {/* 5. CLOUDINARY CONFIGURATION */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-line">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-lg text-deep font-semibold">
              Cloudinary Media Storage
            </h3>
            <p className="font-body text-xs text-muted">
              Used for client uploads, proof delivery galleries, and high-resolution photo archives.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-cream/40 rounded-xl border border-line">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                data?.cloudinaryConfigured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <div>
              <span className="font-body text-xs font-semibold text-deep block">
                {data?.cloudinaryConfigured
                  ? "Cloudinary API Connected & Operational"
                  : "Cloudinary Configuration Incomplete"}
              </span>
              <span className="font-mono text-[11px] text-muted">
                Cloud Name: drgwnkllv · Key: •••••••••••••••
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
            Live
          </span>
        </div>
      </div>
    </div>
  );
}
