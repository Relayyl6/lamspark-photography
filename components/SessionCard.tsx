import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SessionTypeMeta } from "@/lib/catalog/seed";

interface SessionCardProps {
  session: SessionTypeMeta;
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <article className="group bg-warm-white/80 backdrop-blur-md rounded-photo-mobile sm:rounded-photo border border-gold/25 hover:border-gold/50 overflow-hidden shadow-editorial hover:shadow-floating transition-all duration-300 flex flex-col justify-between">
      {/* Visual Stage — Sleek, compact aspect ratio */}
      <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden bg-cream">
        <img
          src={session.heroImage}
          alt={`${session.title} - LamSparks Photography Abuja`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep/40 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />

        {/* Elegant Editorial Category Tag (Strictly no literal prices on public cards per Rule 1) */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-deep/80 backdrop-blur-sm px-2.5 py-0.5 sm:py-1 rounded-full border border-white/15">
          <span className="font-body text-[9px] sm:text-[10px] uppercase tracking-wider text-warm-white font-medium">
            {session.category === "studio" ? "Abuja Studio" : "Milestone"}
          </span>
        </div>
      </div>

      {/* Compact Editorial Content */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-1.5 sm:gap-2.5">
        <div>
          <span className="font-body text-[8px] sm:text-[10px] uppercase tracking-label text-gold font-semibold block mb-0.5">
            {session.category === "studio" ? "Studio Session" : session.category === "events" ? "Event Coverage" : "Personal Portrait"}
          </span>
          <h3 className="font-display text-xs sm:text-base lg:text-lg text-deep font-medium tracking-tight group-hover:text-gold transition-colors line-clamp-1">
            {session.title}
          </h3>
          <p className="font-body text-[10px] sm:text-xs text-brown/80 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {session.tagline}
          </p>
        </div>

        <div className="pt-1.5 sm:pt-2 border-t border-line/60 flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="font-body text-muted font-normal truncate mr-1">
            {session.standardDeliveryDays}
          </span>
          <Link
            href={`/sessions/${session.slug}`}
            className="inline-flex items-center gap-0.5 sm:gap-1 font-body text-[9px] sm:text-xs uppercase tracking-wider text-deep group-hover:text-gold transition-colors font-semibold shrink-0"
          >
            <span>Explore</span>
            <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
}
