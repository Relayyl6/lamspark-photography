import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curated Fine Art & Editorial Portfolio",
  description:
    "Explore fine art portraits, luxury Nigerian weddings, bilateral diplomatic signing ceremonies, and grand cultural galas photographed in Abuja by LamSparks Photography.",
  openGraph: {
    title: "Curated Fine Art & Editorial Portfolio | LamSparks Abuja",
    description:
      "Explore fine art portraits, luxury Nigerian weddings, bilateral diplomatic ceremonies, and grand galas photographed in Abuja by LamSparks Photography.",
    images: [
      {
        url: "/images/client/weddings_1.webp",
        width: 1200,
        height: 630,
        alt: "LamSparks Curated Photography Portfolio Abuja",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curated Fine Art & Editorial Portfolio | LamSparks Abuja",
    description: "Explore fine art portraits, luxury weddings, and executive delegations in Abuja.",
    images: ["/images/client/weddings_1.webp"],
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
