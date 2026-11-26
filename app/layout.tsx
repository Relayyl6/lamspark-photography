import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WelcomeIntro } from "@/components/WelcomeIntro";
import { ScrollRevealObserver } from "@/components/ScrollRevealObserver";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://lamspark-photography.onrender.com"
  ),
  title: {
    default: "LamSparks Photography | Bespoke Portrait & Event Studio | Abuja, Nigeria",
    template: "%s | LamSparks Photography Abuja",
  },
  description:
    "Unhurried, personal photography in Abuja. Capturing Moments. Preserving Memories. Sparkling Lives. Toddler, maternity, family, weddings and milestone events by Osemene.",
  keywords: [
    "LamSparks Photography",
    "Abuja photographer",
    "Maitama photography studio",
    "maternity photography Abuja",
    "toddler photoshoot Abuja",
    "luxury portraits Nigeria",
    "wedding photographer Abuja",
    "Osemene photography",
    "executive headshots Abuja",
  ],
  authors: [{ name: "Osemene / LamSparks Photography" }],
  creator: "LamSparks Photography",
  publisher: "LamSparks Photography Atelier",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "LamSparks Photography | Bespoke Portrait & Event Studio | Abuja",
    description:
      "Unhurried, personal photography in Abuja. Capturing Moments. Preserving Memories. Sparkling Lives. Toddler, maternity, family, weddings and milestone events by Osemene.",
    url: "https://lamspark-photography.onrender.com",
    siteName: "LamSparks Photography",
    images: [
      {
        url: "/images/client/weddings_1.webp",
        width: 1200,
        height: 630,
        alt: "LamSparks Photography Atelier · Abuja, Nigeria",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LamSparks Photography | Bespoke Portrait & Event Studio | Abuja",
    description:
      "Unhurried, personal photography in Abuja. Capturing Moments. Preserving Memories. Sparkling Lives.",
    images: ["/images/client/weddings_1.webp"],
    creator: "@lamsparks",
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
