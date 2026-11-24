"use client";

import React, { useState } from "react";
import { StudioCalendarManager } from "@/components/studio/StudioCalendarManager";
import { ContentCalendar } from "@/components/studio/ContentCalendar";
import { Calendar, Sparkles } from "lucide-react";

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<"studio" | "social">("studio");

  return (
    <div className="space-y-6">
      {/* Calendar Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <span className="font-body text-[10px] uppercase font-bold tracking-[0.2em] text-gold block">
            Studio Operating System
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-deep font-semibold">
            {activeTab === "studio" ? "Studio Booking & Availability Calendar" : "Social Media Content Calendar"}
          </h1>
          <p className="font-body text-xs text-brown/80 mt-0.5">
            {activeTab === "studio"
              ? "Live studio slots, booking locks, blackout dates, and direct phone/walk-in reservations."
              : "Social media schedule, multi-platform publishing, and marketing campaign planner."}
          </p>
        </div>

        <div className="flex items-center p-1 bg-cream rounded-full border border-line text-xs font-body font-semibold self-start sm:self-auto shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all ${
              activeTab === "studio"
                ? "bg-deep text-warm-white shadow-xs font-bold"
                : "text-muted hover:text-deep"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Studio Slots &amp; Bookings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all ${
              activeTab === "social"
                ? "bg-deep text-warm-white shadow-xs font-bold"
                : "text-muted hover:text-deep"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Social Planner</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "studio" ? <StudioCalendarManager /> : <ContentCalendar />}
    </div>
  );
}
