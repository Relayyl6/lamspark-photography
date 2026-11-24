"use client";

import React from "react";
import { Clock, Award, Heart, Star } from "lucide-react";

export function WhyFamiliesTrustUsSection() {
  const cards = [
    {
      icon: Clock,
      value: "10+",
      label: "Years of Empathy",
      desc: "Capturing Nigeria's most tender family and milestone stories with unhurried warmth.",
    },
    {
      icon: Award,
      value: "1,200+",
      label: "Heirloom Keepsakes",
      desc: "Museum-grade Italian leather albums & archival wooden frames delivered to homes.",
    },
    {
      icon: Heart,
      value: "100%",
      label: "Unhurried Pace",
      desc: "Only one family per half-day in our Abuja private studio. Zero rush, zero time pressure.",
    },
    {
      icon: Star,
      value: "4.98★",
      label: "Client Reverence",
      desc: "Abuja's premier word-of-mouth studio for discerning families, founders, and dignitaries.",
    },
  ];

  return (
    <section className="py-14 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E5DECF]/80">
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-2">
        <span className="font-body text-xs uppercase tracking-[0.24em] text-[#C9A96E] font-bold block">
          Why Families Trust Us
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl text-[#1A1410] font-normal">
          An Unhurried Approach to Art
        </h2>
        <p className="font-body text-xs sm:text-sm text-[#6E6359] leading-relaxed max-w-xl mx-auto">
          We reject transactional, factory-style photoshoots. Every appointment is treated as an heirloom commission.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#E5DECF] hover:border-[#C9A96E] transition-all hover:shadow-md flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white border border-[#E5DECF] group-hover:border-[#C9A96E] flex items-center justify-center text-[#C9A96E] mb-4 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-headline text-3xl sm:text-4xl text-[#1A1410] font-bold tracking-tight block">
                  {c.value}
                </span>
                <h4 className="font-serif text-base sm:text-lg text-[#1A1410] font-medium mt-1">
                  {c.label}
                </h4>
              </div>
              <p className="font-body text-xs text-[#6E6359] leading-relaxed">
                {c.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
