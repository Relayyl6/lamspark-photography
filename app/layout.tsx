import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WelcomeIntro } from "@/components/WelcomeIntro";

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
      <body className="min-h-screen bg-cream text-deep antialiased selection:bg-gold-light selection:text-deep flex flex-col font-sans">
        <WelcomeIntro />
        {children}
      </body>
    </html>
  );
}
