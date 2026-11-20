import React from "react";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  clientFirstName: string;
  sessionType: string;
  location?: string;
}

export function TestimonialCard({
  quote,
  clientFirstName,
  sessionType,
  location = "Abuja",
}: TestimonialCardProps) {
  return (
    <div className="reveal-up bg-warm-white/90 backdrop-blur-md rounded-2xl border border-gold/30 p-5 sm:p-7 shadow-editorial hover:shadow-floating transition-all flex flex-col justify-between">
      <div>
        <Quote className="w-5 h-5 text-gold/50 mb-3 stroke-1" />
        <p className="font-serif italic text-sm sm:text-base text-deep/90 leading-relaxed font-normal">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
      <div className="mt-5 pt-3 border-t border-line/60 flex items-center justify-between">
        <div>
          <h4 className="font-body text-xs sm:text-sm font-semibold text-deep">
            {clientFirstName}
          </h4>
          <p className="font-body text-[11px] text-muted">
            {sessionType} · {location}
          </p>
        </div>
        <span className="font-body text-[9px] uppercase tracking-wider text-gold font-medium bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
          Verified
        </span>
      </div>
    </div>
  );
}
