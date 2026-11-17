"use client";

import React, { useRef, useEffect } from "react";

interface ShaderGradientProps {
  className?: string;
  opacity?: number;
  interactive?: boolean;
}

/**
 * ShaderGradient (Inspired by Shader Gradient / ruucm)
 * Smooth flowing chromatic 3D mesh gradient with luxury hues:
 * Terracotta, Champagne, Amber Gold, and Velvet Midnight.
 */
export function ShaderGradient({
  className = "",
  opacity = 0.85,
  interactive = true,
}: ShaderGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let isVisible = true;

    // Palette: Terracotta, Champagne, Amber Gold, Velvet Midnight
    const colors = [
      { r: 248, g: 244, b: 238 }, // Champagne #F8F4EE
      { r: 201, g: 169, b: 110 }, // Amber Gold #C9A96E
      { r: 168, g: 84, b: 52 },   // Terracotta #A85434
      { r: 26, g: 20, b: 16 },    // Velvet Midnight #1A1410
    ];

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5);
      width = canvas.width = Math.max(rect.width * dpr, 200);
      height = canvas.height = Math.max(rect.height * dpr, 200);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking for fluid displacement
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) / rect.width;
      targetMouseY = (e.clientY - rect.top) / rect.height;
    };

    if (interactive) {
      window.addEventListener("mousemove", onMouseMove);
    }

    // Visibility observer to save battery/GPU when not in view
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    // Multi-octave wave generators
    let time = 0;

    const render = () => {
      if (isVisible) {
        time += 0.008;

        // Smooth mouse damping
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        const w = canvas.width / (window.devicePixelRatio > 1 ? 1.5 : 1);
        const h = canvas.height / (window.devicePixelRatio > 1 ? 1.5 : 1);

        ctx.clearRect(0, 0, w, h);

        // Gradient mesh point 1: Champagne / Amber Gold top left
        const p1x = w * (0.3 + Math.sin(time * 0.7) * 0.15 + (mouseX - 0.5) * 0.2);
        const p1y = h * (0.3 + Math.cos(time * 0.9) * 0.15 + (mouseY - 0.5) * 0.2);
        const r1 = Math.max(w, h) * 0.65;
        const g1 = ctx.createRadialGradient(p1x, p1y, 0, p1x, p1y, r1);
        g1.addColorStop(0, `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, 0.95)`);
        g1.addColorStop(0.5, `rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b}, 0.55)`);
        g1.addColorStop(1, "transparent");

        // Gradient mesh point 2: Terracotta right/bottom
        const p2x = w * (0.7 + Math.cos(time * 0.8) * 0.2 - (mouseX - 0.5) * 0.2);
        const p2y = h * (0.6 + Math.sin(time * 0.6) * 0.2 - (mouseY - 0.5) * 0.2);
        const r2 = Math.max(w, h) * 0.7;
        const g2 = ctx.createRadialGradient(p2x, p2y, 0, p2x, p2y, r2);
        g2.addColorStop(0, `rgba(${colors[2].r}, ${colors[2].g}, ${colors[2].b}, 0.85)`);
        g2.addColorStop(0.6, `rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b}, 0.35)`);
        g2.addColorStop(1, "transparent");

        // Gradient mesh point 3: Amber Gold center shimmer
        const p3x = w * (0.5 + Math.sin(time * 1.1) * 0.25);
        const p3y = h * (0.5 + Math.cos(time * 0.75) * 0.25);
        const r3 = Math.max(w, h) * 0.55;
        const g3 = ctx.createRadialGradient(p3x, p3y, 0, p3x, p3y, r3);
        g3.addColorStop(0, `rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b}, 0.9)`);
        g3.addColorStop(0.5, `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, 0.4)`);
        g3.addColorStop(1, "transparent");

        // Gradient mesh point 4: Velvet Midnight depth anchor
        const p4x = w * (0.15 + Math.cos(time * 0.5) * 0.1);
        const p4y = h * (0.85 + Math.sin(time * 0.5) * 0.1);
        const r4 = Math.max(w, h) * 0.6;
        const g4 = ctx.createRadialGradient(p4x, p4y, 0, p4x, p4y, r4);
        g4.addColorStop(0, `rgba(${colors[3].r}, ${colors[3].g}, ${colors[3].b}, 0.6)`);
        g4.addColorStop(1, "transparent");

        // Composite layers
        ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = g4;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (interactive) window.removeEventListener("mousemove", onMouseMove);
      observer.disconnect();
    };
  }, [interactive]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-700 ${className}`}
      style={{ opacity }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full filter blur-[40px] scale-110"
      />
    </div>
  );
}
