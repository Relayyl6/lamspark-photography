import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reserve Your Private Session",
  description:
    "Build your tailored session estimate, choose wardrobe outfits, and hold your shoot date on Osemene's private Maitama studio calendar.",
  openGraph: {
    title: "Reserve Your Private Session | LamSparks Photography Atelier Abuja",
    description:
      "Build your tailored session estimate, choose wardrobe outfits, and hold your shoot date on Osemene's private Maitama studio calendar.",
    images: [
      {
        url: "/images/client/weddings_1.webp",
        width: 1200,
        height: 630,
        alt: "Reserve Your Session with LamSparks Photography Abuja",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reserve Your Private Session | LamSparks Atelier Abuja",
    description: "Build your personal estimate and hold your session date on Osemene's studio calendar.",
    images: ["/images/client/weddings_1.webp"],
  },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
