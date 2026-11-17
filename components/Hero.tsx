"use client";

import React, { useState } from "react";

interface HeroProps {
  lineOne?: string;
  lineTwo?: string;
  description?: string;
  photo?: string;
  photoMobile?: string;
  objectElement?: string;
}

export function Hero({
  lineOne = "Capturing",
  lineTwo = "perfect moments.",
  description = "Unhurried, personal photography in Abuja. Giving quiet moments the reverence and space they deserve.",
  photo = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1800&q=85",
  photoMobile = "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=900&q=85",
}: HeroProps) {
  const [isCameraHovered, setIsCameraHovered] = useState(false);

  return (
    <section className="relative w-full bg-transparent pt-4 sm:pt-6 pb-6 sm:pb-12 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* Top Typography Stage */}
        <div className="relative pt-4 sm:pt-8 pb-4 sm:pb-8">
          {/* Line 1 - Huge Display, Left Aligned with Luminous High-Contrast Warm White */}
          <div className="text-left">
            <h1 className="font-display font-light text-warm-white tracking-tightest leading-[0.88] select-none text-[clamp(50px,14vw,96px)] lg:text-[150px] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              {lineOne}
            </h1>
          </div>

          {/* Description Block - Directly under line 1, high-contrast readable text */}
          <div className="mt-2 sm:mt-3 pl-1 sm:pl-2 max-w-[170px] sm:max-w-[210px] md:max-w-[240px]">
            <p className="font-body text-xs sm:text-[14px] leading-relaxed text-warm-white/90 font-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              {description}
            </p>
          </div>

          {/* Line 2 with Integrated Dynamic Camera - Positioned to the left of 'perfect moments.', tilted -22deg like reference */}
          <div className="relative flex items-end justify-end mt-2 sm:-mt-6 lg:-mt-10">
            <div className="relative inline-flex items-end justify-end">
              {/* Floating Backgroundless Camera - Shifted to the right to clear description text completely */}
              <div
                className="absolute right-[calc(100%-36px)] xs:right-[calc(100%-48px)] sm:right-[calc(100%-60px)] lg:right-[calc(100%-80px)] xl:right-[calc(100%-96px)] bottom-1 sm:bottom-2 lg:bottom-4 z-20 pointer-events-auto select-none w-[90px] xs:w-[120px] sm:w-[160px] md:w-[210px] lg:w-[250px] xl:w-[280px] cursor-pointer group translate-y-4 sm:translate-y-8 lg:translate-y-12"
                onMouseEnter={() => setIsCameraHovered(true)}
                onMouseLeave={() => setIsCameraHovered(false)}
              >
                <div
                  className="relative origin-center"
                  style={{
                    transform: "rotate(-22deg)",
                    transition: "transform 0.4s ease, filter 0.5s ease",
                    filter: isCameraHovered
                      ? "drop-shadow(0 25px 45px rgba(0,0,0,0.75)) drop-shadow(0 0 24px rgba(201,169,110,0.45))"
                      : "drop-shadow(0 20px 40px rgba(0,0,0,0.65)) drop-shadow(0 4px 18px rgba(201,169,110,0.35))",
                  }}
                >
                  <img
                    src="/images/nikon-camera.png"
                    alt="Nikon DSLR Camera — LamSparks Abuja"
                    className="w-full h-auto object-contain block"
                    loading="eager"
                  />
                  {/* Subtle Golden Lens Bloom on Hover */}
                  <div
                    className={`absolute inset-0 rounded-full pointer-events-none bg-gradient-to-tr from-transparent via-gold/15 to-white/20 blur-md transition-opacity duration-500 ${
                      isCameraHovered ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </div>

              {/* Line 2: 'perfect moments.' */}
              <span className="font-display font-light italic text-warm-white tracking-tightest leading-[0.88] select-none text-[clamp(36px,7.5vw,72px)] lg:text-[106px] xl:text-[120px] block drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                {lineTwo}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Editorial Photo Stage with Translucent Border Frame */}
        <div className="relative w-full rounded-photo-mobile sm:rounded-photo overflow-hidden shadow-floating mt-2 sm:mt-6 border border-gold/30 bg-warm-white/20 backdrop-blur-sm">
          {/* Responsive Picture: Portrait crop on mobile, Wide on desktop */}
          <picture className="block w-full h-[58vh] sm:h-[68vh] min-h-[420px] sm:min-h-[580px] relative">
            <source media="(max-width: 767px)" srcSet={photoMobile} />
            <img
              src={photo}
              alt="Editorial portrait by LamSparks Photography Abuja"
              className="w-full h-full object-cover object-center transform hover:scale-[1.01] transition-transform duration-1000 ease-out"
              loading="eager"
            />
          </picture>

          {/* Subtle editorial credit watermark */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-deep/65 backdrop-blur-md px-3.5 py-1.5 rounded-full text-warm-white text-[11px] font-body tracking-wider uppercase font-medium border border-warm-white/20">
            LamSparks · Abuja
          </div>
        </div>
      </div>
    </section>
  );
}
