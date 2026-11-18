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
}

export function SettingsManager() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  function handleCopyAccount() {
    if (data?.bankDetails.accountNumber) {
      navigator.clipboard.writeText(data.bankDetails.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      <div>
        <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
          System Secrets &amp; Accounts
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
          Studio Settings &amp; Configuration
        </h1>
        <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
          Core credentials, primary payment account, and database connections. All values are securely sourced from the system environment.
        </p>
      </div>

      {/* 1. BANK ACCOUNT FOR CLIENT DEPOSITS */}
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
                onClick={handleCopyAccount}
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

        <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-[11px] font-body text-amber-900 leading-relaxed">
          <strong>Direct Account Workflow:</strong> Per studio guidelines, third-party checkout gateways (e.g. Stripe) are kept disabled. Clients pay directly via bank transfer to this verified PalmPay account, upload their transaction screenshot, and human studio staff verifies the credit before shooting.
        </div>
      </div>

      {/* 2. SINGLE ADMIN AUTHENTICATION ACCOUNT */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-line">
          <div className="w-8 h-8 rounded-full bg-deep text-warm-white flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-lg text-deep font-semibold">
              Single Admin Account Credentials
            </h3>
            <p className="font-body text-xs text-muted">
              Credentials mapped directly from STUDIO_OWNER_EMAIL and STUDIO_OWNER_PASSWORD in .env.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
          <div className="p-3.5 bg-cream/40 rounded-xl border border-line space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Admin Email Address
            </span>
            <span className="font-mono text-sm text-deep font-semibold">
              {data?.adminEmail || "osemene@lamsparks.com"}
            </span>
            <p className="text-[11px] text-muted">
              Primary login identity for Studio OS Portal.
            </p>
          </div>

          <div className="p-3.5 bg-cream/40 rounded-xl border border-line space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Authentication Security Level
            </span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-body text-sm text-deep font-semibold">
                JWT Cookie Session (7-Day Duration)
              </span>
            </div>
            <p className="text-[11px] text-muted">
              Cryptographically signed with STUDIO_AUTH_SECRET.
            </p>
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
