"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const VIDEOS = [
  "/videos/home-reel-1.mp4",
  "/videos/home-reel-2.mp4",
  "/videos/home-reel-3.mp4",
  "/videos/home-reel-4.mp4",
];

export function BackgroundVideoLooper() {
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [index0, setIndex0] = useState(0);
  const [index1, setIndex1] = useState(1);
  const videoRef0 = useRef<HTMLVideoElement>(null);
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const isTransitioning = useRef(false);

  // Play current active video safely
  const playActiveVideo = useCallback(() => {
    const activeVideo = activeSlot === 0 ? videoRef0.current : videoRef1.current;
    if (activeVideo) {
      activeVideo.muted = true;
      activeVideo.defaultMuted = true;
      activeVideo.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, [activeSlot]);

  useEffect(() => {
    if (videoRef0.current) {
      videoRef0.current.muted = true;
      videoRef0.current.defaultMuted = true;
    }
    if (videoRef1.current) {
      videoRef1.current.muted = true;
      videoRef1.current.defaultMuted = true;
    }
    playActiveVideo();
  }, [activeSlot, playActiveVideo]);

  // Global user interaction listener to unlock autoplay if restricted by browser
  useEffect(() => {
    const handleInteraction = () => {
      const activeVideo = activeSlot === 0 ? videoRef0.current : videoRef1.current;
      if (activeVideo && activeVideo.paused) {
        activeVideo.play().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", handleInteraction, { once: true, passive: true });
    window.addEventListener("scroll", handleInteraction, { once: true, passive: true });
    window.addEventListener("keydown", handleInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [activeSlot]);

  // Seamless cross-fade transition handler
  const transitionToNextSlot = useCallback(
    (currentSlot: 0 | 1) => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;

      if (currentSlot === 0) {
        const nextIdxFor0 = (index1 + 1) % VIDEOS.length;
        if (videoRef1.current) {
          videoRef1.current.currentTime = 0;
          videoRef1.current.play().catch(() => {});
        }
        setActiveSlot(1);
        setTimeout(() => {
          setIndex0(nextIdxFor0);
          isTransitioning.current = false;
        }, 1100);
      } else {
        const nextIdxFor1 = (index0 + 1) % VIDEOS.length;
        if (videoRef0.current) {
          videoRef0.current.currentTime = 0;
          videoRef0.current.play().catch(() => {});
        }
        setActiveSlot(0);
        setTimeout(() => {
          setIndex1(nextIdxFor1);
          isTransitioning.current = false;
        }, 1100);
      }
    },
    [index0, index1]
  );

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#181411]"
      aria-hidden="true"
    >
      {/* Video Slot 0 - Ultra Sharp & Hardware Accelerated */}
      <video
        ref={videoRef0}
        src={VIDEOS[index0]}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => transitionToNextSlot(0)}
        onError={() => transitionToNextSlot(0)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (activeSlot === 0 && v.duration && v.duration - v.currentTime < 0.6) {
            transitionToNextSlot(0);
          }
        }}
        style={{
          imageRendering: "-webkit-optimize-contrast",
          transform: "translate3d(0, 0, 0)",
          willChange: "opacity, transform",
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          activeSlot === 0 ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Video Slot 1 - Seamless Cross-fade Buffer */}
      <video
        ref={videoRef1}
        src={VIDEOS[index1]}
        muted
        playsInline
        preload="auto"
        onEnded={() => transitionToNextSlot(1)}
        onError={() => transitionToNextSlot(1)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (activeSlot === 1 && v.duration && v.duration - v.currentTime < 0.6) {
            transitionToNextSlot(1);
          }
        }}
        style={{
          imageRendering: "-webkit-optimize-contrast",
          transform: "translate3d(0, 0, 0)",
          willChange: "opacity, transform",
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          activeSlot === 1 ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Crisp Atmospheric Tint (Minimal overlay for legibility without blurring the video) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />
    </div>
  );
}
