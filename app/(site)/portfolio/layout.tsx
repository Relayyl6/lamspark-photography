import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Curated Fine Art & Event Portfolio",
  description:
    "Explore over 120 curated works across luxury Nigerian weddings, private Maitama studio portraits, diplomatic accords & milestone galas photographed by LamSparks in Abuja.",
  path: "/portfolio",
  image: "/og/portfolio.jpg",
  imageAlt: "LamSparks Curated Photography Portfolio · Abuja",
});

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
