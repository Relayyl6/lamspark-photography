"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Eye,
  UploadCloud,
  Check,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";

interface DepositItem {
  id: string;
  reference_code: string;
  client_id: string;
  client_name: string;
  whatsapp: string;
  client_email: string | null;
  session_type: string;
  stage: string;
  purpose_text: string;
  agreed_price: number;
  deposit_screenshot_url: string | null;
  payment: {
    id: string;
    amountExpected: number;
    amountRecorded: number | null;
    status: string;
    bankReference: string | null;
    aiCheck: any;
  };
  created_at: string;
}

export function DepositQueueView() {
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bankRefs, setBankRefs] = useState<Record<string, string>>({});
  const [zoomedReceiptUrl, setZoomedReceiptUrl] = useState<string | null>(null);
  const [uploadingDepositId, setUploadingDepositId] = useState<string | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function loadDeposits() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/deposits");
      const data = await res.json();
      if (data.deposits) {
        setDeposits(data.deposits);
      }
    } catch (err) {
      console.error("Failed to load deposits:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDeposits();
  }, []);

  // Upload or replace deposit receipt directly
  async function handleUploadReceipt(e: React.ChangeEvent<HTMLInputElement>, deposit: DepositItem) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDepositId(deposit.id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partition", "private");
      formData.append("enquiryId", deposit.id);
      formData.append("sessionType", deposit.session_type || "general");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const uploadedUrl = data.url || data.privateUrl || data.storageKey;

      if (uploadedUrl) {
        setDeposits((prev) =>
          prev.map((item) =>
            item.id === deposit.id
              ? { ...item, deposit_screenshot_url: uploadedUrl }
              : item
          )
        );
        setStatusMessage(`Receipt attached for Ref: ${deposit.reference_code}`);
        setTimeout(() => setStatusMessage(null), 3500);
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

  // Verify and record deposit in DB
  async function handleVerifyDeposit(deposit: DepositItem) {
    const bankRef = bankRefs[deposit.id]?.trim();
    if (!bankRef) {
      alert("Please enter the confirmed bank transaction reference from your bank statement.");
      return;
    }

    setIsProcessingId(deposit.id);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: deposit.id,
          action: "verify",
          bankReference: bankRef,
          amountRecorded: deposit.payment.amountExpected,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setDeposits((prev) => prev.filter((d) => d.id !== deposit.id));
        setStatusMessage(`Verified & recorded deposit for ${deposit.reference_code}! Confirmed booking created.`);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(data.error || "Failed to verify deposit");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      alert("Verification failed: " + err.message);
    } finally {
      setIsProcessingId(null);
    }
  }

  // Reject deposit
  async function handleRejectDeposit(deposit: DepositItem) {
    const reason = prompt("Enter reason for rejecting transfer (e.g. payment not reflecting in PalmPay statement):");
    if (!reason) return;

    setIsProcessingId(deposit.id);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: deposit.id,
          action: "reject",
          reason,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setDeposits((prev) => prev.filter((d) => d.id !== deposit.id));
        setStatusMessage(`Deposit rejected for ${deposit.reference_code}. Enquiry moved to Agreed to Price.`);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(data.error || "Failed to reject deposit");
      }
    } catch (err: any) {
      console.error("Reject error:", err);
      alert("Rejection failed: " + err.message);
    } finally {
      setIsProcessingId(null);
    }
  }

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 animate-in fade-in duration-200">
      {/* Top Header */}
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

        {/* Official Receiving Bank Account Banner */}
        <div className="mt-4 p-4 bg-gold/10 border border-gold/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="text-xs text-deep font-body space-y-0.5">
            <span className="font-semibold text-gold uppercase tracking-wider text-[11px] block">
              Official Receiving Bank Account:
            </span>
            <div className="text-sm font-semibold text-deep">
              PalmPay · Account: <strong className="font-mono tracking-wider">08130847299</strong> · Name: <strong>LEONARD OSEGHALE OSELUMHENSE</strong>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] uppercase tracking-wider bg-gold text-deep font-bold px-3 py-1 rounded-full shadow-xs">
            Active Channel
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Queue Content */}
      {isLoading ? (
        <div className="p-12 text-center flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
          <span className="font-body text-xs text-muted">Checking pending deposits from Neon DB...</span>
        </div>
      ) : deposits.length === 0 ? (
        <div className="p-12 text-center bg-warm-white rounded-2xl border border-line">
          <CheckCircle className="w-10 h-10 text-gold mx-auto mb-3 opacity-60" />
          <h3 className="font-display text-2xl text-deep font-medium">All Deposits Cleared</h3>
          <p className="font-body text-xs text-muted mt-1">
            No pending bank transfer screenshots in the queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
          {deposits.map((enq) => {
            const expected = enq.payment.amountExpected;
            const aiData = enq.payment.aiCheck;

            return (
              <div
                key={enq.id}
                className="bg-warm-white p-5 rounded-2xl border border-line shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-line/60">
                  <div>
                    <span className="font-body text-[10px] uppercase tracking-wider text-gold font-bold block">
                      Pending Verification
                    </span>
                    <h3 className="font-display text-xl text-deep font-medium">
                      Ref: {enq.reference_code}
                    </h3>
                    <span className="text-xs font-body text-brown block">
                      {enq.client_name} · {enq.session_type}
                    </span>
                  </div>
                  <span className="font-body text-xs font-bold text-deep bg-gold/15 border border-gold/30 px-3 py-1 rounded-full">
                    Expected: ₦{expected.toLocaleString()}
                  </span>
                </div>

                {/* Screenshot Inspector */}
                <div
                  onClick={() => enq.deposit_screenshot_url && setZoomedReceiptUrl(enq.deposit_screenshot_url)}
                  className="h-36 sm:h-40 w-full rounded-xl overflow-hidden border border-line bg-[#16120F]/5 relative group cursor-pointer"
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
                      <span className="text-[11px]">No receipt image uploaded yet</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-deep/85 text-warm-white px-2 py-0.5 rounded text-[10px] font-body backdrop-blur-sm">
                    Client Upload
                  </div>
                  {enq.deposit_screenshot_url && (
                    <div className="absolute bottom-2 right-2 bg-deep/85 hover:bg-deep text-warm-white px-2.5 py-1 rounded text-[10px] font-body flex items-center gap-1 backdrop-blur-sm transition-all shadow-sm">
                      <Eye className="w-3 h-3 text-gold" />
                      <span>Click to Zoom Receipt</span>
                    </div>
                  )}
                </div>

                {/* Upload / Replace Receipt Button */}
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
                      onChange={(e) => handleUploadReceipt(e, enq)}
                    />
                  </label>
                  <span className="text-[11px] text-muted">Supports JPG, PNG</span>
                </div>

                {/* Background AI Readout */}
                <div className="p-3 bg-cream/70 rounded-xl border border-line/80 text-xs font-body space-y-1.5">
                  <div className="flex items-center gap-1.5 text-gold font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Background AI Verification Status:</span>
                  </div>
                  <p className="text-brown/90 text-[11px] leading-relaxed line-clamp-2">
                    {aiData?.summary || "Automated OCR pending. Staff must verify transfer directly against bank statement."}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-line/40">
                    <span>Detected: {aiData?.extractedAmount ? `₦${Number(aiData.extractedAmount).toLocaleString()}` : `₦${expected.toLocaleString()}`}</span>
                    <span>Bank Ref: {aiData?.reference || "Pending manual entry"}</span>
                  </div>
                </div>

                {/* Human Bank Reference Form */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-body text-[11px] uppercase tracking-wider text-deep font-semibold mb-1">
                      Bank Transaction Reference (Required) <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GTB-TXN-8839210 or PalmPay Ref"
                      value={bankRefs[enq.id] || ""}
                      onChange={(e) =>
                        setBankRefs((prev) => ({ ...prev, [enq.id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-line font-body text-xs sm:text-sm text-deep focus:border-gold focus:outline-none bg-warm-white transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isProcessingId === enq.id}
                      onClick={() => handleVerifyDeposit(enq)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold py-2.5 rounded-full transition-all shadow-sm disabled:opacity-50"
                    >
                      {isProcessingId === enq.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-gold" />
                      )}
                      <span>Verify &amp; Record</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingId === enq.id}
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

      {/* High-Resolution Zoom Lightbox */}
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
