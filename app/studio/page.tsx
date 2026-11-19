"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  BarChart3,
  CalendarCheck,
  Inbox,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Loader2,
  Calendar,
  Plus,
} from "lucide-react";
import { EnquiryRecord } from "@/lib/types";

export default function StudioOverviewPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/kanban").then((r) => r.json()),
      fetch("/api/admin/bookings").then((r) => r.json()),
      fetch("/api/admin/inbox").then((r) => r.json()),
    ])
      .then(([kanbanData, bookingsData, inboxData]) => {
        if (kanbanData.enquiries) setEnquiries(kanbanData.enquiries);
        if (bookingsData.bookings) setBookingsCount(bookingsData.bookings.length);
        if (Array.isArray(inboxData.conversations)) {
          setInboxCount(inboxData.conversations.length);
        }
      })
      .catch((err) => console.error("[overview fetch]", err))
      .finally(() => setLoading(false));
  }, []);

  const depositsQueue = enquiries.filter((e) => e.stage === "deposit_reported");
  const activeLeads = enquiries.filter(
    (e) => !["delivered", "closed"].includes(e.stage)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Daily Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-body text-xs uppercase tracking-label text-gold font-semibold block mb-1">
            Daily Command Center
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-deep font-normal">
            Today in the Studio
          </h1>
          <p className="font-body text-xs sm:text-sm text-brown/80 mt-1">
            Working hours: 09:00 – 18:00 (Africa/Lagos). Flags count only within studio hours.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/studio/pipeline"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-deep text-warm-white hover:bg-gold hover:text-deep text-xs font-body font-semibold transition-all shadow-sm"
          >
            <span>Open Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Status Alert Cards - 2x2 on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Deposits */}
        <div className="p-4 sm:p-5 bg-warm-white rounded-2xl border border-line shadow-xs space-y-2">
          <span className="font-body text-[10px] uppercase tracking-wider text-muted font-bold block">
            Deposits to Check
          </span>
          <div className="flex items-center justify-between">
            <span className="font-display text-3xl font-semibold text-deep">
              {loading ? "-" : depositsQueue.length}
            </span>
            <Link
              href="/studio/deposits"
              className="text-xs font-body uppercase text-gold hover:underline font-bold"
            >
              Review &rarr;
            </Link>
          </div>
          <p className="text-[11px] font-body text-muted leading-tight">
            Hard Rule #1: Manual bank verification before date lock
          </p>
        </div>

        {/* Card 2: Active Leads */}
        <div className="p-4 sm:p-5 bg-warm-white rounded-2xl border border-line shadow-xs space-y-2">
          <span className="font-body text-[10px] uppercase tracking-wider text-muted font-bold block">
            Active Leads
          </span>
          <div className="flex items-center justify-between">
            <span className="font-display text-3xl font-semibold text-deep">
              {loading ? "-" : activeLeads.length}
            </span>
            <Link
              href="/studio/pipeline"
              className="text-xs font-body uppercase text-gold hover:underline font-bold"
            >
              View &rarr;
            </Link>
          </div>
          <p className="text-[11px] font-body text-muted leading-tight">
            Pipeline swimlanes across 11 fine milestones
          </p>
        </div>

        {/* Card 3: Confirmed Shoots */}
        <div className="p-4 sm:p-5 bg-warm-white rounded-2xl border border-line shadow-xs space-y-2">
          <span className="font-body text-[10px] uppercase tracking-wider text-muted font-bold block">
            Confirmed Shoots
          </span>
          <div className="flex items-center justify-between">
            <span className="font-display text-3xl font-semibold text-deep">
              {loading ? "-" : bookingsCount}
            </span>
            <Link
              href="/studio/bookings"
              className="text-xs font-body uppercase text-gold hover:underline font-bold"
            >
              Roster &rarr;
            </Link>
          </div>
          <p className="text-[11px] font-body text-muted leading-tight">
            Maitama studio &amp; outdoor production schedule
          </p>
        </div>

        {/* Card 4: Unanswered Messages */}
        <div className="p-4 sm:p-5 bg-warm-white rounded-2xl border border-line shadow-xs space-y-2">
          <span className="font-body text-[10px] uppercase tracking-wider text-muted font-bold block">
            WhatsApp Concierge
          </span>
          <div className="flex items-center justify-between">
            <span className="font-display text-3xl font-semibold text-deep">
              {loading ? "-" : inboxCount}
            </span>
            <Link
              href="/studio/inbox"
              className="text-xs font-body uppercase text-gold hover:underline font-bold"
            >
              Inbox &rarr;
            </Link>
          </div>
          <p className="text-[11px] font-body text-muted leading-tight">
            AI triage assisted with human-in-the-loop signoff
          </p>
        </div>
      </div>

      {/* Immediate Team Actions Required */}
      <div className="bg-warm-white p-6 rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl text-deep font-normal">
            Immediate Team Actions Required
          </h3>
          <span className="text-xs font-mono text-muted">
            {depositsQueue.length} Pending Actions
          </span>
        </div>

        {depositsQueue.length === 0 ? (
          <div className="p-8 text-center border border-line/60 rounded-xl bg-cream/40">
            <CheckCircle className="w-8 h-8 text-gold mx-auto mb-2 opacity-80" />
            <h4 className="font-display text-lg text-deep">All Immediate Actions Cleared</h4>
            <p className="text-xs font-body text-muted mt-1">
              No pending deposit receipts or overdue editorial flags.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {depositsQueue.map((enq) => (
              <div
                key={enq.id}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                    <h4 className="font-body text-sm font-semibold text-deep">
                      Deposit Screenshot Reported (Ref: {enq.reference_code})
                    </h4>
                    <span className="text-xs font-mono text-muted font-bold">
                      ₦{enq.agreed_price?.toLocaleString()}
                    </span>
                  </div>
                  <p className="font-body text-xs text-brown/80 mt-1">
                    {enq.purpose_text} · Client submitted proof of bank transfer.
                  </p>
                </div>

                <Link
                  href="/studio/deposits"
                  className="inline-flex items-center gap-2 bg-deep hover:bg-brown text-warm-white font-body text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-full transition-all shrink-0"
                >
                  <span>Inspect Receipt &amp; Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
