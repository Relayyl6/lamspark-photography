"use client";

import React, { useEffect, useState, useRef } from "react";

type IntroStage = "check" | "video" | "pulse_dot" | "typing" | "fading_out" | "done";

export function WelcomeIntro() {
  const [stage, setStage] = useState<IntroStage>("check");
  const [typedText, setTypedText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem("lamsparks_intro_last_seen");
      if (lastSeen) {
        const timePassed = Date.now() - parseInt(lastSeen, 10);
        // 1 hour = 3600000 ms
        if (timePassed < 3600000) {
          setStage("done");
          return;
        }
      }
      setStage("video");
    } catch {
      setStage("done");
    }
  }, []);

  function handleVideoEnd() {
    setStage("pulse_dot");
  }

  function handleSkip() {
    startFadeOut();
  }

  function startFadeOut() {
    try {
      localStorage.setItem("lamsparks_intro_last_seen", Date.now().toString());
    } catch {}
    setStage("fading_out");
    setTimeout(() => {
      setStage("done");
    }, 1000);
  }

  // Stage 1: Shortened video playback (Max 4 seconds)
  useEffect(() => {
    if (stage === "video") {
      // Limit video playback to a punchy 4 seconds so it does not drag
      const timer = setTimeout(() => {
        handleVideoEnd();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Stage 2: Pulsating dot (1.5 seconds)
  useEffect(() => {
    if (stage === "pulse_dot") {
      const timer = setTimeout(() => {
        setStage("typing");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Stage 3: Typing 'LamSparks' -> Smooth fade out into page
  useEffect(() => {
    if (stage === "typing") {
      const fullText = "LamSparks";
      let currentIndex = 0;
      setTypedText("");

      const interval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setTypedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          // Pause briefly for appreciation, then initiate silky fade out
          setTimeout(() => {
            startFadeOut();
          }, 450);
        }
      }, 85);

      return () => clearInterval(interval);
    }
  }, [stage]);

  if (stage === "done" || stage === "check") {
    return null;
  }

  const isFading = stage === "fading_out";

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none scale-102" : "opacity-100"
      }`}
    >
      {/* Skip button in corner */}
      {!isFading && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-20 font-body text-xs uppercase tracking-widest text-warm-white/70 hover:text-gold bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md transition-all"
        >
          Skip Intro ↗
        </button>
      )}

      {/* Stage 1: Short Video Clip */}
      {stage === "video" && (
        <div className="relative w-full h-full flex items-center justify-center animate-in fade-in duration-500">
          <video
            ref={videoRef}
            src="/videos/welcome-intro.mp4"
            autoPlay
            playsInline
            muted
            onTimeUpdate={() => {
              if (videoRef.current && videoRef.current.currentTime >= 3.5) {
                handleVideoEnd();
              }
            }}
            onEnded={handleVideoEnd}
            onError={() => setStage("pulse_dot")}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-body text-xs text-warm-white/60 tracking-wider">
            LamSparks · Abuja
          </div>
        </div>
      )}

      {/* Stage 2: Pulsating Dot (1.5 seconds) */}
      {stage === "pulse_dot" && (
        <div className="flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            {/* Pulsating outer halo */}
            <span className="absolute w-14 h-14 rounded-full bg-gold/30 animate-ping"></span>
            {/* Glowing core dot */}
            <span className="w-5 h-5 rounded-full bg-gold shadow-[0_0_30px_rgba(202,138,4,1)] animate-pulse"></span>
          </div>
          <span className="mt-8 font-body text-[11px] uppercase tracking-[0.3em] text-gold/80">
            Abuja, Nigeria
          </span>
        </div>
      )}

      {/* Stage 3 & 4: Typing Indicator & Smooth Fade Out */}
      {(stage === "typing" || stage === "fading_out") && (
        <div
          className={`flex flex-col items-center justify-center transition-all duration-1000 ${
            isFading ? "scale-105 opacity-80" : "animate-in fade-in duration-200"
          }`}
        >
          <div className="flex items-center">
            <span className="font-display text-4xl sm:text-6xl md:text-7xl font-semibold text-warm-white tracking-tight drop-shadow-[0_0_25px_rgba(202,138,4,0.4)]">
              {typedText}
            </span>
            {!isFading && (
              <span className="w-1 sm:w-1.5 h-10 sm:h-14 bg-gold ml-2 animate-pulse shadow-[0_0_15px_rgba(202,138,4,0.9)]"></span>
            )}
          </div>
          <span className="mt-4 font-body text-xs sm:text-sm tracking-[0.26em] uppercase text-gold font-medium">
            Photography · Preserving Memories
          </span>
        </div>
      )}
    </div>
  );
}
