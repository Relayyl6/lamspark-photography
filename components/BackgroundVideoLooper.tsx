"use client";

import React, { useState, useEffect, useRef } from "react";

export function BackgroundVideoLooper() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stringent contingency: Strictly desktop-only (>= 1024px) & respect reduced motion
  useEffect(() => {
    const checkEnvironment = () => {
      const isLarge = window.innerWidth >= 1024;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setIsDesktop(isLarge && !prefersReduced);
    };
    checkEnvironment();
    window.addEventListener("resize", checkEnvironment);
    return () => window.removeEventListener("resize", checkEnvironment);
  }, []);

  // Performance controller: Auto-pause when scrolled off or tab is in background
  useEffect(() => {
    if (!isDesktop) return;

    const handleScroll = () => {
      const video = videoRef.current;
      if (!video) return;

      // When user scrolls down past the hero (e.g. 700px), pause playback to save CPU/GPU cycles
      if (window.scrollY > 750) {
        if (!video.paused) video.pause();
      } else {
        if (video.paused) video.play().catch(() => {});
      }
    };

    const handleVisibility = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) {
        if (!video.paused) video.pause();
      } else if (window.scrollY <= 750) {
        if (video.paused) video.play().catch(() => {});
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isDesktop]);

  if (!isDesktop) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#181411] transform-gpu"
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src="/videos/home-reel-4.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-35" : "opacity-0"
        }`}
      />
      {/* Editorial Grain and Tinted Ambience without costly full-screen backdrop filters */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#181411]/60 via-[#181411]/40 to-[#181411]/80" />
    </div>
  );
}
