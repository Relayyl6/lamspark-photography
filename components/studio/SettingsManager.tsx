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

export function SettingsManager() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Meta Form State
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [igAccountId, setIgAccountId] = useState("");
  const [igToken, setIgToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("lamsparks_secure_token_2026");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaSaveStatus, setMetaSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        setData(json);
        if (json.metaCredentials) {
          setWaPhoneId(json.metaCredentials.whatsappPhoneNumberId || "");
          setIgAccountId(json.metaCredentials.instagramAccountId || "");
          setVerifyToken(json.metaCredentials.webhookVerifyToken || "lamsparks_secure_token_2026");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

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
          System Secrets &amp; Cloud Messaging
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
          Studio Settings &amp; Configuration
        </h1>
        <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
          Core credentials, Meta WhatsApp &amp; Instagram Cloud API integrations, payment accounts, and database connections.
        </p>
      </div>

      {metaSaveStatus && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{metaSaveStatus}</span>
        </div>
      )}

      {/* 1. META WHATSAPP & INSTAGRAM CLOUD API */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg text-deep font-semibold">
                Meta WhatsApp &amp; Instagram Cloud API Credentials
              </h3>
              <p className="font-body text-xs text-muted">
                Connect your official line (<strong>+234 906 498 2841</strong>) and Instagram DM directly into Human Inbox.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-cream px-2 py-0.5 rounded border border-line text-muted">
            Neon DB Persisted
          </span>
        </div>

        {/* Webhook URLs for Meta Developer Portal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-cream/40 rounded-xl border border-line text-xs font-body">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted block mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp Callback URL
            </span>
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-line font-mono text-[11px] text-deep">
              <span className="truncate">{origin}/api/webhooks/whatsapp</span>
              <button
                type="button"
                onClick={() => handleCopy(`${origin}/api/webhooks/whatsapp`, "wa_url")}
                className="text-muted hover:text-deep ml-2"
                title="Copy URL"
              >
                {copiedUrl === "wa_url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-muted block mb-1 flex items-center gap-1">
              <Instagram className="w-3 h-3 text-rose-600" /> Instagram Callback URL
            </span>
            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-line font-mono text-[11px] text-deep">
              <span className="truncate">{origin}/api/webhooks/instagram</span>
              <button
                type="button"
                onClick={() => handleCopy(`${origin}/api/webhooks/instagram`, "ig_url")}
                className="text-muted hover:text-deep ml-2"
                title="Copy URL"
              >
                {copiedUrl === "ig_url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveMetaCredentials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 bg-cream/20 rounded-xl border border-line/70">
              <span className="text-xs font-display font-semibold text-deep flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                WhatsApp Cloud API
              </span>
              <div>
                <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  placeholder="e.g. 102938475610293"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-mono text-deep"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                  Permanent Access Token
                </label>
                <input
                  type="password"
                  value={waToken}
                  onChange={(e) => setWaToken(e.target.value)}
                  placeholder={data?.metaCredentials?.hasWhatsappToken ? "•••••••••••••••• (Token configured)" : "EAAG..."}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-mono text-deep"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-cream/20 rounded-xl border border-line/70">
              <span className="text-xs font-display font-semibold text-deep flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-rose-600" />
                Instagram Messaging API
              </span>
              <div>
                <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                  Instagram Account / Page ID
                </label>
                <input
                  type="text"
                  value={igAccountId}
                  onChange={(e) => setIgAccountId(e.target.value)}
                  placeholder="e.g. 17841400000000"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-mono text-deep"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-deep uppercase tracking-wider mb-1">
                  Page Access Token
                </label>
                <input
                  type="password"
                  value={igToken}
                  onChange={(e) => setIgToken(e.target.value)}
                  placeholder={data?.metaCredentials?.hasInstagramToken ? "•••••••••••••••• (Token configured)" : "EAAG..."}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-white text-xs font-mono text-deep"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-deep uppercase tracking-wider">
                Webhook Verify Token:
              </label>
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="px-2.5 py-1 rounded border border-line bg-white text-xs font-mono text-deep w-56"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingMeta}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-deep text-warm-white text-xs font-semibold hover:bg-gold hover:text-deep transition-all shadow-sm"
            >
              {isSavingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-gold" />}
              <span>Save Meta Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. BANK ACCOUNT FOR CLIENT DEPOSITS */}
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
            <span className="text-[10px] text-emerald-600 block mt-1 font-mono">
              ✓ Active from .env
            </span>
          </div>

          <div className="bg-cream/50 p-4 rounded-xl border border-line relative group">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block mb-1">
              Account Number
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-deep tracking-wider">
                {data?.bankDetails.accountNumber || "9064982841"}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(data?.bankDetails.accountNumber || "9064982841", "account")}
                className="p-1 rounded text-muted hover:text-deep"
                title="Copy account number"
              >
                {copiedAccount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-muted block mt-1">
              Used in WhatsApp prompts &amp; deposit card
            </span>
          </div>

          <div className="bg-cream/50 p-4 rounded-xl border border-line">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block mb-1">
              Beneficiary Name
            </span>
            <span className="font-body text-xs font-semibold text-deep leading-snug block">
              {data?.bankDetails.accountName || "LEONARD OSEGHALE OSELUMHENSE"}
            </span>
            <span className="text-[10px] text-muted block mt-1">
              Verified business / studio account
            </span>
          </div>
        </div>
      </div>

      {/* 3. CLOUD & DATABASE CONNECTIONS */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-line">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-lg text-deep font-semibold">
              Cloud Infrastructure &amp; Database State
            </h3>
            <p className="font-body text-xs text-muted">
              Neon PostgreSQL pooler, object storage, and Cloudinary CDN status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
          <div className="p-3.5 bg-cream/40 rounded-xl border border-line flex items-center justify-between">
            <div>
              <span className="font-semibold text-deep block">Neon PostgreSQL Database</span>
              <span className="text-[11px] text-muted">Primary Single Source of Truth</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
              Connected
            </span>
          </div>

          <div className="p-3.5 bg-cream/40 rounded-xl border border-line flex items-center justify-between">
            <div>
              <span className="font-semibold text-deep block">Cloudinary Media CDN</span>
              <span className="text-[11px] text-muted">Cloud: drgwnkllv</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                data?.cloudinaryConfigured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {data?.cloudinaryConfigured ? "Configured" : "Local Storage Mode"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
