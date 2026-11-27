import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Atelier Concierge & Maitama Studio Location",
  description:
    "Reach Osemene and the LamSparks Concierge desk directly on WhatsApp (+234 813 084 7299) or visit our private photography atelier in Maitama, Abuja for custom session enquiries.",
  path: "/contact",
  image: "/og/contact.jpg",
  imageAlt: "LamSparks Atelier Consultation · Maitama, Abuja",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
