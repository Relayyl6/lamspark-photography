"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

type IntroStage = "video" | "pulse_dot" | "typing" | "fading_out" | "done";

// Exact timestamp where the camera mode dial scene fades to a pure black screen
const INTRO_VIDEO_CUT_TIME = 7.75;

export function WelcomeIntro() {
  const [stage, setStage] = useState<IntroStage>("video");
  const [typedText, setTypedText] = useState("");
  const [videoStarted, setVideoStarted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined") {
        setStage("done");
        return;
      }

      const path = window.location.pathname;
      const search = window.location.search;
      const hasIntroQuery = new URLSearchParams(search).has("intro");

      // 1. Never show intro on studio admin routes or subpages
      // The cinematic intro is strictly for the root landing "/" or when ?intro is passed
      if (path.startsWith("/studio") || (path !== "/" && !hasIntroQuery)) {
        setStage("done");
        return;
      }

      // 2. Clear legacy 1-hour localStorage lockout to unblock returning users
      localStorage.removeItem("lamsparks_intro_last_seen");

      // 3. Check session seen (allows replay on ?intro, or on fresh session)
      const sessionSeen = sessionStorage.getItem("lamsparks_intro_session_seen");
      if (sessionSeen && !hasIntroQuery) {
        setStage("done");
        return;
      }
    } catch {
      setStage("done");
    }
  }, []);

  // Background asset preloader: Warm up lightweight WebP images in background while intro plays
  useEffect(() => {
    if (stage === "video") {
      try {
        const criticalAssets = [
          "/images/client/weddings_1.webp",
          "/images/client/weddings_2.webp",
          "/images/client/events_1.webp",
          "/images/client/corporate_1.webp",
          "/images/client/events_3.webp",
          "/images/client/corporate_3.webp",
          "/images/client/corporate_6.webp",
        ];

        criticalAssets.forEach((src) => {
          const img = new Image();
          img.src = src;
        });
      } catch (_) {}
    }
  }, [stage]);

  const handleVideoEnd = useCallback(() => {
    setStage("pulse_dot");
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (vid && vid.currentTime >= INTRO_VIDEO_CUT_TIME) {
      vid.pause();
      handleVideoEnd();
    }
  }, [handleVideoEnd]);

  // Frame-accurate monitor to cut video precisely on the black screen (t = 7.75s)
  useEffect(() => {
    if (stage !== "video") return;

    let animId: number;
    const checkFrame = () => {
      const vid = videoRef.current;
      if (vid && !vid.paused && vid.currentTime >= INTRO_VIDEO_CUT_TIME) {
        vid.pause();
        handleVideoEnd();
        return;
      }
      animId = requestAnimationFrame(checkFrame);
    };

    animId = requestAnimationFrame(checkFrame);
    return () => cancelAnimationFrame(animId);
  }, [stage, handleVideoEnd]);

  const startFadeOut = useCallback(() => {
    try {
      sessionStorage.setItem("lamsparks_intro_session_seen", "true");
    } catch {}
    setStage("fading_out");
    setTimeout(() => {
      setStage("done");
    }, 1000);
  }, []);

  const handleSkip = useCallback(() => {
    startFadeOut();
  }, [startFadeOut]);

  // High-reliability video playback engine with fast fallback
  useEffect(() => {
    if (stage !== "video") return;

    const vid = videoRef.current;
    if (!vid) return;

    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;

    let started = false;
    const markStarted = () => {
      if (!started) {
        started = true;
        setVideoStarted(true);
        setAutoplayBlocked(false);
      }
    };

    const tryPlay = () => {
      const p = vid.play();
      if (p !== undefined) {
        p.then(() => {
          markStarted();
        }).catch((err) => {
          console.warn("[WelcomeIntro autoplay notice]", err?.message || err);
          setAutoplayBlocked(true);
        });
      }
    };

    // Attempt instant play immediately
    tryPlay();

    vid.addEventListener("playing", markStarted);
    vid.addEventListener("canplay", tryPlay, { once: true });
    vid.addEventListener("loadeddata", tryPlay, { once: true });

    // If autoplay is restricted by browser policy, reveal tap overlay quickly (900ms)
    const promptTimer = setTimeout(() => {
      if (!started && (!vid.currentTime || vid.currentTime === 0 || vid.paused)) {
        setAutoplayBlocked(true);
      }
    }, 900);

    // Hard fallback: If playback has not produced frames after 2.0s, smoothly advance
    // so the visitor is NEVER stranded on a black screen
    const safetyTimer = setTimeout(() => {
      if (!started) {
        console.warn("[WelcomeIntro] Video stalled, advancing to signature");
        handleVideoEnd();
      }
    }, 2000);

    // Global cap: maximum duration is 9.5s regardless
    const maxTimer = setTimeout(() => {
      handleVideoEnd();
    }, 9500);

    return () => {
      clearTimeout(promptTimer);
      clearTimeout(safetyTimer);
      clearTimeout(maxTimer);
      vid.removeEventListener("playing", markStarted);
      vid.removeEventListener("canplay", tryPlay);
      vid.removeEventListener("loadeddata", tryPlay);
    };
  }, [stage, handleVideoEnd]);

  // Stage 2: Camera autofocus indicator (1.2 seconds)
  useEffect(() => {
    if (stage === "pulse_dot") {
      const timer = setTimeout(() => {
        setStage("typing");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Stage 3: Typing 'LamSparks' -> Smooth fade out into fully-loaded page
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
          setTimeout(() => {
            startFadeOut();
          }, 450);
        }
      }, 80);

      return () => clearInterval(interval);
    }
  }, [stage, startFadeOut]);

  if (stage === "done") {
    return null;
  }

  const isFading = stage === "fading_out";

  return (
    <div
      id="welcome-intro-root"
      onClick={() => {
        if (stage === "video" && videoRef.current && !videoStarted) {
          videoRef.current.play().then(() => {
            setVideoStarted(true);
            setAutoplayBlocked(false);
          }).catch(() => {});
        }
      }}
      className={`fixed inset-0 z-[100] bg-[#0E0C0A] flex items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none scale-102" : "opacity-100"
      }`}
    >
      {/* Skip button in corner */}
      {!isFading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="absolute top-6 right-6 z-30 font-body text-xs uppercase tracking-widest text-warm-white/80 hover:text-gold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          aria-label="Skip introductory video"
        >
          Skip Intro ↗
        </button>
      )}

      {/* Stage 1: Dramatic Camera Lens Intro Video */}
      {stage === "video" && (
        <div className="relative w-full h-full flex items-center justify-center animate-in fade-in duration-700">
          <video
            ref={videoRef}
            src="/videos/welcome-intro.mp4"
            autoPlay
            playsInline
            muted
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onPlaying={() => {
              setVideoStarted(true);
              setAutoplayBlocked(false);
            }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onError={(e) => {
              console.warn("[WelcomeIntro video load notice]", e);
              setStage("pulse_dot");
            }}
            className="w-full h-full object-cover"
          />

          {/* Autoplay blocked touch overlay */}
          {autoplayBlocked && !videoStarted && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold mb-3 animate-pulse">
                <svg className="w-8 h-8 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="font-body text-xs uppercase tracking-[0.24em] text-warm-white font-semibold">
                Tap Anywhere to Play Intro
              </span>
            </div>
          )}

          {/* Subtle vignette overlay */}
          <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/75 pointer-events-none" />

          {/* Lower editorial signature */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 font-body text-[11px] uppercase tracking-[0.28em] text-warm-white/70 pointer-events-none">
            <span>LamSparks</span>
            <span className="text-gold">•</span>
            <span>Abuja Atelier</span>
          </div>
        </div>
      )}

      {/* Stage 2: Camera Focus Ring & Pulsating Dot */}
      {stage === "pulse_dot" && (
        <div className="flex flex-col items-center justify-center animate-in fade-in duration-400">
          <div className="relative flex items-center justify-center">
            {/* Camera optical focus ring */}
            <span className="absolute w-20 h-20 rounded-full border border-gold/40 animate-ping"></span>
            <span className="absolute w-12 h-12 rounded-full border border-gold/60"></span>
            {/* Glowing gold focal core */}
            <span className="w-4 h-4 rounded-full bg-gold shadow-[0_0_30px_rgba(201,169,110,1)] animate-pulse"></span>
          </div>
          <span className="mt-8 font-body text-[10px] uppercase tracking-[0.32em] text-gold/90 font-medium">
            Calibrating Optics · Abuja
          </span>
        </div>
      )}

      {/* Stage 3 & 4: Typing Brand Monograph & Silky Crossfade */}
      {(stage === "typing" || stage === "fading_out") && (
        <div
          className={`flex flex-col items-center justify-center transition-all duration-1000 ${
            isFading ? "scale-105 opacity-80" : "animate-in fade-in duration-200"
          }`}
        >
          <div className="flex items-center">
            <span className="font-display text-4xl sm:text-6xl md:text-7xl font-semibold text-warm-white tracking-tight drop-shadow-[0_0_30px_rgba(201,169,110,0.4)]">
              {typedText}
            </span>
            {!isFading && (
              <span className="w-1 sm:w-1.5 h-10 sm:h-14 bg-gold ml-2 animate-pulse shadow-[0_0_15px_rgba(201,169,110,0.9)]"></span>
            )}
          </div>
          <span className="mt-4 font-body text-xs sm:text-sm tracking-[0.28em] uppercase text-gold font-medium">
            Photography · Preserving Memories
          </span>
        </div>
      )}
    </div>
  );
}
