"use client";

import React, { useRef, useState, useEffect } from "react";

interface LiquidLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  withWordmark?: boolean;
}

/**
 * LiquidLogo (Inspired by Paper Design Liquid Logo / paper-design)
 * An interactive chromatic metallic/liquid emblem that shimmers and reflects light,
 * reacting fluidly to cursor proximity with molten gold specular highlights.
 */
export function LiquidLogo({
  className = "",
  size = "md",
  withWordmark = false,
}: LiquidLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [time, setTime] = useState(0);

  const sizeDimensions = {
    sm: { box: 36, stroke: 1.5, text: "text-sm" },
    md: { box: 56, stroke: 2, text: "text-lg" },
    lg: { box: 84, stroke: 2.5, text: "text-2xl" },
    xl: { box: 120, stroke: 3, text: "text-4xl" },
  }[size];

  useEffect(() => {
    let animId: number;
    const animate = () => {
      setTime((t) => t + 0.025);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Fluid wave offset
  const waveX = Math.sin(time) * 12;
  const waveY = Math.cos(time * 0.8) * 12;
  const lightX = isHovered ? mousePos.x : 50 + waveX;
  const lightY = isHovered ? mousePos.y : 40 + waveY;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`inline-flex items-center gap-3 select-none cursor-pointer group ${className}`}
      aria-label="LamSparks Liquid Chromatic Emblem"
    >
      {/* Liquid Metallic Emblem Stage */}
      <div
        className="relative flex items-center justify-center rounded-2xl p-1.5 transition-transform duration-300 group-hover:scale-105"
        style={{
          width: sizeDimensions.box,
          height: sizeDimensions.box,
        }}
      >
        {/* Ambient Molten Gold Glow Backdrop */}
        <div
          className="absolute inset-0 rounded-2xl blur-lg transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(201, 169, 110, 0.55), rgba(74, 55, 40, 0.1) 60%, transparent 80%)`,
            opacity: isHovered ? 1 : 0.65,
          }}
        />

        {/* SVG Liquid Emblem with Dynamic Metallic Specular Filter */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 filter drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dynamic Liquid Gradient reflecting cursor light */}
            <linearGradient id={`liquidGrad-${size}`} x1={`${lightX}%`} y1={`${lightY}%`} x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#E8D5B0" />
              <stop offset="55%" stopColor="#C9A96E" />
              <stop offset="85%" stopColor="#8A6836" />
              <stop offset="100%" stopColor="#4A3728" />
            </linearGradient>

            <linearGradient id={`shimmerGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.2" />
            </linearGradient>

            {/* Subtle Metallic Bevel Shadow */}
            <filter id={`metallicBevel-${size}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#1A1410" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Outer Prismatic Octagonal Aperture Frame */}
          <path
            d="M 50,5 L 82,18 L 95,50 L 82,82 L 50,95 L 18,82 L 5,50 L 18,18 Z"
            stroke={`url(#liquidGrad-${size})`}
            strokeWidth={sizeDimensions.stroke * 1.5}
            strokeLinejoin="round"
            fill="rgba(26, 20, 16, 0.12)"
            filter={`url(#metallicBevel-${size})`}
          />

          {/* Liquid Aperture Blades */}
          <path
            d="M 50,22 L 68,36 L 50,60 Z"
            fill={`url(#liquidGrad-${size})`}
            opacity="0.88"
          />
          <path
            d="M 68,36 L 75,60 L 50,60 Z"
            fill={`url(#liquidGrad-${size})`}
            opacity="0.75"
          />
          <path
            d="M 75,60 L 50,78 L 40,55 Z"
            fill={`url(#liquidGrad-${size})`}
            opacity="0.92"
          />
          <path
            d="M 50,78 L 32,64 L 50,40 Z"
            fill={`url(#liquidGrad-${size})`}
            opacity="0.8"
          />
          <path
            d="M 32,64 L 25,40 L 50,40 Z"
            fill={`url(#liquidGrad-${size})`}
            opacity="0.85"
          />
          <path
            d="M 25,40 L 50,22 L 60,45 Z"
            fill={`url(#liquidGrad-${size})`}
            opacity="0.9"
          />

          {/* Center Optical Liquid Gem */}
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="#FFFFFF"
            opacity="0.95"
            style={{
              transform: `translate(${(lightX - 50) * 0.08}px, ${(lightY - 50) * 0.08}px)`,
              transition: "transform 0.15s ease-out",
            }}
          />
          <circle
            cx="50"
            cy="50"
            r="5"
            fill="#C9A96E"
          />
        </svg>
      </div>

      {/* Optional Editorial Wordmark */}
      {withWordmark && (
        <div className="flex flex-col">
          <span className={`font-display tracking-tight text-deep font-normal leading-none ${sizeDimensions.text}`}>
            LamSparks
          </span>
          <span className="font-body text-[9px] uppercase tracking-[0.28em] text-gold font-semibold mt-0.5">
            Abuja · Atelier
          </span>
        </div>
      )}
    </div>
  );
}
