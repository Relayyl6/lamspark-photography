"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Signal that JS is active so reveal styles take effect safely
    document.documentElement.classList.add("js-ready");

    const SELECTOR =
      ".reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur, [data-reveal]";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.classList.add("is-revealed");
            el.setAttribute("data-revealed", "true");
            observer.unobserve(el);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.06,
      }
    );

    function scanAndObserve() {
      const elements = document.querySelectorAll(SELECTOR);
      const viewportH = window.innerHeight;

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.classList.contains("is-revealed")) return;

        // Apply custom inline delay if data-delay or data-reveal-delay is present
        const customDelay = htmlEl.getAttribute("data-delay") || htmlEl.getAttribute("data-reveal-delay");
        if (customDelay && !htmlEl.style.transitionDelay) {
          htmlEl.style.transitionDelay = `${customDelay}ms`;
        }

        // If element is already inside the viewport or near the top on load, reveal smoothly
        const rect = htmlEl.getBoundingClientRect();
        if (rect.top <= viewportH * 0.95 && rect.bottom >= 0) {
          // Slight micro-stagger for above-the-fold elements to create a natural waterfall
          const topStagger = Math.min(Math.max(0, rect.top / 8), 240);
          setTimeout(() => {
            htmlEl.classList.add("is-revealed");
            htmlEl.setAttribute("data-revealed", "true");
          }, topStagger);
        } else {
          observer.observe(htmlEl);
        }
      });
    }

    // Initial scan
    scanAndObserve();

    // Re-scan after short delays to catch late-rendering data cards (galleries, testimonials, etc.)
    const timer1 = setTimeout(scanAndObserve, 150);
    const timer2 = setTimeout(scanAndObserve, 500);

    // Watch for dynamic DOM changes (e.g. data fetching, filtering, tabs)
    const mutationObserver = new MutationObserver(() => {
      scanAndObserve();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
