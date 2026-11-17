"use client";

import React, { useRef, useState } from "react";

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  interactive?: boolean;
}

/**
 * LiquidGlassCard (Inspired by Liquid Glass JS / dashersw)
 * Editorial glassmorphic card with specular highlights, frosted blur backdrop,
 * refraction borders, and subtle chromatic aberration glint on hover.
 */
export function LiquidGlassCard({
  children,
  className = "",
  glowColor = "rgba(201, 169, 110, 0.22)",
  interactive = true,
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y });

    // Subtle 3D tilt calculation
    const tiltY = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
    const tiltX = -((e.clientY - rect.top) / rect.height - 0.5) * 6;
    setTilt({ x: tiltX, y: tiltY });
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-photo transition-all duration-300 ease-out ${className}`}
      style={{
        background: "rgba(253, 251, 248, 0.72)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(201, 169, 110, 0.35)",
        boxShadow: isHovered
          ? "0 24px 48px -12px rgba(26, 20, 16, 0.14), 0 0 28px 0 rgba(201, 169, 110, 0.16)"
          : "0 10px 30px -10px rgba(26, 20, 16, 0.06)",
        transform: interactive
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          : undefined,
      }}
    >
      {/* Specular Liquid Light Sheen */}
      {interactive && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle 320px at ${coords.x}% ${coords.y}%, rgba(255, 255, 255, 0.55) 0%, ${glowColor} 40%, transparent 75%)`,
          }}
        />
      )}

      {/* Chromatic Aberration & Refraction Edge Accent */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-photo transition-opacity duration-500 z-0"
        style={{
          opacity: isHovered ? 0.75 : 0.35,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(201,169,110,0.5) 30%, rgba(255,255,255,0.1) 60%, rgba(201,169,110,0.3) 100%)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />

      {/* Top Edge Prismatic Glint Line */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] z-20 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0.6,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 25%, rgba(201,169,110,0.8) 50%, rgba(255,255,255,0.9) 75%, transparent 100%)",
        }}
      />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
