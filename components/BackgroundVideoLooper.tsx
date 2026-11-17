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
        // Autoplay policy may require first user interaction
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
        // Prepare next video for slot 0 after slot 1 starts playing
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
        // Prepare next video for slot 1 after slot 0 starts playing
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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-cream/20"
      aria-hidden="true"
    >
      {/* Video Slot 0 */}
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
        className={`absolute inset-0 w-full h-full object-cover filter contrast-[1.08] brightness-[1.02] saturate-[1.05] transition-opacity duration-1000 ease-in-out ${
          activeSlot === 0 ? "opacity-[0.92]" : "opacity-0"
        }`}
      />

      {/* Video Slot 1 (Seamless Cross-fade Buffer) */}
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
        className={`absolute inset-0 w-full h-full object-cover filter contrast-[1.08] brightness-[1.02] saturate-[1.05] transition-opacity duration-1000 ease-in-out ${
          activeSlot === 1 ? "opacity-[0.92]" : "opacity-0"
        }`}
      />

      {/* Atmospheric Luminous Veil */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream/15 via-transparent to-cream/20 pointer-events-none" />

      {/* Subtle Warm Radial Vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle at center, transparent 50%, rgba(26, 20, 16, 0.22) 100%)",
        }}
      />

      {/* Delicate Film Grain Texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(0,0,0,0.8) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
