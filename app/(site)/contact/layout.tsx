import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Atelier Consultation & Studio Location",
  description:
    "Connect with Osemene and the LamSparks Concierge team. Studio address in Maitama, Abuja, direct WhatsApp line, and bespoke session inquiries.",
  openGraph: {
    title: "Private Atelier Consultation & Studio Location | LamSparks Abuja",
    description:
      "Connect with Osemene and the LamSparks Concierge team. Studio address in Maitama, Abuja, direct WhatsApp line, and bespoke session inquiries.",
    images: [
      {
        url: "/images/client/corporate_1.webp",
        width: 1200,
        height: 630,
        alt: "LamSparks Atelier Consultation Maitama Abuja",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Atelier Consultation | LamSparks Abuja",
    description: "Connect with Osemene and the LamSparks Concierge team in Maitama, Abuja.",
    images: ["/images/client/corporate_1.webp"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
