import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Find My Booking & Shoot Prep Guide",
  description:
    "Track your confirmed LamSparks shoot date, check deposit verification, sync to Google or Apple Calendar, review wardrobe prep, or reschedule your reservation.",
  path: "/find-booking",
  image: "/og/find-booking.jpg",
  imageAlt: "Locate Your LamSparks Booking · Abuja Studio",
});

export default function FindBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
