import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Reserve Your Private Session Online",
  description:
    "Choose your photography collection, view live studio calendar openings in Maitama, Abuja, generate an instant itemised quote, and lock your shoot date online.",
  path: "/book",
  image: "/og/book.jpg",
  imageAlt: "Reserve Your Shoot Date · LamSparks Photography Abuja",
});

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
