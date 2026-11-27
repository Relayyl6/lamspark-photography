import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WelcomeIntro } from "@/components/WelcomeIntro";
import { ScrollRevealObserver } from "@/components/ScrollRevealObserver";
import { getSiteUrl, DEFAULT_OG_IMAGE } from "@/lib/metadata";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LamSparks Photography | Bespoke Portrait & Event Studio | Abuja, Nigeria",
    template: "%s | LamSparks Photography Abuja",
  },
  description:
    "Unhurried private portrait & event photography in Maitama, Abuja by Osemene. Book Toddler, Maternity, Newborn, Family, Executive Headshots, and Traditional & White Weddings with transparent packages from ₦85,000 and live studio date booking.",
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
  authors: [{ name: "Osemene · LamSparks Photography" }],
  creator: "LamSparks Photography",
  publisher: "LamSparks Photography Atelier",
  applicationName: "LamSparks Studio",
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    title: "LamSparks Photography | Bespoke Portrait & Event Studio · Abuja",
    description:
      "Private photography atelier in Maitama, Abuja by Osemene. Toddlers, Maternity, Newborn, Families, Executive Portraits & Luxury Weddings — view packages from ₦85,000, explore portfolios, and lock your shoot date online.",
    url: siteUrl,
    siteName: "LamSparks Photography · Abuja Atelier",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "LamSparks Photography Atelier · Bespoke Portrait & Event Studio in Abuja, Nigeria",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LamSparks Photography | Bespoke Portrait & Event Studio · Abuja",
    description:
      "Private photography studio in Maitama, Abuja for Toddlers, Maternity, Families, Executive Portraits & Weddings. View pricing and book your session date online.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: "LamSparks Photography Atelier · Abuja, Nigeria",
      },
    ],
    creator: "@lamsparksphotography",
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
        {/* Structured Data for Search Engines & Rich Link Parsers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "PhotographyBusiness",
              name: "LamSparks Photography",
              description:
                "Bespoke portrait and event photography studio in Maitama, Abuja, Nigeria by Osemene — specialising in toddler, maternity, newborn, family, executive headshots, and luxury weddings.",
              url: siteUrl,
              image: `${siteUrl}${DEFAULT_OG_IMAGE}`,
              telephone: "+2348130847299",
              priceRange: "₦85,000 - ₦650,000+",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Maitama, Abuja",
                addressRegion: "FCT",
                addressCountry: "NG",
              },
              sameAs: ["https://instagram.com/lamsparksphotography"],
            }),
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
