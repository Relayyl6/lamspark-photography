import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locate Your Session Reservation",
  description:
    "Access your private booking details, review your confirmed time slot, verify bank deposit status, or reschedule with LamSparks Concierge.",
  openGraph: {
    title: "Locate Your Session Reservation | LamSparks Concierge",
    description:
      "Access your private booking details, review your confirmed time slot, verify bank deposit status, or reschedule with LamSparks Concierge.",
    images: [
      {
        url: "/images/client/weddings_1.webp",
        width: 1200,
        height: 630,
        alt: "LamSparks Concierge Reservation Lookup",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Locate Your Session Reservation | LamSparks Concierge",
    description: "Look up your booking reference code, review scheduled shoot dates, or reschedule.",
    images: ["/images/client/weddings_1.webp"],
  },
};

export default function FindBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
