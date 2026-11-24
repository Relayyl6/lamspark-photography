import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WelcomeIntro } from "@/components/WelcomeIntro";
import { ScrollRevealObserver } from "@/components/ScrollRevealObserver";

export const metadata: Metadata = {
  title: "LamSparks Photography | Bespoke Portrait & Event Studio | Abuja, Nigeria",
  description:
    "Unhurried, personal photography in Abuja. Capturing Moments. Preserving Memories. Sparkling Lives. Toddler, maternity, family, weddings and milestone events by Osemene.",
  keywords: [
    "LamSparks Photography",
    "Abuja photographer",
    "maternity photography Abuja",
    "toddler photoshoot Abuja",
    "luxury portraits Nigeria",
    "wedding photographer Abuja",
    "Osemene photography",
  ],
  authors: [{ name: "Osemene / LamSparks Photography" }],
  openGraph: {
    title: "LamSparks Photography | Abuja, Nigeria",
    description: "Capturing Moments. Preserving Memories. Sparkling Lives.",
    url: "https://lamsparks.com",
    siteName: "LamSparks Photography",
    locale: "en_NG",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F8F4EE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fast-path critical image and intro video asset preloading */}
        <link rel="preload" href="/videos/welcome-intro.mp4" as="video" type="video/mp4" />
        <link rel="preload" href="/images/client/corporate_1.webp" as="image" type="image/webp" fetchPriority="high" />
        <link rel="preload" href="/images/client/weddings_1.webp" as="image" type="image/webp" />
        <link rel="preload" href="/images/client/weddings_2.webp" as="image" type="image/webp" />
        <link rel="preload" href="/images/client/events_1.webp" as="image" type="image/webp" />
        <link rel="preload" href="/images/client/events_3.webp" as="image" type="image/webp" />
        <link rel="preload" href="/images/client/corporate_3.webp" as="image" type="image/webp" />
        <link rel="preload" href="/images/client/corporate_6.webp" as="image" type="image/webp" />

        {/* Synchronous script: Prevent any flash on subpages or returning sessions before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = window.location.pathname;
                  var s = window.location.search;
                  var hasIntro = s.indexOf('intro') !== -1;
                  if (p.startsWith('/studio') || (p !== '/' && !hasIntro) || (sessionStorage.getItem('lamsparks_intro_session_seen') && !hasIntro)) {
                    document.documentElement.classList.add('intro-skip');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-cream text-deep antialiased selection:bg-gold-light selection:text-deep flex flex-col font-sans">
        <ScrollRevealObserver />
        <WelcomeIntro />
        {children}
      </body>
    </html>
  );
}
