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

  // Background asset preloader: Warm up lightweight WebP images in background ONLY AFTER intro video has started
  useEffect(() => {
    if (videoStarted) {
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
  }, [videoStarted]);

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

  // High-reliability video playback engine with robust fallback
  useEffect(() => {
    if (stage !== "video") return;

    const vid = videoRef.current;
    if (!vid) return;

    // Strict attributes for mobile & InPrivate autoplay compliance
    vid.muted = true;
    vid.defaultMuted = true;
    vid.volume = 0;
    vid.playsInline = true;
    vid.setAttribute("muted", "");
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");

    let started = false;
    const markStarted = () => {
      if (!started) {
        started = true;
        setVideoStarted(true);
        setAutoplayBlocked(false);
      }
    };

    const tryPlay = () => {
      if (!vid) return;
      vid.muted = true;
      const p = vid.play();
      if (p !== undefined) {
        p.then(() => {
          markStarted();
        }).catch((err) => {
          console.warn("[WelcomeIntro autoplay notice]", err?.name, err?.message || err);
          if (err?.name === "NotAllowedError") {
            setAutoplayBlocked(true);
          }
        });
      }
    };

    // Attach listeners
    vid.addEventListener("playing", markStarted);
    vid.addEventListener("canplay", tryPlay);
    vid.addEventListener("loadeddata", tryPlay);

    // Initial play trigger
    tryPlay();

    // If autoplay is restricted by browser policy (e.g. InPrivate), reveal tap overlay at 1.5s
    const promptTimer = setTimeout(() => {
      if (!started && (!vid.currentTime || vid.currentTime === 0 || vid.paused)) {
        setAutoplayBlocked(true);
      }
    }, 1500);

    // Safety fallback: Give 12 seconds for remote video buffering over network
    // Visitor is never permanently stuck if network completely fails
    const safetyTimer = setTimeout(() => {
      if (!started) {
        console.warn("[WelcomeIntro] Video buffer timeout after 12s, advancing");
        handleVideoEnd();
      }
    }, 12000);

    // Global cap: maximum duration is 18s regardless
    const maxTimer = setTimeout(() => {
      handleVideoEnd();
    }, 18000);

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
          videoRef.current.muted = true;
          videoRef.current.play().then(() => {
            setVideoStarted(true);
            setAutoplayBlocked(false);
          }).catch(() => {});
        }
      }}
      onTouchEnd={() => {
        if (stage === "video" && videoRef.current && !videoStarted) {
          videoRef.current.muted = true;
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
              handleVideoEnd();
            }}
            className="w-full h-full object-cover"
          />

          {/* Buffering/Loading State before video starts */}
          {!videoStarted && !autoplayBlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none bg-black/40">
              <div className="w-12 h-12 rounded-full border-2 border-gold/20 border-t-gold animate-spin mb-4 shadow-[0_0_20px_rgba(201,169,110,0.3)]" />
              <span className="font-body text-[11px] uppercase tracking-[0.28em] text-gold/80 font-medium">
                Loading Atelier Experience...
              </span>
            </div>
          )}

          {/* Autoplay blocked touch overlay */}
          {autoplayBlocked && !videoStarted && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().then(() => {
                    setVideoStarted(true);
                    setAutoplayBlocked(false);
                  }).catch(console.warn);
                }
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().then(() => {
                    setVideoStarted(true);
                    setAutoplayBlocked(false);
                  }).catch(console.warn);
                }
              }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer p-4 text-center animate-in fade-in duration-300"
            >
              <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold/50 flex items-center justify-center text-gold mb-4 hover:scale-110 active:scale-95 transition-transform shadow-[0_0_40px_rgba(201,169,110,0.5)]">
                <svg className="w-10 h-10 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="font-body text-xs sm:text-sm uppercase tracking-[0.26em] text-warm-white font-semibold mb-1.5">
                Tap Anywhere to Play Intro
              </span>
              <span className="font-body text-[10px] text-gold/80 tracking-widest uppercase">
                LamSparks · Abuja Atelier
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
